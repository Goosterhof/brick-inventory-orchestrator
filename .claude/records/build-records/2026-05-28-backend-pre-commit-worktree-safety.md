# Build Record: Make backend pre-commit dispatch block worktree-safe

**Build Record #:** 2026-05-28-backend-pre-commit-worktree-safety
**Filed:** 2026-05-28
**Work Order:** [`2026-05-28-backend-pre-commit-worktree-safety`](../work-orders/2026-05-28-backend-pre-commit-worktree-safety.md)
**Builder:** Brickwright (via Steward, Opus-4.8 harness review session)
**Wing:** Atrium (orchestrator-root `.githooks/`)

> **Work Order Status Discipline (ADR-0028, amended 2026-05-27):**
> This Build Record ships with the parent Work Order still in `Status: Open`. After this Build Record's PR merges to `main`, a follow-up commit on `main` flips the WO Status to `Closed` and updates the WO's "Build Record:" link to point at this BR.

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Modified | `.githooks/pre-commit` | Backend dispatch block: replaced `--git-directory=../.git` with `--git-directory="$git_common_dir"`, where `git_common_dir` is resolved once near the top of the hook via `git rev-parse --git-common-dir` and normalized to an absolute path. |
| Modified | `.githooks/pre-push` | Identical twin fix: the backend dispatch block carried the same `--git-directory=../.git` defect three lines into the gauntlet call. Scope extended beyond the WO (which named `pre-commit` only) because the bug is byte-identical and leaving it would re-open the same failure on the next over-threshold backend push from a worktree. |

## Work Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Backend dispatch block resolves the git directory worktree-safely (no hardcoded `../.git`) | Yes | Both hooks now resolve via `git rev-parse --git-common-dir`. |
| Adding a backend file in a fresh `git worktree add` fires the gauntlet against the correct git dir | Partial — mechanism verified, CaptainHook execution not | See "Verification". The git-dir *resolution* is verified directly in a real worktree; CaptainHook itself could not be run in this container (no PHP 8.5, no `backend/vendor`). |
| Existing non-worktree backend commits unchanged in behavior | Yes | In a main checkout, `git rev-parse --git-common-dir` resolves to `$repo_root/.git` — the exact inode the old `../.git` (relative to `backend/`) pointed at. Byte-equivalent. |
| CaptainHook pre-commit gauntlet green; pre-push gauntlet green | Not run | Toolchain unavailable in the harness-review container; flagged as the residual verification step for a PHP-8.5 machine. |
| Build Record records the diff and the worktree-reproduction confirmation | Yes | Below. |

## Root-Cause Diagnosis

The backend dispatch in both hooks runs CaptainHook from inside `backend/` and passes `--git-directory=../.git`:

```bash
(cd backend && vendor/bin/captainhook hook:pre-commit --git-directory=../.git)
```

`../.git` relative to `backend/` is `<root>/.git`. In a **main checkout** that is the real git directory, so the call works. In a **linked worktree**, `.git` at the worktree root is a *file* containing a `gitdir:` pointer — not a directory. `--git-directory=<worktree>/.git` then points CaptainHook at a path that is not a directory, which is the inverse of the frontend cwd-unsafe pattern PR #126 fixed. The General's PR #126 review explicitly flagged this sibling bug ("Backend block has a sibling worktree bug ... file it now so it doesn't rot").

## Chosen Fix

Resolve the shared git directory once, worktree-safely, near the top of each hook (after the existing `cd "$repo_root"`):

```bash
git_common_dir=$(git rev-parse --git-common-dir)
case "$git_common_dir" in
    /*) ;;
    *) git_common_dir="$repo_root/$git_common_dir" ;;
esac
```

`git rev-parse --git-common-dir` returns the *shared* git directory — the real `.git` — regardless of worktree vs. main checkout. The `case` normalizes the relative `.git` that git emits in a main checkout to an absolute path, so the value is correct after the subshell `cd backend`. The backend dispatch then passes `--git-directory="$git_common_dir"`.

**Why `--git-common-dir` and not `--git-dir`:** the old `../.git` resolved to the *common* dir (the shared `.git`), not the worktree-private gitdir. `--git-common-dir` preserves that exact target; `--git-dir` would return the per-worktree `.git/worktrees/<name>` path, changing behavior.

I extended the same fix to `pre-push`. The WO scoped `pre-commit` only, but the `pre-push` backend block has the identical `--git-directory=../.git` call. Fixing one and shipping the other broken would re-trigger the Casebook recurring pattern on the next over-threshold backend push from a worktree. Scope extension recorded here for the Steward's review.

## Verification

This Build Record was produced in the Opus-4.8 harness-review container, which has **Node 22, PHP 8.4, and no `backend/vendor`** — so CaptainHook cannot run here. What was verified directly:

**1. The fault, in a real worktree:**

```
$ git worktree add --detach /tmp/wt HEAD
$ cd /tmp/wt && file .git
.git: ASCII text                      # a FILE, not a directory
$ cat .git
gitdir: /home/.../brick-inventory-orchestrator/.git/worktrees/wt
$ cd backend && [ -d ../.git ] && echo dir || echo "NOT a dir"
NOT a dir                             # <-- the bug: --git-directory=../.git is invalid here
```

**2. The fix resolves correctly in both contexts:**

| Context | `git_common_dir` resolves to | Is a directory? |
|---|---|---|
| Main checkout | `<root>/.git` (same inode as old `../.git`) | YES |
| Linked worktree | `<root>/.git` (the shared dir) | YES |

**3. Both hooks pass `bash -n`** (syntax check).

**Residual step (out-of-container):** run a real backend commit from a `git worktree add` directory on a PHP-8.5 machine with `backend/vendor` installed, and confirm CaptainHook completes without a "git dir not found"-class error. The resolution mechanism is verified; CaptainHook's acceptance of the absolute path is inferred from the byte-equivalence to the prior working `../.git` form (both resolve to the same shared `.git`).

## Quality Gauntlet

Neither wing's gauntlet fires on this commit — the diff touches `.githooks/` and `.claude/records/` only. No `backend/` or `frontend/` code path. The verification above IS the test.

### Foundry Wing

| Check | Result | Notes |
|---|---|---|
| (gauntlet skipped — no backend code changes) | N/A | Hook diff path doesn't trigger the backend block; and the container lacks PHP 8.5 / vendor regardless. |

### Gallery Wing

| Check | Result | Notes |
|---|---|---|
| (gauntlet skipped — no frontend changes) | N/A | No `frontend/` paths touched. |

## Self-Debrief

### What Went Well

- The fix shape was already prescribed by the sibling frontend BR and the WO. `git rev-parse --git-common-dir` is the worktree-safe analogue of the `--show-toplevel` anchor used for the frontend fix.
- The fault reproduced cleanly at the git-plumbing level in a real worktree, so the diagnosis is not theoretical even though the full gauntlet couldn't run.

### What Went Poorly

- CaptainHook execution could not be verified end-to-end in this container. This is the same verification-gap shape the General flagged on PR #126; here it is environmental (no PHP 8.5 / vendor) rather than a choice, and it is named explicitly rather than papered over.

### Blind Spots

- The fix assumes CaptainHook accepts an absolute `--git-directory`. This is inferred from byte-equivalence with the prior working relative form; not directly observed.

---

## Steward Evaluation

_Appended by The Steward after reviewing the Build Record. The builder's sections above are not edited — they stand as written._

**Overall Assessment:** Excellent | Solid | Adequate | Needs Improvement

### Notes for the Builder

_Direct feedback._
