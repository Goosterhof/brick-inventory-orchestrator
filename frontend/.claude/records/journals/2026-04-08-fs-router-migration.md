# Construction Journal: fs-router Migration

**Journal #:** 2026-04-08-fs-router-migration
**Filed:** 2026-04-08
**Permit:** `.claude/records/permits/2026-04-08-fs-router-migration.md`
**Architect:** Lead Brick Architect

---

## Work Summary

Dependency swap: replaced local `src/shared/services/router/` implementation (4 files, ~434 lines) with `@script-development/fs-router` package. BIO-specific features (`dashboardRouteName`, `goToDashboard`, `from` query middleware) retained as a thin wrapper via `BioRouterService` interface.

| Action   | File                                                                | Notes                                                                       |
| -------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Modified | `package.json`                                                      | Added `@script-development/fs-router@^0.1.0`                                |
| Modified | `package-lock.json`                                                 | Lockfile updated                                                            |
| Modified | `src/shared/services/router/index.ts`                               | Replaced 167-line implementation with 38-line BioRouterService wrapper      |
| Modified | `src/shared/services/auth/guards.ts`                                | Import `BioRouterService` from wrapper, `UnregisterMiddleware` from package |
| Deleted  | `src/shared/services/router/routes.ts`                              | Now in package (67 lines)                                                   |
| Deleted  | `src/shared/services/router/components.ts`                          | Now in package (57 lines)                                                   |
| Deleted  | `src/shared/services/router/types.d.ts`                             | Now in package (143 lines)                                                  |
| Deleted  | `src/tests/unit/shared/services/router/index.spec.ts` (original)    | 907 lines, replaced by thin wrapper test                                    |
| Deleted  | `src/tests/unit/shared/services/router/routes.spec.ts`              | 452 lines, tests now owned by package                                       |
| Deleted  | `src/tests/unit/shared/services/router/components.spec.ts`          | 337 lines, tests now owned by package                                       |
| Created  | `src/tests/unit/shared/services/router/index.spec.ts` (replacement) | 5 tests covering BIO-specific behavior only                                 |

Net reduction: ~2,000 lines deleted, ~100 lines added.

## Permit Fulfillment

| Acceptance Criterion                                                              | Met | Notes                                                              |
| --------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------ |
| `@script-development/fs-router` installed and importable                          | Yes | `^0.1.0` in dependencies                                           |
| `createRouterService` call signature unchanged for app-level consumers            | Yes | `(routes, dashboardRouteName, base?)` preserved via wrapper        |
| `dashboardRouteName` property and `goToDashboard()` method work                   | Yes | Tested in wrapper test, type-safe via `BioRouterService` interface |
| `from` query middleware redirects when `from` query param present                 | Yes | Tested                                                             |
| `from` query middleware respects `ignoreFrom` meta                                | Yes | Tested                                                             |
| Auth guard (`registerAuthGuard`) works with new types                             | Yes | All 9 guard tests pass, uses `BioRouterService<Routes>` now        |
| Local `routes.ts`, `components.ts`, `types.d.ts` deleted                          | Yes | All 3 files removed                                                |
| Local router unit tests deleted and replaced with thin BIO wrapper test           | Yes | 3 files deleted (~1696 lines), 1 file created (5 tests)            |
| No references to `@shared/services/router/types`, `/routes`, `/components` remain | Yes | Grep confirms zero matches in `src/`                               |
| `npm run knip` reports no dead exports                                            | Yes | Clean after removing unused re-exports                             |
| Full quality gauntlet passes                                                      | Yes | All checks pass, 100% coverage, 1147 tests                         |

## Decisions Made

1. **Removed unused re-exports rather than keeping them "for future use"** -- The permit suggested re-exporting `createCrudRoutes`, `createNestedCrudRoutes`, `createStandardRouteConfig`, `RouterService`, `UnregisterMiddleware`, and `BeforeRouteMiddleware` from the wrapper for future consumers. Knip flagged all 6 as unused. Chose to remove them to keep knip clean. They are a one-line addition when a consumer actually needs them. Dead exports are noise that erodes trust in the codebase.

2. **Left `generics.d.ts` unchanged** -- `FilterUndefined` in `src/shared/types/generics.d.ts` is now unused (its only consumer was `types.d.ts`). However, `generics.d.ts` also has `New` and `Updatable` types that are also currently unused. Knip ignores `.d.ts` files per config, so this does not fail any checks. Chose not to delete the file -- it contains utility types that are likely to be consumed by future domains. Cleanup can happen as a separate task if desired.

3. **`guards.ts` uses `BioRouterService` instead of package `RouterService`** -- The auth guard accesses `routerService.dashboardRouteName`, which exists only on the BIO wrapper interface. Changed the function signature to `BioRouterService<Routes>` and imported `UnregisterMiddleware` directly from the package since it is a pure type not specific to BIO.

