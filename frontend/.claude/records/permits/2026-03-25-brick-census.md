# Building Permit: The Brick Census

**Permit #:** 2026-03-25-brick-census
**Filed:** 2026-03-25
**Issued By:** Brick Master (Baseplate)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Add search, filter, and sort capabilities to the Parts page — the last major view without them. Follow the exact patterns established on the Sets and Storage overview pages.

## Scope

### In the Box

- Text search on parts (by part name, part number)
- Filter by color
- Sort options (name, quantity, color)
- "Orphan parts" visibility — parts in storage that don't belong to any owned set
- Empty state when filters match nothing

### Not in This Set

- Backend changes — all filtering is client-side on already-loaded data
- Pagination or virtual scrolling
- New API endpoints

## Acceptance Criteria

- [ ] Parts page has a search input that filters by part name and part number
- [ ] Parts page has a color filter (dropdown or chips)
- [ ] Parts page has sort controls (at minimum: name, quantity)
- [ ] Orphan parts (stored but not belonging to any owned set) are surfaced or filterable
- [ ] Empty state displays when no parts match active filters
- [ ] Follows existing search/filter patterns from Sets and Storage pages
- [ ] 100% test coverage on new code
- [ ] All quality gates pass (type-check, knip, lint, build, size)

## References

- Feature Brief: Muse's Ideas Ledger `docs/muse-ledger.md` — Idea #01
- Related Pattern: The Search & Sort Accessory Pack (Shipped, Idea Vault)

## Notes from the Issuer

This is Tier 1 / Spark fuel cost. The patterns are well-established from Sets and Storage — this should be a straightforward application of existing conventions. The "orphan parts" gift is the differentiator — make sure it's not just a filter afterthought but a visible, useful feature.

---

**Status:** Complete
**Journal:** _link to construction journal when filed_
