# Building Permit: Mount Boundary Enforcement

**Permit #:** 2026-03-31-mount-boundary-enforcement
**Filed:** 2026-03-31
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Enforce the convention that unit tests use `shallowMount` and integration tests use `mount`. Currently 15 Showcase unit test files use `mount`, which causes test guard violations and blurs the line between unit and integration testing. Add an architecture test rule to prevent future violations and fix all existing ones.

## Scope

### In the Box

- Add architecture test rule to `src/tests/unit/architecture.spec.ts` that:
    - Fails if any file under `src/tests/unit/` imports `mount` from `@vue/test-utils` (should use `shallowMount`)
    - Fails if any file under `src/tests/integration/` imports `shallowMount` from `@vue/test-utils` (should use `mount`)
- Migrate all 15 unit test files from `mount` → `shallowMount`:
    - `src/tests/unit/apps/showcase/components/FormValidationWorkbench.spec.ts`
    - `src/tests/unit/apps/showcase/components/ResourceAdapterPlayground.spec.ts`
    - `src/tests/unit/shared/components/PartListItem.spec.ts`
    - `src/tests/unit/apps/showcase/components/ComponentHealthMocked.spec.ts`
    - `src/tests/unit/apps/showcase/components/DialogServiceDemo.spec.ts`
    - `src/tests/unit/apps/showcase/components/SectionHeading.spec.ts`
    - `src/tests/unit/apps/showcase/components/ShowcaseHero.spec.ts`
    - `src/tests/unit/apps/showcase/components/SnapDemo.spec.ts`
    - `src/tests/unit/apps/showcase/components/ToastServiceDemo.spec.ts`
    - `src/tests/unit/apps/showcase/components/TypographySpecimen.spec.ts`
    - `src/tests/unit/apps/showcase/components/BrandVoice.spec.ts`
    - `src/tests/unit/apps/showcase/components/BrickDimensions.spec.ts`
    - `src/tests/unit/apps/showcase/components/ColorPalette.spec.ts`
    - `src/tests/unit/apps/showcase/components/ComponentGallery.spec.ts`
    - `src/tests/unit/apps/showcase/components/AntiPatterns.spec.ts`
- For each migration: review assertions that depend on deep rendering and either:
    - Explicitly unstub specific children (like `{global: {stubs: {SectionHeading}}}`) where content assertions require it
    - Adjust assertions to work with stubs (e.g., `findComponent` instead of DOM queries into children)
- Verify no test guard threshold violations remain after migration
- 100% test coverage maintained

### Not in This Set

- Moving tests between unit/ and integration/ directories — these are unit tests, they just need the right mount strategy
- Adding new tests — only modifying existing mount calls and their dependent assertions
- Changes to the test guard thresholds
- Changes to integration tests (already correctly using `mount`)

## Acceptance Criteria

- [ ] Architecture test enforces `shallowMount` in `src/tests/unit/` and `mount` in `src/tests/integration/`
- [ ] All 15 unit test files migrated from `mount` → `shallowMount`
- [ ] All 1361+ tests still pass
- [ ] No test guard violations at the 1000ms threshold
- [ ] 100% test coverage maintained
- [ ] All quality gates pass

## References

- Prior fix: commit `48726bb` — migrated `MiddlewarePipelineVisualizer.spec.ts` and `ComponentHealth.spec.ts` as emergency fix to unblock push
- Architecture test: `src/tests/unit/architecture.spec.ts` — existing structural enforcement
- ADR-010: Test isolation policy
- Test guard: `src/tests/unit/test-guard-reporter.ts` — 1000ms hard threshold

## Notes from the Issuer

The pattern for migration is established — the CFO already fixed two files (`MiddlewarePipelineVisualizer.spec.ts` and `ComponentHealth.spec.ts`) with the `shallowMount` + explicit unstub approach. The remaining 15 files should follow the same pattern. The tricky part is per-file: each file's assertions need review to determine which children (if any) need explicit unstubbing. `SectionHeading` is the most common one in Showcase tests.

The architecture test is the real deliverable. The migrations are cleanup. Once the rule is in `architecture.spec.ts`, no one can introduce `mount` in a unit test again without the test suite failing.

---

**Status:** Closed
**Journal:** `.claude/records/journals/2026-04-01-mount-boundary-enforcement.md`
