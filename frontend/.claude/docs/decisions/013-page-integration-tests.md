# Decision: Page integration tests with real component composition

**Date**: 2026-03-27
**Feature**: Catching integration failures that unit tests with mocked children miss
**Status**: accepted
**Transferability**: universal

## Context

The test suite enforces 100% coverage via unit tests (ADR-005) with heavy per-file mocking (ADR-010). Every page test stubs its child components — `BadgeLabel` becomes `<span><slot /></span>`, `ConfirmDialog` becomes a shell. This proves each page's logic works in isolation, but it cannot prove the page works when real components compose together.

The failure mode is concrete and recurring: a developer renames a prop on a shared component, updates the component's unit test, and all tests pass. But three pages that use that component are now broken — the stub never validated the prop contract. The developer pushes, CI passes, and the breakage is discovered manually in the browser.

This is the fundamental limitation of unit tests with mocked dependencies: they test each node in isolation but not the edges between nodes. The gap grows with the number of shared components (~25 and rising) and the number of pages that compose them (~16 domain pages).

Browser-based integration tests (Vitest Browser Mode with Playwright) were considered for this role but rejected for most pages. Real browser tests are necessary when testing browser-native APIs that happy-dom doesn't implement faithfully (`<dialog>` showModal, MediaStream, IntersectionObserver) — but most pages don't use these APIs. The overhead of Playwright (slower execution, WSL2 setup complexity, known `wrapper.emitted()` tracking bugs in browser mode) is not justified when happy-dom can render the same component tree correctly.

The question: how do we test that pages work with their real child components, without duplicating unit test coverage or requiring browser infrastructure?

## Options Considered

| Option                                                                        | Pros                                                                                                                                      | Cons                                                                                                                                                                      | Why eliminated / Why chosen                                            |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Rely on unit tests alone**                                                  | Already in place, fast, 100% coverage                                                                                                     | Cannot catch prop/slot/event contract mismatches between parent and child. The exact failure mode we're experiencing                                                      | Eliminated — known gap, recurring breakage                             |
| **E2E tests (Cypress/Playwright against running app)**                        | Tests the full stack including routing, API, and rendering                                                                                | Slow, flaky, requires backend, high maintenance. Overkill for catching component composition issues                                                                       | Eliminated — wrong tool for the problem                                |
| **Browser integration tests for all pages**                                   | Real browser rendering, catches CSS/layout issues too                                                                                     | 2-10x slower than happy-dom. Playwright setup overhead. `wrapper.emitted()` bug requires workarounds. WSL2 requires system deps. Most pages don't use browser-native APIs | Eliminated — cost disproportionate to value for non-browser-API pages  |
| **Page integration tests in happy-dom with real components, mocked services** | Catches composition failures. Same speed class as unit tests. No browser infrastructure needed. Shares the existing happy-dom environment | Does not catch browser-native API issues (covered by browser tests separately). Adds a second test pass over page code                                                    | **Chosen** — directly addresses the gap at minimal infrastructure cost |

## Decision

### A separate integration test suite for domain pages

A new test layer that mounts each domain page with **real child components** and **mocked services/HTTP**. The distinction from unit tests:

| Concern                       | Unit tests (existing)        | Page integration tests (new) |
| ----------------------------- | ---------------------------- | ---------------------------- |
| Child components              | Stubbed/mocked               | Real                         |
| Services (HTTP, auth, router) | Mocked                       | Mocked                       |
| Mounting strategy             | `shallowMount`               | `mount`                      |
| What they prove               | Page logic in isolation      | Component composition works  |
| Coverage accounting           | Counts toward 100% threshold | Separate — does not count    |

### What gets a page integration test

Domain page components only — the ~16 pages under `src/apps/families/domains/*/pages/`. These are the composition points where shared components meet domain logic. Starting here because:

1. Pages are where prop/slot/event contracts between components are exercised
2. Pages are what users actually see — a broken page is a broken feature
3. The scope is bounded (~16 files) and can expand incrementally

Modals, sub-views, and shared components are excluded for now. The weak points will become visible once the page tests are running, and scope can expand based on evidence.

### What to test

Page integration tests verify **composition correctness**, not business logic (that's the unit test's job):

