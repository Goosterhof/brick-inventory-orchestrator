# Work Order: Pulse Update — Commit Warden's Gallery Refresh Proposed Updates

**Work Order #:** 2026-05-20-pulse-update-gallery-refresh
**Filed:** 2026-05-20
**Issued By:** CEO (post-standup decision authorizing the Warden's Proposed Pulse Updates)
**Assigned To:** The Steward (executing as builder — Atrium scope; Pulse is Steward-owned by ownership rule)
**Wing:** Atrium
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `pulse-update-gallery-refresh`

---

## The Job

The Warden's audit [`2026-05-20-gallery-pulse-refresh`](../audits/2026-05-20-gallery-pulse-refresh.md) verified the freshness of five Gallery Pulse sections and produced concrete drop-in replacement text for each section that drifted. Per the two-step pattern (Warden audits + proposes; Steward commits Pulse), this Work Order is the Steward's commit step.

Mechanical execution — apply the five updates exactly as the audit proposed. No re-litigation of the audit's findings (those went through the Rebuttal Protocol gate by virtue of being committed to disk).

## Scope

### In the Box

Apply the Warden's Proposed Pulse Updates from the audit, section by section:

1. **Section 1 — Overall Health (Gallery):** rating 9/10 → 8/10; replace the supporting paragraph with the Warden's drop-in text; update assessed date to 2026-05-20.
2. **Section 2 — Active Concerns (Gallery):** replace the existing 4-row table with the Warden's 7-row replacement (PartsPage VIOLATION, AboutPage warning, ComponentGallery TEST GUARD, SetsOverviewPage TEST GUARD alarming, Integration suite failures, Item type constraint mismatch, format:check failures).
3. **Section 3 — Pattern Maturity (Gallery):** update the "Page integration tests (ADR-0024)" row from "Battle-tested" to "Established" with the Warden's evidence note; update assessed date to 2026-05-20; all other rows unchanged.
4. **Section 4 — Tech Debt (Gallery):** add two new items (`prevCursor` field unused by UI; domain-page coverage exclusion); update SetDetailPage item to name both `loadParts` + `loadStorageMap`; update assessed date to 2026-05-20.
5. **Section 5 — Quality Metrics (Gallery):** add the Warden's clarifying note under the Gallery header; update assessed date to 2026-05-20. Canonical-source reference format stays — no count hardcoding.

### Not in This Set

- Re-auditing the Warden's findings. The audit is the evidence; this WO commits its conclusions.
- Editing Foundry or Atrium Pulse sections — out of scope for the Gallery refresh.
- Updating the Pulse Atrium "Work Order paper-trail drift" concern — that's tracked separately and waits for two unprompted closures per its own close trigger.
- Filing a new Casebook update — the Warden's audit already proposed the Casebook changes and they were applied by The Steward in the audit's filing commit. (Now that the Warden has Write access per [`2026-05-20-warden-write-grant`] de facto via the agent file update, future audits file their own Casebook changes.)

## Acceptance Criteria

- [ ] All 5 sections updated per the Warden's drop-in text.
- [ ] Assessed date on each updated section reads `2026-05-20 (Gallery)`.
- [ ] Gallery rating in Overall Health reads 8/10 (was 9/10).
- [ ] Pattern Maturity "Page integration tests (ADR-0024)" reads "Established", not "Battle-tested".
- [ ] Active Concerns Gallery table has 7 rows (was 4).
- [ ] Tech Debt Gallery has 5 rows (was 3): 3 existing + 2 new.
- [ ] Quality Metrics Gallery has the clarifying note about unit-only coverage.
- [ ] Casebook untouched in this WO (already updated during the audit's filing commit).
- [ ] Build Record filed at `.claude/records/build-records/2026-05-20-pulse-update-gallery-refresh.md`.
- [ ] This WO's Status flipped to Completed and Build Record back-linked in the same commit (honoring the training rule proposed in [`2026-05-20-wo-closure-sweep`](../build-records/2026-05-20-wo-closure-sweep.md)).

## References

- Source audit: [`2026-05-20-gallery-pulse-refresh`](../audits/2026-05-20-gallery-pulse-refresh.md) — Proposed Pulse Updates section
- Triggering WO: [`2026-05-20-warden-gallery-pulse-refresh`](2026-05-20-warden-gallery-pulse-refresh.md) — explicit two-step pattern documented in the body
- Standup that surfaced the staleness: [`2026-05-20-standup`](../standups/2026-05-20-standup.md)
- Training rule being honored: [`2026-05-20-wo-closure-sweep` Build Record](../build-records/2026-05-20-wo-closure-sweep.md), Proposed Knowledge Updates section

## Notes from the Issuer

This is the first Work Order that operationalizes the training rule from the WO closure sweep: **close the parent Work Order in the same commit as the Build Record**. The pattern starts here. Two unprompted confirmations will close the Pulse Atrium concern; this is occurrence 1.

---

**Status:** Completed
**Build Record:** [`2026-05-20-pulse-update-gallery-refresh`](../build-records/2026-05-20-pulse-update-gallery-refresh.md)
