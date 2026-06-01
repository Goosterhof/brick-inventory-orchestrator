# Work Order: Gallery — Assert Side Effects in Integration Flow Tests

**Work Order #:** 2026-05-29-integration-flow-test-assertions
**Filed:** 2026-05-29
**Issued By:** CEO (via 2026-05-29 cross-wing sweep follow-up)
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `integration-flow-test-assertions`

---

## The Job

Sweep finding **G-test-1** (medium): each of 13 families integration page specs contains exactly one `it` block performing a full user flow (mount → fill → submit → flushPromises) that asserts **nothing**, closed with `// No assertion on navigation — integration tests verify composition, not side effects.` These are the behaviourally-richest tests in each page (submit → service → navigate) yet have zero detection power — a regression dropping the submit handler, the service call, or post-submit navigation passes green across all 13. The `vitest/expect-expect` rule is deliberately disabled so the suite stays green. Root mechanical cause: `mock-server.ts` runs the real router and records no call history.

## Scope

### In the Box

1. Extend `mock-server.ts` (in `src/tests/integration/`) to record request calls (and/or expose router-navigation spies), so flow tests can assert the converted snake_case POST fired (also exercising the ADR-0029 boundary the helper's docstring claims to protect).
2. For each of the 13 flow tests (LoginPage, RegisterPage, HomePage, AddSetPage, EditSetPage, IdentifyBrickPage, ScanSetPage, SetDetailPage, SetsOverviewPage, AddStoragePage, EditStoragePage, StorageDetailPage, StorageOverviewPage), add an assertion on the named side effect — service called with expected payload and/or `goToRoute` called with the expected route. Lift each from L0 to at least L1/L2.
3. Remove the boilerplate "no assertion" comment as the house standard for these tests.

### Not in This Set

- Re-enabling `vitest/expect-expect` globally (separate lint-policy decision).
- Rewriting the already-asserting `it` blocks in those files.

## Acceptance Criteria

- [ ] `mock-server.ts` records request calls (and/or router navigation) and is itself tested.
- [ ] All 13 flow tests assert their named side effect; none is assertion-free.
- [ ] Gallery gauntlet green (type-check, lint, lint:vue, knip, test:coverage, build) — including the integration suite.
- [ ] Build Record filed.

## References

- Audit: [`2026-05-29-warden-cross-wing-sweep`](../audits/2026-05-29-warden-cross-wing-sweep.md) — finding G-test-1
- ADR-0024 (page integration tests), ADR-0029 (case conversion)

---

**Status:** Open
