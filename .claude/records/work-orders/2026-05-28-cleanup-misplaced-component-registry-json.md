# Work Order: Delete misplaced `src/shared/generated/component-registry.json` at orchestrator root

**Work Order #:** 2026-05-28-cleanup-misplaced-component-registry-json
**Filed:** 2026-05-28
**Issued By:** The Steward
**Assigned To:** Brickwright
**Wing:** Atrium (root cleanup)
**Priority:** When-convenient
**Branch slug (for PrePushPermitGate):** `cleanup-misplaced-component-registry-json`

---

## The Job

PR #119's `--no-verify` push committed `src/shared/generated/component-registry.json` at the **orchestrator root** instead of under `frontend/src/shared/generated/`. The correct file already exists at the canonical Gallery-wing path. The root copy is a residual artifact — wrong path, wrong wing, never read by any tooling. PR #126's worktree-safe pre-commit fix prevents recreation of this artifact but does not delete the existing misplaced file. This WO removes the residual.

## Scope

### In the Box

- File to delete: `src/shared/generated/component-registry.json` (orchestrator root)
- Verify the canonical file at `frontend/src/shared/generated/component-registry.json` is intact and unaffected
- Verify no tooling (lint, build, test) references the root path (it should not — the path was never intentional)
- The directory tree `src/shared/generated/` at root may also be empty after the delete; remove the empty parent directories up to (but not including) any directory still in use

### Not in This Set

- No changes to `frontend/src/shared/generated/component-registry.json` (canonical file — leave alone)
- No changes to `.githooks/pre-commit` (PR #126 already fixed the source bug)
- No changes to the component-registry generation script or its output path
- No retroactive cleanup of `--no-verify` Build Record back-fills (separate doctrinal concern under ADR-0028)

## Acceptance Criteria

- [ ] `src/shared/generated/component-registry.json` no longer exists at orchestrator root
- [ ] `frontend/src/shared/generated/component-registry.json` unchanged (canonical location intact)
- [ ] `git status` clean post-delete; only the deletion in the staged diff
- [ ] `make lint` and `make test` pass unchanged (the root file was not referenced)
- [ ] CaptainHook pre-commit gauntlet green; pre-push gauntlet green
- [ ] Build Record records the delete + verification that no tooling broke

## References

- Source finding: PR #126 General review caveat (2): *"Residual artifact still on `main`. PR #119's `--no-verify` push committed `src/shared/generated/component-registry.json` at the orchestrator root (wrong path). This fix prevents recreation but does not delete the misplaced file."*
- Root cause: PR #119 `--no-verify` bypass + pre-fix `.githooks/pre-commit` cwd-unsafe `git add` (resolved in PR #126)
- Sibling WO: [`2026-05-28-backend-pre-commit-worktree-safety`](./2026-05-28-backend-pre-commit-worktree-safety.md) — the other PR #126 follow-up

## Notes from the Issuer

Smallest of the post-#126 cleanup WOs — a one-file delete with verification. Filed at `When-convenient` because the misplaced file does no active harm (no tooling reads it), it's just visual noise in the repo root and a reminder of the `--no-verify` debt.

Sub-threshold push. ADR-0028 uniform-rule applies; close in post-merge follow-up commit on `main`.

---

**Status:** Open
**Build Record:** _to be filled when filed_
