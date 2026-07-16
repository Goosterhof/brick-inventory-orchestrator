# Work Order: Make PrePushPermitGate worktree-aware

**Work Order #:** 2026-07-09-permit-gate-worktree-blindness
**Filed:** 2026-07-09
**Issued By:** The Steward (escalation from the `transaction-boundary-test-rigor` build, PR #254)
**Assigned To:** Brickwright (Foundry Wing)
**Wing:** Foundry (tooling — `backend/tools/CaptainHook/PrePushPermitGate.php`)
**Priority:** Standard
**Status:** Migrated to Kendo — BIO-0011 (2026-07-16). File frozen as archive; live tracking on the board.
**Branch slug (for PrePushPermitGate):** `permit-gate-worktree-blindness`

---

## The Job

When a push runs from a git worktree, PrePushPermitGate scans the **main checkout's** `.claude/records/work-orders/` directory while diffing the **worktree's** branch — `getRoot()` resolves through the git common dir to the main checkout. A Work Order that exists only on the worktree's branch (the normal state for agent-dispatched builds, where the WO ships in a parallel records PR) is invisible to the gate, and the push is refused despite a valid permit.

Observed 2026-07-09: PR #254's first push was refused even though the branch carried a byte-identical copy of its WO; the builder had to restore an untracked copy of the WO into the main checkout to satisfy the gate. Same defect family as the worktree-mode pre-commit/pre-push dispatch bugs fixed in PRs #138/#140 (hooks must anchor paths against the *working tree* they serve, not the common dir).

## Scope

### In the Box

- Resolve the permit directory against the current working tree (the worktree root when pushing from a worktree), falling back to the main checkout — or scan both, preferring the working tree. Follow the anchoring pattern established by the PR #138/#140 fixes.
- Unit tests in `backend/tests/Unit/Tools/` covering the worktree case (permit present only in the working tree's records dir) and the main-checkout case (unchanged behavior).
- Full detail of the failure is in the Build Record [`2026-07-09-transaction-boundary-test-rigor`](../build-records/2026-07-09-transaction-boundary-test-rigor.md) — read its escalation section first.

### Not in This Set

- No changes to the gate's threshold or slug-matching rules (ADR-0028 doctrine).
- No changes to `.githooks/` dispatchers (already worktree-safe per #138/#140).

## Acceptance Criteria

- [ ] A push from a worktree whose branch carries the matching open WO passes the gate without copying files into the main checkout.
- [ ] Pushes from the main checkout behave exactly as before (existing PrePushPermitGate unit tests untouched and green).
- [ ] `composer test` green; gate exercised live from a worktree in the Build Record.
