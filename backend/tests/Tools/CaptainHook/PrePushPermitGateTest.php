<?php

declare(strict_types = 1);

use Tools\CaptainHook\PrePushPermitGate;

covers(PrePushPermitGate::class);

describe('PrePushPermitGate::isUnderThreshold', function(): void {
    it('should passes when both files and lines are within the limits', function(): void {
        expect(PrePushPermitGate::isUnderThreshold(10, 100))->toBeTrue();
    });

    it('should passes at the exact threshold boundary', function(): void {
        expect(PrePushPermitGate::isUnderThreshold(20, 500))->toBeTrue();
    });

    it('should fails when the file count exceeds the limit', function(): void {
        expect(PrePushPermitGate::isUnderThreshold(25, 100))->toBeFalse();
    });

    it('should fails when the line count exceeds the limit', function(): void {
        expect(PrePushPermitGate::isUnderThreshold(10, 600))->toBeFalse();
    });

    it('should fails when both dimensions exceed the limits', function(): void {
        expect(PrePushPermitGate::isUnderThreshold(50, 1_000))->toBeFalse();
    });
});

describe('PrePushPermitGate::branchSlug', function(): void {
    it('should returns the branch name unchanged when there is no slash', function(): void {
        expect(PrePushPermitGate::branchSlug('foo-bar'))->toBe('foo-bar');
    });

    it('should strips a single feat/ prefix', function(): void {
        expect(PrePushPermitGate::branchSlug('feat/foo-bar'))->toBe('foo-bar');
    });

    it('should strips a Goosterhof/feat/ prefix and keeps only the tail', function(): void {
        expect(PrePushPermitGate::branchSlug('Goosterhof/feat/foo-bar'))->toBe('foo-bar');
    });

    it('should lowercases the resulting slug', function(): void {
        expect(PrePushPermitGate::branchSlug('feat/Foo-Bar'))->toBe('foo-bar');
    });
});

describe('PrePushPermitGate::permitSlugFromFilename', function(): void {
    it('should extracts the slug after the date prefix and strips the .md suffix', function(): void {
        expect(PrePushPermitGate::permitSlugFromFilename('2026-05-05-foo-bar.md'))->toBe('foo-bar');
    });

    it('should returns null for the shipping order template', function(): void {
        expect(PrePushPermitGate::permitSlugFromFilename('.shipping-order-template.md'))->toBeNull();
    });

    it('should returns null for non-markdown files', function(): void {
        expect(PrePushPermitGate::permitSlugFromFilename('2026-05-05-foo.txt'))->toBeNull();
    });

    it('should returns null for files without a date prefix', function(): void {
        expect(PrePushPermitGate::permitSlugFromFilename('not-dated.md'))->toBeNull();
    });

    it('should lowercases the resulting slug', function(): void {
        expect(PrePushPermitGate::permitSlugFromFilename('2026-05-05-Foo-Bar.md'))->toBe('foo-bar');
    });
});

describe('PrePushPermitGate::parseStatus', function(): void {
    it('should extracts a status value from a permit body', function(): void {
        $contents = "# Some Order\n\n**Status:** Open\n";

        expect(PrePushPermitGate::parseStatus($contents))->toBe('Open');
    });

    it('should handles multi-word statuses', function(): void {
        $contents = "# Some Order\n\n**Status:** In Progress\n";

        expect(PrePushPermitGate::parseStatus($contents))->toBe('In Progress');
    });

    it('should returns null when no Status line is present', function(): void {
        expect(PrePushPermitGate::parseStatus('# Some Order without status'))->toBeNull();
    });
});

describe('PrePushPermitGate::parseShortstat', function(): void {
    it('should returns 0 for empty diff output', function(): void {
        expect(PrePushPermitGate::parseShortstat(''))->toBe(0);
    });

    it('should sums insertions and deletions', function(): void {
        $line = ' 7 files changed, 120 insertions(+), 45 deletions(-)';

        expect(PrePushPermitGate::parseShortstat($line))->toBe(165);
    });

    it('should handles insertions-only output', function(): void {
        expect(PrePushPermitGate::parseShortstat(' 1 file changed, 10 insertions(+)'))->toBe(10);
    });

    it('should handles deletions-only output', function(): void {
        expect(PrePushPermitGate::parseShortstat(' 1 file changed, 8 deletions(-)'))->toBe(8);
    });
});

