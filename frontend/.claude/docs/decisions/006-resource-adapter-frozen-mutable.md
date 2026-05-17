# Decision: Resource adapter with frozen base and mutable ref

**Date**: 2026-03-18 (revised 2026-04-01)
**Feature**: Domain entity state management and CRUD operations
**Status**: accepted
**Transferability**: universal

## Context

Domain entities in a CRUD application have two modes: display (read-only) and editing (mutable). A detail page shows an entity's name as text, but an edit form needs two-way binding to a reactive copy. These two modes create a recurring problem: how do you let a form mutate data without accidentally corrupting the canonical state?

Vue's reactivity system makes this worse. If you pass a reactive object to a form and the user types into an input, the original object mutates immediately — there's no "draft" layer. Cancelling an edit means manually restoring every field. With nested objects (arrays of related entities, nested hierarchies), manual restoration is error-prone.

The forces pulling in different directions:

- **Forms need mutable reactive data** — Vue's `v-model` requires a `Ref` or `reactive` target
- **Canonical state must not be corrupted by in-progress edits** — if a user cancels, the original must be untouched
- **CRUD operations should live close to the data** — calling `update()` on an entity is more discoverable than dispatching an action to a store that calls an API that updates another store
- **snake_case/camelCase conversion must happen consistently** — every HTTP boundary needs conversion (ADR-004), and doing it per-component is a bug magnet

### Scope

The resource adapter is for **domain entities with CRUD lifecycles** — things that are created, read, updated, and deleted via a REST API. It is not a general-purpose HTTP wrapper. Non-CRUD operations (search endpoints, batch actions, aggregation queries, authentication flows) should use the HTTP service directly.

A good test: if the API resource has an `id` and supports standard REST verbs (`GET /resources`, `POST /resources`, `PUT /resources/:id`, `DELETE /resources/:id`), it belongs in the adapter. If it doesn't, it doesn't.

## Options Considered

| Option                                                  | Pros                                                                                                                                                                                                                   | Cons                                                                                                                                                                             | Why eliminated / Why chosen                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Pinia stores with separate form state in components** | Conventional Vue pattern. Well-documented. Large ecosystem of plugins                                                                                                                                                  | Each component manually copies store data into local refs, manually converts case on submit, manually updates store after API response. Lots of glue code that varies per domain | Eliminated — the glue code is the same every time, which means it should be abstracted, not copy-pasted             |
| **Class-based models (ActiveRecord pattern)**           | Familiar to Laravel/Rails developers. `entity.save()` is intuitive                                                                                                                                                     | Classes and Vue's `reactive()` have known conflicts (proxy traps on class instances). Inheritance hierarchies grow complex. Doesn't solve the mutable/immutable split            | Eliminated — fights Vue's reactivity model instead of working with it                                               |
| **Immer-style immutable updates**                       | Structural sharing, efficient for large state trees                                                                                                                                                                    | External dependency. Requires learning a new mutation API (`produce(draft => ...)`). Overkill for typical CRUD dataset sizes                                                     | Eliminated — adds complexity for a problem that `Object.freeze` + `deepCopy` solves more simply                     |
| **Resource adapter with frozen base + mutable ref**     | One object serves both display and edit. CRUD methods are attached. Case conversion is handled internally. `reset()` restores original state. Type system enforces which methods exist (create vs update/patch/delete) | Non-standard pattern — team must learn the adapter API                                                                                                                           | **Chosen** — the adapter is the API surface for all domain entity interactions, eliminating per-component glue code |

## Decision

Each domain entity is wrapped by `resourceAdapter()`, which returns a single object with two views of the same data:

1. **Frozen view** — the resource's properties are spread and `Object.freeze()`-d. These are the last-persisted values. `adapted.name` is immutable and always reflects what the server knows.

2. **Mutable view** — `adapted.mutable` is a `Ref` containing a `deepCopy` of the resource. This is what form inputs bind to via `v-model`. Edits to `mutable.value` never touch the frozen properties or the original resource.

The adapter attaches context-appropriate CRUD methods:

- **Existing resources** (have an `id`): get `update()`, `patch()`, `delete()`
- **New resources** (no `id`): get `create()` only

This is enforced at both the type level (function overloads with `Adapted<T>` vs `NewAdapted<T>`) and at runtime (the `isExisting()` type guard determines which branch executes). You cannot call `update()` on something that doesn't exist yet — TypeScript won't let you.

The internal `adapterRepositoryFactory` handles all HTTP communication: response validation and store synchronization. Snake_case ↔ camelCase conversion happens at the HTTP middleware layer (ADR-016), one level below the adapter. Domain code never touches HTTP directly through the adapter — it calls `adapted.update()` and the pipeline handles the rest.

