# Decision: Model Conventions — No Mass Assignment, Casts-Only Transformations

**Date**: 2026-03-22
**Feature**: Explicit property assignment and consistent attribute transformations
**Status**: accepted
**Transferability**: project-specific

## Context

Laravel provides `$fillable` and `$guarded` arrays for mass assignment protection, enabling `Model::create($data)` and `$model->fill($data)`. This project assigns model properties in Action classes, where the full context of what's being set is always available.

Separately, Laravel offers three mechanisms for attribute transformation: the `casts()` method, legacy `get*Attribute()`/`set*Attribute()` accessors/mutators, and the newer `Attribute::make()` API. All three can coexist on the same model, creating ambiguity about where a transformation happens.

The forces:
- Different Actions may set different subsets of properties on the same model — `$fillable` can't express this
- Mass assignment hides which properties are set — you have to cross-reference the `$fillable` array to know
- The Action pattern (ADR-0003) already centralizes property assignment — mass assignment adds a second indirection layer
- Attribute transformations should have a single, predictable location — not scattered across three mechanisms

## Options Considered

### Property Assignment

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **Explicit property assignment, no `$fillable`/`$guarded`** | Every assignment visible; auditable; different Actions can set different fields naturally | More verbose; no `Model::create()` convenience | **Chosen** — explicitness is the feature, not the cost |
| **`$fillable` whitelist** | Convenient; standard Laravel | Hides which properties are set per operation; accidentally exposing a field is easy; one list for all contexts | Eliminated — convenience isn't worth the opacity |
| **`$guarded` blacklist** | Even more convenient | Worse than `$fillable` — everything is assignable except the blacklist; one mistake exposes sensitive fields | Eliminated — inverted security model |
| **`$guarded = []` (unguarded)** | Maximum convenience | Maximum danger — every property is mass-assignable | Eliminated — not even considered seriously |

### Attribute Transformations

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **`casts()` method exclusively** | Single location for all transformations; declarative; handles encryption, enums, dates, and primitives | Cannot express computed attributes (derived from multiple columns) | **Chosen** — all current use cases are column-to-type mappings |
| **`Attribute::make()` for everything** | Modern API; supports get/set logic | Verbose for simple casts; mixes declaration with logic; harder to scan | Eliminated — over-engineering for simple type coercion |
| **Mix of `casts()` and accessors** | Use the right tool for each case | No single source of truth; developers must check multiple locations | Eliminated — consistency over flexibility |
| **No casting, transform in Actions** | Models stay pure data | Every Action must know about type transformations; duplicated logic | Eliminated — violates DRY |

## Decision

### No Mass Assignment

**No `$fillable` or `$guarded` on models.** Assign every property explicitly in Action classes:

```php
$model = $this->model->newInstance();
$model->family_id = $user->family_id;
$model->name = $data->name;
$model->save();
```

**Exception:** `User` model keeps `protected $guarded = ['password']` for security — Laravel's auth scaffolding interacts with User in ways that benefit from this guard. The architecture test explicitly skips User for both `$fillable` and `$guarded` checks.

### Casts-Only Attribute Transformations

All attribute transformations use the `casts()` method. No `get*Attribute()`/`set*Attribute()` methods and no `Attribute::make()` calls.

```php
// Family.php — encrypted token
protected function casts(): array
{
    return [
        'rebrickable_user_token' => 'encrypted',
    ];
}

// FamilySet.php — enum, date, integer
protected function casts(): array
{
    return [
        'status' => FamilySetStatus::class,
        'purchase_date' => 'date',
        'quantity' => 'integer',
    ];
}

// User.php — hashed password, datetime
protected function casts(): array
{
    return [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];
}
```

If a future requirement needs a computed attribute (derived from multiple columns), `Attribute::make()` would be appropriate — but that case hasn't arisen.

## Consequences

- Every property assignment is visible and auditable in the Action that performs it
- No `Model::create()` or `$model->fill()` calls — these bypass explicit assignment
- One location to check for all attribute transformations on any model
- Sensitive data (tokens, passwords) is automatically encrypted/hashed via cast declarations
- Enum casting is declarative — no manual `from()` calls scattered through Actions
- New developers must learn the pattern: `newInstance()` → assign properties → `save()`

## Enforcement

| What | Mechanism | Scope |
|------|-----------|-------|
| No `$fillable` on models (except User) | `ModelArchitectureTest` | `app/Models/` |
| No `$guarded` on models (except User) | `ModelArchitectureTest` | `app/Models/` |
| All models have `@property` PHPDoc annotations | `ModelArchitectureTest` | `app/Models/` |
| No accessor/mutator methods on models | Convention (candidate for architecture test) | `app/Models/` |

## Open Questions

- Should an architecture test scan models for `get*Attribute`, `set*Attribute`, or `Attribute::make()` patterns? Currently enforced by convention only. The risk is low (2-person team, clear pattern), but an automated check would close the gap.
