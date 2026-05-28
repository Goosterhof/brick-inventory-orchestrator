# Work Order: phpunit.feature-coverage.xml `<env>` block gap

**Work Order #:** 2026-05-27-phpunit-feature-coverage-env-blocks
**Filed:** 2026-05-27
**Issued By:** The Steward
**Assigned To:** Brickwright
**Wing:** Foundry
**Priority:** When-convenient
**Branch slug (for PrePushPermitGate):** `phpunit-feature-coverage-env-blocks`

---

## The Job

`backend/phpunit.feature-coverage.xml` is missing the `<env name="APP_KEY">` and `<env name="REBRICKABLE_API_KEY">` declarations that `backend/phpunit.xml` carries. First-time `composer test:feature-coverage` runs in a fresh checkout (notably git worktrees, where `.env` is not auto-populated) fail with `MissingAppKeyException` + unresolvable `RebrickableService` until the env is manually generated. Bring the feature-coverage config to parity with the main phpunit config so the gauntlet is reproducible from any clean checkout.

## Scope

### In the Box

- File: `backend/phpunit.feature-coverage.xml`
- Compare `<env>` blocks against `backend/phpunit.xml`; copy across the missing entries verbatim (do not invent new env values — match `phpunit.xml` exactly).
- Verify by running `composer test:feature-coverage` from a fresh `git worktree add` of the backend that has not had its `.env` populated. Should succeed without `MissingAppKeyException`.

### Not in This Set

- No changes to `backend/phpunit.xml` (it is the source of truth; the feature-coverage config copies from it).
- No changes to the test suite itself, no new tests.
- No changes to `.env.example`, `backend/.env`, or env-loading order.
- No changes to the CI workflow's env block (CI may already inject these via `env:` at the workflow level — verify but do not edit).

## Acceptance Criteria

- [ ] `backend/phpunit.feature-coverage.xml` carries `<env name="APP_KEY">` and `<env name="REBRICKABLE_API_KEY">` declarations matching `backend/phpunit.xml` exactly (and any other env blocks that exist in `phpunit.xml` but not the feature-coverage variant).
- [ ] `composer test:feature-coverage` runs cleanly from a fresh worktree without manual `.env` setup.
- [ ] Existing `composer test` and `composer test:coverage` runs unchanged.
- [ ] CaptainHook pre-commit gauntlet green; pre-push gauntlet green.
- [ ] Build Record records the diff (which env blocks were added) and the worktree-reproduction confirmation.

## References

- Source finding: PR #122 / `2026-05-27-logoutcontroller-stateful-session-test.md` Build Record — *Latent issue flagged for Steward attention*.
- Related WO: [`2026-05-27-worktree-mode-pre-commit-hook-regression`](./2026-05-27-worktree-mode-pre-commit-hook-regression.md) — the other worktree-mode infrastructure finding from today's parallel-dispatch session.

## Notes from the Issuer

The smallest of the WOs filed in the 2026-05-27 follow-up batch. Doc-config one-liner per missing env block. Filed at `When-convenient` because the bug only surfaces in fresh-worktree contexts; existing developers with populated `.env` files don't trip on it.

Together with the worktree-mode pre-commit hook WO, this clears the infrastructure debt that the morning's parallel-dispatch session surfaced. After both land, the firm's parallel-dispatch workflow becomes meaningfully smoother — the next batch of N parallel Brickwrights won't pay this tax.

Sub-threshold push. ADR-0028 uniform-rule applies; close in post-merge follow-up commit on `main`.

---

**Status:** Open
**Build Record:** _to be filled when filed_
