# Construction Journal: Form Validation Workbench

**Journal #:** 2026-03-28-form-validation-workbench
**Filed:** 2026-03-28
**Permit:** `.claude/records/permits/2026-03-28-form-validation-workbench.md`
**Architect:** Lead Brick Architect

---

## Work Summary

| Action   | File                                                                      | Notes                                                                        |
| -------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Created  | `src/apps/showcase/components/FormValidationWorkbench.vue`                | New showcase section 11 demonstrating form composables end-to-end            |
| Modified | `src/apps/showcase/App.vue`                                               | Already had import and usage (pre-existing on branch); no additional changes |
| Created  | `src/tests/unit/apps/showcase/components/FormValidationWorkbench.spec.ts` | 20 tests, 100% coverage                                                      |

## Permit Fulfillment

| Acceptance Criterion                                                  | Met | Notes                                                                                           |
| --------------------------------------------------------------------- | --- | ----------------------------------------------------------------------------------------------- |
| Showcase includes a Form Validation Workbench section                 | Yes | Section 11, id `form-validation-workbench`                                                      |
| Every shared input type is represented in the demo form               | Yes | TextInput (x2), NumberInput, SelectInput, DateInput, TextareaInput                              |
| Users can trigger a simulated 422 response and see field-level errors | Yes | "Submit (422 Errors)" button triggers middleware with all 6 field errors, snake_case->camelCase |
| Users can see errors clear as they interact with fields               | Yes | Watch on all 6 form refs clears errors and server error on any field change                     |
| Submit lifecycle is visible (idle -> submitting -> success/error)     | Yes | Submitting state shows "Submitting..." on button, success/error messages appear                 |
| An inspector panel shows the raw validation error state in real-time  | Yes | Dark-themed panel with live JSON of `errors.value`                                              |
| All quality gates pass: type-check, knip, lint, test:coverage, build  | Yes | Full gauntlet passed                                                                            |
| 100% test coverage on new code                                        | Yes | 100% statements, branches, functions, lines                                                     |

## Decisions Made

1. **Mock HttpService via type assertion instead of full interface stub** -- Chose `{registerResponseErrorMiddleware: ...} as unknown as HttpService` over implementing all 8 HttpService methods as stubs. The stubs would be dead code that Istanbul instruments and demands coverage for, but are never called by the composables. The type assertion eliminates uncoverable code without using forbidden `istanbul ignore` comments. Tradeoff: loses type safety on unused methods, but this is a showcase component with no real HTTP traffic.

2. **Non-nullable `let` for captured middleware instead of `Ref<T | null>`** -- The middleware is guaranteed to be set synchronously during `useValidationErrors` initialization (before any user interaction). A nullable ref required a guard (`if (capturedMiddleware.value)`) whose false branch was unreachable in practice, creating an uncoverable branch. Using a plain `let` with definite assignment reflects the actual invariant.

3. **Empty unregister callback** -- The original implementation set `capturedMiddleware` to null on unregister. Since `capturedMiddleware` is now a non-reactive `let`, and the unregister only fires on unmount (after which no further interaction occurs), the cleanup is a no-op. This eliminates the dead branch without losing any runtime safety.

## Quality Gauntlet

| Check         | Result | Notes                                |
| ------------- | ------ | ------------------------------------ |
| format:check  | Pass   |                                      |
| lint          | Pass   | 0 errors (8 pre-existing warnings)   |
| lint:vue      | Pass   |                                      |
| type-check    | Pass   |                                      |
| test:coverage | Pass   | 100% across all metrics              |
| knip          | Pass   | 0 violations                         |
| size          | Pass   | families: 109.29 kB, admin: 30.79 kB |

## Showcase Readiness

Strong. The workbench demonstrates three distinct form submission scenarios (success, validation error, server error) using the real `useFormSubmit` and `useValidationErrors` composables with a minimal mock HttpService. The inspector panel provides live visibility into the validation error state, making composable behavior transparent. The form uses realistic LEGO set fields rather than abstract placeholders. The "How It Works" section includes a code snippet showing the composable API. A senior architect reviewing this would see that the form infrastructure is production-grade and well-tested.

## Proposed Knowledge Updates

