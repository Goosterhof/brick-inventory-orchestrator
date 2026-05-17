# Construction Journal: fs-helpers & fs-adapter-store Migration

**Journal #:** 2026-04-01-fs-helpers-adapter-store-migration
**Filed:** 2026-04-01
**Permit:** [2026-04-01-fs-helpers-adapter-store-migration](../permits/2026-04-01-fs-helpers-adapter-store-migration.md)
**Architect:** Lead Brick Architect

---

## Work Summary

Replaced 5 local source files and 5 test files with `@script-development/fs-helpers` and `@script-development/fs-adapter-store` packages. Updated all consumers across domain stores, page components, integration tests, and unit tests.

| Action   | File                                                         | Notes                                                                                                   |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Deleted  | `src/shared/helpers/copy.ts`                                 | Replaced by `deepCopy`/`Writable` from `@script-development/fs-helpers`                                 |
| Deleted  | `src/shared/services/adapter-store.ts`                       | Replaced by `createAdapterStoreModule`/`AdapterStoreModule` from `@script-development/fs-adapter-store` |
| Deleted  | `src/shared/services/resource-adapter.ts`                    | Replaced by `resourceAdapter`/`Adapted`/`NewAdapted` from `@script-development/fs-adapter-store`        |
| Deleted  | `src/shared/errors/entry-not-found.ts`                       | Replaced by `EntryNotFoundError` from `@script-development/fs-adapter-store`                            |
| Deleted  | `src/shared/errors/missing-response-data.ts`                 | Replaced by `MissingResponseDataError` from `@script-development/fs-adapter-store`                      |
| Deleted  | `src/tests/unit/shared/helpers/copy.spec.ts`                 | 248 lines — package owns coverage                                                                       |
| Deleted  | `src/tests/unit/shared/services/adapter-store.spec.ts`       | 929 lines — package owns coverage                                                                       |
| Deleted  | `src/tests/unit/shared/services/resource-adapter.spec.ts`    | 812 lines — package owns coverage                                                                       |
| Deleted  | `src/tests/unit/shared/errors/entry-not-found.spec.ts`       | 32 lines — package owns coverage                                                                        |
| Deleted  | `src/tests/unit/shared/errors/missing-response-data.spec.ts` | 31 lines — package owns coverage                                                                        |
| Modified | `src/shared/helpers/string.ts`                               | Re-exports `deepCamelKeys`, `deepSnakeKeys`, `toCamelCaseTyped` from `@script-development/fs-helpers`   |
| Modified | `src/shared/helpers/type-check.ts`                           | Removed `isExisting` (unused after migration), kept `ensureRefValueExists`                              |
| Modified | `src/apps/families/stores/familySetStore.ts`                 | Imports from `@script-development/fs-adapter-store`                                                     |
| Modified | `src/apps/families/stores/storageOptionStore.ts`             | Imports from `@script-development/fs-adapter-store`                                                     |
| Modified | `src/apps/families/services/dialog.ts`                       | `EntryNotFoundError` from package                                                                       |
| Modified | `src/apps/showcase/components/ResourceAdapterPlayground.vue` | Imports from package                                                                                    |
| Modified | 5 page `.vue` files                                          | `Adapted` type import path updates                                                                      |
| Modified | `src/tests/helpers/mockStringTs.ts`                          | Added `createMockFsHelpers` for bundled package mocking                                                 |
| Modified | 21 test files                                                | Added `createMockFsHelpers` mock for `@script-development/fs-helpers`                                   |
| Modified | 2 integration test files                                     | Updated stale `toCamelCaseTyped` comment references                                                     |
| Modified | `src/tests/unit/shared/helpers/type-check.spec.ts`           | Removed `isExisting` tests                                                                              |
| Modified | `src/tests/unit/architecture.spec.ts`                        | Updated architecture assertions                                                                         |

**Total: 54 files changed, +138/-2,602 lines**

