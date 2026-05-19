# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately rather than opening a public issue.

**Email:** gerard@script.nl

Please include:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (optional)

## Scope

This repository is **The Brickworks** — a single monorepo containing the backend API (Laravel, `backend/`, the Foundry Wing) and the frontend SPA (Vue 3, `frontend/`, the Gallery Wing), both served from a single Railway service in production.

Security issues in any part of the codebase — backend, frontend, deployment, or infrastructure (docker-compose harness, the Playwright E2E suite, the Makefile, the GitHub Actions workflows) — should be reported through the channel above.

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Resolution:** Depends on severity and complexity

## Recognition

Contributors who report valid security issues will be acknowledged in the fix commit (unless they prefer to remain anonymous).
