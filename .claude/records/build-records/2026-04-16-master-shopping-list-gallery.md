# Construction Journal: The Master Shopping List (Plate Side)

**Journal #:** 2026-04-16-master-shopping-list
**Filed:** 2026-04-16
**Permit:** [.claude/records/permits/2026-04-16-master-shopping-list.md](../permits/2026-04-16-master-shopping-list.md)
**Architect:** Lead Brick Architect (with CFO finalization — see Decisions)

---

## Work Summary

| Action   | File                                                                               | Notes                                                                                                          |
| -------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Created  | `src/apps/families/domains/parts/pages/PartsMissingPage.vue`                       | Master shopping list page — loading/error/empty/unknown-sets states, summary, search, sort, two export buttons |
| Created  | `src/shared/helpers/bricklinkWantedList.ts`                                        | Pure XML generator + download helper for BrickLink wanted lists; omits `<COLOR>` when mapping unavailable      |
| Created  | `src/tests/unit/apps/families/domains/parts/pages/PartsMissingPage.spec.ts`        | 24 unit tests — all states, search, sort, both exports, unknown-sets surfacing, CTA navigation                 |
| Created  | `src/tests/unit/shared/helpers/bricklinkWantedList.spec.ts`                        | 10 unit tests — XML shape, COLOR omission, zero/negative shortfall skip, XML escaping, download plumbing       |
| Created  | `src/tests/integration/apps/families/domains/parts/pages/PartsMissingPage.spec.ts` | Integration test against mock server — full render + export interaction                                        |
| Modified | `src/apps/families/domains/parts/index.ts`                                         | Added `/parts/missing` route (name `parts-missing`, `authOnly`, title `pageTitle.partsMissing`)                |
| Modified | `src/apps/families/domains/parts/pages/PartsPage.vue`                              | Added "See what you're missing across all sets" CTA button in header, routes to `parts-missing`                |
| Modified | `src/apps/families/services/translation.ts`                                        | Added 16 new EN strings + 16 new NL strings (page, CTA, summary, exports, states, sort labels)                 |
| Modified | `src/apps/families/types/part.ts`                                                  | Added `MasterShoppingListEntry` + `MasterShoppingListResponse` (camelCase) types                               |
| Modified | `src/tests/unit/apps/families/domains/parts/pages/PartsPage.spec.ts`               | Added assertions for the new CTA's presence on the parts page                                                  |
| Modified | `src/tests/integration/apps/families/domains/parts/pages/PartsPage.spec.ts`        | Added CTA presence + `parts-missing` route resolution assertions                                               |

## Permit Fulfillment

| Acceptance Criterion                                                                | Met | Notes                                                                                            |
| ----------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------ |
| `/parts/missing` route renders the master shopping list for authenticated users     | Yes | Route registered with `authOnly: true`                                                           |
| Fetches `GET /family-sets/missing-parts` on mount + honest loading/empty/error      | Yes | Error degrades to empty list + non-intrusive in-page banner (Set Completion Gauge pattern)       |
| Summary row shows total shortfall + affected set count                              | Yes | Computed from entries; hidden when entries empty                                                 |
| `unknownFamilySetIds` surfaced when non-empty; hidden when empty                    | Yes | Yellow brick-bordered callout with a link to `settings` when present                             |
| Rows show image, name, number, color swatch + name, shortfall, affected set count   | Yes | Uses shared `PartListItem` + neo-brutalist badge row for needed/stored/neededBy                  |
| Sort: shortfall desc (default), part name, color name                               | Yes | `FilterChip` row, reusing the existing sort-chip pattern                                         |
| Search: matches part name or part number (case-insensitive contains)                | Yes | Reuses shared `TextInput` with `type="search"`                                                   |
| BrickLink wanted-list XML export with `ITEMTYPE`/`ITEMID`/`MINQTY`/optional `COLOR` | Yes | Helper in `src/shared/helpers/`; omits `<COLOR>` when `brickLinkColorId` is null (see Decisions) |
| CSV export with all displayed columns, respecting search/sort                       | Yes | Reuses `toCsv` + `downloadCsv` verbatim                                                          |
| Discoverable from existing parts page                                               | Yes | Prominent `PrimaryButton` in `PartsPage.vue` header, no top-level nav entry                      |
| EN + NL translations for all new strings                                            | Yes | 16 new strings per locale                                                                        |
| 100% test coverage on new code (page, helper, integration)                          | Yes | Coverage 100/100/100/100 across lines/branches/functions/statements                              |
| All quality gates pass                                                              | Yes | type-check, lint, lint:vue, format:check, knip, test:coverage, build, size — all green           |

