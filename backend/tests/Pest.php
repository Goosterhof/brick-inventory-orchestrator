<?php

declare(strict_types = 1);

use DG\BypassFinals;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Bypass Finals
|--------------------------------------------------------------------------
|
| Enable BypassFinals to allow Mockery to mock final Action classes.
| Only Actions need bypassing since they're the only final classes mocked
| as dependencies. Services are mocked via interfaces instead.
|
 */

BypassFinals::setWhitelist(['*/app/Actions/*']);
BypassFinals::enable();

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
 */

pest()->extend(TestCase::class)
 // ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature', 'Unit');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
 */

/*
|--------------------------------------------------------------------------
| Architecture Test Helpers
|--------------------------------------------------------------------------
|
| These helper functions provide utilities for reflection-based architecture
| tests. We use custom tests when Pest's arch() expectations don't support
| the required logic.
|
| Limitations of Pest arch() to be aware of:
| - ignoring() doesn't work as a filter after expect()
| - toExtend() is a requirement, not a filter (all classes must extend)
| - or() doesn't combine conditions as expected (e.g., "final OR abstract")
|
| For complex conditions, use custom reflection-based tests instead.
|
 */

/**
 * Get all class names in a directory matching a namespace.
 *
 * @return list<class-string>
 */
function getClassesInDirectory(string $directory, string $namespace): array
{
    if (!is_dir($directory)) {
        return [];
    }

    $classes = [];
    $iterator = new \RecursiveIteratorIterator(
        new \RecursiveDirectoryIterator($directory, \RecursiveDirectoryIterator::SKIP_DOTS),
    );

    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            $relativePath = str_replace([$directory . '/', '.php'], ['', ''], $file->getPathname());
            $classes[] = $namespace . str_replace('/', '\\', $relativePath);
        }
    }

    return $classes;
}

/**
 * Get all test files in the Feature and Unit directories.
 *
 * @return list<string>
 */
function getTestFiles(): array
{
    $testsDir = \dirname(__DIR__) . '/tests';
    $testFiles = [];

    foreach (['Feature', 'Unit'] as $dir) {
        $path = $testsDir . '/' . $dir;
        if (!is_dir($path)) {
            continue;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS),
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $testFiles[] = $file->getPathname();
            }
        }
    }

    return $testFiles;
}

/**
 * Get all migration files.
 *
 * @return list<string>
 */
function getMigrationFiles(): array
{
    $migrationsDir = \dirname(__DIR__) . '/database/migrations';

    return glob($migrationsDir . '/*.php') ?: [];
}
