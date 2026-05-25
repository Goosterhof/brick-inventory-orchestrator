# Build Record: Fix Integration-Test Stale Assertions (Permit A)

**Build Record #:** 2026-05-25-fix-integration-test-assertions
**Filed:** 2026-05-25
**Work Order:** [`2026-05-05-fix-integration-test-assertions`](../work-orders/2026-05-05-fix-integration-test-assertions.md)
**Builder:** Brickwright (Gallery wing)
**Wing:** Gallery
**Filing provenance:** Build Record content authored from Brickwright's return report; transcribed and filed by The Steward after the Brickwright hit two permission denials on `.claude/records/` Write/Edit (see Decisions Made #2 and Self-Debrief — Methodology Gap).

---

## Work Summary

Repaired the 5 stale integration-test assertions on `main` that the 2026-05-05 triage identified. All five are one-line assertion updates in test files — production code is correct; the tests hardcode values that drifted (4 from the 2026-03-30 brand-voice deployment, 1 structural from the xNOYG `in_storage` status merge). With the fixes applied, `npm run test:integration:run` exits green at 143/143, clearing the precondition for Permit B (CI wiring).

| Action | File | Notes |
|---|---|---|
| Modified | `frontend/src/tests/integration/apps/families/domains/brick-dna/pages/BrickDnaPage.spec.ts` | Line 66: `'No collection data available yet'` → `"No DNA profile yet. Add some sets and we'll map your building fingerprint."` (matches `brickDna.empty` at `translation.ts:259`) |
| Modified | `frontend/src/tests/integration/apps/families/domains/home/pages/HomePage.spec.ts` | Line 55: `'Dashboard'` → `'Build Control'` (matches `home.dashboardTitle` at `translation.ts:83`) |
| Modified | `frontend/src/tests/integration/apps/families/domains/home/pages/HomePage.spec.ts` | Line 88: `'Loading your collection...'` → `'Unpacking your collection...'` (matches `home.loadingStats` at `translation.ts:84`) |
| Modified | `frontend/src/tests/integration/apps/families/domains/sets/pages/AddSetPage.spec.ts` | Line 56: `toHaveLength(5)` → `toHaveLength(6)` (matches `statusOptions` array in `AddSetPage.vue:50-57`, 6 entries since the xNOYG `in_storage` merge) |
| Modified | `frontend/src/tests/integration/apps/families/domains/storage/pages/StorageOverviewPage.spec.ts` | Line 49: `'No storage locations yet'` → `'No storage bins yet. Every brick needs a home.'` (matches `storage.noStorage` at `translation.ts:177`) |
| Created | `.claude/records/build-records/2026-05-25-fix-integration-test-assertions.md` | This file — filed by The Steward on the Brickwright's behalf (see provenance note above) |
| Modified | `.claude/records/work-orders/2026-05-05-fix-integration-test-assertions.md` | Status flipped Open → Completed; Build Record back-link added — filed by The Steward (same provenance) |

## Work Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Five test-assertion edits, each in the file:line listed in the WO, each matching live production output (re-verified at fix time) | Yes | All 5 strings re-verified against `frontend/src/apps/families/services/translation.ts` and `AddSetPage.vue` at fix time — **zero drift** since the 2026-05-05 triage. The `Received:` values in the original WO are still byte-for-byte current. |
| `npm run test:integration:run` exits 0 with all tests passing | Yes (exceeds WO baseline) | **143/143 passing** across 19 spec files. The WO predicted 126/126; the suite grew by 17 tests in the 20-day gap between filing and execution. WO Notes section explicitly permitted "may have grown." |
| No production code modified, no CI configuration modified | Yes | Diff scope is `frontend/src/tests/integration/**` only (4 files). Verified via `git status`. |
| Pre-push gauntlet clean (type-check, knip, test:coverage, build) | Yes | Full Gallery gauntlet green — see Quality Gauntlet section below. |
| Build Record records re-verification outcome and any drift between 2026-05-05 and fix time | Yes | This section + Decisions Made #1. Zero drift. |
| No regressions in the 121 currently-passing integration tests | Yes | All non-target tests in the 4 modified files still pass. The other 15 spec files were not touched. |

## Decisions Made

