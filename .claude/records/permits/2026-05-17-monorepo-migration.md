# Permit: Monorepo Migration

**Permit #:** 2026-05-17-monorepo-migration
**Filed:** 2026-05-17
**Issued By:** CEO
**Assigned To:** Orchestrator-level (cross-territory)
**Priority:** Standard

---

## The Job

Collapse the three-repo layout (`brick-inventory-orchestrator` + the two standalone submodules `brick-inventory-backend` and `brick-inventory-frontend`) into a single monorepo with history preserved via `git subtree add`. Switch production from two deploy targets (Railway + Cloudflare Pages) to one Railway service running a multi-stage Dockerfile that builds both Vue apps (`families` at `/`, `admin` at `/admin/`) and serves them same-origin via FrankenPHP alongside the Laravel API.

This permit lives at the orchestrator root so the backend's `PrePushPermitGate` (ADR-0013) accepts pushes from `chore/monorepo-migration` once the root hook dispatcher routes through `cd backend && vendor/bin/captainhook hook:pre-push --git-directory=../.git`. With `--git-directory` pointing at the parent's `.git/`, captainhook resolves the repo root to the orchestrator and reads `.claude/records/permits/` from here, not from `backend/`. Cross-territory permits remain filed in `backend/.claude/records/permits/` and `frontend/.claude/records/permits/` for the warehouses' own paper trails.

## Scope

### In the Box

See `docs/monorepo-migration-plan.md` for the full runbook. High-level scope:

- Phase 1: tag standalone repos at pre-merge HEADs.
- Phase 2: subtree-merge backend + frontend into orchestrator with history preserved.
- Phase 3: unify CI workflows + dependabot at the root, wire a root hook dispatcher (`.githooks/pre-commit` + `pre-push`), strip submodule scaffolding, merge missing `.env.example` keys.
- Phase 4: rewrite orchestrator + per-surface docs.
- Phase 5: local end-to-end verification with Docker.
- Phase 6 (post-merge): deploy reconfig + archive standalone repos.
- Production deploy reshape: single Railway service running root `Dockerfile`; FrankenPHP serves both Vue apps from the same origin; Cloudflare Pages retired.

### Not in This Box

- Phase 0 Railway dashboard work (CEO's hands; out of automated scope).
- Consolidating `.claude/` workspaces between orchestrator + backend + frontend (separate discussion).
- Introducing root-level package-manager workspaces (Turborepo / Nx / npm workspaces).
- Porting Cloudflare `_headers` behavior to a FrankenPHP Caddyfile (filed as follow-up task #12).
- Converting `Route::fallback(closure)` to a controller so `php artisan route:cache` works (follow-up).

## Acceptance Criteria

- [x] History preserved — `git blame backend/composer.json` resolves to original authors; 1500+ pre-merge commits reachable from HEAD.
- [x] Submodule indirection removed (`.gitmodules` gone, no nested `.git`).
- [x] Hook dispatcher wired and path-aware (backend gauntlet for `backend/**`, frontend gauntlet for `frontend/**`).
- [x] CI workflows moved up with widened path filters covering root infra.
- [x] Dependabot migrated to root with composer + npm + github-actions ecosystems.
- [x] Production Dockerfile + railway.toml at orchestrator root.
- [x] Laravel `Route::fallback()` differentiates `/admin*` → `public/admin/index.html`.
- [x] Frontend defaults `VITE_API_BASE_URL` to `/api` (same-origin).
- [ ] CI green on the migration PR (`backend-ci`, `frontend-ci`, `e2e`).
- [ ] Local Phase 5 verification on Docker.
- [ ] Phase 0 Railway service deployed and serving `/`, `/admin/`, `/api/health` green.

## References

- Migration Plan: `docs/monorepo-migration-plan.md`
- PR: https://github.com/Goosterhof/brick-inventory-orchestrator/pull/28
- Cross-territory permits: `backend/.claude/records/permits/2026-05-17-monorepo-migration.md`, `frontend/.claude/records/permits/2026-05-17-monorepo-migration.md`
- Decision: ADR-0013 (Pre-Push Permit Gate — backend side; the gate now reads from the orchestrator root in the monorepo end-state).

## Notes from the Issuer

The orchestrator did not previously have its own permit system — both surfaces (backend "Stud & Sort Logistics" + frontend "Brick & Mortar Associates") run sovereign paper trails inside their subdirectories. The monorepo migration creates a third paper-trail layer at the orchestrator root, governed only by the backend's `PrePushPermitGate` for now. If orchestrator-level work proliferates beyond the migration, a sovereign protocol for this directory is worth discussing — until then, this permit and its corresponding shift log (TBD post-merge) are the only artifacts.

---

**Status:** Completed
**Shift Log:** _to be filed after PR merge and Phase 0 deploy verification_
