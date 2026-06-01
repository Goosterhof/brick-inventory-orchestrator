<?php

declare(strict_types = 1);

use Tests\Architecture\Support\ArchTestHelper;

/*
|--------------------------------------------------------------------------
| Cache-Key Encryption Architecture — Encrypted-Cast Columns Must Never
| Enter a Cache Key (war-room enforcement queue #24, Level 1)
|--------------------------------------------------------------------------
|
| Doctrine (war-room Architectural Principle #10): cache keys must be
| rotation-invariant when derived from rotatable credentials. Concretely:
| an Eloquent attribute whose column carries an `'encrypted'` cast must
| never be spliced into a cache-key string. The Laravel `'encrypted'` cast
| guarantees ciphertext-at-rest in the originating column, but the moment a
| decrypted attribute is interpolated into a cache key and that key is
| persisted (the database cache driver writes the key verbatim into the
| `cache.key` column), the cleartext credential is back at rest in a second
| durable surface — undoing the cast and breaching ISO 27001 A.5.33 on any
| compliance territory. It also defeats "rotate to revoke": entries keyed by
| the old credential survive until TTL reaper.
|
| Seed defect: Sapper M6-M1 / M6-M2 (`rebrickable:user:{decryptedToken}:...`
| in RebrickableService). Source fix shipped in PR #106 (e6b4ec2) — the
| Rebrickable user-sets cache was rekeyed from the decrypted token to the
| rotation-invariant `family_id`. This test is the regression backstop so the
| defect class cannot return silently.
|
| Strategy C hybrid (per Surveyor design recon
| 2026-05-26-surveyor-q24-arch-test-design-recon.md):
|   Test #1 (primary gate)   — every Eloquent attribute (the *terminal*
|                              property of a `->`-chain) spliced into a
|                              cache-key construction site must appear on the
|                              approved column allow-list below.
|   Test #2 (secondary gate) — encrypted-cast columns are auto-discovered
|                              from every Model's casts() block; none may
|                              appear on the allow-list (closes the
|                              allow-list-drift hole), and none may appear as
|                              an attribute access inside any cache-key site.
|
| ------------------------------------------------------------------------
| Detection is regex/AST-lite, NOT full taint tracking. Known limitation:
| a decrypted value laundered through one or more intermediate *local
| variables* before reaching the cache key
| (`$plain = $family->encrypted_col; $key = sprintf('...%s...', $plain);`)
| escapes a single-file regex — the attribute access and the splice can sit
| in different methods or different files (the seed itself crossed an
| Action -> Service boundary). The gates below catch the high-value,
| empirically-observed shape: a `$model->encryptedColumn` access interpolated
| at or near a cache-key site, plus any new column-name drifting into a cache
| key. Closing the cross-file-launder hole would require Larastan-grade type
| resolution of every cache-key argument back through the call graph; that is
| future drift work, deliberately out of scope here. If the launder shape is
| ever observed in the wild, escalate to a PHPStan rule in
| phpstan-warroom-rules rather than widening this regex.
| ------------------------------------------------------------------------
|
| Closes enforcement queue #24 at Level 1.
| Order: /orders/_envelopes/bio-q24-armorer-strategy-c-arch-test.md
|
 */

/**
 * Approved column allow-list — Eloquent attribute names that may be
 * interpolated into a cache key. Reviewing this list is Commander territory:
 * adding any column (and *especially* an encrypted one — Test #2 will reject
 * encrypted additions outright) requires explicit sign-off + ISO 27001 A.5.33
 * review, mirroring the Commander-sign-off etiquette of
 * CarbonImportArchitectureTest's grandfathered allow-list.
 *
 * Seeded post-PR-#106 (family_id rekey). The decrypted Rebrickable user token
 * (`Family::rebrickable_user_token`, 'encrypted' cast) is deliberately ABSENT.
 *
 * @var list<string>
 */
$cacheKeyColumnAllowlist = [
    'id',
    'family_id', // rotation-invariant rekey replacement — closes Sapper M6-M1/M6-M2
    'set_num',
    'ean',
    'part_num',
    'color_id',
    // (no encrypted columns — see Test #2)
];

/**
 * Directories scanned for cache-key construction. Concentrated in
 * app/Services/ today (BIO Actions construct no cache keys), but app/Actions/
 * is scanned too as a forward-looking gate.
 *
 * @var list<string>
 */
$cacheKeyScanDirs = ['Services', 'Actions'];

