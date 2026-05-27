# Build Record: Close Canonical Oxlint Test-File Rules WO (Steward-Direct Supersession Close)

**Build Record #:** 2026-05-27-close-canonical-oxlint-test-file-rules
**Filed:** 2026-05-27
**Work Order:** [`2026-05-06-canonical-oxlint-test-file-rules`](../work-orders/2026-05-06-canonical-oxlint-test-file-rules.md)
**Builder:** The Steward (direct close — no subagent dispatched)
**Wing:** Atrium (paper-trail governance)

---

## Work Summary

Closed an In-Progress Work Order whose scoped work has already shipped end-to-end on `main`. The WO sat with `Status: In Progress` for 21 days — the longest-unactioned open item in the firm, flagged across five consecutive standups (2026-05-25 morning, 2026-05-25 post-cluster, 2026-05-26, 2026-05-27) — because the work landed via a different artifact path than the WO anticipated, and no role held the close-out responsibility.

| Action | File | Notes |
|---|---|---|
| Modified | `.claude/records/work-orders/2026-05-06-canonical-oxlint-test-file-rules.md` | Appended Steward Note explaining supersession; flipped `Status: In Progress` → `Status: Closed (superseded — see Steward Note 2026-05-27)`; replaced "Journal: _to be filed after PR merge_" with a back-link to this Build Record. |
| Created | `.claude/records/build-records/2026-05-27-close-canonical-oxlint-test-file-rules.md` | This file. |

## Evidence the Work Was Already Done

The WO's six Acceptance Criteria all map to concrete, verifiable state on `main` as of today:

| WO Acceptance Criterion | Evidence on `main` |
|---|---|
| `.oxlintrc.json` `src/tests/**` override carries all 9 canonical test-file vitest rules at `error` | All present at lines 236–244 of `frontend/.oxlintrc.json`: `vitest/no-disabled-tests`, `no-focused-tests`, `no-identical-title`, `prefer-strict-equal`, `prefer-to-be`, `prefer-to-contain`, `no-conditional-expect`, `valid-describe-callback`, `no-commented-out-tests`. Plus two bonus rules from oxlint 1.57/1.61: `valid-expect-in-promise` (error) and `prefer-strict-boolean-matchers` (warn). |
| Mechanical `.toEqual(` → `.toStrictEqual(` sweep complete in `src/tests/**` | `grep -rn "toEqual" frontend/src/tests/` returns 0 callsites; `grep -rn "toStrictEqual" frontend/src/tests/` returns 110 callsites. Sweep state is enforced going forward by the `prefer-strict-equal` rule at error level. |
| `frontend/CLAUDE.md` § Linting Standards reflects adoption (no deferred-decision callout) | Section reviewed at lines 220–248. No mention of "deferred", no callout about a pending 9-rule expansion. Section documents the canonical alignment and Gallery-specific deviations as current state. |
| `npm run lint` / `type-check` / `test:unit` / `knip` clean | Verified green by PR #113's mission report (test:coverage 1380/1380 pass, oxlint 0 errors, vue-tsc 0 errors, knip clean, build clean across all 3 apps). |

The 9-rule list specified in the WO was absorbed into the broader 31-rule canonical sweep that landed via PR #113 (`chore(lint): adopt oxlint 1.67 canonical rule additions`) merged 2026-05-26. The rules themselves may have arrived earlier — `git log -S "prefer-strict-equal" -- frontend/.oxlintrc.json` returns only the 2026-05-17 monorepo-absorption commit (`83c2f28`, PR #28), meaning the rule landed in the pre-merger `brick-inventory-frontend` repo before the subtree merge collapsed that history. Whichever pre-merger PR shipped the work is unreachable from this repo (per [`project_subtree_history_collapse`](../../projects/-home-goosterhof-Code-brick-inventory-orchestrator/memory/project_subtree_history_collapse.md)). The deliverable is on `main` regardless of which pre-merger commit produced it.

## Decisions Made

1. **Close without retrospective audit or fresh Build Record from the original Lead Brick Architect dispatch.** Reproducing the WO's intended path — branch `chore/canonical-oxlint-test-file-rules`, full rule-by-rule diff, 88-callsite sweep — is not possible: the work already exists. A Quality Warden dispatch to write "no inspection needed because the deliverable matches the spec" would consume context for an output already captured by the AC-evidence table above. The Steward's direct evidence is sufficient.

2. **The deliverable broadened beyond the WO's 9-rule scope, not narrowed.** PR #113's canonical adoption shipped the WO's 9 rules plus 22 additional rules across Vue, jsx-a11y, TypeScript, core ESLint, unicorn, and Vitest categories. The broader adoption did not regress any AC; it strictly exceeded them. The WO does not need to be "partially closed" — every AC is met or exceeded.