## Permit Fulfillment

| Acceptance Criterion                                                                       | Met | Notes                                                                                                                                |
| ------------------------------------------------------------------------------------------ | --- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `@script-development/fs-helpers` and `@script-development/fs-adapter-store` installed      | Yes | Both in `package.json` dependencies                                                                                                  |
| `shared/helpers/copy.ts` deleted                                                           | Yes | All imports switched to package                                                                                                      |
| `isExisting` imports from `@script-development/fs-helpers`                                 | N/A | `isExisting` was unused — removed entirely. knip confirms no dead code.                                                              |
| `shared/services/adapter-store.ts` deleted                                                 | Yes | All imports from package                                                                                                             |
| `shared/services/resource-adapter.ts` deleted                                              | Yes | All imports from package                                                                                                             |
| BIO's `New<T>` passed as `N` generic parameter                                             | N/A | Domain types (`FamilySet`, `StorageOption`) lack `createdAt`/`updatedAt` — package default `Omit<T, "id">` is functionally identical |
| All domain stores function identically                                                     | Yes | No behavioral change                                                                                                                 |
| Integration tests still pass                                                               | Yes | Mock-server pattern unaffected                                                                                                       |
| `toCamelCaseTyped`, `deepCamelKeys`, `deepSnakeKeys` from `@script-development/fs-helpers` | Yes | Re-exported via `shared/helpers/string.ts`                                                                                           |
| knip reports no dead code                                                                  | Yes | Clean                                                                                                                                |
| Full quality gauntlet passes                                                               | Yes | All 7 checks green                                                                                                                   |

## Decisions Made

1. **Did not wire `New<T>` as generic `N` parameter** — `FamilySet` and `StorageOption` only have `id` as a system field. They lack `createdAt`/`updatedAt`, so `Omit<T, "id">` (package default) produces the same result as BIO's `New<T>` = `Omit<T, "id" | "createdAt" | "updatedAt">`. Threading `New<T>` would add complexity for zero behavioral difference. If a domain type later gains timestamp fields, the generic should be revisited.

2. **Created `createMockFsHelpers` test helper** — The bundled `@script-development/fs-helpers` package resolves its `string-ts` dependency at build time, so `vi.mock("string-ts")` alone doesn't intercept case conversion when imported via the package. Added a dedicated mock factory that unit tests use to mock `@script-development/fs-helpers` directly. Applied to all 21 affected test files.

3. **Removed `isExisting` entirely instead of migrating to package** — No consumers remained after the adapter-store deletion. knip confirmed it was dead code. Clean deletion over pointless migration.

4. **Kept re-export in `shared/helpers/string.ts`** — Rather than having every consumer import directly from `@script-development/fs-helpers`, the string helpers file re-exports `toCamelCaseTyped`, `deepCamelKeys`, `deepSnakeKeys`. This maintains the existing import convention (`@shared/helpers/string`) and keeps the package dependency honest at one location.

## Quality Gauntlet

| Check         | Result | Notes                                                                 |
| ------------- | ------ | --------------------------------------------------------------------- |
| format:check  | Pass   |                                                                       |
| lint          | Pass   |                                                                       |
| lint:vue      | Pass   |                                                                       |
| type-check    | Pass   |                                                                       |
| test:coverage | Pass   | 100% lines, branches, functions, statements — 1,216 tests in 91 files |
| knip          | Pass   | No dead code                                                          |
| size          | Pass   |                                                                       |

## Showcase Readiness

Strong. The migration demonstrates disciplined package consumption — honest dependencies, no wrapper indirection, clean deletion of replaced code. The `createMockFsHelpers` pattern is a pragmatic solution to the bundled-dependency mocking problem. A senior reviewer would see a codebase that knows how to consume its own extracted packages without leaving cruft behind.

## Proposed Knowledge Updates

