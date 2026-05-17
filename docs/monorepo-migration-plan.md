# Monorepo Migration — Backend & Frontend → Baseplate

> Runbook for collapsing `backend/` and `frontend/` git submodules into this orchestrator repo as plain subdirectories.

## Context

The current setup tracks `backend/` (Laravel 13 API) and `frontend/` (Vue 3 SPA) as git submodules of the orchestrator (Baseplate). The split was an experiment in independent versioning, but in practice it adds friction: every change needs three coordinated PRs (submodule → submodule bump in Baseplate), CI is fragmented across three repos, cross-cutting refactors are clumsy, and a chunk of the developer workflow (`make submodule-update`, `make submodule-check`, drift detection) exists purely to manage the seam.

The goal is to collapse all three repos into one. The fact that `docker-compose.yml` already builds from `./backend` and `./frontend` paths, and the Makefile already `docker compose exec`s into containers rather than calling local tools, means the **physical layout barely changes** — we are removing the `.gitmodules` indirection, unifying CI, migrating hooks, and rewriting documentation. Application code itself does not need to move.

## Decisions

- **History:** preserve via `git subtree add`. The cost is repo size; the gain is intact `git blame`, PR cross-references, and ADR archaeology — load-bearing for a portfolio piece that markets itself as a showcase of engineering quality.
- **Production deployment shape:** one Railway service running a root `Dockerfile` that multi-stages Node + Composer + FrankenPHP, with both shipping Vue apps overlaid into `backend/public/` — `families` at `/`, `admin` at `/admin/`. **Cloudflare Pages is retired.** FrankenPHP serves everything from the same origin: `/api/*` flows through Laravel, `/admin` and `/admin/*` fall through to `public/admin/index.html`, every other route falls through to `public/index.html` via `Route::fallback()` in `backend/routes/web.php`. The `showcase` app is dev-only and never ships.
- **Deployment reconfig:** lands **before** the monorepo merge, not after. See Phase 0. Merging first and reconfiguring later would let the next prod deploy fire against a broken Railway build (the standalone backend repo has no frontend dist to serve from).
- **Old repos:** add a deprecation README pointing to the monorepo, then archive on GitHub — **after** Railway is verified green serving the monorepo image (see Phase 6).
- **CI:** one workflow file per surface (`backend-ci.yml`, `frontend-ci.yml`, `e2e.yml`) at the monorepo root. Path filters cover both each surface's subtree AND the root infra it depends on (`Makefile`, `docker-compose*.yml`, `docker/<surface>.Dockerfile`, `.env.example`, `scripts/`).
- **Dependabot:** migrate `backend/.github/dependabot.yml` to a root `.github/dependabot.yml` with composer (`/backend`) and npm (`/frontend`) entries. Without this, GitHub silently stops opening backend dependency PRs after the move.

## Estimated effort & rollback

- **Time:** 1–2 focused days for someone who already knows the territory. Phase 3a (hooks) is the only step likely to push back.
- **Rollback:** the migration branch is throwaway up to and including Phase 5. If anything fails, abandon the branch — submodule setup on `main` is untouched. After merge to `main`, rollback is `git revert` of the merge commit (subtree merges are revertible) plus reverting the Phase 0 deploy reconfig.

## Approach

History-preserving subtree merge. `git subtree add --prefix=backend <backend-repo> main` (and same for frontend) folds the standalone repo's full commit history into the orchestrator as a merge commit. The result is a single repo, no `.gitmodules`, no gitlinks, with `git blame` still reaching back into the per-surface history.

---

## Phase 0 — Deployment Reconfig (Before the Merge)

The deploy shape changes: backend and frontend collapse into a single Railway service. Cloudflare Pages is retired. The orchestrator's root `Dockerfile` builds both surfaces into one image, served same-origin by FrankenPHP.

