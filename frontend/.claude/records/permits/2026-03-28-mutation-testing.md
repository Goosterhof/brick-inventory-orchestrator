# Building Permit: Add Mutation Testing with Stryker

**Permit #:** 2026-03-28-mutation-testing
**Filed:** 2026-03-28
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Add mutation testing to the project using Stryker Mutator with the Vitest runner. This validates that our 100% coverage policy produces tests that actually detect regressions, not just execute code paths. It's the audit that validates the audit.

## Scope

### In the Box

- Install and configure Stryker Mutator with `@stryker-mutator/vitest-runner`
- Create `stryker.config.json` (or `.js`) configuration targeting `src/shared/` source files
- Add `npm run test:mutation` script to `package.json`
- Configure reasonable mutation score threshold (80%+)
- Ensure Stryker runs against the existing Vitest test suite without conflicts
- Add Stryker temp files to `.gitignore` if needed
- Ensure all quality gates still pass (type-check, knip, lint, test:coverage, build)
- Commit and push to `claude/add-mutation-testing-z1cKq`

### Not in This Set

- Adding mutation testing to the pre-push gauntlet (too slow for every push)
- Achieving 100% mutation score (equivalent mutants make this impractical)
- Fixing any surviving mutants — this permit is infrastructure only
- CI/CD pipeline integration (future permit if needed)
- Mutation testing for Vue component files (start with `.ts` files only)

## Acceptance Criteria

- [ ] `npm run test:mutation` executes Stryker against `src/shared/` TypeScript source files
- [ ] Stryker configuration uses the Vitest runner
- [ ] Mutation score threshold is set to a reasonable level (80%+)
- [ ] All existing quality gates pass: type-check, knip, test:coverage, build, lint
- [ ] No new lint warnings or type errors introduced
- [ ] Stryker temp/output files are excluded from version control
- [ ] Changes committed and pushed to the designated branch

## References

- Tool: [Stryker Mutator](https://stryker-mutator.io/)
- Decision: N/A (new capability, no prior ADR)

## Notes from the Issuer

Start with `src/shared/` only — helpers, composables, errors, and services are pure logic with the highest mutation testing ROI. Vue component files should be excluded for now (mutation testing on template logic is noisy). Keep the configuration extensible so we can expand scope later.

The Stryker report output should go to a directory that's gitignored. We want the infrastructure, not the reports, in version control.

---

**Status:** Complete
**Journal:** [2026-03-28-mutation-testing](../journals/2026-03-28-mutation-testing.md)