- **Learnings:** Document the bundled-package mocking pattern (`createMockFsHelpers`) — when a package bundles its dependency, `vi.mock` on the transitive dep doesn't intercept. Mock the package directly.
- **Pulse:** Update to reflect that adapter-store, resource-adapter, helpers (copy, type-check), and error classes are now package-sourced.
- **Decision Record:** No new ADR needed — this follows the established Armory consumption pattern from fs-storage and fs-http migrations.

## Self-Debrief

### What Went Well

- Clean mechanical migration — the packages were extracted from this codebase, so the API surface matched perfectly.
- Identified the bundled-dependency mocking issue early and solved it systematically across all 21 files.
- Correct decision to skip `New<T>` wiring — verified domain types don't need it rather than blindly following the permit's instruction.

### What Went Poorly

- Got denied Write permission for the construction journal, couldn't complete the paper trail.

### Blind Spots

- Should have verified whether `isExisting` had any consumers before planning its migration — it was already unused.

### Training Proposals

| Proposal                                                                                                                    | Context                                                                                               | Shift Evidence |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------- |
| Before migrating a function to a package import, verify it has active consumers — dead code should be deleted, not migrated | `isExisting` had no consumers but the permit planned a migration path for it                          | This journal   |
| When mocking packages that bundle transitive dependencies, mock the package directly rather than the transitive dep         | `vi.mock("string-ts")` didn't intercept `@script-development/fs-helpers` because it bundles string-ts | This journal   |

---

## CFO Evaluation

**Overall Assessment:** Solid

### Permit Fulfillment Review

All acceptance criteria met or correctly dispositioned. Two criteria marked N/A with sound reasoning:

- **`isExisting` migration:** Permit assumed it had consumers. It didn't. Deletion was the right call — you don't migrate dead code. Good judgment.
- **`New<T>` generic wiring:** Permit assumed domain types had timestamp fields. They don't (only `inviteCode` has `createdAt`). Skipping unnecessary generics complexity was correct. I verified independently: `FamilySet` and `StorageOption` only have `id` as a system field.

The one item I want to flag: `New<T>` and `Updatable<T>` are still defined in `shared/types/generics.d.ts` but appear unused. knip may be skipping `.d.ts` files. Not a blocker — but worth cleaning up in a future pass if they're truly dead.

### Decision Review

All four decisions were well-reasoned:

1. **`New<T>` skip** — Correct. Verified independently.
2. **`createMockFsHelpers`** — Necessary and well-implemented. The bundled-dependency problem is real and this is the cleanest solution.
3. **`isExisting` deletion** — Correct. Dead code doesn't get migrated.
4. **Re-export in `string.ts`** — Acceptable. Maintains import convention consistency. Could debate direct imports vs re-exports, but this follows the existing pattern and keeps the blast radius small.

No decisions required CEO escalation.

### Showcase Assessment

This delivery strengthens the portfolio. 2,602 lines removed, 5 local implementations replaced with battle-tested packages (100% coverage, 100% mutation score). The `createMockFsHelpers` pattern shows sophistication in handling bundled dependencies. A reviewer would see a team that knows how to extract, publish, and consume its own packages cleanly.

### Training Proposal Dispositions

| Proposal                                                   | Disposition | Rationale                                                                                                |
| ---------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| Verify active consumers before migrating to package import | Candidate   | Good hygiene — prevents wasted effort migrating dead code. First observation, needs second confirmation. |
| Mock packages directly when they bundle transitive deps    | Candidate   | Real technical insight with broad applicability. First observation, needs second confirmation.           |

### Notes for the Architect

Clean work on a high-stakes migration. The correct disposition of `New<T>` and `isExisting` shows you're reading the codebase, not just following the permit blindly. The `createMockFsHelpers` solution was the right call — document it well so future migrations of bundled packages follow the same pattern.

One process note: the journal should have been committed with the migration, not left for someone else to write. I understand the Write permission issue was outside your control, but flag permission blockers earlier so the CFO can intervene.
