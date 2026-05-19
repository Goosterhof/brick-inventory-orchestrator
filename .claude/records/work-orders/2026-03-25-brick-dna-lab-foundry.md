# Shipping Order: The Brick DNA Lab

**Order #:** 2026-03-25-brick-dna-lab
**Filed:** 2026-03-25
**Issued By:** Brick Master (Baseplate)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Build a collection analytics endpoint that computes a family's "Brick DNA" — top colors, top part types, rarest parts, and a diversity score. All data derives from existing `storage_option_parts` joined with `parts` and `colors`, scoped to the family.

## Scope

### In the Crate

- New `GET /family/brick-dna` endpoint (or similar — Logistics Director proposes the route)
- New Action computing the analytics: top 10 colors, top 10 part types, rarest parts, diversity score
- ResourceData shaping the response
- FormRequest if needed (probably not for a GET with no params)
- Policy/authorization — family-scoped

### Not on This Pallet

- Frontend consumption — separate building permit to the Plate
- Historical/trend data (no new tables or event tracking)
- Comparison between families
- Caching layer (premature — revisit if performance is an issue)

## Acceptance Criteria

- [ ] New endpoint returns top 10 most-owned colors (with color name, hex, count)
- [ ] Returns top 10 most-owned part types (with part name, category, count)
- [ ] Returns rarest parts (least-common part+color combinations in storage)
- [ ] Returns a collection diversity score (algorithm documented in the Action)
- [ ] All data scoped to the authenticated user's family
- [ ] Action follows warehouse regulations (final readonly, single execute(), no facades)
- [ ] ResourceData follows conventions (final readonly, static from())
- [ ] 100% unit test coverage on the Action
- [ ] 80% feature test coverage on the controller endpoint
- [ ] Mutation testing passes at 75% minimum
- [ ] All quality gates pass (phpstan, deptrac, lint, test)

## References

- Feature Brief: Muse's Ideas Ledger `docs/muse-ledger.md` — Idea #06
- Related Permit: `frontend/.claude/records/permits/2026-03-25-brick-dna-lab.md` (Plate side)

## Notes from the Issuer

Tier 2 / Burn fuel cost. The queries join `storage_option_parts` → `parts` → `colors` scoped by the family's storage options. Watch the query efficiency — eager loading is critical. The diversity score algorithm is up to the Head Sorter (Shannon diversity index, simple ratio, or similar) but document it in the Action so the Plate team understands what the number means.

The Plate is blocked on this — they need the response contract before they can build the analytics page. Prioritize agreeing on the ResourceData shape early.

---

**Status:** Open
**Shift Log:** _link to shift log when filed_
