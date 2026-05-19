# Decision: Tighten Supported PHP Runtime to 8.5+

**Date**: 2026-04-30
**Feature**: Project-wide minimum PHP version
**Status**: accepted
**Transferability**: project-specific

## Context

The 2026-04-29 PHP 8.5 alignment shift moved the host, the Dockerfile, and `composer.json`'s `config.platform.php` pin to `8.5`. The only remaining PHP 8.4 vestige was `composer.json`'s `require.php: "^8.4"` constraint, which permitted installation on 8.4 even though no environment in the project's lifecycle actually ran 8.4 anymore.

This unreachable allowance had a real cost. The Laravel 13.5 → 13.7 patch bump that landed in the alignment shift's lockfile regeneration introduced PHP 8.5 stubs that flag `\PDO::MYSQL_ATTR_SSL_CA` as deprecated in favor of `Pdo\Mysql::ATTR_SSL_CA`. `config/database.php` carried a runtime guard:

```php
(\PHP_VERSION_ID >= 80_500 ? Mysql::ATTR_SSL_CA : \PDO::MYSQL_ATTR_SSL_CA) => env('MYSQL_ATTR_SSL_CA'),
```

PHPStan at level max analyzes both branches statically and flagged the legacy fallback even though the runtime never reaches it. The branch existed only to satisfy the `^8.4` constraint that no environment honored.

The forces:

- The `require.php: "^8.4"` allowance was defensive theater — every real environment was already on 8.5
- PHPStan does not honor `\PHP_VERSION_ID` runtime guards in static analysis — the deprecated branch shows up in the error count regardless
- The codebase has a documented no-baseline, no-`@phpstan-ignore` standard (see ADR-0015 spirit; current `phpstan.neon` carries no baseline file)
- A `@phpstan-ignore` annotation on the legacy branch would suppress a real deprecation that the language version we actually run (8.5) actively flags
- `composer.lock` regeneration with the tightened constraint is a no-op (no package versions force a bump) — confirmed by the `composer update --lock` diff being scoped to the content-hash and the `platform-php` line

## Options Considered

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **A. PHPStan baseline entry** | Quickest; zero runtime change | Adds the project's first-ever PHPStan baseline file, breaching the documented no-baseline standard. Suppresses a real deprecation, hiding the obligation to clean it up later when the constraint is eventually tightened. | Eliminated — capitulating on the no-baseline standard for a deprecation we can simply remove sets a precedent for future suppressions |
| **B. Tighten `require.php` to `^8.5` and drop the legacy branch** | Cleanest code. Removes a runtime ternary that no environment exercises. No `@phpstan-ignore`, no baseline, no defensive theater. Aligns the runtime constraint with the platform pin and the host. | Locks out PHP 8.4 entirely. Strategic implication: the project commits to PHP 8.5+ as production runtime with no fallback. | **Chosen** — every environment was already 8.5; the `^8.4` allowance was unreachable. Tightening matches reality. |
| **C. Isolate the legacy branch into a `@phpstan-ignore`'d file or method** | Preserves 8.4 fallback support without a baseline file | Introduces a `@phpstan-ignore` annotation on a runtime branch that no environment exercises. Adds code-organization complexity. The codebase has historically minimized `@phpstan-ignore` usage to load-bearing cases (e.g., `GetSetStorageMapAction`). | Eliminated — adds a suppression to preserve fallback support that no environment uses |

## Decision

### Tighten the Runtime Constraint

`composer.json`'s `require.php` moves from `"^8.4"` to `"^8.5"`. The `config.platform.php: "8.5"` pin (already in place) stays as-is. Composer `update --lock` regeneration is a no-op against the constraint change — only the content-hash and the lockfile's `platform-php` line move.

### Drop the Legacy `\PDO::MYSQL_ATTR_SSL_CA` Branch

`config/database.php` no longer carries the `\PHP_VERSION_ID >= 80_500 ? ... : \PDO::MYSQL_ATTR_SSL_CA` ternary. Both `mysql` and `mariadb` connection blocks reference `Pdo\Mysql::ATTR_SSL_CA` directly. The legacy fallback disappears entirely — not suppressed, removed.

```php
'options' => \extension_loaded('pdo_mysql') ? array_filter([
    Mysql::ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
], fn(mixed $value): bool => $value !== null) : [],
```

### Coupled Cleanups

This shift also lands two other Laravel 13.7 deprecation fixes that travel with the runtime tightening:

- `bootstrap/app.php` — `validateCsrfTokens()` → `preventRequestForgery()` (Laravel-canonical method name; alias deprecated in v13.7.0)
- `config/sanctum.php` — `ValidateCsrfToken` class → `PreventRequestForgery` class (rename landed in v13.7.0 vendor; the v13.5.0-era working-tree revert from the 2026-04-29 L13-attribute-cleanup shift is dropped)

These two changes are independent of the runtime tightening — they would be required even if Option A or C were chosen — but they land alongside Option B as one cohesive shift because the deprecation cascade is what surfaced the runtime question.

## Consequences

- `composer phpstan` drops from 4 errors to 0 at level max on canonical PHP 8.5
- The project commits to PHP 8.5+ as the only supported runtime — no 8.4 fallback in production, in CI, in Dockerfile, or at the language constraint level
- `config/database.php` is a `Pdo\Mysql::ATTR_SSL_CA`-only file; the legacy `\PDO::MYSQL_ATTR_SSL_CA` reference no longer exists in the codebase
- Future contributors on a host with PHP 8.4 will see `composer install` fail with a clear constraint error, rather than installing successfully and silently running into stub-flagged deprecations downstream
- The no-baseline, no-`@phpstan-ignore` standard is preserved — no suppressions added for this deprecation cascade

## Enforcement

| What | Mechanism | Scope |
|------|-----------|-------|
| Minimum PHP version pinned at language level | `composer.json` `require.php` constraint | Project root |
| Platform pin matches runtime constraint | `composer.json` `config.platform.php` | Project root |
| No PHP 8.4 fallback branches in production code | `composer phpstan` at level max | All `app/`, `config/`, `bootstrap/` files in the PHPStan `<source>` set |

## Open Questions

- When PHP 8.6 lands, is the project's pattern to tighten `require.php` immediately on the patch-bump that introduces 8.6 deprecation stubs, or to hold at the prior version until a forcing function emerges? This shift sets the template for "tighten when the unreachable allowance generates suppression debt"; a future ADR can codify the trigger if the pattern recurs.
