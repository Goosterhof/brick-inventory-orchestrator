# Building Permit: Unsorted Parts Overview

**Permit #:** 2026-05-09-parts-unsorted-view
**Filed:** 2026-05-09
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Add a new family-app page at `/parts/unsorted` (named `parts-unsorted`) that gives the user an overview of parts they own but haven't placed in storage yet — the workflow companion to the existing `/parts/missing` shopping-list page. Same data source (`/family-sets/missing-parts`), different framing: "parts to place" instead of "parts to buy." Add a navigation entry from `/parts` so the user can reach it from their parts inventory.

## Scope

### In the Box

- New page: `src/apps/families/domains/parts/pages/PartsUnsortedPage.vue`
    - Fetches `/family-sets/missing-parts` (same endpoint as PartsMissingPage)
    - Each entry's `shortfall` represents "parts to place in storage"
    - Summary line: "You have {parts} parts to place across {sets} sets."
    - Empty state: "Everything's been placed in storage. Good work."
    - Search by part name/number
    - Sort: by quantity-to-place (default), name, color
    - Reuse `PartListItem` for visual consistency with `/parts` and `/parts/missing`
    - Per-row badges show "To place: {shortfall}x" plus the affected-sets count badge
    - **No BrickLink export** — that's a buying-workflow concern, stays on the missing-parts page
    - **CSV export retained** — useful for offline sorting checklists; headers reframed for the placement workflow
    - Surface the `unknownFamilySetIds` callout (mirrors PartsMissingPage) so users know unsynced sets aren't counted
    - Surface the load-error path with the same retry semantics as PartsMissingPage
- New route entry in `src/apps/families/domains/parts/index.ts` (`parts-unsorted`, `authOnly: true`, `title: 'pageTitle.partsUnsorted'`)
- New CTA on `PartsPage.vue` ("See parts to place" / similar) alongside the existing "See Missing Parts" button — wires to `parts-unsorted`
- i18n: add the new keys to **both** `en` and `nl` blocks in `src/apps/families/services/translation.ts`. Required keys (under `parts.*`):
    - `unsortedTitle`, `unsortedSummary`, `unsortedEmpty`, `unsortedNoResults`
    - `unsortedBackToParts`, `seeUnsortedCta`
    - `unsortedSearchPlaceholder`, `unsortedSortShortfall`, `unsortedSortName`, `unsortedSortColor`
    - `unsortedToPlaceLabel`, `unsortedNeededBy`
    - `unsortedExportCsv`, `unsortedLoadError`
    - `unsortedUnknownSets`, `unsortedUnknownSetsLink`
    - Plus `pageTitle.partsUnsorted` in both locales
- Tests in **both** `src/tests/unit/apps/families/domains/parts/pages/PartsUnsortedPage.spec.ts` and `src/tests/integration/apps/families/domains/parts/pages/PartsUnsortedPage.spec.ts` — mirror the structure of the existing PartsMissingPage specs. 100% coverage on the new page is non-negotiable per firm policy.
- Update `PartsPage.spec.ts` if needed for the new CTA navigation test

### Not in This Set

- **Backend changes.** The existing `/family-sets/missing-parts` endpoint is reused as-is. No new API.
- **Loose-parts / yard-sale modeling.** The CEO chose the same-data-different-framing path; modeling parts that aren't tied to any set is out of scope for this permit.
- **In-place sorting workflow.** Click-to-assign-to-storage from the unsorted page is a follow-up. This permit is **view-only** — the overview itself.
- **Renaming or repurposing the existing missing-parts page.** Both pages coexist: `/parts/missing` stays as the shopping-list view, `/parts/unsorted` is the placement-workflow view.
- **BrickLink export on the unsorted page.** Buying decisions stay on the missing-parts page.

## Acceptance Criteria

- [ ] `/parts/unsorted` route loads, fetches `/family-sets/missing-parts`, and renders entries with placement framing
- [ ] Empty state, error state, and unknown-sets callout all render correctly
- [ ] Search and sort work; CSV export downloads with placement-oriented headers
- [ ] Navigation works in both directions: `/parts` → "See parts to place" → `/parts/unsorted` → BackButton → `/parts`
- [ ] `pageTitle.partsUnsorted` is set on the route's `meta.title` and resolves in both `en` and `nl`
- [ ] All new translation keys exist in both `en` and `nl` blocks
- [ ] Unit + integration specs pass; coverage is 100% on the new page
- [ ] Pre-push gauntlet passes locally: `type-check` → `knip` → `test:coverage` → `build`
- [ ] `npm run lint` and `npm run lint:vue` pass
- [ ] No new console statements, no relaxation of complexity limits
- [ ] No imports through forbidden paths (`../shared/`, `../apps/`, `@/apps/`)

## References

- Source page (PartsMissingPage): `src/apps/families/domains/parts/pages/PartsMissingPage.vue`
- Existing types: `src/apps/families/types/part.ts` (`MasterShoppingListEntry`, `MasterShoppingListResponse`)
- Existing CTA pattern: `src/apps/families/domains/parts/pages/PartsPage.vue:204-213`
- i18n location: `src/apps/families/services/translation.ts` (`en` block ~190-229, `nl` block ~480 onward)

## Notes from the Issuer

The CEO's framing is the key insight: the existing `MasterShoppingListEntry.shortfall` field IS the "parts to place" count for someone who already owns the set and hasn't sorted yet. The same number means "to buy" for an unowned set and "to place" for an owned-but-unsorted set. We're not splitting the data — we're giving the user a different door into it.

A note on naming: prefer **"parts to place"** in user-facing copy. "Unsorted" works as the URL slug and route name, but "parts to place" is more action-oriented in the page UI itself. Reference the existing copy style in `parts.missingSummary` for tone.

If you discover during implementation that the framing breaks down (e.g., shortfall includes parts not yet purchased and that confuses the user), pause and report up — don't paper over it. The whole basis of this permit is that the data is correct, only the framing is new.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-05-09-parts-unsorted-view.md`
