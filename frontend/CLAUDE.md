# The Gallery Wing — Operational Manual

> The Gallery is The Brickworks' frontend production wing. This file documents Vue / TypeScript conventions, machinery, and quality gauntlets for work inside `frontend/`. Brickworks identity, the crew (Brickwright / Quality Warden / Pattern Master), and the paper-trail vocabulary (Work Order / Build Record / Audit) live in the root `CLAUDE.md` (The Atrium).

## The Gallery — A LEGO Storage Inventory Management System

A multi-app Vue 3 platform where families catalog their sets, track parts, and organize storage. Three buildings in this wing:

| Codename     | Purpose                                                | Entry                |
| ------------ | ------------------------------------------------------ | -------------------- |
| **Families** | The main tower — inventory, sets, parts, storage, auth | `src/apps/families/` |
| **Admin**    | The corner office — admin dashboard                    | `src/apps/admin/`    |
| **Showcase** | The showroom floor — component gallery & design system | `src/apps/showcase/` |

Domain layouts live at [`/.claude/docs/domain-map.md`](../.claude/docs/domain-map.md). Cross-wing decisions live in [`/.claude/docs/decisions.md`](../.claude/docs/decisions.md).

## Materials & Suppliers

| Material     | Supplier                                                              |
| ------------ | --------------------------------------------------------------------- |
| Framework    | Vue 3 (Composition API, `<script setup>`)                             |
| Language     | TypeScript 6.0 (strict mode, no exceptions)                           |
| Build System | Vite 8                                                                |
| Styling      | UnoCSS 66 (atomic, attributify) with neo-brutalist LEGO design system |
| Icons        | Phosphor Icons (`@phosphor-icons/vue`)                                |
| HTTP         | Axios with custom middleware-based HttpService                        |
| Routing      | Vue Router 5 with custom RouterService wrapper                        |
| Testing      | Vitest + @vue/test-utils (happy-dom)                                  |
| Linting      | oxlint (type-aware)                                                   |
| Formatting   | oxfmt                                                                 |
| Git Hooks    | Husky + lint-staged + commitlint                                      |
| Dead Code    | knip                                                                  |
| Bundle Size  | size-limit                                                            |
| Node         | 24+ required                                                          |

## Blueprint Room (Project Structure)

```
src/
├── apps/                    # Each building in our complex
│   ├── families/            # Main tower
│   │   ├── domains/         # Departments (one folder per feature area)
│   │   │   └── [domain]/
│   │   │       ├── index.ts       # Route exports
│   │   │       ├── pages/         # Page components
│   │   │       └── modals/        # Department-specific modals
│   │   ├── services/        # Building utilities (app-specific service instances)
│   │   ├── types/           # Building codes (app-specific types)
│   │   ├── router/          # Elevator system
│   │   ├── main.ts          # Foundation
│   │   └── App.vue          # Lobby
│   ├── admin/               # Corner office
│   └── showcase/            # Showroom floor
└── shared/                  # The supply warehouse — shared across all buildings
    ├── components/          # Prefab wall sections
    │   └── scanner/         # Barcode scanning module
    │                        # Form controls (Text, Number, Date, Textarea, Select) come from
    │                        # @script-development/ui-inputs (ADR-0043) — composed at the call site
    │                        # inside FormField scoped slots; no local input molecules remain.
    ├── services/            # Locally-owned factories (auth/, sound.ts) — http/router/loading/toast/translation/storage come from @script-development/fs-* packages
    ├── composables/         # Reusable engineering specs (useBrickPickup; forms use @script-development/fs-form)
    ├── helpers/             # Tools in the toolbox (bricklinkWantedList, csv, string, type-check)
    ├── errors/              # Structural failure reports
    ├── types/               # Universal building codes
    └── assets/              # Raw materials
```

## Coding Conventions

### Naming

| What                | Convention | Example             |
| ------------------- | ---------- | ------------------- |
| Components          | PascalCase | `PrimaryButton.vue` |
| Vue files           | kebab-case | `modal-dialog.vue`  |
| TS files            | camelCase  | `useBrickPickup.ts` |
| Variables/functions | camelCase  | `validationErrors`  |
| Types/Interfaces    | PascalCase | `StorageItem`       |

### Import Pathways

Non-negotiable. The building inspectors (oxlint) will shut you down.