describe('PrePushPermitGate::findMatchingPermit', function(): void {
    it('should returns the filename of an Open permit whose slug matches', function(): void {
        $permits = [
            ['filename' => '2026-05-05-foo-bar.md', 'slug' => 'foo-bar', 'status' => 'Open'],
        ];

        expect(PrePushPermitGate::findMatchingPermit($permits, 'foo-bar'))->toBe('2026-05-05-foo-bar.md');
    });

    it('should returns the filename of an In Progress permit whose slug matches', function(): void {
        $permits = [
            ['filename' => '2026-05-05-foo-bar.md', 'slug' => 'foo-bar', 'status' => 'In Progress'],
        ];

        expect(PrePushPermitGate::findMatchingPermit($permits, 'foo-bar'))->toBe('2026-05-05-foo-bar.md');
    });

    it('should rejects a slug-matching permit whose status is Completed', function(): void {
        $permits = [
            ['filename' => '2026-05-05-foo-bar.md', 'slug' => 'foo-bar', 'status' => 'Completed'],
        ];

        expect(PrePushPermitGate::findMatchingPermit($permits, 'foo-bar'))->toBeNull();
    });

    it('should rejects a slug-matching permit whose status is Cancelled', function(): void {
        $permits = [
            ['filename' => '2026-05-05-foo-bar.md', 'slug' => 'foo-bar', 'status' => 'Cancelled'],
        ];

        expect(PrePushPermitGate::findMatchingPermit($permits, 'foo-bar'))->toBeNull();
    });

    it('should returns null when no permit slug matches the branch slug', function(): void {
        $permits = [
            ['filename' => '2026-05-05-other.md', 'slug' => 'other', 'status' => 'Open'],
        ];

        expect(PrePushPermitGate::findMatchingPermit($permits, 'foo-bar'))->toBeNull();
    });

    it('should finds the open match among multiple permits', function(): void {
        $permits = [
            ['filename' => '2026-05-04-other.md', 'slug' => 'other', 'status' => 'Open'],
            ['filename' => '2026-05-05-foo-bar.md', 'slug' => 'foo-bar', 'status' => 'Open'],
            ['filename' => '2026-05-03-third.md', 'slug' => 'third', 'status' => 'Completed'],
        ];

        expect(PrePushPermitGate::findMatchingPermit($permits, 'foo-bar'))->toBe('2026-05-05-foo-bar.md');
    });

    it('should does NOT match when the permit slug is a prefix of the branch slug', function(): void {
        $permits = [
            ['filename' => '2026-05-05-audit-remediation-5.md', 'slug' => 'audit-remediation-5', 'status' => 'Open'],
        ];

        expect(PrePushPermitGate::findMatchingPermit($permits, 'audit-remediation-5-doc-hygiene'))->toBeNull();
    });

    it('should does NOT match when the branch slug is a prefix of the permit slug', function(): void {
        $permits = [
            ['filename' => '2026-05-05-audit-remediation-5-doc-hygiene.md', 'slug' => 'audit-remediation-5-doc-hygiene', 'status' => 'Open'],
        ];

        expect(PrePushPermitGate::findMatchingPermit($permits, 'audit-remediation-5'))->toBeNull();
    });

    it('should skips permits with a missing Status line', function(): void {
        $permits = [
            ['filename' => '2026-05-05-foo-bar.md', 'slug' => 'foo-bar', 'status' => null],
        ];

        expect(PrePushPermitGate::findMatchingPermit($permits, 'foo-bar'))->toBeNull();
    });
});

