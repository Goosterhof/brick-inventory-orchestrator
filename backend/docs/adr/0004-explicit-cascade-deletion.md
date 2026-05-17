# Decision: Explicit Cascade Deletion, Not Database-Level

**Date**: 2026-03-22
**Feature**: Safe deletion of parent records with dependent children
**Status**: accepted
**Transferability**: universal

## Context

When a parent record is deleted, child records need cleanup. Laravel supports both database-level cascade deletes (`onDelete('cascade')`) and application-level deletion logic. Database cascades are silent — a single `DELETE` wipes related data without the application knowing, bypassing any hooks, auditing, soft deletes, or custom cleanup.

The forces:
- Deletion must be visible and auditable at the application level
- Custom cleanup logic (e.g., recursive deletion of nested storage options) can't hook into database cascades
- If soft deletes are ever added, database cascades won't cascade the soft delete flag
- Missing cascade handling must be caught by automated tests, not production incidents
- Delete Actions need a reliable manifest of what to cascade — without a formal contract, each delete Action inspects relationships manually

## Options Considered

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **Explicit cascade in Actions with `cascadeRelations()` contract** | Visible; auditable; supports custom logic; testable; self-documenting | More code; requires discipline to maintain cascade lists | **Chosen** — visibility and testability outweigh verbosity |
| **Database-level `onDelete('cascade')`** | Zero application code; handled by PostgreSQL | Silent; invisible to application; can't hook for auditing or soft deletes; a single raw DELETE wipes everything | Eliminated — too dangerous for data integrity |
| **Eloquent model events (`deleting` listener)** | Keeps logic on the model | Event listeners are implicit; easy to miss; order-dependent; don't compose well for recursive deletion | Eliminated — implicit behavior in a codebase that values explicitness |
| **Soft deletes everywhere** | Nothing actually deleted | Doesn't address the cascade problem — soft-deleted parents with hard-referenced children create orphans | Eliminated — orthogonal to the cascade question |
| **A trait with auto-discovery via reflection** | No manual declaration needed | Fragile — relies on return type inspection, breaks with dynamic relationships, harder to override | Eliminated — magic over explicitness |
| **Annotations/attributes on relationship methods** | Co-located with each relationship | No single source of truth; easy to miss one; harder to test as a unit | Eliminated — scattered declaration |

## Decision

**No cascade deletes in migrations.** Never use `->onDelete('cascade')` or `->cascadeOnDelete()`. Handle deletion in Action classes via the `cascadeRelations()` model method.

### The `cascadeRelations()` Contract

Every Eloquent model declares a `public static function cascadeRelations(): array` that returns the names of relationships requiring cascade deletion. Only `HasMany` and `HasOne` relationships may appear. Architecture tests enforce three invariants:

1. **Every model has the method** — no model can opt out of declaring its cascade surface
2. **Every HasMany/HasOne is declared** — adding a relationship without declaring it in `cascadeRelations()` fails the test
3. **Every delete Action handles all declared relations** — the Action must reference each relation from the model's cascade list

```php
// Model declaration
class StorageOption extends Model
{
    public static function cascadeRelations(): array
    {
        return ['children', 'storageOptionParts'];
    }
}

// Models with no cascade relationships return an empty array — this forces
// the developer to actively consider the question
class Color extends Model
{
    public static function cascadeRelations(): array
    {
        return [];
    }
}
```

### Delete Actions

Delete Actions must handle all declared relations before deleting the parent:

```php
final readonly class DeleteStorageOptionAction
{
    public function execute(StorageOption $storageOption): void
    {
        $storageOption->load('children.storageOptionParts', 'storageOptionParts');

        $this->connection->transaction(function () use ($storageOption): void {
            $this->deleteRecursive($storageOption);
        });
    }

    private function deleteRecursive(StorageOption $storageOption): void
    {
        foreach ($storageOption->children as $child) {
            $this->deleteRecursive($child);
        }
        $storageOption->storageOptionParts()->delete();
        $storageOption->delete();
    }
}
```

## Consequences

- Models must declare `cascadeRelations()` listing all HasMany/HasOne relationships
- Delete Actions must explicitly handle each relation — the architecture test cross-references
- More code, but no surprise deletions — every cascade path is visible in version control
- Adding a new HasMany relationship without updating `cascadeRelations()` fails the architecture test immediately
- Every new `HasMany`/`HasOne` relationship immediately triggers a test failure until declared
- The pattern is self-documenting: reading `cascadeRelations()` tells you exactly what gets deleted

## Enforcement

| What | Mechanism | Scope |
|------|-----------|-------|
| No `onDelete('cascade')` in migrations | `MigrationArchitectureTest` | `database/migrations/` |
| No `cascadeOnDelete()` in migrations | `MigrationArchitectureTest` | `database/migrations/` |
| All models declare `cascadeRelations()` | `CascadeRelationArchitectureTest` | `app/Models/` |
| Only HasMany/HasOne in cascade list | `CascadeRelationArchitectureTest` | `app/Models/` |
| Every HasMany/HasOne is declared | `CascadeRelationArchitectureTest` | `app/Models/` |
| Delete Actions handle all declared relations | `CascadeRelationArchitectureTest` | `app/Actions/` |

## Open Questions

- Should `BelongsToMany` (pivot) relationships ever appear in `cascadeRelations()`? Currently excluded — pivot cleanup is handled differently. If a future model needs it, this decision may need revisiting.
