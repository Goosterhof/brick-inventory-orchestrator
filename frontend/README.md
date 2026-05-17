# Brick Inventory Frontend

A Vue 3 multi-app monorepo for managing LEGO brick inventory. Built with TypeScript, Vite, and modern tooling.

This repository is the **frontend SPA** ("the Plate") — one of three repositories in the project. The companion repositories are the [backend API (`Goosterhof/brick-inventory-backend`)](https://github.com/Goosterhof/brick-inventory-backend) and the [orchestrator (`Goosterhof/brick-inventory-orchestrator`)](https://github.com/Goosterhof/brick-inventory-orchestrator) which ties them together via Docker Compose for local development and Playwright E2E testing. This repo can be cloned and run standalone — the orchestrator is required only for end-to-end testing.

## Features

- **Multi-App Architecture**: Supports multiple independent apps sharing common code
- **Families App**: Main application for family-based LEGO inventory management
- **Shared Components**: Reusable UI components across all apps
- **Type-Safe**: Full TypeScript support with strict type checking
- **Modern Tooling**: Fast builds with Vite, instant HMR, and Rust-based linting

## Tech Stack

| Category   | Technology              |
| ---------- | ----------------------- |
| Framework  | Vue 3 (Composition API) |
| Language   | TypeScript              |
| Build Tool | Vite                    |
| Styling    | UnoCSS                  |
| Testing    | Vitest                  |
| Linting    | oxlint                  |
| Formatting | oxfmt                   |

## Prerequisites

- Node.js 24 or higher
- npm

## Getting Started

1. **Clone the repository**

    ```bash
    git clone https://github.com/Goosterhof/brick-inventory-frontend.git
    cd brick-inventory-frontend
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Start the development server**

    ```bash
    npm run dev
    ```

    The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── apps/
│   ├── families/          # Main family inventory app
│   │   ├── services/      # App-specific service instances
│   │   ├── views/         # Page components
│   │   └── types/         # App-specific types
│   └── admin/             # Admin dashboard (in development)
├── shared/
│   ├── components/        # Reusable UI components
│   ├── composables/       # Vue composables
│   ├── services/          # Service factories
│   ├── helpers/           # Utility functions
│   ├── errors/            # Custom error classes
│   └── types/             # Shared type definitions
└── tests/
    └── unit/              # Unit tests
```

## Available Scripts

| Script                  | Description                                                     |
| ----------------------- | --------------------------------------------------------------- |
| `npm run dev`           | Start development server (families app)                         |
| `npm run dev:admin`     | Start development server (admin app)                            |
| `npm run dev:showcase`  | Start development server (showcase app — design-system gallery) |
| `npm run build`         | Build all apps for production                                   |
| `npm run test:unit`     | Run unit tests                                                  |
| `npm run test:coverage` | Run tests with coverage report                                  |
| `npm run lint`          | Run linter                                                      |
| `npm run format`        | Format code                                                     |
| `npm run format:check`  | Check code formatting                                           |
| `npm run type-check`    | Run TypeScript type checking                                    |

## Environment Variables

Create a `.env` file in the project root (optional):

```env
VITE_API_BASE_URL=https://api.brick-inventory.com/api
```

If not set, the app defaults to the production API URL.

## Path Aliases

The project uses path aliases for clean imports:

- `@/*` → `./src/*`
- `@shared/*` → `./src/shared/*`
- `@app/*` → `./src/apps/{currentApp}/*` (resolved at build time)

```ts
import NavLink from '@shared/components/NavLink.vue';
import {familyAuthService} from '@app/services';
```

## Contributing

Contributions are welcome! Please ensure your code:

1. Passes all tests: `npm run test:unit`
2. Passes type checking: `npm run type-check`
3. Is properly formatted: `npm run format`
4. Passes linting: `npm run lint`

## Security

See [SECURITY.md](SECURITY.md) for the vulnerability-disclosure policy.

## License

[MIT](LICENSE)
