<?php

declare(strict_types = 1);

use App\Models\Color;
use App\Models\Family;
use App\Models\FamilySet;
use App\Models\ImportJob;
use App\Models\InviteCode;
use App\Models\Part;
use App\Models\Set;
use App\Models\SetPart;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use App\Models\Theme;
use Tests\Architecture\Support\ArchTestHelper;

/*
|--------------------------------------------------------------------------
| Carbon Import Architecture — Mutable Carbon Ban with Grandfathered Allow-List
|--------------------------------------------------------------------------
|
| Doctrine: the Foundry uses `Carbon\CarbonImmutable`, not `Carbon\Carbon`.
| Mutable Carbon is a footgun — methods like `addDay()` mutate in-place and
| produce surprise aliasing between variables that "should" be independent.
|
| Eleven models in `app/Models/` currently import `Carbon\Carbon`. Migrating
| them is a separate, larger refactor; this gate's job is to stop the wound
| from getting larger, not to pay down the debt.
|
| The allow-list below grandfathers those eleven models. Adding a twelfth
| violator fails this test. The remedy is:
|   - Preferred:  use `Carbon\CarbonImmutable` instead.
|   - Exception: extend the allow-list with Commander sign-off + rationale,
|                and file a deferred entry tracking the eventual migration.
|
| Closes Cartographer M4/M6/M9/M10/M11 standing concern — Carbon mutable
| vs immutable inconsistency — per Commander disposition 2026-05-19.
| Order: /orders/brick-inventory-orchestrator/carbon-immutable-arch-test-ban-armorer-deployment.md
|
 */

/**
 * Grandfathered allow-list — fully-qualified class names that may import
 * `Carbon\Carbon`. All eleven entries are tech debt that predates the gate;
 * each will migrate to `Carbon\CarbonImmutable` when next touched or in a
 * dedicated migration sweep.
 *
 * @var list<class-string>
 */
$grandfatheredMutableCarbon = [
    // grandfathered 2026-05-19 — Cartographer M11 standing concern; migrate when touched
    Color::class,
    Family::class,
    FamilySet::class,
    ImportJob::class,
    InviteCode::class,
    Part::class,
    Set::class,
    SetPart::class,
    StorageOption::class,
    StorageOptionPart::class,
    Theme::class,
];

test('only the grandfathered allow-list may import mutable Carbon\Carbon', function() use ($grandfatheredMutableCarbon): void {
    $appPath = \dirname(__DIR__, 2) . '/app';
    $files = ArchTestHelper::phpFilesIn($appPath);

    expect($files)->not->toBeEmpty('No PHP files found in app/');

    // Build a lookup of allow-listed file paths so we can compare path-to-path
    // without needing every file to be class_exists()-resolvable.
    $allowedPaths = [];

    foreach ($grandfatheredMutableCarbon as $fqcn) {
        $reflection = new \ReflectionClass($fqcn);
        $allowedPaths[$reflection->getFileName()] = $fqcn;
    }

    $violations = [];

    foreach ($files as $file) {
        $contents = file_get_contents($file);

        if ($contents === false) {
            continue;
        }

        // Detect `use Carbon\Carbon;` precisely — must not match
        // `use Carbon\CarbonImmutable;` (the compliant import) or any
        // `use Carbon\CarbonSomethingElse;`. The trailing `;` anchors the
        // statement; whitespace tolerance handles both `use Carbon\Carbon;`
        // and `use Carbon\Carbon ;` (rare but legal).
        if (!preg_match('/^use\s+Carbon\\\Carbon\s*;/m', $contents)) {
            continue;
        }

        if (isset($allowedPaths[$file])) {
            continue;
        }

        $relativePath = str_replace($appPath . '/', '', $file);
        $violations[] = $relativePath;
    }

    expect($violations)->toBeEmpty(
        ArchTestHelper::formatViolations(
            'Mutable Carbon\Carbon import is banned outside the grandfathered allow-list. '
            . 'Use Carbon\CarbonImmutable instead, or — for a genuine exception — extend the '
            . 'allow-list in tests/Architecture/CarbonImportArchitectureTest.php with Commander '
            . 'sign-off rationale and a deferred.md tracking entry. Offenders:',
            $violations,
        ),
    );
});

test('every grandfathered allow-list entry still imports Carbon\Carbon', function() use ($grandfatheredMutableCarbon): void {
    // Sanity gate: if a model migrates to CarbonImmutable, the allow-list
    // entry becomes dead weight and must be removed in the same change.
    // This test fails when a grandfathered model no longer imports
    // Carbon\Carbon, forcing the allow-list to shrink monotonically.
    $stale = [];

    foreach ($grandfatheredMutableCarbon as $fqcn) {
        $reflection = new \ReflectionClass($fqcn);
        $file = $reflection->getFileName();

        if ($file === false) {
            continue;
        }

        $contents = file_get_contents($file);

        if ($contents === false) {
            continue;
        }

        if (!preg_match('/^use\s+Carbon\\\Carbon\s*;/m', $contents)) {
            $stale[] = $fqcn;
        }
    }

    expect($stale)->toBeEmpty(
        ArchTestHelper::formatViolations(
            'Grandfathered allow-list entries no longer import Carbon\Carbon — '
            . 'remove them from $grandfatheredMutableCarbon in '
            . 'tests/Architecture/CarbonImportArchitectureTest.php so the allow-list '
            . 'shrinks monotonically:',
            $stale,
        ),
    );
});