1. **Trusted the WO's prescribed change pairs after byte-for-byte re-verification.**
   The WO body warned not to copy 2026-05-05 strings blind — brand voice may have drifted further in the 20-day interval. Cross-checked all 5 target strings against live `translation.ts` and `AddSetPage.vue` before any edit. Zero drift: the `Received:` strings in the WO are still byte-for-byte current. This means the WO's prescription remained accurate over the gap, but the re-verification discipline is what made that knowable — without it, blind copy would have been correct by accident, which is not the same as correct by process.

2. **Stopped at the second permission denial; did not attempt Bash/heredoc workarounds.**
   The Brickwright agent attempted to Edit the WO status block and Write the Build Record under `.claude/records/`. Both calls were denied. Per the Brickwright's own discipline (item 5: first refusal on a known-good path is a permission signal, not a tooling puzzle), the agent stopped without falling back to `cat <<EOF > file` via Bash. The Steward (who has the broader Write scope) transcribed both artifacts after the agent returned. **This breaks the atomicity the 2026-05-20 closure sweep training rule expected** — the Build Record and the WO Status flip do land in the same commit (the Steward's commit), but the spec-file edits are in the same commit too only because the Brickwright didn't have a clean separate intermediate commit either. The closure-sweep rule survives in *commit shape*; it does not survive in *single-agent ownership*. Flagged in Self-Debrief.

3. **Working-tree surprise: the 5 edits were already present when dispatch began.**
   The Brickwright's `git status` on startup showed the 4 spec files already carrying the 5 prescribed edits — likely from a prior interrupted dispatch on this branch, or a SessionStart hook side-effect. Diff was clean, scope-limited, and matched the WO byte-for-byte. The Brickwright chose to **verify and adopt** the pre-existing diff (rather than discard-and-re-apply) because (a) the changes were verified-correct, (b) discarding would have wasted the prior agent's work with no quality benefit, and (c) the test suite passed on the pre-existing diff. The alternative (`git checkout -- .` then re-edit) would have produced an identical result with extra churn.

## Quality Gauntlet

### Gallery Wing

| Check | Result | Notes |
|---|---|---|
| format:check | Pass | 330 files clean |
| lint | Pass | 0 warnings, 0 errors, 303 files |
| lint:vue | Pass | Custom Vue-conventions linter green |
| type-check | Pass | `vue-tsc` clean |
| test:coverage | Pass | **100%** statements (1367/1367), branches (1053/1053), functions (403/403), lines (1280/1280) |
| knip | Pass | 0 unused-export violations |
| build | Pass | All 3 apps built (families, admin, showcase) |
| `test:integration:run` (post-fix) | Pass | **143/143** tests, 19 spec files |

Environment: Node 24.16.0 (resolved via `source /opt/nvm/nvm.sh && nvm use 24` from the v22.22.2 host default). `npm install` succeeded on first try.

## Showcase Readiness

This delivery materially improves the firm's *operational signal-to-noise*. Before: `main` had 5 known integration-test failures sitting unrepaired for 20 days, with the Atrium's "Active Concerns" table flagging them as Medium severity. After: the integration suite is green, and the precondition for Permit B (CI wiring) is satisfied — meaning the next merge to land Permit B will close the entire "Integration suite: 5 failing tests" Pulse concern in one motion.

A senior architect cloning the repo and running `npm run test:integration:run` cold will now see 143 green. The 25 minutes of accumulated dev-time-debt the original triage estimated is repaid. No portfolio-positive showcase artifact was produced (this is hygiene work, not architecture work), but the *absence* of a portfolio-negative is itself the deliverable.

The dispatch surfaced a real structural finding worth surfacing separately: the Brickwright agent's tool-set lacks Write access to `.claude/records/`, which is exactly the paper-trail surface its discipline requires it to write. The same gap the Quality Warden hit on 2026-05-20 now confirmed on a second agent. **The "Quality Warden Write access" decision on the standup action-items list is no longer a Warden-specific question — it's a firm-wide agent-permission question.** Promoted accordingly in Proposed Knowledge Updates.

## Proposed Knowledge Updates

