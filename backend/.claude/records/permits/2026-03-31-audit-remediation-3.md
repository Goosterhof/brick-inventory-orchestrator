# Shipping Order: Audit Remediation — 2026-03-30 Full Sweep

**Order #:** 2026-03-31-audit-remediation-3
**Filed:** 2026-03-31
**Issued By:** Logistics Director
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Remediate all six findings from the 2026-03-30 full sweep audit. One medium (untested policy method), four low doc drift items, and one low convention gap.

## Scope

### In the Crate

1. **Finding 1 (medium):** Add `viewImportStatus` to `FamilySetPolicyTest` always-allow dataset
2. **Finding 2 (low):** Add ADR-0010 (`ComputedResourceData`) to `.claude/docs/decisions.md` Decision Index
3. **Finding 3 (low):** Update CLAUDE.md quality thresholds to match composer.json (feature coverage 80%→90%, mutation 75%→76%)
4. **Finding 4 (low):** Update `.claude/docs/pulse.md` — arch test count (18→19), test count (417→512), cursor pagination scope
5. **Finding 5 (low):** Add `implements BelongsToFamilyInterface` to `InviteCode` model with `getFamilyId()` method
6. **Finding 6 (low):** Append addendum to `2026-03-28-cursor-pagination.md` shift log documenting the partial revert

### Not on This Pallet

- No new architecture tests (InviteCode interface enforcement is a future ADR decision)
- No coverage driver installation
- No changes to Deptrac configuration
- No learnings.md population (separate effort)

## Acceptance Criteria

- [ ] `FamilySetPolicyTest` covers all 8 public methods (including `viewImportStatus`)
- [ ] `decisions.md` lists ADR-0010 with correct date and status
- [ ] CLAUDE.md states 90% feature coverage and 76% mutation minimum
- [ ] `pulse.md` reflects 19 arch test files, 512 tests, and accurate cursor pagination scope
- [ ] `InviteCode` implements `BelongsToFamilyInterface` with working `getFamilyId()`
- [ ] Cursor pagination shift log has addendum noting the partial revert
- [ ] Full quality gauntlet passes: lint, phpstan, deptrac, test:arch, test

## References

- Audit Report: `.claude/records/inspections/2026-03-30-full-sweep-post-delivery.md`
- Related Order: `.claude/records/permits/2026-03-26-audit-remediation-2.md` (prior remediation)

## Notes from the Issuer

Finding 1 is the priority — it's the only medium and closes a real test gap. The doc drift items (2–4, 6) are straightforward updates. Finding 5 requires reading the existing `BelongsToFamilyInterface` contract and matching the pattern from `FamilySet`, `StorageOption`, and `ImportJob`.

For the cursor pagination addendum (Finding 6), keep it factual: what was reverted, which commits, and the current state. No need to speculate on why — the code speaks for itself.

---

**Status:** Completed
**Shift Log:** `.claude/records/journals/2026-03-31-audit-remediation-3.md`
