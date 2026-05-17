.PHONY: up down build logs backend-shell frontend-shell db-shell migrate fresh seed test lint lint-e2e format-e2e type-check-e2e hooks-install doctor e2e e2e-ui e2e-headed e2e-up e2e-down e2e-install e2e-report queue

# Start all services
up:
	docker compose up -d

# Start with logs
up-logs:
	docker compose up

# Stop all services
down:
	docker compose down

# Rebuild containers
build:
	docker compose build

# View logs
logs:
	docker compose logs -f

# Backend shell
backend-shell:
	docker compose exec backend bash

# Queue worker (foreground — run in a second terminal alongside `make up`)
# The Brick uses the database queue driver; the worker drains pending
# jobs (mailables, async imports) from the `jobs` table.
# Tries=3, backoff=10s, timeout=60s, max-time=3600s (recycle hourly).
queue:
	docker compose exec backend php artisan queue:work --queue=default --tries=3 --backoff=10 --timeout=60 --max-time=3600

# Frontend shell
frontend-shell:
	docker compose exec frontend sh

# Database shell
db-shell:
	docker compose exec postgres psql -U brick_inventory -d brick_inventory

# Run migrations
migrate:
	docker compose exec backend php artisan migrate

# Fresh migration with seed
fresh:
	docker compose exec backend php artisan migrate:fresh --seed

# Run seeders
seed:
	docker compose exec backend php artisan db:seed

# Run backend tests
test-backend:
	docker compose exec backend composer test

# Run frontend tests
test-frontend:
	docker compose exec frontend npm run test:unit

# Run all tests
test: test-backend test-frontend

# Lint backend
lint-backend:
	docker compose exec backend composer lint

# Lint frontend
lint-frontend:
	docker compose exec frontend npm run lint

# Lint E2E tests
lint-e2e:
	cd e2e && npm run lint

# Format-check E2E tests
format-e2e:
	cd e2e && npm run format:check

# Type-check E2E tests
type-check-e2e:
	cd e2e && npm run type-check

# Lint all
lint: lint-backend lint-frontend

# Wire git hooks to the root dispatcher (.githooks/pre-commit + .githooks/pre-push).
# Routes staged backend/ paths to backend's CaptainHook gauntlet and staged
# frontend/ paths to lint-staged, without either side clobbering the other.
hooks-install:
	git config core.hooksPath .githooks
	@echo "Git hooks routed to .githooks/ (pre-commit + pre-push dispatchers)"

# Initialize after clone
init: hooks-install
	cp -n .env.example .env 2>/dev/null || true
	docker compose build
	docker compose up -d
	docker compose exec backend composer install
	docker compose exec backend php artisan key:generate
	docker compose exec backend php artisan migrate
	@echo "Setup complete! Backend: http://localhost:8000 | Frontend: http://localhost:5173"

# Preflight Checklist — verify local environment
doctor:
	@bash scripts/doctor.sh

# E2E Tests
# ---------

# Install E2E dependencies
e2e-install:
	cd e2e && npm install && npx playwright install

# Run E2E tests (starts services if not running)
e2e:
	cd e2e && npx playwright test

# Run E2E tests with UI mode
e2e-ui:
	cd e2e && npx playwright test --ui

# Run E2E tests in headed mode (visible browser)
e2e-headed:
	cd e2e && npx playwright test --headed

# Start services with E2E config (isolated database).
# Mirrors the CI e2e workflow: build images so they track the current
# composer.lock / package-lock.json, force the named deps volumes
# (backend_vendor / frontend_node_modules) to reseed from the freshly
# built image content, bring services up, then migrate and seed the
# reference Sets so family-set POSTs short-circuit the Rebrickable
# lookup (CI has no REBRICKABLE_API_KEY; locals running e2e mostly
# don't either).
#
# Why wipe just the deps volumes (not -v on down):
#   * `docker compose down -v` would also wipe e2e_postgres_data and force
#     migrations to rerun on every boot.
#   * Named volumes only re-seed from the image on first attach. If they
#     persist across `up`, they hide new packages added since the previous
#     build. The targeted wipe gives us image-fresh deps without nuking
#     the test database between iterations.
#
# Why `--build` instead of `npm install` / `composer install` in-place:
#   * The frontend bind-mounts ./frontend to /app, so `npm install` inside
#     the container writes a (potentially divergent) lock file back to the
#     host tree — fine for the running container, but it corrupts the git
#     working tree and creates phantom submodule diffs. `npm ci` against
#     the committed lock at image build time stays on the read-only image
#     layer and never touches the host.
e2e-up:
	docker compose -f docker-compose.yml -f docker-compose.e2e.yml build
	docker compose -f docker-compose.yml -f docker-compose.e2e.yml rm -fsv backend frontend 2>/dev/null || true
	-docker volume rm brick-inventory-orchestrator_frontend_node_modules brick-inventory-orchestrator_backend_vendor 2>/dev/null
	docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d
	@echo "Waiting for backend health..."
	@timeout 120 bash -c 'until curl -sf http://localhost:8000/api/health > /dev/null 2>&1; do sleep 2; done' || (echo "Backend health check timed out" && exit 1)
	@echo "Waiting for frontend..."
	@timeout 60 bash -c 'until curl -sf http://localhost:5173 > /dev/null 2>&1; do sleep 2; done' || (echo "Frontend health check timed out" && exit 1)
	@echo "Running migrations..."
	docker compose exec -T backend php artisan migrate --force
	@echo "Seeding reference data..."
	docker compose exec -T backend php artisan db:seed --class=ColorSeeder --force
	docker compose exec -T backend php artisan db:seed --class=PartSeeder --force
	docker compose exec -T backend php artisan db:seed --class=SetSeeder --force
	docker compose exec -T backend php artisan db:seed --class=SetPartSeeder --force
	@echo "E2E environment ready!"

# Stop E2E services and remove test data
e2e-down:
	docker compose -f docker-compose.yml -f docker-compose.e2e.yml down -v

# View E2E test report
e2e-report:
	cd e2e && npx playwright show-report
