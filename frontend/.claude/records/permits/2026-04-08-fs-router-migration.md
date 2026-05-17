# Building Permit: fs-router Migration

**Permit #:** 2026-04-08-fs-router-migration
**Filed:** 2026-04-08
**Issued By:** General
**Assigned To:** Lead Brick Architect
**Priority:** When-convenient

---

## The Job

Replace the local `src/shared/services/router/` service with `@script-development/fs-router`. The package was extracted from this codebase and a sibling territory — the core API is identical. BIO-specific features (`dashboardRouteName`, `goToDashboard`, `from` query middleware) stay as a thin local wrapper.

## Scope

### In the Box

1. **Install the package** — `npm install @script-development/fs-router` in the frontend workspace.

2. **Replace the core router service** — The 4 local source files are replaced by the package:

    | Local file                                            | Package equivalent                                                                     |
    | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
    | `src/shared/services/router/index.ts` (167 lines)     | `createRouterService` from `@script-development/fs-router`                             |
    | `src/shared/services/router/routes.ts` (67 lines)     | `createCrudRoutes`, `createNestedCrudRoutes`, `createStandardRouteConfig` from package |
    | `src/shared/services/router/components.ts` (57 lines) | `createRouterView`, `createRouterLink` from package                                    |
    | `src/shared/services/router/types.d.ts` (143 lines)   | All types exported from package                                                        |

3. **Create a thin BIO wrapper** — Replace `src/shared/services/router/index.ts` with a wrapper that adds the BIO-specific features on top of the package:

    ```ts
    import type {RouteRecordRaw} from 'vue-router';
    import type {
        RouterService,
        RouteName,
        UnregisterMiddleware,
        BeforeRouteMiddleware,
    } from '@script-development/fs-router';
    import {createRouterService as createBaseRouterService} from '@script-development/fs-router';

    export interface BioRouterService<Routes extends RouteRecordRaw[]> extends RouterService<Routes> {
        dashboardRouteName: RouteName<Routes>;
        goToDashboard: () => Promise<void>;
    }

    export const createRouterService = <Routes extends RouteRecordRaw[]>(
        routes: Routes,
        dashboardRouteName: RouteName<Routes>,
        base?: string,
    ): BioRouterService<Routes> => {
        const service = createBaseRouterService(routes, {base});

        // BIO-specific: "from" query middleware
        service.registerBeforeRouteMiddleware((to) => {
            if (to.meta?.ignoreFrom) return false;

            const fromQuery = service.currentRouteRef.value.query.from;
            if (fromQuery) {
                if (fromQuery.toString() === to.name) return false;
                void service.goToRoute(fromQuery.toString());
                return true;
            }

            return false;
        });

        return {...service, dashboardRouteName, goToDashboard: () => service.goToRoute(dashboardRouteName)};
    };
    ```

    The wrapper preserves the existing call signature: `createRouterService(routes, "home", base)`.

4. **Update type imports in `guards.ts`** — The auth guard references `RouterService` and `UnregisterMiddleware`:

    **`src/shared/services/auth/guards.ts`** (line 1):

    ```ts
    // Before
    import type {RouterService, UnregisterMiddleware} from '@shared/services/router/types';

    // After — import BioRouterService from the local wrapper, UnregisterMiddleware from package
    import type {UnregisterMiddleware} from '@script-development/fs-router';
    import type {BioRouterService} from '@shared/services/router';
    ```

    Update the function signature to use `BioRouterService<Routes>` instead of `RouterService<Routes>` (it references `dashboardRouteName`).

5. **Re-export route factories from the wrapper** — Domain route files don't currently use `createCrudRoutes` etc. directly, but the wrapper should still re-export them for future use:

    ```ts
    export {createCrudRoutes, createNestedCrudRoutes, createStandardRouteConfig} from '@script-development/fs-router';
    export type {
        RouterService,
        RouteName,
        UnregisterMiddleware,
        BeforeRouteMiddleware,
    } from '@script-development/fs-router';
    ```

6. **Delete replaced local files** — Once the wrapper is in place:
    - Delete `src/shared/services/router/routes.ts`
    - Delete `src/shared/services/router/components.ts`
    - Delete `src/shared/services/router/types.d.ts`

7. **Delete local unit tests that the package now owns** — The package has 93 tests with 100% coverage:
    - Delete `src/tests/unit/shared/services/router/index.spec.ts` (907 lines)
    - Delete `src/tests/unit/shared/services/router/routes.spec.ts`
    - Delete `src/tests/unit/shared/services/router/components.spec.ts`

    Write a **new, small test file** for the BIO wrapper that covers only the BIO-specific behavior:
    - `dashboardRouteName` is set correctly
    - `goToDashboard` navigates to the dashboard route
    - The `from` query middleware redirects when `from` query param is present
    - The `from` query middleware skips when `ignoreFrom` meta is set
    - The `from` query middleware skips when `from` matches destination