/*
 * Recognise a cache-key construction site as a line of the form
 *   $<...cacheKey...> = sprintf('...', <args>);
 * The variable name must contain "cachekey" (case-insensitive), which is BIO's
 * established convention ($cacheKey = sprintf(...) immediately preceding a
 * cacheRepository->get/put). This anchors the scan to genuine cache keys and
 * avoids false-firing on the many non-cache sprintf() calls (exception
 * messages, API URL paths, bulk-upsert array indices).
 *
 * THRESHOLD NOTE [Engineering-input, NOT Commander-callable]: the Surveyor
 * recon proposed a ±30-line *proximity* window (cache call within 30 lines of
 * an encrypted-column access). This implementation deliberately rejects the
 * proximity heuristic in favour of a tighter structural anchor — the
 * disallowed / encrypted column must appear *inside the sprintf argument list
 * of a cacheKey-named assignment*. That eliminates the proximity
 * false-positive surface entirely (an encrypted column used in a nearby
 * where() / find() no longer trips the gate). Trade-off: a cache key built
 * without the "cacheKey" variable-name convention (e.g. inlined directly into
 * cacheRepository->get(sprintf(...))) is not yet matched. BIO has zero such
 * sites today; if the convention is ever broken, widen the anchor here — this
 * is an engineering tuning knob, not a policy decision.
 */
$cacheKeySprintfPattern = '/\$\w*[Cc]ache[Kk]ey\w*\s*=\s*sprintf\(\s*([\'"])(?:\\\.|(?!\1).)*\1\s*(?<args>,[^;]*)?\)\s*;/';

/**
 * Pull every terminal `->property` segment out of a captured argument list.
 * For `$family->id, $page` returns ['id']; for `$this->family->id` returns
 * ['id'] (intermediate accessor `family` ignored — only the value actually
 * interpolated matters); for bare locals (`$familyId, $page`) returns [].
 * Method calls (`->getOwner()`) are excluded via the negative look-ahead.
 *
 * @return list<string>
 */
$terminalColumns = static function(string $args): array {
    $columns = [];

    foreach (explode(',', $args) as $part) {
        if (preg_match_all('/->\s*(\w+)\b(?!\s*\()/', $part, $segments) === 0) {
            continue;
        }

        $chain = $segments[1];

        if ($chain !== []) {
            $columns[] = end($chain);
        }
    }

    return $columns;
};

/**
 * Pull every `->property` segment (whole chain, not just the terminal) out of
 * a captured argument list — used by the encrypted-ban gate, where an
 * encrypted access anywhere in a cache-key argument is a violation.
 *
 * @return list<string>
 */
$allChainColumns = static function(string $args): array {
    if (preg_match_all('/->\s*(\w+)\b(?!\s*\()/', $args, $segments) === 0) {
        return [];
    }

    return $segments[1];
};

/**
 * Auto-discover every encrypted-cast column by text-parsing each Model's
 * casts() block. Reflection-free (matches CarbonImportArchitectureTest's
 * file-text idiom; Architecture tests are NOT bound to TestCase, so the app
 * container is not booted). Directory-discovery over app/Models/ — any future
 * encrypted column is picked up automatically (war-room ROE: prefer
 * directory-discovery globs over hard-coded rosters for open-ended sets).
 *
 * Recognises `'col' => 'encrypted'`, `'col' => 'encrypted:type'`, and
 * `'col' => EncryptedCast::class`.
 *
 * @return list<string>
 */
$discoverEncryptedColumns = static function(): array {
    $modelsPath = \dirname(__DIR__, 2) . '/app/Models';
    $columns = [];

    foreach (ArchTestHelper::phpFilesIn($modelsPath) as $file) {
        $contents = file_get_contents($file);

        if ($contents === false) {
            continue;
        }

        if (preg_match_all('/[\'"](\w+)[\'"]\s*=>\s*[\'"]encrypted(?::\w+)?[\'"]/', $contents, $stringCasts) > 0) {
            foreach ($stringCasts[1] as $column) {
                $columns[] = $column;
            }
        }

        if (preg_match_all('/[\'"](\w+)[\'"]\s*=>\s*EncryptedCast::class/', $contents, $classCasts) > 0) {
            foreach ($classCasts[1] as $column) {
                $columns[] = $column;
            }
        }
    }

    return array_values(array_unique($columns));
};

