# Building Permit: Add Type Parameters to vi.fn() Mocks

**Permit #:** 2026-04-01-typed-mock-parameters
**Filed:** 2026-04-01
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Add explicit type parameters to all 756 untyped `vi.fn()` calls across 50 test files to satisfy the `vitest/require-mock-type-parameters` lint rule. This is a default-on rule in oxlint's vitest plugin that was previously invisible because the linter configuration was broken (5 phantom/removed rules prevented oxlint from starting).

## Scope

### In the Box

- Add type parameters to every `vi.fn()` call that lacks one (e.g., `vi.fn()` → `vi.fn<() => void>()`, `vi.fn<(id: string) => Promise<Item>>()`)
- Type parameters should match the function signature being mocked — not just `() => void` everywhere
- Where mock functions are used with `.mockResolvedValue()`, `.mockReturnValue()`, or `.mockImplementation()`, the type parameter must align with the return type
- Test helper files (`mockAxios.ts`, `mockFamilyServices.ts`) are in scope
- All 50 affected files listed below

### Not in This Set

- Production code changes — this is test-only
- Changes to the `require-mock-type-parameters` rule configuration (it stays enabled)
- Refactoring test structure or mock patterns beyond adding type parameters
- Any changes to the `.oxlintrc.json` configuration

## Acceptance Criteria

- [ ] `npm run lint` reports 0 errors and 0 warnings (no `require-mock-type-parameters` violations remain)
- [ ] `npm run test:unit` passes — all 1314+ tests green
- [ ] `npm run test:coverage` passes — 100% coverage maintained
- [ ] `npm run type-check` passes
- [ ] Type parameters are semantically correct (match the mocked function's signature), not blanket `() => void`

## References

- Related Permit: 2026-04-01-proxy-invariant-configurable-fix (same oxlint cleanup session)
- Parent work: oxlint config fix that removed 5 broken rules and exposed these warnings

## Notes from the Issuer

This is high-volume mechanical work — 756 instances across 50 files. The risk of introducing type errors is low but non-zero: if a type parameter doesn't match how the mock is actually used downstream, `vue-tsc` will catch it. The architect should batch by file and verify incrementally rather than doing a single blind pass.

The rule itself adds genuine value: typed mocks catch argument/return-type mismatches at compile time instead of at runtime. This is exactly the kind of type safety that demonstrates mastery in a portfolio piece.

**Affected files (50):**

| Category              | Count | Files                                                                     |
| --------------------- | ----- | ------------------------------------------------------------------------- |
| Test helpers          | 2     | `mockAxios.ts`, `mockFamilyServices.ts`                                   |
| Browser tests         | 3     | ConfirmDialog, ModalDialog, BarcodeScanner                                |
| Integration tests     | 7     | Parts, Sets (4), Storage (2)                                              |
| Unit tests — families | 18    | Auth (2), BrickDna, Home, Parts, Sets (7), Settings (2), Storage (4), App |
| Unit tests — admin    | 1     | App                                                                       |
| Unit tests — showcase | 1     | DialogServiceDemo                                                         |
| Unit tests — shared   | 18    | Components (7), Composables (2), Helpers (1), Services (8)                |

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-04-02-typed-mock-parameters.md`
