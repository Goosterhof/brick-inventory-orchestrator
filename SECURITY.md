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

This repository is the **orchestrator** that coordinates two vassal repositories via git submodules and Docker Compose:

- Backend (Laravel API): [`Goosterhof/lego-storage`](https://github.com/Goosterhof/lego-storage)
- Frontend (Vue 3 SPA): [`Goosterhof/lego-storage-frontend`](https://github.com/Goosterhof/lego-storage-frontend)

Security issues in the **backend** or **frontend** code itself should be reported against those repositories directly (each ships its own `SECURITY.md` with the same disclosure address).

Issues that are specific to **this orchestrator** — for example the docker-compose harness, the Playwright E2E suite, the Makefile, or the GitHub Actions workflows in this repository — fall under this policy.

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Resolution:** Depends on severity and complexity

## Recognition

Contributors who report valid security issues will be acknowledged in the fix commit (unless they prefer to remain anonymous).
