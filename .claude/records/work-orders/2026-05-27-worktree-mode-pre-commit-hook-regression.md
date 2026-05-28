# Work Order: Worktree-mode pre-commit hook regression

**Work Order #:** 2026-05-27-worktree-mode-pre-commit-hook-regression
**Filed:** 2026-05-27
**Issued By:** The Steward
**Assigned To:** Brickwright
**Wing:** Atrium (orchestrator-root `.githooks/`)
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `worktree-mode-pre-commit-hook-regression`

---

## The Job

The orchestrator-level pre-commit hook dispatcher (`.githooks/pre-commit`) reproducibly stages a spurious `src/shared/generated/component-registry.json` file at the repo root when invoked from a git worktree with frontend changes staged. The expected behavior is to stage `frontend/src/shared/generated/component-registry.json`. The `frontend/` prefix is dropped because the registry-regeneration step runs from `frontend/` cwd but the `git add` invocation resolves paths against the worktree root.

**Evidence (3 independent reproductions in one dispatch batch on 2026-05-27):**
- PR #119 (PartsPage) — push commit `814fea7`, BR Decisions §4
- PR #120 (SetsOverviewPage) — push commit `820cde2`, BR Decisions §5
- PR #121 (ComponentGallery) — push commit `a44f479`, BR Decisions §4

All three were forced to use `--no-verify` on the final amend to remove the spurious file. This is a Casebook Recurring Pattern level signal (3+ occurrences in one session).

## Scope

### In the Box

- File: `.githooks/pre-commit` (and any sibling dispatcher script that auto-regenerates `component-registry.json`).
- Diagnose the exact cwd / path-resolution interaction between the worktree dispatcher and the registry-regen step. The hook script's `git add src/shared/generated/component-registry.json` line should resolve to the path correctly in both contexts: main checkout (where `frontend/` is the cwd at the time of the call) and worktree checkout (where the same is true but the worktree root anchors `git add` differently).
- Fix: anchor the `git add` path via `git rev-parse --show-toplevel` + explicit `frontend/` prefix, OR run `git add` from inside the `frontend/` cwd, OR use `git -C frontend add src/shared/generated/component-registry.json`. The MINUTES.md 2026-05-19 Phase 3 entry already captured a sibling lesson — *"Hooks that `cd` must anchor via `git rev-parse --show-toplevel`"*. This bug is the inverse case: a hook that doesn't `cd` should anchor its `git add` similarly.
- Verify: write a reproduction in a temp worktree (`git worktree add ...`) with a frontend-only change, run the pre-commit hook, confirm the right file path is staged and no orchestrator-root spurious file appears.

### Not in This Set

- No changes to `frontend/scripts/` registry-regeneration logic (the script is correct; the hook's invocation of it is the bug).
- No changes to the husky-side `.husky/pre-commit` (this is an orchestrator dispatcher issue, not a wing-local one).
- No edits to other hook scripts (`pre-push`, etc.) unless the same bug surface exists in them.
- No changes to the `git add` patterns in CI workflows.

## Acceptance Criteria

- [ ] `.githooks/pre-commit` correctly stages `frontend/src/shared/generated/component-registry.json` from both main-checkout and git-worktree contexts.
- [ ] A reproduction case is documented in the Build Record: how to create a worktree where the pre-fix hook fails, and confirmation that the post-fix hook succeeds.
- [ ] No spurious orchestrator-root `src/shared/generated/component-registry.json` appears in `git status` after the hook runs from a worktree.
- [ ] Existing main-checkout pre-commit behavior unchanged (regression-test the happy path).
- [ ] Build Record records: the root-cause diagnosis (cwd/path-resolution interaction), the chosen fix, and the reproduction case.
- [ ] Casebook Recurring Pattern row added for *"Worktree-mode pre-commit hook regen path bug"* with 3 occurrences (the three 2026-05-27 dispatches) — proposed in Build Record's Proposed Knowledge Updates section; Steward applies post-merge.

## References

- MINUTES.md 2026-05-19 Phase 3 entry: *"Hooks that `cd` must anchor via `git rev-parse --show-toplevel`"* — sibling lesson.
- BRs documenting the three reproductions: `2026-05-27-partspage-spec-collect-guard-fix.md`, `2026-05-27-setsoverviewpage-spec-split.md`, `2026-05-27-componentgallery-spec-shallow-mount.md`.
- ADR-0028 § Amendment 2026-05-27 — the bypass-log clause that the three `--no-verify` pushes invoked.
- Standup [`2026-05-27-standup-empty-slate`](../standups/2026-05-27-standup-empty-slate.md) — the parallel-dispatch session that surfaced this finding.

## Notes from the Issuer

This finding is one of the most operationally meaningful outcomes of running the 5 WOs in parallel worktrees today. Single-worktree dispatches don't hit it because the hook's path-resolution accidentally works when the cwd happens to be the main checkout. Parallel worktree dispatches expose it consistently.

The fix is small. The framing is large: this is the first concrete cost of the parallel-dispatch workflow, and the cost is recoverable via this fix. Once landed, parallel-dispatch becomes net-cheaper. Worth treating as infrastructure investment, not just a bug.

Sub-threshold push (one hook script). ADR-0028 uniform-rule applies; close in post-merge follow-up commit on `main`.

---

**Status:** Open
**Build Record:** _to be filled when filed_
