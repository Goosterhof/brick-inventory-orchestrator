# Shift Log: Resolve Laravel 13.7 Deprecation Cascade (Option B)

**Log #:** 2026-04-30-laravel-137-deprecation-cleanup
**Filed:** 2026-05-03
**Shipping Order:** [2026-04-30-laravel-137-deprecation-cleanup](../permits/2026-04-30-laravel-137-deprecation-cleanup.md)
**Sorter:** Head Sorter

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Modified | `bootstrap/app.php` | Replaced `validateCsrfTokens(except: [...])` with `preventRequestForgery(except: [...])` on line 33. Mechanical Laravel-canonical rename — alias deprecated in v13.7.0. |
| Modified | `config/sanctum.php` | Replaced the working-tree `ValidateCsrfToken` import (line 6) and the `'validate_csrf_token'` middleware mapping (line 85) with `PreventRequestForgery`. Restores the pre-2026-04-29 L13-attribute-cleanup state — the renamed class now exists in v13.7.0 vendor (verified by `ls vendor/.../Foundation/Http/Middleware/`). |
| Modified | `config/database.php` | Dropped the `\PHP_VERSION_ID >= 80_500 ? Mysql::ATTR_SSL_CA : \PDO::MYSQL_ATTR_SSL_CA` ternary on lines 64 and 84. Both `mysql` and `mariadb` connection blocks now reference `Pdo\Mysql::ATTR_SSL_CA` directly. The legacy `\PDO::MYSQL_ATTR_SSL_CA` reference no longer exists in the codebase. |
| Modified | `composer.json` | Tightened `require.php` from `"^8.4"` to `"^8.5"`. The `config.platform.php: "8.5"` pin stays as-is (already 8.5). |
| Modified | `composer.lock` | Regenerated via `composer update --lock`. Diff is 2 lines: `content-hash` and the lockfile's platform-`php` requirement. No package versions changed. |
| Created | `docs/adr/0012-tighten-runtime-to-php-85.md` | New ADR documenting the runtime tightening: decision, context (host/Dockerfile/platform-pin already 8.5; `require.php: "^8.4"` was the last vestige), the three options from the cleanup permit (A, B, C with B chosen), consequences (no PHP 8.4 fallback; `\PDO::MYSQL_ATTR_SSL_CA` deprecation resolved by removal not suppression). |

**Working-tree note:** At end-of-shift the working tree contains both this shift's cleanup work (5 cleanup files + 1 new ADR) and the parked feature-work files for the email-invite use case (per the brief's "branch state" section). The Director will sequence the two commits — cleanup first, then feature.

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| `bootstrap/app.php:33` calls `preventRequestForgery(...)` instead of `validateCsrfTokens(...)` | Yes | Single-method rename with identical arguments |
| `config/sanctum.php` references `PreventRequestForgery` class; L13-attribute-cleanup revert dropped | Yes | Both the import (line 6) and the middleware mapping (line 85) updated |
| `config/database.php` deprecation resolved per chosen option | Yes | Option B executed: ternary removed, direct `Pdo\Mysql::ATTR_SSL_CA` reference. ADR-0012 records the decision |
| `composer phpstan` reports 0 errors at level max on PHP 8.5 | Yes | Captured before/after: 4 errors → 0 errors (verbatim outputs in `/tmp/phpstan-before.log` and `/tmp/phpstan-after.log`) |
| `composer test`, `composer test:arch`, `composer lint:test`, `composer deptrac` all green | Yes | All four pass; details in Quality Gauntlet table below |
| Coverage / mutation / feature-coverage measured (or blocked-state captured) | Partial | Blocked: `php8.5-pcov` is still missing on the host (sudo-gated, parallel queue). Tightening `require.php` to `^8.5` makes the prior shift's `/tmp/php-shim` PATH approach (which symlinks to `/usr/bin/php8.4`) hard-fail at the Composer platform-check, so the workaround used during the 2026-04-29 alignment shift is no longer available — that's a direct consequence of Option B, not a regression. State documented under Quality Gauntlet below. |
| Shift log captures option chosen, reasoning, ADR, before/after PHPStan | Yes | This document |

