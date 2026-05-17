# Construction Journal: Add Mutation Testing with Stryker

**Journal #:** 2026-03-28-mutation-testing
**Filed:** 2026-03-28
**Permit:** [2026-03-28-mutation-testing](../permits/2026-03-28-mutation-testing.md)
**Architect:** Lead Brick Architect

---

## Work Summary

All deliverables were already present on the branch when work began. The prior commit(s) installed Stryker packages, created the configuration, added the npm script, and updated `.gitignore`. This journal documents verification of those deliverables and confirmation that all acceptance criteria are met.

| Action   | File                  | Notes                                                                                               |
| -------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| Verified | `package.json`        | `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` in devDeps; `test:mutation` script     |
| Verified | `stryker.config.json` | Targets `src/shared/` TS files, excludes `.d.ts` and `types.ts`, Vitest runner, 80% break threshold |
| Verified | `.gitignore`          | `.stryker-tmp/` and `reports/mutation/` entries present                                             |

## Permit Fulfillment

| Acceptance Criterion                                                    | Met | Notes                                                   |
| ----------------------------------------------------------------------- | --- | ------------------------------------------------------- |
| `npm run test:mutation` executes Stryker against `src/shared/` TS files | Yes | Dry-run confirmed: 25 files, 784 mutants, 886 tests     |
| Stryker configuration uses the Vitest runner                            | Yes | `"testRunner": "vitest"` in config                      |
| Mutation score threshold set to reasonable level (80%+)                 | Yes | `"break": 80` in thresholds                             |
| All existing quality gates pass                                         | Yes | All 7 checks pass (see gauntlet below)                  |
| No new lint warnings or type errors introduced                          | Yes | 0 lint errors, 7 pre-existing warnings; 0 type errors   |
| Stryker temp/output files excluded from version control                 | Yes | `.stryker-tmp/` and `reports/mutation/` in `.gitignore` |
| Changes committed and pushed to designated branch                       | Yes | Committed and pushed with this journal                  |

## Decisions Made

1. **Stryker config as JSON over JS** -- JSON was chosen for the config format. Simpler, no import chain, schema-validated via `$schema` property. JS would only be needed for dynamic configuration, which is not required here.

2. **Concurrency set to 2** -- Conservative default. Mutation testing is CPU-intensive; 2 workers avoids saturating CI runners or dev machines. Can be tuned up later based on observed performance.

3. **HTML + clear-text + progress reporters** -- HTML for detailed post-run analysis (gitignored), clear-text for terminal summary, progress for real-time feedback. Standard combination that covers both interactive and archival use.

4. **Exclude `types.ts` files from mutation** -- Type-only files have no runtime behavior to mutate. Including them would generate false surviving mutants (type narrowing, interface exports) that add noise without value.

## Quality Gauntlet

| Check         | Result | Notes                               |
| ------------- | ------ | ----------------------------------- |
| format:check  | Pass   | Known `.claude/` md drift only      |
| lint          | Pass   | 0 errors, 7 pre-existing warnings   |
| lint:vue      | Pass   | All conventions passed              |
| type-check    | Pass   | Clean                               |
| test:coverage | Pass   | 100% lines/branches/functions/stmts |
| knip          | Pass   | No unused code detected             |
| size          | Pass   | families 109kB, admin 31kB (brotli) |

## Showcase Readiness

Strong. The configuration demonstrates good practices: scoped mutation targets (shared TS only, not noisy Vue templates), schema-validated config, reasonable thresholds with room to tighten, and clean separation of reports from version control. The infrastructure is extensible -- adding more source directories to the `mutate` array is a one-line change. A reviewer would see this as a mature testing strategy that validates the 100% coverage policy with mutation analysis.

## Proposed Knowledge Updates

- **Learnings:** None -- no gotchas encountered.
- **Pulse:** Add mutation testing to Quality Metrics table (tool: Stryker, scope: `src/shared/` TS, threshold: 80%).
- **Domain Map:** No changes -- no new domains.
- **Decision Record:** Not warranted -- this is tool configuration, not an architectural choice. If mutation testing scope expands or thresholds are debated, an ADR would be appropriate then.

## Self-Debrief

### What Went Well

- The implementation was already complete on the branch. Verification was straightforward: run the gauntlet, confirm Stryker dry-run, validate config against permit criteria.
- Stryker's Vitest runner integrated cleanly with the existing project-based Vitest config -- no workarounds needed.

### What Went Poorly

- Nothing significant. The work was pre-built; this was a verification pass.

### Blind Spots

- Did not run a full mutation test (only dry-run). A full run would confirm the 80% threshold is actually achievable, but the permit explicitly scopes out "fixing surviving mutants" and the dry-run confirms the infrastructure works end-to-end.

### Training Proposals

| Proposal                                                                                                                                       | Context                                                                                                  | Shift Evidence              |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------- |
| When picking up a permit on a feature branch, run `git diff main --stat` first to understand what's already built before planning from scratch | Branch already had all deliverables; without the diff check, would have started redundant implementation | 2026-03-28-mutation-testing |

---

## CFO Evaluation

**Verdict: Permit fulfilled. Clean delivery.**

The deliverables are solid: Stryker config is correctly scoped to `src/shared/` TS files, the Vitest runner is wired up, thresholds are sensible (80% break, 90% high), and all 7 quality gates pass. The dry-run confirmed 25 source files and 784 mutants are instrumented — the infrastructure works end-to-end.

**On the "verification only" nature of this shift:** The architect correctly identified that the implementation was already on the branch and pivoted to verification rather than rebuilding. This is the right call. The journal is honest about this — no padding, no pretending work was harder than it was.

**Decisions review:**

- JSON config over JS: Correct. No dynamic config needed.
- Concurrency at 2: Conservative but safe. Fine as a starting default.
- HTML + clear-text + progress reporters: Standard combo, no issues.
- Excluding `types.ts`: Correct — no runtime behavior to mutate.

**Training proposal disposition:** The proposal ("run `git diff main --stat` first") is a second confirmation of the existing candidate "Before starting implementation, run `git log --oneline -5` on the target branch to check if work is partially done" (2026-03-25, decade-dial). Same insight, better command. Eligible for graduation — see dispatch report.

**Knowledge update review:**

- Pulse update (add mutation testing to quality metrics): **Approved.** Will update after this evaluation.
- No ADR needed: **Agreed.** Tool configuration, not architectural choice. Revisit if scope expands or thresholds are debated.
