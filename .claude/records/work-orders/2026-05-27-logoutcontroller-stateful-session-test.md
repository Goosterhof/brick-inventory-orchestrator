# Work Order: LogoutController stateful-session third test

**Work Order #:** 2026-05-27-logoutcontroller-stateful-session-test
**Filed:** 2026-05-27
**Issued By:** The Steward
**Assigned To:** Brickwright
**Wing:** Foundry
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `logoutcontroller-stateful-session-test`

---

## The Job

`Auth/LogoutController` reports 60% feature coverage. Lines 19-20 (`$request->session()->invalidate()` and `$request->session()->regenerateToken()`) are never executed by the existing test suite because `postJson()` does not exercise the session path. The branch behind `if ($request->hasSession())` is auth-critical code — invalidating the session and rotating the CSRF token on logout. Add a third feature test that exercises the stateful path and brings the controller to 100% coverage.

## Scope

### In the Box

- Add one feature test (Pest) to the existing `LogoutControllerTest` (or its file equivalent) that:
  - Sets up a stateful session (e.g., via `actingAs` + a session-bound request shape, or via `withSession([...])` followed by an authenticated POST), so `$request->hasSession()` returns `true` at handler entry.
  - Asserts the session is invalidated (no longer authenticates the prior user) and the CSRF token is regenerated (the token after equals neither pre-call value nor remains empty).
  - Asserts the 204 response shape is unchanged.
- Re-run `composer test:feature-coverage` and verify `Auth/LogoutController` reaches 100%.
- Record the before-after coverage numbers in the Build Record.

### Not in This Set

- No edits to `backend/app/Http/Controllers/Auth/LogoutController.php` (the controller is correct; the test surface is the gap).
- No new exceptions, no new Actions, no new middleware.
- No edits to the feature-coverage threshold or the test scaffolding for `actingAs` / session helpers.
- No bundling with the ADR-0015 list-reconcile WO filed today (separate WO, separate branch).

## Acceptance Criteria

- [ ] One new feature test added that exercises lines 19-20 of `LogoutController`.
- [ ] `composer test:feature-coverage` reports `Auth/LogoutController` at 100% (was 60%).
- [ ] Overall feature coverage still ≥ 90% (was 98.1%).
- [ ] `composer test` full gauntlet green (lint → phpstan → deptrac → test:arch → unit → feature).
- [ ] Build Record records the before-after coverage numbers and the chosen session-setup approach.
- [ ] Casebook Standing Suspicion row for `[Foundry] LogoutController session branch coverage` updated by the Steward post-merge (status → resolved, with the new coverage figure).

## References

- Audit: [`2026-05-26-foundry-pulse-refresh`](../audits/2026-05-26-foundry-pulse-refresh.md) — Finding 1 (medium).
- Casebook (Foundry) Standing Suspicion: `[Foundry] LogoutController session branch coverage`, first noticed 2026-05-26.
- Pulse: Foundry Tech Debt row (Low — doesn't break the gate but auth-critical) and Active Concerns Gallery/Atrium intersect via standup.
- Source: `backend/app/Http/Controllers/Auth/LogoutController.php` lines 18-21.

## Notes from the Issuer

Smallest of today's 5 WOs — one test, one well-defined gap, one clear acceptance criterion. The 60% coverage figure is the standout outlier in an otherwise 98.1% feature-coverage Foundry; closing it is hygiene work that also improves auth-flow confidence.

Sub-threshold push (single backend test file, well under 500 lines). PrePushPermitGate will not fire on this branch — `composer test` still runs. Close in work commit per ADR-0028 uniform-rule (gate-inactive means convention applies, not enforcement).

---

**Status:** Open
**Build Record:** _to be filled when filed_
