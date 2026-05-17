# Shipping Order: Queue Jobs for Rebrickable Imports

**Order #:** 2026-03-28-queue-rebrickable-imports
**Filed:** 2026-03-28
**Issued By:** Logistics Director (CEO-approved)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Move the Rebrickable collection import (`ImportOwnedSetsAction`) off the request cycle and onto the queue. A family importing 200+ sets from Rebrickable currently blocks the HTTP request for the entire duration — risking timeouts, tying up a worker, and giving the frontend nothing to show until it's done.

## Scope

### In the Crate

1. A queued job (e.g., `ImportOwnedSetsJob`) that wraps the existing import logic
2. The `POST /family-sets/import-from-rebrickable` endpoint returns immediately with a `202 Accepted` and a job/status identifier
3. A status tracking mechanism so the frontend can poll for import progress (e.g., `GET /family-sets/import-status`)
4. Progress tracking: how many sets discovered, how many processed, how many failed
5. Error handling: individual set failures don't abort the entire import — they're recorded and reported
6. A database-backed status record (import started, in progress, completed, failed) scoped to the family
7. Tests covering: job dispatch, status polling, partial failure handling, concurrent import prevention

### Not on This Pallet

- WebSocket/broadcast notifications for real-time progress (a future enhancement — polling is sufficient for now)
- Queuing of other operations (set parts sync, EAN lookups) — this order is scoped to collection import only
- Redis as queue driver (database driver is fine for this showcase; the architecture should be driver-agnostic)
- Retry/backoff strategy for the queue worker itself (Laravel's built-in retry is sufficient)
- Migration to Horizon (overkill for current scale)

## Acceptance Criteria

- [ ] `POST /family-sets/import-from-rebrickable` returns `202 Accepted` with a status identifier
- [ ] Import runs asynchronously via Laravel's queue system
- [ ] A status endpoint exists to check import progress (sets found, processed, failed)
- [ ] If a family already has an import in progress, a second request is rejected (409 Conflict)
- [ ] Individual set import failures are recorded but don't abort the batch
- [ ] `composer test` passes — no regressions
- [ ] `composer phpstan` passes at level max
- [ ] `composer deptrac` passes — no boundary violations
- [ ] Feature tests verify the full lifecycle: dispatch → status polling → completion
- [ ] Unit tests verify job logic with `Queue::fake()`

## References

- Existing implementation: `app/Actions/Sync/ImportOwnedSetsAction.php`
- Related Order: 2026-03-28-cursor-pagination (imports create the volume that pagination handles)

## Notes from the Issuer

The existing `ImportOwnedSetsAction` already does the heavy lifting — the job should delegate to it, not duplicate it. The key architectural question is where the status tracking lives.

Suggested approach:
- A new `ImportJob` model (family_id, status enum, total_sets, processed_sets, failed_sets, started_at, completed_at) — this is the status record the polling endpoint reads.
- The job updates this record as it progresses through the import.
- The Action itself remains synchronous internally — the job is what makes it async. This means the Action is still independently testable without queue infrastructure.

Deptrac consideration: The Job will need to reference the Action and the Model. Check where Jobs should sit in the boundary fences — likely alongside Actions in the orchestration layer, or as a new thin layer that depends on Action.

Concurrency guard: Use a database unique constraint or `Cache::lock()` to prevent duplicate imports per family. Prefer the database approach — it's more visible and survives cache clears.

---

**Status:** Complete
**Shift Log:** `.claude/records/journals/2026-03-28-queue-rebrickable-imports.md`
