# Work Order: Foundry — Enforce BelongsToFamilyInterface via Arch Test (ADR-0014 Open Question)

**Work Order #:** 2026-05-29-family-id-belongs-archtest
**Filed:** 2026-05-29
**Issued By:** CEO (via 2026-05-29 cross-wing sweep follow-up)
**Assigned To:** Brickwright
**Wing:** Foundry
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `family-id-belongs-archtest`

---

## The Job

Sweep ADR-pressure signal **F-adr-0014-1** (resolves an ADR-0014 Open Question): the rule "models with a `family_id` column must implement `BelongsToFamilyInterface`" is convention-only — no architecture test enforces it. Three consecutive Foundry cycles have verified it holds (currently 5 models reference `family_id` — FamilySet, User, StorageOption, InviteCode, ImportJob — and 4 implement the interface; User is the documented exemption). This is the cheap moment to convert the convention into mechanical enforcement and close ADR-0014's Open Question.

## Scope

### In the Box

1. Add an architecture test (in `tests/Architecture/`) asserting that every Eloquent model with a `family_id` column implements `BelongsToFamilyInterface`, with `User` on an explicit allowlist (documented exemption).
2. Verify the test fails if the allowlist is removed or a non-implementing `family_id` model is introduced.
3. Note in the Build Record that ADR-0014's Open Question ("should an architecture test enforce this?") is now resolved Yes, for the Steward to reflect in decisions.md.

### Not in This Set

- Changing any model's interface implementation (the convention already holds).
- Editing ADR-0014 itself (decisions.md is Steward territory) — produce the closure text for the Steward.

## Acceptance Criteria

- [ ] Arch test enforces `family_id` → `BelongsToFamilyInterface` with `User` allowlisted.
- [ ] Test proven to fail on a synthetic violation.
- [ ] Backend gauntlet green (lint:test, phpstan, deptrac, test:arch, test).
- [ ] Build Record carries the ADR-0014 Open-Question closure text for the Steward.

## References

- Audit: [`2026-05-29-warden-cross-wing-sweep`](../audits/2026-05-29-warden-cross-wing-sweep.md) — finding F-adr-0014-1 / ADR Pressure
- ADR-0014 (Domain-Driven structure — the Open Question)

---

**Status:** Open
