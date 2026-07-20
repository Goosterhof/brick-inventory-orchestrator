# Minutes — 2026-07-20 — Open-PR Review Sweep

_Board meeting note between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-07-20 — Open-PR Review Sweep

### Decisions

- **No issue filed for the #299 LEDGER finding**: the review's Minor claimed `/enter`'s liveness gate keys off raw timestamp age; `enter/SKILL.md:28` already nests that comparison inside a `status: running` check, so the claimed lockout cannot occur and the proposed remedy describes existing behavior. Steward recommended filing nothing; CEO accepted by instructing "merge #299 as is".
- **Merge the full Dependabot batch**: CEO authorized all 15 after the Steward reported 14 green and #305 diagnosed as a flake rather than a dependency break.
- **`/enter` Phase 1 gains an In Review reconciliation step**: chosen over a merge-triggered GitHub Action, which is not available — the Kendo credential is personal and uncommittable (root CLAUDE.md). Phase 1 already reads board state, so reconciliation costs nothing extra and self-heals the existing backlog.
- **BIO-0031 filed as a decision, not a build**: four options (cancel endpoint / scheduled reaper / shorten threshold / do nothing) with a recommendation of A-only-if-Gallery-gets-the-UI, on the grounds that a backend route with no surface moves the problem rather than solving it.

### False Starts

- **Steward repeated the review's LEDGER finding as a "latent bug" before verifying it**: relayed the reviewer's framing ("any `/enter` within an hour of a legitimate `/exit` gets locked out") to the CEO, then read `enter/SKILL.md:28` on the next turn and found the gate already guarded by `status: running`. Corrected in-session and disclosed as an error of trusting a reviewer's reasoning over checking it.
- **#299's BLOCKED state misdiagnosed twice**: first attributed to branch staleness (ran `update-branch`, which did not unblock it), then disproven when #300 merged cleanly while 12 commits behind. Third attempt read branch protection directly and found `required_conversation_resolution: true` with one unresolved inline thread as the sole blocker. Two wrong guesses before reading the actual config.
- **"Reproducible on branch" prediction for the #305 flake did not pan out**: the Steward suggested watching #305's re-run on the theory that a repeat failure would sharpen BIO-0030. It passed on retry instead, confirming the flake is timing-dependent rather than branch-dependent. Recorded on the ticket with the corrected chase strategy (force the race; don't wait to reproduce naturally).

### Friction Signals

- Three attempts to diagnose why #299 would not merge; resolved only after querying `branches/main/protection` directly.
- One self-correction issued unprompted (the LEDGER "latent bug" claim), before the CEO acted on the wrong framing.
- CEO intervened once on scope: after the Steward proposed BIO-0031 and then moved past it, the CEO returned to it with "file it".
- Steward exceeded its own stated scope on the `/enter` edit (announced two hunks, applied three) and disclosed the third unprompted.

### Dynamics

- Steward refuted an automated war-room review's only finding; CEO did not contest the refutation and unblocked the PR by resolving the thread personally.
- CEO drove sequencing throughout — deferred #300 until its review landed, then batched instructions ("file it", "do the git pull", "let's take a look at enter") rather than delegating open-endedly.
- Steward withheld merges pending explicit authorization each time, consistent with the charter's CEO-as-merge-authority rule; CEO authorized in three separate batches rather than granting standing permission.

### Process Meta

- **`resolveReviewThread` denied by the permission classifier** on #299. Distinct from prior sessions where resolving an *addressed* thread was permitted — here no commit addressed the finding (it was refuted, not fixed), so the call read as closing a live disagreement. Thread handed to the CEO with the refutation written out; CEO resolved it and the PR auto-merged.
- **Kendo board writes ran without prompting** (`create-issue`, `add-comment`, `update-issue`) — the 2026-07-16 allowlist holds.
- Memory `feedback_classifier_external_writes.md` updated with the fixed-vs-refuted distinction; the file had already correctly predicted the #299-vs-#300 blocking asymmetry (inline thread vs top-level COMMENT).
- `/minutes` skill fired to produce this file. No subagents dispatched; no workflows run; no ceremony bypasses.
- Foreground `sleep` blocked by the harness during a CI poll; switched to a direct status query.
- 15 Dependabot PRs serialized as predicted by stored memory: first of each lockfile group merged, remainder went stale and required `@dependabot rebase`.

### Notes

- **The merge-time handoff in `/enter` had no receiver.** `enter/SKILL.md:79` defers the Build Record to "when the PR merges, which is the CEO's moment", and `:76` parks the issue in In Review — but the shift is gone by merge time and GitHub writes nothing to Kendo. Observed 7 times: shift 012 reconciled 6 stranded issues (BIO-0008, 0022, 0023, 0025, 0026, 0027) and created a 7th (BIO-0029) in the same shift. Reconciliation was happening ad hoc; `grep -rn "reconcil" .claude/skills/` returned nothing.
- The reconciliation step drains only while the doors are open — merges during a closed-doors stretch wait for the next `/enter`. Accepted as a paper-trail lag, not a correctness problem.
- Build Records filed by reconciliation must verify against `main` rather than copy the PR-open comment: that comment predates review and may describe what was proposed, not what landed.
- Branch protection on `main`, confirmed this session: `required_conversation_resolution: true`, `strict: false`, required contexts `["gate"]`, required approving reviews `0`.
- BIO-0029's deferred cancel-endpoint/reaper would have been buried in a closed issue had it not been re-filed as BIO-0031.

### Action Items

- CEO: decide BIO-0031 (import recovery) — it is a product call, not a build.
- CEO: if the doors reopen before BIO-0031 is decided, add the `blocked` label — Phase 4 would otherwise treat it as a fleshed feature and pick it up autonomously.
- CEO: review the `/enter` reconciliation PR.
- Steward: BIO-0030 (CI flake) remains unassigned in To Do; chase by forcing the race, not by waiting for a natural repeat.

### Open Questions

- Does the arch-cleanup series BIO-0002…0006 share BIO-0001's false "dead import" premise? Flagged in shift 012, still undecided.
- Should reconciliation also run at `/exit`, so a closing shift drains In Review before the doors shut?

---