1. **Add a new Railway service** wired to the orchestrator repo (`Goosterhof/brick-inventory-orchestrator`) with **Root Directory `/`** so Railway picks up `Dockerfile` and `railway.toml` at the orchestrator root. Leave the existing backend service on the standalone source untouched for now (rollback path).
2. **Copy env vars** from the existing backend Railway service to the new one: `APP_KEY`, `APP_URL`, `DATABASE_URL`, `REBRICKABLE_API_KEY`, `RESEND_API_KEY`, `SANCTUM_STATEFUL_DOMAINS` (now just the prod domain — same-origin), and any others currently set.
3. **Trigger a manual deploy** from the orchestrator's `chore/monorepo-migration` branch. Wait for healthcheck `/api/health` to come up green. Visit `/` in a browser — the families SPA should load.
4. **Add the worker service** (queue:work) wired to the same image. Set its startCommand to `php artisan queue:work --queue=default --tries=3 --backoff=10 --timeout=60 --max-time=3600`. See `backend/CLAUDE.md` → "Queue Worker" for the procedure.
5. **Point the production domain** (e.g., `brick-inventory.com`) at the new Railway service. The old `api.brick-inventory.com` either redirects to the new origin or is retired — your call.
6. **Cloudflare Pages:** delete the project hosting the standalone frontend. The same-origin Railway service replaces it.

If you'd rather flip in one shot: keep both services running until the new one is verified, then DNS-cut traffic over.

## Phase 1 — Prep & Safety Net

1. Confirm both submodules are clean: `git -C backend status`, `git -C frontend status`.
2. **Fast-forward both submodules to `origin/main`.** Today's `git submodule status` shows `+da6344d` for frontend — the gitlink lags origin by one commit. A one-shot migration is not the time to snapshot stale state.
   ```bash
   git -C backend pull --ff-only origin main
   git -C frontend pull --ff-only origin main
   ```
3. Confirm both standalone HEADs are on `origin/main` (nothing diverged locally).
4. Tag each standalone repo: `pre-monorepo-merge-YYYY-MM-DD`. This is the historical anchor referenced by the deprecation READMEs in Phase 6.

## Phase 2 — Absorb the Submodules (Subtree Merge)

At the orchestrator root, on a migration branch:

```bash
# 1. Deinit and remove gitlinks
git submodule deinit -f backend frontend
git rm -f backend frontend
rm -rf .git/modules/backend .git/modules/frontend
git rm -f .gitmodules
git commit -m "chore: remove submodule indirection"

# 2. Subtree-merge each surface, preserving history
git remote add brick-inventory-backend https://github.com/Goosterhof/brick-inventory-backend.git
git fetch brick-inventory-backend main
git subtree add --prefix=backend brick-inventory-backend/main

git remote add brick-inventory-frontend https://github.com/Goosterhof/brick-inventory-frontend.git
git fetch brick-inventory-frontend main
git subtree add --prefix=frontend brick-inventory-frontend/main

# 3. Remote refs no longer needed for ongoing work; remove to keep the remote list clean
git remote remove brick-inventory-backend
git remote remove brick-inventory-frontend
```

**Sanity checks before pushing:**

```bash
# No submodule artifacts left
git ls-files | grep -E '^\.gitmodules$'        # must return nothing
find backend frontend -maxdepth 2 -name .git    # must return nothing

# History reach — these must succeed
git log --oneline -- backend/app/Actions/ | tail -5
git blame backend/composer.json | head -3
git log --oneline -- frontend/src/ | tail -5
```

## Phase 3 — Unify Tooling at the Root

### 3a. Git hooks — the riskiest item

