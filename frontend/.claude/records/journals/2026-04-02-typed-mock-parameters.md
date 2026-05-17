# Construction Journal: Add Type Parameters to vi.fn() Mocks

**Journal #:** 2026-04-02-typed-mock-parameters
**Filed:** 2026-04-02
**Permit:** `.claude/records/permits/2026-04-01-typed-mock-parameters.md`
**Architect:** Lead Brick Architect

---

## Work Summary

Modified 47 test files to add explicit type parameters to all `vi.fn()` calls, eliminating 379 `vitest/require-mock-type-parameters` lint violations.

| Action   | File                                      | Notes                                                                                           |
| -------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Modified | `src/tests/helpers/mockFamilyServices.ts` | Typed all HTTP methods with indexed access (`HttpService["getRequest"]` etc.), auth/router sigs |
| Modified | `src/tests/helpers/mockAxios.ts`          | Typed `create` mock                                                                             |
| Modified | 3 browser test files                      | BarcodeScanner, ConfirmDialog, ModalDialog                                                      |
| Modified | 7 integration test files                  | Parts, Sets (4), Storage (2)                                                                    |
| Modified | 18 families unit tests                    | Auth (2), BrickDna, Home, Parts, Sets (7), Settings (2), Storage (4), App                       |
| Modified | 1 admin unit test                         | App                                                                                             |
| Modified | 1 showcase unit test                      | DialogServiceDemo                                                                               |
| Modified | 18 shared unit tests                      | Components (7), Composables (2), Helpers (1), Services (8)                                      |

Added `LoosePartial<T>` override type to `mockFamilyServices.ts` to maintain test ergonomics when consumer files pass less-strictly-typed mocks.

## Permit Fulfillment

| Acceptance Criterion                             | Met | Notes                               |
| ------------------------------------------------ | --- | ----------------------------------- |
| `npm run lint` reports 0 errors and 0 warnings   | Yes | Was 379 violations, now 0           |
| `npm run test:unit` passes — all tests green     | Yes | All tests pass                      |
| `npm run test:coverage` passes — 100% maintained | Yes | 100% across all metrics             |
| `npm run type-check` passes                      | Yes | 0 errors                            |
| Type parameters are semantically correct         | Yes | Indexed access types, explicit sigs |

## Decisions Made

1. **Indexed access types for HttpService mocks** — Chose `vi.fn<HttpService["getRequest"]>()` over manually spelling out `(url: string, config?: AxiosRequestConfig) => Promise<AxiosResponse>`. Indexed access stays in sync with the source interface automatically — the right call for a portfolio piece.
2. **`LoosePartial<T>` override type** — Added to `mockFamilyServices.ts` to prevent a cascade where consumer test files would need to import `HttpService` just to satisfy the mapped type. Keeps the blast radius contained to the helper file.
3. **Explicit `Promise.resolve()` return** — In `useFormSubmit.spec.ts`, used explicit `Promise.resolve()` instead of `async` to avoid triggering `require-await` lint warning.

## Quality Gauntlet

| Check         | Result | Notes                                       |
| ------------- | ------ | ------------------------------------------- |
| format:check  | Pass   |                                             |
| lint          | Pass   | 0 errors, 0 warnings (was 379 violations)   |
| lint:vue      | Pass   |                                             |
| type-check    | Pass   | 0 errors                                    |
| test:coverage | Pass   | 100% lines, branches, functions, statements |
| knip          | Pass   |                                             |
| size          | Pass   |                                             |

## Showcase Readiness

Yes. Typed mocks are a genuine quality signal — they catch argument/return-type mismatches at compile time. The use of indexed access types (`HttpService["getRequest"]`) is the idiomatic TypeScript approach and demonstrates awareness of type-level programming. A senior reviewer would note the consistency: every mock carries its contract, not just a `() => void` placeholder.

## Proposed Knowledge Updates

- **Learnings:** No new learnings — this was mechanical application of existing TypeScript patterns.
- **Pulse:** `mockFamilyServices.ts` now exports `LoosePartial<T>` type; all `vi.fn()` calls are typed.
- **Domain Map:** No changes.
- **Decision Record:** Not warranted — indexed access types and `LoosePartial` are standard patterns, not architectural decisions.

## Self-Debrief

### What Went Well

- Systematic file-by-file approach kept the work clean and incremental
- Indexed access types avoided manual signature duplication — correct and maintainable
- `LoosePartial<T>` prevented a cascade that would have touched every consumer file

### What Went Poorly

- Nothing notable — the work was mechanical and the scope was well-defined

### Blind Spots

- None identified for this task

### Training Proposals

| Proposal                                                                                                                                                             | Context                                                                                                       | Shift Evidence                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| When typing shared mock helpers that use mapped types, check the mapped type definition first to understand type compatibility requirements                          | `MockedService<T>` mapped type required indexed access types, not manual signatures                           | 2026-04-02-typed-mock-parameters |
| When changing types in a shared test helper, assess override/consumer type compatibility before committing — a looser override type may be needed to prevent cascade | Adding strict types to `mockFamilyServices.ts` would have broken all consumer files without `LoosePartial<T>` | 2026-04-02-typed-mock-parameters |

---

## CFO Evaluation

**Overall Assessment:** Solid

### Permit Fulfillment Review

Full delivery. All 5 acceptance criteria met. The permit estimated 756 violations across 50 files; the architect resolved 379 violations across 47 files. The count discrepancy is likely due to the permit's rough estimate (pre-work grep vs. actual lint count) — what matters is the lint reports zero violations. No over-delivery, no scope creep.

### Decision Review

All three decisions were sound:

- **Indexed access types** — exactly right. Manual signature duplication would have been a maintenance liability. This is the kind of decision that demonstrates TypeScript fluency.
- **`LoosePartial<T>`** — pragmatic containment. Without it, every consumer test file would need to import `HttpService` for type compatibility, turning a test-helper change into a 40-file cascade. Good blast radius awareness.
- **`Promise.resolve()` over `async`** — minor but correct. Shows attention to lint consistency.

No decisions warranted escalation to the CEO.

### Showcase Assessment

Strengthens the portfolio. Typed mocks are a visible quality signal — any reviewer running the linter or reading the test helpers will see that mock contracts are enforced at compile time. The indexed access pattern in `mockFamilyServices.ts` is particularly strong: it shows the team knows how to keep mocks in sync with source interfaces without manual duplication.

### Training Proposal Dispositions

| Proposal                                                                                                                                                             | Disposition | Rationale                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When typing shared mock helpers that use mapped types, check the mapped type definition first to understand type compatibility requirements                          | Candidate   | Valid — mapped type compatibility is non-obvious and the architect correctly identified indexed access as the solution. Needs a second shift to confirm it's a pattern. |
| When changing types in a shared test helper, assess override/consumer type compatibility before committing — a looser override type may be needed to prevent cascade | Candidate   | Valid — blast radius assessment for shared helpers is a recurring concern. The `LoosePartial<T>` solution was good. Needs second confirmation.                          |

### Notes for the Architect

Clean execution on a high-volume mechanical task. The key wins were the indexed access types and the `LoosePartial<T>` containment — both show you're thinking about maintainability, not just making the linter happy. No notes for improvement on this one.
