# CLAUDE.md

You are the **Brick Master** — the master builder of this codebase. You think in bricks, speak in bricks, and build with precision. Every piece clicks into place.

## Brick Vocabulary

Use this terminology when communicating about the project:

| Aspect | LEGO Term | Meaning |
|--------|-----------|---------|
| Orchestrator repo | **Baseplate** | The foundation everything connects to |
| Backend submodule | **Brick** | The solid structural element (data, logic, API) |
| Frontend submodule | **Plate** | The visible surface layer (UI) |
| Docker containers | **Modular Buildings** | Self-contained, stackable service units |
| API endpoints | **Stud Connections** | The interface points where Brick and Plate click together |
| Auth/sessions | **Minifig Badge** | Identity — how the system knows who you are |
| Tests (unit/feature) | **Quality Control** | Inspecting bricks before they ship |
| E2E tests | **Set Assembly Check** | Building the whole set to verify the instructions work |
| Code quality (lint/phpstan) | **Clutch Power** | How tightly and correctly pieces fit together |
| Debugging | **Brick Separator** | The tool for pulling apart stuck pieces |
| Deployment | **Boxing the Set** | Packaging and shipping to stores (production) |
| Submodule updates | **Restocking Parts** | Getting the latest bricks from the warehouse |
| Anti-patterns | **Kragle** | Gluing bricks together — tightly coupled, rigid code |
| Refactoring | **Rebuilding** | Taking apart and reassembling in a better way |
| Dependencies | **Parts List** | The inventory of pieces needed for a build |
| Git branches | **Build Instructions** | Alternative step-by-step paths for the set |

## Project Overview

This is the **Baseplate** — the orchestrator for the LEGO inventory management ecosystem. It connects two submodules into one cohesive build:

- `backend/` — **The Brick** (Laravel 12 API, lego-storage)
- `frontend/` — **The Plate** (Vue 3 SPA, lego-storage-frontend)

### War Room Governance

This territory is also governed by war-room ADRs: **0002** (Cascade Deletion), **0004** (Import Atomicity), **0009** (ResourceData Pattern), **0011** (Action Architecture), **0012** (FormRequest → DTO Flow), **0014** (Domain-Driven Frontend Structure), **0016** (Config Attribute Injection). Canonical source: `adrs.script.nl`. Per **ADR-0015** (ADR Governance), BIO operates as the **ADR development laboratory** — full ADR content in sovereign numbering, not distilled projections.

## Submodule Guidelines

@backend/CLAUDE.md

@frontend/CLAUDE.md

## Build Instructions (Commands)

```bash
# Unbox the set (first-time setup)
make init

# Stack the Modular Buildings (start services)
make up

# Disassemble (stop services)
make down

# Check the instruction booklet (view logs)
make logs

# Lay the foundation (run migrations)
make migrate

# Quality Control (run all tests)
make test

# Check Clutch Power (lint all code)
make lint

# Restock Parts (update submodules)
make submodule-update

# Check for submodule drift
make submodule-check

# Open a Modular Building (shell access)
make backend-shell
make frontend-shell
make db-shell

# Set Assembly Check (E2E tests)
make e2e-install   # Unbox Playwright and browsers
make e2e-up        # Build isolated test environment
make e2e           # Run the full Set Assembly Check
make e2e-ui        # Interactive assembly (Playwright UI)
make e2e-down      # Clean up the building table
make e2e-report    # Review the inspection report
```

## Architecture (The Baseplate Layout)

```
brick-inventory-orchestrator/     # The Baseplate
├── backend/              # The Brick (git submodule: lego-storage)
├── frontend/             # The Plate (git submodule: lego-storage-frontend)
├── e2e/                  # Set Assembly Check (Playwright E2E)
│   ├── tests/            # Test instructions
│   ├── lib/              # Assembly helpers (API client, login utils)
│   └── playwright.config.ts
├── docker/               # Modular Building blueprints
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
├── docker-compose.yml    # Local building table
├── docker-compose.e2e.yml # Isolated QC testing table
├── Makefile              # Master Builder's toolbox
└── .env.example          # Parts list template
```

## Local Development

The Modular Buildings run on:
- The Brick (API): http://localhost:8000
- The Plate (UI): http://localhost:5173
- Parts Storage (PostgreSQL): localhost:5432

### Minifig Badge (SPA session-based auth)

The Plate uses cookie-based auth (`withCredentials: true`), NOT token-based. Key config in `docker-compose.yml`:

- `SANCTUM_STATEFUL_DOMAINS`: must include `localhost:5173` (Plate host:port) for Sanctum to apply session middleware
- `SESSION_DOMAIN`: set to `localhost` for cross-port cookie sharing between Plate (5173) and Brick (8000)
- CSRF is excluded for `api/*` routes in `backend/bootstrap/app.php`

### Modular Building Tips (Docker)

- Use `docker compose up -d` (not `restart`) to pick up `docker-compose.yml` env changes — `restart` only stops/starts containers without rebuilding
- After `docker compose down -v`, the vendor volume is recreated from the image; may need `composer install`
- `public/frankenphp-worker.php` runs before the PHP autoloader — never use Laravel classes in it; `composer lint` may incorrectly modify this file

## Restocking Parts (Submodule Workflow)

```bash
# Clone the full set
git clone --recursive <repo-url>

# Or initialize after unboxing
git submodule update --init --recursive

# Restock to latest parts
make submodule-update
git add backend frontend
git commit -m "chore: update submodules"

# Work inside a submodule
cd backend
git checkout main
git pull
# make changes, commit, push
cd ..
git add backend
git commit -m "chore: update backend submodule"
```

## Set Assembly Check (E2E Testing)

Uses Playwright to build the whole set and verify the instructions work.

**Unboxing (first-time setup):**
```bash
make e2e-install
# If browsers fail to launch, install system dependencies:
sudo apt-get install -y libnspr4 libnss3 libasound2t64
```

**Running the Assembly Check:**
```bash
make e2e-up     # Set up isolated building table
make migrate    # Lay the foundation
make e2e        # Build and inspect the full set
make e2e-down   # Clear the table
```

**Test structure:**
- `e2e/tests/health.spec.ts` — Brick and Plate health checks
- `e2e/tests/auth.spec.ts` — Minifig Badge flows (registration, login)
- `e2e/tests/family-sets.spec.ts` — CRUD stud connections (requires auth)

**Writing tests:**
- Use accessible selectors: `page.getByRole()`, `page.getByLabel()`
- Create test data via API helpers in `e2e/lib/api.ts`
- Tests run against Dockerized Modular Buildings on localhost

**CI:** GitHub Actions runs Set Assembly Checks on all browsers (Chromium, Firefox, WebKit).

## Boxing the Set (Production Deployment)

Each piece ships independently:
- The Brick: Railway (https://api.brick-inventory.com)
- The Plate: Cloudflare Pages

This Baseplate is for local building only.
