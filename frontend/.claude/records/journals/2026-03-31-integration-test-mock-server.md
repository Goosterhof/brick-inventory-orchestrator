# Construction Journal: Integration Test Mock Server

**Journal #:** 2026-03-31-integration-test-mock-server
**Filed:** 2026-03-31
**Permit:** `.claude/records/permits/2026-03-31-integration-test-mock-server.md`
**Architect:** Lead Brick Architect

---

## Work Summary

| Action   | File                                                                                    | Notes                                                                   |
| -------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Created  | `src/tests/integration/helpers/mock-server.ts`                                          | In-memory HTTP service + route registration API                         |
| Modified | `src/tests/integration/apps/families/domains/storage/pages/StorageOverviewPage.spec.ts` | Replaced 4x vi.mock() with mock-server pattern, real stores/translation |
| Modified | `.claude/docs/decisions/013-page-integration-tests.md`                                  | Added "Mock Boundary Evolution" section                                 |

## Permit Fulfillment

| Acceptance Criterion                                                        | Met | Notes                                                                                      |
| --------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------ |
| mock-server.ts supports onGet and reset                                     | Yes | Also supports onPost, onPut, onPatch, onDelete                                             |
| Mock HTTP service intercepts createHttpService at module level              | Yes | Async vi.mock with dynamic import pattern                                                  |
| Zero vi.mock for axios, string-ts, @app/services (translation), @app/stores | Yes | All removed; only 2 vi.mock calls remain                                                   |
| Mocks only: router service and @script-development/fs-http                  | Yes | Router mocked for side-effect isolation; fs-http for transport replacement                 |
| Assertions use actual English text                                          | Yes | "Storage", "Add storage", "No storage locations yet"                                       |
| Fixtures use snake_case                                                     | Yes | parent_id, child_ids — toCamelCaseTyped exercises on them                                  |
| All existing test scenarios still pass                                      | Yes | Same 6 tests, same coverage, different mechanism                                           |
| npm run test:integration:run passes                                         | Yes | 17 files, 97 tests, 0 failures                                                             |
| ADR-013 amended with mock boundary section                                  | Yes | Documents original vs new boundary, axios-mock-adapter rationale, what goes real vs mocked |

## Decisions Made

