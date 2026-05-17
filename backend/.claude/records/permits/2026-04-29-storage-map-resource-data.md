# Shipping Order: Wrap Storage Map Endpoint in ResourceData

**Order #:** 2026-04-29-storage-map-resource-data
**Filed:** 2026-04-29
**Issued By:** CEO (via Logistics Director draft)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

`GET /sets/{setNum}/storage-map` is the sole endpoint in the warehouse that bypasses the ResourceData layer — `GetSetStorageMapAction::execute()` returns a hand-rolled snake_case `array<int, array{...}>` and `SetController::storageMap()` ships it through a bare `JsonResponse`. The Plate compensates with `toCamelCaseTyped()` per row, so the contract works *today* but exists outside every regulation that governs the rest of the floor (ADR-0006 ResourceData boundary, ADR-0010 ComputedResourceData for non-Model responses, the Deptrac Output Shaping fence). Bring this endpoint into compliance so the warehouse has a single, enforceable response-shaping pattern.

## Scope

### In the Crate

- New Result DTO `App\DataTransferObjects\Result\Set\StorageMapEntryData` capturing the five fields currently emitted (`partId`, `colorId`, `storageOptionId`, `storageOptionName`, `quantity`) — pure primitives, no Model dependencies.
- `GetSetStorageMapAction::execute()` refactored to return `list<StorageMapEntryData>` instead of the raw array literal. Drop the inline PHPDoc array shape — the DTO is the type.
- New `App\Http\Resources\SetStorageMapResourceData` extending `ComputedResourceData<...>` that shapes the wire response. Decide between:
  - **Option A (wrapped object):** `{entries: StorageMapEntryResourceData[]}` — idiomatic ComputedResourceData, frontend `StorageMapEntry[]` consumer must read `.entries`.
  - **Option B (flat list):** keep the top-level array shape and ship a sibling `StorageMapEntryResourceData` plus a small Controller-side `array_map(...->toArray())` — preserves the wire shape, no Plate change required, but spreads the shaping logic a hair thinner.
  - The Head Sorter picks based on which keeps Deptrac/PHPStan happiest under ADR-0010; document the choice in the shift log. Default preference: **Option A** — wrapping is the canonical ComputedResourceData shape and a paired Plate permit will follow.
- `SetController::storageMap()` updated to call `SetStorageMapResourceData::from(...)->toResponse()` (or the Option B equivalent). No more bare `new JsonResponse(...)` here.
- Architecture test covering the new ResourceData (placement, final readonly, `from()` factory) — lean on existing `ResourceDataArchitectureTest` patterns.
- Feature test on `/sets/{setNum}/storage-map` updated to assert the new response shape against the chosen option.
- Unit test for `GetSetStorageMapAction` updated to assert against the new Result DTO type.

### Not on This Pallet

- The Plate-side change. If Option A is chosen, file a paired Building Permit in the Plate territory (`frontend/.claude/records/permits/`) to update `StorageMapEntry` consumption in `SetDetailPage.vue` and the `StorageMapEntry` type. Cross-territory work is out of scope for this Brick order.
- Other endpoints. The audit confirmed every other endpoint already routes through ResourceData / ComputedResourceData. No sweep, no opportunistic refactors.
- Caching middleware on the route (`etag`, `cache.headers`). Already correct, leave it.
- Authorization (`->can('viewStorageMap')`). Already correct, leave it.
- A new ADR. ADR-0006 and ADR-0010 already mandate the pattern this order is enforcing — this is a compliance fix, not a new decision.

## Acceptance Criteria

- [ ] `GetSetStorageMapAction::execute()` declared return type is `list<StorageMapEntryData>` (or equivalent typed collection); no inline array-shape PHPDoc.
- [ ] `App\DataTransferObjects\Result\Set\StorageMapEntryData` exists, is `final readonly`, and lives under `Result/` per ADR-0010.
- [ ] `App\Http\Resources\SetStorageMapResourceData` (and any sibling entry ResourceData) exists, is `final readonly`, extends `ComputedResourceData`, and has a static `from()` factory.
- [ ] `SetController::storageMap()` returns the new ResourceData via `->toResponse()`. The bare `new JsonResponse(...)` is gone.
- [ ] `composer test:arch` passes — including `DataTransferObjectPlacementTest` accepting the new Result DTO and `ResourceDataArchitectureTest` accepting the new ResourceData.
- [ ] `composer phpstan` and `composer deptrac` pass at level max — Output Shaping fence still intact.
- [ ] Feature test for `/sets/{setNum}/storage-map` asserts the chosen response shape (Option A or B) end-to-end.
- [ ] Unit test for `GetSetStorageMapAction` asserts the Result DTO return value, not the old array literal.
- [ ] `composer test:coverage` and `composer test:feature-coverage` hold their thresholds (100% / 90%).
- [ ] Shift log records which option (A or B) was chosen and why, plus a one-line note on whether a Plate permit is required.

## References

- Audit finding: contract drift identified 2026-04-29 by Plate↔Brick contract check session — only endpoint in the system bypassing ResourceData.
- ADR-0006: DTOFormRequest with toDto() bridge + custom ResourceData (the regulation this order enforces).
- ADR-0010: ComputedResourceData for Result-DTO-sourced responses (the canonical pattern for non-Model-sourced shapes — applies here because the response is a join projection, not a single Model).
- Reference implementation: `App\Http\Resources\FamilyMissingPartsResourceData` + `App\DataTransferObjects\Result\Family\FamilyMissingPartsData` — closest existing analog (Result DTO shaped by ComputedResourceData over join data).
- Current files involved:
  - `app/Actions/GetSetStorageMapAction.php`
  - `app/Http/Controllers/SetController.php` (`storageMap` method)
  - `routes/api.php` — route definition stays untouched
  - Plate consumer (out of scope, for permit reference): `frontend/src/apps/families/domains/sets/pages/SetDetailPage.vue:106-107` and `frontend/src/apps/families/types/part.ts:36-42`

## Notes from the Issuer

The CEO flagged this after an incident where the Plate and Brick had mismatched expectations. The contract audit found the routing was clean across all 34 endpoints — but this one outlier is the structural reason a mismatch could ever sneak in: it's the only endpoint where the response shape lives in a hand-typed array literal instead of a class the architecture tests can see.

This is a **compliance order, not an enhancement**. Don't expand scope into other endpoints, don't refactor the join query, don't add fields the frontend isn't already consuming. The goal is simply: make this endpoint follow the same pattern as the other 33, so that any future drift is caught by Deptrac / PHPStan / arch tests rather than by an incident.

If you discover that Option A or B has an unforeseen wrinkle (e.g. ETag/cache.headers behavior changes between flat-array and wrapped-object responses), pause and report up before deviating. Caching is on this route and we don't want a silent cache-key shift.

---

**Status:** Completed
**Shift Log:** [`2026-04-29-storage-map-resource-data`](../journals/2026-04-29-storage-map-resource-data.md)
