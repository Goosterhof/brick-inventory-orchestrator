# Build Record: ADR-0028 Bypass-Log Scope Amendment

**Filed:** 2026-05-28
**Wing:** Atrium
**Builder:** The Steward
**Work Order:** [`2026-05-28-adr-0028-bypass-log-scope-amendment`](../work-orders/2026-05-28-adr-0028-bypass-log-scope-amendment.md)

---

## Summary

ADR-0028's `--no-verify` bypass-log clause is amended to scope the Build Record requirement to **code-bearing** bypasses only. **Operational** bypasses (hook-bug, merge-commit, post-rebase force-push, baseline-breach) log to the session's `/minutes` § Process Meta with a one-line entry instead of a standalone Build Record. The six pending back-fills accumulated since 2026-05-26 are filed retroactively in § Bypass-Log Back-Fill below.

Triggering signal: today's first firm-wide Retrospective ([`2026-05-28-retro.md`](../retrospectives/2026-05-28-retro.md)) named the clause as the highest-cost paper-trail debt of the post-merger window — clause reaffirmed 2026-05-27, six back-fills owed and uncollected, doctrinal-vs-actual gap widening.

## Decisions Made

1. **Amendment over enforcement.** The clause was reaffirmed seven days ago; an amendment within the trial-doctrine window risks looking like churn. The CEO chose amendment over (a) bulk back-fill or (c) clause drop on empirical evidence: six of six pending back-fills are operational (zero code-bearing); the clause as written produced paper-trail debt without firm signal. Tightening doctrine to match achievable discipline is cheaper than performing discipline against a doctrine of the wrong shape.

2. **Two categories, not a continuum.** Code-bearing (ships untested code) is the scary case and keeps full Build Record discipline. Operational (hook-bug, merge-commit, force-push-after-rebase, baseline-breach) moves to `/minutes` § Process Meta one-liner. The four operational sub-types are exhaustive over the six pending and over the foreseeable space. If a future case spills outside the sub-types, the amendment is cracked — that is precisely the kind of evidence the Devil's Court triggers exist to catch.

3. **Recorded as trial doctrine.** The 2026-05-27 amendment is itself trial doctrine; layering a sub-amendment on a trial doctrine without trial-doctrine framing would erode discipline. Two Devil's Court triggers: first code-bearing bypass under the new clause (tests Category 1's discipline in practice), or 2026-06-28 calendar (surveys Category 2 incidence at 30 days).

4. **Bulk back-fill in this Build Record, not in `/minutes`.** The six pending entries are pre-amendment debt; they need to be satisfied somewhere with citation discipline before the new clause takes effect. Filing them in this Build Record's § Bypass-Log Back-Fill closes the prior debt cleanly. Future operational bypasses go to `/minutes` per the new clause.

5. **No retroactive edits.** Historical Build Records that referenced the prior clause (or that should have been filed for the six bypasses) are not edited. The Pulse is not edited. The Atrium Active Concerns row removed by the 2026-05-27 amendment stays removed. The amendment ledger is forward-only.

## Bypass-Log Back-Fill (six pending, retroactive close-out of pre-amendment debt)

| # | Date | PR / commit | Category | Operational sub-type | Cause | Sign-off |
|---|---|---|---|---|---|---|
| 1 | 2026-05-26 | PR #105 | Operational | knip.json revert push | PR #105 had bundled a knip.json change with type-export cleanup; the knip.json change broke knip 5 (still-current) CI. Revert dropped the config delta while keeping the cleanup. No new application code in the revert push. | The Steward |
| 2 | 2026-05-26 | PR #106 force-push | Operational | post-rebase force-push | After PR #111 landed CVE-2026-46644 fix on `main`, three open backend PRs (#106, #110, #112) needed `composer.lock` rebases. The pre-rebase content had already passed the full gauntlet on #106; the rebase added only the lock-file delta from `main`. | The Steward |
| 3 | 2026-05-26 | PR #110 force-push | Operational | post-rebase force-push | Same root cause as row 2, applied to PR #110. Also included a commit-subject case-fix (`d6972f0`) that was a doc-only rewrite of an existing commit's subject. | The Steward |
| 4 | 2026-05-26 | PR #112 force-push | Operational | post-rebase force-push | Same root cause as row 2, applied to PR #112. | The Steward |
| 5 | 2026-05-27 | PR #119 (PartsPage) | Operational | hook-bug | `.githooks/pre-commit`'s `git add src/shared/generated/component-registry.json` ran with cwd-relative path under worktree-mode dispatch, dropping the `frontend/` prefix and creating a spurious orchestrator-root file. Bypass on the final amend was required to ship the PartsPage stub-by-name fix without the hook-induced orchestrator-root pollution. Hook fixed in PR #126. | The Steward |
| 6 | 2026-05-27 | PR #120 (SetsOverview) | Operational | hook-bug | Same root cause as row 5, different worktree branch. | The Steward |
| 7 | 2026-05-27 | PR #121 (ComponentGallery) | Operational | hook-bug | Same root cause as row 5, different worktree branch. | The Steward |
| 8 | 2026-05-28 | PR #129 merge commit `7e2eddf` | Operational | merge-commit | Merge commit bringing main's existing changes into a branch with no new code to test. The subsequent push to the PR branch did fire the wing gauntlets (and they passed); the bypass was on the merge commit itself, not on the work content. | The Steward |

