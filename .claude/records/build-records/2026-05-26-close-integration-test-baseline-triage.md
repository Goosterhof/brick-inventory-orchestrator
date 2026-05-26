# Build Record: Close Integration-Test Baseline-Triage WO (Steward-Direct Supersession Close)

**Build Record #:** 2026-05-26-close-integration-test-baseline-triage
**Filed:** 2026-05-26
**Work Order:** [`2026-05-05-integration-test-baseline-triage`](../work-orders/2026-05-05-integration-test-baseline-triage.md)
**Builder:** The Steward (direct close — no subagent dispatched)
**Wing:** Atrium (paper-trail governance)

---

## Work Summary

Closed an open Work Order whose scoped work had already been executed via two follow-up permits, with the WO itself never updated. No inspection report was filed because no inspection was needed at filing time — the failures the report would have diagnosed no longer exist in the codebase, and the systemic Q3 (CI wiring) it would have recommended is already live on `main`.

| Action | File | Notes |
|---|---|---|
| Modified | `.claude/records/work-orders/2026-05-05-integration-test-baseline-triage.md` | Appended Steward Note section explaining the supersession; flipped `Status: Open` → `Status: Closed (superseded — see Steward Note 2026-05-26)`; replaced "Inspection Report: _link when filed_" line with a "Not filed (see Steward Note above)" line plus a back-link to this Build Record. |
| Created | `.claude/records/build-records/2026-05-26-close-integration-test-baseline-triage.md` | This file. |

## Evidence the Work Was Already Done

The WO scopes three deliverables: (1) per-failure diagnoses of 5 failing integration tests, (2) answers to systemic Q1 / Q2 / Q3, (3) a prioritized recommendation pointing to two follow-up permits — one per-failure-fix permit and one CI-wiring permit. Each deliverable has a concrete artifact already on `main`:

| WO Deliverable | Evidence |
|---|---|
| 5 stale assertions diagnosed | Permit A's [Build Record table](2026-05-25-fix-integration-test-assertions.md) lists each failure with: file path, line number, old assertion string, new assertion string, source-of-truth pointer (`translation.ts:259`, `translation.ts:83`, `translation.ts:84`, `AddSetPage.vue:50-57`, `translation.ts:177`), and root cause classification (4 stale-copy from the 2026-03-30 brand-voice deployment, 1 structural from the xNOYG `in_storage` status merge). |
| 5 fixes shipped | Same Build Record. Current test files contain the new assertions — verified at close time: `BrickDnaPage.spec.ts:67`, `HomePage.spec.ts:55,88`, `StorageOverviewPage.spec.ts:49`, plus the `toHaveLength(6)` update in `AddSetPage.spec.ts`. Suite reported 143/143 green. |
| Q3 (CI wiring) specified and implemented | Permit B's [Build Record](2026-05-25-wire-integration-tests-into-ci.md). Integration step added to `.github/workflows/frontend-ci.yml` at step 10 of 13 (between Test-with-coverage and Build). No `continue-on-error`. The Q3 *intent* honored byte-for-byte; only the *target filename* drifted from the WO's `ci.yml` reference to `frontend-ci.yml` (a 2026-05-17 merger consequence — the merger split CI into wing-specific workflows). |
| Q1 (why pre-push doesn't run integration) | Implicitly answered by Permit B's WO and Build Record: no documented historical reason; the gap was a pattern miss, not a tradeoff. The CEO directive added 2026-05-05 explicitly closed the question. |
| Q2 (where the integration suite runs) | Answered by Permit B's existence: "nowhere before today; in `frontend-ci.yml` step 10 starting 2026-05-25." |

The per-failure root causes and the Q3 specification both ended up captured in the *follow-up* permits' bodies rather than in a separate Inspector report. The diagnosis happened — it just landed in a different artifact than originally scoped.

## Decisions Made

1. **Close without retrospective audit.** A Quality Warden dispatch to write "no inspection needed because the failures no longer exist" would consume ~25 minutes of context for an output that adds no new information beyond what the two existing Build Records already record. The Steward's evidence chain (the two Build Records + the current state of the test files + the active `frontend-ci.yml` step) is sufficient; a third-party audit on top of it is overkill for a paper-trail-debt closure.

2. **Steward direct edit on the WO Status line.** The WO predates the Brickworks merger and uses Stud & Sort Logistics vocabulary ("Building Permit / Building Inspector / Inspection Report"). The closure preserves the original vocabulary in the WO body — the WO documents what was filed at filing time — but the new Steward Note and the closed-state field labels use current Brickworks vocabulary. This matches the precedent set by the audit-remediation-5-paper-trail closure earlier today.

3. **Branch slug deviates from WO slug.** The PrePushPermitGate's strict-slug-match would compare the branch slug `close-integration-test-baseline-triage` against the WO slug `integration-test-baseline-triage` and reject. But the diff is sub-threshold (2 files, ~40 lines added), so the gate skips permit lookup entirely and the mismatch is mechanically inert. Documented here for the paper trail; no `--no-verify` invocation needed or used.

4. **No new ADR on supersession-as-closure.** The Steward Note flags "the pattern — Work Order superseded by its own follow-ups without a formal close — is a paper-trail discipline gap worth a future ADR or charter clarification." That ADR is not in this Build Record's scope. Filing it would require an `adr-interrogator` session and a CEO architectural call. Logging the gap is enough; the next time this pattern recurs, the Steward can point at this Build Record as the precedent and either accept it or file the ADR.

## Acceptance — Self-Assessed

This Build Record has no externally-issued acceptance criteria — Steward-direct closes do not flow from a WO that explicitly scopes the close itself. The implicit criteria the Steward holds itself to:

- [x] The closed WO file is internally consistent — no contradiction between "Status: Closed" and the Inspection-Report-not-filed line.
- [x] The supersession claim is backed by concrete file evidence (Build Record file paths, current test-file content at known line numbers, `frontend-ci.yml` step placement).
- [x] The decision not to dispatch a retrospective Warden is articulated with a reason, not just declared.
- [x] The recurrence-prevention question is acknowledged but not over-scoped (a future-ADR pointer, not a present-tense commitment).

## Self-Debrief

The signal worth keeping is the pattern, not this individual closure: **a WO filed near the start of a cluster of related work can be quietly superseded by its own children if the cluster moves faster than the WO's update cadence**. This WO was filed 2026-05-05 alongside fix-integration-test-assertions and wire-integration-tests-into-ci permits. The two follow-ups shipped 2026-05-25 with full Build Records. The triage WO sat with `Status: Open` for 21 days because nobody held the close-out responsibility — the architect closed Permits A and B, but Permit-zero (the inspection that would have recommended them) was nobody's job to retire.

The lesson for future filings: when a WO scopes "inspection that recommends N follow-up permits", and the follow-up permits get filed in parallel (rather than after the inspection), the original WO needs an explicit "close on last follow-up shipping" rule baked in — either in the WO itself or in the charter. The active training rule on close-out-in-the-work-commit doesn't cover this case because the work happens in *children's* commits, not the parent's.
