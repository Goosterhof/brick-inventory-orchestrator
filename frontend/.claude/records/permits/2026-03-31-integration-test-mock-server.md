# Building Permit: Integration Test Mock Server — Replace Holder Pattern with Mock HTTP Boundary

**Permit #:** 2026-03-31-integration-test-mock-server
**Filed:** 2026-03-31
**Issued By:** General (war room deliberation with CEO)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Replace the current integration test mock pattern (4x `vi.mock()` with holder refs injecting data into mocked stores) with a mock-server approach where real stores, real translation service, and real camelCase transforms execute against a lightweight in-memory HTTP service. The mock boundary moves from the service/store layer down to the HTTP transport layer.

## Scope

### In the Box

- Create `src/tests/integration/helpers/mock-server.ts` — lightweight in-memory request handler implementing the `HttpService` interface from `@script-development/fs-http`
- Create `src/tests/integration/helpers/mock-http-service.ts` — module that mocks `@script-development/fs-http` to return mock-server-backed instances instead of real axios instances
- Refactor `StorageOverviewPage.spec.ts` as the prototype — prove the pattern works end-to-end
- Let the real `familyTranslationService` run — assertions change from translation keys (`"storage.title"`) to actual English text (`"Storage"`)
- Let real `string-ts` transforms run — `toCamelCaseTyped` exercises on snake_case fixtures
- Let real `createAdapterStoreModule` run — reactive wiring, Object.freeze, adapted cache all exercise
- Amend ADR-013 to document the new mock boundary and rationale
- Update integration setup.ts if needed (e.g., localStorage polyfill for storageService)

### Not in This Set

- Migrating the other 16 integration tests (follow-up permit after pattern is proven)
- Sibling-territory integration tests (separate territory, separate campaign)
- Reducing router mock (stays mocked — side-effect boundary)
- Reducing loading service mock (stays mocked — controls async timing)
- Changes to `@script-development/fs-http` package (the mock works around the encapsulated axios instance, not through it)

## Acceptance Criteria

- [ ] `mock-server.ts` supports at minimum: `onGet(endpoint, responseData)` and `reset()`
- [ ] Mock HTTP service intercepts `createHttpService` from `@script-development/fs-http` at module level, returning a service backed by mock-server
- [ ] `StorageOverviewPage.spec.ts` has zero `vi.mock()` calls for `axios`, `string-ts`, `@app/services` (translation/loading), or `@app/stores`
- [ ] `StorageOverviewPage.spec.ts` mocks only: router service and `@script-development/fs-http` (via mock HTTP service helper)
- [ ] Assertions use actual English text (e.g., `"Storage"`, `"Add storage"`) not translation keys
- [ ] Test fixtures use snake_case (matching real API response format)
- [ ] All existing test scenarios still pass (same coverage, different mechanism)
- [ ] `npm run test:integration:run` passes
- [ ] ADR-013 amended with new "Mock Boundary" section documenting Option C and rationale

## References

- Decision: ADR-013 (Page Integration Tests) — being amended
- War Room Context: ADR-0017 (cross-project page integration tests)
- War Room Context: Deliberation session 2026-03-31 — Commander and General evaluated 4 options (A: mock axios.create, B: mock fs-http module, C: mock-server replacing HTTP layer, D: expose axios instance). Option C chosen for clean encapsulation.
- Package: `@script-development/fs-http` — `createHttpService()` encapsulates axios instance via `axios.create()`, making axios-mock-adapter incompatible without fighting the architecture.

## Notes from the Issuer

**Strategic context:** The Commander identified that the current integration test pattern mocks too much — stores, translation, string transforms are all faked. The tests verify component composition (their ADR-013 purpose) but miss the store→component reactive wiring, the camelCase transform pipeline, and actual translated text rendering.

**Why not axios-mock-adapter:** `fs-http` correctly encapsulates its axios instance. `axios.create()` returns a private instance that MockAdapter can't intercept without mocking the axios module itself — which defeats the purpose. Option C respects the encapsulation by mocking at the `fs-http` import boundary with a functional replacement, not a dead stub.

**The mock-server is not a mock in the traditional sense.** It's a functional in-memory HTTP service that speaks the same `HttpService` interface. Stores call `getRequest()` and get back shaped data. The difference from a real API is transport — memory vs network. Everything else (store hydration, camelCase transform, reactive binding, component rendering) is real.

**Translation asserting on English text:** Default locale is `en`. Tests will assert on what the user sees (`"Storage"`, `"No storage locations yet..."`) rather than translation keys. This is better — it catches both composition failures AND translation key typos. If a translation key is renamed but the translations object isn't updated, the test catches it.

**localStorage in adapter-store:** `createAdapterStoreModule` reads from `storageService.get()` on init (line 46-49 of adapter-store.ts). In integration tests, this should return empty state. The `storageService` used by BIO stores needs to either be mocked (simple, `get` returns `{}`) or happy-dom's localStorage starts empty (which it does). Architect should verify which approach is cleaner.

---

**Status:** Complete
**Journal:** [2026-03-31-integration-test-mock-server.md](../journals/2026-03-31-integration-test-mock-server.md)