- `@shared/` — for anything from the supply warehouse. **Required.**
- `@app/` — for cross-module imports within an app. **Required.**
- Relative imports — only within the same directory.
- **FORBIDDEN:** `../shared/`, `../apps/`, `@/apps/` — these are load-bearing walls. Do not cut through them.

### Vue Components

Every component uses `<script setup>` with TypeScript. No exceptions.

```vue
<script setup lang="ts">
defineProps<{label: string; disabled?: boolean}>();

defineEmits<{click: []}>();
</script>
```

- Props: `defineProps<{}>()` with inline types
- Emits: `defineEmits<{}>()` with inline types
- No state library — direct `ref`/`reactive` usage
- All styling via UnoCSS attributes in the template (no CSS files)

### Services

Services are built from factory functions. Each app creates its own instances in its `services/` directory (families instantiates auth, dialog, http, loading, router, sound, storage, theme, toast, and translation).

- **Platform factories** ship as `@script-development/fs-*` packages: `createHttpService()` (fs-http — water main), `createRouterService()` (fs-router — elevator control), plus fs-loading, fs-toast, fs-translation, and fs-storage.
- **Locally-owned factories** live in `src/shared/services/`: `createAuthService()` (`auth/` — security system, session-based over the http service) and `createSoundService()` (`sound.ts` — Web-Audio brick sound effects; respects `prefers-reduced-motion`, persists the on/off toggle via fs-storage).

HTTP middleware can be registered/unregistered at runtime.

### API Communication

- Incoming (API responses): snake_case → converted to camelCase via response middleware (ADR-0029)
- Outgoing (API requests): camelCase → converted to snake_case via request middleware (ADR-0029)
- Type-safe conversions with runtime/compile-time alignment

### Routes

- Defined per domain in `index.ts` as const arrays
- Use `as const satisfies readonly RouteRecordRaw[]`
- Route metadata: `authOnly`, `canSeeWhenLoggedIn`, `title`

### Forms

- `useForm(httpService)` from `@script-development/fs-form` — the one-call form composable: returns `{errors, clearErrors, handleSubmit, submitting}`, wiring field-level error tracking together with 422-aware submission (double-submit prevention + error clearing).
- The underlying `useValidationErrors` / `useFormSubmit` primitives are still exported by the package — reach for one directly only when you need one half without the other.
- Backend validation errors (HTTP 422) are parsed to field errors automatically.

### Error Handling

- Custom error classes in `@shared/errors/`
- Axios errors checked with `isAxiosError()`
- 422 = validation errors (handled by composables)
- 401 = authentication failures (handled by auth service middleware)

## Quality Inspection

| Command                 | What It Inspects                                            |
| ----------------------- | ----------------------------------------------------------- |
| `npm run dev`           | Start dev server (families, default)                        |
| `npm run dev:admin`     | Start dev server (admin)                                    |
| `npm run dev:showcase`  | Start dev server (showcase)                                 |
| `npm run build`         | Build all 3 apps (type-checks first)                        |
| `npm run test:unit`     | Run the test suite                                          |
| `npm run test:coverage` | Run tests with coverage (**100% required — no exceptions**) |
| `npm run lint`          | oxlint with type-aware checking                             |
| `npm run lint:vue`      | Custom Vue conventions linter                               |
| `npm run format`        | Format with oxfmt                                           |
| `npm run format:check`  | Check formatting without modifying                          |
| `npm run type-check`    | vue-tsc type checking                                       |
| `npm run knip`          | Detect unused code/exports (no dead bricks)                 |
| `npm run size`          | Check bundle size limits                                    |

### Pre-Push Gauntlet

Husky enforces: **type-check → knip → test:coverage → test:integration → build**. Dispatched from the orchestrator's `.githooks/pre-push` only when the pushed range touches `frontend/**`. The integration step was added 2026-07-09 after a change to a module the integration layer mocks wholesale passed every local gate and failed only in CI (PR #253).

### Coverage Policy

**100% coverage on lines, functions, branches, and statements.** If you build it, you test it.

## Style Guide — Neo-Brutalist LEGO Aesthetic

| Shortcut              | Effect                                      |
| --------------------- | ------------------------------------------- |
| `brick-border`        | 3px solid black border                      |
| `brick-shadow`        | 4px black drop shadow                       |
| `brick-shadow-hover`  | 6px shadow on hover                         |
| `brick-shadow-active` | 2px shadow on active                        |
| `brick-label`         | Uppercase, bold, tracking-wide              |
| `brick-disabled`      | Gray styling                                |
| `brick-transition`    | Smooth shadow/bg-color transitions          |
| `brick-stud-grid`     | Radial gradient pattern (LEGO stud texture) |

