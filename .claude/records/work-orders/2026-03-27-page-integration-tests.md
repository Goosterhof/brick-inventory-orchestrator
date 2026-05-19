# Building Permit: Page Integration Test Suite

**Permit #:** 2026-03-27-page-integration-tests
**Filed:** 2026-03-27
**Issued By:** CEO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Build a page integration test suite that mounts each domain page with real child components and mocked services, catching component composition failures that unit tests with stubbed children miss. Implements ADR-013.

## Scope

### In the Box

- `vitest.integration.config.ts` — separate Vitest config for integration tests (separate from unit and browser configs)
- `src/tests/integration/setup.ts` — integration test setup file
- `src/tests/integration/stubs/phosphorIcons.ts` — lightweight icon stub module for Vite alias
- Integration test files for all 16 domain pages:
    - `about/pages/AboutPage.spec.ts`
    - `auth/pages/LoginPage.spec.ts`
    - `auth/pages/RegisterPage.spec.ts`
    - `home/pages/HomePage.spec.ts`
    - `parts/pages/PartsPage.spec.ts`
    - `sets/pages/AddSetPage.spec.ts`
    - `sets/pages/EditSetPage.spec.ts`
    - `sets/pages/IdentifyBrickPage.spec.ts`
    - `sets/pages/ScanSetPage.spec.ts`
    - `sets/pages/SetDetailPage.spec.ts`
    - `sets/pages/SetsOverviewPage.spec.ts`
    - `storage/pages/AddStoragePage.spec.ts`
    - `storage/pages/EditStoragePage.spec.ts`
    - `storage/pages/StorageDetailPage.spec.ts`
    - `storage/pages/StorageOverviewPage.spec.ts`
    - `settings/pages/SettingsPage.spec.ts`
- npm scripts: `test:integration` (watch) and `test:integration:run` (single run)
- Vite `resolve.alias` for `@phosphor-icons/vue` pointing to the stub module

### Not in This Set

- Modal integration tests (future expansion based on evidence per ADR-013)
- Browser test changes or migration — browser tests remain as-is for browser-native API testing
- Changes to existing unit tests or their mocking strategy
- Coverage thresholds for integration tests (open question per ADR-013 — revisit after baseline run)
- Test-guard reporter threshold calibration for integration tests (open question per ADR-013)
- Architecture test enforcing "every page has an integration test" (enforcement mechanism per ADR-013 — separate permit)

## Acceptance Criteria

- [ ] `npm run test:integration:run` passes with all 16 page integration tests green
- [ ] Each integration test uses `mount` (not `shallowMount`) with real shared components
- [ ] Each integration test mocks only services (HTTP, auth, router) — no `vi.mock()` of `@shared/components/` paths
- [ ] `@phosphor-icons/vue` is aliased to a lightweight stub in the integration Vitest config (not in test files or setup)
- [ ] Existing test suites unaffected: `npm run test:coverage` and browser tests still pass
- [ ] Integration test coverage is NOT counted toward the 100% unit coverage threshold
- [ ] Each test verifies at least: child components render with correct props, conditional rendering states work, and event flow between parent and child components
- [ ] Quality gauntlet passes: type-check, knip, lint, format, build

## References

- Decision: [ADR-013 — Page integration tests with real component composition](.claude/docs/decisions/013-page-integration-tests.md)
- Related: [ADR-005 — Istanbul coverage with zero ignore comments](.claude/docs/decisions/005-istanbul-coverage-no-ignores.md)
- Related: [ADR-010 — Test isolation via execution-time guard](.claude/docs/decisions/010-test-isolation-collect-guard.md)
- Related: [ADR-011 — Domain-based Vitest project split](.claude/docs/decisions/011-domain-based-vitest-projects.md)

## Notes from the Issuer

This is a significant infrastructure addition — the third test layer after unit and browser tests. The architect should:

1. Get the Vitest config and icon stub working first, then write one page test as a proof-of-concept before scaling to all 16
2. Pay attention to collect-time — the icon alias is specifically designed to avoid the ~800ms-per-file tax from the phosphor barrel export
3. Integration tests should be meaningfully different from unit tests — if an integration test is just re-testing business logic that the unit test already covers, it's wasted work. Focus on composition: props passed correctly, slots populated, events flowing between components

This is a large permit (16 test files + infrastructure). The architect may want to batch this across domains. That's fine as long as each test file meets the acceptance criteria.

---

**Status:** Complete
**Journal:** [2026-03-27-page-integration-tests](../journals/2026-03-27-page-integration-tests.md)