1. **Async vi.mock with dynamic import over vi.hoisted factory** — The mock-server module needs to be available inside the `vi.mock("@script-development/fs-http")` factory, but `vi.hoisted()` cannot reference imported modules (they haven't initialized yet at hoist time). Tried three approaches: (a) importing `mockHttpService` statically and referencing in vi.mock factory — failed with "Cannot access before initialization"; (b) `vi.hoisted(() => createMockServer())` — failed because `createMockServer` is an import reference unavailable at hoist time; (c) async `vi.mock` with `await import()` inside the factory — works because dynamic imports resolve at factory execution time, not at hoist time. Chose (c) as the only working pattern.

2. **Module-level singleton over factory pattern** — Initially designed `createMockServer()` as a factory returning `{mockHttpService, mockServer}` pairs, intended for `vi.hoisted()` usage. When that pattern proved incompatible with vitest's hoisting, reverted to a module-level singleton with shared route table. Simpler API, same isolation (routes cleared in `beforeEach`).

3. **Mock @app/services/router instead of @app/services barrel** — The page imports from `@app/services` (the barrel). Could mock the entire barrel or just the router sub-module. Chose to mock only `@app/services/router` — vitest resolves the barrel's re-export through the mocked sub-module, so translation, loading, and storage services stay real. Narrower mock surface = more real code exercised.

4. **Loading service stays real with no-op middleware** — The `familyLoadingService` registers request/response middleware on the HTTP service via `registerLoadingMiddleware`. The mock-server's middleware registration methods are no-ops, so the middleware registers but never fires. `isLoading` stays `computed(() => false)`. This is correct behavior for tests — no pending requests means not loading.

5. **localStorage.clear() in beforeEach** — The adapter-store reads from `storageService.get()` on initialization, which reads from localStorage. Between test runs, stale data from a previous test's `storageService.put()` (called by `retrieveAll`) could leak. `localStorage.clear()` ensures each test starts with an empty storage state.

## Quality Gauntlet

| Check         | Result | Notes                               |
| ------------- | ------ | ----------------------------------- |
| format:check  | Pass   | oxfmt reordered 1 import            |
| lint          | Pass   | 0 errors, 9 warnings (pre-existing) |
| lint:vue      | Pass   |                                     |
| type-check    | Pass   |                                     |
| test:coverage | Pass   | No production code changed          |
| knip          | Pass   | New file recognized                 |
| size          | Pass   | No production code changed          |

## Showcase Readiness

Strong. The mock-server pattern demonstrates a mature approach to integration testing: mock at the transport boundary, let everything else run real. The pattern is immediately reusable for the other 16 integration tests. The ADR amendment documents the evolution transparently — a reviewer can see why the boundary moved and what's exercised now that wasn't before. The one cosmetic weakness is the deep relative import path (`../../../../../helpers/mock-server`), which could be cleaned up with a vitest alias if the firm decides it's worth the config change.

## Proposed Knowledge Updates

- **Learnings:** When mocking `@script-development/fs-http` in integration tests, use async `vi.mock` with dynamic import — `vi.hoisted` cannot reference imported modules. Pattern: `vi.mock("@script-development/fs-http", async () => { const {mockHttpService} = await import("../helpers/mock-server"); return {createHttpService: () => mockHttpService}; })`.
- **Learnings:** To mock a sub-module that a barrel re-exports, mock the sub-module path (e.g., `@app/services/router`) — vitest resolves the barrel's re-export through the mock.
- **Pulse:** Integration test mock-server pattern established. StorageOverviewPage migrated as prototype. 16 remaining tests can follow the same pattern.
- **Domain Map:** No changes.
- **Decision Record:** ADR-013 amended (Mock Boundary Evolution section).

## Self-Debrief

### What Went Well

- Reading all source files thoroughly before writing code paid off. Understanding the module dependency chain (page -> stores -> services -> fs-http) was essential for choosing the right mock boundary.
- The mock-server design is minimal — 107 lines, no external dependencies, covers all HTTP verbs. No over-engineering.
- The `@app/services/router` sub-module mock trick worked cleanly — didn't need to mock the entire services barrel.

### What Went Poorly

- Spent three iterations on the vi.mock/vi.hoisted interaction before finding the working pattern. First tried static import reference (failed), then vi.hoisted factory (failed), then async vi.mock with dynamic import (worked). Should have started by understanding vitest's hoisting constraints more carefully.
- Initially created a `createMockServer` factory pattern (more complex) before realizing the simpler module-level singleton was sufficient and the factory wasn't usable in `vi.hoisted` anyway.

### Blind Spots

- Did not verify the `vi.hoisted` + import interaction upfront. The graduation log already has a candidate about `vi.hoisted` patterns ("Before writing vi.mock factories that reference test-scoped variables, always use vi.hoisted()"). This is a related but distinct issue — `vi.hoisted` itself cannot call imported functions. The existing candidate doesn't cover this case.

### Training Proposals

| Proposal                                                                                                                                                                                            | Context                                                                                                        | Shift Evidence                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| When a vi.mock factory needs to reference a helper module, use async vi.mock with dynamic import — vi.hoisted cannot access imported modules because it runs before import initialization           | Tried 3 approaches; only async vi.mock + await import() works for referencing helper modules in mock factories | 2026-03-31-integration-test-mock-server |
| When mocking a sub-module that a barrel file re-exports, verify the barrel's re-export picks up the mock by checking the consuming module's behavior — don't assume and don't mock the whole barrel | Mocked @app/services/router; confirmed barrel re-export resolved through mock                                  | 2026-03-31-integration-test-mock-server |

---

## CFO Evaluation

_Appended by the CFO after reviewing the journal. The architect's sections above are not edited — they stand as written._
