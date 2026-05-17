# Monorepo Migration — Backend & Frontend → Baseplate

> Runbook for collapsing `backend/` and `frontend/` git submodules into this orchestrator repo as plain subdirectories.

## Context

The current setup tracks `backend/` (Laravel 13 API) and `frontend/` (Vue 3 SPA) as git submodules of the orchestrator (Baseplate). The split was an experiment in independent versioning, but in practice it adds friction: every change needs three coordinated PRs (submodule → submodule bump in Baseplate), CI is fragmented across three repos, cross-cutting refactors are clumsy, and a chunk of the developer workflow (`make submodule-update`, `make submodule-check`, drift detection) exists purely to manage the seam.

The goal is to collapse all three repos into one. The fact that `docker-compose.yml` already builds from `./backend` and `./frontend` paths, and the Makefile already `docker compose exec`s into containers rather than calling local tools, means the **physical layout barely changes** — we are mostly removing the `.gitmodules` indirection, unifying CI, and rewriting documentation. Application code itself does not need to move.

## Decisions

- **History:** snapshot at current HEAD, no commit-history preservation.
- **Old repos:** add a deprecation README pointing to the monorepo, then archive on GitHub.
- **CI:** one workflow file per surface (`backend-ci.yml`, `frontend-ci.yml`, `e2e.yml`) at the monorepo root, gated by `paths:` filters.
- **Deployment reconfig:** out of scope. Railway and Cloudflare Pages "Root Directory" changes are a follow-up task before production gets a push from the new layout.

## Approach

Snapshot-and-absorb. Each submodule's working tree is copied into the orchestrator as ordinary tracked files, the gitlink is removed, `.gitmodules` is deleted, and `backend/.git`/`frontend/.git` (currently 33-byte gitlink files) are removed. The result is a single repo with a `backend/` directory and a `frontend/` directory that look identical on disk to today, but no longer point at separate git histories.

---

## Phase 1 — Prep & Safety Net

1. Confirm `backend/` and `frontend/` are clean: `git -C backend status`, `git -C frontend status`.
2. Push the current submodule HEADs to their own remotes so nothing is lost. Frontend is currently 1 commit behind `origin/main` (`da6344d` vs. `c01c909`) — decide whether to fast-forward first. Backend is at `1f1d30d`.
3. Tag each submodule repo: `pre-monorepo-merge-YYYY-MM-DD` (use the date of the cut). This is the historical anchor referenced by the deprecation READMEs in Phase 6.

## Phase 2 — Absorb the Submodules

At the orchestrator root, on a migration branch:

```bash
# 1. Copy working trees aside
cp -a backend /tmp/bio-backend-snapshot
cp -a frontend /tmp/bio-frontend-snapshot

# 2. Deinit and remove the gitlinks
git submodule deinit -f backend frontend
git rm -f backend frontend
rm -rf .git/modules/backend .git/modules/frontend

# 3. Move working trees back as plain directories
mv /tmp/bio-backend-snapshot backend
mv /tmp/bio-frontend-snapshot frontend

# 4. Delete each subdir's gitlink .git file
rm -f backend/.git frontend/.git

# 5. Delete .gitmodules
git rm -f .gitmodules

# 6. Stage everything
git add backend/ frontend/
```

**Sanity checks before committing:**

```bash
# Should return nothing — no submodule artifacts left
git ls-files | grep -E '^\.gitmodules$'
find backend frontend -maxdepth 2 -name .git
```

## Phase 3 — Unify Tooling at the Root

### 3a. Git hooks (the trickiest item)