- **Learnings:** Propose adding (after Steward review): *Re-verify hardcoded test assertions against current production source before applying a triaged change pair, even when the triage is recent — the discipline produces "correct by process," not "correct by accident."* Triggering evidence: this Build Record. Zero drift was confirmed against the 20-day-old WO — but the discipline of checking is what made that confirmation real.
- **Pulse — Active Concerns (Gallery):** The "Integration suite: 5 failing tests (Permits A + B open)" entry can be updated. Permit A shipped today (this Build Record). Permit B (CI wiring) is no longer blocked. Recommend the next standup or Pulse refresh re-rate the concern's Status from "Active" to "Active — Permit B unblocked" or close it entirely once Permit B lands.
- **Pulse — Atrium Concerns:** The "Work Order paper-trail drift" entry was waiting for "two subsequent Build Records that close their parent WO unprompted." This dispatch did close the parent WO in the same commit as the Build Record — but only because the Steward transcribed both after the Brickwright was permission-denied. Whether this counts as a "confirmation" depends on disposition; The Steward leans toward **half-confirmation** (commit shape held; single-agent ownership did not). Recommend tracking as 0.5 of 2 needed confirmations.
- **Casebook (Quality Warden):** Propose Methodology Note: *Agent write-scope to `.claude/records/` is a firm-wide gap, not a Warden-specific gap. Both the Quality Warden (2026-05-20 audit) and the Brickwright (2026-05-25 Permit A) hit identical permission denials when trying to file their primary paper-trail artifacts. Recommend the firm decide whether `.claude/records/<artifact-folder>/` is allowlisted for the agent that authors that artifact type, or whether the Steward-transcribes-on-behalf pattern is the canonical flow. Decision should be made once and applied uniformly, not per-agent.*
- **Decision Record:** No ADR. The Permit A work itself is hygiene; the agent-write-scope question is broader and may warrant an ADR in its own right but should not ride on this Build Record's commit.

## Self-Debrief

### What Went Well

- **Re-verification before edit.** Pulled current production source for all 5 target strings before touching any spec file. Confirmed zero drift in 20 days — and confirmed the discipline produced trustworthy knowledge, not coincidence.
- **Stopped cleanly on permission denial.** First denial on a known-good path is a signal, not a puzzle. Did not fall back to Bash/heredoc to write the WO status block or the Build Record. The agent surfaced the gap structurally; the Steward filled it cleanly.
- **Environment resolved on first try.** Node 24 was at `/opt/nvm/nvm.sh`, not the more common `~/.nvm/nvm.sh`. Found it without trial-and-error by inspecting the host's nvm install path before sourcing.
- **Working-tree surprise handled without churn.** Pre-existing diff matched WO byte-for-byte and passed tests; adopted rather than discarded.

### What Went Poorly

- **Two permission denials wasted attempts.** Even at one denial per write target, that's signal lost. Future similar dispatches should know upfront which `.claude/records/` paths the agent can/cannot write before reaching the file-write step. The Steward's brief did not flag this gap; the Brickwright did not check the tool-scope before starting. Either side could have caught it.
- **Cannot claim sole-agent atomicity.** The 2026-05-20 closure-sweep training rule expected one agent to commit Build Record + WO Status + work artifacts in one commit. The commit shape will satisfy this on disk, but the underlying agent ownership split across Brickwright (work artifacts) and Steward (paper-trail artifacts) means the *rule's spirit* — single accountability for atomic close-out — is not honored. This is environmental, not behavioral.

### Blind Spots

- Did not check whether any of the 4 modified spec files had unrelated commits queued from prior interrupted dispatches before adopting the working-tree diff. If a prior dispatch had also touched an unrelated assertion in one of these files, that change would have ridden along silently. Spot-check `git log -p` on the 4 files would have caught this; trust signal: `git diff` showed *only* the 5 prescribed edits, nothing else.
- Did not verify the `frontend/.nvmrc` matched the Node version actually selected. Trust signal: the gauntlet passed end-to-end on Node 24.16.0; if `.nvmrc` had specified a different minor, knip or the build would likely have flagged it. But "didn't surface a warning" is not the same as "verified the version matches."

### Training Proposals

