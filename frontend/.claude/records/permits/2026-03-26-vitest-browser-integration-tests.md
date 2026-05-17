# Building Permit: Vitest Browser Mode Integration Tests (Phase 1)

**Permit #:** 2026-03-26-vitest-browser-integration-tests
**Filed:** 2026-03-26
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Add a Vitest Browser Mode workspace (Playwright provider) alongside the existing happy-dom unit test workspace. This gives us real-browser integration tests for components that depend on native browser APIs, filling the gap between our unit tests and future E2E coverage.

## Scope

### In the Box

- Install and configure `@vitest/browser` with Playwright provider
- Add a `browser` workspace configuration in `vitest.config.ts` (parallel to existing `project()` setup)
- Create a browser test setup file (`src/tests/browser/setup.ts`) if needed
- Add npm scripts: `test:browser` (watch), `test:browser:coverage` (single run with coverage)
- Write browser-mode integration tests for initial targets:
    - **BarcodeScanner** — camera permissions, mediaDevices API, BarcodeDetector interaction, error states (NotAllowedError, NotFoundError), reset mechanism
    - **ConfirmDialog** — native `<dialog>` element behavior, open/close lifecycle, return values
    - **ModalDialog** — native `<dialog>` showModal/close, backdrop interactions, focus trapping
- Ensure browser tests pass the existing test guard reporters (collect-guard, test-guard) or define appropriate thresholds for browser context
- Ensure browser test coverage integrates with the existing Istanbul coverage pipeline
- Update the pre-push gauntlet if browser tests should be included (architect to recommend, CFO to approve)

### Not in This Set

- Standalone Playwright E2E tests (Phase 2, separate permit)
- Rewriting existing happy-dom unit tests as browser tests — existing tests stay as-is
- Testing page-level components (SetDetailPage, ScanSetPage, etc.) — those are Phase 2 E2E candidates
- Form submission or API integration flows
- CI pipeline changes (handled separately if needed)
- Any changes to the 100% coverage thresholds on existing unit test scope

## Acceptance Criteria

- [ ] `npm run test:browser` runs integration tests in a real browser via Playwright
- [ ] BarcodeScanner integration tests cover: camera permission grant/deny, barcode detection emission, error state rendering, reset/re-scan flow
- [ ] ConfirmDialog integration tests cover: native `<dialog>` open/close, confirm/cancel emission, backdrop click behavior
- [ ] ModalDialog integration tests cover: `showModal()` lifecycle, close on backdrop, slot content rendering in real DOM
- [ ] All browser tests pass the test guard performance thresholds (or thresholds are adjusted with documented rationale)
- [ ] Coverage from browser tests is reported alongside unit test coverage
- [ ] Existing unit tests (`npm run test:unit`) are unaffected — no regressions
- [ ] Full quality gauntlet passes: type-check, knip, lint, format, test:coverage, build, size
- [ ] Architecture test (`architecture.spec.ts`) updated if new test file patterns need validation

## References

- Minutes: 2026-03-26 — Testing Strategy: Beyond Unit Tests (MINUTES.md)
- Related Permit: Phase 2 (standalone Playwright E2E) — to be filed after Phase 1 delivery
- Vitest Browser Mode docs: https://vitest.dev/guide/browser/

## Notes from the Issuer

**Strategic context:** This is the first step in a two-phase testing strategy approved by the CEO. The goal is to move from "they know how to unit test" to "they have a testing strategy" — a key signal for the portfolio showcase.

**Key technical considerations:**

- The existing `vitest.config.ts` uses a multi-project setup with 14 workspaces. The browser workspace should follow the same pattern, not introduce a separate config file.
- Test guard reporters (collect-guard at 500ms delta, test-guard at 1000ms) were tuned for happy-dom. Browser tests will be slower by nature — the architect should propose adjusted thresholds with rationale, not silently disable the guards.
- BarcodeScanner is the highest-value target: it uses `navigator.mediaDevices.getUserMedia`, `BarcodeDetector`, and interval-based polling — all things happy-dom can't meaningfully test.
- The architect should evaluate whether `@testing-library/vue` adds value for browser tests over raw `@vue/test-utils`. If it does, make the case. If not, stay consistent with existing patterns.

**Constraint:** Do not expand coverage scope to app-level domains (`src/apps/**/domains/**`). Those remain excluded from coverage. Browser tests should target shared components only in this phase.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-03-26-vitest-browser-integration-tests.md`
