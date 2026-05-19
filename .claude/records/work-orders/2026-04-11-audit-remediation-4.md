# Shipping Order: Audit Remediation Round 4

**Order #:** 2026-04-11-audit-remediation-4
**Filed:** 2026-04-11
**Issued By:** Logistics Director
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Remediate all findings from the 2026-04-11 post-delivery audit. One medium (ADR-0003 documentation gap) and five lows (doc housekeeping across CLAUDE.md, CI, and pulse).

## Scope

### In the Crate

1. **ADR-0003 amendment** — add `StartImportAction` as a third approved try-catch variant: "race-condition guard — catch `UniqueConstraintViolationException` to re-throw as a domain exception when concurrent insert wins the race. Does not retry." (Finding 1, medium)
2. **CLAUDE.md Boundary Fences** — update "Nine layers" to reflect actual layer count; add `Job` layer and `Action → Job` dependency; add `Job → Action, Model, Enum` (Finding 2, low)
3. **CLAUDE.md ADR count** — "Ten decisions" → "Eleven decisions" at line 252 (Finding 3, low)
4. **CI step label** — `.github/workflows/ci.yml` line 154: "99% coverage" → "100% coverage" (Finding 4, low)
5. **Pulse refresh** — update ADR count (11), test count, recent deliveries narrative, assessed date to 2026-04-11 (Finding 5, low)

### Not on This Pallet

- No production code changes
- No retroactive shift logs for the security hardening PR (acknowledged as CEO oversight, not a sorter responsibility)
- No new tests required — all changes are documentation/config only

## Acceptance Criteria

- [ ] ADR-0003 lists `StartImportAction` as a third try-catch variant with clear description of the race-condition guard pattern
- [ ] CLAUDE.md Boundary Fences section matches `deptrac.yaml` layer count and dependencies
- [ ] CLAUDE.md ADR count prose matches the table (eleven)
- [ ] CI step label at line 154 says "100%" not "99%"
- [ ] Pulse reflects 11 ADRs, current test count, and mentions security hardening + GetFamilyPartsAction fix in recent deliveries
- [ ] `composer phpstan` passes (no type errors introduced)
- [ ] Shift log filed upon completion

## References

- Audit Report: `.claude/records/inspections/2026-04-11-post-delivery-sweep.md`
- Related Order: `.claude/records/permits/2026-03-31-audit-remediation-3.md`
- ADR-0003: `docs/adr/0003-actions-and-services-separation.md`

## Notes from the Issuer

All changes are doc/config only — no production code, no test changes. The ADR-0003 amendment is the most important item: the race-condition guard pattern needs to be distinguished clearly from the existing upsert-retry pattern. Reference the existing two patterns in the ADR and add the third alongside them, not as a footnote.

For the pulse refresh: get the actual test count from the test suite if possible, otherwise use the CI-verified count from the most recent merge.

---

**Status:** Completed
**Shift Log:** `.claude/records/journals/2026-04-11-audit-remediation-4.md`