**Reconciliation note on count:** The Retro and Work Order both said "six pending." Disaggregating row 2's three branches (a single Action Item line in MINUTES.md 2026-05-26 covered force-pushes across three separate PRs) yields eight rows in this table. The total bypass count is eight; the back-fill *entry* count under the old clause would have been six (or fewer if the three worktree-hook ones consolidated). Under the new clause, all eight collapse to one-line minutes entries. Filing the granular table here for citation discipline.

Under the new clause's taxonomy: zero rows code-bearing, eight rows operational, four sub-types represented (hook-bug, merge-commit, post-rebase force-push, knip.json revert push — the last categorized as "operational" without a perfectly-fitting sub-type, which is itself a Category 2 stress-test data point recorded for the 2026-06-28 Devil's Court trigger).

## Acceptance Criteria

- [x] ADR-0028 § Amendment 2026-05-28 reads as a self-contained convention statement with categories, basis, enforcement description, and trial-doctrine triggers.
- [x] Build Record contains a bypass-log back-fill table covering all pending entries with PR, category, cause, and Steward sign-off columns.
- [x] Both amendments are referenced from each other as independent axes (§ Amendment 2026-05-27 governs WO closure timing; § Amendment 2026-05-28 governs bypass-log detail).
- [x] No edits to historical Build Records, Work Orders, or the Pulse.
- [x] Per § Amendment 2026-05-27 (uniform rule): this WO closes post-merge on `main` in a follow-up commit, not in the work commit. (Status will remain `Open` on the WO until the post-merge close-out commit.)

## Self-Debrief

**One bare spot in the new clause surfaced during the back-fill.** Row 1 (knip.json revert push) doesn't sit perfectly inside the four named operational sub-types. It's closest to "post-rebase force-push" in spirit (rewriting recently-pushed history) but the proximate action was a revert, not a rebase. Filed as operational because it carries no new application code; the residual edge is genuine and explicitly preserved as a data point for the 2026-06-28 Devil's Court trigger. If the next thirty days produce more cases in the "revert push" shape, a fifth sub-type may be warranted.

**The amendment was filed in the same session as the retrospective that triggered it.** This is faster than typical — usually a retro action item runs in a separate dispatch. Mitigation: the retro was already filed (separate paper-trail artifact); the CEO authorized in one line; the categorization work was the substantive thinking and happened in the post-retro discussion before any file was written. The fast cycle does not bypass any safeguard; it skips only the calendar delay.

**The 2026-05-27 amendment's "honest description of enforcement asymmetry" pattern is repeated here.** Both amendments name what they enforce and what they don't (Steward judgment for Category 1, minutes-discipline for Category 2; gate mechanical for backend-over-threshold WO close-timing, convention-only for the rest). The pattern is becoming a recognizable shape — amendments to ADR-0028 describe enforcement asymmetries in plain language rather than overclaiming mechanical coverage. Worth noting if a third amendment lands.

## Steward Evaluation

Self-evaluation because The Steward is both convener and builder on this Atrium-doc amendment.

The triggering retrospective was filed earlier today by The Steward in fresh-context mode (post-`/clear`). The Verdict named the bypass-log clause as the firm's highest-cost paper-trail debt. The Action Items said "Pick one before the next `--no-verify` accrues." The CEO chose option (b) — amend — on the Steward's recommendation. The amendment ships in the same session as the retro that triggered it.

The amendment is cheap (doc-only), bounded (one ADR + one BR + the back-fill table), and addresses the retro's primary verdict directly. It does not address the secondary verdict (Steward-seat bandwidth concentration); that is a longer-cycle architectural concern flagged in the retro's Notes for the CEO.

The amendment's principal risk: a future Brickwright (or future Steward) reads "operational bypass" liberally and starts logging code-bearing bypasses as one-liners. Mitigation: the Devil's Court trigger at "first code-bearing bypass under the new clause" forces re-interrogation at exactly the case that would reveal misuse. Calendar trigger at 30 days surveys actual operational incidence. If the categorization is being abused, the 30-day survey is where it surfaces.

Worth recording: this is the second ADR amendment in eight days. § Amendment 2026-05-27 was triggered by independent reviewer signal; § Amendment 2026-05-28 was triggered by retrospective verdict. Both are trial doctrine; neither modifies the gate's mechanical behavior. The pattern of "procedural amendments accumulating on a mechanical ADR" is worth watching — if a third amendment lands in the next 30 days, the firm should ask whether the procedural layer should be extracted into a separate convention document, leaving the ADR to its mechanical scope.

## References

- **Retrospective:** [`2026-05-28-retro.md`](../retrospectives/2026-05-28-retro.md) — Verdict + Action Items #1.
- **Prior amendment:** ADR-0028 § Amendment 2026-05-27 (uniform-rule convention; trial doctrine).
- **Worktree-hook fix (back-fill rows 5–7):** PR #126 (frontend) and pending follow-up for backend per [`2026-05-28-backend-pre-commit-worktree-safety`](../work-orders/2026-05-28-backend-pre-commit-worktree-safety.md).
- **CVE-2026-46644 cascade (back-fill rows 2–4):** PR #111.
- **`/retro` skill merge (back-fill row 8):** PR #129.
- **Minutes evidence:**
  - 2026-05-26: § Open-PR Sweep, Action Items.
  - 2026-05-27: § Parallel-dispatch burndown, Context block ("5 `--no-verify` Build Record back-fills now pending").
  - 2026-05-28: § Process Meta ("One `--no-verify` commit: The #129 merge commit (`7e2eddf`)").
