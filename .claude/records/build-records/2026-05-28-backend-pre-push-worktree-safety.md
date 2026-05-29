# Build Record: Make backend pre-push dispatch block worktree-safe

**Build Record #:** 2026-05-28-backend-pre-push-worktree-safety
**Filed:** 2026-05-28 · **Reconciled:** 2026-05-29 (post-rebase, see note below)
**Work Order:** none of its own — pre-push was an unscoped sibling extension, sub-threshold (PrePushPermitGate skips it). The parent WO [`2026-05-28-backend-pre-commit-worktree-safety`](../work-orders/2026-05-28-backend-pre-commit-worktree-safety.md) named `pre-commit` only and was closed by PR #138.
**Builder:** Brickwright (via Steward, Opus-4.8 harness review session)
**Wing:** Atrium (orchestrator-root `.githooks/`)

> **Reconciliation note (2026-05-29) — parallel-session collision.**
> A second Opus-4.8 session shipped **PR #138 (`worktree-residue-sweep`)** which independently fixed the **`pre-commit`** dispatch with the identical `git rev-parse --git-common-dir` approach, closed the parent WO `2026-05-28-backend-pre-commit-worktree-safety`, and — crucially — **ran CaptainHook end-to-end in a real worktree** (observing Rector inspect 9-of-341 files pre-fix vs 341 post-fix). PR #138 merged to `main` first (`2b93a8e`). This PR (#140) was then rebased onto that `main`: its duplicate `pre-commit` hunk was dropped (main's #138 version kept), leaving this Build Record to cover **only the `pre-push` sibling fix** that #138 did not touch. The pre-push resolution was aligned byte-for-byte to #138's merged pre-commit idiom, so #138's end-to-end CaptainHook verification transfers directly — **the residual verification gap this BR originally flagged is now closed.**

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Modified | `.githooks/pre-push` | Backend dispatch block: replaced `--git-directory=../.git` with `--git-directory="$git_common_dir"`, resolved once near the top of the hook via `git_common_dir=$(cd "$(git rev-parse --git-common-dir)" && pwd)`. Byte-identical to the resolution PR #138 landed in `pre-commit`. |
| (not touched) | `.githooks/pre-commit` | Owned by PR #138 (merged first). This PR's duplicate hunk was dropped during rebase; `pre-commit` on this branch equals `main`. |

## Work Order Fulfillment

The parent WO (`2026-05-28-backend-pre-commit-worktree-safety`, `pre-commit` only) is **satisfied and closed by PR #138**. This Build Record covers the **`pre-push` sibling** — the same defect three lines into the pre-push gauntlet call — which #138 left in place.

