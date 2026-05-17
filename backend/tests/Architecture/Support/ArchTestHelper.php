<?php

declare(strict_types = 1);

namespace Tests\Architecture\Support;

use const DIRECTORY_SEPARATOR;

use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

use function sprintf;

/**
 * Shared helpers for architecture tests.
 *
 * Centralises recursive PHP file scanning, class name resolution, and
 * violation formatting so each Architecture test stays focused on its
 * specific rule.
 */
final class ArchTestHelper
{
    /**
     * Recursively find all PHP files in a directory.
     *
     * @return list<string> Absolute file paths, sorted for deterministic output
     */
    public static function phpFilesIn(string $directory): array
    {
        if (!is_dir($directory)) {
            return [];
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS),
        );

        $files = [];

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $files[] = $file->getPathname();
            }
        }

        sort($files);

        return $files;
    }

    /**
     * Resolve the fully-qualified class name from a file path and base namespace.
     *
     * Example: resolveClassName('/app/Actions/FamilySet/CreateFamilySetAction.php',
     *                           '/app/Actions', 'App\\Actions')
     *          => 'App\\Actions\\FamilySet\\CreateFamilySetAction'
     */
    public static function resolveClassName(string $filePath, string $basePath, string $baseNamespace): string
    {
        $relativePath = str_replace($basePath . DIRECTORY_SEPARATOR, '', $filePath);

        return $baseNamespace . '\\' . str_replace([DIRECTORY_SEPARATOR, '.php'], ['\\', ''], $relativePath);
    }

    /**
     * Format a list of violations into a readable assertion message.
     *
     * @param list<string> $violations
     */
    public static function formatViolations(string $header, array $violations): string
    {
        return sprintf(
            "%s\n%s",
            $header,
            implode("\n", array_map(static fn(string $v): string => '  - ' . $v, $violations)),
        );
    }
}
