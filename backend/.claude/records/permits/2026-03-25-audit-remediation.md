# Shipping Order: Audit Remediation — Baseline Findings

**Order #:** 2026-03-25-audit-remediation
**Filed:** 2026-03-25
**Issued By:** Logistics Director (CEO-approved)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Remediate the 2 high, 1 medium, and 3 low findings from the baseline audit (2026-03-25-full-sweep-baseline). These are the findings blocking showcase-ready status plus quick wins worth bundling.

## Scope

### In the Crate

1. **Register `InvalidApiResponseException` global handler** — add a 502 renderer in `bootstrap/app.php` (Finding #3, HIGH)
2. **Amend ADR-0003 to document partial-failure try-catch exception** — the `ImportOwnedSetsAction` try-catch is intentional; the ADR needs to say so (Finding #1, HIGH)
3. **Fix 4 risky architecture tests** — add counter assertions to eliminate "0 assertions" warnings in `ControllerArchitectureTest` and `PolicyArchitectureTest` (Finding #2, MEDIUM)
4. **Fix `decisions.md` broken ADR-000 link** — either create the ADR-000 file or remove the broken reference (Finding #4, LOW)
5. **Add `viewParts` and `viewStats` tests to `FamilyPolicyTest`** — two trivial tests confirming each returns `true` (Finding #6, LOW)
6. **Write a feature test for the `InvalidApiResponseException` handler** — the new 502 renderer must be tested, not just registered

### Not on This Pallet

- `GetFamilyPartsAction` raw array return (deferred — needs design decision)
- `FamilyController::members()` bespoke `fromFamily()` (deferred — needs design decision)
- Coverage driver installation (environment concern, not code)
- Pulse Action count (already corrected in pulse update)

## Acceptance Criteria

- [ ] `composer test` passes with no new risky tests (net reduction from 4 risky to 0)
- [ ] `composer phpstan` passes at level max with 0 errors
- [ ] `composer deptrac` passes with 0 violations
- [ ] `composer test:arch` passes — architecture tests produce assertions, not just pass-by-absence
- [ ] `InvalidApiResponseException` returns 502 with JSON error body (verified by feature test)
- [ ] ADR-0003 documents the partial-failure resilience pattern as an approved exception to the no-try-catch rule
- [ ] `decisions.md` has no broken links
- [ ] `FamilyPolicyTest` covers all 4 public policy methods

## References

- Audit Report: `.claude/records/inspections/2026-03-25-full-sweep-baseline.md`
- ADR-0003: `docs/adr/0003-actions-services-separation.md`
- Related: ADR-0009 (thin controllers), ADR-0006 (ResourceData pattern)

## Notes from the Issuer

The two highs are the priority. Finding #1 (exception handler) is a correctness bug — get that right first. Finding #2 (ADR amendment) is governance — the code is correct, the documentation needs to catch up. Don't change the `ImportOwnedSetsAction` implementation; amend the ADR to acknowledge the pattern.

For the risky architecture tests, the fix is a counter variable + `expect($checked)->toBeGreaterThan(0)`. Don't over-engineer it.

For the ADR-000 link in `decisions.md`: check if `.claude/docs/decisions.md` references it — if ADR-000 is the "Why This Warehouse Exists" meta-decision, it may be worth creating as a proper ADR file. Use your judgment.

Run the full quality gauntlet before filing the shift log.

---

**Status:** Complete
**Shift Log:** `.claude/records/journals/2026-03-25-audit-remediation.md`
