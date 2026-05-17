# Shipping Order: Implement ADR-0010 ComputedResourceData

**Order #:** 2026-03-28-computed-resource-data
**Filed:** 2026-03-28
**Issued By:** CEO
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Implement ADR-0010: split the ResourceData layer into two sibling abstract classes (`ResourceData` for Model-sourced responses, `ComputedResourceData` for DTO-sourced responses) sharing a `ResourceResponse` interface. Migrate the three existing DTO-sourced classes and eliminate all `@phpstan-ignore method.childParameterType` suppressions.

## Scope

### In the Crate

- Create `ResourceResponse` interface in `App\Contracts`
- Create `ResourceDataSource` marker interface in `App\Contracts`
- Create `ComputedResourceData` abstract class in `App\Http\Resources`
- Refactor `ResourceData` to implement `ResourceResponse`, extract serialization into both classes
- Migrate `BrickDnaResourceData`, `FamilyStatsResourceData`, `FamilySetCompletionResourceData` to extend `ComputedResourceData`
- Add `implements ResourceDataSource` to `BrickDnaData`, `FamilyStatsData`, `FamilySetCompletionData`
- Update Deptrac: add `Data → Contract` dependency
- Update `ResourceDataArchitectureTest`: enforce concrete classes extend one of the two abstract classes
- Update architecture test references from `ResourceData::class` to `ResourceResponse` interface where applicable
- Add duplication trigger comment in both abstract classes
- All `@phpstan-ignore method.childParameterType` suppressions removed

### Not on This Pallet

- No new endpoints or features
- No `collection()` method on `ComputedResourceData` (resolved in ADR — not needed)
- No extraction of shared serialization (trigger is a third variant, not now)
- No CLAUDE.md updates (separate housekeeping — audit findings)

## Acceptance Criteria

- [ ] `ResourceResponse` interface exists in `App\Contracts` with `toArray`, `jsonSerialize`, `toResponse`, `toResponseWithStatus`
- [ ] `ResourceDataSource` marker interface exists in `App\Contracts`
- [ ] `ComputedResourceData` abstract class exists, implements `ResourceResponse`, generic on `ResourceDataSource`
- [ ] `ResourceData` implements `ResourceResponse`, retains all Model-specific machinery
- [ ] Three DTO-sourced classes extend `ComputedResourceData` instead of `ResourceData`
- [ ] Three Data DTOs implement `ResourceDataSource`
- [ ] Zero `@phpstan-ignore method.childParameterType` in `app/Http/Resources/`
- [ ] Deptrac passes with `Data → Contract` edge
- [ ] `ResourceDataArchitectureTest` enforces concrete classes extend either `ResourceData` or `ComputedResourceData`
- [ ] Full quality gauntlet passes: lint, PHPStan, Deptrac, test suite, architecture tests
- [ ] Existing tests continue to pass without modification (or with minimal type-reference updates)

## References

- Decision: [ADR-0010](../../docs/adr/0010-computed-resource-data.md)
- Parent ADR: [ADR-0006](../../docs/adr/0006-dto-form-requests-and-resource-data.md)
- Audit Finding: 2026-03-27-post-delivery-audit Finding 1

## Notes from the Issuer

The ADR was stress-tested through the interrogator. The design is settled — no open questions that would block implementation. Key thing to get right: the serialization duplication should be clean copy, not divergent. Both abstract classes must have identical `toArray`, `transformValue`, `jsonSerialize`, `toResponse`, `toResponseWithStatus`. Add a comment in both marking the extraction trigger.

---

**Status:** Open
**Shift Log:** _link to shift log when filed_
