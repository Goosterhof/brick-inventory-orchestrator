<?php

declare(strict_types = 1);

namespace Tools\CaptainHook;

use CaptainHook\App\Config;
use CaptainHook\App\Console\IO;
use CaptainHook\App\Exception\ActionFailed;
use CaptainHook\App\Hook\Action;
use CaptainHook\App\Hook\Restriction;
use CaptainHook\App\Hooks;
use SebastianFeldmann\Git\Repository;

use function count;
use function in_array;
use function is_string;
use function sprintf;

final class PrePushPermitGate implements Action
{
    public const int FILE_THRESHOLD = 20;

    public const int LINE_THRESHOLD = 500;

    public const string PERMIT_DIRECTORY = '.claude/records/work-orders';

    public const string TEMPLATE_FILENAME = '.work-order-template.md';

    public const string COMPARE_BASE = 'origin/main';

    public const string EXEMPT_BRANCH = 'main';

    /** @var list<string> */
    public const array ACTIVE_STATUSES = ['Open', 'In Progress'];

    private const int DATE_PREFIX_LENGTH = 11;

    public static function getRestriction(): Restriction
    {
        return Restriction::fromArray([Hooks::PRE_PUSH]);
    }

    public function execute(Config $config, IO $io, Repository $repository, Config\Action $action): void
    {
        $branch = $repository->getInfoOperator()->getCurrentBranch();

        if ($branch === self::EXEMPT_BRANCH) {
            $io->write(['<info>OK</info> PrePushPermitGate: on main, skipping permit verification.'], true, IO::VERBOSE);

            return;
        }

        $stats = $this->computeDiffStats($repository->getRoot());

        if (self::isUnderThreshold($stats['files'], $stats['lines'])) {
            $io->write(
                [sprintf(
                    '<info>OK</info> PrePushPermitGate: under threshold (%d files, %d lines) — no permit required.',
                    $stats['files'],
                    $stats['lines'],
                )],
                true,
                IO::VERBOSE,
            );

            return;
        }

        $branchSlug = self::branchSlug($branch);
        $permits = self::scanPermits($repository->getRoot() . '/' . self::PERMIT_DIRECTORY);
        $matchedFilename = self::findMatchingPermit($permits, $branchSlug);

        if ($matchedFilename !== null) {
            $io->write(
                [sprintf(
                    '<info>OK</info> PrePushPermitGate: matched open permit %s for branch slug "%s" (%d files, %d lines).',
                    $matchedFilename,
                    $branchSlug,
                    $stats['files'],
                    $stats['lines'],
                )],
                true,
            );

            return;
        }

        throw new ActionFailed(self::failureMessage($branch, $branchSlug, $stats, $permits));
    }

    public static function isUnderThreshold(int $files, int $lines): bool
    {
        return $files <= self::FILE_THRESHOLD && $lines <= self::LINE_THRESHOLD;
    }

    public static function branchSlug(string $branch): string
    {
        $lastSeparator = mb_strrpos($branch, '/');
        $tail = $lastSeparator === false ? $branch : mb_substr($branch, $lastSeparator + 1);

        return mb_strtolower($tail);
    }

    public static function permitSlugFromFilename(string $filename): ?string
    {
        if ($filename === self::TEMPLATE_FILENAME) {
            return null;
        }

        if (!str_ends_with($filename, '.md')) {
            return null;
        }

        if (mb_strlen($filename) <= self::DATE_PREFIX_LENGTH + 3) {
            return null;
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}-/', $filename) !== 1) {
            return null;
        }

        $withoutDate = mb_substr($filename, self::DATE_PREFIX_LENGTH);
        $withoutExtension = mb_substr($withoutDate, 0, -3);

