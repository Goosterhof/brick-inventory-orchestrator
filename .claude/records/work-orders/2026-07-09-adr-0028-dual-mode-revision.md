# Work Order: Revise ADR-0028 § Amendment 2026-05-27 per Devil's Court ruling (Cracked → documented-dual-mode)

**Work Order #:** 2026-07-09-adr-0028-dual-mode-revision
**Filed:** 2026-07-09
**Issued By:** The Steward (drafting the CEO-ruled outcome of the `/adr-interrogator` re-run)
**Assigned To:** The Steward (interrogator-output doc edit)
**Wing:** Atrium (governance — ADR + records)
**Priority:** Standard
**Status:** Completed (closed in this work PR per the very dual-mode convention this amendment introduces — Atrium/docs-only, gate never fires) — [Build Record](../build-records/2026-07-09-adr-0028-dual-mode-revision.md)
**Branch slug (for PrePushPermitGate):** `adr-0028-dual-mode-revision`

---

## The Job

Record the 2026-07-09 Devil's Court re-interrogation of ADR-0028 § Amendment 2026-05-27 (uniform-rule convention). The re-run — 41 days overdue against its own fired trigger — ruled the amendment **Cracked**: ~20% realized WO-close drift discovered only at audit time (the amendment's own predicted failure mode), the cheap direct-commit close path dead under branch protection, and the CEO's taste preference withdrawn when shown the ledger. Replace the uniform rule with **documented-dual-mode**: Status flips in the work PR by default; the gate-active slice (over-threshold backend) closes post-merge as the gate mechanically requires.

## Scope

### In the Box

- New § Amendment 2026-07-09 in `.claude/docs/adr/0028-pre-push-permit-verification.md`: evidence ledger, revised convention, basis, enforcement honesty, transition clause, training-rule reinstatement, trigger-tracking meta-finding, settled-doctrine rationale.
- SUPERSEDED banner on § Amendment 2026-05-27 (retained for the paper trail).
- Inheritance-resolution note in § Amendment 2026-05-28 (I)'s "Relationship" section, per its own demand.
- Header: Last Amended, Status, Stress-Tested lines.

### Not in This Set

- No gate code, tests, or failure-message changes (the amendment is procedural).
- The recommended CI check (Build-Record-with-open-WO flag) — follow-up WO candidate, not this slice.
- The final batched close-out of uniform-rule-era WOs — happens post-merge of the 2026-07-09 PR batch per the Transition clause.

## Acceptance Criteria

- [ ] All three ADR touch-points edited (new amendment, banner, inheritance note) + header lines.
- [ ] This WO ships Completed in the work PR — the first live exercise of dual-mode.
- [ ] Build Record filed in the same PR.
