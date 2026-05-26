# Decision: ComputedResourceData for DTO-Sourced API Responses

**Date**: 2026-03-28
**Feature**: Type-safe API responses from computed/aggregated data that doesn't originate from Eloquent Models
**Status**: accepted
**Transferability**: universal

## Context

ADR-0018 established `ResourceData` as the API response layer — `final readonly` classes extending an abstract `ResourceData<TModel of Model>` base with a `from(Model)` factory, `collection()` for lists, `EAGER_LOAD` for relationship management, and `validateRelationsLoaded()` for runtime safety.

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

> _(`ResourceDataSource` / `ResourceDataSourceInterface` references in this section are superseded by the 2026-04-21 amendment below — see [§Amended 2026-04-21](#amended-2026-04-21). The marker interface was retired once the Input/Result namespace split made eligible classes structurally discoverable by namespace.)_

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

> _(Both rows above are superseded by the 2026-04-21 amendment below. The marker-interface row was retired; the `Data → Contract` row was replaced by the Input/Result Deptrac rewrite — `InputDTO → Enum` only, `ResultDTO → Enum, Model`. See [§Amended 2026-04-21](#amended-2026-04-21).)_

## Resolved Questions

### Why not amend ADR-0018 instead of a new ADR?

**Resolved 2026-03-28.** ADR-0018 covers both FormRequest→DTO input handling and ResourceData output handling. This decision only affects the output side and introduces new infrastructure (interface, abstract class, Deptrac rule, architecture test changes). Amending ADR-0018 would make it cover too much ground. A separate ADR that references 0006 keeps both focused.

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

---

## Amended 2026-04-21

**Amendment status:** accepted
**Amendment driver:** PR #160 "DTO Input/Result migration" (standalone backend repo, merge `56cd7e9`) — see [Build Record `2026-04-21-dto-input-result-migration`](../../records/build-records/2026-04-21-dto-input-result-migration.md).
**Amendment filed retroactively:** 2026-05-26, under Work Order [`2026-05-05-audit-remediation-5-paper-trail`](../../records/work-orders/2026-05-05-audit-remediation-5-paper-trail.md). The amendment evolves the original decision; it does not invalidate it. The original Status / Decision / Consequences sections above are preserved verbatim, with brief supersedence notes pointing forward to this section where specific elements have been retired or replaced.

### What changed

Three substantive rule changes landed in the migration. They are not three independent amendments — they are one coherent evolution of the original decision, and each enables the next.

#### 1. The DataTransferObjects namespace split — Input vs Result by Action usage direction

The codebase's typed value objects are now split into two sibling namespaces:

- `App\DataTransferObjects\Input\<Domain>\` — shapes the Action **receives**. The producer is a `FormRequest::toDto()` or a Service that pre-builds an Action input. The consumer is `Action::execute()` as a parameter.
- `App\DataTransferObjects\Result\<Domain>\` — shapes the Action **returns**. The producer is `Action::execute()` as a return value. The consumer is a Controller (typically wrapping in a `ResourceData` or `ComputedResourceData`) or another Action that composes from this one.

**The rule is about direction at the Action boundary, not about content.** A DTO's name and contents are domain-driven; its namespace is dictated by which side of the Action boundary it crosses. The dependency content (Input DTOs may not reference Models; Result DTOs may carry `Collection<Model>`, a single `Model`, an `Enum`, or plain scalars) is a **consequence** of the rule, enforced at the Deptrac layer, not the rule itself.

The original ADR's `App\Data\` namespace was retired in favor of these two siblings. The folder no longer exists.

#### 2. `ResourceDataSourceInterface` retirement

`ResourceDataSourceInterface` (and the conceptual `ResourceDataSource` marker the original ADR introduced) was removed from `App\Contracts`. Every `implements ResourceDataSourceInterface` declaration on Data DTOs was deleted as part of the same migration.

The original ADR's justification for the marker was twofold: (a) constrain `ComputedResourceData`'s `TSource` generic to prevent arbitrary objects from being passed in, and (b) make eligible classes discoverable via IDE search. Both justifications fall away under the Input/Result split:

- (a) **Constraint:** the only thing that produces a `ComputedResourceData::from()` argument is an `Action::execute()` return value. Action returns now structurally live under `App\DataTransferObjects\Result\*` (enforced by `DataTransferObjectPlacementTest` — see §3 below). The eligibility is therefore enforced by the namespace location plus the architecture test, with no marker interface needed.
- (b) **Discoverability:** an IDE search for "what can I pass into `ComputedResourceData::from()`?" is now answered by scanning the `App\DataTransferObjects\Result\` tree — the same structural cue as before, without a marker keyword. The namespace itself is the eligibility signal.

`ComputedResourceData`'s generic constraint was therefore widened from `<TSource of ResourceDataSource>` to `<TSource of object>`. The actual production class in `backend/app/Http/Resources/ComputedResourceData.php` documents this widening in its `@template TSource of object` annotation. Each concrete subclass narrows the generic to the specific Result DTO it shapes via covariant `from()` signatures, which is LSP-compatible because each subclass is `final`.

Retiring a marker interface is more conservative than introducing one, and was done deliberately: the marker did real work for the two weeks between ADR-0010 (now ADR-0025) and the migration. Once the namespace split was in place, the marker became redundant — a second place to forget to update when a new computed-resource source class was introduced. The retirement closes the duplication.

#### 3. `DataTransferObjectPlacementTest` — three-angle architecture-test enforcement

A new Pest architecture test in `backend/tests/Architecture/DataTransferObjectPlacementTest.php` enforces the Input/Result placement rule from three angles, all anchored at the Action boundary and the FormRequest bridge:

| Angle | What it asserts | Why it exists |
|---|---|---|
| **Action return types** | Every `App\Actions\*::execute()` return type that is in the `App\DataTransferObjects\` namespace must be in `…\Result\`. | Catches the most common drift: a new Action declares its return type in the wrong namespace. |
| **Action `execute()` parameter types** | Every `App\Actions\*::execute()` parameter type that is in the `App\DataTransferObjects\` namespace must be in `…\Input\`. | Catches the inverse drift: a developer reuses a Result DTO as an Action input, which would smuggle a Model reference into a Model-free path. |
| **FormRequest `toDto()` return types** | Every `App\Http\Requests\*::toDto()` (declared directly, not inherited) must (a) declare an explicit return type and (b) if that return type is a DTO, it must be in `App\DataTransferObjects\Input\*`. | Catches the bridge between HTTP and the wing interior — if a FormRequest produces a Result DTO, the boundary has been crossed at the wrong layer. The explicit-return-type sub-check additionally enforces FormRequest discipline (no return-type-less `toDto()` methods). |

Each angle catches a class of drift the others would miss. Together they make the Input/Result rule structurally enforceable: a developer cannot accidentally place a DTO in the wrong namespace without one of the three tests flagging it.

The complementary Deptrac fence (`InputDTO → Enum` only; `ResultDTO → Enum, Model`) enforces the dependency-content **consequence** at the layer boundary, while `DataTransferObjectPlacementTest` enforces the **rule itself** at the reflection layer. The two mechanisms protect different invariants.

### Why the marker became redundant — the longer answer

The original ADR's "Why `ResourceDataSource` instead of `object`" sub-section anticipated a junior passing a service class, a collection, or `stdClass` into `ComputedResourceData::from()`. The marker interface was the type-system bouncer at the door.

After the Input/Result split, the bouncer's job is done by three other mechanisms working in concert:

1. **`DataTransferObjectPlacementTest`** — an Action cannot return a non-Result DTO, so a `ComputedResourceData::from()` call site downstream cannot be handed a non-Result DTO from an Action.
2. **Namespace location as eligibility signal** — `App\DataTransferObjects\Result\*` is the structurally enumerable set; an IDE finds it the same way it would have found `implements ResourceDataSourceInterface` previously.
3. **Concrete subclass type narrowing** — each `final ComputedResourceData` subclass declares `from(SpecificResultDTO)` covariantly. The base class accepts `object` because the generic is `<TSource of object>`, but the call site sees the narrowed `from()` and Larastan enforces it. A junior who tries to pass a `stdClass` into a subclass's `from()` is caught at the static-analysis layer, not at runtime.

The marker interface was a single point of enforcement. The three replacement mechanisms each handle a distinct concern (where the DTO lives, what its consumer expects, what static analysis sees). The new arrangement is structurally honest at three layers; the old arrangement was a runtime-shaped check (`implements`) doing static-analysis-shaped work.

### What the amendment does not change

- **`ResourceResponseInterface` survives.** The shared interface for all API response DTOs — `toArray()`, `jsonSerialize()`, `toResponse()`, `toResponseWithStatus()` — remains in `App\Contracts`, implemented by both `ResourceData` and `ComputedResourceData`. The amendment retires only the `ResourceDataSourceInterface` marker.
- **Two sibling abstract resource classes survive.** `ResourceData<TModel of Model>` for Model-sourced responses; `ComputedResourceData<TSource of object>` for DTO-sourced (now Result-DTO-sourced) responses. The duplication of serialization across both classes still stands, with the same extraction trigger documented in the original Consequences section.
- **Deptrac still enforces the dependency direction**, but with new edges: `InputDTO → Enum`, `ResultDTO → Enum, Model`, `Controller → ResultDTO, ResourceData`. The old `Data → Contract` row is gone with the old `Data` layer.

### Enforcement (amended)

| What | Mechanism | Scope |
|------|-----------|-------|
| Action return types that are DTOs live in `App\DataTransferObjects\Result\*` | `DataTransferObjectPlacementTest` (Pest, reflection-based) | `app/Actions/` |
| Action `execute()` parameter types that are DTOs live in `App\DataTransferObjects\Input\*` | `DataTransferObjectPlacementTest` | `app/Actions/` |
| FormRequest `toDto()` declares explicit return type, and DTO returns live in `Input\*` | `DataTransferObjectPlacementTest` | `app/Http/Requests/` |
| Input DTOs structurally cannot reference Models | Deptrac (`InputDTO → Enum` only) | `deptrac.yaml` |
| Result DTOs may carry Models and Enums | Deptrac (`ResultDTO → Enum, Model`) | `deptrac.yaml` |
| Every concrete resource class extends `ResourceData` or `ComputedResourceData`, is `final readonly`, has `from()`, declares `EAGER_LOAD` when nesting | `ResourceDataArchitectureTest` (unchanged from original ADR) | `app/Http/Resources/` |

### Open Questions

- **Should `Input/` DTOs gain a domain-folder discipline check?** The folders today (`Auth/`, `BrickIdentification/`, `Brickognize/`, `Family/`, `FamilySet/`, `Lego/`, `StorageOption/`) are conventional but not enforced. A future architecture test could assert that every class under `Input/` lives in a subfolder matching its `Action::execute()` consumer's domain. The cost is one more test and a small naming negotiation when an Action spans domains; the benefit is preventing the namespace from flattening over time. Not introduced in this amendment.

- **The marker interface retirement raises one residual question.** A future computed-resource source class might want to be fed by something that is **not** an Action return value (e.g., a Console command producing a DTO directly for a report endpoint). Today such a case would have no structural path to `ComputedResourceData::from()` because the consumer chain assumes Action → Controller → ResourceData. The amendment defers this — when the case appears, the resolution is most likely a second placement-test angle (Console return shapes are in `Result/` too) rather than reintroducing the marker.

