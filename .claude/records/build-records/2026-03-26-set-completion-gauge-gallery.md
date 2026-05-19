# Construction Journal: The Set Completion Gauge

**Journal #:** 2026-03-26-set-completion-gauge
**Filed:** 2026-04-16
**Permit:** `.claude/records/permits/2026-03-26-set-completion-gauge.md`
**Architect:** Lead Brick Architect

---

## Work Summary

| Action   | File                                                                              | Notes                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Created  | `src/apps/families/domains/sets/components/CompletionGauge.vue`                   | Domain-local gauge (bar + percentage label) with four states: `unknown`, `empty`, `partial`, `complete`. Colors: red / yellow / green / dashed.  |
| Created  | `src/tests/unit/apps/families/domains/sets/components/CompletionGauge.spec.ts`    | 13 specs covering every state, clamping, rounding, unknown label, and bar color.                                                                 |
| Modified | `src/apps/families/types/familySet.ts`                                            | Added `FamilySetCompletion` interface (camelCase, mirrors backend `FamilySetCompletionResourceData`).                                            |
| Modified | `src/apps/families/services/translation.ts`                                       | Added `sets.completionUnknown` ("?" / "?") and `sets.completionLabel` ("Build completion" / "Bouwvoortgang") for EN and NL.                      |
| Modified | `src/apps/families/domains/sets/pages/SetsOverviewPage.vue`                       | Fetch `GET /family-sets/completion` in parallel with `retrieveAll()`; render `CompletionGauge` on every non-wishlist card; loading + error-safe. |
| Modified | `src/tests/unit/apps/families/domains/sets/pages/SetsOverviewPage.spec.ts`        | Added 6 specs covering fetch, loading placeholder, matched percentage, null-entry fallback, wishlist exclusion, and graceful error recovery.     |
| Modified | `src/tests/integration/apps/families/domains/sets/pages/SetsOverviewPage.spec.ts` | Registered `/family-sets/completion` mock route; corrected a pre-existing stale translation assertion ("No sets yet" → "The shelf is bare").     |

## Permit Fulfillment

| Acceptance Criterion                                                        | Met                                     | Notes                                                                                                                                                                  |
| --------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sets overview shows completion percentage on each non-wishlist set card     | Yes                                     | Gauge renders under the status badge on every non-wishlist card.                                                                                                       |
| 0% (red), partial (yellow), and 100% (green) have distinct visual treatment | Yes                                     | `data-state` attribute drives bar color + label color. Empty = `brick-red`, partial = `brick-yellow`, complete = `baseplate-green` with muted bar track.               |
| Sets with unknown completion show a neutral/unknown state, not 0%           | Yes                                     | Null percentage → `data-state="unknown"`, dashed border, no filled bar, label shows `sets.completionUnknown` (`?`).                                                    |
| Wishlist sets do not show completion indicators                             | Yes                                     | Wrapping `<div v-if="familySet.status !== 'wishlist'">` in the template prevents both the gauge and its loading placeholder from rendering for wishlist sets.          |
| Loading state while completion data is fetched                              | Yes                                     | While `completionLoading` is true, each non-wishlist card renders a muted "common.loading" placeholder with `aria-label="set-completion-loading"` in place of the bar. |
| Coexists with existing search, status filter, theme grouping, and sort      | Yes                                     | No existing computed properties or handlers changed. The gauge is purely presentational inside the existing card template.                                             |
| Responsive across breakpoints                                               | Yes                                     | `max-w="48"` constrains the gauge width; `flex-1` on its inner bar and `flex-shrink="0"` on the label keep it tidy inside the list item's flex row.                    |
| Follows neo-brutalist design system                                         | Yes                                     | 1px black border on the track, dashed border for unknown state, uppercase tracked label, theme color tokens only (`brick-red`, `brick-yellow`, `baseplate-green`).     |
| 100% test coverage on new code                                              | Yes                                     | Page-level code covered in `SetsOverviewPage.spec.ts`; gauge exercised in `CompletionGauge.spec.ts`. Coverage report shows 100% on lines, branches, funcs, statements. |
| All quality gates pass                                                      | Yes (with one noted pre-existing issue) | See Quality Gauntlet table.                                                                                                                                            |