- Child components render with correct props (the prop contract is honored)
- Slots are populated and display expected content
- Events flow correctly between child and parent (click confirm in `ConfirmDialog` triggers the page's handler)
- Conditional rendering shows/hides the right components based on state
- Loading/error/empty states render the correct component tree

### What NOT to test

- Detailed business logic (unit tests cover this)
- Individual component internals (unit tests cover this)
- HTTP request/response details (unit tests cover this)
- Browser-native API behavior (browser tests cover this)

### Mocking strategy

**Mock the boundaries, not the components:**

- HTTP layer: mock `createHttpService()` / axios — no real API calls
- Auth service: mock authentication state
- Router service: mock navigation
- External libraries that don't affect rendering (e.g., barcode-detector)

**Do NOT mock:**

- Shared components (`ModalDialog`, `PrimaryButton`, `BadgeLabel`, etc.)
- Form components (`FormField`, `FormLabel`, etc.)
- Icon components (use real `@phosphor-icons/vue` or a lightweight global stub if collect-time is prohibitive)

The icon library question deserves attention: `@phosphor-icons/vue` re-exports ~700 components and adds significant collect time (ADR-010). Page integration tests that import real pages will transitively import icons. Options: accept the collect-time cost (integration tests are expected to be slower), or register a global lightweight icon stub in the integration test setup. This is left as an open question to resolve based on measured performance.

### File organization

Following ADR-011's domain-based structure:

```
src/tests/integration/
├── setup.ts
└── apps/families/domains/
    ├── sets/pages/
    │   ├── SetsOverviewPage.spec.ts
    │   ├── SetDetailPage.spec.ts
    │   └── ...
    ├── storage/pages/
    │   └── ...
    └── ...
```

A separate Vitest config (`vitest.integration.config.ts`) with its own project definitions, similar to how `vitest.browser.config.ts` is structured. New npm scripts:

- `npm run test:integration` — watch mode
- `npm run test:integration:run` — single run

### Coverage accounting

Page integration tests are a **separate suite** that does not contribute to the 100% unit coverage threshold (ADR-005). This is deliberate:

- The 100% threshold drives developers to write unit tests for every file. If integration tests counted, a developer could skip a unit test because "the page integration test covers that line." That erodes isolation discipline.
- Integration tests exist to catch composition failures, not to prove coverage. A line "covered" by an integration test that mounts 15 components deep is not meaningfully tested — it's incidentally executed.

### Relationship to browser tests

Browser tests (`src/tests/browser/`) remain for components that use browser-native APIs. Page integration tests and browser tests are complementary, not overlapping:

| Test type        | Environment         | Purpose                           |
| ---------------- | ------------------- | --------------------------------- |
| Unit             | happy-dom           | Prove isolated logic and coverage |
| Page integration | happy-dom           | Prove component composition       |
| Browser          | Playwright/Chromium | Prove browser-native API behavior |

A component like `ModalDialog` has all three: unit tests (logic), page integration (composes correctly inside pages), and browser tests (`showModal()` works).

## Consequences

- **Catches the specific failure mode** — prop renames, slot changes, and event contract breaks are caught before they reach a browser
- **Low infrastructure cost** — happy-dom, same Vitest setup, no Playwright needed
- **Second test pass over pages** — pages now have two test files each. Accepted cost — they test different things
- **Slower than unit tests** — real component trees are heavier than stubs. Expected ~100-300ms per page test file vs ~50-150ms for unit tests. Monitored by the test-guard reporter (ADR-010)
- **Icon library resolved via Vite alias** — `@phosphor-icons/vue` (4,536 exports, only 7 used) is aliased to a lightweight stub module in the integration Vitest config. This avoids the ~800ms collect-time tax per file without polluting test files or setup files. See Resolved Questions
- **Incremental expansion** — starting with 16 domain pages. Scope expands based on where breakage is found, not upfront guessing

## Enforcement

| What                                        | Mechanism                                                                                | Scope                                          |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Every domain page has an integration test   | Architecture test (extend existing)                                                      | All `src/apps/*/domains/*/pages/*.vue` files   |
| Integration tests use real child components | Code review + lint rule prohibiting `vi.mock()` of `@shared/components/` paths           | All `src/tests/integration/**/*.spec.ts` files |
| Services are mocked (no real HTTP)          | Test-guard reporter catches slow tests from real I/O                                     | All integration test files                     |
| Separate coverage accounting                | Separate vitest config with own coverage settings (no thresholds or separate thresholds) | `vitest.integration.config.ts`                 |

## Resolved Questions

### How to handle the @phosphor-icons/vue barrel export performance cost?

**Resolved 2026-03-27.** The package exports 4,536 icon components from a single barrel file. Only 7 are used in production code. Vite/Rollup tree-shakes this in production builds (`sideEffects: false`), but Vitest loads the full barrel during test collection — adding ~800ms per file that transitively imports icons.

Four options were evaluated:

| Option                              | Pros                                                                                              | Cons                                                                                                 | Verdict                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Global stub in integration setup.ts | Simple, one-time                                                                                  | Breaks "no mocks in setup" rule (ADR-011). Mixes test infrastructure concerns into setup file        | Eliminated                                                 |
| Vite resolve.alias in vitest config | Config-level, no test file pollution, no setup file mocking. Automatic for all transitive imports | Requires maintaining a stub module                                                                   | **Chosen**                                                 |
| Switch source code to deep imports  | Fixes root cause for all consumers                                                                | Package doesn't expose individual imports via `exports` field. Depends on internal package structure | Eliminated — fragile dependency on undocumented internals  |
| Accept the cost                     | Zero effort                                                                                       | ~13s of icon tax across 16 page tests, grows linearly with pages                                     | Eliminated — unnecessary overhead with a clean alternative |

The implementation: `vitest.integration.config.ts` adds a Vite `resolve.alias` that redirects `@phosphor-icons/vue` to a lightweight module exporting stub components (`{template: "<i />"}`) for each used icon. This operates at the build/transform level — test files and source files are unchanged. The stub module lives in `src/tests/integration/stubs/` and only needs updating when a new icon is added to the codebase (rare — 7 icons over the project's lifetime so far).

This does NOT violate ADR-011's "no mocks in setup" rule because it operates at the Vite config level, not the Vitest setup file. The distinction matters: a Vite alias is a build-time module redirect (like a path alias), not a test-time mock that could silently change test behavior.

## Mock Boundary Evolution

**Amended 2026-03-31.** The original mocking strategy mocked at the store/service layer — stores were replaced with holder-ref stubs, translation returned raw keys, string transforms were identity functions. This worked for proving component composition but left significant real code untested: reactive store hydration, the `toCamelCaseTyped()` pipeline, and actual translated text rendering.

### Original mock boundary (store/service layer)

```
                        MOCK BOUNDARY
                             |
Component ← stores (mocked) | ← HTTP service ← axios ← API
           ← translation (mocked, returns keys)
           ← string-ts (mocked, identity function)
```

Four `vi.mock()` calls per test file: `axios`, `string-ts`, `@app/services`, `@app/stores`. Assertions checked translation keys (`"storage.title"`) not user-visible text. Fixtures were pre-camelCased since string transforms were bypassed.

### New mock boundary (HTTP transport layer via mock-server)

```
Component ← stores (REAL) ← adapter-store (REAL) ← HTTP service (mock-server) | ← API
           ← translation (REAL, returns English text)
           ← string-ts (REAL, toCamelCaseTyped exercises)
           ← loading service (REAL, middleware no-ops on mock-server)
```

Two `vi.mock()` calls per test file: `@script-development/fs-http` (returns mock-server-backed HTTP service) and `@app/services/router` (navigation is a side-effect). Assertions check user-visible text (`"Storage"`, `"Add storage"`). Fixtures use snake_case matching real API responses.

### Why axios-mock-adapter was not viable

`@script-development/fs-http` encapsulates its axios instance via `axios.create()`. The returned instance is private — `MockAdapter` cannot intercept it without mocking the `axios` module itself at the import level, which defeats the purpose of respecting the package's encapsulation. The mock-server approach replaces `createHttpService` at the `@script-development/fs-http` import boundary with a functional in-memory implementation, preserving the encapsulation contract.

### What goes real vs. what stays mocked

| Concern                                          | Before                | After                        | Rationale                                                                  |
| ------------------------------------------------ | --------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| Stores (adapter-store, storageOptionStoreModule) | Mocked (holder refs)  | **Real**                     | Exercises reactive wiring, Object.freeze, adapted cache                    |
| Translation service                              | Mocked (returns keys) | **Real**                     | Catches translation key typos, verifies user-visible text                  |
| string-ts transforms (toCamelCaseTyped)          | Mocked (identity)     | **Real**                     | Exercises the snake_case → camelCase pipeline                              |
| Loading service                                  | Mocked                | **Real** (middleware no-ops) | Middleware registers on mock-server but never fires; isLoading stays false |
| Router service                                   | Mocked                | **Mocked**                   | Navigation is a side-effect boundary                                       |
| HTTP transport (@script-development/fs-http)     | Mocked (axios)        | **Mocked** (mock-server)     | The only mock boundary — everything above it runs real                     |

### The mock-server helper

`src/tests/integration/helpers/mock-server.ts` exports two things:

- `mockHttpService` — Implements the `HttpService` interface backed by in-memory route maps. Middleware registration methods are no-ops (the mock bypasses axios entirely, so interceptors never fire).
- `mockServer` — Route registration API (`onGet`, `onPost`, `reset`). Tests register routes before mounting, then the real store's `retrieveAll()` hits the mock-server and receives shaped data.

Usage pattern in test files:

```typescript
vi.mock('@script-development/fs-http', async () => {
    const {mockHttpService} = await import('../helpers/mock-server');
    return {createHttpService: () => mockHttpService};
});

beforeEach(() => mockServer.reset());
mockServer.onGet('storage-options', [
    /* snake_case fixtures */
]);
```

The async `vi.mock` with dynamic import is necessary because `vi.mock` factories are hoisted before static imports resolve — the mock-server module must be imported dynamically within the factory.

## Open Questions

- **Threshold calibration** — the test-guard reporter (ADR-010) thresholds are calibrated for unit tests. Integration tests mounting real component trees will be heavier. May need separate thresholds or a separate reporter instance for the integration config.
- **Coverage threshold for integration tests** — currently no coverage requirement. Once all 16 pages have integration tests, consider whether a minimum coverage threshold (e.g., 80% of page files) is worth enforcing.
- **Expanding scope** — after running page integration tests for a cycle, evaluate whether modals or sub-views show up as composition failure points. Expand based on evidence, not prediction.