## Decisions Made

1. **Option B (tighten runtime to ^8.5, drop legacy branch) executed per CEO directive** — The CEO's resolution of the Decisions Required gate selected Option B before this shift dispatched. Sorter executed the chosen path. Rationale recorded by the Director: `platform.php` was already pinned to `8.5`, host and Dockerfile were already 8.5 from the 2026-04-29 alignment shift, so the `require.php: "^8.4"` allowance was unreachable — tightening matched reality. Captured in ADR-0012.

2. **All four edits landed as one cohesive shift, not split** — The permit's "Notes from the Issuer" mentions the diagnostic-vs-fix discipline and notes that the two mechanical fixes (`bootstrap/app.php`, `config/sanctum.php`) could land before the gate resolved. With the gate resolved as Option B before dispatch, splitting would have been artificial — ADR-0012 ties the four fixes together. Landed as one shift.

3. **Used `composer update --lock` not `composer update`** — the brief explicitly requested a minimal lockfile-only update. The result was "Nothing to modify in lock file" — the constraint tightening forced no package version changes. Diff confirms only `content-hash` and the lockfile's platform-`php` line moved. This avoided the patch-bump scan-the-diff exercise the 2026-04-29 graduated training calls for, since the diff carried no framework movement.

4. **Verified vendor and runtime pre-conditions before editing** — per the graduated training "verify external-state claims by opening the cited artifact":
   - `ls vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/` confirmed both `PreventRequestForgery.php` and `ValidateCsrfToken.php` exist in current vendor (the rename landed in v13.7.0; the deprecated class still exists for now)
   - `php -r 'echo class_exists("Pdo\\Mysql") && (new ReflectionClass("Pdo\\Mysql"))->hasConstant("ATTR_SSL_CA");'` confirmed `Pdo\Mysql::ATTR_SSL_CA` exists with value `1008` on canonical 8.5
   - `update-alternatives --display php` confirmed `/usr/bin/php` points to `/usr/bin/php8.5`, matching the platform pin

5. **Blocked-state capture for coverage commands documented as a consequence of Option B** — running coverage via the prior shift's `/tmp/php-shim` (symlink to `/usr/bin/php8.4`) now hard-fails at the Composer platform-check, because the tightened `require.php: ^8.5` activates `vendor/composer/platform_check.php`'s strict version comparison. This is not a regression; it's the runtime constraint working as designed. Captured the new failure mode in `/tmp/test-coverage.log` (shim attempt) and `/tmp/test-coverage-no-shim.log` (canonical 8.5 — "No code coverage driver is available"). The `php8.5-pcov` install remains the unblocking work item; queued separately per the alignment shift's pulse.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | Rector dry-run + Pint `--test` both clean. `/tmp/lint-test.log` |
| phpstan (cleanup only) | Pass | **4 → 0 errors** at level max. Before: `/tmp/phpstan-before.log` (4 errors: `bootstrap/app.php:33`, `config/database.php:64,84`, `config/sanctum.php:85`). After: `/tmp/phpstan-after.log` (No errors) |
| phpstan (cleanup + feature) | Pass | Final cross-check with both cleanup and parked feature work present. 0 errors persist. `/tmp/phpstan-final-with-feature.log` |
| deptrac | Pass | 0 violations, 0 warnings, 0 errors. `/tmp/deptrac.log` |
| test:arch | Pass | 97 tests / 1715 assertions / 2.88s. `/tmp/test-arch.log` |
| test | Pass | 587 tests / 2411 assertions / 13.92s. `/tmp/test.log` |
| test:coverage | Blocked | `No code coverage driver is available.` `php8.5-pcov` not installed; sudo-gated. `/tmp/test-coverage-no-shim.log`. Prior-shift `/tmp/php-shim` workaround now hard-fails at `composer/platform_check.php` because `require.php` is `^8.5` (`/tmp/test-coverage.log`) — direct consequence of Option B. |
| test:feature-coverage | Blocked | Same blocker. `/tmp/test-feature-coverage.log` |
| mutation | Blocked | `Mutation testing requires code coverage to be enabled.` Same blocker. `/tmp/mutation.log` |

