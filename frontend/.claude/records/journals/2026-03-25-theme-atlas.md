# Construction Journal: The Theme Atlas

**Journal #:** 2026-03-25-theme-atlas
**Filed:** 2026-03-26
**Permit:** [2026-03-25-theme-atlas](../permits/2026-03-25-theme-atlas.md)
**Architect:** Lead Brick Architect

---

## Work Summary

| Action   | File                                                                        | Notes                                                                                                                   |
| -------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Created  | `src/shared/components/CollapsibleSection.vue`                              | New shared component: collapsible section with brick brutalism styling, caret indicator, optional count badge           |
| Modified | `src/apps/families/domains/sets/pages/SetsOverviewPage.vue`                 | Added theme grouping (collapsible sections), multi-select theme filter chips, allThemes/groupedSets computed properties |
| Modified | `src/tests/unit/apps/families/domains/sets/pages/SetsOverviewPage.spec.ts`  | Removed theme tests (moved to split file), added CollapsibleSection mock, phosphor-icons mock                           |
| Created  | `src/tests/unit/apps/families/domains/sets/pages/SetsOverviewTheme.spec.ts` | 18 tests covering theme grouping and theme filter chip behavior                                                         |
| Created  | `src/tests/unit/shared/components/CollapsibleSection.spec.ts`               | 14 tests covering rendering, expand/collapse, styling, and interactions                                                 |

## Permit Fulfillment

| Acceptance Criterion                                            | Met | Notes                                                                               |
| --------------------------------------------------------------- | --- | ----------------------------------------------------------------------------------- |
| Sets overview groups sets by theme in collapsible sections      | Yes | Groups sorted alphabetically, empty groups hidden when filtered                     |
| Filter chips at the top allow quick theme selection             | Yes | Multi-select theme chips appear when 2+ themes exist                                |
| Each theme group shows the count of sets within it              | Yes | Count badge rendered via CollapsibleSection count prop                              |
| Grouping coexists with existing search, status filter, and sort | Yes | Theme filter, status filter, and search all compose correctly                       |
| When searching, grouping still applies                          | Yes | Empty groups are hidden; non-empty groups persist with correct counts               |
| 100% test coverage on new code                                  | Yes | 100% lines, branches, functions, statements                                         |
| All quality gates pass                                          | Yes | format:check, lint, lint:vue, type-check, knip, test:coverage, build, size all pass |

## Decisions Made

1. **Default state: all collapsed** -- Chose collapsed over expanded because collapsed surfaces theme distribution immediately (the "I'm a Technic collector with a Star Wars habit" moment from the permit notes). With many themes, all-expanded creates visual noise. The filter chips handle quick access to specific themes. Rejected all-expanded as the default because it doesn't add value over the pre-grouping flat list.

2. **Multi-select theme filters** -- Chose multi-select over single-select (which status already uses). Theme selection has different intent: "Show me my Star Wars AND Technic sets" is a natural query. Single-select on themes would frustrate collectors with overlapping interests. Used Set<string> for clean add/remove semantics.

3. **Theme chips hidden with single theme** -- When only one theme exists, theme chips add no filtering value and waste space. The v-if="allThemes.length > 1" guard prevents this. The user still sees their single theme as the collapsible section header.

4. **Test file split for execution guard** -- Split 35 tests into two files (18 core + 18 theme) to stay under the 1000ms execution threshold. The original single file hit 1869ms. After split: 546ms + 789ms.

5. **New shared CollapsibleSection component** -- Created a new shared component rather than building collapsible behavior inline. This component is genuinely reusable (storage grouping, parts grouping, admin dashboards) and follows the brick brutalism design system with brick-border, brick-transition, brick-label, and a PhCaretRight indicator.

6. **"Unknown" as fallback theme** -- Sets without set.theme (or with null theme) are grouped under "Unknown". This is explicit and honest. Rejected alternatives: hiding them (loses data), using "Other" (implies intentional categorization), using "Uncategorized" (too verbose for a chip label).

## Quality Gauntlet

| Check         | Result | Notes                                |
| ------------- | ------ | ------------------------------------ |
| format:check  | Pass   |                                      |
| lint          | Pass   | 0 errors (3 pre-existing warnings)   |
| lint:vue      | Pass   |                                      |
| type-check    | Pass   |                                      |
| test:coverage | Pass   | 100% all metrics, 93 test files      |
| knip          | Pass   |                                      |
| size          | Pass   | families: 102.58 kB (budget: 350 kB) |

## Showcase Readiness

This implementation would hold up well under review. Key strengths:

- **Clean separation of concerns**: Grouping logic lives in computed properties, not template spaghetti. The filteredSets, allThemes, and groupedSets computeds compose naturally.
- **Reusable component**: CollapsibleSection is a genuine shared component with proper props/emits API, brick brutalism styling, and full test coverage. It will be consumed by other domains.
- **Multi-select vs single-select distinction**: The status filter is single-select (radio behavior) while theme filter is multi-select (checkbox behavior). This is an intentional UX decision that demonstrates understanding of filter semantics.
- **Graceful degradation**: Theme chips hide when irrelevant (single theme), empty groups hide during filtering, "Unknown" handles null data honestly.

One area for future improvement: the expand/collapse state could persist across navigation via route query params or storage service. Not in scope for this permit but worth noting.

## Proposed Knowledge Updates

- **Learnings:** None. No novel gotchas encountered.
- **Pulse:** Update "In-Progress Work" to clear, update "Quality Metrics" (test files: 93, test count: ~1117, shared components: 32).
- **Domain Map:** No changes -- sets domain description already covers the overview page.
- **Component Registry:** Auto-updated on commit (32 components now).
- **Decision Record:** No ADR needed. The decisions made are page-level UI choices, not architectural patterns.

