# Shipping Order: The Set Completion Gauge (Brick Side)

**Order #:** 2026-03-26-set-completion-gauge
**Filed:** 2026-03-26
**Issued By:** CEO
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Build a bulk endpoint that returns build completion percentages for all of a family's sets in a single query. The Plate needs this to show completion badges on the sets overview without firing N+1 storage map requests.

## Scope

### In the Crate

- New `GET /family-sets/completion` endpoint returning per-set completion stats
- New Action computing completion by joining family_sets → sets → set_parts against storage_option_parts, grouped by set
- Response shape: array of `{familySetId, setNum, totalParts, storedParts, percentage}` (or equivalent)
- Scoped to the authenticated user's family
- Wishlist sets excluded from completion (they have no meaningful build status)
- Policy authorization (any family member can view)

### Not on This Pallet

- The frontend display — separate building permit to the Plate
- Per-part breakdown (that's the existing storage map endpoint)
- Caching or performance optimization beyond a clean query
- Changes to existing endpoints

## Acceptance Criteria

- [ ] `GET /family-sets/completion` returns completion data for all non-wishlist family sets
- [ ] Each entry includes total unique part+color combinations needed and how many are in storage
- [ ] Percentage is computed correctly (storedParts / totalParts * 100, capped at 100)
- [ ] Sets with no parts loaded (never fetched from Rebrickable) return null or 0 gracefully
- [ ] Cross-family isolation verified (family A cannot see family B's completion)
- [ ] Endpoint has `.can()` middleware per ADR-0002
- [ ] Unit tests for the Action with edge cases (empty family, set with no parts, fully complete set, partially complete)
- [ ] Feature tests for the endpoint (auth, authorization, response shape)
- [ ] `composer test` passes with no new risky tests
- [ ] `composer phpstan` passes at level max
- [ ] `composer deptrac` passes with 0 violations

## References

- Feature Brief: `docs/idea-vault.md` — The Set Completion Gauge
- Related: `GET /sets/{setNum}/storage-map` (existing per-set endpoint this replaces at bulk level)
- Related Permit: `frontend/.claude/records/permits/2026-03-26-set-completion-gauge.md` (Plate side)

## Notes from the Issuer

The key design decision is the query strategy. The storage map endpoint currently fetches per-set, requiring the Plate to call it N times. This endpoint should compute completion for ALL family sets in one or two queries — join set_parts against storage_option_parts grouped by (family_set_id or set_id). Consider whether sets whose parts have never been fetched from Rebrickable (no rows in set_parts) should return `null` (unknown) vs `0` (no parts stored). Null is more honest.

---

**Status:** Open
**Shift Log:** _link to shift log when filed_
