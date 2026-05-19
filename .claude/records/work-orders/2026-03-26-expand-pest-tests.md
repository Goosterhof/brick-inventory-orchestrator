# Shipping Order: Expand Pest Test Suite with Datasets and Covers

**Order #:** 2026-03-26-expand-pest-tests
**Filed:** 2026-03-26
**Issued By:** Logistics Director (on CEO's request)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Adopt Pest's `dataset()` and `covers()` features across the test suite. Datasets eliminate duplicated test logic by parameterizing repeated patterns. Covers explicitly bind test files to the classes they verify, tightening the test-to-code contract.

## Scope

### In the Crate

- **`covers()`:** Add `covers(ClassName::class)` declarations to all Unit and Feature test files, binding each test file to the class(es) it inspects
- **`dataset()`:** Identify tests with duplicated structure across multiple inputs and refactor them to use parameterized datasets. Priority targets:
  - Policy tests (same permission checks across user roles/states)
  - Validation tests in feature tests (multiple invalid input scenarios)
  - Service tests (repeated API response patterns with different edge cases)
  - Any unit test where multiple `it()` blocks differ only in input/expected values
- **Architecture enforcement:** Add an architecture test requiring all Unit and Feature test files to declare `covers()`
- **Preserve all existing test conventions:** `describe()` blocks, `it('should ...')` syntax, strict types, Mockery patterns — nothing changes except adding datasets and covers on top

### Not on This Pallet

- Custom expectations (separate future order)
- `todo()`, `group()`, `throws()`, or other Pest features
- New Pest plugins (type-coverage, stressless, etc.)
- Refactoring test structure or renaming test files
- Changing the Mockery mocking approach in unit tests
- Adding new test coverage for untested code — this order is about improving existing tests, not writing new ones

## Acceptance Criteria

- [ ] Every Unit and Feature test file declares `covers()` for the class(es) it tests
- [ ] At least 5 test files refactored to use `dataset()` where there was clear input/output duplication
- [ ] An architecture test enforces that all Unit and Feature test files use `covers()`
- [ ] `composer test` passes — full suite green
- [ ] `composer phpstan` passes — no static analysis regressions
- [ ] `composer test:arch` passes — all architecture regulations hold
- [ ] No test is deleted or weakened — dataset refactors must preserve all original assertions
- [ ] Datasets are defined inline (scoped to the test) or in `describe()` blocks — no shared global dataset files

## References

- Pest Datasets docs: https://pestphp.com/docs/datasets
- Pest Coverage (covers): https://pestphp.com/docs/coverage#covers
- Warehouse Regulations: CLAUDE.md (test conventions, architecture tests)

## Notes from the Issuer

The goal is tighter test-to-code traceability (covers) and reduced duplication (datasets) — not a rewrite. The Head Sorter should be surgical: add `covers()` everywhere, then scan for the clearest dataset candidates and refactor those. If a test doesn't benefit from a dataset (single scenario, complex setup that varies in non-trivial ways), leave it alone.

For the architecture test enforcing `covers()`: follow the existing pattern in `TestConventionsArchitectureTest.php` — scan test files and assert the presence of `covers()` declarations.

---

**Status:** Complete
**Shift Log:** `.claude/records/journals/2026-03-26-expand-pest-tests.md`
