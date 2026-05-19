# Construction Journal: Unsorted Parts Overview

**Journal #:** 2026-05-09-parts-unsorted-view
**Filed:** 2026-05-09
**Permit:** `.claude/records/permits/2026-05-09-parts-unsorted-view.md`
**Architect:** Lead Brick Architect

---

## Work Summary

The page, route, and CTA scaffolding for `/parts/unsorted` were already on the branch (`claude/add-all-parts-view-xVjvu`) when work began — `PartsUnsortedPage.vue` was untracked, `PartsPage.vue` and `parts/index.ts` had the CTA wiring and route registration, and `translation.ts` had only the `pageTitle.partsUnsorted` (en) entry. What remained was: completing the translation keys (en + nl, plus the nl `pageTitle`), authoring the unit and integration specs for the new page, and adding CTA-coverage tests on `PartsPage.spec.ts` (unit + integration).

| Action   | File                                                                                | Notes                                                                                                                                                        |
| -------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Modified | `src/apps/families/services/translation.ts`                                         | Added 16 `parts.unsorted*` + `parts.seeUnsortedCta` keys to **both** `en` and `nl` blocks. Added `pageTitle.partsUnsorted` to the `nl` block (en already in) |
| Created  | `src/tests/unit/apps/families/domains/parts/pages/PartsUnsortedPage.spec.ts`        | 25 tests mirroring `PartsMissingPage.spec.ts`. Drops BrickLink-export assertions. Adds a "no BrickLink button" guard so the framing can't regress            |
| Created  | `src/tests/integration/apps/families/domains/parts/pages/PartsUnsortedPage.spec.ts` | 11 happy-dom integration tests against the real `mockServer` and `EmptyState`/`PageHeader`/`FilterChip`/`PrimaryButton` components                           |
| Modified | `src/tests/unit/apps/families/domains/parts/pages/PartsPage.spec.ts`                | Added `describe('unsorted parts CTA', ...)` with 3 tests: render, click navigates to `parts-unsorted`, coexists with missing-parts CTA                       |
| Modified | `src/tests/integration/apps/families/domains/parts/pages/PartsPage.spec.ts`         | Added 2 integration tests for the new CTA (label rendered, route resolves to `/parts/unsorted`)                                                              |
| Modified | `.claude/records/permits/2026-05-09-parts-unsorted-view.md`                         | oxfmt cleanup only (the permit was filed unformatted; format:check caught it)                                                                                |

Pre-existing on the branch (verified, untouched):

- `src/apps/families/domains/parts/pages/PartsUnsortedPage.vue` (script + template, ~278 lines; CSV-only export, BrickLink dropped, placement framing, `data-testid="unsorted-*"` hooks)
- `src/apps/families/domains/parts/index.ts` (route entry: `/parts/unsorted`, name `parts-unsorted`, `meta: {authOnly: true, title: 'pageTitle.partsUnsorted'}`)
- `src/apps/families/domains/parts/pages/PartsPage.vue` (`goToUnsorted` + sibling `<PrimaryButton data-testid="parts-unsorted-cta">` next to the missing-parts CTA)
- `src/apps/families/services/translation.ts` `pageTitle.partsUnsorted: 'Parts to Place'` (en only)

## Permit Fulfillment

