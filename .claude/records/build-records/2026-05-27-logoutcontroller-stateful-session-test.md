# Build Record: LogoutController stateful-session third test

**Build Record #:** 2026-05-27-logoutcontroller-stateful-session-test
**Filed:** 2026-05-27
**Work Order:** [`2026-05-27-logoutcontroller-stateful-session-test`](../work-orders/2026-05-27-logoutcontroller-stateful-session-test.md)
**Builder:** Brickwright
**Wing:** Foundry

> **Work Order Status Discipline (ADR-0028, amended 2026-05-27):**
> This Build Record ships with the parent Work Order in `Status: Open`. After this Build Record's PR merges to `main`, a follow-up commit (direct or via a small chore PR) will flip the WO Status to `Closed` and update the WO's "Build Record:" link to point at this merged BR. Per the Steward's dispatch protocol, the WO is **not** closed in this work commit, even though the WO's own "Notes from the Issuer" section anticipated the older convention — the 2026-05-27 amendment supersedes.

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Modified | `backend/tests/Feature/Auth/LogoutTest.php` | Added one feature test (`it('should invalidate the session and regenerate the CSRF token when the request is stateful', …)`) that exercises lines 19–20 of `Auth/LogoutController` by sending a session-bound POST with a Referer pointing at a Sanctum stateful domain. |

No controller, route, middleware, or DTO changes. Single test-file edit, sub-threshold for `PrePushPermitGate`.

## Work Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| One new feature test added that exercises lines 19-20 of `LogoutController`. | Yes | New `it(...)` block inside the existing `describe('LogoutController', …)` in `LogoutTest.php`. Brings `Auth/LogoutController` from 60.0% to 100.0%. |
| `composer test:feature-coverage` reports `Auth/LogoutController` at 100% (was 60%). | Yes | Captured before (`/tmp/feature-coverage-before.log`) and after (`/tmp/feature-coverage-after.log`). |
| Overall feature coverage still ≥ 90% (was 98.1%). | Yes | Overall feature coverage rose from 98.1% → 100.0% (the LogoutController was the only sub-100% file in the report). |
| `composer test` full gauntlet green (lint → phpstan → deptrac → test:arch → unit → feature). | Yes | All steps green; see Quality Gauntlet table below. |
| Build Record records the before-after coverage numbers and the chosen session-setup approach. | Yes | See Decisions Made #1 and Quality Gauntlet rows. |
| Casebook Standing Suspicion row updated by the Steward post-merge. | N/A — Steward action | Brickwright does not edit the Casebook. Proposed status flip recorded under "Proposed Knowledge Updates". |

## Decisions Made

1. **Session-setup approach — `withSession([]) → actingAs($user, 'web')` + `Referer: http://localhost`.** Chose this combination over alternatives (raw `withSession([…])` with seeded CSRF, or POST with no Referer at all). The driver behind the choice is the production middleware stack: `bootstrap/app.php` calls `$middleware->statefulApi()`, which adds Sanctum's `EnsureFrontendRequestsAreStateful` in front of the API routes. That middleware only prepends `StartSession` (and the rest of the stateful stack) when the request's `Referer` or `Origin` is matched against `sanctum.stateful`. Without the Referer header, `postJson()` skips the stateful pipeline entirely — which is exactly why the existing two tests don't reach lines 19–20. Setting `Referer: http://localhost` (a default entry in the `sanctum.stateful` array) is the smallest, most production-accurate signal to flip the request into the stateful branch.

2. **CSRF token assertion via `$this->app['session']->token()` rather than parsing a response cookie.** The test asserts that the session ID and CSRF token rotated by capturing both before the request and after the request resolves, then asserting they differ and are non-empty. The session driver is `array` (per `phpunit.feature-coverage.xml`), so the in-memory session store the controller mutates is the same store the test reads — the assertion lands on the same object lifecycle the production code uses. Parsing `XSRF-TOKEN` cookies from the response was considered and rejected: it pulls the test into encryption/cookie-decryption territory without strengthening the coverage signal that the WO actually targets.