Backend uses **CaptainHook** (`backend/captainhook.json` installs hooks via `composer install`). Frontend uses **Husky + lint-staged** (`frontend/.husky/` installs via `npm install`'s `prepare` script). The orchestrator currently has no hooks.

In a monorepo, both subdirs' install scripts would write to the parent `.git/hooks/pre-commit`, clobbering each other. Recommended resolution:

- Disable hook autoinstall in both subdirs (drop `captainhook` from `backend/composer.json` post-install scripts; replace `frontend/package.json` `prepare` script with a no-op).
- Add a root-level dispatcher hook (`.githooks/pre-commit`, `.githooks/pre-push`) that inspects staged paths and delegates:
  - Staged `backend/**` → `cd backend && vendor/bin/captainhook hook:pre-commit`
  - Staged `frontend/**` → `cd frontend && npx lint-staged`
- `git config core.hooksPath .githooks` documented as a one-time `make init` step in CLAUDE.md.

This preserves both subdirs' existing gauntlets (the backend's `lint:test → phpstan → deptrac → test:arch` and the frontend's `type-check → knip → test:coverage → build`) without rewriting them.

### 3b. CI workflows

- Move `backend/.github/workflows/ci.yml` → `.github/workflows/backend-ci.yml`. Add `on.push.paths` / `on.pull_request.paths` filter for `backend/**`, `.github/workflows/backend-ci.yml`, `docker/backend.Dockerfile`. Add `defaults.run.working-directory: backend` so every job step runs in the right cwd.
- Move `frontend/.github/workflows/ci.yml` → `.github/workflows/frontend-ci.yml`. Same treatment with `frontend/**`, `.github/workflows/frontend-ci.yml`, `docker/frontend.Dockerfile`.
- Keep the orchestrator's existing `.github/workflows/e2e.yml`, but:
  - Remove the `submodules: recursive` flag from the checkout step.
  - Add `paths:` covering `backend/**`, `frontend/**`, `e2e/**`, `docker-compose*.yml`, `docker/**`.
- Delete `.github/workflows/quality.yml` — its responsibilities are superseded by the moved-in backend-ci.yml and frontend-ci.yml, which run deeper gates.

### 3c. Submodule-specific scaffolding

Remove from `Makefile`:
- `submodule-update`
- `submodule-check`
- Any other submodule-prefixed target.

Delete:
- `scripts/submodule-check.sh`
- Submodule-health checks inside `scripts/doctor.sh` (leave the rest of the doctor intact).

All other Makefile targets (`make up`, `make migrate`, `make test`, etc.) work unchanged — they `docker compose exec` into containers whose mounts are still `./backend` and `./frontend`.

### 3d. .env.example

Merge any backend/frontend `.env.example` keys not already covered into the root `.env.example`. The orchestrator's current `.env.example` already carries the connection-level keys (`DB_*`, `REBRICKABLE_API_KEY`, `VITE_API_URL`); spot-check for additions like `FRONTEND_URL` referenced in `backend/config/app.php`.

## Phase 4 — Documentation Rewrite

Rewrite the orchestrator's `CLAUDE.md`:
- Drop the "Restocking Parts (Submodule Workflow)" section.
- Reframe Project Overview — `backend/` and `frontend/` are subdirectories, not submodules. Keep the Brick/Plate metaphor — it's about role, not git plumbing.
- Update `@backend/CLAUDE.md` and `@frontend/CLAUDE.md` cross-reference syntax if needed (they should still resolve as local paths).
- Replace any `git submodule update` / `clone --recursive` instructions with plain clone.

Update `README.md` similarly.

Leave `backend/CLAUDE.md` and `frontend/CLAUDE.md` in place — they're sovereign per-surface manifests and the Stud & Sort / Brick & Mortar persona content stands on its own.

## Phase 5 — Local Verification

End-to-end smoke before push:

1. `rm -rf backend/vendor frontend/node_modules` — force fresh installs.
2. `make init` (or the equivalent post-rewrite bootstrap path).
3. `make up` — all three containers come up healthy.
4. `make migrate` succeeds.
5. `make test` (backend + frontend tests inside containers) passes.
6. `make lint` passes.
7. `make queue` starts (separate terminal) — verify worker connects.
8. `make e2e-up && make migrate && make e2e` — full Set Assembly Check.
9. **Hook sanity:** stage a backend file, attempt a commit, confirm captainhook fires; stage a frontend file, attempt a commit, confirm lint-staged fires; stage one of each, confirm both fire.
10. Push the migration branch. CI must show backend-ci, frontend-ci, and e2e all green with appropriate path-filter triggering.

## Phase 6 — Old Repos

After the monorepo PR merges to `main`:

1. In `Goosterhof/brick-inventory-backend`: replace `README.md` with a deprecation notice — _"This repo has been absorbed into [brick-inventory-orchestrator](https://github.com/Goosterhof/brick-inventory-orchestrator) as of YYYY-MM-DD. The final standalone state is tagged `pre-monorepo-merge-YYYY-MM-DD`."_ Commit, push.
2. Same for `Goosterhof/brick-inventory-frontend`.
3. Archive both via GitHub Settings → Archive this repository (read-only state).

---

## Critical Files

**Modified at orchestrator root:**
- `.gitmodules` — **deleted**
- `Makefile` — submodule targets removed
- `CLAUDE.md` — submodule sections rewritten
- `README.md` — same
- `.github/workflows/quality.yml` — **deleted**
- `.github/workflows/e2e.yml` — drop `submodules: recursive`, add path filters
- `scripts/submodule-check.sh` — **deleted**
- `scripts/doctor.sh` — drop submodule-health checks
- `.env.example` — merge in any missing keys

**Added at orchestrator root:**
- `.github/workflows/backend-ci.yml` (moved from `backend/.github/workflows/ci.yml`, path-filtered)
- `.github/workflows/frontend-ci.yml` (moved from `frontend/.github/workflows/ci.yml`, path-filtered)
- `.githooks/pre-commit` (root dispatcher)
- `.githooks/pre-push` (root dispatcher)

**Modified inside subdirs:**
- `backend/composer.json` — disable captainhook auto-install
- `backend/.github/` — delete (workflows moved up)
- `frontend/package.json` — neutralise the `prepare: husky` script
- `frontend/.husky/` — keep as reference but no longer auto-installed
- `frontend/.github/` — delete

**Untouched (this is the relief):**
- `docker-compose.yml`, `docker-compose.e2e.yml` (build contexts already use `./backend`/`./frontend`)
- `docker/backend.Dockerfile`, `docker/frontend.Dockerfile`
- All source in `backend/app/`, `backend/database/`, `frontend/src/`
- `e2e/` (tests hit `localhost:8000`/`5173`, layout-agnostic)
- Per-surface `CLAUDE.md`, ADRs, permits/journals, `.claude/` workspaces

---

## Verification — Definition of Done

1. **One clone, one checkout.** `git clone <orchestrator>` followed by `make init` produces a working stack with no `git submodule update --init` step.
2. **CI gates intact.** Backend mutation tests still run on backend PRs. Frontend coverage gate still runs on frontend PRs. E2E still runs when any of the three surfaces or compose files change. Verifiable by opening a one-line PR per surface and watching which workflows fire.
3. **Pre-commit gauntlets intact.** A staged backend file triggers captainhook's `lint:test → phpstan → deptrac → test:arch`. A staged frontend file triggers lint-staged. Verifiable manually per Phase 5 step 9.
4. **No drift artifacts left.** `git ls-files | grep -E '^\.gitmodules$'` returns nothing. `find backend frontend -maxdepth 2 -name .git` returns nothing.
5. **Old repos retired.** Both submodule repos show the GitHub "Archived" banner and a deprecation README on the landing page.

---

## Out of Scope (Follow-ups)

- **Deployment reconfig** — Railway "Root Directory" → `backend`; Cloudflare Pages root → `frontend`. Per the deployment decision, handled separately. Worth filing as a follow-up task before main is rebased so production isn't broken by a future push.
- **Consolidating `.claude/` workspaces** — three currently exist (orchestrator, backend, frontend). They can coexist as namespaced sovereign workspaces; consolidation is a separate discussion if desired.
- **Unified composer/npm at root** — a true monorepo could have a root `package.json` orchestrating both surfaces (Turborepo, Nx, plain workspaces). This plan does **not** introduce that — the Makefile + docker-compose are already the orchestration layer. Worth considering later if local dev needs a tighter loop than `make up`.