## Decisions Made

1. **Domain-local component, not shared** — Chose `src/apps/families/domains/sets/components/CompletionGauge.vue` over `src/shared/components/`. The gauge has semantics tied to the completion-percentage domain concept (unknown / 0 / partial / 100 state machine + LEGO brand colors) that would be awkward to generalize. Following the YearDistributionChart precedent in the home domain. A shared progress bar can be extracted later if a second consumer appears — ADR-006 guidance: YAGNI on premature sharing.

2. **Relative import from page → component** — Chose `../components/CompletionGauge.vue` over `@app/domains/sets/components/...`. Oxlint's `no-restricted-imports` blocks `@app/domains/` (cross-domain signal). CLAUDE.md reads "relative imports only within the same directory," but the codebase precedent (HomePage → YearDistributionChart) uses `../components/` and there is no alternative sanctioned path within a single domain. Filing no methodology objection — the pattern is consistent and enforced.

3. **Percentage clamping at the component level** — Chose to clamp negative / over-100 percentages inside `CompletionGauge.vue` rather than trusting the backend. Belt-and-suspenders: the backend API is the contract, but defensive rendering avoids CSS width overflow if the API ever drifts. Also simplifies unit testing of edge cases.

4. **Swallow fetch errors silently, reset to empty map** — Chose `try/catch/finally` with a catch that resets `completionByFamilySetId` to an empty Map. A network failure fetching completion (a secondary enhancement) should not crash the page or block the primary set list. Post-swallow, every non-wishlist set falls through to the `unknown` gauge state — honest and non-misleading.

5. **Parallel fetches via `Promise.all`** — Chose `await Promise.all([retrieveAll(), fetchCompletion()])` in `onMounted`. The two endpoints are independent; sequential awaits would add avoidable latency on the most-visited page. Loading states are tracked separately so the primary list can render before the gauge data lands.

6. **Corrected an unrelated stale translation assertion** — The integration test asserted `"No sets yet"` which hasn't been the EN `sets.noSets` string for some time (current value: `"The shelf is bare. Time to add your first set."`). Verified via `git stash` that this failure exists on base `main`. Fixed as a one-line courtesy while already in the file; avoids leaving a known-red test next to the new green ones.

## Quality Gauntlet

| Check         | Result                                      | Notes                                                                                                                                                                                                                                                                 |
| ------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format:check  | Pass                                        | oxfmt clean.                                                                                                                                                                                                                                                          |
| lint          | Pass                                        | oxlint: 0 warnings, 0 errors.                                                                                                                                                                                                                                         |
| lint:vue      | Pass                                        | All conventions passed.                                                                                                                                                                                                                                               |
| type-check    | Pass                                        | vue-tsc clean.                                                                                                                                                                                                                                                        |
| test:coverage | Pass (1218/1218; 100% / 100% / 100% / 100%) | Lines/Branches/Functions/Statements all 100%. One pre-existing flake on `SetDetailPage.spec.ts` ("edit button" navigation) appeared once in coverage mode and self-cleared on re-run. Verified present on base `main` by `git stash` + run; not caused by my changes. |
| knip          | Pass                                        | No unused files, exports, or dependencies.                                                                                                                                                                                                                            |
| build         | Pass                                        | All three apps build cleanly (families: 9.60 kB for SetsOverviewPage chunk).                                                                                                                                                                                          |
| size          | Pre-existing fail                           | families JS: 2.27 MB / 350 kB limit. admin JS: 181.88 kB / 150 kB limit. Identical on base `main` before any of my edits (verified by `git stash` + rebuild). Not introduced by this permit.                                                                          |

## Showcase Readiness

Would a senior engineer come away impressed? I think yes, with one caveat.

**What the code shows:**

- Separation of concerns: the page fetches, the gauge renders. No business logic in the gauge, no UI math in the page.
- A small, testable state machine (four explicit states, one `computed`) with boundary defense at the component level.
- Defensive-but-not-paranoid error handling: primary data (the set list) is independent of the enhancement (the gauge), and a network failure degrades to a neutral visual rather than a broken page.
- Neo-brutalist discipline: no border-radius, theme tokens only, clean uppercase tracked label matching the existing `brick-label` vocabulary.
- EN + NL parity; the translation keys are narrow enough to be meaningful without creating a dumping ground.