## Decisions Made

1. **BrickLink COLOR omission over fabrication** — The permit explicitly flags that Rebrickable color ids and BrickLink color ids are not 1:1, and there is no mapping table shipped on the frontend today. Chose to have the backend supply `brickLinkColorId` per entry (nullable), and the helper skips the `<COLOR>` element entirely when the id is null. Rejected: sending the Rebrickable id as-is. Rejected: sending color RGB. Both would cause BrickLink to either reject or (worse) silently match the wrong parts. A COLOR-less BrickLink entry still lets the user filter manually; a wrong COLOR buys the wrong bricks. This is the honesty-over-polish principle from the permit.

2. **Error-safe degradation, not crash** — Followed the Set Completion Gauge precedent: a fetch failure sets `loadError = true` and degrades to an empty list + a small yellow/red banner inside the page. Rejected: a global toast (too intrusive for a list page you can retry by navigating back). Rejected: an error-page redirect (loses context). The banner pattern matches the rest of the Families app.

3. **Discoverability via PartsPage CTA, not a new nav entry** — The permit was explicit on this. The CTA is always visible in the header (even when there are no stored parts), because "nothing stored" and "nothing missing" are different states and a collector with zero parts stored still wants to know what their sets need.

4. **Sort defaults to shortfall desc** — Users come to this page to answer "what do I need most of?" Shortfall desc surfaces that immediately. Name and color sort are secondary affordances for when the list is very long.

5. **Import paths via `@app/services` barrel** — `familyRouterService` etc. are already exported from the families services barrel; used that over a deeper import to match the rest of the app.

6. **Journal finalized by CFO** — Two architect sessions were cut off by stream idle timeouts mid-work. The CFO ran the remaining pre-push gauntlet, filed the journal, closed the permit, and committed. No code changes were made by the CFO — only verification + paper trail. Noted here so the record is honest.

## Quality Gauntlet

| Check         | Result | Notes                                                                            |
| ------------- | ------ | -------------------------------------------------------------------------------- |
| format:check  | Pass   | oxfmt: all 451 files use the correct format                                      |
| lint          | Pass   | oxlint: 0 warnings, 0 errors across 290 files                                    |
| lint:vue      | Pass   | All conventions passed                                                           |
| type-check    | Pass   | vue-tsc --build: silent                                                          |
| test:coverage | Pass   | 107 test files, 1254 tests passing; lines/branches/functions/statements all 100% |
| knip          | Pass   | No unused exports detected                                                       |
| build         | Pass   | All 3 apps build; families 121.43 kB brotlied, admin 30.79 kB brotlied           |
| size          | Pass   | families ≤350 kB (121.43 kB), admin ≤150 kB (30.79 kB)                           |

## Showcase Readiness

Solid. The page is a clean consumer of a pre-aggregated backend endpoint — the same pattern as the Set Completion Gauge, which was already held up as a precedent by the CEO. The BrickLink color-mapping caveat is handled with visible discipline (a documented comment in the helper explaining why `<COLOR>` is omitted, plus a TODO hook for the future mapping table). The honesty principle is visible in the UI: unsynced sets are surfaced, not hidden. A senior reviewer skimming this PR would see a feature that refuses to fake completeness, which is rarer and more valuable than gold-plating.

Room for follow-up (not in this scope):