8. **Remove `string-ts` from the router** — The local `index.ts` imports `replace` from `string-ts` for base path stripping. The package handles this internally. After migration, if `string-ts` has no other consumers in the router, no action needed — it's still used by `auth/index.ts` and `@script-development/fs-helpers`.

9. **Update `FilterUndefined` references** — `types.d.ts` imported `FilterUndefined` from `@shared/types/generics`. The package exports this type. If `FilterUndefined` is used nowhere else in BIO, check with `knip` whether `@shared/types/generics` can be cleaned up.

10. **Run knip** — Verify no dead exports remain.

### Not in This Set

- The **app-level router instances** (`src/apps/families/services/router.ts` and `src/apps/admin/router/index.ts`) — these import `createRouterService` from `@shared/services/router`, which is the wrapper. Their import path doesn't change.
- The **auth guard** logic — only the type import path changes, not the behavior.
- The **`SpecificRouterLink` type** — the package uses `RouterLinkComponent`. If any code references `SpecificRouterLink` by name, rename to `RouterLinkComponent`. Currently only `components.ts` and its test use this type — both are being deleted.
- Domain route definitions — they don't import from the router service directly.
- Any router behavior changes — this is a dependency swap with a thin wrapper for BIO features.

## Acceptance Criteria

- [ ] `@script-development/fs-router` is installed and importable
- [ ] `createRouterService` call signature unchanged for app-level consumers (`routes, dashboardRouteName, base`)
- [ ] `dashboardRouteName` property and `goToDashboard()` method work on the returned service
- [ ] `from` query middleware still redirects (test: navigate with `?from=home`, then navigate elsewhere — should redirect to home)
- [ ] `from` query middleware respects `ignoreFrom` meta
- [ ] Auth guard (`registerAuthGuard`) works with the new types
- [ ] Local `routes.ts`, `components.ts`, `types.d.ts` are deleted
- [ ] Local router unit tests (3 files) are deleted and replaced with a thin BIO wrapper test
- [ ] No references to `@shared/services/router/types`, `@shared/services/router/routes`, or `@shared/services/router/components` remain
- [ ] `npm run knip` reports no dead exports
- [ ] Full quality gauntlet passes: `npm run type-check && npm run knip && npm run test:coverage && npm run build`

## References

- Package: `@script-development/fs-router@0.1.0` on npm
- Package source: `fs-packages/packages/router/` (Armory)
- PR: script-development/fs-packages#14
- Precedent: `fs-toast-migration` permit (2026-04-02), `fs-dialog-migration` permit (2026-04-02) — same swap pattern
- Local source being replaced: `src/shared/services/router/` (4 files, ~434 lines)

## Notes from the Issuer

This is the most complex Armory migration yet because the package doesn't include BIO's `dashboardRouteName`/`goToDashboard` or the `from` query middleware. These are BIO-specific concerns that were deliberately excluded from the package during design. The thin wrapper pattern keeps the external API identical — no consuming code changes its call signature.

Key API differences between local and package:

| Feature                        | Local                                               | Package                                    |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------ |
| Factory signature              | `createRouterService(routes, dashboardName, base?)` | `createRouterService(routes, {base?})`     |
| `dashboardRouteName`           | On service                                          | Not included                               |
| `goToDashboard()`              | On service                                          | Not included                               |
| `from` query middleware        | Built-in                                            | Not included                               |
| `currentRouteSlug`             | Not available                                       | Available                                  |
| Middleware unregister          | Returns `UnregisterMiddleware`                      | Returns `UnregisterMiddleware` (identical) |
| `onPage` / `onCreatePage` etc. | Available                                           | Available                                  |
| `routeExists`                  | Available                                           | Available                                  |
| Route meta type                | Hardcoded `{authOnly, canSeeWhenLoggedIn, isAdmin}` | Generic `Meta` parameter                   |

The `CrudRoute` meta type becomes generic. BIO's existing route meta shape (`{authOnly: true, canSeeWhenLoggedIn: true, isAdmin: false}`) should be defined as a local type and passed as the `Meta` generic to `createCrudRoutes` and `createNestedCrudRoutes`. Since domain route files don't call these factories directly, this only affects the route factory definitions — which live in the deleted `routes.ts`. If any future domain route files start using the factories via the re-export, they'll pass the BIO meta type.

The `string-ts` mock in **many test files** exists because the local router imported `replace` from `string-ts`. After this migration, the router no longer uses `string-ts` directly. The `string-ts` mock may still be needed for `auth/index.ts` (which uses `deepSnakeKeys`), but the `createMockStringTs` helper's router-related comment can be updated. Run `knip` to verify.

---

**Status:** Open
**Journal:** _link to construction journal when filed_