## Showcase Readiness

Solid. The cleanup is mechanical at the diff level — five files, one new ADR — but the underlying decision (committing to PHP 8.5+ at the language level, no fallback) is the kind of project-runtime call that a senior architect auditing this warehouse would expect to see ADR'd. ADR-0012 documents the option matrix (A/B/C from the permit), why B beat A and C on the no-baseline / no-`@phpstan-ignore` standard, and the consequences (Composer install fails clearly on PHP 8.4 hosts, rather than installing and running into stub-flagged deprecations downstream). The lockfile diff is genuinely two lines, which I'd call out in any code review as evidence that the constraint tightening did not force a hidden package upgrade.

The `\PDO::MYSQL_ATTR_SSL_CA` removal is the kind of cleanup that pays its keep — the legacy reference is gone from the codebase entirely, not suppressed and not branched-around. PHPStan's level-max stance against `@phpstan-ignore` is preserved, no baseline file was introduced, and the project's no-suppression standard holds.

The blocked-state capture on coverage is the one polish gap, but it's an external-environment constraint (the sudo-gated `php8.5-pcov` install) that this shift legitimately cannot resolve. The new failure mode of the `/tmp/php-shim` approach is a useful signal — it confirms the runtime constraint is now actively enforced at install time, not just at PHPStan time.

## Proposed Knowledge Updates

- **Learnings:** _none_ — the four edits were each governed by graduated training that already covered them (verify-vendor-claims, capture-baseline, pre-bump-diff-scan, session-local-PATH-shim-not-project-edit). No new learnings surfaced.
- **Pulse:** Suggest the Director add a one-line entry to `pulse.md` noting that `composer require.php` is now `^8.5` and the `php8.5-pcov` install remains the only outstanding 8.5 alignment work item (coverage measurability is now strictly gated on it). The two prior-shift workarounds (`/tmp/php-shim` and `composer.json` script editing) are both unavailable for coverage now — the platform-check enforces the constraint, and the script-editing approach was rejected during the 2026-04-29 shift on first principles.
- **Decision Record:** ADR-0012 filed. No further ADR proposals from this shift.

## Self-Debrief

### What Went Well

- **Pre-edit verification was fast and cheap.** Running the two `class_exists` / `ls vendor/...` checks before touching code took ~10 seconds and confirmed both vendor classes (PHP and Laravel) existed. Per the graduated training, this is now habitual.
- **Baseline capture was disciplined.** Captured `composer phpstan 2>&1 | tee /tmp/phpstan-before.log` before the first edit, and `/tmp/phpstan-after.log` immediately after the four edits, before running anything else. The before/after pair is verbatim command output, not memo text — directly satisfies the gauntlet-capture graduated training.
- **Lockfile diff scanned proactively.** The permit's step 5 specifically references the 2026-04-29 graduated training about scanning lockfile diffs for framework patch bumps. `composer update --lock` returned "Nothing to modify in lock file" and the actual diff was 2 lines — no scan needed, but the discipline of having that training as a habit meant I checked rather than assumed.
- **Final cross-check on the dirty working tree.** The brief's step 7 explicitly called out running PHPStan one final time on the combined cleanup + feature working tree. That confirmed the cleanup was clean against feature code I didn't touch — useful insurance that nothing in the parked feature work was secretly leaning on the old API.

### What Went Poorly

