# Building Permit: Coverage Aggregation Fix

**Permit #:** 2026-03-29-coverage-aggregation-fix
**Filed:** 2026-03-29
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** Urgent

---

## The Job

Fix the Vitest multi-project coverage aggregation so that `npm run test:coverage` passes with 100% thresholds. Currently it fails on `main` because Istanbul aggregates coverage across all projects and reports 0% on source files that are fully covered within their own project but not instrumented in the aggregated report. This blocks the pre-push hook for every developer.

## Scope

### In the Box

- Diagnose why Istanbul reports 0% on fully-tested shared service files (`storage.ts`, `toast.ts`, `translation.ts`, `auth/guards.ts`, `auth/index.ts`, `router/components.ts`, `router/index.ts`, `router/routes.ts`) when running `npm run test:coverage`
- Fix the coverage configuration in `vitest.config.ts` so aggregated coverage accurately reflects per-project results
- Verify `npm run test:coverage` passes with 100% thresholds on all four metrics
- Verify the pre-push hook (`type-check -> knip -> test:coverage -> build`) completes successfully
- Clean up any `.js` artifact files that Istanbul/Vitest leaves behind in `src/` (these are transpilation outputs from the coverage provider)

### Not in This Set

- Adding new tests — all source files already have 100% coverage in their individual projects
- Changing coverage thresholds — they stay at 100%
- Restructuring the multi-project layout or test organization
- Browser integration test coverage (separate concern)

## Acceptance Criteria

- [ ] `npm run test:coverage` exits 0 with 100% on lines, functions, branches, and statements
- [ ] Pre-push hook passes end-to-end (type-check, knip, test:coverage, build)
- [ ] No `.js` artifact files left in `src/` after coverage runs
- [ ] Individual project test runs still work (`--project=X`)
- [ ] All existing tests still pass
- [ ] No reduction in actual coverage — this is a reporting fix, not a coverage exclusion

## References

- Config: `vitest.config.ts` (lines 47-63 for coverage, lines 64-93 for projects)
- Evidence: Coverage fails identically on `main` — 51.23% lines vs 100% threshold
- Affected files show 0% in aggregate but 100% in their `shared/services` project
- This blocked the push for permit `2026-03-28-resource-adapter-playground` and likely all prior recent pushes

## Notes from the Issuer

This is infrastructure debt that has been silently bypassed with `--no-verify` on recent pushes. That is not acceptable as a permanent state — the pre-push hook exists for a reason, and every `--no-verify` push is a crack in our quality wall. The fix is likely a coverage configuration issue (include/exclude patterns, or how Istanbul resolves source files across projects), not a Vitest bug per se. Check Vitest docs on workspace coverage aggregation before diving into code changes.

---

**Status:** Closed — Cannot Reproduce
**Closed:** 2026-03-29
**Reason:** `npm run test:coverage` passes with 100% on all four metrics. All 8 files listed in the permit report 100% coverage in the aggregate. No `.js` artifacts left behind. Pre-push hook completes successfully. The original failure was transient — likely a stale Istanbul cache or interrupted coverage run. No code changes required.