        return mb_strtolower($withoutExtension);
    }

    public static function parseStatus(string $contents): ?string
    {
        if (preg_match('/^\*\*Status:\*\*\s*(.+?)\s*$/m', $contents, $matches) !== 1) {
            return null;
        }

        return mb_trim($matches[1]);
    }

    /**
     * @param list<array{filename: string, slug: string, status: ?string}> $permits
     */
    public static function findMatchingPermit(array $permits, string $branchSlug): ?string
    {
        foreach ($permits as $permit) {
            if ($permit['slug'] !== $branchSlug) {
                continue;
            }

            if ($permit['status'] === null) {
                continue;
            }

            if (!in_array($permit['status'], self::ACTIVE_STATUSES, true)) {
                continue;
            }

            return $permit['filename'];
        }

        return null;
    }

    /**
     * @param array{files: int, lines: int}                                $stats
     * @param list<array{filename: string, slug: string, status: ?string}> $permits
     */
    public static function failureMessage(string $branch, string $branchSlug, array $stats, array $permits): string
    {
        $sameSlugButInactive = array_values(array_filter(
            $permits,
            static fn(array $permit): bool => $permit['slug'] === $branchSlug,
        ));

        $lines = [
            'Pre-push permit verification failed.',
            '',
            sprintf('Branch:       %s', $branch),
            sprintf('Branch slug:  %s', $branchSlug),
            sprintf('Threshold:    %d files changed, %d lines changed (limit: %d files OR %d lines).', $stats['files'], $stats['lines'], self::FILE_THRESHOLD, self::LINE_THRESHOLD),
            '',
            sprintf('Expected: an open permit at %s/<date>-%s.md with Status: Open or In Progress.', self::PERMIT_DIRECTORY, $branchSlug),
            sprintf('Template: %s/%s', self::PERMIT_DIRECTORY, self::TEMPLATE_FILENAME),
            '',
        ];

        if ($sameSlugButInactive !== []) {
            $lines[] = 'Found permit(s) with matching slug but inactive status:';
            foreach ($sameSlugButInactive as $permit) {
                $lines[] = sprintf('  - %s (Status: %s)', $permit['filename'], $permit['status'] ?? 'missing');
            }
            $lines[] = '';
        }

        $lines[] = 'To bypass for a documented exception, push with --no-verify and record the bypass';
        $lines[] = 'in the corresponding shift log\'s Decisions Made section with explicit Director sign-off.';

        return implode("\n", $lines);
    }

    public static function parseShortstat(string $output): int
    {
        $insertions = 0;
        $deletions = 0;

        if (preg_match('/(\d+) insertion/', $output, $matches) === 1) {
            $insertions = (int) $matches[1];
        }

        if (preg_match('/(\d+) deletion/', $output, $matches) === 1) {
            $deletions = (int) $matches[1];
        }

        return $insertions + $deletions;
    }

    /**
     * @return list<array{filename: string, slug: string, status: ?string}>
     */
    public static function scanPermits(string $permitDirectory): array
    {
        if (!is_dir($permitDirectory)) {
            return [];
        }

        $entries = scandir($permitDirectory);

        if ($entries === false) {
            return [];
        }

        $permits = [];
        foreach ($entries as $entry) {
            $slug = self::permitSlugFromFilename($entry);
            if ($slug === null) {
                continue;
            }

            $contents = @file_get_contents($permitDirectory . '/' . $entry);
            $status = $contents === false ? null : self::parseStatus($contents);

            $permits[] = [
                'filename' => $entry,
                'slug' => $slug,
                'status' => $status,
            ];
        }

        return $permits;
    }

    /**
     * @return array{files: int, lines: int}
     */
    private function computeDiffStats(string $repositoryRoot): array
    {
        $files = $this->countChangedFiles($repositoryRoot);
        $lines = $this->countChangedLines($repositoryRoot);

        return ['files' => $files, 'lines' => $lines];
    }

    private function countChangedFiles(string $repositoryRoot): int
    {
        $output = $this->runGit($repositoryRoot, ['diff', '--name-only', self::COMPARE_BASE . '...HEAD']);

        if ($output === '') {
            return 0;
        }

        return count(array_filter(explode("\n", $output), static fn(string $line): bool => $line !== ''));
    }

    private function countChangedLines(string $repositoryRoot): int
    {
        $output = $this->runGit($repositoryRoot, ['diff', '--shortstat', self::COMPARE_BASE . '...HEAD']);

        return self::parseShortstat($output);
    }

    /**
     * @param list<string> $arguments
     */
    private function runGit(string $repositoryRoot, array $arguments): string
    {
        $command = array_merge(['git', '-C', $repositoryRoot], $arguments);
        $escaped = implode(' ', array_map(escapeshellarg(...), $command));

        $output = shell_exec($escaped . ' 2>/dev/null');

        return is_string($output) ? mb_trim($output) : '';
    }
}
