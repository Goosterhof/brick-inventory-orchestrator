# Build Record: ADR-0028 dual-mode revision (Devil's Court outcome)

**Build Record #:** 2026-07-09-adr-0028-dual-mode-revision
**Filed:** 2026-07-09
**Builder:** The Steward (interrogator-output doc edit, drafted on CEO ruling)
**Wing:** Atrium
**Work Order:** [`2026-07-09-adr-0028-dual-mode-revision`](../work-orders/2026-07-09-adr-0028-dual-mode-revision.md)
**Branch:** `adr-0028-dual-mode-revision`

---

## What Was Built

The full nine-step `/adr-interrogator` re-run of ADR-0028 § Amendment 2026-05-27 executed on 2026-07-09 (CEO present, as the Devil's Court requires — the re-run interrogates the CEO). Ruling: **Cracked**. This build records the ruling in the ADR:

- **New § Amendment 2026-07-09 — Documented-Dual-Mode**, carrying the 43-day evidence ledger (~19 clean closes vs 5 drifted ≈ 20% drift, discovered at audit — the uniform rule's own predicted failure mode; branch protection killing the direct-commit close path; the CEO's withdrawal of the taste preference on the record).
- **SUPERSEDED banner** on § Amendment 2026-05-27, retained for the paper trail.
- **Inheritance-resolution note** in § Amendment 2026-05-28 (I)'s Relationship section — that amendment explicitly demanded re-evaluation of its WO-close mechanics if the uniform rule cracked; the note resolves it to dual-mode.
- **Header updates:** Last Amended, Status (settled doctrine), and a Stress-Tested line per the Devil's Court taxonomy.

## The Convention Now In Force

Status flips **in the work PR** (default, ~95% of cases); over-threshold backend pushes close **post-merge** because the PrePushPermitGate mechanically requires an open permit at push — and rejects violations at push time, teaching its own exception.

## Decisions

- **Settled, not trial:** the trial already ran — 43 days of lived experience plus a complete re-interrogation is what trial doctrine exists to produce. A fresh trial clock would repeat the documented scaffolding failure (a fired trigger un-actioned for 41 days).
- **Trigger-tracking standing rule:** fired Devil's Court triggers must land in the Pulse Active Concerns in the same session as the ruling — ADR prose alone proved non-binding.
- **Training rule reinstated with scope:** "close parent WO in same commit as Build Record" returns, except in the gate-active slice. The graduate→retract→reinstate history stays visible.
- **This very PR is dual-mode's first exercise:** the parent WO ships `Status: Completed` in the same change set — Atrium/docs-only, the gate never fires, and the close travels with the work.

## AC Verification

- All three ADR touch-points + header edited in one commit — verified by diff review.
- WO Completed in-branch; this Build Record filed in the same PR.
- No gate code, tests, or fixtures touched (`git diff --stat` shows `.claude/` paths only).
