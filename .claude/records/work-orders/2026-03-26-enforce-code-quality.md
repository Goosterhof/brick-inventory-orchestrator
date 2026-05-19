# Shipping Order: Enforce Code Quality — Five-Point Tightening

**Order #:** 2026-03-26-enforce-code-quality
**Filed:** 2026-03-26
**Issued By:** Logistics Director (on CEO's order)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Tighten the quality gauntlet across five areas: add dependency vulnerability scanning to CI, raise mutation testing threshold, make linting a blocking CI gate, extend PHPStan analysis to the test suite, and raise feature test coverage requirements.

## Scope

### In the Crate

1. **Composer audit in CI** — Add `composer audit` as a blocking job in the GitHub Actions workflow
2. **Raise MSI threshold (75% → 85%)** — Update mutation testing minimum in composer scripts and CI config
3. **Make lint a blocking CI gate** — Ensure Rector and Pint dry-run checks fail CI on any diff (verify current behavior, fix if advisory-only)
4. **PHPStan on tests** — Add `tests/` to PHPStan analyzed paths, resolve or baseline any new errors
5. **Raise feature coverage (80% → 90%)** — Update threshold in `phpunit.feature-coverage.xml` and CI config, write any additional feature tests needed to meet the new bar

### Not on This Pallet

- Writing new unit tests to raise MSI (threshold change only — existing tests must already meet 85%, or adjust target to highest passing value ≥80%)
- Changes to Deptrac config or architecture tests
- New ADRs (these are enforcement tightenings, not architectural changes)
- Changes to pre-commit hooks (CI-focused order)

## Acceptance Criteria

- [ ] `composer audit` runs as a blocking CI job and would fail on known vulnerabilities
- [ ] Mutation testing threshold is raised above 75% (target 85%, floor 80%)
- [ ] CI lint job exits non-zero if Rector or Pint would produce changes
- [ ] PHPStan analyzes `tests/` directory (at level max or with a scoped baseline if needed)
- [ ] Feature coverage threshold is raised above 80% (target 90%, floor 85%)
- [ ] All existing CI checks still pass with the new configuration
- [ ] The full quality gauntlet passes locally: lint:test, phpstan, deptrac, test, test:coverage, test:feature-coverage, mutation

## References

- War Room Context: CEO directive to enforce higher code quality across the warehouse

## Notes from the Issuer

The guiding principle: raise the bar to the highest level the codebase *already supports* where possible (MSI, coverage), and close gaps where enforcement was advisory rather than blocking (lint, audit, PHPStan on tests). Don't write new tests in this order — adjust thresholds to what the current suite sustains. If the codebase can't hit 85% MSI today, find the current MSI and set the threshold just below it. Same for feature coverage.

---

**Status:** Complete
**Shift Log:** `.claude/records/journals/2026-03-26-enforce-code-quality.md`
