# Minutes — 2026-05-29 — Open-PR Harness Review Batch + #140 Merge

_Board meeting note between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-05-29 — Open-PR Harness Review Batch + #140 Merge

### Decisions

- **Four harness PRs reviewed, all MERGE**: orchestrator #140, zmuuzn #98, war-room #21 + #22. #98 and #22 flagged for retitle (real infra/governance buried under `docs`/`chore` labels). Posted as PR review comments.
- **Deconflict #138/#140 via "merge #138 first, rebase #140"** (CEO chose via AskUserQuestion): #138 had the end-to-end-verified pre-commit fix + stray-file cleanup; #140 rebased to keep only the unique pre-push fix + governance bundle.
- **Align pre-push to #138's `cd "$(git rev-parse --git-common-dir)" && pwd` idiom byte-for-byte** so both sibling hooks resolve the shared git dir identically — making #138's CaptainHook run transfer directly to pre-push.
- **WO-claiming convention left to `/retro`, not formalized** (CEO chose option b): one collision isn't a pattern; defer doctrine until a recurrence shows up.

### Friction Signals

- The #138/#140 collision (two Opus-4.8 sessions building the same pre-commit fix under the same WO) was invisible until the open-PR review swept all three orchestrator PRs together — neither session could see the other.
- Direct push of the WO-closure commit to `main` denied by the auto-mode classifier → rerouted through PR #141 (which matched the firm's actual convention anyway — `close … WOs (#137)`-style commits land via PR, not direct push).
- `git reset --hard origin/main` discarded the uncommitted WO edits (the commit+push were a single denied bash block, so nothing committed) → edits redone on the branch.

### Dynamics

- CEO drove in three terse directives: "post as review comments" → "work on our PR so we can merge it" → "b" (defer doctrine). Steward gathered state and recommended at each fork; CEO made the deconfliction and doctrine calls.

### Process Meta

- Skills fired: `/minutes` (this file). No subagents dispatched — all review/merge work done by the main Steward.
- `gh pr review` ×4 (comment-type; self-approve blocked on own PRs); `gh pr merge --squash` ×3 (#138, #140, #141); rebase of #140 with one conflict on `.githooks/pre-commit` resolved by keeping main's #138 version.
- Independent worktree verification of the git-common-dir resolution run on this PHP-8.5 workstation (closed the gap #140's BR flagged at the resolution level).
- Background `gh pr checks --watch` used to wait on #140 CI (e2e ~6min long pole); all green.
- Auto-mode classifier denial on direct-`main` push (see Friction).

### Notes

- The deconfliction was net-positive: #138's end-to-end CaptainHook run (Rector 9→341 files) closed the exact verification gap #140's review had flagged — the parallel work, once merged in order, completed each other.
- Cross-repo learnings noted but not actioned here (they live in sibling repos): instrument-before-relaxing (zmuuzn #98 / Pattern 024), workflows fit wide read-only sweeps with adversarial cross-check (war-room #22), n>1 floor for prompt-change validation (war-room #21).

### Action Items

- [ ] **`/retro`**: watch for a *second* parallel-session collision before promoting "claim the WO before parallel dispatch" to doctrine (ADR-0028 amendment or CLAUDE.md note).
- [x] Retitle zmuuzn #98 + war-room #22 (CEO: already done).

### Open Questions

- Does the firm need a lightweight WO-claiming/locking mechanism for parallel harness sessions, or is serial dispatch enough? Deferred to `/retro` on recurrence.

---
