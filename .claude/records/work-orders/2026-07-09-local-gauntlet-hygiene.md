# Work Order: Close three local-gauntlet hygiene gaps surfaced by the 2026-07-09 PR batch

**Work Order #:** 2026-07-09-local-gauntlet-hygiene
**Filed:** 2026-07-09
**Issued By:** The Steward (CEO-directed; consolidates three process findings from the 2026-07-09 dispatch batch)
**Assigned To:** The Steward (small infra slice, built directly)
**Wing:** Atrium (root hooks) + Gallery (lint-staged, pre-push chain)
**Priority:** Standard
**Status:** Completed (2026-07-09, batched close-out per ADR-0028 § Amendment 2026-07-09 Transition — merged in PR #255) — [Build Record](../build-records/2026-07-09-local-gauntlet-hygiene.md)
**Branch slug (for PrePushPermitGate):** `local-gauntlet-hygiene`

---

## The Job

Three independent gaps let defects pass every local gate and fail 5–20 minutes later in CI (or block legitimate commits locally). Each was hit live during the 2026-07-09 batch:

1. **Lockfile-only commits cannot pass pre-commit** (hit by the PR #250 lockfile sync). lint-staged's `*.{html,css,md,json}` glob feeds `package-lock.json` to oxfmt; oxfmt's ignore rules exclude lockfiles and it exits 1 when every matched file is ignored. Forced a sanctioned `--no-verify`.
2. **Conventional Commits enforced only in CI, and only for frontend-touching PRs** (hit by PR #252 — a 102-char header sailed through local hooks and failed commitlint in CI 20 minutes later). `frontend/.husky/commit-msg` exists but is dead code: `core.hooksPath=.githooks` bypasses Husky, and `.githooks/` has no commit-msg stage. Backend-only PRs get no commitlint at all (frontend-ci is path-filtered).
3. **The frontend pre-push gauntlet does not run the integration suite** (hit by PR #253 — a new import in `http.ts` broke the integration layer's wholesale fs-http mock; every local gate passed). The suite is CI-only, so changes to modules the integration layer mocks can only fail remotely. Measured locally at ~15s — trivially affordable in a chain whose coverage+build legs already run minutes.

## Scope

### In the Box

1. `frontend/package.json` lint-staged: add `--no-error-on-unmatched-pattern` to the json-glob oxfmt task (verified: exit 1 → 0 on a lockfile-only target set; behavior unchanged when real files match).
2. New `.githooks/commit-msg` stage: runs commitlint (frontend workspace binary + `.commitlintrc.json`) against the commit message, repo-wide. Skips gracefully with a notice when `frontend/node_modules` is absent (fresh clone) — CI remains the backstop; a missing dev dep must not block backend/docs commits.
3. `frontend/.husky/pre-push`: insert `npm run test:integration:run` between `test:coverage` and `build`, mirroring CI's step order.
4. Manual updates: root `CLAUDE.md` Git Hooks section (new commit-msg stage + updated pre-push chain) and `frontend/CLAUDE.md` Pre-Push Gauntlet line.

### Not in This Set

- No CI workflow changes — CI already enforces all three; this closes the local-remote gap only.
- No backend CaptainHook changes.
- No changes to what commitlint accepts (`.commitlintrc.json` untouched).

## Acceptance Criteria

- [ ] A staged change to `frontend/package-lock.json` alone passes the pre-commit pipeline (no `--no-verify`).
- [ ] `git commit` with a 100+-char header is rejected locally by the new commit-msg stage; a conforming message passes. Repo-wide (also fires on root/backend-only commits).
- [ ] `git push` with frontend changes runs the integration suite in the pre-push chain (observed live on this WO's own push).
- [ ] Both manuals describe the new reality.
- [ ] Both wings' gauntlets green on the PR.
