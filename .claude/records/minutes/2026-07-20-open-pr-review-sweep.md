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

## 2026-07-20 — PR #317 Review, Vue 3.6 / Vapor Investigation, Import Throttle

_Continuation of the same session; second entry._

### Decisions

- **#317's Minor fixed rather than deferred**: the review classed the no-op `RateLimiter::clear` as "pre-existing, not introduced here" and recommended ticketing both files. Steward split it — the `FeedbackControllerTest` copy was being *added by that PR*, so removing it is declining to ship known-dead code, not scope creep; only the `InviteCodeControllerTest` instance is genuinely pre-existing (BIO-0032). CEO chose this over ticket-both-and-merge.
- **Delete the dead line rather than correct it**: a working `RateLimiter::clear(md5('feedback'.$user->id))` would still be dead code, but dead code that looks alive. Replaced with a comment recording why no reset is needed.
- **Vue 3.6 / Vapor split into two tracked issues, neither actionable now**: BIO-0033 (bump to 3.6 stable for the alien-signals reactivity refactor, no Vapor) and BIO-0034 (Vapor evaluation, `blocked`, `blocked_by` BIO-0033). Rationale: the reactivity win is a zero-source-change dependency bump; Vapor is blocked upstream.
- **Import throttle: `perHour(5)`, keyed by `family_id`** (BIO-0035). The limit is floored by BIO-0029: reclamation at 1200s means a worker-down retry cadence tops out at 3600/1200 = 3/hour, so any limit ≤3 would 429 a legitimate reclamation retry and undo that fix. Family-keying is a deliberate deviation from every other limiter in `AppServiceProvider` (all key by user id) because the protected resource is the family's Rebrickable token and quota, and the endpoint's concurrency invariant is already family-scoped.

### False Starts

- **Answered "is Vue 3.6 released?" from search results before checking the registry**: the first web searches returned blog posts stating Vapor Mode "was confirmed as stable in Vue 3.6, released in early 2026". `npm view vue dist-tags` showed `latest: 3.5.40`, with 3.6.0-rc.1 on the `rc` tag published two days earlier. Several of those posts appear AI-generated. Corrected before reporting; the registry and vuejs/core release notes were used as the sources of record.
- **`WebFetch` of `vuejs.org/guide/extras/vapor-mode.html` 404'd**, and a fetch of the GitHub releases page returned 2024 dates for 2026 releases. Both discarded in favour of the GitHub API (`gh api repos/vuejs/core/releases`), which returned verifiable publish timestamps.

### Friction Signals

- Steward raised the unthrottled import endpoint four times across the session before the CEO acted on it; on the third mention Steward stated it would stop asking and merely leave it flagged.
- Two background-command timeouts: the pre-commit gauntlet exceeded the 2-minute foreground Bash limit (91.96s CaptainHook run plus overhead), requiring re-run under `run_in_background`.
- CEO batched three instructions in one message ("file it", "do the git pull", "let's take a look at enter"), and later corrected course on #317 by choosing option (a) over the review's own recommendation.

### Dynamics

- Steward disagreed with the #317 review's framing (pre-existing vs newly-introduced) and proposed a sharper split; CEO took the Steward's option over the reviewer's.
- Steward recommended against adopting Vapor despite the CEO's stated interest, on evidence rather than preference; CEO did not push back and asked for tracking issues instead.
- Steward flagged the family-vs-user keying decision as "the part most worth a second opinion" in both the issue and the PR rather than presenting it as settled.

### Process Meta

- `/minutes` fired twice this session (this is the second entry, appended to the same per-session file).
- `resolveReviewThread` succeeded on both #316 and #317 (commit-addressed findings) after being denied on #299 (refuted finding) — three data points now confirm the fixed-vs-refuted distinction recorded in memory.
- Test-first proof performed on BIO-0035 by sabotage rather than assertion-reading: removing the route middleware failed all 3 new tests; re-keying the limiter to `user_id` failed only the family-sharing test. Files restored from `/tmp` backups and re-verified green.
- `gh pr diff <n> -- <path>` rejected the pathspec argument ("accepts at most 1 arg"); worked around with `awk` over the full diff.
- Full Foundry gauntlet ran through the real `.githooks` dispatcher on the Steward's commits — noted in contrast to the war room's checkout, where `core.hooksPath` is unset.

### Notes

- **Vapor readiness scan of `frontend/src/`**: zero occurrences of Options API, `getCurrentInstance()`, `v-memo`, `globalProperties`, custom directives, `@vue:` lifecycle events, and `slots.default()` dry-runs. 96 of 98 SFCs use `<script setup>`. All `$attrs`/`h()` hits are in test files. Production code carries essentially no Vapor migration debt.
- **Vapor's blockers are ecosystem, not codebase**: `@vue/test-utils` has no Vapor support (no code hits, no commits in last 60, no issues; latest v2.4.11); Vitest #9402 (`defineVaporComponent is not a function`) has been open since 2026-01-07 with zero comments. Against BIO's 100% coverage threshold, converting one component breaks its specs with no supported fix.
- Vue's own RC guidance recommends Vapor only for partial use in existing apps or small new apps entirely in Vapor, and warns against mixed nesting with VDOM component libraries. BIO's Gallery is mixed-nesting by design (25 files Phosphor, 17 ui-inputs, 104 `@script-development/*`).
- If Vapor is ever piloted, `showcase` is the target — dev-only, never ships, own build target, 27 SFCs — **not** `families`. Caveat: showcase is not coverage-excluded, so blocker 1 applies there too.
- A war-room Sapper M9 record claims `/feedback` was "the only external-egress endpoint without one" — false at HEAD, as BIO-0035 documents. Correcting it is war-room territory.
- `core.hooksPath` is unset in the war room's checkout of this repo, so `.githooks` never fires there; a war-room PR can reach `main` without hooks having run.

### Action Items

- CEO: review and merge the BIO-0035 import-throttle PR; confirm or overrule the `family_id` keying.
- CEO: decide BIO-0031 (import recovery) — still open from the first entry.
- CEO: raise the stale Sapper M9 record and the unset `core.hooksPath` with the war room; both are outside BIO's write scope.
- Steward: BIO-0032 (no-op `RateLimiter::clear` in `InviteCodeControllerTest`) unassigned in To Do.
- Steward: BIO-0033 must not start until `vue@3.6.0` reaches the `latest` dist-tag.

### Open Questions

- Should BIO-0034's unblock conditions be actively watched (upstream issue polling), or revisited ad hoc at a later sweep?
- Does the `?? $request->ip()` fallback in the limiter closures serve any purpose inside the `auth:sanctum` group, given `$request->user()->id` would already fatal on a null user? Mirrored for consistency in BIO-0035 without resolving the question.

---
