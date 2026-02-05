# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orchestrator for the LEGO inventory management ecosystem. Uses git submodules to coordinate:

- `backend/` - Laravel 12 API (lego-storage)
- `frontend/` - Vue 3 SPA (lego-storage-frontend)

## Submodule Guidelines

@backend/CLAUDE.md

@frontend/CLAUDE.md

## Commands

```bash
# First-time setup after clone
make init

# Start all services
make up

# Stop all services
make down

# View logs
make logs

# Run migrations
make migrate

# Run all tests (unit + feature)
make test

# Lint all code
make lint

# Update submodules to latest commits
make submodule-update

# Shell access
make backend-shell
make frontend-shell
make db-shell

# E2E tests
make e2e-install   # First-time: install Playwright and browsers
make e2e-up        # Start services with isolated test database
make e2e           # Run E2E tests
make e2e-ui        # Run with Playwright UI (interactive)
make e2e-down      # Stop services and clean up test data
make e2e-report    # View HTML test report
```

## Architecture

```
brick-inventory-orchestrator/
├── backend/              # Git submodule: lego-storage (Laravel 12)
├── frontend/             # Git submodule: lego-storage-frontend (Vue 3)
├── e2e/                  # Playwright E2E tests
│   ├── tests/            # Test files
│   ├── lib/              # Test helpers (API client, login utils)
│   └── playwright.config.ts
├── docker/
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
├── docker-compose.yml    # Local dev environment
├── docker-compose.e2e.yml # E2E test overrides (isolated DB)
├── Makefile              # Common commands
└── .env.example          # Environment template
```

## Local Development

Services run on:
- Backend API: http://localhost:8000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432

### Authentication (SPA session-based)

The frontend uses cookie-based auth (`withCredentials: true`), NOT token-based. Key config in `docker-compose.yml`:

- `SANCTUM_STATEFUL_DOMAINS`: must include `localhost:5173` (frontend host:port) for Sanctum to apply session middleware
- `SESSION_DOMAIN`: set to `localhost` for cross-port cookie sharing between frontend (5173) and backend (8000)
- CSRF is excluded for `api/*` routes in `backend/bootstrap/app.php`

### Docker Tips

- Use `docker compose up -d` (not `restart`) to pick up `docker-compose.yml` env changes — `restart` only stops/starts containers without recreating
- After `docker compose down -v`, the vendor volume is recreated from the image; may need `composer install`
- `public/frankenphp-worker.php` runs before the PHP autoloader — never use Laravel classes in it; `composer lint` may incorrectly modify this file

## Submodule Workflow

```bash
# Clone with submodules
git clone --recursive <repo-url>

# Or initialize after clone
git submodule update --init --recursive

# Update submodules to latest
make submodule-update
git add backend frontend
git commit -m "chore: update submodules"

# Work in a submodule
cd backend
git checkout main
git pull
# make changes, commit, push
cd ..
git add backend
git commit -m "chore: update backend submodule"
```

## E2E Testing

Uses Playwright for end-to-end testing across the full stack.

**First-time setup:**
```bash
make e2e-install
# If browsers fail to launch, install system dependencies:
sudo apt-get install -y libnspr4 libnss3 libasound2t64
```

**Running tests:**
```bash
make e2e-up     # Start isolated environment
make migrate    # Run migrations on fresh DB
make e2e        # Run tests
make e2e-down   # Clean up
```

**Test structure:**
- `e2e/tests/health.spec.ts` - API and frontend health checks
- `e2e/tests/auth.spec.ts` - Registration and login flows
- `e2e/tests/family-sets.spec.ts` - CRUD operations (requires auth)

**Writing tests:**
- Use accessible selectors: `page.getByRole()`, `page.getByLabel()`
- Create test data via API helpers in `e2e/lib/api.ts`
- Tests run against Dockerized services on localhost

**CI:** GitHub Actions runs E2E tests on all browsers (Chromium, Firefox, WebKit).

## Production Deployment

Each service deploys independently:
- Backend: Railway (https://api.brick-inventory.com)
- Frontend: Cloudflare Pages

This orchestrator is for local development only.