**The caveat:** size-limit is already red on `main`. This permit didn't cause it, but this permit also doesn't fix it. A reviewer tracing the pre-push gauntlet would see `npm run size` as the lone failing check. Worth flagging to the CEO as a separate Pulse item — it signals the bundle budget has drifted out of sync with reality and the budget either needs a principled increase or the app needs a trim.

## Proposed Knowledge Updates

- **Learnings:** Propose adding a note under API communication: "When fetching an array endpoint that needs per-row camelCasing, type the `getRequest<T[]>(...)` with the target camelCase type and then `.map((item) => toCamelCaseTyped<T>(item))`. The fs-helpers signature `T | DeepSnakeKeys<T>` accepts both shapes so the inner map call type-checks without needing a separate snake-cased input type." — low-urgency, useful for future bulk-fetch work.
- **Pulse:** Bundle budget drift is worth noting. Propose adding a Concerns entry: "size-limit is failing on main (families: 2.27 MB vs 350 kB budget, admin: 181.88 kB vs 150 kB). Either re-baseline the budget or schedule a trim pass."
- **Domain Map:** No changes — sets domain gained a `components/` directory, but the domain boundaries are unchanged.
- **Component Registry:** Auto-generated. CompletionGauge is domain-local so may or may not be picked up; not a concern.
- **Decision Record:** No new ADR warranted. The choices here follow existing conventions (YearDistributionChart precedent, ADR-006 on not prematurely sharing).

## Self-Debrief

### What Went Well

- Reading the backend's `FamilySetCompletionResourceData` directly instead of guessing the response shape saved a round-trip. The `family_set_id` / `set_num` / `percentage` field names matched exactly what the permit implied.
- Writing the `CompletionGauge` test file before writing the page-integration tests forced me to pin down the state machine early. Once the 13 gauge tests were green, the page tests composed cleanly.
- The `Promise.all` + separate loading flag pattern let the primary set list and the gauge data load in parallel without coupling their loading states — faster perceived page load on real networks.

### What Went Poorly

- Hit the `no-restricted-imports` lint rule on `@app/domains/sets/components/...` on the first attempt. Should have grepped for how `YearDistributionChart` was imported before writing the import line. It cost a cycle and a lint run.
- Initial `getRequest<unknown[]>` typing forced a `toCamelCaseTyped` type error on the caller. Re-read the fs-helpers signature (`T | DeepSnakeKeys<T>`) and switched to `getRequest<FamilySetCompletion[]>`, matching the HomePage convention. This is a convention I should have recognized immediately — it's how HomePage and every other fetch in the families app types its responses.

### Blind Spots

- Almost shipped without running the integration test. Only noticed the pre-existing "No sets yet" translation stale-ness because I was proactively updating it for the completion endpoint mock. A silent broken integration test is worse than a loud broken one — I should have run it first to establish baseline red/green.
- Did not check size-limit against base before running my own. If my change had pushed size into red, I might have wrongly attributed it. Establishing baseline against `git stash` is cheap; should have done it upfront.

### Training Proposals

| Proposal                                                                                                                                                                                                                                             | Context                                                                                                                                                  | Shift Evidence                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Before importing across sibling directories in a Vue app, grep for existing import patterns (`../components/` vs `@app/...`) in a peer page; the lint rules differ by alias.                                                                         | Hit `no-restricted-imports` on `@app/domains/sets/components/CompletionGauge.vue`; `../components/` is the codebase convention.                          | 2026-03-26-set-completion-gauge |
| Before declaring the gauntlet red due to a single check failing, run `git stash && <check> && git stash pop` to separate pre-existing failures from changes made in the current shift.                                                               | size-limit and an integration test were both already red on `main`; without baselining, a fresh-eyes reviewer would blame this permit.                   | 2026-03-26-set-completion-gauge |
| When a bulk GET endpoint returns an array of rows needing camelCasing, type the request with the target camelCase type (e.g., `getRequest<T[]>`) and `.map` each row through `toCamelCaseTyped<T>` — do not leave the response typed as `unknown[]`. | Initial `getRequest<unknown[]>` forced `toCamelCaseTyped` to reject the untyped input. The fs-helpers signature accepts both `T` and `DeepSnakeKeys<T>`. | 2026-03-26-set-completion-gauge |

