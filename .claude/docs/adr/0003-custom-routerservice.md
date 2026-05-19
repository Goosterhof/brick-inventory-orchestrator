# Decision: RouterService wrapper over direct Vue Router usage

**Date**: 2026-03-17 (revised 2026-03-18)
**Feature**: Core routing architecture
**Status**: accepted
**Transferability**: universal

## Context

Vue Router requires plugin registration (`app.use(router)`) to function. Its components (`RouterLink`) and composables (`useRouter`, `useRoute`) only work inside apps that have registered the plugin. This creates a hard coupling: any shared component that uses Vue Router only works in apps that install it.

This is a problem in any project where shared components exist alongside apps that may or may not need routing. A component gallery, a static marketing page, or a lightweight admin panel shouldn't be forced to install Vue Router just because a nav component somewhere in the shared library imports `RouterLink`.

Beyond the coupling problem, Vue Router's API has gaps for applications with non-trivial routing:

- **No runtime middleware** — guards are registered at definition time, but some middleware (e.g., auth token refresh) needs to be registered/deregistered at runtime based on application state
- **No type-safe route names** — `RouteLocationRaw` accepts any string as a route name with no compile-time validation. A typo in a route name is a runtime error, not a TypeScript error
- **No convenience methods** — common CRUD navigation patterns (go to edit page, go to show page) require repeating route name and parameter construction across every call site

## Options Considered

| Option                                                                | Pros                                                                                                                                                | Cons                                                                                                                                                             | Why eliminated / Why chosen                                                                                          |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Vue Router plugin in every app**                                    | Standard API, `RouterLink` works in shared components                                                                                               | Forces all apps to install Vue Router. Shared components crash at runtime (not compile time) in any app that doesn't. Team must remember an invisible dependency | Eliminated — coupling breaks at runtime, which is the worst kind of failure for a team of juniors                    |
| **Direct Vue Router usage per app, shared components use `<a>` tags** | No coupling. Simple. Each app decides independently                                                                                                 | No middleware system, no type-safe route names, no CRUD navigation helpers. Every app reinvents the same patterns                                                | Eliminated — solves coupling but ignores the API gaps. Teams will build ad-hoc wrappers that diverge across projects |
| **RouterService wrapper for all routed apps**                         | One API for routing. Shared components stay decoupled. Type-safe route names, runtime middleware, convenience methods — built once, used everywhere | Adds an abstraction layer over Vue Router. Team must learn RouterService API, not Vue Router's                                                                   | **Chosen** — the abstraction pays for itself across projects                                                         |

## Decision

Two rules:

1. **Shared components never depend on any router.** They render plain `<a>` tags with `event.preventDefault()` and emit `click` events. The consuming app wires up navigation. This makes shared components portable to any context — routed app, unrouted app, component gallery, test harness.

2. **Every routed app uses `createRouterService()`.** No direct Vue Router usage. No exceptions for "simple" apps — an app with just one or two routes barely qualifies as a routed app, and the moment it grows, the migration cost from raw Vue Router to RouterService is unnecessary friction. Start with the service.

`createRouterService()` wraps Vue Router (not replaces it) and provides:

- **Runtime middleware** — register/deregister middleware based on application state (e.g., auth middleware only active when a user is logged in)
- **Type-safe route names** — `RouteName<Routes>` is a union of literal string types extracted from the actual route definitions. A typo is a TypeScript error
- **`createRouterLink()` factory** — produces `<a>` tag components with `goToRoute()` click handlers typed to the app's routes. The ergonomics of `RouterLink` without the plugin coupling
- **CRUD convenience methods** — `goToEdit()`, `goToShow()`, etc., so navigation patterns are consistent and not copy-pasted across domains

## Consequences

- Shared components are fully portable — they work in any app regardless of routing setup
- All routed apps get middleware, type-safe navigation, and convenience methods out of the box
- Shared nav components can't navigate on their own. Navigation logic lives in the consuming page, not the component. This is a deliberate inversion of control — keep emit chains to one level (shared component emits to page, page navigates)
- Team learns one routing API (RouterService) instead of raw Vue Router. The abstraction is the standard; Vue Router is an implementation detail
- `createRouterLink` gives app-level components the ergonomics of `RouterLink` without the coupling

## Enforcement

| What                                                           | Mechanism                                                                              | Scope                 |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------- |
| `RouterLink` import banned in shared                           | oxlint `no-restricted-imports` (`paths` with `importNames: ["RouterLink"]`)            | `src/shared/**`       |
| `useRouter`/`useRoute` import banned in shared                 | oxlint `no-restricted-imports` (`paths` with `importNames: ["useRouter", "useRoute"]`) | `src/shared/**`       |
| `useRouter`/`useRoute` import banned in all apps               | oxlint `no-restricted-imports` (`paths` with `importNames: ["useRouter", "useRoute"]`) | `src/apps/**`         |
| `<RouterLink>`/`<router-link>` template usage banned in shared | Custom linter (`scripts/lint-vue-conventions.mjs`, check 6)                            | `src/shared/**/*.vue` |

The oxlint rules live in `.oxlintrc.json` under the respective file overrides. The template check catches globally registered component usage that wouldn't trigger an import-level ban.

## Resolved Questions

### Does createRouterLink duplicate Vue Router's RouterLink?

**Resolved 2026-03-17.** No — it replaces a loosely-typed component with a strictly-typed one. Vue Router's `RouterLink` accepts `RouteLocationRaw`, which allows any string as a route name with no compile-time validation. `createRouterLink` types its `to` prop as `RouteName<Routes>` — a union of literal string types extracted from the actual route definitions. Passing a nonexistent route name is a TypeScript error, not a runtime surprise. Even if Vue Router added conditional plugin detection, `createRouterLink` would still be justified by the type safety alone.

### Should shared components use callback props instead of click emits?

**Resolved 2026-03-17.** No. The emit pattern is the correct choice. Callback props would break Vue 3 `defineEmits<{}>()` conventions used throughout the codebase, make components harder to test (currently verified cleanly via `wrapper.emitted("click")`), and add no value — parents already wire navigation in a single `@click` handler. The emit pattern keeps shared components fully decoupled from all routing implementations.
