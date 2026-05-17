# Decision: Typed mock helpers with MockedService mapped type

**Date**: 2026-03-22
**Feature**: Test mock infrastructure — type safety and deduplication
**Status**: accepted
**Transferability**: universal

## Context

ADR-010 established per-file factory mocking as the standard. Every `vi.mock()` call lives in the test file that needs it, uses a factory function, and is explicit about what it mocks. This works. The lint rule enforces it.

What ADR-010 explicitly deferred (line 142): _"factory helpers or `__mocks__` directories"_ to address two gaps:

1. **Duplication** — 18 test files repeat the same `@app/services` mock (~20-30 lines each, 90% identical). Axios, string-ts, form components, and icon mocks are duplicated across 9-18 files. ~558 lines of copy-pasted mock code total.
2. **False safety** — handwritten factory mocks don't reference real interfaces. If `HttpService` gains a new method, the 18 files mocking it silently succeed with an incomplete mock. Tests pass, coverage is green, but the mock is wrong.

The question: how do we eliminate mock duplication while adding compile-time safety that catches drift between mocks and real interfaces?

## Options Considered

| Option                                                        | Pros                                                                                                                                                                                                                                                                               | Cons                                                                                                                                                                                                               | Why eliminated / Why chosen                                                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Do nothing — keep inline mocks**                            | No new infrastructure. Already ADR-010 compliant                                                                                                                                                                                                                                   | 558 lines of duplication. No drift detection. Every new page test copies 30 lines of boilerplate                                                                                                                   | Eliminated — duplication is growing linearly with domain count                                         |
| **`__mocks__` directories (Vitest auto-mock)**                | Zero boilerplate in test files. Built-in Vitest convention                                                                                                                                                                                                                         | Implicit — violates ADR-010's explicit-per-file principle. Global mocks with per-test overrides are awkward. `__mocks__` directories sit next to production code. Test-specific customization fights the framework | Eliminated — trades explicitness for convenience, poor override ergonomics                             |
| **Typed factory helpers with `MockedService<T>` mapped type** | Type-safe against real interfaces (catches added/removed members). Tests get typed mock access (`.mockResolvedValue()` with correct types). Each test file still owns its `vi.mock()` call. Override pattern for test-specific customization. One utility type, applied everywhere | Requires `as` cast in helper implementations (safe, controlled). Helpers must be maintained alongside interfaces                                                                                                   | **Chosen** — eliminates duplication, adds compile-time drift detection, preserves ADR-010 explicitness |
| **Code generation from interfaces**                           | Perfect accuracy, auto-generated from source                                                                                                                                                                                                                                       | Build step dependency. Generated code is opaque. Overkill for ~8 service interfaces                                                                                                                                | Eliminated — complexity far exceeds the problem size                                                   |

## Decision

### `MockedService<T>` mapped type

A single utility type that converts any service interface into its mocked equivalent:

```typescript
type MockedService<T> = {[K in keyof T]: T[K] extends (...args: infer A) => infer R ? Mock<(...args: A) => R> : T[K]};
```

Functions become `Mock<F>` (preserving parameter and return types). Non-function properties (refs, computeds) pass through unchanged. This gives test code two things simultaneously: mock API methods (`.mockResolvedValue()`, `.toHaveBeenCalledWith()`) and typed parameters/returns.

### Factory helpers in `src/tests/helpers/`

Each major mock target gets a helper file:

| File                      | What it mocks                                                                                | Typed against                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `mockTypes.ts`            | `MockedService<T>` utility type                                                              | N/A (generic)                                                                 |
| `mockAxios.ts`            | `axios` module + `MockAxiosError` class                                                      | Axios API shape                                                               |
| `mockStringTs.ts`         | `string-ts` passthrough                                                                      | string-ts API shape                                                           |
| `mockFamilyServices.ts`   | `@app/services` barrel (http, auth, router, translation, loading, storage, sound, set store) | Real service interfaces (`HttpService`, `AuthService`, `RouterService`, etc.) |
| `mockFormComponents.ts`   | `FormField`, `FormLabel`, `FormError` stubs                                                  | Component shape (name + props + template)                                     |
| `mockSharedComponents.ts` | `BadgeLabel`, `EmptyState`, `FilterChip`, and other shared component stubs                   | Component shape                                                               |

