# Shipping Order: Harden Job Layer Infrastructure

**Order #:** 2026-03-29-harden-job-layer
**Filed:** 2026-03-29
**Issued By:** Logistics Director (CEO-approved)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

The new Job layer (introduced in `2026-03-28-queue-rebrickable-imports`) shipped clean but has three gaps identified during the Logistics Director's evaluation: a race condition in the concurrency guard, no architecture test enforcing Job conventions, and undocumented conventions for how Jobs interact with Models.

## Scope

### In the Crate

1. **Fix the race condition in `StartImportAction`** — the concurrency check (`whereIn` for pending/in-progress) and the `ImportJob` creation are not atomic. Two concurrent requests can both pass the check before either saves. Close this with a database-level guard (e.g., advisory lock, `INSERT ... WHERE NOT EXISTS`, or a `Cache::lock()` scoped to the family).

2. **Architecture test for the Job layer** — a Pest architecture test (`tests/Architecture/JobArchitectureTest.php` or added to an existing test file) that enforces:
   - All classes in `App\Jobs\` are `final`
   - All classes in `App\Jobs\` implement `ShouldQueue`
   - Any other conventions that emerge during implementation

3. **Refactor `ImportOwnedSetsJob` to inject Models into `handle()`** — Jobs CAN follow the Action pattern for Model queries. The constructor must be serializable (primitive IDs only), but `handle()` is resolved from the container. Inject `ImportJob` and `Family` Models into `handle()` and use `$model->newQuery()->findOrFail()` instead of static `ImportJob::query()` / `Family::query()` calls. This keeps Jobs consistent with Actions and makes them testable with mocked Models.

4. **Document Job conventions** — Add a note to CLAUDE.md's Warehouse Regulations establishing the Job pattern:
   - Constructor: primitive IDs only (serialization constraint)
   - `handle()`: inject Actions for business logic, inject Models for lookups (same as Action constructors)
   - Job body: thin async envelope — look up records, delegate to Action, update status. No business logic.

### Not on This Pallet

- Adding more Jobs (this order is about hardening the infrastructure, not expanding it)
- Redis/Horizon migration
- Real-time progress updates (WebSocket/broadcast)

## Acceptance Criteria

- [ ] Concurrent `POST /family-sets/import-from-rebrickable` requests from the same family cannot create duplicate pending ImportJobs — verified by a test that simulates the race condition
- [ ] Architecture test exists enforcing `final` and `ShouldQueue` on all Job classes
- [ ] `ImportOwnedSetsJob` injects Models into `handle()` and uses `$model->newQuery()` instead of static queries
- [ ] Job conventions are documented in CLAUDE.md Warehouse Regulations (constructor: IDs only; handle(): inject Actions + Models; body: thin envelope, no business logic)
- [ ] `composer test` passes — no regressions
- [ ] `composer phpstan` passes at level max
- [ ] `composer deptrac` passes — no boundary violations
- [ ] `composer test:arch` passes — including the new Job architecture test

## References

- Related Order: `2026-03-28-queue-rebrickable-imports` (introduced the Job layer)
- Shift Log: `.claude/records/journals/2026-03-28-queue-rebrickable-imports.md` (concerns section of LD evaluation)
- Deptrac config: `deptrac.yaml` (Job layer definition)

## Notes from the Issuer

**On the race condition:** The shipping order for the import feature suggested "Use a database unique constraint or `Cache::lock()`" for the concurrency guard. The Sorter chose a status check query, which was reasonable but incomplete — it's not atomic. The fix should be minimal: either wrap the check+insert in a database lock, or use an atomic insert pattern. Don't restructure the Action — just close the gap.

**On the architecture test:** Keep it simple. Two assertions (final, ShouldQueue) are enough for now. If Job conventions grow, the test grows with them.

**On the refactor:** The static query pattern was not a Laravel constraint — it was a shortcut. `handle()` is resolved from the container, same as an Action constructor. Inject Models there, use `$model->newQuery()`, keep the pattern consistent across the warehouse. This also makes Jobs testable with mocked Models if needed in the future.

**On documentation:** Add a "Queued Jobs" section to CLAUDE.md's Warehouse Regulations. Jobs are thin async envelopes — constructor holds serializable IDs, `handle()` injects dependencies from the container (Actions for logic, Models for lookups), body delegates to Actions. No business logic in the Job itself.

---

**Status:** Complete
**Shift Log:** `.claude/records/journals/2026-03-29-harden-job-layer.md`
