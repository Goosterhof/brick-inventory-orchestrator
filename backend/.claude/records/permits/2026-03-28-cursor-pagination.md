# Shipping Order: Cursor Pagination for List Endpoints

**Order #:** 2026-03-28-cursor-pagination
**Filed:** 2026-03-28
**Issued By:** Logistics Director (CEO-approved)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Add cursor-based pagination to all list endpoints that currently return unbounded collections. A family with 500 sets or thousands of parts in storage should get predictable, performant responses — not a full table dump.

## Scope

### In the Crate

1. Cursor pagination on `GET /family-sets` (the highest-volume list endpoint)
2. Cursor pagination on `GET /storage-options`
3. Cursor pagination on `GET /storage-options/{id}/parts`
4. Cursor pagination on `GET /family/parts`
5. A consistent pagination response envelope across all paginated endpoints (cursors, per_page, next/prev links)
6. Configurable `per_page` query parameter with a sensible default (25) and a max cap (100)
7. Tests covering: default pagination, custom per_page, max cap enforcement, empty results, cursor navigation

### Not on This Pallet

- Offset-based pagination (cursor is the correct choice for datasets that change between requests)
- Pagination on single-resource endpoints (`show`, `completion`, `stats`, `brick-dna`)
- Pagination on `GET /family/members` (bounded by family size, realistically < 20)
- Frontend integration or documentation updates
- Caching of paginated responses (separate order)

## Acceptance Criteria

- [ ] All four list endpoints return paginated responses with cursor metadata
- [ ] Default page size is 25; `per_page` query parameter accepted up to 100
- [ ] Requests without pagination params return the first page (not the full collection)
- [ ] `composer test` passes — no regressions
- [ ] `composer phpstan` passes at level max
- [ ] `composer deptrac` passes — no boundary violations
- [ ] Feature tests verify pagination behavior on each endpoint
- [ ] Architecture tests still pass (pagination logic lives in Actions, not Controllers)

## References

- Related Order: 2026-03-28-queue-rebrickable-imports (import creates the volume that makes pagination necessary)
- Related Order: 2026-03-28-response-caching (caching strategy must account for paginated responses)

## Notes from the Issuer

Laravel's `cursorPaginate()` on Eloquent is the natural fit here. The Actions should accept pagination parameters (cursor, per_page) and return `CursorPaginator` instances. Controllers pass through the paginator — Laravel handles the response envelope automatically.

Key decisions for the Sorter:
- The `per_page` validation can live in the existing Form Requests or as typed parameters on the Action. Given ADR-0006, a lightweight approach (typed params with defaults) may be cleaner than creating FormRequests for every index endpoint.
- `GET /family/parts` is the trickiest — it aggregates across sets. Check whether it can use `cursorPaginate()` or needs a different approach.
- Ensure cursor stability: the cursor column should be a unique, ordered column (typically `id` or a composite).

---

**Status:** Open
**Shift Log:** _link to shift log when filed_
