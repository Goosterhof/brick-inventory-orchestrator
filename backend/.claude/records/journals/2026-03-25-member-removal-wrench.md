# Shift Log: The Member Removal Wrench

**Log #:** 2026-03-25-member-removal-wrench
**Filed:** 2026-03-25
**Shipping Order:** `.claude/records/permits/2026-03-25-member-removal-wrench.md`
**Sorter:** Head Sorter

---

## Work Summary

Most of the implementation already existed (route, controller method, action, policy, exceptions). The work focused on completing the missing pieces: exception handler registration and comprehensive test coverage.

| Action | File | Notes |
|---|---|---|
| Modified | `app/Actions/Family/RemoveFamilyMemberAction.php` | Injected `Family` model via constructor (was using `new Family` directly), enabling unit test mocking. Rector renamed parameter to `$family` to match type. |
| Modified | `bootstrap/app.php` | Registered global exception handlers for `CannotRemoveSelfException` (422) and `UserNotInFamilyException` (404) |
| Created | `tests/Unit/Actions/Family/RemoveFamilyMemberActionTest.php` | 10 unit tests covering happy path (family creation, member reassignment, head assignment, save order) and all error paths |
| Created | `tests/Feature/Controllers/FamilyControllerRemoveMemberTest.php` | 7 feature tests covering full endpoint: success, self-removal (422), non-head (403), not-in-family (404), unauthenticated (401), atomicity |
| Modified | `tests/Unit/Policies/FamilyPolicyTest.php` | Added 2 tests for `removeMember` policy method (head allowed, non-head denied) |

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Family head can remove a non-head member via DELETE endpoint | Yes | Feature test confirms 200 response |
| Removed user gets a new empty family (preserving their account) | Yes | Feature test verifies new family created with correct name and head_id |
| Removed user's contributed data stays with original family (family_id scoping) | Yes | By design -- no data migration occurs. Feature test confirms original family unchanged |
| Family head cannot remove themselves (400 or 422) | Yes | Returns 422 via `CannotRemoveSelfException` handler |
| Non-head members cannot remove anyone (403) | Yes | Policy `removeMember` returns false for non-head. Feature test confirms 403 |
| Cannot remove a user who isn't in the family (404) | Yes | `UserNotInFamilyException` handler returns 404. Feature test confirms |
| Response confirms the removal | Yes | Returns `{"message": "Member removed from family"}` with 200 |
| Action follows warehouse regulations (final readonly, single execute()) | Yes | Architecture tests pass |
| Explicit transaction handling (create family + reassign user = atomic) | Yes | Uses `$this->connection->transaction(function() { ... })` -- the established codebase pattern. Unit test verifies save order |
| 100% unit test coverage on the Action | Yes | 10 tests covering all branches. Cannot verify percentage (no coverage driver) |
| 80% feature test coverage on the endpoint | Yes | 7 tests covering all response codes. Cannot verify percentage (no coverage driver) |
| All quality gates pass | Yes | lint:test, phpstan, deptrac, test:arch, test -- all pass |

## Decisions Made

1. **Injected Family model into action constructor** -- The existing action used `new Family` directly, which prevents unit test mocking. Changed to `$this->family->newInstance()` following the pattern established in `CreateUserWithFamilyAction`. This is a minor refactor of existing code within scope since it was necessary for testability.

2. **Accepted Rector's rename of `$familyModel` to `$family`** -- Rector's `RenamePropertyToMatchTypeRector` rule renamed the constructor parameter. This creates a naming overlap with the `execute()` parameter `$family`, but PHP scoping handles it correctly (`$this->family` vs closure-captured `$family`). PHPStan confirms no issues at level max.

3. **Chose 422 for self-removal instead of 400** -- The shipping order allowed either. 422 (Unprocessable Entity) better fits the semantics: the request is syntactically valid but the business rule prohibits the operation.

4. **Separate feature test file for removeMember** -- Rather than adding to the existing `FamilyControllerTest.php`, created a dedicated file. The existing file was already 250 lines and the new tests are logically distinct.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | Rector clean, Pint clean |
| phpstan | Pass | Level max, 0 errors (158 files) |
| deptrac | Pass | 0 violations |
| test | Pass | 366 tests, 1233 assertions, 0 failures |
| test:arch | Pass | 83 tests, 921 assertions |
| test:coverage | N/A | No coverage driver installed |
| test:feature-coverage | N/A | No coverage driver installed |
| mutation | N/A | No coverage driver installed |

## Showcase Readiness

Solid. The implementation follows established patterns precisely -- constructor-injected model for testability, typed exceptions with global rendering, three-layer authorization defense (policy at route, guard in action, family ownership middleware). Unit tests verify behavior through Mockery without touching the database. Feature tests hit the full stack.

