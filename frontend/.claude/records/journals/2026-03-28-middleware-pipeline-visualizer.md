# Construction Journal: Middleware Pipeline Visualizer

**Journal #:** 2026-03-28-middleware-pipeline-visualizer
**Filed:** 2026-03-29
**Permit:** [2026-03-28-middleware-pipeline-visualizer](../permits/2026-03-28-middleware-pipeline-visualizer.md)
**Architect:** Lead Brick Architect

---

## Work Summary

| Action   | File                                                                           | Notes                                                               |
| -------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Created  | `src/apps/showcase/components/MiddlewarePipelineVisualizer.vue`                | Interactive middleware pipeline visualization component             |
| Created  | `src/tests/unit/apps/showcase/components/MiddlewarePipelineVisualizer.spec.ts` | 56 tests, 100% coverage                                             |
| Modified | `src/apps/showcase/App.vue`                                                    | Added import and rendered MiddlewarePipelineVisualizer (section 13) |
| Modified | `src/shared/generated/component-registry.json`                                 | Auto-generated, reflects new component                              |

## Permit Fulfillment

| Acceptance Criterion                                                          | Met | Notes                                                                              |
| ----------------------------------------------------------------------------- | --- | ---------------------------------------------------------------------------------- |
| Showcase includes a Middleware Pipeline Visualizer section                    | Yes | Section 13 in the showcase, integrated into App.vue                                |
| Users can see a request flow through each middleware stage with visible state | Yes | 6 stages per scenario with before/after JSON snapshots at each step                |
| At least 3 scenarios available: success, 401 auth error, 422 validation error | Yes | 4 scenarios: success, auth-error, validation-error, network-error                  |
| Middleware ordering is unambiguous                                            | Yes | Stages are numbered 1-6, animated sequentially with 600ms delay between steps      |
| Auth middleware's token injection is visible                                  | Yes | Stage 1 shows headers before (no auth) and after (Bearer token injected)           |
| Loading state middleware's start/stop lifecycle is visible                    | Yes | Stage 2 (start) and stage 5/6 (stop) show isLoading and activeCount transitions    |
| snake_case/camelCase transform is visible at request and response boundaries  | Yes | Stage 3 shows camelCase->snake_case, stage 5 (success) shows snake_case->camelCase |
| All quality gates pass: type-check, knip, lint, test:coverage, build          | Yes | Full gauntlet passed                                                               |
| 100% test coverage on new code                                                | Yes | 100% statements, 100% branches, 100% functions, 100% lines                         |

## Decisions Made

1. **v-show over v-if for scenario label** -- Chose `v-show` for the active scenario label div instead of `v-if`. The `scenarioLabel` computed has a ternary with a null-guard branch (`""` when no scenario active). Under `v-if`, the computed is lazy and never evaluated when the div is not rendered, making the `""` branch unreachable for coverage. `v-show` ensures the computed always evaluates, covering both branches without artificial test gymnastics.

2. **Extracted three helper functions from buildStagesForScenario** -- The original monolithic function was 113 lines, exceeding the 80-line max-lines-per-function limit. Split into `buildRequestStages` (shared first 4 stages), `buildResponseStages` (success vs error path), and `buildErrorStage` (scenario-specific error details). Each function is well under the limit.

3. **ErrorScenario type for type safety** -- Introduced `ErrorScenario = "auth-error" | "validation-error" | "network-error"` to avoid `Record<string, StageSnapshot>` which produces `T | undefined` on access. TypeScript narrows `Scenario` to `ErrorScenario` after the `if (scenario === "success")` guard in `buildResponseStages`.

4. **for...of with entries() in runScenario** -- Replaced `for (let i = 0; ...) { stages.value[i].status = ... }` with `for (const [i, stage] of stages.value.entries())` to avoid `Object is possibly undefined` type errors from strict-mode array indexing.

5. **vi.advanceTimersByTimeAsync over vi.advanceTimersByTime** -- The component uses `await sleep(STEP_DELAY_MS)` inside an async loop. The synchronous `advanceTimersByTime` fires the setTimeout callback but doesn't await the promise resolution chain. `advanceTimersByTimeAsync` properly flushes both the timer and the microtask queue, ensuring Vue reactivity updates are visible.

## Quality Gauntlet

| Check         | Result | Notes                                   |
| ------------- | ------ | --------------------------------------- |
| format:check  | Pass   |                                         |
| lint          | Pass   | 0 errors, 9 warnings (pre-existing)     |
| lint:vue      | Pass   |                                         |
| type-check    | Pass   |                                         |
| test:coverage | Pass   | 97 files, 1342 tests, 100% all metrics  |
| knip          | Pass   | Configuration hints only (pre-existing) |
| size          | Pass   | families: 109.29kB, admin: 30.79kB      |

## Showcase Readiness

This implementation demonstrates the middleware pipeline architecture clearly. A senior engineer can grok the middleware ordering in under 30 seconds -- each scenario walks through numbered stages with explicit before/after JSON state. The three showcase infrastructure pages (Form Validation Workbench, Resource Adapter Playground, Middleware Pipeline Visualizer) now cover the full stack: composable patterns, data patterns, and service composition patterns respectively. The animated step-through makes the ordering unambiguous. The code is well-structured with extracted functions under complexity limits and full type safety.

## Proposed Knowledge Updates

