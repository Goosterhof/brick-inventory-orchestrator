# Contributing to Brick Inventory Frontend

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. **Fork and clone the repository**

    ```bash
    git clone https://github.com/YOUR_USERNAME/brick-inventory-frontend.git
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

## Code Quality

Before submitting a pull request, ensure your code passes all checks:

```bash
npm run lint          # Run linter
npm run format        # Format code
npm run type-check    # TypeScript type checking
npm run test:unit     # Run unit tests
```

## Coding Conventions

### Vue Components

- Use Composition API with `<script setup>` syntax
- Use TypeScript for all `.ts` and `.vue` files
- Name components with two-word PascalCase (e.g., `FormLabel`, `TextInput`, `NavLink`)

### TypeScript

- Use `camelCase` for variables and functions
- Use arrow functions (`const fn = () => {}`) instead of function declarations
- Avoid nested ternaries - use computed properties with if/else instead

### Styling

- Use UnoCSS attributify syntax for styling
- Example: `<div text="lg blue-500" p="4" flex="~ col gap-2">`

### Imports

Use path aliases for clean imports:

```ts
import NavLink from '@shared/components/NavLink.vue';
import {familyAuthService} from '@app/services';
```

## Project Structure

```
src/
├── apps/           # Independent applications
│   ├── families/   # Main family inventory app
│   └── admin/      # Admin dashboard
├── shared/         # Shared code across apps
│   ├── components/ # Reusable UI components
│   ├── composables/# Vue composables
│   ├── services/   # Service factories
│   └── helpers/    # Utility functions
└── tests/          # Test files
    └── unit/       # Unit tests
```

## Testing

- Place unit tests in `src/tests/unit/`
- Run tests with `npm run test:unit`
- Run tests with coverage using `npm run test:coverage`

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the coding conventions
3. Ensure all checks pass (`lint`, `format`, `type-check`, `test:unit`)
4. Write a clear PR description explaining your changes
5. Submit the pull request

## Questions?

Feel free to open an issue if you have questions or need help getting started.
