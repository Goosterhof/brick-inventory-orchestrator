# Building Permit: Migrate Remaining Integration Tests to Mock Server Pattern

**Permit #:** 2026-03-31-integration-test-mock-server-migration
**Filed:** 2026-03-31
**Issued By:** General (war room)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Migrate the remaining 16 integration test files from the old holder-ref mock pattern (4x `vi.mock()` per file) to the mock-server pattern proven in the StorageOverviewPage prototype. Each test should end up with at most one `vi.mock()` call — the `@script-development/fs-http` transport layer. Router, translation, stores, and string transforms all go real.

## Scope

### In the Box

- Migrate all 16 remaining integration test files to use `@integration/helpers/mock-server`
- Remove `vi.mock("axios", ...)`, `vi.mock("string-ts", ...)`, `vi.mock("@app/services", ...)`, `vi.mock("@app/stores", ...)` from each file
- Remove `vi.mock("@app/services/router", ...)` where applicable — router runs real in happy-dom (proven in prototype)
- Change assertions from translation keys to actual English text
- Change fixtures to snake_case matching real API response format
- Register appropriate mock-server routes per page (each page's store calls `retrieveAll()` with its domain name)
- Extend `mock-server.ts` if any page test needs capabilities beyond `onGet` (e.g., `onPost` for form submissions, error responses)

### Not in This Set

- Sibling-territory integration tests (separate territory, separate campaign)
- New integration tests for pages that don't have them yet
- Changes to production source code
- Changes to unit tests
- Mock-server error response support (add only if a test actually needs it — don't speculatively build)

## Acceptance Criteria

- [ ] All 17 integration test files (16 migrated + 1 prototype) use the mock-server pattern
- [ ] Zero `vi.mock()` calls for `axios`, `string-ts`, `@app/services` barrel, or `@app/stores` across all integration tests
- [ ] Router service runs real in all tests (no `vi.mock("@app/services/router", ...)`)
- [ ] All assertions use actual English text, not translation keys
- [ ] All fixtures use snake_case
- [ ] `npm run test:integration:run` passes — 17 files, 97+ tests, 0 failures
- [ ] Full gauntlet passes (format, lint, type-check, knip, size, test:coverage)

## References

- Preceding Permit: `.claude/records/permits/2026-03-31-integration-test-mock-server.md` (prototype)
- Preceding Journal: `.claude/records/journals/2026-03-31-integration-test-mock-server.md`
- Decision: ADR-013 (Page Integration Tests, amended 2026-03-31 with Mock Boundary Evolution)
- War Room Context: ADR-0017, deliberation session 2026-03-31

## Notes from the Issuer

**The prototype proved three things:**

1. Mock-server pattern works — real stores hydrate from in-memory routes, real translation renders English text, real camelCase transforms exercise on snake_case fixtures.
2. Router mock is unnecessary — `createRouterService` runs cleanly in happy-dom. Zero mocks needed beyond transport.
3. `@integration` vitest alias keeps import paths clean.

**Migration should be mechanical.** Each file follows the same transformation: remove old mocks, add `vi.mock("@script-development/fs-http", ...)`, register routes in `beforeEach`/`mountPage`, update assertions and fixtures. The architect should identify any page that requires capabilities the mock-server doesn't yet have (POST, error responses) and extend it minimally.

**Pages that use `familyAuthService`** (LoginPage, RegisterPage) may need special attention — the auth service likely makes HTTP calls too. If it goes through `familyHttpService` (which uses `createHttpService` from fs-http), the mock-server intercepts it for free. If it has its own HTTP mechanism, it may still need mocking. The architect should investigate and document.

**Pages that use domain-specific stores with cross-references** (e.g., SetDetailPage referencing storage options) may need multiple mock-server routes registered. This is expected and correct — it mirrors what the real API serves.

---

**Status:** Complete
**Journal:** [2026-03-31-integration-test-mock-server-migration.md](../journals/2026-03-31-integration-test-mock-server-migration.md)
