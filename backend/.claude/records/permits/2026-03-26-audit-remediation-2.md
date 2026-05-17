# Shipping Order: Audit Remediation Round 2

**Order #:** 2026-03-26-audit-remediation-2
**Filed:** 2026-03-26
**Issued By:** Logistics Director
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Remediate all five findings from the 2026-03-26 routine sweep audit. Two medium governance gaps (ADR-0003 try-catch documentation, RoutingArchitectureTest route coverage) and three low items (policy tests, pulse counts, DTO type truthfulness).

## Scope

### In the Crate

- **Finding 1:** Amend ADR-0003 to document the `UniqueConstraintViolationException` upsert try-catch pattern as a second approved exception, referencing the five Actions that use it
- **Finding 2:** Add the five new routes (`GET /family/brick-dna`, `DELETE /family/members/{user}`, `POST /family/invite-code`, `GET /family/invite-code`, `DELETE /family/invite-code`) to the `$routesThatRequireCanMiddleware` array in `RoutingArchitectureTest.php`
- **Finding 3:** Add four unit tests to `FamilyPolicyTest` for `viewBrickDna`, `generateInviteCode`, `viewInviteCode`, and `revokeInviteCode`
- **Finding 4:** Update pulse.md with accurate counts (Action layer: 31, architecture tests: 18 files / 83 passed / 1007 assertions, test suite: 410 tests / 1465 assertions)
- **Finding 5:** Make `RegisterUserData::familyName` nullable (`?string`) and update `RegisterRequest::toDto()` to pass `null` when `family_name` is absent

### Not on This Pallet

- No new features or endpoints
- No refactoring beyond what the findings require
- No changes to the Inventory Auditor's SOPs (already updated by Logistics Director)

## Acceptance Criteria

- [ ] ADR-0003 documents the `UniqueConstraintViolationException` upsert pattern with the five Action references
- [ ] RoutingArchitectureTest covers all 29 routes (24 existing + 5 new)
- [ ] FamilyPolicyTest has tests for all 9 public policy methods
- [ ] Pulse.md reflects accurate counts from the latest audit
- [ ] `RegisterUserData::familyName` is `?string` and `RegisterRequest::toDto()` passes `null` on the invite-code path
- [ ] All existing tests continue to pass
- [ ] Full quality gauntlet passes (lint, phpstan, deptrac, test, test:arch)

## References

- Audit Report: `.claude/records/inspections/2026-03-26-routine-sweep.md`
- Related Order: `.claude/records/permits/2026-03-25-audit-remediation.md` (round 1)
- ADR-0003: `docs/adr/ADR-0003.md`

## Notes from the Issuer

Both medium findings are enforcement gaps, not correctness bugs. The existing code works correctly — we're closing governance and safety-net holes. Finding 5 is the only code behavior change, and it's a type-truthfulness improvement with no runtime impact (the Action already ignores `familyName` on the invite-code path).

The Head Sorter should expect rebuttals on Findings 1 and 2 to be straightforward ACCEPTs — the Auditor's evidence is solid on both.

---

**Status:** Complete
**Shift Log:** `.claude/records/journals/2026-03-26-audit-remediation-2.md`
