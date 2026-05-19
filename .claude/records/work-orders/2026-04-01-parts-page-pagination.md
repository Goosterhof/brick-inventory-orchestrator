# Building Permit: Parts Page Pagination Consumption

**Permit #:** 2026-04-01-parts-page-pagination
**Filed:** 2026-04-01
**Issued By:** General
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

The Parts page silently drops all results beyond the first page. The backend returns cursor-paginated responses (25 per page, max 100), but the frontend reads only `response.data` and discards all pagination metadata. Any family with more than 25 stored parts sees incomplete data.

## Scope

### In the Box

- Update `PartsPage.vue` to consume cursor pagination from `/family/parts`
- Implement a loading strategy for paginated results (infinite scroll, "load more" button, or increase `per_page` to backend max of 100)
- Handle the backend's flat envelope shape: `{data, next_cursor, prev_cursor, path, per_page}`

### Not in This Set

- Changing the backend pagination envelope shape (flat vs `meta`-wrapped) — deferred to Pagination ADR
- Adding a shared pagination composable or abstraction — premature until more paginated pages exist
- Modifying `GetFamilyPartsAction` or any backend code

## Acceptance Criteria

- [ ] Parts page displays all parts for a family, not just the first 25
- [ ] Pagination metadata (`next_cursor`, `prev_cursor`) is consumed correctly
- [ ] Loading state is visible while fetching additional pages
- [ ] Empty state still works correctly (0 parts)
- [ ] All existing tests pass; new tests cover pagination behavior
- [ ] Quality gauntlet passes (type-check, knip, coverage, build)

## References

- War Room Context: Discovered during cross-territory pagination analysis comparing BIO and a sibling territory's `ResourceData` pagination patterns
- Related Permit: `backend/.claude/records/permits/2026-03-28-cursor-pagination.md` (backend pagination implementation)
- Related Permit: `backend/.claude/records/permits/2026-03-28-response-caching.md` (ETag caching on paginated responses)

## Notes from the Issuer

The backend's `GetFamilyPartsAction` returns a `CursorPaginator` with `per_page=25` default and `max=100`. The controller passes it straight through via `new JsonResponse(...)`, producing a flat envelope (`next_cursor` at top level, not under `meta`). A war-room Pagination ADR is deferred — the fix here should work with the current flat envelope without assuming a future standard.

The backend also supports a `per_page` query parameter. The simplest tactical fix may be to request `per_page=100` and add a "load more" button only when `next_cursor` is non-null. A full infinite-scroll composable would be premature for a single consumer.

---

**Status:** Closed
**Journal:** `.claude/records/journals/2026-04-01-parts-page-pagination.md`