**Brand Colors:**

| Name            | Hex       | Usage      |
| --------------- | --------- | ---------- |
| Brick Yellow    | `#F5C518` | Primary    |
| Brick Red       | `#C41A16` | Danger     |
| Brick Blue      | `#0055BF` | Secondary  |
| Brick Ink       | `#000000` | Text       |
| Brick Surface   | `#FFFFFF` | Background |
| Baseplate Green | `#237841` | Accent     |

**Typography:** Space Grotesk for headings.

Full brand documentation: [`/.claude/docs/brand.md`](../.claude/docs/brand.md).

## Formatting Standards

Enforced by oxfmt. The config is `.oxfmtrc.json`, adopted byte-for-byte from `war-room/templates/oxfmt.json`. Non-compliance is a code violation.

- **Print width:** 120 characters
- **Indent:** 4 spaces (tabs are contraband)
- **Trailing commas:** always
- **Semicolons:** required
- **Quotes:** single quotes only
- **Bracket spacing:** none (`{a: 1}` not `{ a: 1 }`)
- **Line endings:** LF
- **Final newline:** required

## TypeScript Strictness

Project-references structure — `tsconfig.json` orchestrates `tsconfig.app.json` (extends `@vue/tsconfig/tsconfig.dom.json`), `tsconfig.node.json`, and `tsconfig.vitest.json`. The `@vue/tsconfig` base carries `strict`, `verbatimModuleSyntax`, `useDefineForClassFields`, `jsxImportSource: vue`, and other Vue-aware defaults.

War-room canonical strictness layered onto `tsconfig.app.json`:

- `noImplicitReturns`
- `noUnusedLocals` / `noUnusedParameters`
- `noFallthroughCasesInSwitch`
- `noUncheckedSideEffectImports` (TS 5.6+ — catches typo'd side-effect imports)
- `noUncheckedIndexedAccess` (re-declared explicitly — was inherited from `@vue/tsconfig` ≤ 0.8 and moved out of the base in 0.9.0)
- `allowUnreachableCode: false` / `allowUnusedLabels: false`
- `isolatedModules: true`

## Linting Standards

The lint config is `.oxlintrc.json`, mostly aligned with `war-room/templates/oxlintrc.json`. Drift protection is on: `categories.correctness: error` ensures rule additions/removals from oxlint upstream land as a deliberate diff.

**Gallery deviations from canonical** (all per-territory overrides):

- Stricter than canonical: `no-console: "error"` (canonical: `"warn"`) and `max-lines-per-function: "error"` (canonical: `"warn"`)
- Filename pattern: `vitest/consistent-test-filename` enforces `.spec.ts$` only
- Path-alias enforcement: `no-restricted-imports` doctrine across `src/shared/`, `src/apps/families/`, `src/apps/admin/`, and `src/apps/*/domains/` is Gallery-shaped (`@app/`/`@shared/` aliases, app-isolation, no cross-domain imports)
- Default-export ban for TS: `import/no-default-export: "error"` for `src/**/*.ts` (Vue components keep defaults; TS files require named exports)
- `scripts/` added to `ignorePatterns` (Gallery has a `scripts/` dir for component registry + Vue-conventions linter)

**Disabled correctness-category rules with rationale:**

- `vitest/valid-expect` + `jest/valid-expect` — Gallery uses Vitest's documented `expect(value, message)` API for richer arch-test failure diagnostics; both rule spellings are jest-shaped
- `vitest/expect-expect` + `jest/expect-expect` — Gallery integration tests intentionally smoke-test composition without explicit assertions

## Complexity Limits

The building inspectors enforce these maximums:

- **Cyclomatic complexity:** 10
- **Function parameters:** 4
- **Nesting depth:** 4
- **Lines per function:** 80 (excluding comments/blanks)
- **Console statements:** forbidden (`no-console: error`)
- **Debugger statements:** forbidden
- **`var` keyword:** forbidden (use `const`, prefer it over `let`)
- **Loose equality:** forbidden (use `===`)

## Commit Messages

All commits follow Conventional Commits. Enforced by commitlint. Body line length is unlimited.

```
feat: add barcode scanning to set lookup
fix: correct validation error display on storage form
refactor: extract http middleware into shared service
```
