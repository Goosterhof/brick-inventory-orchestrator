# Decision: Save-What-You-Can Import Atomicity with Honest Reporting

**Date**: 2026-02-11
**Feature**: Handling partial failures during paginated external API imports
**Status**: accepted
**Transferability**: universal

## Context

`ImportOwnedSetsAction` fetches a user's LEGO sets from the Rebrickable API (paginated) and persists them to the database. If the API fails mid-pagination (e.g., network timeout on page 3 of 5), the original implementation would:

1. Save pages 1-2 to the database (partial data)
2. Stop the pagination loop silently
3. Return a result summary that reported only the imported sets — **as if the import was complete**

The user had no way to know the import was partial. The summary was lying by omission. This is a data integrity problem: the system silently presents incomplete data as complete.

The forces:
- External APIs fail mid-stream — this is not an edge case, it's a certainty over time
- Each successfully imported set has value — discarding all progress on a partial failure wastes work
- The import is idempotent (re-running skips existing sets) — partial imports are recoverable
- Users must be informed when their data is incomplete, not left guessing
- Per-page transactions prevent half-processed pages from corrupting data

## Options Considered

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **Save-what-you-can with honest reporting** | Preserves partial data; user knows the import is incomplete; supports idempotent retry; no memory pressure | Frontend must handle three states (complete, partial, total failure); partial imports may confuse users who don't read warnings | **Chosen** — honest partial data is more useful than no data or dishonest complete data |
| **All-or-nothing (fetch all, then persist)** | Simple mental model; no partial state | A user with 1000+ sets gets nothing on a transient API failure; holds all pages in memory before writing | Eliminated — partial data is more valuable than no data |
| **Save-what-you-can with silent failure (status quo)** | Preserves partial data; simpler frontend | Misleading — a partial import reported as complete is worse than an honest partial import; user may never discover missing sets | Eliminated — lying by omission is a data integrity bug |

## Decision

Partial imports are acceptable. Every set saved is valuable. However, the user must be **clearly informed** when an import was incomplete.

### Result Data Structure

The import returns a structured result that explicitly signals completeness:

```php
final readonly class ImportOwnedSetsResultData
{
    public function __construct(
        public int $created,
        public int $updated,
        public int $skipped,
        public int $total,
        public bool $complete,    // Was the full import completed?
        public ?string $error,    // Error message if incomplete
    ) {}
}
```

### Per-Page Transactions

Each page's data is persisted within its own transaction:
- Successfully fetched pages are saved even if later pages fail
- Individual page processing is atomic (no half-processed pages)
- No need to hold all pages in memory before writing

```php
foreach ($paginatedResults as $page) {
    $this->connection->transaction(function () use ($page, &$created, &$updated, &$skipped) {
        foreach ($page as $userSet) {
            // upsert set, create/update family set...
        }
    });
}
```

### Partial-Failure Try-Catch

This decision is the origin of the **partial-failure resilience** exception documented in ADR-0015 (resolved question: "Why no try-catch in Actions?"). The import Action catches typed external API exceptions only when at least one page has already succeeded. Total failures (no pages processed) re-throw the exception. This is the only approved use of try-catch in Actions for external API pagination.

### Frontend Behavior

| Scenario | User sees |
|----------|-----------|
| Complete import | Success message with summary |
| Partial import | Warning message with summary + "Retry to get the rest" prompt |
| Total failure (0 sets) | Error message + retry option |

## Consequences

- Partial data preserved on failure — users keep what was successfully imported
- User is clearly informed of import status via the `complete` flag and optional error message
- Idempotent retry handles gaps naturally — re-running imports skips existing sets
- No memory pressure from holding large collections in memory
- Per-page transactions prevent half-processed pages
- Frontend must handle three distinct states instead of two
- Partial imports may confuse users who don't read the warning — mitigated by clear UX messaging

## Enforcement

| What | Mechanism | Scope |
|------|-----------|-------|
| Import result must include `complete` flag | Unit tests assert all three scenarios (complete, partial, total failure) | `tests/Unit/Actions/Sync/` |
| Per-page transactions (not one big transaction) | Unit tests verify partial-success preserves earlier pages | `tests/Unit/Actions/Sync/` |
| Try-catch only on typed API exceptions | ADR-0015 approved exception constraints; `ActionArchitectureTest` enforces no generic catch | `app/Actions/Sync/` |

## Open Questions

- If the API is consistently unreliable, users may get stuck in a loop of partial imports. Should there be a backoff mechanism or a "last successful full import" timestamp to help users gauge data freshness?
