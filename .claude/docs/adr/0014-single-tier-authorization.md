# Decision: Single-Tier Authorization with Three-Layer Defense

**Date**: 2026-03-22
**Feature**: Authorization model and tenant isolation for family-scoped resource access
**Status**: accepted
**Transferability**: project-specific

## Context

The system isolates data by "families" in a shared database. Every request touching a family-owned resource must verify both tenant ownership and permission to act. A two-tier model (roles + permissions) was evaluated, but families are small groups (parents and children), not enterprise orgs with role hierarchies.

The forces:
- Tenant isolation (does this resource belong to your family?) is separate from permission (can you do this action?)
- Authorization must be enforced structurally — a missed check in one controller leaks data
- Controllers must stay thin (ADR-0021) — authorization logic shouldn't live in controller methods
- The system needs a "family head" concept (one member with elevated privileges) but not a full role hierarchy
- Tenant isolation must be automatic, not opt-in per endpoint
- Failed ownership checks should return 404 (not 403) to avoid leaking resource existence

## Options Considered

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **Single-tier policies with three-layer defense in depth** | Simple; no extra tables; policies handle family-head logic; middleware handles tenant isolation | Limited if role complexity grows; policies must be applied to every route | **Chosen** — matches the actual threat model without over-engineering |
| **Two-tier roles + permissions (Spatie Permission)** | Flexible; industry standard for complex orgs | Overkill — families have 2-5 members, not departments with managers; adds role/permission tables and management UI | Eliminated — solving enterprise problems for a family app |
| **Gate-based authorization in controllers** | Quick to implement; no policy classes | Scatters authorization logic; violates thin controller principle; no structural enforcement | Eliminated — too easy to forget |
| **Middleware-only (no policies)** | All authorization in one layer | Can't express per-action permissions (e.g., only head can delete); middleware becomes complex | Eliminated — insufficient granularity |
| **Global scope on models** | Completely automatic, even for manual queries | Magic — hard to debug, easy to accidentally bypass with `withoutGlobalScopes()`, complicates admin tooling | Eliminated — too much hidden behavior |
| **Manual checks in every controller** | Simple, explicit | Guaranteed to be forgotten; no enforcement mechanism | Eliminated — the failure mode this pattern prevents |

## Decision

Use a **single-tier** policy model with three-layer defense in depth:

1. **`EnsureFamilyOwnership` middleware** — tenant isolation. Returns 404 if the route-bound model doesn't belong to the user's family. Applied to all authenticated routes.
2. **Policies** — permission checks. `final readonly`, auto-discovered, enforced via `->can()` on routes. Handle logic like "only the family head can delete."
3. **FormRequest closure rules** — body parameter validation the middleware can't reach (e.g., verifying a `parent_id` in the request body belongs to the user's family).

Authorization lives **entirely in the routing layer**. Controllers must not inject `Gate` or call `->authorize()`.

```php
// Route with explicit authorization
Route::delete('storage-options/{storageOption}', [StorageOptionController::class, 'destroy'])
    ->can('delete', 'storageOption');

// Policy — simple boolean check
final readonly class FamilySetPolicy
{
    public function delete(User $user, FamilySet $familySet): bool
    {
        return $familySet->family_id === $user->family_id;
    }
}
```

### Family-Scoped Multi-Tenancy

Models that belong to a family implement the `BelongsToFamilyInterface`, which exposes `getFamilyId(): int`. The `EnsureFamilyOwnership` middleware iterates over route-bound parameters and checks any implementor against the user's `family_id`.

```php
// The contract
interface BelongsToFamilyInterface
{
    public function getFamilyId(): int;
}

// Model implementation
class StorageOption extends Model implements BelongsToFamilyInterface
{
    public function getFamilyId(): int
    {
        return $this->family_id;
    }
}

// Middleware — applied to all tenant routes
foreach ($request->route()?->parameters() ?? [] as $parameter) {
    if ($parameter instanceof BelongsToFamilyInterface
        && $parameter->getFamilyId() !== $user->family_id) {
        return response()->json(['error' => 'Not found'], 404);
    }
}
```

All authenticated, family-scoped routes use the `family.ownership` middleware group in `routes/api.php`.

**Note:** The `User` model has a `family_id` column but intentionally does **not** implement `BelongsToFamilyInterface`. Users are the authenticated agents — they are not tenant-owned objects. The middleware should not check `User` against itself.

## Consequences

- No role tables, no permission tables, no Spatie Permission package
- Every authorized route needs `->can()` middleware explicitly — omitting it is caught by architecture tests
- Policies are `final readonly` with boolean returns — simple, testable, no side effects
- Controllers never touch authorization — the routing layer handles it before the request reaches the controller
- The "family head" concept is a simple property check, not a role assignment
- Adding a new family-owned model requires implementing `BelongsToFamilyInterface` — the middleware handles the rest
- Route-bound models are automatically checked — no per-controller boilerplate
- Manual queries in Actions are NOT covered by this middleware — Actions must still scope queries by `family_id` (defense in depth)
- 404 masking prevents enumeration attacks but means ownership failures don't appear in authorization logs

## Enforcement

| What | Mechanism | Scope |
|------|-----------|-------|
| Policies are `final readonly` | `PolicyArchitectureTest` | `app/Policies/` |
| Every authorized route has `can:` middleware | `RoutingArchitectureTest` | `routes/api.php` |
| No `Gate` injection in controllers | `PolicyArchitectureTest` | `app/Http/Controllers/` |
| No `->authorize()` calls in controllers | `PolicyArchitectureTest` | `app/Http/Controllers/` |
| Tenant isolation via middleware | `EnsureFamilyOwnership` middleware | All `family.ownership` routes |
| Middleware applied to tenant routes | `routes/api.php` group declaration | `routes/api.php` |
| Models with `family_id` implement interface | Convention (candidate for architecture test) | `app/Models/` |

## Open Questions

- Should an architecture test enforce that every model with a `family_id` column implements `BelongsToFamilyInterface`? Currently this is convention only. The `User` model would need an explicit exemption. A test would close the gap.
