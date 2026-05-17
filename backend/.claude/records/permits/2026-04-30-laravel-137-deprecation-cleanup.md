# Shipping Order: Resolve Laravel 13.7 Deprecation Cascade

**Order #:** 2026-04-30-laravel-137-deprecation-cleanup
**Filed:** 2026-04-29 (for first dispatch on next session)
**Issued By:** CEO (via Logistics Director draft, end-of-day handoff from 2026-04-29 investigation thread)
**Assigned To:** Head Sorter
**Priority:** **Standard — first action of the next session**

---

## The Shipment

`composer phpstan` reports 4 errors at level max, all caused by the Laravel 13.5→13.7 patch bump that landed in the 2026-04-29 PHP 8.5 alignment shift's `composer.lock` regeneration. The errors did not exist before the bump and were captured-and-stopped per the alignment shift's diagnostic-vs-fix discipline. This shift remediates them, restoring `composer phpstan` to 0 errors at level max on canonical PHP 8.5.

The four errors break into three concerns:

1. **`bootstrap/app.php:33`** — `validateCsrfTokens()` is now deprecated; use `preventRequestForgery()` instead. Mechanical Laravel-documented rename.
2. **`config/sanctum.php:85`** — `ValidateCsrfToken` class is now deprecated; use `PreventRequestForgery` instead. The current state of this file is a working-tree revert from the 2026-04-29 L13-attribute-cleanup shift, which was correct against v13.5.0 vendor (where `PreventRequestForgery` did not exist yet) and is retroactively obsolete against v13.7.0 vendor (where the renamed class finally landed). Drop the revert.
3. **`config/database.php:64,84`** — `\PDO::MYSQL_ATTR_SSL_CA` flagged as deprecated by PHP 8.5 stubs. The file uses a runtime guard (`\PHP_VERSION_ID >= 80_500 ? Mysql::ATTR_SSL_CA : \PDO::MYSQL_ATTR_SSL_CA`) to select the new `Pdo\Mysql::ATTR_SSL_CA` constant on 8.5+, but PHPStan analyzes both branches statically and flags the legacy fallback. **This concern probably warrants an ADR-level call** — see Decisions Required below.

## Scope

### In the Crate

