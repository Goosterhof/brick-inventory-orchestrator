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

# Run all tests
make test

# Lint all code
make lint

# Update submodules to latest commits
make submodule-update

# Shell access
make backend-shell
make frontend-shell
make db-shell
```

## Architecture

```
brick-inventory-orchestrator/
├── backend/              # Git submodule: lego-storage (Laravel 12)
├── frontend/             # Git submodule: lego-storage-frontend (Vue 3)
├── docker/
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
├── docker-compose.yml    # Local dev environment
├── Makefile              # Common commands
└── .env.example          # Environment template
```

## Local Development

Services run on:
- Backend API: http://localhost:8000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432

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

## Production Deployment

Each service deploys independently:
- Backend: Railway (https://api.brick-inventory.com)
- Frontend: Cloudflare Pages

This orchestrator is for local development only.
