# Shipping Order: Test Gap Sweep — Missing Factory, Resource Tests, and Policy Test

**Order #:** 2026-03-29-test-gap-sweep
**Filed:** 2026-03-29
**Issued By:** CEO (with Logistics Director backlog review)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Close the remaining test coverage gaps identified during the 2026-03-29 backlog review: a missing model factory, three missing ResourceData unit tests, and one missing policy test method. All items are straightforward test additions with no architectural decisions required.

## Scope

### In the Crate

1. **Create `SetPartFactory`** — the only model without a corresponding factory. Must follow existing factory conventions (see `StorageOptionPartFactory` for a similar junction-table factory pattern).

2. **Add unit tests for 3 untested ResourceData classes:**
   - `BrickDnaResourceDataTest` — tests `BrickDnaResourceData::from()` with a `BrickDnaData` DTO
   - `FamilySetCompletionResourceDataTest` — tests `FamilySetCompletionResourceData::from()` with a `FamilySetCompletionData` DTO
   - `InviteCodeResourceDataTest` — tests `InviteCodeResourceData::from()` with an `InviteCode` model

   Follow the pattern established by existing ResourceData tests (e.g., `FamilyStatsResourceDataTest`, `StorageOptionResourceDataTest`). The first two extend `ComputedResourceData`; the third extends `ResourceData`.

3. **Add `viewStorageMap` test to `SetPolicyTest`** — currently covers 2 of 3 public methods. Add dataset entries for the missing method following the existing test pattern.

### Not on This Pallet

- Documentation updates (CLAUDE.md thresholds, exception list, pulse refresh) — separate order
- Architecture changes or new ADRs
- Refactoring existing tests
- Seeder TODO cleanup

## Acceptance Criteria

- [ ] `SetPartFactory` exists in `database/factories/` and can produce valid `SetPart` records
- [ ] `BrickDnaResourceDataTest` exists and verifies `from()` output shape
- [ ] `FamilySetCompletionResourceDataTest` exists and verifies `from()` output shape
- [ ] `InviteCodeResourceDataTest` exists and verifies `from()` output shape
- [ ] `SetPolicyTest` covers all 3 public methods (`view`, `viewParts`, `viewStorageMap`)
- [ ] Full quality gauntlet passes: `composer lint:test && composer phpstan && composer deptrac && composer test`
- [ ] No existing tests broken

## References

- Decision: ADR-0010 (ComputedResourceData — relevant to the two DTO-sourced resource tests)
- Decision: ADR-0006 (ResourceData conventions — relevant to InviteCodeResourceData test)
- Related: 2026-03-27 post-delivery audit (identified items 2-5)

## Notes from the Issuer

The two `ComputedResourceData` tests (`BrickDna`, `FamilySetCompletion`) should verify the `from()` factory accepts the correct DTO type and produces the expected array shape. These classes were migrated to `ComputedResourceData` in the ADR-0010 implementation — the tests should confirm the new base class works correctly.

For `SetPartFactory`, check `SetPart` model relationships (set, part, color) and ensure the factory wires all three foreign keys correctly.

---

**Status:** Open
**Shift Log:** _link to shift log when filed_
