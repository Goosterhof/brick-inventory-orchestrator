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

This repository is the **frontend SPA** ("the Plate") for the LEGO storage inventory system. It is one of three repositories — backend API and orchestrator are linked from the project's [README.md](README.md).

The frontend has no server-side surface; the dominant threat axes for this codebase are:

- **Cross-site scripting (XSS)** in user-generated content rendering, dynamic templates, and any `v-html` usage.
- **Supply-chain compromise** via npm dependencies (the project ships with `npm audit` clean and runs without a lockfile bypass — see `package-lock.json`).
- **Authentication-flow handling** between the SPA and the backend (cookie-based sessions; the SPA does not store tokens client-side).
- **Build-time configuration leaks** through environment variables that end up in the client bundle.

Vulnerabilities in the **backend API** itself should be reported against the [`Goosterhof/brick-inventory-backend`](https://github.com/Goosterhof/brick-inventory-backend) repository directly.

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Resolution:** Depends on severity and complexity

## Recognition

Contributors who report valid security issues will be acknowledged in the fix commit (unless they prefer to remain anonymous).