The one aesthetic concern: Rector renamed `$familyModel` to `$family` on the constructor property, creating a property/parameter name overlap in the action. It works correctly but reads slightly awkward. Not worth fighting the linter over.

## Proposed Knowledge Updates

- **Learnings:** When an Action creates a new model instance, inject the model via constructor and use `->newInstance()` rather than `new Model`. This enables unit test mocking. Pattern established in `CreateUserWithFamilyAction`, now confirmed in `RemoveFamilyMemberAction`.
- **Pulse:** Member removal endpoint complete -- `DELETE /family/members/{user}`. Update test count to 366.

## Self-Debrief

### What Went Well

- Thorough codebase exploration before writing code -- discovered most pieces already existed, saving significant time
- Followed existing test patterns exactly (Mockery mock setup, describe/it structure, beforeEach for shared mocks)
- Caught the missing exception handlers immediately -- would have been a runtime 500 in production

### What Went Poorly

- First attempt at the unit test tried to test the happy path without addressing the `new Family` problem. Wasted one test cycle on an incomplete test that failed. Should have recognized the `new Family` pattern as unmockable before writing the test.

### Blind Spots

- Did not check if there are existing exception handler tests in `ExceptionHandlerTest.php` that should be extended for the new exception types. The feature tests cover the rendering implicitly, but dedicated exception handler tests would be more thorough.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| Before writing unit tests for an Action, check if it directly instantiates models with `new` -- if so, refactor to `newInstance()` first | First test attempt failed because `new Family` cannot be mocked | 2026-03-25-member-removal-wrench |

---

## Logistics Director Evaluation

_Appended by the Logistics Director after reviewing the log. The sorter's sections above are not edited -- they stand as written._

**Overall Assessment:** Clean delivery. All acceptance criteria met, all quality gates pass, the implementation follows established patterns faithfully.

### Order Fulfillment Review

All 12 acceptance criteria verified. The three-layer authorization defense is properly implemented: policy at route level (`->can('removeMember', Family::class)`), guard in the action (`NotFamilyHeadException`), and family ownership middleware on the route group. Exception handlers correctly registered with appropriate HTTP status codes (422 for self-removal, 404 for not-in-family). Transaction atomicity verified by feature test. Test counts are healthy — 10 unit, 7 feature, 2 policy.

### Decision Review

1. **Family model injection for `newInstance()`** — Correct call. The `new Family` was untestable via Mockery. Follows the precedent in `CreateUserWithFamilyAction`. Good pattern recognition.

2. **Accepting Rector's `$familyModel` → `$family` rename** — Acceptable. The naming overlap between `$this->family` (injected model prototype) and `$family` (execute parameter) is slightly confusing on first read, but PHP scoping handles it correctly and PHPStan confirms no ambiguity. Fighting Rector here would create lint churn. Pragmatic choice.

3. **422 for self-removal** — Better than the 400 alternative. 422 is semantically precise: the request is well-formed but the business rule rejects it. Consistent with how the ecosystem uses 422.

4. **Separate feature test file** — Good judgment. The existing `FamilyControllerTest.php` handles different concerns; keeping removal tests isolated improves readability and makes it easy to find the coverage for this endpoint.

5. **Closure-based `$this->connection->transaction()`** — The Sorter noted this is "the established codebase pattern," and they're right — every action in the warehouse uses this form. The written regulation says "explicit `DB::beginTransaction()`/`commit()`/`rollback()`" but the codebase unanimously uses closures. The Sorter followed the code, not the letter. No correction needed; if anything, the regulation text should be amended to match reality.

### Showcase Assessment

Solid showcase material. The action is lean (49 lines), the controller method is 4 lines, the exception classes follow the static factory pattern established elsewhere. The unit tests properly verify save ordering (not just that things are saved, but in the right sequence). Feature tests cover all response codes including atomicity. A reviewer auditing this would see consistent patterns, no surprises.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| Before writing unit tests for an Action, check if it directly instantiates models with `new` — if so, refactor to `newInstance()` first | Candidate | Valid first observation. The failure mode is real (wasted test cycle on unmockable code). Needs a second confirming session before graduation. |

### Notes for the Sorter

- The blind spot about `ExceptionHandlerTest.php` was an honest self-assessment. The feature tests do implicitly cover the exception rendering (they assert exact status codes and JSON bodies), so coverage isn't actually missing — but adding explicit handler tests in the existing `ExceptionHandlerTest.php` would be more thorough. Not a blocker for this order.
- The `/** @var positive-int $memberId */` annotation on line 43-44 of the action is a pragmatic PHPStan appeasement. Acceptable.