| Proposal | Context | Build Record Evidence |
|---|---|---|
| Before dispatching an agent to write under `.claude/records/<folder>/`, check the agent's `tools` allowlist and Steward-side write permissions for that folder. If the agent lacks Write, brief the agent to return the artifact text and have the Steward file it. | This dispatch lost two file-write attempts to permission denials on known-good paths. The same gap the Warden hit on 2026-05-20 has now confirmed on the Brickwright. The check before dispatch is one-time; the loss per skipped check is per-dispatch. | This Build Record + Casebook Methodology Note (2026-05-20) re: Warden Write gap. |
| Re-verify hardcoded test assertions against current production source before applying any triaged change pair, regardless of triage recency. | Zero drift on this dispatch is *evidence the discipline produces trustworthy knowledge*, not evidence that the discipline can be skipped on future similar work. The triage was 20 days old; the changes were correct anyway; the discipline is what made the correctness knowable. | This Build Record (Decision #1). |
| When a working-tree diff is pre-existing at dispatch start, run `git log -p <file>` on each modified file to verify no unrelated changes are queued from a prior interrupted dispatch. | Adopted the pre-existing 5-edit diff without verifying nothing else had been queued. `git diff` confirmed only the prescribed edits, but `git log` would have surfaced any uncommitted prior dispatch's session-bound noise. | This Build Record (Blind Spots). |

---

## Steward Evaluation

**Overall Assessment:** Solid

This is mechanical hygiene work executed cleanly under environmental friction. The Brickwright honored the WO's resist-temptations rules (didn't touch passing tests, didn't upgrade assertion depth, didn't second-guess brand voice), re-verified every string before editing, and stopped cleanly when the permission system blocked the paper-trail step. The decision to *not* fall back to Bash/heredoc on permission denial is the correct one — that's exactly the discipline item 5 of the Brickwright's protocol is meant to enforce.

### Work Order Fulfillment Review

All 6 acceptance criteria satisfied. The test count (143/143) exceeds the WO's predicted 126/126 — WO Notes section explicitly permitted growth, and the gap (17 tests added in 20 days) is consistent with the cluster's known scope creep (xNOYG `in_storage` merge added tests on top of the structural drift it introduced). No over-delivery; no scope creep into Permit B territory.

### Decision Review

All three decisions were sound and well-explained. Decision #2 (stop on permission denial) is the most important and was handled with discipline; Decision #1 (re-verify) honors a learning the Brickwright is now proposing to codify; Decision #3 (adopt pre-existing diff) was pragmatic and the Brickwright's Blind Spots section correctly flags the one verification gap that came with it.

### Showcase Assessment

The delivery itself is showcase-neutral (hygiene closes a negative; doesn't open a positive). But the *handling* of the permission denial is showcase-positive — it surfaces a real structural finding about firm-wide agent write-scope that two independent agents have now hit. The "Quality Warden `Write` access decision" action-item on the 2026-05-25 standup is hereby promoted to "firm-wide agent write-scope decision" — and that promotion is itself the more valuable showcase artifact than the 5 string edits.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| Before dispatching an agent to write under `.claude/records/<folder>/`, check the agent's tool allowlist and Steward-side write permissions for that folder. | **Candidate** | Two independent confirmations now (Warden 2026-05-20, Brickwright 2026-05-25). Will graduate to a Steward-side dispatch-prep checklist item after a third triggering observation or after the firm-wide write-scope decision is made (whichever comes first). |
| Re-verify hardcoded test assertions against current production source before applying any triaged change pair, regardless of triage recency. | **Candidate** | First confirmation. Needs one more independent observation to graduate to `learnings.md`. The principle is sound; the evidence is single-instance. |
| When a working-tree diff is pre-existing at dispatch start, run `git log -p <file>` on each modified file to verify no unrelated changes are queued. | **Dropped** | Edge-case fix for an edge-case scenario (pre-existing working-tree diff is rare). `git diff` already shows the full delta; `git log` adds noise without proportional signal. The Blind Spot is real but the rule's cost exceeds its benefit. |

### Notes for the Builder

The cleanest part of this dispatch was stopping at the second permission denial. A weaker discipline would have rotated through Bash heredoc fallbacks until *something* wrote, producing a Build Record but burying the permission gap. By stopping, you turned an environmental obstacle into a firm-wide finding. Repeat that behavior.

The weakest part — and it's narrow — was not pre-checking the agent's write scope before starting. The Steward's brief is co-responsible for that; expect future briefs to either name the write-scope situation explicitly or restructure dispatches so the agent's primary deliverable is always within its tool allowlist.
