# Shipping Order: Async + Bulk Set Parts Sync

**Order #:** 2026-05-10-async-bulk-set-parts-sync
**Filed:** 2026-05-10
**Issued By:** Logistics Director (CEO-approved: "Async + bulk please")
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

The first request for a large set's parts (3000+ parts) blocks the HTTP request for tens of seconds — fanning ~150 paginated calls out to Rebrickable, then writing parts row-by-row through nested transactions in `StoreSetPartsAction` (~9000 queries for a 3000-part set). Subsequent requests are fast (parts already in DB), so the bottleneck is the cold-cache import. Move that import onto the queue and replace the per-row writes with bulk upserts. Clients hitting `GET /sets/{setNum}/parts` while a sync is in flight receive `202 Accepted` with status, then poll until `200 OK` is served from the now-populated DB.

## Scope

### In the Crate

1. **Per-set sync status** — a `parts_sync_status` enum column on `sets` (`pending` | `in_progress` | `completed` | `failed`) plus `parts_synced_at` and `parts_sync_failed_reason` columns. Migration adds them; `SetSyncStatus` enum lives in `app/Enums/`.
2. **`SyncSetPartsJob`** — a queued job (primitive `setId` constructor arg) that flips status to `in_progress`, calls `RebrickableService::fetchSetParts()`, hands the result to a refactored `StoreSetPartsAction`, then flips status to `completed` (or `failed` with reason).
3. **Bulk-upsert refactor of `StoreSetPartsAction`** — replace the per-row loop with: dedupe colors → single `upsert()` to `colors`; dedupe parts → single `upsert()` to `parts`; reload IDs by natural key; build pivot rows → single (chunked) `upsert()` to `set_parts`. ~9000 queries collapse to ~5.
4. **`GetSetPartsAction` becomes a dispatcher** — returns the `Set` plus its sync status. If the set has never synced, it upserts the set metadata synchronously (1 cheap HTTP call), creates the sync record, dispatches `SyncSetPartsJob`, returns with `pending` status. If sync is in progress, returns the current status. If completed, returns the loaded `Set`. The Action returns a `Result/Set/SetPartsResultData` DTO carrying the `Set` and the status.
5. **Controller updates** —
   - `SetController::parts()` returns `200` with `SetWithPartsResourceData` when status is `completed`; `202` with a small status payload (`{status, set_num, message}`) when `pending`/`in_progress`; `502` with the failure reason when `failed`.
   - `SetController::storageMap()` mirrors the same gate (it depends on the same data).
6. **Failure handling** — `SyncSetPartsJob::failed()` flips status to `failed` and stores a short reason. Failed sync can be retried by hitting the endpoint again (status `failed` triggers a new dispatch).
7. **Tests** —
   - Unit: `SyncSetPartsJob` with `Bus::fake()` / direct dispatch; `StoreSetPartsAction` bulk path with multiple unique + duplicate parts (verifies dedupe and idempotent re-run); `GetSetPartsAction` for each status branch.
   - Feature: `GET /sets/{setNum}/parts` returns 202 on first hit, 200 on second hit (after fake job runs), 502 on failed status.

### Not on This Pallet

- Pagination of the parts response itself (still a one-shot serialization). 3000-row JSON is acceptable; if it becomes a problem, file a follow-up for cursor pagination.
- WebSocket/SSE push notifications — clients poll the same endpoint.
- Retries beyond Laravel's default queue retry config.
- A separate `GET /sets/{setNum}/sync-status` endpoint — the parts endpoint itself reports status via 202 body.
- Splitting Rebrickable HTTP fan-out into parallel calls — the caching layer already handles second-fetch cost; a worker fetching pages serially is fine.
- Backfilling `parts_sync_status = completed` for already-imported sets via a data migration (the migration sets a sensible default per existing-state via `where setParts exists`).

## Acceptance Criteria

- [ ] First request for a never-synced large set returns `202 Accepted` immediately (well under 1 second)
- [ ] `SyncSetPartsJob` runs the full import via bulk upserts (≤ 10 queries for the persistence step, regardless of part count)
- [ ] Polling the same endpoint after the job completes returns `200 OK` with the full parts list
- [ ] If the job fails, the endpoint returns `502` with the reason; a fresh request restarts the sync
- [ ] Re-syncing a set with existing parts updates quantity/element_id correctly (idempotent upsert)
- [ ] Concurrent first-requests don't double-dispatch the job (status flip from `pending` → `in_progress` is the guard)
- [ ] `storageMap` endpoint mirrors the 202 behavior when sync is incomplete
- [ ] `composer test` passes — no regressions
- [ ] `composer phpstan` passes at level max
- [ ] `composer deptrac` passes — no boundary violations
- [ ] `composer test:arch` passes — DTOs land in the right namespace, Job stays primitive-constructor

## References

- Precedent: `.claude/records/permits/2026-03-28-queue-rebrickable-imports.md` (same async pattern, different domain)
- ADR-0003 (Actions for business logic, Services HTTP-only)
- ADR-0010 (Result DTOs for typed Action returns)
- Existing slow path: `app/Actions/Sync/StoreSetPartsAction.php:27-70`
- Existing entry: `app/Actions/GetSetPartsAction.php:21-34`

## Notes from the Issuer

The dedupe step in the bulk upsert matters: Rebrickable can return multiple rows for the same `(part, color, is_spare)` triple within a single set (rare, but it happens with spare-part variants). Reduce the input list to one row per natural key before the `set_parts` upsert — last-write-wins is fine, the natural key collision is the warning sign that the API delivered duplicates.

The status flip from `pending` to `in_progress` happens inside the Job's `handle()`, not at dispatch — that way a queue backlog doesn't lie about whether work has actually started. The dispatcher sets `pending`; the worker sets `in_progress`.

Use `Carbon::now()` (or the `now()` helper via `CarbonImmutable`) for timestamps in the bulk upsert payload — Eloquent's `upsert()` does NOT touch timestamps automatically.

---

**Status:** Completed
**Shift Log:** [.claude/records/journals/2026-05-10-optimize-parts-loading-8mjjn.md](../journals/2026-05-10-optimize-parts-loading-8mjjn.md)
