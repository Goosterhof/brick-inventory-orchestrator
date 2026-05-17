# Building Permit: Place Parts in Storage from Unsorted View

**Permit #:** 2026-05-09-place-parts-from-unsorted
**Filed:** 2026-05-09
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Wire the placement workflow on `/parts/unsorted`. Today the page is a viewable overview; this permit makes it the actual sorting tool. Clicking a row opens a modal that lets the user record "I just placed N of these in storage location X" with one click. The list refreshes, the user moves on to the next pile.

This is the third use-case for the existing assign-part modal pattern (after SetDetailPage and the new unsorted page), so the permit also asks for the long-deferred extraction of a generic placement modal.

## Pre-flight Gate (do this first)

This permit assumes the backend has shipped `partId: number` on each `MasterShoppingListEntry` in the `/family-sets/missing-parts` response. **Before starting frontend work**, hit the endpoint (or check the Resource definition in the backend repo) and confirm the field is live. If `partId` is absent:

1. Stop.
2. Report to the CFO with the actual response shape.
3. Do **not** work around it (no per-click `/parts?part_num=X` lookup, no client-side caching). The CEO chose the backend-adds-`partId` path for cleanliness; the workaround paths are real but they create fragility we'd then need to remove. Better to gate cleanly than to ship and rip.

When the gate passes, proceed.

## Scope

### In the Box

- **Type update** — `src/apps/families/types/part.ts`:
    - Add `partId: number` to `MasterShoppingListEntry`. Update the doc comment to note that the backend now ships an internal numeric id alongside the catalog `partNum` string.

- **Modal extraction** — refactor `src/apps/families/domains/sets/modals/AssignPartModal.vue` into a generic `PlacePartModal.vue`:
    - Architect picks the new home. Likely `src/apps/families/domains/parts/modals/PlacePartModal.vue` since the parts domain owns the inventory concept; routing through the parts domain also reads more naturally for the third use-case.
    - Generic shape (architect refines):
        - `open: boolean`
        - `partIdentity: {partId: number; partNum: string; partName: string; colorId: number; colorName: string; colorHex: string; partImageUrl: string | null}` — single prop carrying everything the modal renders + posts.
        - `defaultQuantity?: number` (default `1`)
        - `maxQuantity?: number` (clamps the NumberInput)
        - `neededBySetNums?: string[]` — when non-empty, render a "Needed by" panel inside the modal listing the set numbers (e.g., `75313-1, 10497-1, ...`). Inline-truncate at ~5 with a `+N more` overflow label.
        - `existingLocations?: StorageMapEntry[]` — preserves the existing "already stored" panel from AssignPartModal.
        - Title comes from a prop (`title?: string` defaulting to a translation key) or a `kind` discriminator. Architect's call; both call sites should keep their existing copy ("Assign part" on SetDetail, "Place part in storage" on Unsorted).
    - Behavior unchanged from AssignPartModal: fetches `/storage-options`, POSTs `{partId, colorId, quantity}` to `/storage-options/{id}/parts`, emits `assigned` + `close` on success.
    - **Migrate the SetDetailPage call site to the new modal** in the same permit. Then delete `AssignPartModal.vue` (no thin-wrapper shim — clean cut). Move/migrate `AssignPartModal.spec.ts` to `PlacePartModal.spec.ts`.
    - If during extraction the contract feels speculative (i.e., SetDetail and Unsorted shapes want a wrapper rather than one component), **pause and report** — don't force a fit.

- **PartsUnsortedPage wiring** — `src/apps/families/domains/parts/pages/PartsUnsortedPage.vue`:
    - Make rows clickable (wrap `<PartListItem>` in a button/`ListItemButton` or equivalent — `PartListItem` itself has no emits today; keep it presentational).
    - Click handler opens `PlacePartModal` with `partIdentity` from the entry, `defaultQuantity = entry.shortfall`, `maxQuantity = entry.shortfall`, `neededBySetNums = entry.neededBySetNums`.
    - On `assigned`: refetch `/family-sets/missing-parts`, fire a success toast (`familyToastService.success(...)`), close the modal.
    - On `close` (without assignment): close, no refetch, no toast.
    - Keep the existing test guards (CSV-only export, no BrickLink button).

