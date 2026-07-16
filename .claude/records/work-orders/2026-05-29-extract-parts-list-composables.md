# Work Order: Gallery — Extract Parts-List Sort/Filter/Export Composables

**Work Order #:** 2026-05-29-extract-parts-list-composables
**Filed:** 2026-05-29
**Issued By:** CEO (via 2026-05-29 cross-wing sweep follow-up)
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `extract-parts-list-composables`

---

## The Job

Sweep finding **G-debt-1** (medium): all three Parts pages (`PartsPage.vue`, `PartsUnsortedPage.vue`, `PartsMissingPage.vue`) independently re-implement the same client-side list scaffold — `SortField` type, `setSortField`, a `compareX` switch, a `searchQuery` ref with the same `.toLowerCase().trim()` filter, `sortLabelKey` record, `allSortFields` array, and an `exportCsv`. The CSV-export half also recurs in `SetsOverviewPage.vue`. Bodies differ only in column set and sort keys. The Casebook already tracks a `PartsMissingPage` sort-chip carry-forward in this exact cluster — duplication is already diverging.

## Scope

### In the Box

1. Extract a `useSortableFilteredList` composable into `src/shared/composables/` — parameterized by sort comparators and a text-match selector.
2. Extract a `useCsvExport` (or similar) helper into `src/shared/composables/` (or `helpers/`) wrapping the headers→rows→`downloadCsv(toCsv(...))` flow.
3. Refactor the three Parts pages (and `SetsOverviewPage` for the CSV half) to consume them. Preserve current behaviour exactly; the divergent data shapes (`GroupedFamilyPart` vs `MasterShoppingListEntry`) drive the parameterization.

### Not in This Set

- Broader page-scaffold abstraction beyond sort/filter/export.
- Changing the visible behaviour of any Parts page.

## Acceptance Criteria

- [ ] `useSortableFilteredList` + CSV-export helper live in shared, fully unit-tested (100% per Gallery policy).
- [ ] The three Parts pages and `SetsOverviewPage` consume the shared code; duplicated scaffold removed.
- [ ] No behavioural change (existing page integration tests still green).
- [ ] Gallery gauntlet green (type-check, lint, lint:vue, knip, test:coverage, build).
- [ ] Build Record filed.

## References

- Audit: [`2026-05-29-warden-cross-wing-sweep`](../audits/2026-05-29-warden-cross-wing-sweep.md) — finding G-debt-1

---

**Status:** Migrated to Kendo — BIO-0008 (2026-07-16). File frozen as archive; live tracking on the board.
