# Building Permit: Monorepo Migration — Absorb Frontend into Baseplate

**Permit #:** 2026-05-17-monorepo-migration
**Filed:** 2026-05-17
**Issued By:** CEO
**Assigned To:** Lead Brick Architect (orchestrator-level execution; the firm cross-references this permit so the Pre-Push Permit Gate finds it when backend files are in the push range)
**Priority:** Standard

---

## The Job

The Baseplate is absorbing the standalone frontend repo via `git subtree add --prefix=frontend` so that `frontend/` becomes a tracked subdirectory of `brick-inventory-orchestrator`. The standalone repo will be archived after deploy reconfig is verified. This permit exists on the firm's records so cross-territory permit lookups (and any future frontend-side pre-push gating) accept pushes from the `chore/monorepo-migration` branch.

## Scope

### In the Box

- Subtree-merge `Goosterhof/brick-inventory-frontend` into `frontend/` of the orchestrator (history preserved).
- Replace `frontend/package.json`'s `"prepare": "husky"` with a no-op so Husky does not auto-install hooks into the parent `.git/hooks/` directory.
- Update `frontend/CLAUDE.md` to note that hooks are dispatched from the root, while `lint-staged` behavior is unchanged.
- Move `frontend/.github/workflows/ci.yml` → orchestrator `.github/workflows/frontend-ci.yml` with widened path filters (Makefile, docker-compose, scripts/, .env.example) and `defaults.run.working-directory: frontend`.
- Add a `npm` entry under `directory: /frontend` to the orchestrator's new root `.github/dependabot.yml`.
- Delete the now-empty `frontend/.github/` after the move.

### Not in This Set

- Modifying any frontend `src/`, component, page, modal, service, or test code. Frontend internals are untouched.
- Modifying `frontend/.husky/` content (lint-staged config + hook script bodies) — only the auto-install trigger is neutralized.
- Modifying ADRs, journals, inspection reports, or other permits.
- Cloudflare Pages deployment configuration (handled at orchestrator level, Phase 0).

## Acceptance Criteria

- [ ] `frontend/` is a plain subdirectory of the orchestrator after `git subtree add`, with full pre-merge history reachable via `git log` and `git blame`.
- [ ] `frontend/package.json`'s `prepare` script is a no-op (husky autoinstall neutralized).
- [ ] `frontend/CLAUDE.md` mentions the root dispatcher for pre-commit hooks.
- [ ] `frontend/.github/` is removed; frontend-ci.yml lives at orchestrator root with path filters covering `frontend/**`, `docker/frontend.Dockerfile`, `docker-compose*.yml`, `Makefile`, `scripts/**`, `.env.example`.
- [ ] Root `.github/dependabot.yml` lists `npm` ecosystem with `directory: /frontend`.
- [ ] Staging a frontend file and committing invokes `lint-staged` via the root dispatcher (`cd frontend && npx lint-staged --relative`), with backend's CaptainHook gauntlet skipped.

## References

- Migration Plan: `docs/monorepo-migration-plan.md` in the orchestrator (sovereign blueprint)
- Decision: ADR-0013 (Pre-Push Permit Gate — backend side; frontend has no equivalent pre-push gate today)
- Related Permit: `backend/.claude/records/permits/2026-05-17-monorepo-migration.md` (the Brick's side of the same migration)

## Notes from the Issuer

The frontend has no pre-push gate, so this permit is informational on the Plate side — the firm's paper trail tracks the migration but no machine enforcement depends on this permit existing. The CFO should evaluate the dispatcher implementation and the husky-no-op when the construction journal is filed. No frontend source code moves; the firm's floor plan does not change.

---

**Status:** Completed
**Journal:** _to be filed at orchestrator level after Phase 5 verification_
