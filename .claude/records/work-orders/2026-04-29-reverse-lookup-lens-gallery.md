# Building Permit: The Reverse Lookup Lens (Plate Side)

**Permit #:** 2026-04-29-reverse-lookup-lens
**Filed:** 2026-04-29
**Issued By:** CEO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Make every part row on `PartsPage.vue` clickable. Click → modal opens showing the family sets that need this part+color, with build status, quantity needed, quantity stored, and shortfall. Closes the "I found a brick on the floor — where does it belong?" loop. The Brick-side companion endpoint is in `backend/.claude/records/permits/2026-04-29-reverse-lookup-lens.md`.

## Scope

### In the Box

- New modal: `src/apps/families/domains/parts/modals/PartUsageModal.vue`
    - Props: `partNum: string`, `colorId: number`, plus open/close binding consistent with existing modals.
    - Fetches `GET /family/parts/{partNum}/{colorId}/usage` via `familyHttpService` on mount.
    - Renders: part header (name, color, image), then a list of `{setNum, setName, status, quantityNeeded, quantityStored, shortfall}` rows.
    - Status badge per set — reuse the existing status component from sets domain, do not fork.
    - Each row links to the matching set detail page via `familyRouterService` (named route).
    - States: loading skeleton, error with retry, empty ("No sets need this part"), populated.
- `PartsPage.vue` integration:
    - Make each `PartListItem` row clickable (button or click handler) and emit/open the modal with `(partNum, colorId)`.
    - Preserve existing keyboard accessibility — clickable rows must be focusable and Enter-activatable.
- Type additions in `src/apps/families/types/part.ts` (or a new `partUsage.ts`):
    - `FamilyPartUsageResponse`, `FamilyPartUsageEntry` matching the backend envelope.
- Tests:
    - Unit: 100% coverage on `PartUsageModal.vue` — all four states (loading, error, empty, populated), set-row click navigation, escape-to-close, close-button.
    - Unit: cover the new click-to-open wiring on `PartsPage.vue` (existing tests must not regress).
    - Integration: page-integration test (per ADR-013) — render PartsPage with mock server, click a row, assert modal renders with fetched data, click a set row, assert navigation.

### Not in This Set

- No backend work — see the Brick shipping order.
- No "show where this part is stored" — that's already on the existing parts page via storage badges.
- No filtering, sorting, or search inside the modal — usage list is small by construction.
- No changes to `PartsMissingPage.vue` (Master Shopping List).
- No new shared component — `PartUsageModal` lives in the parts domain. If a second consumer surfaces, promote it then.
- No CSV/BrickLink export from the modal — Master Shopping List already covers cross-set buying. This is a lookup, not a buying tool.

## Acceptance Criteria

- [ ] Clicking any part row on `/parts` opens `PartUsageModal` with the correct `partNum` + `colorId`.
- [ ] Modal shows loading state, then either populated list, empty state, or error-with-retry — never a flicker of stale state between fetches.
- [ ] Each set row in the modal navigates to `/sets/{setNum}` (or whichever named route the sets domain exposes) on click.
- [ ] Modal is dismissable via the close button **and** Escape key, focus returns to the originating row.
- [ ] All gauntlet stages green: `npm run type-check`, `npm run knip`, `npm run lint`, `npm run lint:vue`, `npm run format:check`, `npm run test:coverage` (100%), `npm run build`, `npm run size`.
- [ ] No regressions in existing PartsPage tests (search, filter chips, sort, orphan toggle, CSV export).

## References

- Idea Vault: `docs/idea-vault.md` → "The Reverse Lookup Lens"
- Related Permit (Brick): `backend/.claude/records/permits/2026-04-29-reverse-lookup-lens.md`
- Related Permit: `.claude/records/permits/2026-04-16-master-shopping-list.md` (loading/empty/error pattern to mirror)
- ADR-013 (page integration tests)

## Notes from the Issuer

Modal not page — this is a glance-and-go interaction, not a destination. Forcing a route change for a single lookup loses the user's place on the parts list and adds a back-button round-trip every time.

The Apprentice flagged the workflow's real-world frequency as uncertain — do not gold-plate. Don't add filters, sorts, "save this lookup", or jump-to-storage. Ship the minimum coherent slice; if usage data shows daily traffic, those features earn their own permit. If usage is rare, the slim modal stays a lightweight delight rather than a maintained feature.

The CFO will want to see the test list reflect that minimalism — if the unit spec balloons past ~20 tests, something is being over-built.

---

**Status:** Open
**Journal:** _link to construction journal when filed_
