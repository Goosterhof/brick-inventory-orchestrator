# Build Record: Close three local-gauntlet hygiene gaps

**Build Record #:** 2026-07-09-local-gauntlet-hygiene
**Filed:** 2026-07-09
**Builder:** The Steward (small infra slice, built directly)
**Wing:** Atrium (root hooks) + Gallery (lint-staged, pre-push chain)
**Work Order:** [`2026-07-09-local-gauntlet-hygiene`](../work-orders/2026-07-09-local-gauntlet-hygiene.md)
**Branch:** `local-gauntlet-hygiene`

---

## What Was Built

Three gaps that let defects pass every local gate and fail later in CI (or block legitimate commits), each hit live during the 2026-07-09 PR batch:

1. **lint-staged lockfile clash** (`frontend/package.json`) — added `--no-error-on-unmatched-pattern` to the json-glob oxfmt task. Root cause: the `*.{html,css,md,json}` glob feeds `package-lock.json` to oxfmt, whose ignore rules exclude lockfiles; oxfmt exits 1 when every matched file is ignored. Verified the flag flips exactly that case to exit 0 while leaving real-file formatting untouched (a `package.json` change flowed through the same task during this build's own commit).
2. **Dead commit-msg enforcement** (`.githooks/commit-msg`, new) — Conventional Commits is firm-wide doctrine but `frontend/.husky/commit-msg` never fires (`core.hooksPath=.githooks` bypasses Husky) and CI's commitlint step only runs on PRs touching `frontend/**`. The new stage runs commitlint repo-wide from the frontend workspace, with a graceful skip + notice when `frontend/node_modules` is absent (fresh clone) so a missing dev dependency can't block backend/docs commits. Message-file path anchored absolutely before `cd` (worktree-safe, per the PR #138/#140 anchoring pattern).
3. **Integration suite absent from pre-push** (`frontend/.husky/pre-push`) — inserted `npm run test:integration:run` between `test:coverage` and `build`, mirroring CI's order. Measured at ~13.5s locally (negligible against the multi-minute coverage+build legs). Motivating incident: PR #253's `guarded` import broke the integration layer's wholesale fs-http mock while every local gate passed.

Manuals updated: root `CLAUDE.md` Git Hooks section (new commit-msg paragraph, updated pre-push chain) and `frontend/CLAUDE.md` Pre-Push Gauntlet line (with the PR #253 provenance note).

## AC Verification

| AC | Result |
|---|---|
| Lockfile-only staged change passes pre-commit | **Pass** — synthetic `package-lock.json`-only change run through the real `.githooks/pre-commit`: the oxfmt task COMPLETED (was FAILED), hook exit 0, tree restored |
| Malformed header rejected at write time | **Pass** — 120+-char no-type header blocked by the new stage (3 commitlint problems; HEAD unmoved); conforming `chore:` header committed, then reset |
| Push runs integration suite | **Pass** — observed live on this branch's own push (frontend files in range → `type-check → knip → test:coverage → test:integration:run → build`) |
| Manuals describe reality | **Pass** — both files updated in this diff |
| Gauntlets green | **Pass** — pre-commit + pre-push ran un-bypassed on this build's own commit/push |

## Decisions

- **oxfmt flag over glob surgery:** `--no-error-on-unmatched-pattern` is oxfmt's purpose-built answer; an extglob exclusion (`!(package-lock).json`) would encode the same intent more fragilely.
- **Repo-wide commit-msg, not path-routed:** the doctrine is firm-wide and backend-only PRs currently get no commitlint at all (frontend-ci is path-filtered), so scoping the hook to frontend commits would preserve half the gap. `.commitlintrc.json` is untouched — nothing new is demanded of messages, only *when* violations surface changes.
- **Graceful skip on missing node_modules:** a dev-dependency absence must not block unrelated commits; the skip prints a notice and CI remains the backstop.