### Memoization

The adapter store caches adapted objects keyed by entity ID. Because canonical state is `Object.freeze()`-d, reference equality (`===`) reliably detects whether an entity has changed. When the store state updates:

- **Unchanged entities** return the cached adapted object — no recreation
- **Changed entities** get a new adapted object, and the cache entry is replaced
- **Deleted entities** have their cache entry removed proactively

This means updating one entity in a collection of 100 only recreates the adapted object for that one entity. The `getAll` computed still recomputes (it must, since the state ref changed), but the `map` call returns cached objects for all unchanged items.

`getById` computed refs are also cached — multiple components requesting the same entity ID share a single computed ref, not one per call site.

## Consequences

- **Forms are simple**: bind to `adapted.mutable.value`, call `adapted.update()` on submit, call `adapted.reset()` on cancel. No manual state copying or restoration
- **Canonical state is protected**: `Object.freeze` prevents accidental mutation. The frozen properties are the source of truth for display
- **Case conversion is invisible**: handled by HTTP middleware on the underlying http service per ADR-016 (originally claimed to be inside the repository factory; the factory's conversion was lost in the 2026-04-01 `fs-adapter-store` migration and restored as middleware)
- **Type safety narrows the API**: impossible to call `delete()` on a new resource or `create()` on an existing one
- **Memoization is cheap and correct**: `Object.freeze` gives us reference equality for free. Cache invalidation is deterministic — the only way a frozen reference changes is through `setById` or `retrieveAll`
- **The `Ref` type assertion**: Vue's `UnwrapRef` widens generic `T` to `unknown`, requiring a cast. This is safe for POJOs but would break if someone passed a resource with nested Vue refs. The adapter is designed for API-sourced data, not arbitrary reactive objects
- **`Object.defineProperty` must use `configurable: true` when the value is a `Ref`** — see amendment below

## Amendment: Vue Proxy Invariant Constraint (2026-04-01)

### Problem discovered

When an `Adapted<T>` object is stored inside a Vue `ref()` or `reactive()`, Vue wraps it in a `Proxy`. Vue's `get` trap detects `Ref`-typed properties via `isRef()` and auto-unwraps them — returning `ref.value` instead of the `Ref` wrapper itself.

The ECMAScript specification enforces a **Proxy invariant**: for non-configurable, non-writable data properties, the proxy's `get` trap must return the exact same value as the target's own property. The `mutable` property on `Adapted<T>` was defined with `configurable: false, writable: false`, and its value is a `Ref<Writable<T>>`. Vue's unwrapping returns a different value than what the target holds. The engine throws:

```
TypeError: 'get' on proxy: property 'mutable' is a read-only and non-configurable
data property on the proxy target but the proxy did not return its actual value
```

This affects any page that stores an `Adapted<T>` in reactive state and accesses `.mutable` — specifically the edit pages that bind `v-model` to `adapted.mutable.name` or similar.

The `NewAdapted<T>` path is unaffected because it uses object spread + `Object.freeze()`. Frozen properties are non-configurable, but their values are plain objects (not `Ref`s), so Vue has nothing to unwrap.

### Fix

Change `configurable: false` to `configurable: true` on all 6 `Object.defineProperty` calls in `resourceAdapter()` for the existing-resource branch (the properties: `id`-keyed accessors, `mutable`, `reset`, `update`, `patch`, `delete`).

### Why this is safe

The original `configurable: false` was defense-in-depth — preventing anyone from redefining the property descriptor after creation. But `writable: false` already prevents direct reassignment (`adapted.mutable = x` throws `TypeError`), and `Readonly<T>` prevents it at compile time. The only thing `configurable: true` permits that `configurable: false` didn't is calling `Object.defineProperty()` on the adapted object again — no production code does this, and doing so would be an obvious misuse caught in review.

The trade-off: we lose one layer of runtime protection against property descriptor manipulation, but we gain compatibility with Vue's reactive system — which is the entire reason the adapter exists.

### Constraint for future development

Any property defined via `Object.defineProperty` on an adapted object **must** use `configurable: true` if the value is a `Ref` or any type Vue's reactivity system would auto-unwrap. This is a hard constraint imposed by the ECMAScript Proxy specification, not a Vue bug — it cannot be worked around without either changing the descriptor or opting out of reactivity entirely (e.g., `markRaw`).

## Open Questions

- Should `reset()` emit a signal that the form was cancelled, or is that the consuming component's responsibility?