- **Learnings:** None -- no new gotchas discovered.
- **Pulse:** Update showcase component count from 12 to 13. Update test count and test file count. Note Form Validation Workbench as complete.
- **Domain Map:** No changes -- showcase is not a domain.
- **Decision Record:** Not warranted -- the mock HttpService approach is component-local, not architectural.

## Self-Debrief

### What Went Well

- Checked branch status first (graduated training) -- discovered the component file already existed on the branch with a solid implementation, avoiding duplicate work.
- Coverage gap analysis was systematic: used JSON coverage output to identify exact uncovered lines/functions/branches, then addressed each category methodically.
- The mock HttpService restructuring (type assertion + non-nullable let) was a clean solution that eliminated 3 separate coverage gaps simultaneously.

### What Went Poorly

- First pass at the mock HttpService had 8 stub methods that created 8 uncovered functions. Should have recognized upfront that interface stubs for unused methods are a coverage liability in components.
- The `await` on `$emit()` calls caused 8 lint errors -- `$emit` returns void, not a Promise. Should have known this from existing test patterns.

### Blind Spots

- Did not check whether the formatter would reformat the template (it moved some multi-line attributes around). This was harmless but could have affected coverage line calculations if I had been relying on specific line numbers.

### Training Proposals

| Proposal                                                                                                                                                                                                     | Context                                                                                                                | Shift Evidence                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| When mocking a service interface for a showcase/demo component, only implement the methods actually called -- use `as unknown as T` to skip unused interface methods that would create uncoverable dead code | FormValidationWorkbench initially had 8 stub methods creating 8 uncovered functions; reduced to 1 actually-used method | 2026-03-28-form-validation-workbench |

---

## CFO Evaluation

_Appended by the CFO after reviewing the journal. The architect's sections above are not edited -- they stand as written._

**Overall Assessment:** Strong delivery. Clean permit fulfillment, all 8 acceptance criteria met, all quality gates green on independent verification. The mock HttpService approach was the right call — the architect identified the coverage trap early (after one failed attempt) and solved it cleanly.

### Permit Fulfillment Review

All 8 acceptance criteria verified. The form uses realistic LEGO set fields as specified in the permit notes ("not abstract field1/field2 nonsense"). All 5 input types represented. The inspector panel provides genuine composable transparency. The three submit scenarios cover the full error taxonomy (success, validation, server). No scope creep — the architect didn't add extra features beyond what the permit specified.

### Decision Review

1. **Mock HttpService via type assertion** — Correct. The alternative (8 dead stub methods) would have created untestable code or required forbidden istanbul-ignore comments. The `as unknown as HttpService` is ugly but honest — it says "I'm only using one method" rather than pretending to implement the full interface. Approved.

2. **Non-nullable `let` for captured middleware** — Correct. The middleware registration is synchronous and guaranteed during composable init. A nullable ref would have created an unreachable guard branch. The `let` accurately models the invariant. Approved.

3. **Empty unregister callback** — Acceptable. The `() => {}` no-op is mildly wasteful but harmless. The alternative (capturing and nullifying `capturedMiddleware`) would reintroduce the coverage gap the previous decision solved. Approved.

### Showcase Assessment

The workbench tells the form composable story effectively. A senior reviewer would understand within 30 seconds: (1) what the composables do, (2) how 422 errors flow from backend to field-level display, (3) the snake_case-to-camelCase conversion, and (4) the submit lifecycle. The dark inspector panel against the light form is a good visual contrast. The "How It Works" code snippet at the bottom closes the loop. This is a strong portfolio piece for the composable layer.

### Training Proposal Dispositions

| Proposal                                                                                                                                                                                                    | Disposition | Rationale                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When mocking a service interface for a showcase/demo component, only implement the methods actually called — use `as unknown as T` to skip unused interface methods that would create uncoverable dead code | Candidate   | Valid observation specific to showcase/demo contexts where full interface mocks are coverage liabilities. First shift. Needs a second confirming observation before graduation. |

### Notes for the Architect

Solid work. The self-debrief is honest — acknowledging the initial 8-stub mistake and the `$emit` lint errors shows good self-awareness. The fix was clean and the final product is tight. No notes for improvement on this delivery.