### Type safety enforcement — two constraints

**Constraint 1: Return type annotation on helpers**

```typescript
export const createMockHttpService = (overrides?: Partial<HttpService>): MockedService<HttpService> =>
    ({
        getRequest: vi.fn(),
        postRequest: vi.fn(),
        // ...
        ...overrides,
    }) as MockedService<HttpService>;
```

If `HttpService` gains `headRequest`, this fails to compile — the object literal is incomplete. If `HttpService` removes `putRequest`, the excess property is flagged. The `as` cast bridges `Mock<any>` (vi.fn() return) to `MockedService<HttpService>` — this is safe because we control the implementation and the return type annotation enforces structural completeness.

**Constraint 2: Override parameter typed as `Partial<Interface>`**

```typescript
createMockFamilyServices({familyAuthService: {login: mockLogin}});
```

The override must be structurally compatible with the real interface. You can't pass `{login: "not a function"}` — TypeScript catches it at the call site.

### Test file usage pattern

```typescript
const {mockLogin, mockGoToDashboard} = vi.hoisted(() => ({mockLogin: vi.fn(), mockGoToDashboard: vi.fn()}));

vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyAuthService: {login: mockLogin},
        familyRouterService: {goToDashboard: mockGoToDashboard},
    }),
);
```

3 lines replace 30. The `vi.mock()` call is still per-file, still explicit, still declares what it mocks. ADR-010 is preserved. The factory function is the second argument — the lint rule is satisfied.

### What this does NOT cover

- **Deep mock correctness** — if `login` changes from `(data: Credentials) => Promise<void>` to `(data: Credentials, remember: boolean) => Promise<void>`, the mock helper still compiles because `vi.fn()` is structurally compatible with any function. The real code calling `login` would break at type-check, which the pre-push gauntlet runs. This is accepted.
- **Component prop type enforcement** — Vue component stubs (`{template: "<div />", props: ["label"]}`) are not typed against real component prop interfaces. This is a Vue Test Utils limitation and not worth fighting.
- **Third-party module shape tracking** — axios and string-ts mocks are typed against their current API shape. If a major version changes exports, the mock helper must be manually updated. Accepted — major version upgrades are rare and require manual review anyway.

## Consequences

- **~558 lines of duplicated mock code eliminated** — replaced by ~150 lines of typed helpers used by all test files
- **Compile-time drift detection** — if a service interface changes, the mock helper fails to compile immediately. No more silently incomplete mocks
- **Typed mock access in tests** — `mockLogin.mockResolvedValue(...)` gets type inference on the resolved value. Incorrect test assertions surface at compile time
- **Helper maintenance cost** — when a service interface changes, the helper must be updated. This is a feature, not a bug — it forces the developer to update mocks alongside the interface
- **`as` cast in helpers** — each helper uses one `as MockedService<T>` cast. This is the only unsafe operation, and it's confined to helper implementations, not test code

## Enforcement

| What                                  | Mechanism                                        | Scope                                    |
| ------------------------------------- | ------------------------------------------------ | ---------------------------------------- |
| Helpers typed against real interfaces | TypeScript return type annotations + `satisfies` | All helper files in `src/tests/helpers/` |
| Override parameters typed             | `Partial<Interface>` constraint                  | All `createMock*` function signatures    |
| Per-file `vi.mock()` still required   | ADR-010 lint rule (unchanged)                    | All `.spec.ts` files                     |
| Factory function still required       | ADR-010 lint rule (unchanged)                    | All `vi.mock()` calls                    |
| No mocks in setup files               | ADR-010 + ADR-011 (unchanged)                    | `setup.ts`                               |

## Relationship to other ADRs

- **ADR-010** (test isolation): This ADR implements the "factory helpers" future work item from ADR-010 line 142. ADR-010's per-file explicitness and factory lint rule remain unchanged. Helpers provide the object, test files still own the `vi.mock()` call.
- **ADR-011** (domain-based projects): No interaction. Helpers are shared across all projects via relative imports from `src/tests/helpers/`.

## Open Questions

- **Icon mocks** — Phosphor icon mocks vary 100% per test file (each test uses different icons). A helper that takes icon names as parameters is possible but may not save enough boilerplate to justify. Deferred until the pattern stabilizes.
