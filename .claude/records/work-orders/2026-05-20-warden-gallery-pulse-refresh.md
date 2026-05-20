# Work Order: Quality Warden — Gallery Pulse Refresh Audit

**Work Order #:** 2026-05-20-warden-gallery-pulse-refresh
**Filed:** 2026-05-20
**Issued By:** CEO (via first-standup action item #3)
**Assigned To:** Quality Warden
**Wing:** Gallery
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `warden-gallery-pulse-refresh`

---

## The Job

The Casebook flagged "Pulse staleness (systematic)" as an escalating standing suspicion across eight consecutive inspections. The first `/standup` (2026-05-20) made the scale concrete: five Gallery sections of the Pulse are 39-55 days stale (Overall Health, Active Concerns, Pattern Maturity, Tech Debt, Quality Metrics). The Casebook recommended escalation to high severity if not addressed on next inspection.

This Work Order dispatches the Quality Warden for a **Gallery-scoped, Pulse-focused audit**. The audit's goal is not finding new bugs — it is verifying which Pulse claims are still true and which have drifted, so The Steward can update Pulse with fresh present-tense state.

## Scope

### In the Box

Audit and report on the freshness of these five Gallery Pulse sections:

1. **Overall Health — Gallery** (currently rated 9/10, assessed 2026-04-11). Is the rating still accurate? Are the supporting claims (router migration complete, ADR-0024 page integration test layer established, gauntlet fully green) still true?
2. **Active Concerns — Gallery** (assessed 2026-04-11). Each entry's status: still Active, Resolved, or Worsened? `AboutPage.spec.ts` and `ComponentGallery.spec.ts` collect-guard breaches need re-measurement.
3. **Pattern Maturity — Gallery** (assessed 2026-03-29 — **51 days**). Each pattern listed: still Battle-tested? Anything moved up to maturity? Anything regressed? Special check: is "Mutation testing (Stryker)" still "Configured" or has it actually been run in anger since?
4. **Tech Debt — Gallery** (assessed 2026-03-25 — **55 days**). Each item: still valid? Anything newly accumulated since the last assessment?
5. **Quality Metrics — Gallery** (assessed 2026-03-29 — 51 days). Verify current values via `npm run test:unit` (test count), `npm run knip` (violations), `meta.componentCount` (component count from registry JSON), file system listing (domain count). Don't hardcode counts — the Pulse rule forbids it; verify they remain canonical-source references.

Also in scope:

- **Cross-check the Casebook's Gallery suspicions** against this audit's findings. Anything in the Standing Suspicions table that's still active should appear in your Audit's Doc Drift or Findings.
- **File the Audit at** `.claude/records/audits/2026-05-20-gallery-pulse-refresh.md`.
- **Include a "Proposed Pulse Updates" section** with concrete drop-in replacements for each section. The Steward will commit them in a follow-up WO; you do not edit the Pulse directly.

### Not in This Set

- Foundry Pulse sections — out of scope for this audit. The Foundry's 2026-05-05 assessment is 15 days old (under the 21-day stale threshold).
- Atrium Pulse sections — refreshed this morning during standup (`Seeds` updated, WO drift concern added, pcov closed). Do not re-audit Atrium.
- Code-quality findings (lint violations, test failures, etc.) that aren't relevant to a Pulse claim. This is a freshness audit, not a full Gallery sweep.
- Running the full Gallery gauntlet from scratch. Skim where the Pulse's claims depend on a gauntlet result; full re-run only if a claim is genuinely contested.

## Acceptance Criteria

- [ ] Audit filed at `.claude/records/audits/2026-05-20-gallery-pulse-refresh.md` per the Quality Warden's standard report format.
- [ ] All five Gallery Pulse sections explicitly verified: each section reported as Still Accurate / Partially Drifted / Significantly Drifted, with evidence.
- [ ] Proposed Pulse Updates section contains concrete replacement text for each section that has drifted.
- [ ] Casebook's Gallery-side standing suspicions cross-checked against current Gallery state — for each: still active, resolved, or worsened.
- [ ] Self-debrief includes whether the Pulse staleness pattern itself should be reclassified (e.g., from "systematic" to "addressed" once Pulse is updated).
- [ ] If `AboutPage.spec.ts` or `ComponentGallery.spec.ts` collect guard breaches are re-measured, capture verbatim values in the audit (don't trust prior numbers).

## References

- First standup that triggered this dispatch: [`2026-05-20-standup`](../standups/2026-05-20-standup.md)
- Casebook entries on Pulse staleness and Gallery suspicions: [`quality-warden-casebook.md`](../../docs/quality-warden-casebook.md)
- The Pulse itself (target of the refresh): [`pulse.md`](../../docs/pulse.md)
- Last full audit for reference: [`2026-05-20-post-merger-baseline`](../audits/2026-05-20-post-merger-baseline.md) — but note that was a cross-wing structural audit, not a Pulse-specific refresh.

## Notes from the Issuer

This is a **focused** Pulse-refresh audit, not a full Gallery sweep. Eight consecutive inspections flagged Pulse staleness and nothing happened. The Casebook said escalate. The CEO authorized a dispatch. Now the loop closes.

Honor your read-only role: produce drop-in replacement text in the Proposed Pulse Updates section. The Steward commits the actual Pulse changes in a follow-up. Two-step is deliberate — your audit becomes the evidence for the Pulse update, and the Pulse update becomes its own paper-trail artifact rather than being a side-effect of your audit.

If you find your audit running long because of code-quality findings outside the Pulse's claims, **stop and ask The Steward** whether to split into two audits. Scope discipline matters more than completeness this round.

---

**Status:** Completed
**Audit Filed:** [`2026-05-20-gallery-pulse-refresh`](../audits/2026-05-20-gallery-pulse-refresh.md)
**Note:** The Audit was returned by the Warden subagent as text and filed by The Steward — the Warden's `tools` allowlist lacks `Write`. Flagged in the Audit's Methodology Gaps section and the Casebook (new Methodology Note) for a follow-up decision: grant Write or formalize the return-text + Steward-files flow.