- A Rebrickable → BrickLink color mapping table (future fullstack shipping order)
- "Mark as ordered" state per entry for cross-device procurement tracking
- Deep-link into BrickLink with the wanted-list attached (requires a BrickLink session; can't be done from our origin)

## Proposed Knowledge Updates

- **Learnings:** Consider capturing the "omit over fabricate" rule for external-system id mappings (BrickLink color ids, future Rebrickable mappings) as a first-class pattern. It came up first in the permit and now in implementation — it's probably a recurring concern.
- **Pulse:** Note the second consumer of the SQL-aggregate → parallel-fetch pattern (first was Set Completion Gauge). Two consumers means it's officially a pattern and not a one-off; candidate for ADR next time it's cited.
- **Domain Map:** Parts domain picks up a second page (`PartsMissingPage`) next to `PartsPage`. Minor update.
- **Component Registry:** Auto-generated; no manual updates needed.
- **Decision Record:** No ADR needed yet — the error-safe degradation and honest-unknowns approach are applications of existing decisions, not new ones.

## Self-Debrief

### What Went Well

- Reusing `toCsv`/`downloadCsv` verbatim and matching the existing sort-chip pattern kept the page's surface small — most of the code is orchestration, not new primitives.
- The BrickLink helper is a pure function + a download plumbing — clean boundary, trivially tested, 10 tests cover it end-to-end.
- Type definitions landed early (in `types/part.ts`), so the rest of the page was just "render this typed response."

### What Went Poorly

- Two sessions were truncated by stream idle timeouts mid-work. Most of the implementation landed in session 1, the integration test update landed in session 2, and the gauntlet/journal/commit landed under the CFO. That's not a defect of the work, but it is a defect of how the work was scheduled — long single-shift session with heavy tool use on slow commands.

### Blind Spots

- Did not hand-verify the feature in a running dev server — type-check + unit + integration tests pass, but the CFO could not practically `npm run dev` and click through the page in this session. Manual smoke test is a follow-up if the CEO wants before shipping.
- The integration test for `PartsMissingPage.spec.ts` was written by session 1; the CFO audited its shape but did not re-read every assertion.

### Training Proposals

| Proposal                                                                                                                                                                                                                          | Context                                                                                                          | Shift Evidence                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| When a permit has a named precedent (e.g., "follow the Set Completion Gauge pattern"), read that precedent's permit AND journal before writing any code.                                                                          | Saved time on this shift; the honest-unknowns framing + error-safe degradation came straight from the precedent. | 2026-04-16-master-shopping-list |
| For long feature permits, commit in chunks (types → helper → page → tests → integration → journal) rather than at the end, so a truncated session doesn't leave everything uncommitted.                                           | Two truncated sessions this shift left work uncommitted and forced CFO takeover to close the permit.             | 2026-04-16-master-shopping-list |
| When integrating with an external system that has its own id space (BrickLink colors, BrickLink item types, future Rebrickable mappings), the default must be "omit when unmappable," never "guess." Document the caveat in-file. | Applied here as a permit requirement; codifying it removes the need to re-ask next time.                         | 2026-04-16-master-shopping-list |

---

## CFO Evaluation

**Overall Assessment:** Solid

### Permit Fulfillment Review

All 13 acceptance criteria met. The BrickLink COLOR-omission caveat was handled exactly as the permit requested — the helper's comment explicitly calls out the future mapping-table shipping order, and the UI surfaces unsynced sets honestly. The CTA on `PartsPage.vue` is always visible (not gated on having stored parts), which is the correct read of the permit's discoverability requirement. No over-delivery, no gaps.

### Decision Review

The six decisions listed are the right ones and the right level of granularity. Decision #1 (omit COLOR over fabricate) is the highest-stakes one and it's correctly resolved — a wrong COLOR buys wrong bricks, and no CEO-class decision is needed to default to honesty. Decision #6 (CFO-finalized journal) is not a build decision but the honest paper trail; I left it in so future readers know why the architect's self-debrief mentions the truncations.

### Showcase Assessment

Strong. The feature is useful, the implementation is disciplined, and the visible handling of the color-id caveat is exactly the kind of detail a senior reviewer notices. Not every delivery needs to be "Excellent" — this is a Solid shift and a good portfolio artifact.

### Training Proposal Dispositions

| Proposal                                                                                     | Disposition | Rationale                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Read precedent permit + journal before coding when one is cited                              | Candidate   | First sighting. Behavior is already a good habit; promoting it to a training rule after a second confirming shift will be reasonable. No graduation this round.                                          |
| Commit in chunks (types → helper → page → tests → integration → journal) on long permits     | Candidate   | First sighting. Strongly motivated by this shift's two truncations. Watch for a second confirming shift before promotion. Could also be generalized into "commit at natural seams, not only at the end." |
| Default to omit-over-guess for external id mappings (BrickLink, future Rebrickable mappings) | Candidate   | First sighting. The permit itself encoded this; the architect internalized it. A second confirming shift — ideally on a different external-id boundary — would be enough to graduate.                    |

### Graduation Check

No graduations this round — all three proposals are first sightings.

### Notes for the Architect

Good shift. Two things for next time: (1) when a permit is long, commit at natural seams (types → helper → page → tests) rather than at the end, so a truncated session leaves a smaller delta to recover. (2) On BrickLink/Rebrickable id mismatches — your in-file caveat is exactly right; keep writing those comments, they're what makes the repo readable to the next engineer.
