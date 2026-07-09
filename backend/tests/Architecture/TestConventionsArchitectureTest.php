<?php

declare(strict_types = 1);

it('should use describe blocks in test files', function(): void {
    foreach (getTestFiles() as $file) {
        $content = file_get_contents($file);
        $relativePath = str_replace(\dirname(__DIR__) . '/', '', $file);

        expect(str_contains($content, 'describe('))
            ->toBeTrue(\sprintf('Test file %s should use describe() blocks', $relativePath));
    }
});

it('should use it should syntax in test files', function(): void {
    foreach (getTestFiles() as $file) {
        $content = file_get_contents($file);
        $relativePath = str_replace(\dirname(__DIR__) . '/', '', $file);

        // Check that test cases use it('should syntax
        if (preg_match_all('/\bit\s*\(\s*[\'"]/', $content)) {
            expect(preg_match('/\bit\s*\(\s*[\'"]should\s/', $content))
                ->toBe(1, \sprintf("Test file %s should use it('should ...') syntax", $relativePath));
        }
    }
});

it('should use RefreshDatabase in feature tests', function(): void {
    $featureDir = \dirname(__DIR__) . '/Feature';
    if (!is_dir($featureDir)) {
        return;
    }

    $iterator = new \RecursiveIteratorIterator(
        new \RecursiveDirectoryIterator($featureDir, \RecursiveDirectoryIterator::SKIP_DOTS),
    );

    foreach ($iterator as $file) {
        if (!$file->isFile()) {
            continue;
        }

        if ($file->getExtension() !== 'php') {
            continue;
        }

        $content = file_get_contents($file->getPathname());
        $relativePath = str_replace(\dirname(__DIR__) . '/', '', $file->getPathname());

        expect(str_contains($content, 'RefreshDatabase'))
            ->toBeTrue(\sprintf('Feature test %s should use RefreshDatabase trait', $relativePath));
    }
});

it('should not use RefreshDatabase in unit tests', function(): void {
    $unitDir = \dirname(__DIR__) . '/Unit';
    if (!is_dir($unitDir)) {
        return;
    }

    $iterator = new \RecursiveIteratorIterator(
        new \RecursiveDirectoryIterator($unitDir, \RecursiveDirectoryIterator::SKIP_DOTS),
    );

    foreach ($iterator as $file) {
        if (!$file->isFile()) {
            continue;
        }

        if ($file->getExtension() !== 'php') {
            continue;
        }

        $content = file_get_contents($file->getPathname());
        $relativePath = str_replace(\dirname(__DIR__) . '/', '', $file->getPathname());

        expect(str_contains($content, 'RefreshDatabase'))
            ->toBeFalse(\sprintf('Unit test %s should NOT use RefreshDatabase - use mocks instead', $relativePath));
    }
});

it('should not use placeholder assertions in tests', function(): void {
    foreach (getTestFiles() as $file) {
        $content = file_get_contents($file);
        $relativePath = str_replace(\dirname(__DIR__) . '/', '', $file);

        // Check for expect(true)->toBeTrue() pattern
        expect(preg_match('/expect\s*\(\s*true\s*\)\s*->\s*toBeTrue\s*\(/', $content))
            ->toBe(0, \sprintf('Test file %s should not use placeholder assertions like expect(true)->toBeTrue()', $relativePath));
    }
});

it('should use shouldReceive instead of shouldHaveReceived in unit tests', function(): void {
    $unitDir = \dirname(__DIR__) . '/Unit';
    if (!is_dir($unitDir)) {
        return;
    }

    $iterator = new \RecursiveIteratorIterator(
        new \RecursiveDirectoryIterator($unitDir, \RecursiveDirectoryIterator::SKIP_DOTS),
    );

    foreach ($iterator as $file) {
        if (!$file->isFile()) {
            continue;
        }

        if ($file->getExtension() !== 'php') {
            continue;
        }

        $content = file_get_contents($file->getPathname());
        $relativePath = str_replace(\dirname(__DIR__) . '/', '', $file->getPathname());

        // Check for shouldHaveReceived or shouldNotHaveReceived patterns
        expect(preg_match('/->should(Not)?HaveReceived\s*\(/', $content))
            ->toBe(0, \sprintf('Unit test %s should use shouldReceive()->never() instead of shouldNotHaveReceived() - define expectations in arrange block', $relativePath));
    }
});

