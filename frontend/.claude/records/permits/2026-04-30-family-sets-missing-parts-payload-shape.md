# Building Permit: `/family-sets/missing-parts` Payload Shape Repair

**Permit #:** 2026-04-30-family-sets-missing-parts-payload-shape
**Filed:** 2026-04-30
**Issued By:** General (war-room deployment, translated by CFO)
**Assigned To:** Medic (war-room soldier, executed via Lead Brick Architect responsibilities)
**Priority:** Urgent

---

## The Job

`PartsMissingPage.vue` was written against an imagined backend contract. The real `/family-sets/missing-parts` endpoint ships `{shortfalls, unknown_family_set_ids}` with per-entry `needed_by_set_nums: list<string>` (LEGO set numbers like `"75313-1"`). The page was reading `payload.entries`, `entry.neededByFamilySetIds: number[]`, and `entry.brickLinkColorId` — none of which the backend emits. Result: production-broken page, `TypeError: Cannot read properties of undefined` on render for any user with missing parts. Frontend-side repair only.

## Scope

### In the Box

- Rename `MasterShoppingListResponse.entries` → `shortfalls` and `unknownFamilySetIds: number[]` → `string[]` in `src/apps/families/types/part.ts`.
- Rename `MasterShoppingListEntry.neededByFamilySetIds: number[]` → `neededBySetNums: string[]`.
- Drop `MasterShoppingListEntry.brickLinkColorId` (phantom — backend never ships it).
- Drop `MasterShoppingListEntry.partId` and rename `colorRgb` → `colorHex` (backend ships `color_hex` aliased from `colors.rgb`).
- Type non-nullable strings for `colorName` / `colorHex` (backend always emits non-null for these).
- Update `PartsMissingPage.vue` consumer reads, template `:key`, color-rgb prop binding, BrickLink/CSV exports, summary count.
- `unknown_family_set_ids` rendering already existed — left as-is, just the type narrowed.
- Update unit + integration test fixtures to mirror real backend shape; add backend-contract regression block to integration spec.

### Not in This Set

- Backend rename — backend's snake_case + `set_nums` is correct domain modelling.
- Other speculative-field findings (e.g. `FamilySet.setNum` phantom, Liaison M3 finding #4) — separate carryover.
- Pre-existing 6 integration test failures across BrickDnaPage / HomePage / StorageOverviewPage — outside this permit.
- The 3 unrelated unit-spec test-guard threshold warnings — outside this permit.

## Acceptance Criteria

- [x] Page renders without TypeError when backend ships the real payload shape.
- [x] Integration spec contains failing-pre-fix / passing-post-fix backend-contract guard tests.
- [x] `npm run lint` clean.
- [x] `npm run type-check` clean.
- [x] All 24 unit tests for `PartsMissingPage.spec.ts` pass.
- [x] All 13 integration tests for `PartsMissingPage.spec.ts` pass (was 9, +4 backend-contract guards).
- [x] `npm run build` produces clean dist for all 3 apps.
- [x] No other consumer of `/family-sets/missing-parts` or `MasterShoppingList*` types in the repo.

## References

- War Room Context: `/orders/brick-inventory-orchestrator/missing-parts-payload-shape-medic-deployment.md`
- Liaison M3 Field Report: `/reports/brick-inventory-orchestrator/field/2026-04-30-liaison-m3-staleness-refresh.md`
- Backend Authority: `app/Http/Resources/FamilyMissingPartsResourceData.php`, `app/Actions/FamilySet/GetFamilyMissingPartsAction.php`

## Notes from the Issuer

This is a frontend-side repair routed line-by-line through the Plate's accountability pipeline because the war-room order specified frontend-side fix (backend's shape is correct domain modelling). Trust-but-verified: I read the backend Resource and Action directly before applying any rename, confirming the Liaison report was correct down to the `(string)` casts in the Action.

---

**Status:** Complete
**Journal:** `2026-04-30-family-sets-missing-parts-payload-shape.md`