- **i18n** — `src/apps/families/services/translation.ts`:
    - Add new `place*` keys for the modal's title/copy and the success toast in **both `en` and `nl`** blocks.
    - **Run `npm run type-check` immediately after the multi-locale edit pass.** Per the active 2026-05-09 candidate in the architect's graduation log; eager type-check is the discipline being trained.

- **Tests** — 100% coverage non-negotiable:
    - New unit + integration specs for `PlacePartModal` (or the migrated `AssignPartModal.spec.ts` evolved in-place).
    - `PartsUnsortedPage.spec.ts` (unit + integration): cover row click opens modal, modal close re-renders, successful placement triggers refetch + toast, the "no BrickLink button" guard remains.
    - SetDetailPage's existing assign-flow tests stay green after the migration.
    - Architecture tests pass (file paths, naming, module placement).

### Not in This Set

- **Stay-open batched placement.** v1 closes the modal on each successful assign. CEO chose this explicitly.
- **Multi-location split in one modal open.** Open → place once → close. To split, reopen.
- **Undo.** A successful placement is committed.
- **Backend changes.** Out — see Pre-flight Gate. If `partId` isn't shipped, the permit pauses.
- **Renaming the storage endpoint or changing the request payload.**
- **Replacing PartUsageModal on the unsorted page.** PartUsageModal isn't currently triggered from this page; this permit doesn't introduce it. If a future permit wants a "show usage" secondary affordance, that's a separate scope.

## Acceptance Criteria

- [ ] Pre-flight gate confirmed: `partId` present on `/family-sets/missing-parts` response
- [ ] `MasterShoppingListEntry` type carries `partId: number`
- [ ] `PlacePartModal` extracted; old `AssignPartModal.vue` removed; SetDetailPage and PartsUnsortedPage both consume the new modal
- [ ] Clicking a `/parts/unsorted` row opens the modal with `quantity` defaulting to the entry's `shortfall`
- [ ] Successful placement: POST to `/storage-options/{id}/parts` with `{partId, colorId, quantity}`, modal closes, list refetches, success toast fires
- [ ] Error path: modal stays open, error rendered, list unchanged
- [ ] "Needed by" panel renders inside the modal when `neededBySetNums` is non-empty
- [ ] All new i18n keys exist in `en` and `nl`; type-check ran clean on the first attempt after multi-locale edits
- [ ] 100% coverage on new and modified files
- [ ] Pre-push gauntlet passes locally: `type-check` → `knip` → `test:coverage` → `build`
- [ ] `npm run lint`, `npm run lint:vue`, `npm run format:check`, `npm run size` clean
- [ ] No console statements, no relaxation of complexity limits, no forbidden imports

## References

- Existing modal: `src/apps/families/domains/sets/modals/AssignPartModal.vue`
- Existing modal spec: `src/tests/unit/apps/families/domains/sets/modals/AssignPartModal.spec.ts`
- Master-shopping-list type: `src/apps/families/types/part.ts:104`
- Unsorted page: `src/apps/families/domains/parts/pages/PartsUnsortedPage.vue`
- Toast service usage example (find in shared/families): grep `familyToastService.success`
- Previous permit: `.claude/records/permits/2026-05-09-parts-unsorted-view.md`
- Previous journal (modal-extraction "what keeps this from being excellent"): `.claude/records/journals/2026-05-09-parts-unsorted-view.md`

## Notes from the Issuer

CEO decisions answered upfront:

1. Backend ships `partId` (cleanest path; no frontend lookup or cache).
2. Modal closes after each successful assign (v1 simplicity over batched-sorting velocity).
3. "Needed by" panel renders inside the modal (real workflow value, zero extra fetch — the data is already on the entry).

Modal extraction has been deferred twice. This permit is the moment to do it; three use-cases is enough to clarify the contract. The architect's last journal logged it as "what keeps this from being excellent" — collect on that observation now.

The architect should run `npm run type-check` immediately after multi-locale i18n edits. That's the active 2026-05-09 candidate in the graduation log; we're watching whether the discipline lands proactively this shift, which would be the third confirming observation and the trigger for graduation review.

If the pre-flight gate fails (no `partId` on the response yet), pause and report. Do not work around it.

---

**Status:** Open
**Journal:** _pending_