| Acceptance Criterion                                                                                        | Met | Notes                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/parts/unsorted` route loads, fetches `/family-sets/missing-parts`, renders entries with placement framing | Yes | Verified by unit test "fetches the master shopping list on mount" + integration test "renders a PartListItem per entry with the shortfall as the to-place quantity"                                             |
| Empty state, error state, and unknown-sets callout all render correctly                                     | Yes | Three unit tests + three integration tests covering each branch (entries empty + no unknown sets, entries empty + unknown sets, fetch failure)                                                                  |
| Search and sort work; CSV export downloads with placement-oriented headers                                  | Yes | Unit tests cover all three sort fields, search by name + number, and the CSV header set `['Part Number', 'Part Name', 'Color', 'To Place', 'Already Stored', 'Across Sets']` with filename `parts-to-place.csv` |
| Navigation works in both directions: `/parts` -> `/parts/unsorted` -> BackButton -> `/parts`                | Yes | Unit tests cover `goToUnsorted` (PartsPage) and `goBackToParts` (PartsUnsortedPage). Integration tests verify the route names resolve to the expected URLs                                                      |
| `pageTitle.partsUnsorted` set on `meta.title`, resolves in both `en` and `nl`                               | Yes | Already on the branch in `en`; added `'Onderdelen om op te bergen'` to `nl`                                                                                                                                     |
| All new translation keys exist in both `en` and `nl`                                                        | Yes | 17 keys per locale (16 `unsorted*` + `seeUnsortedCta`)                                                                                                                                                          |
| Unit + integration specs pass; coverage 100% on the new page                                                | Yes | 100% lines/branches/functions/statements (1317/1317 statements, 1028/1028 branches, 386/386 functions, 1236/1236 lines)                                                                                         |
| Pre-push gauntlet passes: `type-check` -> `knip` -> `test:coverage` -> `build`                              | Yes | All four green, plus `format:check`, `lint`, `lint:vue`, `size` clean                                                                                                                                           |
| `npm run lint` and `npm run lint:vue` pass                                                                  | Yes | 0 warnings, 0 errors, all conventions passed                                                                                                                                                                    |
| No new console statements, no relaxation of complexity limits                                               | Yes | Page imports nothing new, reuses the same composables and helpers as PartsMissingPage                                                                                                                           |
| No imports through forbidden paths (`../shared/`, `../apps/`, `@/apps/`)                                    | Yes | `@app/`, `@shared/`, no relative-up imports introduced                                                                                                                                                          |

## Decisions Made

1. **CSV header set: keep "To Place" / "Already Stored" / "Across Sets" rather than reusing the missing-parts column set.** The pre-existing PartsUnsortedPage.vue already shipped these placement-oriented headers, and they directly support the workflow: a printable checklist of what to place, with the count already stored as a sanity check and the per-row count of affected sets so the user can prioritise sets with the most outstanding parts. The missing-parts column set ("Quantity Needed", "Shortfall", "Needed By Sets") leaks buying-decision language into a placement workflow. Deciding to keep what was on the branch instead of reframing further was a deliberate call rather than passive acceptance.

2. **Translation key style: model `unsortedToPlaceLabel` on `usageShortfall`/`missingNeedLabel`, not on `usageNeeded`.** Both styles exist in the parts block. `missingNeedLabel: 'Needed'` is bare-noun and the badge interpolates the count separately (`{{ t('parts.missingNeedLabel').value }}: {{ entry.quantityNeeded }}x`). `usageShortfall: 'Short: {count}x'` is a single self-contained format string. The page already on the branch was using the self-contained style — `t('parts.unsortedToPlaceLabel').value.replace('{count}', String(entry.shortfall))` — so I matched that pattern in the i18n keys (`unsortedToPlaceLabel: 'To place: {count}x'` / `unsortedNeededBy: 'For {count} sets'`). One-format-per-key is more localisable than concat-in-template (translators see the whole sentence) and the permit nudged toward this with "model on `usageShortfall`/`missingNeedLabel`."

3. **Dutch copy choice: "op te bergen" over "in de opslag plaatsen".** The permit explicitly delegated tone to the architect, citing "the existing nl copy is the tone reference." The existing nl block uses short, bricky phrasing (`Tekort: {count}x`, `Boodschappenlijst`, `Steentjes stapelen...`). "Op te bergen" is the natural Dutch verb for "to place in storage" / "to put away" and matches that compactness. "In de opslag plaatsen" is technically correct but more bureaucratic; I kept it for the page title (`pageTitle.partsUnsorted: 'Onderdelen om op te bergen'`) which renders in the browser tab.

4. **Did not add a BrickLink-export-button-absent integration test for the missing-parts page.** The unit test on PartsUnsortedPage already asserts that BrickLink isn't on the placement page; the integration test does too. Adding a complementary "missing page still has BrickLink" test on PartsMissingPage would verify a non-change and isn't required by the permit. Held off on scope creep.

5. **Did not refactor the duplicated fetch-and-state shape between `PartsMissingPage.vue` and `PartsUnsortedPage.vue`.** Both pages share the same `entries` / `unknownFamilySetIds` / `loading` / `loadError` / search / sort scaffolding. A composable extraction (`useMasterShoppingList`) is tempting but out of scope and risks lock-in before the placement workflow's next iteration (the click-to-assign-to-storage follow-up permit) reveals whether the page diverges further. Better to wait for the third instance of the pattern before pulling out a composable. Logged as a future consideration but not as an ADR.

## Quality Gauntlet

| Check         | Result | Notes                                                                                                                                                                                                                        |
| ------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format:check  | Pass   | All 492 files OK after permit auto-fix                                                                                                                                                                                       |
| lint          | Pass   | 0 warnings, 0 errors, 251 rules, 300 files                                                                                                                                                                                   |
| lint:vue      | Pass   | All conventions passed                                                                                                                                                                                                       |
| type-check    | Pass   | Clean `vue-tsc --build`                                                                                                                                                                                                      |
| test:coverage | Pass   | Lines 100% (1236/1236), Branches 100% (1028/1028), Functions 100% (386/386), Statements 100% (1317/1317). Pre-existing collect-guard warning on `PartsPage.spec.ts` is unchanged from baseline (verified by stash-and-rerun) |
| knip          | Pass   | No unused exports, files, or deps                                                                                                                                                                                            |
| size          | Pass   | families app JS: 126.88 kB brotlied (limit 350 kB). admin app JS: 30.8 kB (limit 150 kB). New `PartsUnsortedPage-DXwary61.js`: 5.31 kB / 2.10 kB gzip                                                                        |

## Showcase Readiness

This is a workmanlike delivery, not a showpiece. The patterns are right and the tests are thorough — the showcase value is in the consistency: PartsMissingPage and PartsUnsortedPage are structurally identical, and a reviewer reading both files in sequence will see the same shape rendered through different copy. That's a good signal: a reviewer can predict where any field on either page lives without re-reading.

The thing that nudges this above "good enough" is the test asymmetry: the unit test for the unsorted page **explicitly asserts** that BrickLink is not rendered. That's a defensive guard against a future drift where someone copies missing-parts code into the placement page and re-introduces the buying language. Tests as a contract for framing intent, not just behaviour.

What keeps this from being excellent: the duplication between the two page files. A reviewer who reads both will notice ~80% overlap in the script section. The right answer is a `useMasterShoppingList` composable, but the right time to extract it is when the third use-case clarifies the contract — not now.

## Proposed Knowledge Updates

- **Learnings:** No new learnings — this build hit no surprises that aren't already covered.
- **Pulse:** No update needed for this delivery on its own. Mention in CFO's next pulse refresh: parts domain now has three pages (overview, missing/buying, unsorted/placement) — a natural triplet that may justify domain-internal reorganisation as the placement workflow matures.
- **Domain Map:** No change. `parts` domain remains as listed.
- **Component Registry:** No new shared components.
- **Decision Record:** None warranted. The "two doors into the same data" framing is a feature-level decision, not architectural — it doesn't constrain future designs.

## Self-Debrief

### What Went Well

- Discovering the partial state of the branch on first git inspection saved scope. Three of five files I'd otherwise have created (page, route, PartsPage CTA) were already there at acceptable quality. I confirmed by reading each one against the permit before deciding what to add, rather than reflexively rewriting.
- Adding the explicit "no BrickLink button" assertion in both unit and integration test suites — a defensive guard for the framing decision, not just for the current behaviour. Cheap to write, expensive to lose without it.
- Permit auto-fix on `format:check`: caught the unformatted permit file the moment the gauntlet ran. Single-command fix, no re-run needed.

### What Went Poorly

- I added the new translation keys to both `en` and `nl` `parts` blocks but missed the `nl` `pageTitle.partsUnsorted` entry on the first pass — the en block had it, the nl block didn't. Type-check would have caught it (translation schema is keyed off `en`), and it did, except… I didn't run type-check until later. If I'd run it immediately after the en additions I would have seen the gap on the nl side without re-reading.

### Blind Spots

- I didn't initially diff the branch against `main` to map the partial state — I went to `git status` first, which only showed working-tree changes. The `git diff main --stat` would have shown me the route and page commits sooner. This is the same blind spot logged in the recently-graduated "check git log/diff before starting" candidate; reading the candidate is one thing, internalising it for branches that already have base-branch commits is another.
- I didn't grep for other test files that might assert on PartsPage's PrimaryButton count. The PartsPage.spec.ts tests use `find((b) => b.text() === '...')` — name-based, so adding a button doesn't break — but a singular `findComponent(PrimaryButton)` in any neighbouring spec would have. I got lucky here; I should have grepped before making the page-level CTA change. (See training proposal below.)

### Training Proposals

| Proposal                                                                                                                                                                                                                                                                                                                                                                                                                 | Context                                                                                                                                                                                                                    | Shift Evidence                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| When a permit specifies adding translation keys to both `en` and `nl` blocks, mirror them into both blocks **in the same edit pass**. Then run `npm run type-check` immediately. The translation schema is generated from the `en` block, so missing `nl` keys won't fail the schema check but missing `en` keys will — running type-check after both blocks are updated catches structural mismatches in one round-trip | Caught by happenstance: I added the page-title key to both blocks separately and then went straight to writing tests. Type-check would have surfaced the gap; running it eagerly after multi-locale edits is the cheap fix | 2026-05-09-parts-unsorted-view |
| When a feature requires copy in two locales and the en copy is the spec, draft both `en` keys and their `nl` translations as a single block in a scratch buffer (or as a planning step) before opening the editor. Don't edit `en` first, then re-open the file to add `nl` — that creates the pattern where one block diverges from the other                                                                           | Same shift, same root cause. A planning-step discipline rather than a tooling discipline                                                                                                                                   | 2026-05-09-parts-unsorted-view |

The first proposal is operational and gauntlet-anchored. The second is more about authoring discipline. I'd lean on the first as the candidate to track.

---

## CFO Evaluation

**Reviewer:** CFO
**Reviewed:** 2026-05-09
**Verdict:** Accepted

### Work Quality

The architect inherited a partially-built branch and made the right call: read each existing file against the permit before deciding what to add. Three of five files were already present at acceptable quality; rewriting reflexively would have been wasted motion and risked overwriting working code. Filling in the gaps (translations, both spec suites, journal) was the correct scope.

The defensive "no BrickLink button" assertions in both spec suites are a small but excellent move — they encode the framing decision into the test suite, so a future copy-paste from `PartsMissingPage` cannot silently regress the boundary. This is the kind of forethought that builds a portfolio.

100% coverage held. Gauntlet output (per architect's transcript) is clean across format/lint/lint:vue/type-check/knip/test:coverage/build/size. Bundle delta on the families app (5.31 kB / 2.10 kB gzip for the new chunk) is well under the 350 kB limit.

### Decisions Reviewed

- **No `useMasterShoppingList` composable extraction.** Concur. The two pages share fetch + sort + summary today, but the placement view will likely diverge once click-to-assign-storage lands. Premature extraction would either lock in the missing-page contract or create a leaky superset. Wait for the third use-case.
- **Dutch tone "op te bergen" over "in de opslag plaatsen".** Concur. Matches the existing nl block's compactness (`Boodschappenlijst`, `Tekort`). One-line edit if the CEO disagrees.
- **CSV export retained, BrickLink dropped.** Faithful to permit. CSV reframing for offline placement-checklist use is sound.

### Training Disposition

| Proposal                                                                   | Verdict       | Reason                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run `npm run type-check` immediately after multi-locale translation edits  | **Candidate** | Single-shift evidence on 2026-05-09. Operational, gauntlet-anchored, and concretely actionable. The architect identified it as their preferred candidate. The failure mode (missing `nl.pageTitle.partsUnsorted`) is the second occurrence of this family of slip — the existing 2026-03-26 candidate at log-line 397 is the closest cousin. Promote on a second confirming shift. |
| Draft both `en` and `nl` keys as a planning step before opening the editor | **Dropped**   | Subsumed by the first proposal, with softer enforcement and no gauntlet hook. The architect themselves suggested dropping. Authoring discipline is real but unenforceable without a tooling anchor.                                                                                                                                                                                |

### Related Existing Candidate

Log-line 397 ("Before running type-check on modified Vue templates, grep translation keys against the translation schema file to catch missing keys early", 2026-03-26) is observed again this shift — same root failure mode, opposite operational fix (preempt type-check vs. run it eagerly). Marking this shift as **second confirming evidence** for that candidate but **holding graduation**: this miss cost one extra type-check round (~20 seconds), the original miss cost five type errors. Cost-of-failure curve is shallow enough that promoting a discipline costs more attention than it saves. Hold for a third shift where the miss surfaces later in the gauntlet (runtime, locale-specific build) — at which point either log-line 397 or the new 2026-05-09 candidate (whichever the architect demonstrably runs proactively) graduates.

### Concerns Flagged Up

- **Component-registry-json drift.** The commit includes a 117-insertion / 54-deletion change to `src/shared/generated/component-registry.json`. Generated artifact, regenerated by the gauntlet. Unmentioned in the journal — surface in the next pulse refresh so we have a record of what triggers regeneration.
- **Branch-state blind spot, second sighting.** The architect notes (Blind Spots) that they didn't run `git diff main --stat` on starting, despite a recently-graduated training bullet covering exactly that pattern. Graduated training that fails to land is a quality signal — track in the architect's next assignment whether the discipline holds. If it slips a third time, propose superseding the training language.

### Disposition

- Permit `2026-05-09-parts-unsorted-view`: **Complete**.
- Branch ready for push to `claude/add-all-parts-view-xVjvu`.
- No CEO knowledge-update approval required this round (no graduation, no doctrine change).
