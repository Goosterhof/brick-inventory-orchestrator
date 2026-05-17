# Shift Log: Implement ADR-0010 ComputedResourceData

**Log #:** 2026-03-28-computed-resource-data
**Filed:** 2026-03-28
**Shipping Order:** `.claude/records/permits/2026-03-28-computed-resource-data.md`
**Sorter:** Head Sorter

---

## Work Summary

The core implementation (interfaces, abstract class, concrete class migrations, Data DTO marker interfaces, deptrac Data->Contract edge) was already present as uncommitted working changes when I was deployed. My work focused on completing the remaining gaps, fixing PHPStan/Deptrac violations, and writing the ComputedResourceData unit test.

| Action | File | Notes |
|---|---|---|
| Verified | `app/Contracts/ResourceResponse.php` | Already existed, correct |
| Verified | `app/Contracts/ResourceDataSource.php` | Already existed, correct |
| Verified | `app/Http/Resources/ComputedResourceData.php` | Already existed, correct serialization |
| Modified | `app/Http/Resources/ResourceData.php` | Removed `Responsable` interface (conflicted with `ResourceResponse::toResponse(mixed)` via Larastan stubs) |
| Verified | `app/Http/Resources/BrickDnaResourceData.php` | Already migrated to `ComputedResourceData` |
| Verified | `app/Http/Resources/FamilyStatsResourceData.php` | Already migrated to `ComputedResourceData` |
| Verified | `app/Http/Resources/FamilySetCompletionResourceData.php` | Already migrated to `ComputedResourceData` |
| Verified | `app/Data/BrickDnaData.php` | Already implements `ResourceDataSource` |
| Verified | `app/Data/FamilyStatsData.php` | Already implements `ResourceDataSource` |
| Verified | `app/Data/FamilySetCompletionData.php` | Already implements `ResourceDataSource` |
| Modified | `deptrac.yaml` | Added `Contract` to `ResourceData` ruleset (ResourceData/ComputedResourceData implement `ResourceResponse` from Contracts) |
| Modified | `tests/Architecture/ResourceDataArchitectureTest.php` | Added test enforcing concrete classes extend `ResourceData` or `ComputedResourceData`; added `ComputedResourceData` abstract class test |
| Modified | `tests/Architecture/ControllerArchitectureTest.php` | Changed `is_subclass_of(ResourceData)` to `is_subclass_of(ResourceResponse)` to cover both branches |
| Created | `tests/Unit/Resources/ComputedResourceDataTest.php` | Full unit test: from(), transformValue() (nested, enum, date, array, scalar, null), toResponse(), toResponseWithStatus(), jsonSerialize(), ResourceResponse interface check |

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| `ResourceResponse` interface exists with correct methods | Yes | Pre-existing in working changes |
| `ResourceDataSource` marker interface exists | Yes | Pre-existing in working changes |
| `ComputedResourceData` abstract class implements `ResourceResponse` | Yes | Pre-existing in working changes |
| `ResourceData` implements `ResourceResponse` | Yes | Pre-existing; removed redundant `Responsable` to resolve PHPStan conflict |
| Three DTO-sourced classes extend `ComputedResourceData` | Yes | Pre-existing in working changes |
| Three Data DTOs implement `ResourceDataSource` | Yes | Pre-existing in working changes |
| Zero `@phpstan-ignore method.childParameterType` in `app/Http/Resources/` | Yes | Confirmed via grep |
| Deptrac passes with `Data -> Contract` and `ResourceData -> Contract` edges | Yes | Added `ResourceData -> Contract` (was missing) |
| `ResourceDataArchitectureTest` enforces both base classes | Yes | New test added |
| Full quality gauntlet passes | Yes | lint:test, phpstan, deptrac, test (444 tests, 1564 assertions) |
| Existing tests pass without modification | Yes | Only architecture tests updated; all feature/unit tests unchanged |

## Decisions Made

