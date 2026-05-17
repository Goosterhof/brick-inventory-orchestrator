# Brick Inventory Orchestrator

A LEGO storage and inventory management system that lets families catalog their sets, track parts, organize physical storage, and sync collections from external suppliers.

This is the **monorepo** (or "Baseplate" in the project's LEGO vocabulary). It carries both surfaces of the application plus the harness that ties them together — Docker Compose for local development, Playwright for end-to-end tests, and the operational scripts that drive the build.

## Repository Layout

```
brick-inventory-orchestrator/     # The Baseplate (this repo)
├── backend/             # The Brick — Laravel 12 API (PHP 8.5, PostgreSQL)
├── frontend/            # The Plate — Vue 3 SPA (TypeScript, Vite)
├── e2e/                 # Set Assembly Check — Playwright E2E suite
├── .githooks/           # Root pre-commit + pre-push dispatchers
├── .github/             # CI workflows (backend-ci, frontend-ci, e2e) + dependabot
├── docker/              # Local dev Dockerfiles (backend + frontend)
├── Dockerfile           # Production image — multi-stage, backend serves frontend
├── railway.toml         # Railway deploy config
├── docker-compose.yml
├── docker-compose.e2e.yml
└── Makefile
```

Production ships as a single Railway service. The root `Dockerfile` multi-stages a Node frontend build, a Composer backend install, and a FrankenPHP runtime that overlays both shipping Vue apps onto `backend/public/` — `families` at the root, `admin` under `/admin/`. FrankenPHP serves everything from one origin: `/api/*` hits Laravel, `/admin*` serves the admin SPA, and any other route serves the families SPA. The Cloudflare Pages deploy that hosted the standalone frontend is retired.

Both surfaces were absorbed into this repo via `git subtree add` on 2026-05-17 (with full pre-merge history preserved); the standalone `Goosterhof/brick-inventory-backend` and `Goosterhof/brick-inventory-frontend` repos are archived as historical anchors.

Why a monorepo: cross-cutting changes that used to need three coordinated PRs (backend → frontend → orchestrator submodule bump) now land in one. CI runs from a single source of truth. The orchestrator owns the only `.git/`, and per-surface tooling is dispatched by path filters.

## Quick Start

```bash
git clone https://github.com/Goosterhof/brick-inventory-orchestrator.git
cd brick-inventory-orchestrator
make init
```

`make init` runs `make hooks-install` (wires git hooks to `.githooks/`), copies `.env.example` to `.env`, builds the Docker images, starts the services, installs backend dependencies, generates the application key, and runs the database migrations.

### Day-to-day commands

```bash
make up               # start all services
make queue            # run the queue worker (second terminal — required for emails + async imports)
make down             # stop all services
make logs             # follow combined logs
make migrate          # run pending migrations
make test             # run the backend + frontend test suites
make lint             # lint both surfaces
make doctor           # preflight checklist (containers, hooks, env)
```

The full command list lives in the [Makefile](Makefile).

### Service URLs (local)

- Backend API: <http://localhost:8000>
- Frontend SPA: <http://localhost:5173>
- PostgreSQL: `localhost:5432`

### End-to-end tests

The Playwright E2E suite runs against an isolated stack:

```bash
make e2e-install      # install Playwright + browsers (first time only)
make e2e-up           # bring up the isolated stack
make e2e              # run the suite
make e2e-down         # tear down
```

## Documentation

- The orchestrator's conventions are documented in [`CLAUDE.md`](CLAUDE.md) (read primarily by AI coding assistants).
- Each surface carries its own sovereign manifest: [`backend/CLAUDE.md`](backend/CLAUDE.md) (Stud & Sort Logistics) and [`frontend/CLAUDE.md`](frontend/CLAUDE.md) (Brick & Mortar Associates). Start there for surface-specific guidelines.
- [`docs/monorepo-migration-plan.md`](docs/monorepo-migration-plan.md) records how this repo was assembled from its three former parts.

## Security

See [SECURITY.md](SECURITY.md) for the vulnerability-disclosure policy.

## License

[MIT](LICENSE) — Copyright (c) 2026 Gerard Oosterhof.