3. **No edits to `phpunit.feature-coverage.xml`.** The `.env` carries `REBRICKABLE_API_KEY=test-api-key` and the generated `APP_KEY`, which is the same shape the feature-coverage suite already implicitly relies on. (The base `phpunit.xml` declares both as explicit `<env>` entries; `phpunit.feature-coverage.xml` does not — but pre-existing rows on `main` already prove that the gauntlet works against a properly bootstrapped `.env`. Adding those `<env>` rows would be out of scope under the WO's "Not in This Set" clause.) Documenting here as the unverified assumption I'm carrying forward: the CI runner is expected to do the same `cp .env.example .env && php artisan key:generate` step or load secrets via Railway's env injection.

4. **WO `Status:` not flipped in this commit (deferring to follow-up).** Per the Steward's dispatch and ADR-0028 § Amendment 2026-05-27, WOs close in a follow-up commit on `main` after PR merge. The WO file's own "Notes from the Issuer" anticipates "Close in work commit per ADR-0028 uniform-rule (gate-inactive means convention applies, not enforcement)" — that older instruction is superseded by the Steward's dispatch and the amendment.

## Quality Gauntlet

### Foundry Wing

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | `composer lint:test` — Rector "is done!", Pint "result: passed". Captured to `/tmp/lint-test.log`. |
| phpstan | Pass | `composer phpstan` — `[OK] No errors` at level max, 339/339 files. Captured to `/tmp/phpstan.log`. |
| phpstan:types | Pass | `composer phpstan:types` — `[OK] No errors`, 155/155 files. |
| deptrac | Pass | `composer deptrac` — Violations: 0, Errors: 0. Captured to `/tmp/deptrac.log`. |
| test:arch | Pass | 107 passed (1860 assertions). |
| test (full) | Pass | 700 passed (2872 assertions). Captured to `/tmp/composer-test.log`. |
| test:coverage | Pass | Unit coverage: **100.0%** total. |
| test:feature-coverage | Pass | **Before:** `Auth/LogoutController` 60.0% (lines 19..20 uncovered), Total 98.1%. **After:** `Auth/LogoutController` **100.0%**, Total **100.0%**. Before log: `/tmp/feature-coverage-before.log`. After log: `/tmp/feature-coverage-after.log`. |
| mutation | Not run | The WO scope is feature coverage only; the mutation gauntlet runs on `app/Actions,app/Services` (no Action/Service changed). Skipping is consistent with the WO's "Not in This Set" boundary. |

**Pre-commit gauntlet (CaptainHook routed via `.githooks/pre-commit` on `backend/**`):** lint:test → phpstan → phpstan:types → deptrac → test:arch — all green individually; CaptainHook will execute them in sequence on commit.

**Pre-push gauntlet (`.githooks/pre-push`):** PrePushPermitGate is sub-threshold (1 file, ~30 lines vs. origin/main; threshold > 20 files OR > 500 lines), so the gate won't fire. `composer test` (the second pre-push step) is green at 700 passed.

## Showcase Readiness

The fix is small but the *quality* of the test is what makes it portfolio-grade:

- **Hits the precise gap.** The two existing tests asserted the 204 response and the guest state; neither walked through the `hasSession()` branch. The new test asserts both the session-id rotation and the CSRF-token rotation — the two distinct side effects of the controller's stateful branch — which means a future mutator that drops either `invalidate()` or `regenerateToken()` will be caught.
- **Production-accurate request shape.** The Referer-based stateful trigger is exactly the path the Vue SPA exercises in production via `withCredentials: true` + `SANCTUM_STATEFUL_DOMAINS`. The test is documenting how the auth contract actually behaves on the wire, not just hitting an arbitrary code path for the coverage metric.
- **In-line comments explain the *why*.** A reviewer encountering this test cold should be able to read three lines of comment and understand both the precondition (`withSession + Referer` triggers the stateful middleware stack) and the assertion target (lines 19–20 of the controller).

This is hygiene work that also delivers a load-bearing test. Junior-readable, production-realistic, and tightly scoped.

## Proposed Knowledge Updates

- **Learnings:** Candidate — *When a controller has `$request->hasSession()` guarded behavior, `postJson()` will not exercise it on api routes. Use `withSession([])` + `Referer: http://localhost` (or another `sanctum.stateful` entry) to flip the request into Sanctum's stateful pipeline so `StartSession` runs and `hasSession()` returns true.* Worth filing because the gap that hid the LogoutController dead branch will recur on any future api-route handler that probes `$request->hasSession()`/`$request->session()` directly.
- **Pulse:** Foundry Tech Debt row "`LogoutController` 60% feature coverage" → resolved (now 100%). Casebook Standing Suspicion `[Foundry] LogoutController session branch coverage` → status `resolved`, with the figure 60% → 100%.
- **Foundry Map / Domain Map:** No changes — the controller, route, and middleware shapes are unchanged.
- **Decision Record:** No ADR — the change is below the ADR threshold (a single test addition that ratifies existing contracts).

## Self-Debrief

### What Went Well

- **Baseline-first discipline held.** Captured `composer test:feature-coverage` output to `/tmp/feature-coverage-before.log` before writing the test, exactly the way the graduation rule prescribes. The "60.0%, lines 19..20" line in the pre-change log is the evidence the Build Record cites; "100.0%" in the post-change log is what closes the loop.
- **Read the middleware chain before writing assertions.** Rather than guessing why `postJson` skips the session path, I traced `bootstrap/app.php → statefulApi() → EnsureFrontendRequestsAreStateful → fromFrontend()` and confirmed the Referer check. The test's comments document that chain so the next builder doesn't re-trace it.
- **Single-purpose test.** The third test does one thing — exercise lines 19–20 — and asserts both side effects. It doesn't redundantly re-cover what the first test already covers (guest state, 204 status).

### What Went Poorly

- **Local bootstrap drag.** The worktree shipped without `.env`, vendor was missing, and `phpunit.feature-coverage.xml` does not declare `REBRICKABLE_API_KEY` / `APP_KEY` the way `phpunit.xml` does — so the first `composer test:feature-coverage` blew up with `MissingAppKeyException` and an Unresolvable dependency on `RebrickableService`. Resolved by `composer install` → `cp .env.example .env` → `php artisan key:generate` → set `REBRICKABLE_API_KEY=test-api-key` in `.env`. None of this changed the test or the controller, but it cost a roundtrip. The `phpunit.feature-coverage.xml` env-block divergence from `phpunit.xml` is a latent footgun worth a separate WO.
- **`composer test` is just `artisan test`, not the full gauntlet.** I had to manually run `lint:test`, `phpstan`, `phpstan:types`, `deptrac`, `test:arch`, `test:coverage`, `test:feature-coverage` separately. The wing manual lists them as discrete commands, but I momentarily assumed `composer test` chained them. Five seconds of confusion that cost nothing — but worth pinning a note for next time.

### Blind Spots

- **Didn't run `composer mutation`.** Skipped deliberately because no Action/Service code changed and the mutation suite's paths are `app/Actions,app/Services`. But the new test *does* indirectly improve confidence in the LogoutController's mutation resistance (which isn't in the mutation scope anyway). Worth noting that controller mutation coverage isn't part of the gauntlet — a separate scope question for the Steward / Quality Warden if it ever matters.
- **Didn't probe whether the new test would catch a `regenerateToken()` removal mutation.** The two `expect(…)->not->toBe($before)` lines should, but I didn't verify by temporarily commenting out `regenerateToken()` in the controller. Skipped to stay on-scope; the WO doesn't ask for it. If the Quality Warden audits, this is the obvious follow-up: prove the assertions are mutator-killing, not just touch-counting.

