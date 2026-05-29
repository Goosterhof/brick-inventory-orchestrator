# Work Order: Make backend pre-commit dispatch block worktree-safe

**Work Order #:** 2026-05-28-backend-pre-commit-worktree-safety
**Filed:** 2026-05-28
**Issued By:** The Steward
**Assigned To:** Brickwright
**Wing:** Atrium (`.githooks/`)
**Priority:** When-convenient
**Branch slug (for PrePushPermitGate):** `backend-pre-commit-worktree-safety`

---

## The Job

The backend dispatch block in `.githooks/pre-commit` uses `--git-directory=../.git`, which assumes the parent's `.git/` is a directory. In a git worktree, `.git` at the worktree root is a **file** containing a `gitdir:` pointer to the real git directory (typically `<main-repo>/.git/worktrees/<name>/`). The `--git-directory=../.git` argument silently misbehaves under that condition because `vendor/bin/captainhook` expects a directory path. Sibling bug to the frontend cwd-unsafe pattern that PR #126 fixed.

This is the inverse case the General flagged in PR #126's review. Fix anchors the dispatch against the worktree-resolved git dir using `git rev-parse --git-common-dir` (which returns the correct path regardless of worktree vs main checkout).

## Scope

### In the Box

- File: `.githooks/pre-commit`
- Backend dispatch block (around lines 20-25 — the `(cd backend && vendor/bin/captainhook hook:pre-commit --git-directory=../.git)` pattern)
- Replace `../.git` with `$(git rev-parse --git-common-dir)` (resolved once at the top of the hook against the orchestrator root, then passed in) — or whatever the worktree-safe equivalent is for CaptainHook's argument shape
- Verify the fix by adding a backend file via `git worktree add` and confirming the pre-commit hook runs CaptainHook against the correct git dir, not a non-existent `backend/.git/`

### Not in This Set

- No changes to the frontend dispatch block (PR #126 already handled it)
- No changes to CaptainHook configuration itself
- No changes to which checks run (lint:test → phpstan → phpstan:types → deptrac → test:arch stays intact)
- No CI workflow changes

## Acceptance Criteria

- [ ] Backend dispatch block in `.githooks/pre-commit` resolves the git directory in a worktree-safe manner (no hardcoded `../.git`)
- [ ] Adding a backend file in a fresh `git worktree add` directory fires the backend gauntlet correctly (CaptainHook completes without "git dir not found"-class errors)
- [ ] Existing non-worktree backend commits unchanged in behavior
- [ ] CaptainHook pre-commit gauntlet green; pre-push gauntlet green
- [ ] Build Record records the diff and the worktree-reproduction confirmation (mirrors the PR #126 verification pattern)

## References

- Source finding: PR #126 General review caveat (3): *"Backend block has a sibling worktree bug (`--git-directory=../.git` assumes `.git` is a directory). Out of scope here per WO, but file it now so it doesn't rot."*
- Sibling fix: PR #126 — frontend dispatch worktree-safety fix (the pattern to mirror, inversely scoped)
- Sibling WO: [`2026-05-28-cleanup-misplaced-component-registry-json`](./2026-05-28-cleanup-misplaced-component-registry-json.md) — the other PR #126 follow-up
- Casebook recurring pattern: worktree-mode hook regression (3 reproductions in PRs #119/#120/#121, fixed in #126)

## Notes from the Issuer

The Casebook recurring pattern from the 2026-05-27 batch ("hooks that `cd` must anchor via `git rev-parse --show-toplevel`") generalizes to "hooks that hard-code git-dir paths must resolve via `git rev-parse --git-common-dir` to survive worktrees." The frontend fix (PR #126) and this backend fix together institutionalize the lesson across both dispatch blocks.

Brickwright should verify in an actual worktree before reporting done — the lesson from PR #126 was that without worktree-reproduction, the fix is defensive-only. The General's review of #126 explicitly named this as a verification gap; don't repeat it here.

Sub-threshold push. ADR-0028 uniform-rule applies; close in post-merge follow-up commit on `main`.

---

**Status:** Closed (2026-05-29, post-merge PR #138)
**Build Record:** [`2026-05-28-worktree-residue-sweep`](../build-records/2026-05-28-worktree-residue-sweep.md) — pre-commit fix + end-to-end CaptainHook verification (Rector 9→341 files). The `pre-push` sibling extension shipped separately in PR #140 ([`2026-05-28-backend-pre-push-worktree-safety`](../build-records/2026-05-28-backend-pre-push-worktree-safety.md)).