Backend uses **CaptainHook** (5-step pre-commit + `PrePushPermitGate` + `composer test` on pre-push, per `backend/captainhook.json`). Frontend uses **Husky 9 + lint-staged** (pre-commit only, via `frontend/package.json`'s `prepare: husky` script). The orchestrator currently has no hooks.

In a monorepo, both subdirs' install scripts target the parent `.git/hooks/pre-commit` and will clobber each other. Today CaptainHook silently no-ops because `backend/.git` is a 33-byte gitlink file; in the monorepo `.git` becomes the parent's real directory and the install will start writing.

**Resolution:**

1. **Neutralize per-surface autoinstall.**
   - `backend/composer.json`: delete the `post-install-cmd` block (currently the `vendor/bin/captainhook install --force --skip-existing` invocation near line 90). Leave `captainhook/captainhook` as a dev dependency — `vendor/bin/captainhook` is still needed for the gauntlet to run from the dispatcher.
   - `frontend/package.json`: replace `"prepare": "husky"` with `"prepare": "echo 'husky managed by root dispatcher'"`. Husky stays installed as a dev dep so `lint-staged` still has its plumbing.

2. **Add a root dispatcher** at `.githooks/pre-commit` and `.githooks/pre-push`. The dispatcher inspects staged paths (or pushed range for pre-push) and delegates:

   ```bash
   # .githooks/pre-commit (sketch)
   staged_backend=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^backend/' || true)
   staged_frontend=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^frontend/' || true)

   if [ -n "$staged_backend" ]; then
       (cd backend && vendor/bin/captainhook hook:pre-commit) || exit 1
   fi
   if [ -n "$staged_frontend" ]; then
       (cd frontend && npx lint-staged --relative) || exit 1
   fi
   ```

   `--relative` makes `lint-staged` emit paths relative to `frontend/` so its `*.vue` patterns still match. For `pre-push`, mirror the same split: skip `PrePushPermitGate` and `composer test` when the pushed range touches no `backend/` files. Frontend has no pre-push hook today, so frontend-only pushes pay nothing extra.

3. **One-time wire-up:** `git config core.hooksPath .githooks`. Add a Makefile target (`hooks-install`, or fold into `init`) so contributors don't have to remember.

### 3b. CI workflows

- Move `backend/.github/workflows/ci.yml` (281 lines — non-trivial; audit, don't paste) → `.github/workflows/backend-ci.yml`. Add:
  ```yaml
  on:
    push:
      branches: [main]
      paths:
        - 'backend/**'
        - '.github/workflows/backend-ci.yml'
        - 'docker/backend.Dockerfile'
        - 'docker-compose.yml'
        - 'docker-compose.e2e.yml'
        - 'Makefile'
        - '.env.example'
        - 'scripts/**'
    pull_request:
      branches: [main]
      paths: [ ...same list... ]
  defaults:
    run:
      working-directory: backend
  ```
  Backend's standalone CI runs natively (no Docker). When moved up, that's still fine — but any Postgres `services:` block needs to keep working from the new working-directory. Audit the workflow for any path assumption that breaks when run from repo root.
- Move `frontend/.github/workflows/ci.yml` (54 lines) → `.github/workflows/frontend-ci.yml`. Same `paths:` shape with `frontend/**` and `docker/frontend.Dockerfile`.
- Keep `.github/workflows/e2e.yml`, but:
  - Remove `submodules: recursive` from the checkout step (line 18 today).
  - Add `paths:` covering `backend/**`, `frontend/**`, `e2e/**`, `docker-compose*.yml`, `docker/**`, `Makefile`.
- Delete `.github/workflows/quality.yml` — superseded by the moved-in workflows, which run deeper gates.
- Migrate `backend/.github/dependabot.yml` → `.github/dependabot.yml` with `package-ecosystem: composer, directory: /backend` and `package-ecosystem: npm, directory: /frontend`. Verify in the GitHub Dependabot tab post-merge.

### 3c. Submodule-specific scaffolding

Remove from `Makefile`:
- `submodule-update`
- `submodule-check`
- Any other submodule-prefixed target.

Add a `hooks-install` target (or fold into `init`) that runs `git config core.hooksPath .githooks` once.

Delete:
- `scripts/submodule-check.sh`
- Submodule-health checks inside `scripts/doctor.sh` (leave the rest intact).

All other Makefile targets (`make up`, `make migrate`, `make test`, `make e2e`, etc.) work unchanged — they `docker compose exec` into containers whose mounts are still `./backend` and `./frontend`.

### 3d. .env.example

Merge any backend/frontend `.env.example` keys not already covered into the root `.env.example`. Spot-check for `FRONTEND_URL` referenced in `backend/config/app.php` and any Brickognize/Rebrickable additions.

## Phase 4 — Documentation Rewrite

Rewrite the orchestrator's `CLAUDE.md`:
- Drop the "Restocking Parts (Submodule Workflow)" section.
- Reframe Project Overview — `backend/` and `frontend/` are subdirectories. Keep the Brick/Plate metaphor — it's about role, not git plumbing.
- Replace any `git submodule update` / `clone --recursive` instructions with plain clone.
- Add the `git config core.hooksPath .githooks` step (or `make hooks-install`) to the local setup section.

Touch `backend/CLAUDE.md`:
- The Pre-Commit Gauntlet and Pre-Push Gauntlet sections currently describe direct CaptainHook invocation. Note that hooks are dispatched from the root, while the gauntlet contents (`lint:test → phpstan → deptrac → test:arch`, then `PrePushPermitGate → composer test`) are unchanged.

Touch `frontend/CLAUDE.md`:
- Same: note the dispatcher; husky/lint-staged behavior is unchanged.

Update `README.md` for the new single-clone story.

ADRs, permits/journals, and per-surface persona content (Stud & Sort, Brick & Mortar) stand on their own — no edits needed.

## Phase 5 — Local Verification

End-to-end smoke before push:

1. `rm -rf backend/vendor frontend/node_modules` — force fresh installs.
2. `make init` — bootstraps + runs `git config core.hooksPath .githooks`.
3. `make up` — all containers come up healthy.
4. `make migrate` succeeds.
5. `make test` (backend + frontend tests inside containers) passes.
6. `make lint` passes.
7. `make queue` starts in a second terminal — verify the worker connects.
8. `make e2e-up && make migrate && make e2e` — full Set Assembly Check. (`make migrate` after `e2e-up` works because both compose files share the `backend` container name, same as `e2e.yml` does today.)
9. **Hook sanity:**
   - Stage a backend-only change, commit — captainhook gauntlet fires, lint-staged does not.
   - Stage a frontend-only change, commit — lint-staged fires, captainhook does not.
   - Stage one of each, commit — both fire.
   - Push a permit-bearing branch with backend files — `PrePushPermitGate` + `composer test` fire. Push a frontend-only range — neither fires.
10. Push the migration branch. CI must show backend-ci, frontend-ci, and e2e all green with appropriate path-filter triggering. Open a one-line PR per surface to confirm filter behavior.

## Phase 6 — Old Repos

After the monorepo PR merges to `main` **and** Phase 0's Railway service (the new one) is verified green serving traffic:

1. In `Goosterhof/brick-inventory-backend`: replace `README.md` with a deprecation notice — _"This repo has been absorbed into [brick-inventory-orchestrator](https://github.com/Goosterhof/brick-inventory-orchestrator) as of YYYY-MM-DD. The final standalone state is tagged `pre-monorepo-merge-YYYY-MM-DD`."_ Commit, push.
2. Same for `Goosterhof/brick-inventory-frontend`.
3. Push the pre-merge tags to each standalone remote so the deprecation README's reference works:
   ```bash
   git push <backend-remote>  1f1d30d4c002c395d13068239e9f16705838b168:refs/tags/pre-monorepo-merge-2026-05-17
   git push <frontend-remote> 70fcafe11bb8431d65d876365f6a0bfc078593e0:refs/tags/pre-monorepo-merge-2026-05-17
   ```
   The local tags created in Phase 1 lived inside `.git/modules/{backend,frontend}` and were lost when those gitdirs were deleted in Phase 2; recreating directly against the remote SHAs is the simplest path.
4. Delete the old Railway service that pointed at the standalone backend repo (the new orchestrator-sourced service is now serving production). Delete the Cloudflare Pages project for the standalone frontend.
5. Archive both standalone repos via GitHub Settings → Archive this repository (read-only state).
6. Flip both permits (`backend/.claude/records/permits/2026-05-17-monorepo-migration.md` and the frontend counterpart) from `Status: In Progress` to `Status: Complete` via a small follow-up PR. The PR's diff is under the PrePushPermitGate threshold so it skips the gate cleanly.

---

## Critical Files

**Modified at orchestrator root:**
- `.gitmodules` — **deleted**
- `Makefile` — submodule targets removed, `hooks-install` added (or folded into `init`)
- `CLAUDE.md` — submodule sections rewritten, hooks-install step added
- `README.md` — same
- `.github/workflows/quality.yml` — **deleted**
- `.github/workflows/e2e.yml` — drop `submodules: recursive`, add path filters
- `scripts/submodule-check.sh` — **deleted**
- `scripts/doctor.sh` — drop submodule-health checks
- `.env.example` — merge in any missing keys

**Added at orchestrator root:**
- `.github/workflows/backend-ci.yml` (from `backend/.github/workflows/ci.yml`, path-filtered to include root infra)
- `.github/workflows/frontend-ci.yml` (from `frontend/.github/workflows/ci.yml`, path-filtered to include root infra)
- `.github/dependabot.yml` (from `backend/.github/dependabot.yml`, with composer `/backend` and npm `/frontend` entries)
- `.githooks/pre-commit` (root dispatcher)
- `.githooks/pre-push` (root dispatcher)
- `Dockerfile` (production multi-stage: node frontend build → composer install → FrankenPHP runtime with frontend overlaid on backend/public/)
- `railway.toml` (Railway deploy config; builder = DOCKERFILE)

**Modified inside subdirs:**
- `backend/composer.json` — delete the `post-install-cmd` block
- `backend/CLAUDE.md` — note root-dispatcher for hooks
- `backend/bootstrap/app.php` — register `web:` routes so the SPA fallback fires
- `backend/routes/web.php` — **new** — `Route::fallback()` returns `public/index.html`
- `backend/Procfile` — **deleted** (Dockerfile CMD replaces it)
- `backend/nixpacks.toml` — **deleted** (Dockerfile takes precedence over Railpack)
- `backend/railway.toml` — **moved to orchestrator root**
- `backend/.github/` — delete (workflows + dependabot moved up)
- `frontend/package.json` — replace `prepare: husky` with a no-op; add `--base=/admin/` to `build:admin` so the admin SPA's asset URLs and `import.meta.env.BASE_URL` are scoped to `/admin/`
- `frontend/src/apps/families/services/http.ts` — default `VITE_API_BASE_URL` to `/api` (same-origin)
- `frontend/CLAUDE.md` — note root-dispatcher for hooks
- `frontend/.husky/` — keep as reference but no longer auto-installed
- `frontend/.github/` — delete

**Untouched (this is the relief):**
- `docker-compose.yml`, `docker-compose.e2e.yml`
- `docker/backend.Dockerfile`, `docker/frontend.Dockerfile`
- All source in `backend/app/`, `backend/database/`, `frontend/src/`
- `e2e/` (tests hit `localhost:8000`/`5173`, layout-agnostic)
- Per-surface ADRs, permits/journals, `.claude/` workspaces

---

## Verification — Definition of Done

1. **One clone, one checkout.** `git clone <orchestrator>` followed by `make init` produces a working stack with hooks wired and no `git submodule update --init` step.
2. **History reaches back.** `git log --follow backend/app/Actions/<SomeAction>.php` returns commits from before the merge. `git blame backend/composer.json` resolves to the original authors.
3. **CI gates intact.** Backend mutation tests still run on backend PRs. Frontend coverage gate still runs on frontend PRs. Root infra changes (Makefile, compose files) trigger both backend-ci and frontend-ci. E2E still runs when any surface or compose file changes. Verifiable with one-line PRs per surface.
4. **Pre-commit + pre-push gauntlets intact.** Phase 5 step 9 manual verification passes.
5. **No drift artifacts left.** `git ls-files | grep -E '^\.gitmodules$'` returns nothing. `find backend frontend -maxdepth 2 -name .git` returns nothing.
6. **Dependabot live.** GitHub's Dependabot tab on the orchestrator lists both ecosystems with recent runs.
7. **Production deploys from the orchestrator.** The new Railway service shows a successful deploy of the root `Dockerfile`, the SPA loads at `/`, `/api/health` returns 200, and the worker service is draining the queue. Cloudflare Pages is decommissioned.
8. **Old repos retired.** Both standalone repos show the GitHub "Archived" banner, a deprecation README, and the `pre-monorepo-merge-2026-05-17` tag.

---

## Out of Scope (Follow-ups)

- **Showcase app shipping** — `showcase` is a developer-only component gallery; it does not ship in production.
- **Route caching** — `Route::fallback(closure)` can't be serialized, so `php artisan route:cache` is skipped in production. Convert the closure to a `SpaController::class` (single-action, `__invoke`) when route caching becomes a measurable concern. The Controller architecture test currently enforces `JsonResponse|array` return types and would need a narrow carve-out for HTML responses.
- **Optimising the `/` round-trip** — every request to `/` currently goes through PHP (Laravel's fallback) instead of being served directly as `index.html`. A Caddyfile rewrite for `path /` to serve `index.html` cuts the PHP overhead on the cold landing. Defer until traffic warrants it.
- **Consolidating `.claude/` workspaces** — three currently exist (orchestrator, backend, frontend). They can coexist as namespaced sovereign workspaces; consolidation is a separate discussion if desired.
- **Unified composer/npm at root** — a true monorepo could have a root `package.json` orchestrating both surfaces (Turborepo, Nx, plain workspaces). This plan does **not** introduce that — the Makefile + docker-compose are already the orchestration layer. Worth considering later if local dev needs a tighter loop than `make up`.