| Criterion (applied to `pre-push`) | Met | Notes |
|---|---|---|
| Backend dispatch resolves the git directory worktree-safely (no hardcoded `../.git`) | Yes | `pre-push` now resolves via `cd "$(git rev-parse --git-common-dir)" && pwd`, identical to `pre-commit`. |
| Pushing a backend file from a fresh `git worktree add` fires the gauntlet against the correct git dir | Yes | The resolution is verified in a real worktree (below); CaptainHook execution is covered by #138's end-to-end run against the byte-identical resolution form. |
| Existing non-worktree backend pushes unchanged in behavior | Yes | In a main checkout the resolution yields `<root>/.git` — the exact inode the old `../.git` pointed at. Byte-equivalent. |
| Both sibling hooks resolve the shared git dir consistently | Yes | `pre-commit` (from #138) and `pre-push` (here) carry byte-identical resolution lines. |

## Root-Cause Diagnosis

The backend dispatch in both hooks runs CaptainHook from inside `backend/` and passed `--git-directory=../.git`:

```bash
(cd backend && printf '%s\n' "$stdin_buffer" | vendor/bin/captainhook hook:pre-push --git-directory=../.git)
```

`../.git` relative to `backend/` is `<root>/.git`. In a **main checkout** that is the real git directory, so the call works. In a **linked worktree**, `.git` at the worktree root is a *file* containing a `gitdir:` pointer — not a directory — so `--git-directory=<worktree>/.git` points CaptainHook at a non-directory. This is the inverse of the frontend cwd-unsafe pattern PR #126 fixed; the General's PR #126 review explicitly flagged this sibling bug ("Backend block has a sibling worktree bug ... file it now so it doesn't rot"). PR #138 fixed the `pre-commit` half; the `pre-push` half is fixed here.

## Chosen Fix

Resolve the shared git directory once, worktree-safely, near the top of the hook (after the existing `cd "$repo_root"`), using the exact idiom PR #138 landed in `pre-commit`:

```bash
git_common_dir=$(cd "$(git rev-parse --git-common-dir)" && pwd)
```

`git rev-parse --git-common-dir` returns the *shared* git directory — the real `.git` — regardless of worktree vs. main checkout. In a worktree it is already absolute; in a main checkout it is the relative string `.git`, which the `cd … && pwd` normalizes to absolute so the value survives the inner `cd backend` subshell. The backend dispatch then passes `--git-directory="$git_common_dir"`.

**Why `--git-common-dir` and not `--git-dir`:** the old `../.git` resolved to the *common* dir (the shared `.git`), not the worktree-private gitdir. `--git-common-dir` preserves that exact target; `--git-dir` would return the per-worktree `.git/worktrees/<name>` path, changing behavior.

## Verification

**1. The fault, in a real worktree** (resolution level, reproduced for this BR):

```
$ git worktree add --detach /tmp/wt HEAD
$ cd /tmp/wt && file .git
.git: ASCII text                      # a FILE, not a directory
$ cd backend && [ -d ../.git ] && echo dir || echo "NOT a dir"
NOT a dir                             # the bug: --git-directory=../.git is invalid here
```

**2. The fix resolves correctly in both contexts** (verified directly during the #140 review session on a PHP-8.5 workstation):

| Context | `git_common_dir` resolves to | Is a directory? | Matches old `../.git` |
|---|---|---|---|
| Main checkout | `<root>/.git` | YES | same inode |
| Linked worktree | `<root>/.git` (shared) | YES | old form was a FILE (the bug) |

**3. `bash -n .githooks/pre-push`** passes (syntax check).

**4. End-to-end CaptainHook execution — CLOSED via PR #138.** #138 ran a real backend commit from a `git worktree add` directory on host PHP 8.5 with `backend/vendor` installed and observed the behavioral correction (Rector 9-of-341 files → 341). Because `pre-push` here uses the byte-identical resolution form, #138's run is direct evidence the absolute `--git-directory` is accepted by CaptainHook. This was the residual gap the original (pre-rebase) BR could not close in-container; the parallel PR closed it.

## Quality Gauntlet

Neither wing's gauntlet fires on this commit — the diff touches `.githooks/`, `.claude/`, and root docs only. No `backend/` or `frontend/` code path. The verification above IS the test. (The broader #140 governance changes — ADR-0028 bypass-log retirement, per-session minutes, advisory-nudge-hook removal, Quality Warden → opus — are session texture captured in the minutes file `.claude/records/minutes/2026-05-28-opus-4.8-harness-review.md`, not code paths.)

## Self-Debrief

### What Went Well

- The fix shape was prescribed by the sibling frontend BR and the WO; `git rev-parse --git-common-dir` is the worktree-safe analogue of the frontend `--show-toplevel` anchor.
- The parallel-session collision was caught at review time (not at merge), deconflicted cleanly (merge #138 first, rebase #140 to keep only the unique pre-push fix + governance), and the sibling hooks were aligned to a single idiom rather than left to drift apart.

### What Went Poorly

- Two Opus-4.8 sessions independently built the same pre-commit fix under the same WO — wasted parallel effort and a near-double-close of one WO. The firm should serialize or claim WOs before dispatching parallel harness-review sessions. Logged as the headline learning for this bundle.

### Blind Spots

- The original BR over-scoped to "pre-commit and pre-push" while a sibling PR already owned pre-commit; the collision was invisible until the open-PR review swept all three orchestrator PRs together.

---

## Steward Evaluation

_Appended by The Steward after reviewing the Build Record. The builder's sections above are not edited — they stand as written._

**Overall Assessment:** Solid — clean deconfliction of a parallel-work collision; the residual verification gap was closed by the sibling PR rather than left open, and the two hooks were unified on one idiom.

### Notes for the Builder

The real lesson is upstream of the code: parallel harness-review sessions need WO claiming so two builders don't forge the same brick. The pre-push fix itself is correct and now consistent with its sibling. Good catch deconflicting before both PRs hit `main`.
