# Decision: ComputedResourceData for DTO-Sourced API Responses

**Date**: 2026-03-28
**Feature**: Type-safe API responses from computed/aggregated data that doesn't originate from Eloquent Models
**Status**: accepted
**Transferability**: universal

## Context

ADR-0006 established `ResourceData` as the API response layer — `final readonly` classes extending an abstract `ResourceData<TModel of Model>` base with a `from(Model)` factory, `collection()` for lists, `EAGER_LOAD` for relationship management, and `validateRelationsLoaded()` for runtime safety.

This works when the source is an Eloquent Model. But three endpoints now return computed/aggregated data that was never a Model:

- `BrickDnaResourceData` — diversity analytics assembled from raw queries
- `FamilyStatsResourceData` — family-level statistics aggregated across tables
- `FamilySetCompletionResourceData` — set completion percentages from joined queries

All three accept Data DTOs, not Models. To satisfy the `from(Model)` contract, they declare `from(mixed $model)` with `@phpstan-ignore method.childParameterType` — suppressing the type system that PHPStan at level max is supposed to enforce. They inherit `collection()`, `EAGER_LOAD`, and `validateRelationsLoaded()` — Model-specific machinery that would fail at runtime if called. The generic annotation `@extends ResourceData<Model>` is fiction.

The forces:

- Dashboard and financial endpoints will increase the number of computed-data responses — 3 today, potentially 8-10 as the product grows
- `@phpstan-ignore` in production code is a red flag in a showcase project — it means the type system is lying
- Inherited methods that fail at runtime are worse than missing methods — they're a trap
- The pattern must remain enforceable by architecture tests

## Options Considered

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **A: Widen `ResourceData` to accept `object`** | One class hierarchy; minimal change | `collection()` calls `loadMissing()` — fails on non-Models. `validateRelationsLoaded()` expects a Model. `EAGER_LOAD` is meaningless on DTOs. Requires runtime guards (`instanceof Model` checks) throughout the base class. Every future source variant adds more branching. | Eliminated — turns a clean abstraction into a god class with defensive branching |
| **B: Shared abstract base class with two children** | Shares serialization; single inheritance chain | Three-level hierarchy (`BaseResourceData → ResourceData → Concrete`). The shared base exists only for serialization — not a meaningful domain concept. Inheritance depth scales badly. | Eliminated — introduces a base class that exists only for code reuse, not for modeling |
| **C: Trait + interface, no abstract classes** | Maximum flexibility; flat structure | Traits are unenforceable — architecture tests can verify `implements interface` but can't prevent custom trait implementations, alternative traits, or ad-hoc wiring. Provides flexibility the codebase doesn't want. | Eliminated — trait gives escape hatches that undermine the pattern's enforceability |
| **D: Two sibling abstract classes, shared interface, duplicated serialization** | Flat hierarchy (one level each). Enforceable (must extend one of two classes). Type-honest — no `@phpstan-ignore`. Each class owns exactly the machinery its children need. | Serialization code duplicated across two abstract classes. Two concepts to learn instead of one. | **Chosen** — the duplication is small (5 methods), acceptable at two classes, and easily extractable if a third variant emerges. Enforceability and type honesty outweigh DRY concerns at this scale. |

## Decision

### Two sibling abstract classes with a shared interface

**`ResourceResponse`** (interface in `App\Contracts`) — the shared type contract for all API response DTOs. Declares: `toArray()`, `jsonSerialize()`, `toResponse()`, `toResponseWithStatus()`.

**`ResourceDataSource`** (marker interface in `App\Contracts`) — implemented by Data DTOs eligible to feed `ComputedResourceData`. Constrains the generic to prevent arbitrary objects from being passed.

**`ResourceData<TModel of Model>`** — unchanged in purpose. Implements `ResourceResponse`. Owns Model-specific machinery: `from(Model)`, `collection()`, `EAGER_LOAD`, `validateRelationsLoaded()`, `requiredRelations()`. All 12 existing Model-sourced concrete classes continue to extend this.

**`ComputedResourceData<TSource of ResourceDataSource>`** — new abstract class. Implements `ResourceResponse`. Declares `from(ResourceDataSource)`. No `collection()`, no `EAGER_LOAD`, no `validateRelationsLoaded()`. The 3 existing DTO-sourced classes migrate here.

```
ResourceResponse (interface)
├── ResourceData<TModel of Model>                        ← Model-sourced, 12 classes
└── ComputedResourceData<TSource of ResourceDataSource>  ← DTO-sourced, 3 classes
```

### Why `ResourceDataSource` instead of `object`

`object` is too permissive — a junior could pass a service class, a collection, or `stdClass` into `from()` and the type system wouldn't complain. `ResourceDataSource` is a marker interface: zero methods, pure constraint. A Data DTO must explicitly opt in by implementing it, which communicates intent and makes eligible classes discoverable via IDE search.

