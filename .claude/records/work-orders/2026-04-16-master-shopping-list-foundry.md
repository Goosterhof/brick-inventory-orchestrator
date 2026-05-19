# Shipping Order: The Master Shopping List (Brick Side)

**Order #:** 2026-04-16-master-shopping-list
**Filed:** 2026-04-16
**Issued By:** CEO
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Build a bulk endpoint that returns cross-set missing-parts shortfalls for all of a family's non-wishlist sets in a single query. The Plate needs this to render a master shopping list and generate a batched BrickLink wanted-list / CSV export — without firing N per-set storage-map requests.

## Scope

### In the Crate

- New `GET /family-sets/missing-parts` endpoint returning aggregated shortfalls grouped by `(part_num, color_id)` across all non-wishlist sets in the authenticated user's family
- New Action (suggested name: `GetFamilyMissingPartsAction`) that joins `family_sets → sets → set_parts` aggregated against `storage_option_parts`, grouped by part+color
- Each response entry describes one unique part+color shortfall. Suggested shape (final naming at Head Sorter's discretion, consistent with existing Resources):
  - `partNum` (string)
  - `colorId` (int)
  - `partName` (string, from `parts.name`)
  - `colorName` (string, from `colors.name`)
  - `colorHex` (string, from `colors.rgb` — matches the convention used elsewhere)
  - `partImageUrl` (nullable string, from `parts.image_url` if present in the schema)
  - `quantityNeeded` (int — sum of `set_parts.quantity` across all non-wishlist family sets that include this part+color, weighted by `family_sets.quantity`)
  - `quantityStored` (int — sum of `storage_option_parts.quantity` for this part+color across this family's containers)
  - `shortfall` (int — `max(0, quantityNeeded - quantityStored)`)
  - `neededBySetNums` (array of `set_num` strings — the owned sets that need this part; caller uses this to drive "needed by X sets" display)
- Rows where `shortfall` is zero MUST NOT be included in the response — this is a shortfall list, not a requirements list
- Scoped to the authenticated user's family
- Wishlist sets excluded (no need to source parts for sets you don't own)
- Policy authorization per ADR-0002 (any authenticated family member can view)
- If a family has sets whose `set_parts` were never fetched from Rebrickable, they contribute nothing to the aggregation. Surface this as a top-level `unknownFamilySetIds: string[]` field (array of family_set IDs with no `set_parts` rows) so the Plate can be honest: "3 of your sets have unknown shortfalls — sync from Rebrickable to include them." An empty array means fully knowable.

### Not on This Pallet

- The frontend page, BrickLink wanted-list XML generation, or CSV export — separate building permit for the Plate
- Any per-part detail endpoint (already covered by existing `/sets/{setNum}/parts` and part lookup flows)
- Filtering / pagination — keep the first cut simple; a family with 50k part requirements still aggregates to a bounded unique-part-color list that a single response can hold
- Caching — let the clean bulk query carry this until measured evidence demands otherwise
- Changes to existing endpoints

## Acceptance Criteria

- [ ] `GET /family-sets/missing-parts` returns shortfalls for all non-wishlist family sets in one response
- [ ] Each entry includes `partNum`, `colorId`, display fields (name, color name, hex, optional image), `quantityNeeded`, `quantityStored`, `shortfall`, and `neededBySetNums`
- [ ] `shortfall` is `max(0, quantityNeeded - quantityStored)` and entries with `shortfall == 0` are excluded from the list
- [ ] `quantityNeeded` correctly multiplies `set_parts.quantity` by the `family_sets.quantity` (e.g., owning 2 copies of a set needs 2× the parts)
- [ ] Response includes top-level `unknownFamilySetIds: string[]` for sets whose parts have never been fetched; empty array when knowable
- [ ] Cross-family isolation verified (family A cannot see family B's shortfalls)
- [ ] Endpoint has `.can()` middleware per ADR-0002
- [ ] Wishlist sets are excluded from both the aggregation and `unknownFamilySetIds`
- [ ] Aggregation runs as SQL (GROUP BY in the query), not as PHP-level summation over collections — a family with 50 sets × 500 parts should produce one bounded aggregation query, not N or N² queries
- [ ] Unit tests for the Action with edge cases: empty family, all wishlist, single set partial shortfall, multi-set overlapping shortfalls (part in two sets stacks), fully satisfied collection returns empty list, set with no `set_parts` contributes to `unknownFamilySetIds`
- [ ] Feature tests for the endpoint (auth, authorization, response shape, cross-family isolation)
- [ ] `composer test` passes with no new risky tests
- [ ] `composer phpstan` passes at level max
- [ ] `composer deptrac` passes with 0 violations
- [ ] `composer test:arch` passes (Action, Resource, Routing architecture rules)
- [ ] Mutation testing survives the 76% threshold on the new Action

## References

- Feature Brief: `docs/idea-vault.md` — The Master Shopping List
- Related Order: `backend/.claude/records/permits/2026-03-26-set-completion-gauge.md` — the precedent bulk endpoint this shipment should mirror in structure (Action + Resource + routing + test shape)
- Related: `GET /sets/{setNum}/storage-map` (existing per-set endpoint; this shipment promotes that logic to cross-set aggregation)
- Related: `GET /family-sets/completion` (existing bulk endpoint, pattern reference)
- Governance: ADR-0002 (authorization), ADR-0003 (Action architecture), ADR-0004 (cascade deletion — not directly affected), ADR-0006 (DTOFormRequest / ResourceData — only ResourceData needed here, no FormRequest), ADR-0008 (explicit routes, not apiResource)

## Notes from the Issuer

This is a direct spiritual sibling of the Set Completion Gauge endpoint that shipped on 2026-03-26. Use that Action and its tests as the architectural reference — same query-at-the-database-not-in-PHP discipline, same Resource shape conventions, same feature-test structure, same null/unknown honesty.

**The key design decision is the unknowns contract.** A family with some sets not yet synced from Rebrickable is the common case — the Plate must be able to tell the user honestly that the shopping list is "everything we know about," and which sets are blind spots. Do not silently drop unsynced sets from the response; surface them in `unknownFamilySetIds`. This keeps the Plate from presenting a list that looks comprehensive but isn't.

**On multiplicity:** A family set has a `quantity` field (owning multiple copies of the same set). Multiplication matters: two copies of a set with 500 parts needs 1000 parts, not 500. Verify the aggregation respects this.

**On part image URLs:** if `parts.image_url` isn't consistently populated in the current schema, return `null` — don't fabricate. The Plate can fall back to a placeholder.

**Non-goal — performance tuning:** A clean aggregation query should handle realistic collections (100 sets, ~50k part requirements) without caching. Don't pre-optimize. If profiling later shows this endpoint as a hotspot, a separate shipping order handles it.

Once this ships, the next shipping order is the Plate side: the `/parts/missing` page with per-row display, aggregate summary ("you're short 312 parts across 47 sets"), BrickLink wanted-list export, and CSV export. That permit will be filed by the CFO after this one lands.

---

**Status:** Complete
**Shift Log:** `.claude/records/journals/2026-04-16-master-shopping-list.md`