describe('PrePushPermitGate::scanPermits', function(): void {
    beforeEach(function(): void {
        $this->permitDir = sys_get_temp_dir() . '/permit-gate-' . uniqid();
        mkdir($this->permitDir);
    });

    afterEach(function(): void {
        foreach (scandir($this->permitDir) ?: [] as $entry) {
            if ($entry === '.') {
                continue;
            }

            if ($entry === '..') {
                continue;
            }

            unlink($this->permitDir . '/' . $entry);
        }

        rmdir($this->permitDir);
    });

    it('should returns an empty list when the directory does not exist', function(): void {
        expect(PrePushPermitGate::scanPermits('/does/not/exist'))->toBe([]);
    });

    it('should returns an empty list when the directory is empty', function(): void {
        expect(PrePushPermitGate::scanPermits($this->permitDir))->toBe([]);
    });

    it('should parses permit slug and status from a real file', function(): void {
        file_put_contents(
            $this->permitDir . '/2026-05-05-foo-bar.md',
            "# Foo Bar\n\n**Status:** Open\n",
        );

        $permits = PrePushPermitGate::scanPermits($this->permitDir);

        expect($permits)->toHaveCount(1)
            ->and($permits[0])->toBe([
                'filename' => '2026-05-05-foo-bar.md',
                'slug' => 'foo-bar',
                'status' => 'Open',
            ]);
    });

    it('should skips the shipping order template', function(): void {
        file_put_contents(
            $this->permitDir . '/.shipping-order-template.md',
            "# Template\n\n**Status:** Open\n",
        );

        expect(PrePushPermitGate::scanPermits($this->permitDir))->toBe([]);
    });

    it('should skips files without a date prefix', function(): void {
        file_put_contents($this->permitDir . '/random.md', "**Status:** Open\n");

        expect(PrePushPermitGate::scanPermits($this->permitDir))->toBe([]);
    });

    it('should skips non-markdown files', function(): void {
        file_put_contents($this->permitDir . '/2026-05-05-foo.txt', "**Status:** Open\n");

        expect(PrePushPermitGate::scanPermits($this->permitDir))->toBe([]);
    });

    it('should records null status when the Status line is missing', function(): void {
        file_put_contents($this->permitDir . '/2026-05-05-foo-bar.md', "no status here\n");

        $permits = PrePushPermitGate::scanPermits($this->permitDir);

        expect($permits)->toHaveCount(1)
            ->and($permits[0]['status'])->toBeNull();
    });
});

describe('PrePushPermitGate::failureMessage', function(): void {
    it('should names the branch, slug, and threshold breach', function(): void {
        $message = PrePushPermitGate::failureMessage(
            branch: 'feat/foo-bar',
            branchSlug: 'foo-bar',
            stats: ['files' => 25, 'lines' => 400],
            permits: [],
        );

        expect($message)->toContain('feat/foo-bar')
            ->and($message)->toContain('foo-bar')
            ->and($message)->toContain('25 files changed')
            ->and($message)->toContain('400 lines changed');
    });

    it('should lists same-slug permits whose status is inactive', function(): void {
        $message = PrePushPermitGate::failureMessage(
            branch: 'feat/foo-bar',
            branchSlug: 'foo-bar',
            stats: ['files' => 25, 'lines' => 400],
            permits: [
                ['filename' => '2026-05-05-foo-bar.md', 'slug' => 'foo-bar', 'status' => 'Completed'],
            ],
        );

        expect($message)->toContain('2026-05-05-foo-bar.md')
            ->and($message)->toContain('Completed');
    });

    it('should does not list unrelated permits', function(): void {
        $message = PrePushPermitGate::failureMessage(
            branch: 'feat/foo-bar',
            branchSlug: 'foo-bar',
            stats: ['files' => 25, 'lines' => 400],
            permits: [
                ['filename' => '2026-05-05-other.md', 'slug' => 'other', 'status' => 'Open'],
            ],
        );

        expect($message)->not->toContain('2026-05-05-other.md');
    });

    it('should mentions the --no-verify escape hatch', function(): void {
        $message = PrePushPermitGate::failureMessage(
            branch: 'feat/foo-bar',
            branchSlug: 'foo-bar',
            stats: ['files' => 25, 'lines' => 400],
            permits: [],
        );

        expect($message)->toContain('--no-verify');
    });
});
