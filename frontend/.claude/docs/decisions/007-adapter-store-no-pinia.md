# Decision: Adapter store module over Pinia/Vuex

**Date**: 2026-03-18
**Feature**: Reactive state management for domain collections
**Status**: accepted
**Transferability**: universal

## Context

Every domain needs to manage a collection of entities: fetch all sets from the API, look up a set by ID, create new ones, and keep the UI in sync when entities change. This is the classic state management problem.

The Vue ecosystem's standard answer is Pinia (or its predecessor Vuex). Both provide reactive stores with actions, getters, and devtools integration. But in this project, state management is tightly coupled to three other concerns that Pinia doesn't handle:

1. **The resource adapter** (ADR-006) — entities are adapted objects with CRUD methods attached. The store must return adapted objects, not raw data
2. **localStorage persistence** — the store must sync to localStorage on every mutation so the app works offline and loads instantly on return
3. **Loading coordination** — looking up an entity by ID must wait for the initial data fetch to complete, or detail pages that load before the collection is ready will show false "not found" errors

Wiring these three concerns into Pinia would require plugins, custom composables on top of the store, and careful coordination between the adapter lifecycle and the store lifecycle. At that point, Pinia's main value — its standardized reactive store API — is buried under project-specific glue.

## Options Considered

| Option                                                         | Pros                                                                                                                                                                                   | Cons                                                                                                                                                                                                                                                       | Why eliminated / Why chosen                                                                                                        |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Pinia with plugins for persistence and adapter integration** | Industry standard. Devtools support. Large community. Well-documented patterns                                                                                                         | Requires persistence plugin, custom getter that wraps items through the adapter, manual loading coordination, and per-store boilerplate to wire it all together. The adapter's `setById`/`deleteById` contract doesn't map cleanly to Pinia's action model | Eliminated — the integration cost exceeds the value of the standard API. We'd be fighting Pinia's model to fit our adapter pattern |
| **Vuex**                                                       | Mature, well-understood                                                                                                                                                                | Essentially deprecated in favor of Pinia. Same integration issues, plus more verbose mutation/action boilerplate                                                                                                                                           | Eliminated — no reason to choose Vuex over Pinia, and Pinia was already eliminated                                                 |
| **Raw `ref()` + `computed()` per component (no shared store)** | Zero abstraction. Each page fetches and manages its own data                                                                                                                           | No shared state — navigating from list to detail refetches. No persistence. Each component duplicates the fetch/transform/store pattern                                                                                                                    | Eliminated — works for isolated pages but not for interconnected CRUD workflows                                                    |
| **Custom adapter store module factory**                        | Purpose-built for the adapter pattern. Persistence, loading coordination, and adapted object creation are built in. Zero external dependencies beyond Vue. One factory call per domain | Non-standard. No devtools integration. Team must learn a custom API                                                                                                                                                                                        | **Chosen** — the factory produces exactly the API surface domains need, with no glue code                                          |

## Decision

`createAdapterStoreModule(config)` is a factory that returns a `StoreModuleForAdapter` — the complete public API for a domain's collection state:

- **`getAll`** — `ComputedRef<Adapted<T>[]>`. Reactive, re-adapts items when state changes. Used for list pages
- **`getById(id)`** — returns a `ComputedRef` that tracks a specific entity. Reactive to updates on that entity
- **`getOrFailById(id)`** — async version that awaits `loadingService.ensureLoadingFinished()` before checking. Prevents race conditions on detail page load
- **`generateNew()`** — returns a `NewAdapted<T>` for create forms
- **`retrieveAll()`** — fetches from the API, normalizes into an id-keyed dictionary, freezes each item, persists to localStorage

Internal state is a `Ref<{[id: number]: Readonly<T>}>` — a normalized id-keyed dictionary. This gives O(1) lookups and immutable updates (spread a new object with the changed entry). Only two mutation paths exist: `setById` and `deleteById`, both internal to the module. They are passed to the adapter (ADR-006) so CRUD methods can update the store after successful API calls, but they are never exposed publicly.

The store is the adapter's home. The adapter is the store's interface. They form a closed loop: the store creates adapted objects, the adapted objects' CRUD methods update the store.

No Pinia. No Vuex. No external state management dependency.

## Consequences

- **One factory call per domain** creates a complete reactive store with persistence, loading coordination, and adapted entity access
- **Normalized state (id-keyed dictionary)** gives O(1) lookups and predictable mutation patterns. `getAll` pays an `Object.values()` cost on access, acceptable for inventory-scale datasets
- **No devtools integration** — debugging requires inspecting the `Ref` directly. If this becomes painful, a lightweight devtools adapter could be added without changing the API
- **Tight coupling between store and adapter** — by design. The adapter's CRUD methods need `setById`/`deleteById` to keep the store in sync. This coupling is the feature, not a bug: it guarantees the store is always consistent with the last successful API operation
- **localStorage is the persistence layer** — every `setById`, `deleteById`, and `retrieveAll` writes to localStorage. This means instant load on return visits and offline resilience, but also means localStorage size limits apply. For a LEGO inventory app, this is well within bounds

## Resolved Questions

- ~~Like the resource adapter (ADR-006), this pattern is built and tested but not yet consumed by any domain. First integration will validate the API surface.~~ **Resolved**: Sets domain is the first consumer. All four CRUD pages (overview, detail, add, edit) are integrated and validated the API surface.
- ~~`getAll` re-adapts every item on every computed access. For domains with hundreds of items, should we add memoization?~~ **Resolved**: Memoization was added via `adaptedCache` (Map keyed by ID). `getAll` calls `getAdapted()` which checks the cache before creating new adapted objects. The `Object.values()` iteration cost is trivial; the expensive part (adapter creation) is cached.
- ~~Should the store expose a `clear()` method for logout scenarios, or should the auth service handle localStorage cleanup directly?~~ **Resolved**: Neither. Logout clears localStorage and triggers a full page refresh. All in-memory state (refs, caches, computed refs) is destroyed with the page. The store has no logout responsibility.