it('should declare covers() in all test files', function(): void {
    foreach (getTestFiles() as $file) {
        $content = file_get_contents($file);
        $relativePath = str_replace(\dirname(__DIR__) . '/', '', $file);

        expect(preg_match('/\bcovers\s*\(/', $content))
            ->toBe(1, \sprintf('Test file %s should declare covers() to bind it to the class(es) it tests', $relativePath));
    }
});

it('should pin the transaction boundary with counted expectations in transactional Action unit tests', function(): void {
    $actionsDir = \dirname(__DIR__, 2) . '/app/Actions';

    $iterator = new \RecursiveIteratorIterator(
        new \RecursiveDirectoryIterator($actionsDir, \RecursiveDirectoryIterator::SKIP_DOTS),
    );

    foreach ($iterator as $file) {
        if (!$file->isFile()) {
            continue;
        }

        if ($file->getExtension() !== 'php') {
            continue;
        }

        if (!str_contains(file_get_contents($file->getPathname()), 'ConnectionInterface')) {
            continue;
        }

        $relativeAction = str_replace($actionsDir . '/', '', $file->getPathname());
        $testPath = \dirname(__DIR__) . '/Unit/Actions/' . mb_substr($relativeAction, 0, -4) . 'Test.php';
        $relativeTest = str_replace(\dirname(__DIR__) . '/', 'tests/', $testPath);

        expect(file_exists($testPath))
            ->toBeTrue(\sprintf('Transactional Action app/Actions/%s must have a unit test at %s', $relativeAction, $relativeTest));

        $content = file_get_contents($testPath);

        // A permissive allows('transaction') passthrough stays green when the wrapper is dropped.
        expect(preg_match('/allows\(\s*[\'"]transaction[\'"]/', $content))
            ->toBe(0, \sprintf("%s must not stub the transaction with allows() - use shouldReceive('transaction')->once()", $relativeTest));

        // Every shouldReceive('transaction') must chain a count first: once/twice/times/never.
        expect(preg_match('/shouldReceive\(\s*[\'"]transaction[\'"]\s*\)\s*->\s*(?!once\b|twice\b|times\b|never\b)\w/s', $content))
            ->toBe(0, \sprintf("%s must pin every shouldReceive('transaction') with a count (once/twice/times/never)", $relativeTest));

        // At least one test must positively assert the transaction opens.
        expect(preg_match('/shouldReceive\(\s*[\'"]transaction[\'"]\s*\)\s*->\s*(?:once|twice|times)\b/s', $content))
            ->toBe(1, \sprintf('%s must contain at least one counted transaction expectation', $relativeTest));
    }
});

it('should not use makePartial in unit tests', function(): void {
    $unitDir = \dirname(__DIR__) . '/Unit';
    if (!is_dir($unitDir)) {
        return;
    }

    $iterator = new \RecursiveIteratorIterator(
        new \RecursiveDirectoryIterator($unitDir, \RecursiveDirectoryIterator::SKIP_DOTS),
    );

    foreach ($iterator as $file) {
        if (!$file->isFile()) {
            continue;
        }

        if ($file->getExtension() !== 'php') {
            continue;
        }

        $content = file_get_contents($file->getPathname());
        $relativePath = str_replace(\dirname(__DIR__) . '/', '', $file->getPathname());

        // Check for makePartial() which instantiates real Eloquent models with boot logic
        expect(preg_match('/->makePartial\s*\(/', $content))
            ->toBe(0, \sprintf('Unit test %s should not use makePartial() - use pure mocks with getAttribute/setAttribute instead for speed', $relativePath));
    }
});