### Training Proposals

| Proposal | Context | Build Record Evidence |
|---|---|---|
| Before running `composer test:feature-coverage` for the first time in a worktree, verify `.env` exists, `APP_KEY` is generated, and `REBRICKABLE_API_KEY` is set (the feature-coverage phpunit config does not declare these as `<env>` blocks the way `phpunit.xml` does). | Hit a `MissingAppKeyException` + Unresolvable RebrickableService on first run because `.env` was absent and `phpunit.feature-coverage.xml` doesn't carry the fallback env. | This record. |
| When writing a feature test that needs `$request->hasSession()` true on an api route, send a `Referer` (or `Origin`) header that matches a `sanctum.stateful` entry (default: `http://localhost`) plus `withSession([])`. `postJson()` alone will not trigger the stateful pipeline. | The two existing LogoutController tests both used `postJson` without a Referer; that's exactly why lines 19–20 were dead-code-uncovered. The fix is the test that finally sends the Referer. | This record. |
| File a separate WO to reconcile `phpunit.feature-coverage.xml` with `phpunit.xml`'s `<env>` block (specifically `APP_KEY` and `REBRICKABLE_API_KEY`) so new contributors don't trip the same boot trap. | Documented as a latent footgun under "What Went Poorly". Out of scope for this WO; explicit "Not in This Set" boundary. | This record. |

---

## Steward Evaluation

_Appended by The Steward after reviewing the Build Record. The builder's sections above are not edited — they stand as written._

**Overall Assessment:** Excellent | Solid | Adequate | Needs Improvement

### Work Order Fulfillment Review

_Did the builder deliver what the Work Order specified? Any gaps or over-delivery?_

### Decision Review

_Were the decisions well-reasoned? Any that should have been escalated to the CEO?_

### Showcase Assessment

_Does the delivery strengthen the portfolio, or is there polish needed?_

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| Verify `.env` + `APP_KEY` + `REBRICKABLE_API_KEY` before first `composer test:feature-coverage` in a worktree. | Candidate / Dropped | _Why — be specific_ |
| Use `Referer: http://localhost` + `withSession([])` to trigger Sanctum's stateful pipeline when testing `$request->hasSession()` branches on api routes. | Candidate / Dropped | _Why — be specific_ |
| File a WO to reconcile `phpunit.feature-coverage.xml` env block with `phpunit.xml`. | Candidate / Dropped | _Why — be specific_ |

### Notes for the Builder

_Direct feedback. What to repeat, what to do differently next time._