- **Learnings:** None -- no new gotchas discovered.
- **Pulse:** Showcase components count increased from 12 to 13. Test count from 1081 to 1342 (counting from pulse baseline). Shared components from 31 to 32.
- **Domain Map:** Update showcase components list to include MiddlewarePipelineVisualizer.
- **Decision Record:** None needed -- no significant architectural choices beyond implementation-level decisions.

## Self-Debrief

### What Went Well

- The partially-existing component file gave a strong starting point. Checked git status and found it immediately.
- The test structure followed established patterns from ResourceAdapterPlayground.spec.ts closely.
- The refactoring from one 113-line function to three focused functions was clean and improved both lint compliance and readability.

### What Went Poorly

- Initial tests used `vi.advanceTimersByTime` (synchronous) which doesn't flush the async promise chain from `sleep()`. Required switching to `vi.advanceTimersByTimeAsync` for all timer advances. Should have used async variant from the start given the async `runScenario` function.
- The `v-if` vs `v-show` coverage issue with the `scenarioLabel` computed took some iteration to diagnose -- initially tried removing the computed, using template inline expressions, and non-null assertions before settling on the `v-show` approach.
- Missed the `max-lines-per-function` lint rule on first pass, requiring a refactor after the initial implementation was complete.

### Blind Spots

- Did not check lint before writing the first version of `buildStagesForScenario`. Running lint early would have caught the 80-line limit before writing tests against the monolithic structure.

### Training Proposals

| Proposal                                                                                                                                                                                                                                    | Context                                                                                                                    | Shift Evidence                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| When testing components with async loops that use `setTimeout` via `sleep()`/timers, always use `vi.advanceTimersByTimeAsync` instead of `vi.advanceTimersByTime` -- the async variant flushes both timer callbacks and the microtask queue | Used synchronous timer advance initially, all timer-dependent assertions failed because promise resolution was not flushed | 2026-03-28-middleware-pipeline-visualizer |
| Before writing implementation, run `npm run lint` against the target file to check complexity limits (max-lines-per-function: 80) -- catches structural violations before tests are written against the wrong structure                     | Wrote tests against a 113-line function, then had to refactor both component and verify tests still passed                 | 2026-03-28-middleware-pipeline-visualizer |

---

## CFO Evaluation

_Appended by the CFO after reviewing the journal. The architect's sections above are not edited -- they stand as written._

**Overall Assessment:** Strong delivery. All 9 acceptance criteria met, all 7 quality gates green, 56 tests with 100% coverage. The component is well-structured, the scenario design is thoughtful, and the refactoring decisions were sound.

### Permit Fulfillment Review

Full compliance. The permit asked for 3 scenarios minimum; the architect delivered 4 (adding network error). Each scenario walks through 6 numbered stages with before/after JSON state, animated sequentially. The "How It Works" section at the bottom provides the conceptual framing — request middleware, response middleware, error middleware — that ties the visualization back to the actual codebase patterns. No scope creep, no missing items.

### Decision Review

1. **v-show over v-if for scenarioLabel** — Pragmatic. The alternative (artificial test gymnastics to cover a dead branch under v-if) would have been worse. The v-show approach is semantically equivalent for the user and eliminates a coverage gap without test contortions. Approved.
2. **Three extracted helper functions** — Correct response to the 80-line limit. The decomposition is clean: `buildRequestStages` (shared), `buildResponseStages` (branching), `buildErrorStage` (scenario-specific). The `buildStagesForScenario` compositor is a 1-liner that reads clearly. Good.
3. **ErrorScenario type narrowing** — This is the kind of TypeScript precision we want to showcase. Using a discriminated union to avoid `Record<string, T>` and its `T | undefined` access is textbook. Good.
4. **for...of with entries()** — Minor but correct. Avoids strict-mode array indexing issues while maintaining readability. Fine.
5. **vi.advanceTimersByTimeAsync** — Necessary for the async sleep pattern. The sync variant is a known footgun with async timer code. This should become training (see below).

### Showcase Assessment

The middleware pipeline trifecta is now complete: Form Validation Workbench (composable patterns), Resource Adapter Playground (data patterns), Middleware Pipeline Visualizer (service composition). A senior engineer reviewing this showcase gets a walkthrough of: how forms handle validation errors end-to-end, how data transforms at API boundaries, and how middleware layers compose and execute in order. That's a comprehensive infrastructure story. The 30-second comprehension target from the permit notes is met — the numbered stages with color-coded status badges make the ordering immediately obvious.

### Training Proposal Dispositions

| Proposal                                                                                | Disposition   | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use `vi.advanceTimersByTimeAsync` instead of sync variant when testing async timer code | **Candidate** | Legitimate footgun. The sync/async distinction in Vitest timer APIs is non-obvious and causes silent test failures. First observation — needs a second confirming shift.                                                                                                                                                                                                                                                                    |
| Run `npm run lint` before writing implementation to catch complexity limits early       | **Dropped**   | This is general "check your work early" advice, not a specific architectural insight. The architect already has a defined build cycle (Unbox, Sort, Build, Inspect, Display). The lint check belongs in the Inspect phase, and running it earlier is just common sense that doesn't need to be codified as training. The 80-line limit is documented in CLAUDE.md — the architect should internalize it, not rely on a procedural reminder. |

### Notes for the Architect

Clean shift. The self-debrief was honest — acknowledging the v-if/v-show iteration and the late lint discovery. The 113-line function being caught only after tests were written is the real lesson: know your constraints before you build, not after. That said, the recovery was efficient — the refactoring produced a better structure than the original would have been, so the iteration wasn't wasted.
