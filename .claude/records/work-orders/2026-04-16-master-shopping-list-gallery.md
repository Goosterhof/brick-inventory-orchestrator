# Building Permit: The Master Shopping List (Plate Side)

**Permit #:** 2026-04-16-master-shopping-list
**Filed:** 2026-04-16
**Issued By:** CEO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Build the master shopping list page that turns the Brick's new `GET /family-sets/missing-parts` endpoint into a useful, actionable view: aggregate shortfalls across every owned set, render them as a sortable list grouped by part+color, and give the user one-click export to BrickLink's wanted-list and to CSV so the list converts into a real purchase.

## Scope

### In the Box

- New route `/parts/missing` in the parts domain (`src/apps/families/domains/parts/`). Link to it from the existing parts page (e.g., a "Missing parts across all sets" CTA/button near the top of `PartsPage.vue`) so users can find it without knowing the URL.
- Page component: `PartsMissingPage.vue` (name subject to Architect judgment).
- Fetch from `GET /family-sets/missing-parts` via the families app's HttpService. Follow the Set Completion Gauge's error-safe pattern — a fetch failure degrades to an empty list + a non-intrusive error message, not a crashed page.
- Types for the response (camelCase) in `src/apps/families/types/part.ts` (or a new focused file if part.ts is heavy): `MasterShoppingListEntry` for each row + `MasterShoppingListResponse` with `entries: MasterShoppingListEntry[]` and `unknownFamilySetIds: string[]`.
- Summary row at the top: "You're short **X parts** across **Y sets**" computed from the response. If `unknownFamilySetIds` is non-empty, show a secondary honest line: "N of your sets haven't been synced from Rebrickable — their shortfalls aren't counted. [Link to settings to sync]" The wording should make the blind-spot plain, not hide it.
- List rows: part image (or placeholder), part name + number, color swatch + color name, shortfall quantity, "needed by N sets" (hover or expand to see set numbers — Architect's judgment on affordance).
- Sort controls: by shortfall (desc, default), part name (a→z), color name (a→z). Use the existing sort-chip pattern from the parts page.
- Search: by part name and part number (simple string includes). Reuse the `TextInput` pattern.
- Empty state: if the response is an empty list and `unknownFamilySetIds` is empty, "All parts accounted for — nothing missing." Neo-brutalist styling consistent with existing empty states (see `EmptyState` component).
- Loading state while the fetch is in flight.
- **Export — BrickLink wanted-list XML**: a button that downloads an XML file in BrickLink's wanted-list format (reference: https://www.bricklink.com/help.asp?helpID=207). Minimum fields per entry: `ITEMTYPE=P`, `ITEMID=<part_num>`, `COLOR=<bricklink_color_id>`, `MINQTY=<shortfall>`. Put the helper in `src/shared/helpers/` (e.g., `bricklinkWantedList.ts`) since it's pure transformation + stringification. If Rebrickable color ids don't map 1:1 to BrickLink color ids, add a TODO comment and document the limitation in the journal — do not silently emit wrong ids. If a bricklink color mapping is unavailable, omit the COLOR field rather than fabricate.
- **Export — CSV**: use the existing `toCsv` + `downloadCsv` helpers. Columns: `Part Number, Part Name, Color, Quantity Needed, Quantity Stored, Shortfall, Needed By Sets`. Respects current search/sort.
- Translations (EN + NL) for all new UI strings.
- 100% test coverage on new code.
- Full quality gauntlet passes.

### Not in This Set

- Changes to the backend endpoint — it's done (`GET /family-sets/missing-parts`) and its contract is authoritative.
- Changes to the existing per-set Missing Brick Detector on `SetDetailPage.vue` — it keeps working; this is the collection-wide companion.
- BrickLink cart auto-population via URL (requires a logged-in BrickLink session and can't be done from our origin) — XML download is sufficient.
- Real-time collaboration (e.g., marking parts as "ordered") — scoped separately if ever.
- Historical shortfall tracking.

## Acceptance Criteria

- [ ] `/parts/missing` route renders the master shopping list for authenticated users
- [ ] Page fetches `GET /family-sets/missing-parts` on mount and handles loading/empty/error states honestly
- [ ] Summary row shows total shortfall quantity and number of affected sets
- [ ] `unknownFamilySetIds` is surfaced with clear wording when non-empty; hidden when empty
- [ ] Rows show part image, part name, part number, color swatch + name, shortfall, and affected set count
- [ ] Sort works: shortfall desc (default), part name, color name
- [ ] Search works: matches part name or part number (case-insensitive contains)
- [ ] "Export to BrickLink wanted list" downloads a valid XML file with `ITEMTYPE`, `ITEMID`, `MINQTY`, and `COLOR` where mappable
- [ ] "Export to CSV" downloads a CSV with all displayed columns, respecting current search/sort
- [ ] Discoverable from the existing parts page (CTA/link/button)
- [ ] EN + NL translations for all new strings
- [ ] 100% test coverage on new code (page, helper, integration)
- [ ] All quality gates pass: `npm run type-check`, `npm run lint`, `npm run lint:vue`, `npm run format:check`, `npm run knip`, `npm run test:coverage`, `npm run build`, `npm run size`

## References

- Feature Brief: `docs/idea-vault.md` — The Master Shopping List
- Related Shipping Order: `backend/.claude/records/permits/2026-04-16-master-shopping-list.md` (Brick side — endpoint contract)
- Related Permit (precedent): `.claude/records/permits/2026-03-26-set-completion-gauge.md` — follow the same SQL-aggregation-consumed-by-parallel-fetch pattern, the same honest-unknowns approach, and the same error-safe degradation
- Related Feature (frontend): `src/apps/families/domains/sets/pages/SetDetailPage.vue` — the per-set Missing Brick Detector this page promotes to cross-collection
- Related Helper: `src/shared/helpers/csv.ts` (existing CSV utility — reuse verbatim)
- BrickLink Wanted List XML reference: https://www.bricklink.com/help.asp?helpID=207

## Notes from the Issuer

This is the payoff page for a collector who's been adding sets for a while — the view that turns "I have 47 sets" into "here's what I need to finish them." Two design principles matter:

1. **Honesty over polish.** If some sets haven't been synced from Rebrickable, the shortfall is unknowable for them, and the UI must say so clearly. An apparently-complete list that silently excludes unsynced sets is worse than a list that names its blind spots.

2. **Converts to action in one click.** A list the user has to retype into BrickLink isn't much of a feature. The BrickLink XML export is the feature. CSV is the fallback for users who track their parts in Excel/Sheets.

**On the BrickLink color mapping caveat:** if the mapping isn't clean (Rebrickable color ids vs BrickLink color ids), prefer omitting the COLOR field in the XML over guessing. An XML entry without COLOR still lets the user filter in BrickLink; an entry with the wrong COLOR buys the wrong parts. Document the limitation in the construction journal — it's a future fullstack shipping order (color mapping table) waiting to be written.

**On discoverability:** the existing `PartsPage.vue` is where users already go to think about parts. A prominent button or section there saying "See what you're missing across all sets →" is the path. Don't add a top-level nav entry; the parts page is the right home.

**Dependency:** Brick's shipping order (`GET /family-sets/missing-parts`) has merged. The endpoint is ready to consume.

---

**Status:** Complete
**Journal:** [2026-04-16-master-shopping-list](../journals/2026-04-16-master-shopping-list.md)
