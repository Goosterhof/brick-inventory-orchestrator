#!/usr/bin/env bash
#
# Preflight Checklist — verify the local Baseplate environment is ready to build.
#

set -euo pipefail

pass=0
warn=0
fail=0

green()  { printf "\033[32m✔ PASS\033[0m  %s\n" "$1"; pass=$((pass + 1)); }
yellow() { printf "\033[33m⚠ WARN\033[0m  %s\n" "$1"; warn=$((warn + 1)); }
red()    { printf "\033[31m✘ FAIL\033[0m  %s\n" "$1"; fail=$((fail + 1)); }

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      Preflight Checklist             ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Docker ──────────────────────────────────

echo "Docker"
echo "------"

if command -v docker &>/dev/null; then
  green "Docker CLI installed"
else
  red "Docker CLI not found"
fi

if docker info &>/dev/null 2>&1; then
  green "Docker daemon running"
else
  red "Docker daemon not running"
fi

if command -v docker &>/dev/null && docker compose version &>/dev/null 2>&1; then
  green "Docker Compose available"
else
  red "Docker Compose not available"
fi

echo ""

# ── Containers ──────────────────────────────

echo "Modular Buildings (Containers)"
echo "-------------------------------"

for svc in postgres backend frontend; do
  status=$(docker compose ps --format '{{.Status}}' "$svc" 2>/dev/null || echo "")
  if [[ "$status" == *"Up"* ]]; then
    if [[ "$status" == *"healthy"* ]]; then
      green "$svc is up (healthy)"
    else
      green "$svc is up"
    fi
  elif [[ -n "$status" ]]; then
    yellow "$svc exists but status: $status"
  else
    red "$svc is not running (start with: make up)"
  fi
done

echo ""

# ── Services ────────────────────────────────

echo "Stud Connections (Services)"
echo "---------------------------"

if curl -sf http://localhost:8000/api/health &>/dev/null; then
  green "Backend API responding (localhost:8000)"
else
  red "Backend API not responding (localhost:8000)"
fi

if curl -sf http://localhost:5173 &>/dev/null; then
  green "Frontend serving (localhost:5173)"
else
  red "Frontend not serving (localhost:5173)"
fi

if docker compose exec -T postgres pg_isready -U brick_inventory -d brick_inventory &>/dev/null 2>&1; then
  green "PostgreSQL accepting connections"
else
  red "PostgreSQL not accepting connections"
fi

echo ""

# ── Submodules ──────────────────────────────

echo "Parts (Submodules)"
echo "-------------------"

for mod in backend frontend; do
  if [ -f "$mod/composer.json" ] || [ -f "$mod/package.json" ]; then
    green "$mod/ submodule initialized"
  elif [ -d "$mod" ] && [ -z "$(ls -A "$mod" 2>/dev/null)" ]; then
    red "$mod/ submodule is empty (run: git submodule update --init --recursive)"
  else
    red "$mod/ directory missing"
  fi
done

echo ""

# ── Environment ─────────────────────────────

echo "Parts List (Environment)"
echo "-------------------------"

if [ -f ".env" ]; then
  green ".env file present"
else
  yellow ".env file missing (run: cp .env.example .env)"
fi

if [ -f ".env.example" ]; then
  green ".env.example template present"
else
  yellow ".env.example not found"
fi

echo ""

# ── E2E Readiness ───────────────────────────

echo "Set Assembly Check (E2E)"
echo "-------------------------"

if [ -d "e2e/node_modules" ]; then
  green "E2E dependencies installed"
else
  yellow "E2E dependencies not installed (run: make e2e-install)"
fi

if [ -d "e2e/node_modules/playwright" ]; then
  green "Playwright available"
else
  yellow "Playwright not installed (run: make e2e-install)"
fi

echo ""

# ── Summary ─────────────────────────────────

echo "═══════════════════════════════════════"
total=$((pass + warn + fail))
printf "Results: \033[32m%d passed\033[0m, \033[33m%d warnings\033[0m, \033[31m%d failed\033[0m (of %d checks)\n" "$pass" "$warn" "$fail" "$total"

if [ "$fail" -gt 0 ]; then
  echo ""
  printf "\033[31mSome checks failed — fix the issues above before building.\033[0m\n"
  exit 1
elif [ "$warn" -gt 0 ]; then
  echo ""
  printf "\033[33mAll clear with warnings — the build should work, but review the items above.\033[0m\n"
  exit 0
else
  echo ""
  printf "\033[32mAll systems go — the Baseplate is ready to build!\033[0m\n"
  exit 0
fi
