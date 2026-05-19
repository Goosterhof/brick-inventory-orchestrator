# Building Permit: Inspection Cleanup — Post-Delivery Audit Findings

**Permit #:** 2026-03-29-inspection-cleanup
**Filed:** 2026-03-29
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Fix the 4 medium findings and 2 low findings from the 2026-03-29 post-delivery audit that aren't covered by the Pulse refresh permit. These are code and configuration fixes, not documentation.

## Scope

### In the Box

**Medium — Code fixes:**

1. **Vue Router `next()` deprecation** — Rewrite `src/shared/services/router/index.ts` lines 31–38 to use the return-value pattern instead of the three-argument `(to, from, next)` callback. Remove `next` parameter entirely. Target: zero Vue Router deprecation warnings in test output.

2. **ADR-004 drift in `useValidationErrors.ts`** — Change `import {deepCamelKeys} from "string-ts"` (line 5) to import from `@shared/helpers/string`. Add `deepCamelKeys` re-export to the string helper if not already present. Every case conversion import should go through our wrapper.

3. **SettingsPage.spec.ts collect guard breach** — Split the spec file (~960 lines, 48 tests) into two files by natural grouping. Suggested split: member-related tests vs configuration tests. Both files must stay under the 1000ms collect guard threshold.

4. **ADR-013 architecture test enforcement** — Extend `src/tests/unit/architecture.spec.ts` to verify every `.vue` file under `src/apps/*/domains/*/pages/` has a corresponding integration test spec file. Follow the existing architecture test patterns.

**Low — Config cleanup:**

5. **Missing `brick-dna` integration test** — Create `src/tests/integration/apps/families/domains/brick-dna/pages/BrickDnaPage.spec.ts` following the pattern of the other 16 integration test files. (Must exist before Finding 4's architecture test enforcement will pass.)

6. **Knip config cleanup** — Remove `@stryker-mutator/core` from `ignoreDependencies` and `stryker` from `ignoreBinaries` in `knip.json`. Verify knip still passes.

### Not in This Set

- Pulse refresh and domain map updates (separate permit: `2026-03-29-pulse-refresh`)
- ComponentGallery.spec.ts collect guard (pre-existing, not from this delivery batch)
- component-registry.json format issue (pre-existing, auto-generated)
- New features or refactoring beyond what the findings require

## Acceptance Criteria

- [ ] Zero Vue Router deprecation warnings in `npm run test:unit` output
- [ ] `useValidationErrors.ts` imports case conversion from `@shared/helpers/string`, not `string-ts` directly
- [ ] `SettingsPage.spec.ts` is split into two files, both under 1000ms collect guard threshold
- [ ] Architecture test verifies every domain page has a corresponding integration test
- [ ] `BrickDnaPage` has an integration test following the established pattern
- [ ] `knip.json` has no stale Stryker overrides; `npm run knip` passes clean (0 hints)
- [ ] 100% test coverage maintained on all metrics
- [ ] All quality gates pass (type-check, knip, test:coverage, build, lint, format:check)

## References

- Inspection: `.claude/records/inspections/2026-03-29-post-delivery-audit.md` (Findings 1–4, 7–8)
- ADR-004: `.claude/docs/decisions.md` (case conversion wrappers)
- ADR-010: `.claude/docs/decisions.md` (collect duration guard)
- ADR-013: `.claude/docs/decisions.md` (page integration tests)
- Router service: `src/shared/services/router/index.ts`
- Validation composable: `src/shared/composables/useValidationErrors.ts`
- Architecture test: `src/tests/unit/architecture.spec.ts`

## Notes from the Issuer

Order of operations matters here. Finding 5 (brick-dna integration test) must be created before Finding 4 (architecture test enforcement) or the new test will immediately fail. Suggested execution order: 6 → 2 → 1 → 5 → 3 → 4.

The Vue Router fix (Finding 1) should be straightforward but verify the middleware return semantics carefully — the current pattern returns `true` to signal "middleware handled navigation" and `false` for "proceed normally". The new return-value guard has inverted semantics from `next()`: returning `false` cancels navigation, returning nothing allows it. Make sure the middleware adapter logic is correct.

---

**Status:** Complete
**Journal:** _link to construction journal when filed_