## Self-Debrief

### What Went Well

- Research phase was thorough: read the page, types, store module, existing tests, component registry, and shared components before writing any code. This meant zero false starts on architecture.
- Test-alongside-code approach worked cleanly. Writing tests in parallel with the component caught the v-show vs v-if testing nuance early.
- The test file split was a proactive response to the execution guard, not a reactive fix after failure.

### What Went Poorly

- Initially wrote CollapsibleSection tests checking isVisible() on v-show elements, which JSDOM does not handle correctly. Had to pivot to checking style attributes for display: none. Cost ~3 iterations.
- Initially used .at(0)?.props() in tests, which triggers no-unsafe-call lint errors. Had to refactor to .find() and .map() patterns. Should have checked the graduation log candidate about this before writing tests.

### Blind Spots

- Did not check the graduation log candidates before starting test writing. The candidate about .at(0) vs .find() pattern was already documented from a prior shift. Following it would have saved 2 iterations.

### Training Proposals

| Proposal                                                                                                | Context                                                                                               | Shift Evidence         |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------- |
| When testing v-show visibility, use attributes("style") checks for display: none instead of isVisible() | JSDOM's isVisible() does not respect Vue's v-show inline style. Hit this in CollapsibleSection tests. | 2026-03-25-theme-atlas |

---

## CFO Evaluation

_Appended by the CFO after reviewing the journal. The architect's sections above are not edited — they stand as written._

### Delivery Assessment

**Verdict: Clean delivery. All acceptance criteria met.**

The architect delivered a well-scoped feature with zero scope creep. Key observations:

1. **CollapsibleSection component** — 35 lines, genuinely reusable, proper props/emits API. Good call making this shared rather than inline. The brick-border, brick-transition, and brick-label styling is consistent with the design system. The `v-show` for content (vs `v-if`) is the right choice — preserves DOM for performance when rapidly expanding/collapsing.

2. **Multi-select vs single-select** — Correct UX distinction. Status filter is exclusive (one status at a time), theme filter is additive (Star Wars AND Technic). The `Set<string>` for theme filters with immutable toggle semantics (creating a new Set on each toggle) is clean reactive state management.

3. **All-collapsed default** — Justified. With many themes, collapsed surfaces the distribution overview. The filter chips are the functional entry point; collapsing makes the chips the primary interaction.

4. **Test file split** — Proactive, not reactive. The 1869ms → 546ms + 789ms split was a smart move under the execution guard.

5. **groupedSets computed** — Filters down to `filteredSets` first, then groups. This means theme filtering, status filtering, and search all compose naturally without special-casing. Good data flow.

### Concerns

- The architect's self-debrief flagged not checking the graduation log before writing tests — hitting the `.at(0)` lint issue again. This is the **second time** this exact blind spot has been documented (first: brick-census, now: theme-atlas). The candidate for "check array access patterns before writing tests" now has two confirming observations.

### Training Evaluation

| Proposal                                                                                  | Verdict       | Reason                                                                       |
| ----------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------- |
| v-show visibility: use `attributes("style")` for `display: none` instead of `isVisible()` | **Candidate** | Valid JSDOM limitation. First observation — needs a second confirming shift. |

### Graduation Check

The candidate "Before writing test assertions that access array items by index, check linter rules for `no-non-null-assertion` and verify what array access patterns existing tests use" (first observed: 2026-03-25-brick-census) was re-hit in this shift. The architect explicitly called this out as a blind spot.

**Two confirming observations. Drafting graduation tests.**

### Graduation Tests

**Candidate:** Before writing test assertions that access array items by index, check linter rules and verify existing test conventions for array access patterns.

| Scenario                                                                 | Without Training                                                                                                                                                              | With Training                                                                                                                                                | Assertion                                                          |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Test needs to assert on the first item in `wrapper.findAllComponents(X)` | Agent writes `findAllComponents(X)[0]!.props("y")` or `.at(0)!.props("y")`, triggers `no-non-null-assertion` or `no-unsafe-call` lint errors, requiring 2-3 iterations to fix | Agent checks existing test patterns first, sees `.find()` / `.map()` convention, writes `.find((c) => c.props("title") === "expected")?.props("y")` directly | Zero lint iterations on array access patterns in the test file     |
| Test needs to verify the order of rendered components                    | Agent uses index-based access like `sections[0].props("title")` with non-null assertion                                                                                       | Agent uses `.map((s) => s.props("title"))` and asserts on the full array with `toEqual()`                                                                    | The assertion uses `.map()` + `toEqual()`, not index access        |
| Test needs to find a specific component among many of the same type      | Agent iterates through approaches: `[0]!` → `.at(0)!` → `.find()` as each fails lint                                                                                          | Agent goes directly to `.find((chip) => chip.text() === "expected")` based on training                                                                       | First test-writing pass uses `.find()` pattern — no rework commits |

**Verdict: Pass** — The failure mode is concrete (lint errors on array access), the fix is specific (use `.find()` / `.map()` over index access), and the assertion is objectively verifiable (zero lint iterations on array patterns). This is a real time-saver: the architect burned ~3 iterations on brick-census and acknowledged burning ~2 more on theme-atlas despite having seen the candidate. Promoting.

### Proposed Knowledge Updates — CFO Disposition

- Pulse metrics update: **Approved.** Will update on next pulse refresh.
- No ADR needed: **Agreed.** These are page-level UI decisions, not architectural patterns.
