# Shipping Order: The Reverse Lookup Lens (Brick Side)

**Order #:** 2026-04-29-reverse-lookup-lens
**Filed:** 2026-04-29
**Issued By:** CEO
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Ship a per-part usage lookup endpoint: `GET /family/parts/{partNum}/{colorId}/usage`. For a given (part, color) pair, return the authenticated family's non-wishlist sets that include that part, with quantity needed, quantity already in storage, and shortfall. Answers "I found this brick on the floor — where does it belong?" The frontend companion is the Plate-side Reverse Lookup Lens permit (`frontend/.claude/records/permits/2026-04-29-reverse-lookup-lens.md`).

## Scope

### In the Crate

- New Action: `app/Actions/Family/GetFamilyPartUsageAction.php` — accepts `(Family $family, string $partNum, int $colorId)`, returns a Result DTO carrying part metadata and a `Collection<FamilyPartUsageEntry>`. Bounded SQL: aggregate NEEDED per `(family_set_id, part_num, color_id)` filtered to the requested pair, aggregate STORED across the family's storage tree, plus a single lookup for part/color metadata. Mirror the bounded-query discipline from `GetFamilyMissingPartsAction`.
- New Result DTOs in `app/DataTransferObjects/Result/FamilyPart/`:
  - `FamilyPartUsageData` — envelope carrying part metadata + `Collection<FamilyPartUsageEntry>`
  - `FamilyPartUsageEntry` — `familySetId`, `setNum`, `setName`, `status` (`FamilySetStatusEnum`), `quantityNeeded`, `quantityStored`, `shortfall`
- New Resource: `app/Http/Resources/FamilyPartUsageResourceData.php` — `ComputedResourceData` per ADR-0010, sourced from the Result DTO.
- New Route: `Route::get('/family/parts/{partNum}/{colorId}/usage', [FamilyController::class, 'partUsage'])` with the existing `viewParts` policy on `Family` and `etag` + `cache.headers:private;max_age=60` middleware (matches sibling family endpoints).
- New Controller method on `FamilyController` — thin, method-injected, returns `FamilyPartUsageResourceData::from(...)`.
- Tests:
  - Unit: 100% coverage on the Action — empty result, single set, multi-set, wishlist exclusion, unknown part (returns envelope with empty `usages`), part exists but family owns no sets needing it.
  - Feature: 90%+ coverage on the controller — happy path, 401 unauthenticated, 403 cross-family access, etag honoured.
  - Architecture tests already enforce DTO placement, ResourceData shape, route policy presence — no new arch tests needed.

### Not on This Pallet

- No frontend work — see the Plate permit.
- No new policy — reuse `viewParts` on `Family`.
- No "where this part is stored" payload — frontend already has `/family/parts` for the storage map. This endpoint answers *which sets need it*, not *where it lives*.
- No filtering, sorting, or pagination — the result set is bounded by how many of the family's sets contain this specific part+color, which is small. If a future need surfaces, it earns its own permit.
- No cross-color rollup — `colorId` is part of the lookup key. Same part in a different color = different lookup.

## Acceptance Criteria

- [ ] `GET /family/parts/{partNum}/{colorId}/usage` returns 200 with the documented envelope for an authenticated family head or member.
- [ ] Wishlist `family_sets` are excluded from `usages` (consistent with Master Shopping List).
- [ ] Action runs at most three queries regardless of how many sets need the part (no N+1).
- [ ] Unknown `(partNum, colorId)` returns 200 with the part metadata if present (or null fields if part is unknown to the catalog) and an empty `usages` collection — matches the frontend's "no sets need this" empty state.
- [ ] Unauthenticated → 401. Authenticated user with a different `family_id` cannot see another family's usage data (covered by `viewParts` policy).
- [ ] All gauntlet stages green: `composer lint:test`, `composer phpstan`, `composer deptrac`, `composer test:arch`, `composer test`, `composer mutation` (≥76% on the new Action).

## References

- Idea Vault: `docs/idea-vault.md` → "The Reverse Lookup Lens"
- Related Order: `.claude/records/permits/2026-04-16-master-shopping-list.md` (companion bulk endpoint pattern)
- Related Permit (Plate): `frontend/.claude/records/permits/2026-04-29-reverse-lookup-lens.md`
- ADRs: 0003 (Actions for business logic), 0010 (ComputedResourceData), 0008 (explicit routes), 0002 (family-scoped multi-tenancy)

## Notes from the Issuer

The Apprentice flagged this as potentially "30-seconds-of-delight" rather than everyday utility — so keep scope tight. No backend filters or sorts the frontend isn't shipping. The endpoint is dead-simple SQL aggregation; resist the urge to over-engineer the response shape. Mirror `GetFamilyMissingPartsAction`'s structure — the Sorter who built that action will recognize the shape immediately.

One judgment call worth flagging during the shift: whether `partUsage` should return 404 or empty `usages` when the part exists in the catalog but no family set needs it. The permit calls for **200 with empty usages** because the frontend's "I clicked a row that exists in our parts list" flow guarantees the part is known to the family — a 404 would only happen for a manually-typed URL, and even then, "no sets need this" is the honest answer. If the Sorter has evidence to argue for 404, raise it in the shift log.

---

**Status:** Completed
**Shift Log:** `.claude/records/journals/2026-04-29-reverse-lookup-lens.md`
