# Brick Inventory Orchestrator

A LEGO storage and inventory management system — orchestrator for a three-repository project that lets families catalog their sets, track parts, organize physical storage, and sync collections from external suppliers.

This repository is the **orchestrator** (or "Baseplate" in the project's LEGO vocabulary). It does not contain application code; it ties together two vassal repositories under Docker Compose for local development, runs the end-to-end test suite, and provides the operational scripts.

## Repository Layout

The project is split across three repositories:

| Repository | Role | Stack |
|---|---|---|
| **This repository** | Orchestrator — Docker Compose harness, E2E suite, ops scripts | Docker Compose, Playwright |
| [`Goosterhof/brick-inventory-backend`](https://github.com/Goosterhof/brick-inventory-backend) | Backend API ("the Brick") | Laravel, PHP 8.5, PostgreSQL |
| [`Goosterhof/brick-inventory-frontend`](https://github.com/Goosterhof/brick-inventory-frontend) | Frontend SPA ("the Plate") | Vue 3, TypeScript, Vite |

The two vassals are git submodules of this repository (`backend/` and `frontend/`). Each is independently buildable and deployable — the orchestrator coordinates them for the local-development and end-to-end-testing experience.

### Why Three Repositories

- **Backend and frontend ship independently.** The backend deploys to Railway on push; the frontend deploys to Cloudflare Pages on push. Coupling them in a single repository would couple their release cadences for no operational benefit.
- **The orchestrator is shared infrastructure.** The `Makefile`, the `docker-compose.yml` and the Playwright E2E suite belong neither to the API nor to the SPA — they live here so both vassals stay focused on application code.
- **The split makes the showcase legible.** Each repository tells one story: the API, the SPA, the harness that ties them together. A reviewer can land in any of the three and understand its boundaries.

## Quick Start

### Clone with submodules

```bash
git clone --recurse-submodules https://github.com/Goosterhof/brick-inventory-orchestrator.git
cd brick-inventory-orchestrator
```

If you cloned without `--recurse-submodules`, run `git submodule update --init --recursive` to pull the vassals.

### First-time setup

```bash
make init
```

`make init` initializes the submodules, copies `.env.example` to `.env`, builds the Docker images, starts the services, installs backend dependencies, generates the application key, and runs the database migrations.

### Day-to-day commands

```bash
make up               # start all services
make queue            # run the queue worker (separate terminal — required for emails and async imports)
make down             # stop all services
make logs             # follow the combined logs
make migrate          # run pending migrations
make test             # run the backend + frontend test suites
make lint             # lint both vassals
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
make e2e-down         # tear down the isolated stack
```

## Documentation

- The orchestrator's conventions are documented in [`CLAUDE.md`](CLAUDE.md) (read primarily by AI coding assistants — see the preamble in that file).
- Each vassal carries its own `README.md`, `CLAUDE.md`, `SECURITY.md`, and `LICENSE`. Start with the vassal's `README.md` for application-level orientation.

## Security

See [SECURITY.md](SECURITY.md) for the vulnerability-disclosure policy. The vassals each carry their own `SECURITY.md` for application-level reports — please direct issues to the repository whose code is affected.

## License

[MIT](LICENSE) — Copyright (c) 2026 Gerard Oosterhof.

The two vassal repositories ship under their own `LICENSE` files; both are MIT.
