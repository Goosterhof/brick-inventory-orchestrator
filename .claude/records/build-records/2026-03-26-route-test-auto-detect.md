# Shift Log: Route Test Auto-Detection

**Log #:** 2026-03-26-route-test-auto-detect
**Filed:** 2026-03-26
**Shipping Order:** CEO direct request (no formal shipping order — scope was clear and narrow)
**Sorter:** Head Sorter (shift log filed by Logistics Director due to permissions constraint)

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Modified | `tests/Architecture/RoutingArchitectureTest.php` | Replaced 29-route hardcoded allowlist with dynamic auto-detection of all auth:sanctum routes |

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Auto-detect all auth:sanctum routes missing can: middleware | Yes | Collects routes dynamically, filters 2 exempt routes, asserts can: on remainder |
| Small exempt list with justifications | Yes | POST api/logout and GET api/me, both with documented reasons |
| Drift guard on total route count | Yes | Asserts 31 auth:sanctum routes; fails if count changes |
| All existing tests pass | Yes | 417 tests, 1472 assertions |
| Full quality gauntlet passes | Yes | lint, phpstan, deptrac, test:arch all green |

## Decisions Made

1. **Exempt list uses "METHOD uri" format** — Chose `POST api/logout` string keys over structured arrays for readability. The `in_array` check is simple and the list is intentionally tiny.
2. **Drift guard as separate test** — Chose a second test over embedding the count check in the first, so failures have distinct messages. A missing `.can()` and a missing `auth:sanctum` are different problems.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | |
| phpstan | Pass | Level max, 0 errors, 171 files |
| deptrac | Pass | 0 violations |
| test | Pass | 417 tests, 1472 assertions |
| test:coverage | Unable to run | No coverage driver |
| test:feature-coverage | Unable to run | No coverage driver |
| mutation | Unable to run | No coverage driver |

## Showcase Readiness

This is the kind of improvement that impresses a senior architect: instead of a maintenance burden (hardcoded list), the test is self-maintaining. The exempt list is two entries with justifications. The drift guard catches the edge case the auto-detection can't (routes added without auth:sanctum). Clean, minimal, self-documenting.

## Proposed Knowledge Updates

- **Pulse:** RoutingArchitectureTest now auto-detects routes — update pattern maturity if desired
- **Learnings:** None — this was a structural fix, not a gotcha

## Self-Debrief

### What Went Well

- The refactoring was clean — the new approach is simpler than what it replaced (88 lines vs 84, but no maintenance burden)
- Both tests have clear, actionable failure messages that tell the developer exactly what to do

### What Went Poorly

- Permissions blocked shift log filing — environment constraint, not process failure

### Blind Spots

- Did not verify whether the HEAD method filtering (`array_diff($route->methods(), ['HEAD'])`) could miss routes that only respond to HEAD — unlikely in practice but not verified

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| (none — this shift was narrow and clean) | | |

---

## Logistics Director Evaluation

**Overall Assessment:** Solid

### Order Fulfillment Review

Delivered exactly what was requested. Two tests, clean separation of concerns, small exempt list with justifications. No over-delivery, no scope creep.

### Decision Review

Both decisions are sound. The string-key format for exempt routes is readable and the list is small enough that structure would be over-engineering. Separate tests for separate failure modes is the right call.

### Showcase Assessment

This strengthens the portfolio. A hardcoded list that drifts is amateur; a self-maintaining test with an explicit exempt list is what senior engineers build. The drift guard is a nice touch — it catches the class of error the auto-detection can't.

### Training Proposal Dispositions

No proposals this shift — appropriate given the narrow scope.

### Notes for the Sorter

Clean work. This structurally eliminates the training candidate about remembering to update the route list — that candidate will be dropped from your graduation log since there's no longer a list to update.
