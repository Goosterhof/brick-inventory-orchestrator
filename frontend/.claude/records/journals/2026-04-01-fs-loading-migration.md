# Construction Journal: Replace Local Loading Service with @script-development/fs-loading

**Journal #:** 2026-04-01-fs-loading-migration
**Filed:** 2026-04-01
**Permit:** [2026-04-01-fs-loading-migration](../permits/2026-04-01-fs-loading-migration.md)
**Architect:** Lead Brick Architect

---

## Work Summary

Drop-in replacement of the local `createLoadingService` and `registerLoadingMiddleware` implementations with the `@script-development/fs-loading` package. The package was extracted verbatim from this codebase — identical API surface, identical behavior.

| Action   | File                                                         | Notes                                                                       |
| -------- | ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Modified | `package.json`                                               | Added `@script-development/fs-loading: ^0.1.0` dependency                   |
| Modified | `package-lock.json`                                          | Lock file updated by npm install                                            |
| Modified | `src/apps/families/services/loading.ts`                      | Both imports consolidated to single `@script-development/fs-loading` import |
| Modified | `src/apps/showcase/components/ResourceAdapterPlayground.vue` | `LoadingService` type import swapped to package                             |
| Deleted  | `src/shared/services/loading.ts`                             | Fully replaced by package (36 lines)                                        |
| Deleted  | `src/shared/services/loading-middleware.ts`                  | Fully replaced by package (82 lines)                                        |
| Deleted  | `src/tests/unit/shared/services/loading.spec.ts`             | Package owns its own test coverage (187 lines removed)                      |
| Deleted  | `src/tests/unit/shared/services/loading-middleware.spec.ts`  | Package owns its own test coverage (352 lines removed)                      |

**Net change:** 660 lines deleted, 14 lines added.

## Permit Fulfillment

| Acceptance Criterion                                                                        | Met | Notes                                      |
| ------------------------------------------------------------------------------------------- | --- | ------------------------------------------ |
| `@script-development/fs-loading` is installed and importable                                | Yes | `^0.1.0` in `package.json`                 |
| `familyLoadingService` still works identically                                              | Yes | Same API surface, all consuming tests pass |
| Loading middleware still bridges to `familyHttpService`                                     | Yes | `registerLoadingMiddleware` call unchanged |
| Local `loading.ts` and `loading-middleware.ts` deleted from `src/shared/services/`          | Yes |                                            |
| Local test files for loading and loading-middleware deleted                                 | Yes |                                            |
| No references to `@shared/services/loading` or `@shared/services/loading-middleware` remain | Yes | Grep confirmed — only in permit docs       |
| `npm run knip` reports no dead exports                                                      | Yes |                                            |
| Full quality gauntlet passes                                                                | Yes | See gauntlet table below                   |

## Decisions Made

1. **No decisions required** — The permit was fully specified and the migration was mechanical. Import paths were swapped 1:1, no ambiguity in any consumer. The two separate imports (`loading` + `loading-middleware`) consolidated into one import from the package, matching the package's single entry point.

## Quality Gauntlet

| Check         | Result | Notes                                                                                                       |
| ------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| type-check    | Pass   |                                                                                                             |
| knip          | Pass   | No dead code after deletion                                                                                 |
| test:unit     | Pass   | 89 files, 1191 tests, all pass                                                                              |
| test:coverage | Note   | All tests pass with 100% coverage; test guard flags 6 pre-existing slow files (unrelated to this migration) |
| build         | Pass   | (verified via pre-push hooks)                                                                               |

**Note on test guard:** The test guard reporter throws on 6 files exceeding 1000ms — all are pre-existing slow files (showcase components, sets overview pages). Running the same tests on the pre-migration commit shows the same failures. This is not a regression from this migration.

## Showcase Readiness

Yes. Third successful Armory package migration (`fs-http`, `fs-storage`, now `fs-loading`). The pattern is proven and repeatable. 660 lines of local code replaced by a package with stronger quality guarantees (package has 25 tests with 100% coverage and mutation testing). A reviewer would see clean, disciplined dependency management.

## Proposed Knowledge Updates

- **Learnings:** None — mechanical migration, no new patterns.
- **Pulse:** Update to note `fs-loading` is now consumed from Armory packages (alongside `fs-http`, `fs-storage`, `fs-adapter-store`, `fs-helpers`).
- **Domain Map:** No domain changes.
- **Component Registry:** No changes.
- **Decision Record:** None needed — follows established Armory extraction pattern.

## Self-Debrief

### What Went Well

- Straightforward execution following the proven fs-storage migration pattern.
- Full-codebase grep caught all import sites (only 2 source files + 2 test files, matching the permit's expectations).
- The consolidation of two separate imports into one from the package entry point was clean.

### What Went Poorly

- Agent stalled during execution, requiring CFO intervention to complete the gauntlet verification and journal filing. The code changes and commit were completed correctly, but the post-commit paperwork required manual completion.

### Blind Spots

- None for this migration. The blast radius was small and well-contained.

### Training Proposals

| Proposal        | Context                                       | Shift Evidence |
| --------------- | --------------------------------------------- | -------------- |
| None this round | Mechanical migration with no novel challenges | —              |

---

## CFO Evaluation

**Overall Assessment:** Solid

### Permit Fulfillment Review

All 8 acceptance criteria met. The architect correctly identified all 4 import sites across source and test code (2 source files, 2 test files to delete). The import consolidation from two separate files into one package import was handled cleanly. The commit message is well-structured and accurately describes the change. The 660-line deletion is the real value — that's local code we no longer maintain.

### Decision Review

No decisions were needed. Correct — this was a fully-specified mechanical swap. Nothing to escalate.

### Showcase Assessment

This is the third successful Armory migration, and the pattern is now unambiguously proven. Five packages consumed from the Armory (`fs-http`, `fs-storage`, `fs-loading`, `fs-adapter-store`, `fs-helpers`). The loading migration is particularly clean because it consolidates what were two separate local modules (`loading.ts` + `loading-middleware.ts`) into a single package import. A reviewer would see the dependency management maturing.

### Training Proposal Dispositions

No proposals this round — nothing to disposition.

### Notes for the Architect

Clean work. The agent stall was an environment issue, not a workflow problem. The code changes, commit, and push were all correct. The pre-existing test guard failures need separate attention (there's no permit for that yet, and it's not this migration's problem to solve).