## Quality Gauntlet

| Check         | Result | Notes                                              |
| ------------- | ------ | -------------------------------------------------- |
| format:check  | Pass   |                                                    |
| lint          | Pass   | 0 warnings, 0 errors                               |
| lint:vue      | Pass   |                                                    |
| type-check    | Pass   |                                                    |
| test:coverage | Pass   | 100% lines, branches, functions, statements        |
| knip          | Pass   | Clean                                              |
| size          | Pass   | families: 114.48 kB brotli, admin: 30.85 kB brotli |
| build         | Pass   | All 3 apps                                         |

Pre-push gauntlet (type-check, knip, test:coverage, build) all passed on push.

## Showcase Readiness

Clean migration that demonstrates the Armory extraction pattern at its most complex. The router service was the largest and most tightly coupled shared service -- it had BIO-specific features baked in (dashboard navigation, from-query middleware) unlike the toast/dialog/loading services which were pure dependency swaps. The thin wrapper pattern (`BioRouterService extends RouterService`) is architecturally sound and would hold up under review: it separates generic routing concerns (package) from application-specific behavior (wrapper) without any leaky abstractions. The test file is minimal but complete -- 5 tests covering exactly the BIO-specific behavior that the wrapper adds.

## Proposed Knowledge Updates

- **Learnings:** None. No new gotchas discovered -- the migration followed established patterns.
- **Pulse:** Update "RouterService wrapper" pattern maturity from "Battle-tested" to "Battle-tested (migrated to @script-development/fs-router with BioRouterService wrapper)". Update In-Progress Work to reflect completion.
- **Domain Map:** No domain changes.
- **Decision Record:** None warranted. This is a dependency swap following established Armory migration precedent (toast, dialog, loading), not a new architectural choice.

## Self-Debrief

### What Went Well

- Branch already had the package installed and wrapper written (partial prior work). Recognized this immediately via `git status` and `git diff`, adapted plan to complete the remaining work rather than starting from scratch.
- The guards test confirmed the type change worked immediately -- no iteration needed.
- Knip caught the unused re-exports quickly, leading to a cleaner result than the permit's suggestion.

### What Went Poorly

- Nothing significant. This was a straightforward migration with clear precedent.

### Blind Spots

- Did not verify the `from` query middleware behavior against the package's middleware registration order. The wrapper registers the `from` middleware first, and the package's `registerBeforeRouteMiddleware` appends to the array. If a consumer registers another before-middleware that also returns `true`, ordering matters. This is existing behavior (unchanged) but worth noting.
- Did not check integration tests for router references. Verified only unit tests. Integration tests may mock the router differently.

### Training Proposals

| Proposal                                                                                                                                                 | Context                                                                                           | Shift Evidence                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------ |
| When knip flags re-exports as unused, remove them rather than adding knip ignores -- one-line re-exports are trivial to add back when a consumer appears | Permit suggested keeping unused re-exports "for future use"; knip disagreed; removing was cleaner | 2026-04-08-fs-router-migration |

---

## CFO Evaluation

**Verdict: Strong delivery.** This was the most complex Armory migration -- the only one requiring a wrapper pattern -- and the architect executed it cleanly in a single pass.

### What I Liked

- **The knip override was the right call.** The permit said to keep re-exports "for future use." The architect installed them, knip flagged all 6 as dead, and the architect removed them with clear reasoning. Following the tooling over the permit's speculation is exactly what I want to see. One-line re-exports take 10 seconds to add when a consumer appears; dead exports erode trust immediately.
- **The wrapper is minimal.** 34 lines. No over-abstraction, no speculative generics, no "what if we need X later." It does exactly three things: dashboard name, dashboard navigation, from-query middleware. Done.
- **Test file is appropriately scoped.** 5 tests covering exactly the BIO-specific behavior. No re-testing what the package already covers with its 93 tests. This is the correct test boundary.
- **Self-debrief is honest.** The blind spot about integration test mocks and middleware ordering was self-identified without prompting.

### What I'd Push Back On

- **`generics.d.ts` left untouched.** "Knip ignores `.d.ts` per config" is an explanation, not a justification. If the types are unused, they're dead weight. I understand not wanting to scope-creep this permit, but the journal should have flagged it as a follow-up item rather than rationalizing inaction. Minor -- not blocking.

### Training Disposition

| Proposal                                                          | Disposition   | Rationale                                                                 |
| ----------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------- |
| Remove knip-flagged re-exports rather than keeping for future use | **Candidate** | Good instinct, first observation. Watching for a second confirming shift. |

### Graduation Log Update

Added to Candidates table in `.claude/agents/lead-brick-architect.md`.