---

## CFO Evaluation

_Appended by the CFO after reviewing the journal. The architect's sections above are not edited — they stand as written._

**Overall Assessment:** Solid

### Permit Fulfillment Review

Every acceptance criterion checked. No gaps. One minor over-delivery (the stale `"No sets yet"` translation fix in the integration test), which was in-scope of "touch the integration test mocks anyway" and documented honestly in the decisions log. Baselined against main first — good discipline.

Re-ran the gauntlet in parallel to verify: type-check, lint, format, knip pass; 1218/1218 tests green; 100% coverage on lines/branches/functions/statements; build passes. Size-limit failure independently confirmed present on bare `main` (2.27 MB families, 181.88 kB admin) — pre-existing, not this shift's issue.

### Decision Review

Six decisions, all sensible and within the architect's remit. None needed escalation.

- **Domain-local component (D1)** — correct by ADR-006 and YearDistributionChart precedent. Don't prematurely share.
- **Relative import (D2)** — enforced by lint; no methodology objection warranted. Matches HomePage convention.
- **Defensive clamping (D3)** — cheap insurance against future API drift. Keeps CSS width safe.
- **Swallow-and-degrade on fetch error (D4)** — right call: a secondary enhancement should never crash the primary page. Errored state degrades to honest `unknown` gauges, not misleading 0%.
- **Parallel `Promise.all` (D5)** — obviously correct for independent fetches on the most-visited page.
- **Stale assertion fix (D6)** — acceptable scope bundling, baselined before touching.

### Showcase Assessment

Strengthens the portfolio. The gauge is visually restrained, honest about unknown state, and doesn't crowd the status badges. The code demonstrates a due-diligence-proof pattern: parallel fetches, defensive rendering, graceful degradation, tested state machine. A reviewer picking this up could read the component in under a minute and understand every decision.

One Pulse concern surfaced: bundle size is red on main. Not this permit's fault, but worth surfacing to the CEO as a follow-up item — either re-baseline the budget (principled increase with rationale) or schedule a trim pass. Kicking it further is kragle.

### Training Proposal Dispositions

| Proposal                                                                                                                                                                                                        | Disposition | Rationale                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before importing across sibling directories in a Vue app, grep for existing import patterns (`../components/` vs `@app/...`) in a peer page; the lint rules differ by alias.                                    | Candidate   | First observation. Real friction cost a lint cycle. Not obvious from CLAUDE.md (which only states "relative only within same directory" without covering cross-directory inside a single domain). Second confirmation needed before promotion.                                                                                                                                   |
| Before declaring the gauntlet red due to a single check failing, run `git stash && <check> && git stash pop` to separate pre-existing failures from the current shift.                                          | Candidate   | First observation. Genuine value — caught both size-limit and an integration test as pre-existing. **Caveat:** tension with the existing 2026-04-03-fs-toast-migration candidate that warns against `git stash` in multi-agent contexts. This proposal is scoped to single-agent gauntlet-baselining where the risk doesn't apply. Keep both candidates; merge if both graduate. |
| When a bulk GET returns an array of rows needing camelCasing, type `getRequest<T[]>` with the target camelCase type and `.map` each row through `toCamelCaseTyped<T>`. Don't leave the response as `unknown[]`. | Candidate   | First observation. Concrete, actionable, matches the HomePage convention already in the codebase. Will confirm on the next fullstack integration that fetches an array endpoint.                                                                                                                                                                                                 |

No graduations this round — all three proposals are first observations.

### Notes for the Architect

Clean shift. The baseline-against-main discipline (decision D6) is the move — keep doing that; it's how you protect a ship from being blamed for pre-existing red. Parallel fetches with separated loading flags is a pattern worth reusing on other "primary + enhancement" page loads.

One thing to sharpen next time: when you hit `no-restricted-imports`, don't re-try blindly — pull up a peer page and read its import style first. That's your own training proposal #1. One-minute audit saves a lint cycle.