The name ties the interface to the resource layer because that is its only valid use case. If a DTO is used outside the resource layer, it doesn't need this marker — the marker specifically signals "this DTO is shaped for API response construction."

### Why duplicated serialization is acceptable

Both `ResourceData` and `ComputedResourceData` implement identical serialization: `toArray()`, `transformValue()`, `jsonSerialize()`, `toResponse()`, `toResponseWithStatus()`. This is deliberate duplication — extracting a shared base class or trait would reintroduce the problems Options B and C were eliminated for.

The duplication trigger for extraction is explicit: if a third abstract variant emerges, extract the serialization into a shared mechanism. Until then, the duplication is documented with code comments in both classes.

### Deptrac change

`Data → Contract` and `ResourceData → Contract` added. Data DTOs implement the `ResourceDataSource` interface defined in Contracts. Both abstract resource classes implement `ResourceResponse` from Contracts. This is the clean dependency direction — implementations depend on abstractions, not the reverse. `Contract → Data` already exists (contracts reference Data DTOs in their signatures).

## Consequences

- Three `@phpstan-ignore method.childParameterType` suppressions eliminated from production code
- `collection()`, `EAGER_LOAD`, and `validateRelationsLoaded()` are structurally unavailable on DTO-sourced resources — impossible to call, not just "shouldn't call"
- New computed endpoints require the Data DTO to implement `ResourceDataSource` — typically a one-line addition since the DTO already exists
- Architecture tests reference `ResourceResponse` interface instead of `ResourceData` class for shared-type checks (3 spots)
- Serialization duplicated in two abstract classes — code comments mark the extraction trigger
- Deptrac gains two new edges: `Data → Contract` and `ResourceData → Contract`

## Enforcement

| What | Mechanism | Scope |
|------|-----------|-------|
| Every concrete resource class extends `ResourceData` or `ComputedResourceData` | `ResourceDataArchitectureTest` | `app/Http/Resources/` |
| Concrete resource classes are `final readonly` | `ResourceDataArchitectureTest` | `app/Http/Resources/` |
| Concrete resource classes have `from()` method | `ResourceDataArchitectureTest` | `app/Http/Resources/` |
| `EAGER_LOAD` required when nesting ResourceData | `ResourceDataArchitectureTest` | `app/Http/Resources/` |
| `ComputedResourceData` source types implement `ResourceDataSource` | PHPStan (generic constraint) | `app/Http/Resources/`, `app/Data/` |
| Data → Contract dependency boundary | Deptrac | `deptrac.yaml` |

## Resolved Questions

### Why not amend ADR-0006 instead of a new ADR?

**Resolved 2026-03-28.** ADR-0006 covers both FormRequest→DTO input handling and ResourceData output handling. This decision only affects the output side and introduces new infrastructure (interface, abstract class, Deptrac rule, architecture test changes). Amending ADR-0006 would make it cover too much ground. A separate ADR that references 0006 keeps both focused.

### Where does `ResourceDataSource` live — `App\Contracts` or `App\Data`?

**Resolved 2026-03-28.** `App\Contracts`. All interfaces go in Contracts for consistency, even if the implementing classes are in Data. This requires a Deptrac change (`Data → Contract`), but the dependency direction is correct — implementations depend on abstractions.

### Should `ComputedResourceData` have its own `collection()` that accepts arrays of DTOs?

**Resolved 2026-03-28.** No. None of the three current use cases need it — the controllers return single computed results or the Action already returns a list of DTOs that the controller maps. If a need arises, it can be added to `ComputedResourceData` later without breaking anything.

### Why `ResourceResponseInterface` / `ResourceDataSourceInterface` instead of `ResourceResponse` / `ResourceDataSource`?

**Resolved 2026-03-28.** The `App\Contracts` layer enforces an `Interface` suffix on all interfaces via `ContractArchitectureTest`. The ADR uses the shorter conceptual names for readability; the actual class names in code are `ResourceResponseInterface` and `ResourceDataSourceInterface`.

### Why remove `Responsable` from `ResourceData`?

**Resolved 2026-03-28.** `ResourceData` previously implemented Laravel's `Responsable` interface. Adding `ResourceResponseInterface` (which declares `toResponse(mixed $request = null)`) created a parameter type conflict — Larastan infers `Responsable::toResponse()` as `toResponse(Request $request)`, which is narrower than `ResourceResponseInterface::toResponse(mixed)`. Since nothing in the codebase type-hints against `Responsable` (controllers call `->toResponse()` explicitly), removing it was the clean fix.

## Open Questions

- If a third abstract variant emerges (beyond Model-sourced and DTO-sourced), should the serialization be extracted into a trait at that point, or into a shared abstract base? The trigger is defined; the extraction strategy is not.