3. **Honor the close-in-work-commit training rule.** The Status flip from `In Progress` to `Closed (superseded)` ships in the same commit as this Build Record. The rule graduated functionally yesterday (three roles applied it without prompting); this close is the first post-graduation occurrence and confirms the rule extends to Steward-direct supersession closes, not just original-author closes.

4. **Pre-merger orphaned WOs are a paper-trail discipline gap worth memorializing.** This WO was filed 2026-05-06 in the pre-merger BIO orchestrator, addressed work in the pre-merger frontend repo, and intended a Build Record to be filed back in the orchestrator after merge. The 2026-05-17 subtree absorption brought the deliverable into the orchestrator but left the WO without a status-update mechanism — the work-side commit was on a collapsed branch, the WO-side close was nobody's job. This is the second instance of this pattern in two days (the first being `2026-05-05-integration-test-baseline-triage`, closed yesterday). The Self-Debrief flags this as a candidate for a Casebook Recurring Pattern entry.

5. **Branch slug deviates from WO slug.** Branch `close/canonical-oxlint-test-file-rules` does not strict-match WO slug `canonical-oxlint-test-file-rules`. Diff is sub-threshold (2 files, ~70 lines added) and frontend-paths-untouched, so PrePushPermitGate skips permit lookup entirely. Mechanically inert; documented here for the paper trail.

## Acceptance — Self-Assessed

Steward-direct closes do not flow from an externally-issued AC list. Implicit criteria the Steward holds itself to:

- [x] The closed WO file is internally consistent — `Status: Closed (superseded)` matches the Journal-line back-link to this Build Record.
- [x] The supersession claim is backed by concrete file evidence (line numbers in `.oxlintrc.json`, callsite counts, CLAUDE.md section state, verification report citation from PR #113).
- [x] The decision not to dispatch a retrospective Warden or original-author re-execution is articulated with a reason, not declared.
- [x] The pre-merger orphan pattern is acknowledged as recurring (now 2 occurrences) without over-committing to a doctrine fix in this Build Record's scope.
- [x] The close-in-work-commit training rule is honored without prompting from the dispatch.

## Self-Debrief

The signal worth keeping is the **pre-merger orphaned WO pattern** itself, which has now occurred twice:

1. `2026-05-05-integration-test-baseline-triage` — closed yesterday (2026-05-26). Pre-merger frontend repo executed Permits A and B; orchestrator-side triage WO sat 21 days because nobody owned the close.
2. `2026-05-06-canonical-oxlint-test-file-rules` — closed today. Pre-merger frontend repo absorbed the 9-rule expansion; orchestrator-side WO sat 21 days because the work-side commit was collapsed by the subtree merge.

Two-in-two-days qualifies as a Recurring Pattern in Casebook terms. The Steward proposes the following Casebook entry (Warden to confirm or refile if methodology differs):

> **Pattern:** WOs filed in the pre-merger BIO orchestrator that scoped work for the pre-merger frontend or backend repos can be silently orphaned by the 2026-05-17 subtree absorption. The work-side commit is unreachable from `main`'s git history; the WO-side close is nobody's job because the original assignee role (e.g. "Lead Brick Architect") no longer exists in the post-merger crew.
>
> **Detection:** Any WO filed before 2026-05-17 with `Status: Open` or `Status: In Progress` and no Build Record. Cross-check the deliverable against current state on `main` — if the deliverable exists, close as superseded with a supersession Build Record like this one. If the deliverable does not exist, refile as a fresh WO with current vocabulary.
>
> **Prevention:** Any future pre-merger WO discovered Open should trigger this check explicitly, not wait for a standup to flag staleness.

The third-occurrence threshold for promotion to Pulse-level concern doesn't fire today; this Casebook entry is enough. If a third pre-merger orphan surfaces in the next 30 days, the pattern earns a Pulse Active Concern entry and the question becomes "should we sweep all pre-merger WOs proactively rather than waiting for staleness flags?"

Beyond the pattern: this close also retires one of the firm's three remaining Atrium-level CEO-decision items (`oxlint-test-file-rules disposition`). Two remain — dependabot rebase queue stuck (#87/#96/#97) and the `2026-05-20-adr-0028-dual-mode-amendment` interrogator dispatch. Both have richer context today than they did yesterday morning.

---

**Status:** Closed
**Closes Work Order:** [`2026-05-06-canonical-oxlint-test-file-rules`](../work-orders/2026-05-06-canonical-oxlint-test-file-rules.md)