test('every column interpolated into a cache key is on the approved allow-list', function() use (
    $cacheKeyScanDirs,
    $cacheKeySprintfPattern,
    $cacheKeyColumnAllowlist,
    $terminalColumns,
): void {
    $appPath = \dirname(__DIR__, 2) . '/app';

    $files = [];

    foreach ($cacheKeyScanDirs as $cacheKeyScanDir) {
        $files = [...$files, ...ArchTestHelper::phpFilesIn($appPath . '/' . $cacheKeyScanDir)];
    }

    expect($files)->not->toBeEmpty('No PHP files found in the cache-key scan directories.');

    $violations = [];

    foreach ($files as $file) {
        $contents = file_get_contents($file);

        if ($contents === false) {
            continue;
        }

        if (preg_match_all($cacheKeySprintfPattern, $contents, $matches, \PREG_SET_ORDER) === 0) {
            continue;
        }

        $relativePath = str_replace($appPath . '/', '', $file);

        foreach ($matches as $match) {
            $args = $match['args'] ?? '';

            foreach ($terminalColumns($args) as $column) {
                if (\in_array($column, $cacheKeyColumnAllowlist, true)) {
                    continue;
                }

                $violations[] = \sprintf('%s — `$...->%s` spliced into a cache key', $relativePath, $column);
            }
        }
    }

    expect($violations)->toBeEmpty(
        ArchTestHelper::formatViolations(
            'An Eloquent attribute not on the approved cache-key allow-list was interpolated into a '
            . 'cache key. Cache keys must be rotation-invariant (war-room Architectural Principle #10): '
            . 'prefer the owning entity primary key (e.g. family_id). To approve a NON-encrypted column, '
            . 'extend $cacheKeyColumnAllowlist in '
            . 'tests/Architecture/CacheKeyEncryptionArchitectureTest.php with Commander sign-off. '
            . 'Encrypted columns are never approvable (see Test #2). Offenders:',
            $violations,
        ),
    );
});

test('no encrypted-cast column may appear on the cache-key allow-list', function() use (
    $cacheKeyColumnAllowlist,
    $discoverEncryptedColumns,
): void {
    $encryptedColumns = $discoverEncryptedColumns();

    expect($encryptedColumns)->not->toBeEmpty(
        'Expected at least one encrypted-cast column in app/Models/ '
        . '(Family::rebrickable_user_token). Encrypted-column discovery returned nothing — '
        . 'the casts() parse regex may have drifted; this gate would be silently vacuous.',
    );

    $leaked = array_values(array_intersect($encryptedColumns, $cacheKeyColumnAllowlist));

    expect($leaked)->toBeEmpty(
        ArchTestHelper::formatViolations(
            'An encrypted-cast column is on the cache-key allow-list. Encrypted columns must NEVER be '
            . 'interpolated into a cache key — the database cache driver would persist the decrypted '
            . 'credential as cleartext-at-rest in the cache.key column (ISO 27001 A.5.33). Remove it from '
            . '$cacheKeyColumnAllowlist in tests/Architecture/CacheKeyEncryptionArchitectureTest.php and '
            . 'rekey by a rotation-invariant identifier instead. Encrypted columns on the allow-list:',
            $leaked,
        ),
    );
});

test('no encrypted-cast column may appear inside a cache-key construction site', function() use (
    $cacheKeyScanDirs,
    $cacheKeySprintfPattern,
    $discoverEncryptedColumns,
    $allChainColumns,
): void {
    $appPath = \dirname(__DIR__, 2) . '/app';
    $encryptedColumns = $discoverEncryptedColumns();

    $files = [];

    foreach ($cacheKeyScanDirs as $cacheKeyScanDir) {
        $files = [...$files, ...ArchTestHelper::phpFilesIn($appPath . '/' . $cacheKeyScanDir)];
    }

    $violations = [];

    foreach ($files as $file) {
        $contents = file_get_contents($file);

        if ($contents === false) {
            continue;
        }

        if (preg_match_all($cacheKeySprintfPattern, $contents, $matches, \PREG_SET_ORDER) === 0) {
            continue;
        }

        $relativePath = str_replace($appPath . '/', '', $file);

        foreach ($matches as $match) {
            $args = $match['args'] ?? '';

            foreach ($allChainColumns($args) as $column) {
                if (!\in_array($column, $encryptedColumns, true)) {
                    continue;
                }

                $violations[] = \sprintf('%s — encrypted column `%s` spliced into a cache key', $relativePath, $column);
            }
        }
    }

    expect($violations)->toBeEmpty(
        ArchTestHelper::formatViolations(
            'An encrypted-cast column (auto-discovered from Model casts()) was interpolated into a cache '
            . 'key. This persists the decrypted credential as cleartext-at-rest in the database cache '
            . 'store (ISO 27001 A.5.33), bypassing the column\'s "encrypted" cast contract. Rekey by a '
            . 'rotation-invariant identifier (e.g. the owning entity primary key). Offenders:',
            $violations,
        ),
    );
});