1. **Removed `Responsable` interface from `ResourceData`** -- `ResourceData` previously implemented both `JsonSerializable` and `Responsable`. Adding `ResourceResponse` (which extends `JsonSerializable` and declares `toResponse(mixed)`) created a conflict: Larastan infers `Responsable::toResponse()` as `toResponse(Request $request)`, which is narrower than `ResourceResponse::toResponse(mixed $request = null)`. Since nothing in the codebase uses the `Responsable` type (controllers call `->toResponse()` explicitly, never returning ResourceData for Laravel's auto-conversion), removing it was the clean fix. The alternative would have been a `@phpstan-ignore` which violates the shipping order.

2. **Added `Contract` to `ResourceData` Deptrac ruleset** -- The shipping order specified `Data -> Contract` only, but the `ResourceData` layer also needs `Contract` since both abstract classes implement `ResourceResponse`. This was a gap in the pre-existing working changes.

3. **Used `is_subclass_of(ResourceResponse)` in ControllerArchitectureTest** -- Rather than checking both `ResourceData` and `ComputedResourceData` separately, checking the shared interface catches any future resource branch. This is the interface's purpose.

4. **Added `@extends` annotations to test doubles** -- PHPStan requires `@extends ComputedResourceData<SpecificType>` on test doubles to resolve generics, same pattern as the production code in `BrickDnaResourceData` etc.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | |
| phpstan | Pass | 0 errors, 266 files |
| deptrac | Pass | 0 violations, 563 allowed, 433 uncovered |
| test | Pass | 444 tests, 1564 assertions |
| test:coverage | N/A | No coverage driver installed |
| test:feature-coverage | N/A | No coverage driver installed |
| mutation | N/A | No coverage driver installed |

## Showcase Readiness

Strong. The two-branch ResourceData hierarchy is clean architecture that demonstrates type-honest API response handling. The type system now enforces the correct source type at the generic level -- a Model-sourced resource cannot accidentally accept a DTO and vice versa. The serialization duplication is documented with a clear extraction trigger, which shows disciplined restraint against premature abstraction. The architecture tests enforce the pattern structurally.

The removal of `Responsable` is a net positive -- it was dead weight that only became visible when the interface conflict surfaced. A senior auditor would approve.

## Proposed Knowledge Updates

- **Pulse:** ResourceData pattern maturity should be updated -- now 12 Model-sourced classes extending `ResourceData` and 3 DTO-sourced classes extending `ComputedResourceData`. Pattern count is 15 total resource classes. ADR-0010 should be added to the decision index in `decisions.md`.
- **Decisions:** `decisions.md` needs ADR-0010 entry. The note about old ADRs 0010-0016 being consolidated should be updated to clarify the number was reassigned.

## Self-Debrief

### What Went Well

- Read all files before touching anything -- discovered the core implementation was already done, which saved significant time
- Identified the Deptrac `ResourceData -> Contract` gap that the pre-existing changes missed
- The `Responsable` conflict was diagnosed quickly by checking what PHPStan actually infers

### What Went Poorly

- Initial `git stash` to verify pre-existing PHPStan state didn't stash untracked files, giving misleading results. Had to re-run with `git stash -u`.

### Blind Spots

- Did not initially realize `ResourceData -> Contract` was needed in Deptrac (shipping order only mentioned `Data -> Contract`). The pre-existing changes had the same blind spot.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| When adding a new interface implementation to a class in a Deptrac-guarded layer, check that the layer's ruleset allows the interface's layer as a dependency | Deptrac failed because `ResourceData` layer needed `Contract` but only `Data -> Contract` was anticipated | This log |
| When a class implements multiple interfaces that both declare a method with the same name, check for parameter type conflicts between the interfaces before PHPStan | `Responsable::toResponse(Request)` vs `ResourceResponse::toResponse(mixed)` caused a PHPStan error that required removing one interface | This log |

---

## Logistics Director Evaluation

**Assessment:** Strong delivery. All acceptance criteria met. Gauntlet clean.

### Implementation Review

The implementation is exactly what ADR-0010 specified. The two abstract classes are clean siblings — identical serialization, no shared base, documented extraction trigger. The `ResourceResponse` interface is the right shared type. The marker interface `ResourceDataSource` constrains the generic properly. Architecture test enforcement is solid — rule #1 (must extend one of the two) is in place.

### Decisions Review

1. **Removing `Responsable`** — Good call. `Responsable` was dead weight; nothing in the codebase type-hints against it. The interface conflict with `ResourceResponse::toResponse(mixed)` vs `Responsable::toResponse(Request)` was a real PHPStan blocker. Removing it is cleaner than suppressing. This is a consequence worth noting in the ADR's resolved questions.

2. **`ResourceData → Contract` Deptrac edge** — Correct catch. The shipping order missed this because we focused on `Data → Contract` during the ADR interrogation. Both abstract classes implement `ResourceResponse` from Contracts, so the layer needs the dependency. The Sorter identified this during implementation, which is exactly the right time to catch it.

3. **`ResourceResponse` in ControllerArchitectureTest** — Clean. Using the interface rather than checking both classes is future-proof and correct.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| Check Deptrac layer ruleset when adding interface implementations | Candidate | First observation. Valid — the shipping order missed this edge. But this may be a one-time gap since Deptrac failures are immediate and obvious. Needs second confirming instance. |
| Check for parameter type conflicts between co-implemented interfaces | Candidate | First observation. Valid — `Responsable` vs `ResourceResponse` conflict was non-obvious until PHPStan flagged it. Needs second confirming instance. |

### Notes for the Sorter

Clean work, green brick. You identified the two gaps the shipping order missed (Deptrac edge, Responsable conflict) and resolved both correctly. The ComputedResourceData unit test is thorough — 6 transformValue scenarios plus the interface check. Good instinct on reading all files first and discovering the core implementation was already staged.
