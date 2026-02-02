.PHONY: up down build logs backend-shell frontend-shell db-shell migrate fresh seed test lint submodule-update

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

# Frontend shell
frontend-shell:
	docker compose exec frontend sh

# Database shell
db-shell:
	docker compose exec postgres psql -U lego -d lego_storage

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

# Lint all
lint: lint-backend lint-frontend

# Update submodules to latest
submodule-update:
	git submodule update --remote
	@echo "Submodules updated. Review changes and commit if desired."

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
