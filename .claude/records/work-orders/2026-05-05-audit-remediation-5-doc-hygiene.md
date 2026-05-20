# Shipping Order: Audit Remediation Round 5 — Doc Hygiene

**Order #:** 2026-05-05-audit-remediation-5-doc-hygiene
**Filed:** 2026-05-05
**Issued By:** Logistics Director
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Close out the four documentation/manifest-accuracy findings from the 2026-05-05 full sweep audit (Findings 1–4). All low-severity, all doc/config only — no production code changes. Single coherent pass through CLAUDE.md, the ADR indexes, and the pulse.

## Scope

### In the Crate

1. **CLAUDE.md floor plan ADR count** (Finding 1) — line 116: `9 architecture decisions (consolidated from 16)` → `12 architecture decisions (consolidated from 16)`.
2. **CLAUDE.md Architecture Decision Ledger header** (Finding 1) — line 298: `Eleven decisions that shaped the warehouse` → `Twelve decisions that shaped the warehouse`. Add ADR-0012 row to the Ledger table with its enforcement column.
3. **CLAUDE.md architecture test count** (Finding 3) — line 111: `18 architecture tests` → `21 architecture tests`.
4. **ADR README** (Finding 2) — `docs/adr/README.md`: add ADR-0012 row to the index. Entry: `[0012](0012-tighten-runtime-to-php-85.md) | Tighten runtime to PHP 8.5+ and remove PHP 8.4 fallback | <enforcement column>`.
5. **decisions.md** (Finding 2) — `.claude/docs/decisions.md`: add ADR-0012 row. Entry: `0012 | Tighten runtime to PHP 8.5+ and remove PHP 8.4 fallback | 2026-04-30 | Accepted`.
6. **Pulse comprehensive refresh** (Finding 4) — `.claude/docs/pulse.md`. Director-supplied recommendations from the audit report (Proposed Pulse Updates section, items 1–6) form the baseline:
   - Overall Health: advance assessed date to 2026-05-05; update ADR count to 12, test count to 587 / 2411, PHPStan to "level max, 0 errors on PHP 8.5", note new Mail layer.
   - Active Concerns: mark Laravel 13.7 deprecation cascade Resolved; update `php8.5-pcov` concern (still sudo-gated host install); mark `covers()` mismatch in `CorsConfigTest` Resolved (commit `b01ba2e`); add new concern for two unfilled Director Evaluations (Director will close this concurrently — see Notes).
   - Pattern Maturity: add Mail layer (1 class); update Action layer 35 → 37; ResourceData 18 → 20; add reverse-lookup-lens as third bulk aggregation endpoint; note `FamilyPartUsageResourceData` as latest ComputedResourceData application.
   - Quality Metrics: PHPStan "Level max, 0 errors"; full suite 587 / 2411; coverage measured 2026-04-29 via PHP 8.4 shim (100% / 76.97% MSI); note canonical-PHP measurement still gated on host pcov install.
   - In-Progress Work: add all twelve recent completions (L13 upgrade, DTO migration, warroom PHPStan rules, PCOV install, PHP 8.5 alignment, L13.7 cleanup, reverse-lookup-lens, storage-map, mail/invite-code-by-email). Remove stale FIRST ACTION prompt.
   - Tech Debt: `GetFamilyPartsAction` raw-array entry — verify still applicable (no change this cycle); leave or remove based on current state.

### Not on This Pallet

- **Findings 5 and 6 (the two unfilled Director Evaluations on `2026-04-29-reverse-lookup-lens.md` and `2026-04-29-phpstan-warroom-rules-adoption.md`)** — Director-side accountability artifact. Logistics Director completes these in parallel during this remediation window.
- **Finding 7 (paper trail for medic/CORS and DTO migration)** — separate shipping order: `2026-05-05-audit-remediation-5-paper-trail.md`. Do not start the DTO migration retroactive log or ADR-0010 amendment as part of this order.
- **CaptainHook pre-push proposal** — escalated to CEO for decision; not a remediation item.
- No production code changes. No new tests. No ADR file edits — only the ADR index row additions in this order.

## Acceptance Criteria

- [ ] CLAUDE.md line 116 reads "12 architecture decisions"
- [ ] CLAUDE.md line 298 (or current Ledger header line) reads "Twelve decisions" and the Ledger table includes ADR-0012
- [ ] CLAUDE.md line 111 reads "21 architecture tests"
- [ ] `docs/adr/README.md` index includes ADR-0012 row
- [ ] `.claude/docs/decisions.md` Decision Index includes ADR-0012 row
- [ ] Pulse `.claude/docs/pulse.md` reflects all six update areas listed In the Crate; assessed date is 2026-05-05
- [ ] `composer phpstan` passes (no type errors introduced)
- [ ] `composer test:arch` passes (no architecture regressions from the doc edits — none expected, but verify)
- [ ] Shift log filed at `.claude/records/journals/2026-05-05-audit-remediation-5-doc-hygiene.md`

## References

- Audit Report: `.claude/records/inspections/2026-05-05-full-sweep.md`
- Sibling Order: `.claude/records/permits/2026-05-05-audit-remediation-5-paper-trail.md`
- Prior Round: `.claude/records/permits/2026-04-11-audit-remediation-4.md`
- ADR-0012: `docs/adr/0012-tighten-runtime-to-php-85.md`

## Notes from the Issuer

All edits are doc-only. Verify the actual ADR count and test file count yourself before editing — do not trust the audit's numbers blindly. The Auditor verified them; trust-but-verify is the regulation.

The pulse refresh is the largest item in scope. Read the audit report's "Proposed Pulse Updates" section in full before starting — it lists six specific update areas. Do not abridge. Once edited, verify each section's assessed date is current.

The Director will be closing Findings 5 and 6 in parallel — by the time this shift logs, the two journals at `2026-04-29-reverse-lookup-lens.md` and `2026-04-29-phpstan-warroom-rules-adoption.md` should have completed Director Evaluations. The pulse "Active Concerns" entry for "two unfilled Director Evaluations" should be marked Resolved if both are completed before this shift commits, or left Open with the count adjusted if only one is done.

The `GetFamilyPartsAction` tech debt entry warrants a quick check — that endpoint may still be returning a raw array. If so, leave the entry; if it's been wrapped since the last pulse update, remove it.

---

**Status:** Completed (closed retroactively 2026-05-20 in paper-trail sweep)
**Shift Log:** _to be filed_

---

_**Closed retroactively 2026-05-20** during paper-trail-drift sweep. Build Record (already filed): [`2026-05-05-audit-remediation-5-doc-hygiene`](../build-records/2026-05-05-audit-remediation-5-doc-hygiene.md). See sweep Build Record: [`2026-05-20-wo-closure-sweep`](../build-records/2026-05-20-wo-closure-sweep.md)._
