.PHONY: up down build logs backend-shell frontend-shell db-shell migrate fresh seed test lint lint-e2e format-e2e type-check-e2e submodule-update submodule-check doctor e2e e2e-ui e2e-headed e2e-up e2e-down e2e-install e2e-report queue

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

# Update submodules to latest
submodule-update:
	git submodule update --remote
	@echo "Submodules updated. Review changes and commit if desired."

# Check submodule drift against remote
submodule-check:
	@bash scripts/submodule-check.sh

# Initialize after clone
init:
	git submodule update --init --recursive
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

# Start services with E2E config (isolated database)
e2e-up:
	docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d
	@echo "Waiting for services to be ready..."
	@timeout 60 bash -c 'until curl -sf http://localhost:8000/api/health > /dev/null 2>&1; do sleep 2; done' || echo "Warning: API health check timed out"
	@echo "E2E environment ready!"

# Stop E2E services and remove test data
e2e-down:
	docker compose -f docker-compose.yml -f docker-compose.e2e.yml down -v

# View E2E test report
e2e-report:
	cd e2e && npx playwright show-report
