# Shipping Order: Remove Non-Existent Laravel Attribute References

**Order #:** 2026-04-29-laravel-13-attribute-cleanup
**Filed:** 2026-04-29
**Issued By:** CEO (via Logistics Director draft)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

`composer phpstan` reports 6 errors and one feature test fails because three Laravel symbols referenced in our codebase do not exist in the installed `laravel/framework v13.5.0`:

- `Illuminate\Queue\Attributes\Timeout` — referenced as `#[Timeout(600)]` decorator and via reflection in tests
- `Illuminate\Queue\Attributes\FailOnTimeout` — referenced as `#[FailOnTimeout]` decorator and via reflection in tests
- `Illuminate\Foundation\Http\Middleware\PreventRequestForgery` — referenced in `config/sanctum.php`

These symbols were introduced as part of the 2026-04-19 Laravel 13 upgrade work but never existed in the installed framework version. Replace the attribute-decorator approach with Laravel's canonical job-timeout properties (`public int $timeout` and `public bool $failOnTimeout`, both available since Laravel 8) and revert the CSRF middleware reference to the class that actually exists (`ValidateCsrfToken`). This is a compliance fix to bring `composer phpstan` and `composer test` back to green — not a redesign of how the import job handles timeouts.

## Scope

### In the Crate

- **`app/Jobs/ImportOwnedSetsJob.php`** — drop the `use Illuminate\Queue\Attributes\FailOnTimeout;` and `use Illuminate\Queue\Attributes\Timeout;` imports (lines 13–14), drop the `#[FailOnTimeout]` and `#[Timeout(600)]` attribute decorators on the class (lines 17–18). Replace with two typed properties on the class body:
  - `public int $timeout = 600;`
  - `public bool $failOnTimeout = true;`
  These are Laravel's canonical job-configuration mechanism (both have existed since L8, both are documented at `docs.laravel.com/13/queues#timeout`). Behavior is identical to what the attribute approach was supposed to deliver: the worker kills the process after 600s and routes through `failed()`.
- **`config/sanctum.php`** — revert the import (line 6) and the `validate_csrf_token` value (line 85) to `Illuminate\Foundation\Http\Middleware\ValidateCsrfToken`. That class exists in the installed framework; `PreventRequestForgery` does not.
- **`tests/Feature/Jobs/ImportOwnedSetsJobTest.php`** — rewrite the two reflection-based tests (lines 187–210) to assert against the new property values instead of attribute classes:
  - `it should declare a 600 second timeout` → instantiate the job, assert `->timeout === 600`.
  - `it should declare failOnTimeout so the failed() hook fires` → instantiate the job, assert `->failOnTimeout === true`.
  - These rewrites must actually exercise the property access — the original `getAttributes(FailOnTimeout::class)->toHaveCount(1)` form silently passed against a non-existent class because the assertion never triggered class autoloading. The new assertions must fail loudly if the property is missing or wrong-valued.
- **Verify the gauntlet returns to green:** `composer phpstan` must drop from 6 errors → 0, the previously failing test (`should declare a 600 second timeout via the Timeout attribute`, which becomes `should declare a 600 second timeout` post-rewrite) must pass, and the full `composer test` suite must pass with the revised tests in place.

### Not on This Pallet

- **`bootstrap/app.php`.** Its `$middleware->validateCsrfTokens(except: [...])` call uses a method name that is still valid in Laravel 13 (the L13 `preventRequestForgery()` rename is an alias addition, not a removal — `validateCsrfTokens()` continues to exist). No change needed; the original 2026-04-19 journal claimed this file was modified, but inspection shows it was never actually changed and is still correct.
- **Investigating *why* the 2026-04-19 work landed in this state.** That investigation is captured in the Director's Amendment appended to the 2026-04-19 upgrade journal (filed in parallel with this order). It is not the Sorter's job to relitigate that history — the cleanup is what's in the crate.
- **The mutation drill follow-up from the L13 upgrade.** Separate Open Item from the original journal; not in scope here.
- **Refactoring the import job's retry / failure semantics.** The job currently has no retries (relies on `ImportOwnedSetsAction`'s save-what-you-can pattern from ADR-0011 and the HTTP client's `retry(3, 100)`). That decision was correctly made in the 2026-04-19 shift and stands.
- **Auditing other ResourceData / arch-test compliance.** This is a focused L13 cleanup, not a sweep.