- **`bootstrap/app.php:33`** — replace `$middleware->validateCsrfTokens(except: [...])` with `$middleware->preventRequestForgery(except: [...])`. The old method was an alias retained for L12-compat; L13.7 deprecates it. The replacement is the framework-canonical name.
- **`config/sanctum.php:6,85`** — drop the working-tree revert that uses `ValidateCsrfToken`. Restore to `Illuminate\Foundation\Http\Middleware\PreventRequestForgery` (which is what was committed-clean before the 2026-04-29 L13-attribute-cleanup shift, and which now exists in v13.7.0 vendor where it didn't in v13.5.0).
- **`config/database.php:64,84`** — resolve the `\PDO::MYSQL_ATTR_SSL_CA` deprecation. Three options sketched below; **first action of this shift is for the Sorter to evaluate the three and surface a recommendation to the Director, not to pick autonomously**. See Decisions Required.
- **Verify the gauntlet:** `composer phpstan` must drop from 4 errors → 0 at level max on canonical PHP 8.5. `composer test`, `composer test:arch`, `composer lint:test`, `composer deptrac` must all remain green. Coverage / mutation / feature-coverage measurability depends on the parallel sudo-gated `php8.5-pcov` install — capture blocked-state honestly if pcov is still missing on the host.
- **Capture before/after metrics** — pre-shift baseline is 4 PHPStan errors (file/line/message detail captured in the 2026-04-29 PHP 8.5 alignment shift log). Post-shift target is 0. Use `composer phpstan` actual command output, not memo text.

### Not on This Pallet

- **The `php8.5-pcov` host install.** Sudo-gated; queued separately. Not blocking this shift; the PHPStan fix is independent of coverage measurability.
- **The deferred 2026-04-19 mutation drill.** Becomes runnable once `php8.5-pcov` is installed AND this shift's PHPStan errors are remediated. Separate shift.
- **The `covers()` mismatch in `CorsConfigTest`.** Separate queued follow-up.
- **Other Laravel 13.7 deprecations.** Today's 4 errors are the deprecation surface this shift remediates. If `composer phpstan` reveals additional errors after the three fixes land, capture and stop — don't sweep.
- **Tightening `composer.json require: php` to `^8.5`.** Even if the `config/database.php` decision favors dropping the legacy branch, the `require` constraint stays `^8.4` for now. Tightening is a separate ADR-level call.
- **Any application code refactor unrelated to the 4 PHPStan errors.** Tight scope.

## Decisions Required (for the `config/database.php` Concern)

The Sorter's first task on dispatch is to evaluate these three options and surface a recommendation **before editing `config/database.php`**. The other two fixes (`bootstrap/app.php`, `config/sanctum.php`) are mechanical and can proceed without this gate.

| Option | What it does | Tradeoff |
|---|---|---|
| **A. PHPStan baseline entry** | Add `\PDO::MYSQL_ATTR_SSL_CA` deprecation suppression to `phpstan.neon` baseline | Quickest. Goes against the codebase's no-baseline standard (the project has historically refused PHPStan baselines — see `phpstan.neon` for the absence of any baseline file and the spirit of ADR-0003). Suppressing a real deprecation hides a future maintenance burden. |
| **B. Tighten `require.php` to `^8.5` and drop the legacy branch** | Remove the `\PHP_VERSION_ID >= 80_500 ? ... : \PDO::MYSQL_ATTR_SSL_CA` guard; commit to PHP 8.5+ at the language level, use only `Pdo\Mysql::ATTR_SSL_CA` | Cleanest code. **But** it locks out PHP 8.4 entirely — an ADR-level decision since `composer.json require: php` has been `^8.4` since the 2026-04-19 L13 upgrade. Strategic implication: production runtime is now PHP 8.5+ exclusively, with no fallback. |
| **C. Isolate the legacy branch into a separate file under a runtime-guard wrapper that PHPStan does not statically analyze** | Move the `\PDO::MYSQL_ATTR_SSL_CA` reference to a file (or method) with a `@phpstan-ignore-line` annotation justified by the runtime guard's semantics | Preserves 8.4 fallback support without baseline. **But** introduces a `@phpstan-ignore` annotation, which the codebase has historically minimized (see existing usage pattern in `GetSetStorageMapAction` for the canonical justified-suppression approach). Adds a small surface of code-organization complexity. |

**My (Director's) preliminary lean:** Option B is the cleanest **if** the codebase is committing to PHP 8.5+ as production runtime. The 2026-04-29 PHP 8.5 alignment shift made the host and Dockerfile both 8.5; tightening `require.php` would close the last vestige of 8.4 support. **But** this is an ADR-level call (it changes the supported runtime range) and should not be made unilaterally by the Sorter. Surface a recommendation, propose an ADR if needed, await CEO direction before editing.

If the CEO opts for A or C, the Sorter executes that path. If the CEO opts for B and there is no objection to filing a new ADR, the Sorter proposes the ADR (or the Director drafts it) before editing.

## Acceptance Criteria

- [ ] `bootstrap/app.php:33` calls `preventRequestForgery(...)` instead of `validateCsrfTokens(...)`. Diff is a single-method rename with identical arguments.
- [ ] `config/sanctum.php` imports and references `Illuminate\Foundation\Http\Middleware\PreventRequestForgery`. The L13-attribute-cleanup shift's working-tree revert is dropped (use `git diff HEAD` against pre-cleanup-shift state to confirm the revert is no longer present).
- [ ] `config/database.php` deprecation resolved per the Director's chosen option (A, B, or C). The decision is documented in the shift log — *which option, why, and any ADR filed alongside*.
- [ ] `composer phpstan` reports **0 errors** at level max on canonical PHP 8.5. Pre/post baseline captured with verbatim command output: was 4 (file/line/message detail per the 2026-04-29 PHP 8.5 alignment shift's PHPStan Findings section), now 0.
- [ ] `composer test`, `composer test:arch`, `composer lint:test`, `composer deptrac` all remain green.
- [ ] Coverage / mutation / feature-coverage:
  - If `php8.5-pcov` has been installed in the meantime: full measurements captured. Unit ≥ 100%, MSI ≥ 76%, feature-coverage runs to completion (modulo the separate `covers()` mismatch).
  - If still sudo-blocked: same blocked-state capture as the 2026-04-29 PHP 8.5 alignment shift. Document.
- [ ] Shift log captures the chosen `config/database.php` option with reasoning, the verbatim PHPStan before/after outputs, and any ADR proposal that came out of the Decisions Required gate.

## References

- Triggering shift: `2026-04-29-php-85-alignment.md` — surfaced the 4 errors via `composer.lock` regeneration; captured-and-stopped per diagnostic-vs-fix discipline. The PHPStan Findings section of that shift log has the full error list with file/line/message detail.
- Causation: Laravel `v13.5.0 → v13.7.0` patch bump in the alignment shift's lockfile regeneration. `v13.7.0` deprecated `Middleware::validateCsrfTokens()` and the `ValidateCsrfToken` class.
- Paper trail interaction: the 2026-04-29 L13-attribute-cleanup shift reverted `config/sanctum.php` from `PreventRequestForgery` to `ValidateCsrfToken` because the renamed class did not exist in v13.5.0. That revert is now retroactively obsolete against v13.7.0 vendor. **Neither shift made a mistake** — the framework moved between them.
- Files involved:
  - `app/Jobs/ImportOwnedSetsJob.php` — _no change required this shift_ (the L13-attribute-cleanup shift's property-based refactor stands; v13.7.0 doesn't reintroduce attribute classes)
  - `bootstrap/app.php` (line 33)
  - `config/sanctum.php` (lines 6, 85)
  - `config/database.php` (lines 64, 84) — Decisions Required gate
  - Possibly a new ADR file under `docs/adr/` if Option B is chosen
- Director's Amendment to `2026-04-19-laravel-13-upgrade.md` — context on why the prior CSRF rename claim was fictional in v13.5.0 and how the day's investigation surfaced the divergence.

## Notes from the Issuer

This shift closes the last open thread of the 2026-04-29 investigation cascade. It's mechanical except for the `config/database.php` decision — and that one decision is exactly the kind the warehouse exists to make defensibly: do we lock out PHP 8.4 to clean up 2 deprecation flags, or do we preserve fallback support and pay the suppression cost?

**Apply the diagnostic-vs-fix discipline again here.** The `bootstrap/app.php` and `config/sanctum.php` fixes are mechanical and can land before the `config/database.php` gate is resolved — those two fixes alone clear 2 of the 4 errors. Don't bundle "land the easy two" with "decide on the hard one." If the Director's call on `config/database.php` takes a beat, file an interim shift log noting the partial state and queue the third fix as a continuation. (This is the same pattern as the 2026-04-29 PHP 8.5 alignment cross-session continuation.)

**This is the first dispatch of the next session.** The 2026-04-29 investigation thread closed at end-of-day with this permit pre-filed. Open the session, read this permit and the 2026-04-29 PHP 8.5 alignment shift log for context, then proceed.

---

**Status:** Completed
**Shift Log:** [2026-04-30-laravel-137-deprecation-cleanup.md](../journals/2026-04-30-laravel-137-deprecation-cleanup.md)