- **The `/tmp/php-shim` rediscovery cost a beat.** I tried the shim before remembering that `require.php: ^8.5` would now hard-fail it at the platform-check. The failure is informative (it's the runtime constraint working as designed), but I should have predicted it from the constraint change itself — a quick mental check "what does tightening `require` do to a downstream `php8.4` invocation?" would have surfaced the platform-check before I ran the command. ~30 seconds of avoidable noise.

### Blind Spots

- **None surfaced this shift.** The brief was tight, the CEO had pre-resolved the gate, and every edit was governed by graduated training. The blocked-state capture on coverage was an external constraint, not a blind spot.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| When tightening a `composer.json require.*` constraint that a prior session's session-local workaround depended on (e.g., a PATH shim to a now-disallowed PHP version), predict the new platform-check failure mode before running the workaround command — `composer/platform_check.php` is the enforcement point. | Tried `/tmp/php-shim` for `composer test:coverage` before realizing `require.php: ^8.5` makes the 8.4 shim hard-fail. The failure was informative but predictable from the constraint change alone. | This log |

---

**Working-tree state at end-of-shift:** Cleanup files (`bootstrap/app.php`, `composer.json`, `composer.lock`, `config/database.php`, `config/sanctum.php`) and the new `docs/adr/0012-tighten-runtime-to-php-85.md` are modified/created in the tree alongside the parked feature-work files (per the brief). The Director will sequence two commits — cleanup first, then feature. **Did NOT commit. Did NOT stage.**

---

## Logistics Director Evaluation

_Appended by the Logistics Director after reviewing the log. The sorter's sections above are not edited — they stand as written._

**Overall Assessment:** **Excellent**

### Order Fulfillment Review

Tight, mechanical, and disciplined. Every acceptance criterion green except the coverage / mutation triad — and that gap is correctly classified as an external-environment block (`php8.5-pcov` host install pending) rather than as Sorter-level incompletion. The 4-error → 0-error PHPStan delta is the headline; verbatim before/after captures live at `/tmp/phpstan-before.log` and `/tmp/phpstan-after.log` per the gauntlet-capture graduated training. The bonus run (cleanup tree + parked feature work, captured at `/tmp/phpstan-final-with-feature.log`) was not strictly required by the permit but is exactly the kind of cross-check insurance that makes the next commit-sequence step trivial.

No scope creep. Five files modified, one ADR created, two-line lockfile diff — surface area matches the permit's "tight scope" framing precisely.

### Decision Review

- **§1 (Option B per CEO directive):** Executed faithfully, no unilateral re-interpretation. Correct.
- **§2 (single cohesive shift, not split):** Right call. The permit's diagnostic-vs-fix discipline was an option on the table when the gate was unresolved; once the CEO chose Option B, splitting would have been artificial — the ADR is the connective tissue that ties all four edits together.
- **§3 (`composer update --lock` over `composer update`):** Correct. The brief explicitly requested the minimal lockfile-only path; the result confirmed there was nothing to update beyond the constraint metadata. The two-line diff is a strong showcase artifact.
- **§4 (pre-edit vendor verification):** Exactly what the recently-graduated "verify external-state claims" rule prescribes. The `class_exists`/`hasConstant` reflection probe on `Pdo\Mysql::ATTR_SSL_CA` was the right level of effort — cheap to run, definitive in result.
- **§5 (blocked-state capture as a consequence of Option B):** Honest reporting. The Sorter could have left this as "still blocked, same as before" but instead documented the new failure mode (`/tmp/php-shim` now hard-fails the Composer platform-check) and traced it to first principles. That trace is exactly the thing a senior auditor would expect to find.

No decisions warranted CEO escalation that weren't escalated.

### Showcase Assessment

Three artifacts strengthen the portfolio:

1. **ADR-0012** documents a real strategic decision (PHP runtime tightened to 8.5+) with the option matrix from the permit, the rejection reasoning for A and C, and the consequences spelled out. A reviewer auditing this record would not need to ask "why didn't you just baseline the deprecation?" — the answer is in the file.
2. **The two-line lockfile diff** is structural evidence that the constraint tightening did not force hidden package upgrades. That's the kind of "we know what we changed" precision that a due-diligence review notices.
3. **The `\PDO::MYSQL_ATTR_SSL_CA` removal** preserves the codebase's no-`@phpstan-ignore` and no-baseline standards. The deprecation is gone from the source, not from the visibility surface.

The one polish gap — coverage / mutation still blocked — is now visibly tied to a single sudo-gated install (`php8.5-pcov`). The blocking surface is one decision, not many. That's exactly what the warehouse should look like when an external constraint is the only thing standing between current state and full-green.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| When tightening a `composer.json require.*` constraint that a prior session's session-local workaround depended on (e.g., a PATH shim to a now-disallowed PHP version), predict the new platform-check failure mode before running the workaround command — `composer/platform_check.php` is the enforcement point | Candidate | First observation. Cost was small (~30 seconds) but the principle generalizes cleanly: changing a runtime constraint affects every downstream environment workaround that depends on the prior constraint. The graduated 2026-04-29 training about session-local-vs-project-config workarounds is adjacent but doesn't cover the "constraint-tightening invalidates the workaround" axis. Worth tracking; will see its second test the next time a require-bump intersects with an environment shim. |

### Notes for the Sorter

- Strong shift. The graduated training stack (verify-external-state, capture-baseline, scan-lockfile-diffs, session-local-workaround-discipline) all visibly fired this shift — the work would have looked qualitatively different without them. That's exactly what graduation is for.
- ADR-0012 is well-structured. The option matrix presentation (A/B/C with rejection reasoning for the unchosen) is the right shape for a runtime-tightening decision; future ADRs in this style are welcome.
- The platform-check rediscovery cost ~30 seconds. The candidate captures it; that's enough. Don't over-correct toward defensive prediction on every command — the cost was low and the failure mode was informative.
- The cross-check on the dirty working tree (cleanup + parked feature) was discretionary insurance and paid off — it confirms the feature work doesn't lean on the deprecated APIs and lets the Director sequence the two commits without further verification. Repeat that pattern when a continuation commit shares the working tree with parked work.

---

## Addendum (2026-05-03 post-push) — CI workflow miss

After PR #166 was opened and pushed, all 7 PHP-running CI jobs (`audit`, `lint`, `test`, `coverage`, `feature-coverage`, `mutation`, `seed`) failed at `composer install`:

```
Your Composer dependencies require a PHP version ">= 8.5.0". You are running 8.4.20.
```

`.github/workflows/ci.yml` pinned `php-version: '8.4'` in seven places (one per job's `Setup PHP` step). Tightening `composer.json` `require.php` to `^8.5` invalidated those pins; the local gauntlet was green only because the host runs 8.5. CI was never re-run after the push, and the platform-check that fires on `composer install` made the failure structural rather than a deprecation flag.

The fix was mechanical: bump all seven `php-version: '8.4'` occurrences to `'8.5'` in a single fix-up commit on this branch (`chore(ci): pin workflows to PHP 8.5 to match require.php`). The cleanup permit's scope retroactively included this — tightening a runtime constraint is incomplete until every environment that depends on it (host, Dockerfile, CI workflows, Railway runtime) honors the new floor.

### Connection to graduated training

The CEO flagged this as a direct application case for the rule that graduated *during the same review pass*: **"Verify external-state claims in permits — permit text is design intent; the file/dashboard is ground truth."** CI workflow files are external to the cleanup edit surface, but they depend on the constraint the cleanup tightened. The graduated rule would have caught this if applied during the cleanup shift — not as "verify a permit claim" but as the broader "verify every external surface that depends on the constraint you're changing."

This is not a new training proposal — the rule is already graduated. It is post-graduation evidence that the rule generalizes beyond permit-text claims: it covers any external-to-the-edit-surface state coupled to the edit. Recording here for archaeology; the cost (one fix-up commit, no main-branch impact) was small but the principle is sharp.

### Acceptance criterion update

The cleanup shift's "all gauntlet stages green" criterion is now read more broadly: green locally + green in CI. Before this addendum, "the gauntlet" implicitly meant the local pre-commit/pre-push runs. The CEO's review made explicit what was implicit. Future runtime-constraint tightenings should include CI-workflow verification as part of the in-scope checklist.