## Acceptance Criteria

- [ ] `app/Jobs/ImportOwnedSetsJob.php` no longer imports or references `Illuminate\Queue\Attributes\Timeout` or `Illuminate\Queue\Attributes\FailOnTimeout`. The `$timeout` and `$failOnTimeout` properties are present, typed, and set to `600` and `true` respectively.
- [ ] `config/sanctum.php` imports and references `Illuminate\Foundation\Http\Middleware\ValidateCsrfToken`. No reference to `PreventRequestForgery` remains in the file.
- [ ] `tests/Feature/Jobs/ImportOwnedSetsJobTest.php` has two tests that assert the `$timeout` and `$failOnTimeout` property values directly, exercising property access (not attribute reflection). Both tests fail loudly if the property is missing or wrong-valued — verify by temporarily mutating the property in a sandbox check, or by using a strict equality assertion on the value.
- [ ] `composer phpstan` reports 0 errors at level max. (The 6 errors flagged today must all clear; no new errors introduced.)
- [ ] `composer test` passes 569/569 (or whatever the current count is — point is, no test failures including the previously failing reflection test).
- [ ] `composer lint:test`, `composer deptrac`, `composer test:arch` all pass.
- [ ] Coverage drivers remain unavailable (separate Open Item) — filtered tests over the touched files must pass; no regression in the surface area touched.
- [ ] Shift log records: which mechanism was used (properties, not attributes), and a short note on whether anything else in the codebase still references the non-existent symbols (a quick grep should confirm clean).

## References

- Audit context: contract drift identified 2026-04-29; the same investigation that produced the storage-map permit pair surfaced this when the Sorter ran `git stash && composer phpstan` to baseline.
- Original work: shift log `2026-04-19-laravel-13-upgrade.md` (commit `ed1aadc`). The Sorter on 2026-04-19 introduced the attribute-decorator approach; the present shipping order replaces it with the property-based approach.
- Director's Amendment: filed in parallel against the 2026-04-19 journal — explains why the divergence existed and isn't this Sorter's responsibility to litigate.
- Laravel docs: `https://laravel.com/docs/13.x/queues#timeout` (canonical mechanism — `$timeout` property and `$failOnTimeout` property; the attribute classes the original work referenced are not in the L13 documentation either).
- Files involved:
  - `app/Jobs/ImportOwnedSetsJob.php` (modify)
  - `config/sanctum.php` (modify)
  - `tests/Feature/Jobs/ImportOwnedSetsJobTest.php` (modify)
  - `bootstrap/app.php` (verify untouched, see "Not on This Pallet")

## Notes from the Issuer

This is a paper-trail correction in code form. The 2026-04-19 upgrade journal documented work that didn't fully land — three Sorter shifts timed out, the journal was Director-consolidated from incomplete shifts, and two of the three claimed renames (`Timeout` / `FailOnTimeout` attribute adoption, `PreventRequestForgery` middleware rename) referenced symbols that don't exist in the installed framework. The third claimed rename (`bootstrap/app.php` switching to `preventRequestForgery()`) was never actually applied — the file still uses the original `validateCsrfTokens()` method, which happens to be correct for the installed framework.

The cleanup is intentionally minimal: replace the broken references with the canonical mechanism (property-based job timeout, the actual existing CSRF class), rewrite the toothless reflection tests to actually verify what they claim, and let `composer phpstan` and `composer test` go green again.

**Do not relitigate the 2026-04-19 work.** That history is being addressed in a Director's Amendment to the original journal — preserving the original Sorter voice and Director evaluation, but appending a corrective note that reflects ground truth. Your job is the code fix, not the history.

Watch the test rewrite carefully — the original tests had the right intent (assert that the timeout configuration is present and correct) but the wrong mechanism (attribute reflection that silently passes against non-existent classes). The new tests must exercise actual property access on an instantiated job. If you find yourself writing a test that could pass even when the property is removed, you've reverted to the original failure mode — back up and use a stricter assertion.

When you're done, the warehouse goes back to "PHPStan: 0 errors, tests: all green" — which is what the 2026-04-19 journal claimed but did not deliver.

---

**Status:** Completed
**Shift Log:** [`2026-04-29-laravel-13-attribute-cleanup`](../journals/2026-04-29-laravel-13-attribute-cleanup.md)
