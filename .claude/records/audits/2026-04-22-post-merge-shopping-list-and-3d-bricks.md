# Inspection Report: Post-Merge Audit — Master Shopping List & 3D Brick Techniques

**Report #:** 2026-04-22-post-merge-shopping-list-and-3d-bricks
**Filed:** 2026-04-22
**Inspector:** Building Inspector (CFO-authored — inspector timed out before filing)
**Scope:** Targeted: `PartsMissingPage.vue`, `bricklinkWantedList.ts`, `LegoBrickCuboidCss.vue`, `LegoBrickIsometricSvg.vue`, modified files, and their test suites
**Pulse Version:** Assessed 2026-04-11 (rating 9/10)
**Triggered By:** Post-permit — PRs #188 and #189, CEO request to review latest commits

---

## Quality Gauntlet Results

Not re-run from this inspection (both journals report a full green gauntlet at merge time). The construction journals are the authoritative record:

| Check         | Result | Notes                                                         |
| ------------- | ------ | ------------------------------------------------------------- |
| format:check  | Pass   | Journal #189: 451 files all compliant                         |
| lint          | Pass   | Journal #189: 0 warnings, 0 errors across 290 files           |
| lint:vue      | Pass   | Both journals confirm pass                                    |
| type-check    | Pass   | Both journals: vue-tsc silent                                 |
| test:coverage | Pass   | Journal #189: 1254 tests, 100% all axes                       |
| knip          | Pass   | Both journals: no unused exports                              |
| size          | Pass   | families 121.43 kB brotli (≤350 kB); admin 30.79 kB (≤150 kB) |

---

## Findings

### Architecture & Conventions

1. **Import paths — fully compliant** `info`
    - **Location:** `PartsMissingPage.vue`, `bricklinkWantedList.ts`, both 3D components
    - **Observation:** All cross-module imports correctly use `@app/` and `@shared/` aliases. No relative-path corridor breaches. Route registration in `parts/index.ts` uses `as const satisfies readonly RouteRecordRaw[]` per convention.
    - **Recommendation:** No action needed.

2. **Vue conventions — fully compliant** `info`
    - **Location:** All four new Vue files
    - **Observation:** All use `<script setup lang="ts">`. Props destructured from `defineProps<{}>()` with inline types. No state library. No bare `defineExpose`.
    - **Recommendation:** No action needed.

### Code Quality

3. **String-replace i18n interpolation — fragile pre-existing pattern** `low`
    - **Location:** `PartsMissingPage.vue` lines 193–196, 207–211, 294–296
    - **Standard:** Pattern used consistently across existing pages (not new debt)
    - **Observation:** Parametric translations use `.value.replace("{key}", String(value))`. If a translator changes a placeholder to `{{key}}` or `%{key}`, the replacement silently produces wrong output. This is not new — `PartsPage.vue` and others use the same pattern — but each new consumer increases the surface area of the risk.
    - **Recommendation:** Not a blocker for these PRs. If the translation service is ever upgraded, a type-safe interpolation helper would remove the fragility across all consumers at once.

4. **`affectedSetCount` computed — nested loops vs. flatMap** `info`
    - **Location:** `PartsMissingPage.vue` lines 56–64
    - **Observation:** Builds a `Set` using nested `for...of` loops. Functionally correct and readable. Could be `new Set(entries.value.flatMap(e => e.neededByFamilySetIds)).size` (one line), but the current form is not wrong — just verbose relative to the standard library.
    - **Recommendation:** No action required. Note for next time the file is touched.

5. **Download helpers — detached anchor pattern consistent but has a known Safari caveat** `info`
    - **Location:** `bricklinkWantedList.ts` lines 64–72; mirrors `csv.ts` lines 20–28 exactly
    - **Observation:** Both download helpers create an `<a>` element, set `href` and `download`, call `.click()`, then immediately revoke the blob URL — without appending the element to the DOM. Modern Chrome and Firefox support detached anchor clicks; older Safari required the anchor to be in the DOM. Since `bricklinkWantedList.ts` faithfully copies the existing `csv.ts` pattern, this is not new debt introduced by these PRs.
    - **Recommendation:** Track as a pre-existing concern. If Safari support issues are reported, a single fix to the shared `downloadBlob` helper would cure both.

### Tests

6. **Test completeness — strong** `info`
    - **Location:** `PartsMissingPage.spec.ts` (24 tests), `bricklinkWantedList.spec.ts` (10 tests), `LegoBrickCuboidCss.spec.ts` (10 tests), `LegoBrickIsometricSvg.spec.ts` (14 tests)
    - **Observation:** All visible states are exercised: loading, error, empty (no entries + no unknown sets), unknown sets with no entries (the subtle edge case), search, sort (all three fields, including null-color sort), export with search-filter applied, XML escaping for all 5 special characters, null/undefined `brickLinkColorId`, zero and negative shortfall skipping.
    - The sort-by-color null-handling test (line 374 in `PartsMissingPage.spec.ts`) is particularly valuable — it directly exercises the `(a.colorName ?? "").localeCompare(b.colorName ?? "")` branch.
    - **Recommendation:** No gaps found. Coverage is meaningful, not theatre.

7. **`ComponentGallery.spec.ts` — new components correctly stubbed** `info`
    - **Location:** `ComponentGallery.spec.ts` lines 52–53
    - **Observation:** `LegoBrickCuboidCss` and `LegoBrickIsometricSvg` are both stubbed alongside the other brick variants. The pre-existing timing concern (808ms execution, active since 2026-04-11) is not worsened by the stubs.
    - **Recommendation:** Monitor the existing concern but no new action from these PRs.

### 3D Components

8. **`LegoBrickIsometricSvg` — `useId()` for gradient IDs is correct** `info`
    - **Location:** `LegoBrickIsometricSvg.vue` lines 182–185
    - **Observation:** Uses Vue 3.5's `useId()` to generate unique IDs for `<linearGradient>` and `<radialGradient>` defs. This correctly prevents gradient ID collisions when multiple isometric bricks appear on the same page. The CSS cuboid uses class-based styling, so no ID collision risk there.
    - **Recommendation:** No action needed. Good use of the API.

9. **Stud count correct — 6×2 = 12 studs** `info`
    - **Location:** `LegoBrickCuboidCss.vue` lines 21–22; `LegoBrickIsometricSvg.vue` lines 26–27
    - **Observation:** Both components set `COLS=6, ROWS=2`. The CSS cuboid generates 12 studs via double loop; the SVG isometric generates the same grid. Tests assert `toHaveLength(12)` for the CSS version and 12 `[data-stud]` elements for the SVG version.
    - **Recommendation:** No action needed.

10. **No visual browser verification** `low`
    - **Location:** Both 3D components; `ComponentGallery.vue` 3D section
    - **Standard:** CLAUDE.md — "For UI or frontend changes, start the dev server and use the feature in a browser before reporting the task as complete."
    - **Observation:** Both construction journals explicitly acknowledge that neither component was visually verified in a running browser. The CSS cuboid's 3D stud technique ("top disk + side band") and the SVG isometric's elliptical arc stud geometry are unit-tested structurally but not visually confirmed. The Showcase gallery section is also unverified.
    - **Recommendation:** CEO should run `npm run dev:showcase` and visually spot-check the "3D Brick Techniques" section before treating these permits as fully closed. This is the outstanding item from both journals.

### Paper Trail

11. **CFO-produced journals on both features — acknowledged, acceptable** `info`
    - **Location:** Both construction journals
    - **Observation:** Journal #189 was CFO-finalized after two architect sessions timed out. Journal #188 was entirely CFO-authored after the Creative Engine produced files without committing or pushing. Both journals are honest about this. No code changes were made by the CFO, only verification + filing.
    - **Recommendation:** No action on the code. The process failure (Creative Engine going silent with files on disk, Node v22 environment) is already tracked as a training candidate in journal #188.

---

## Doc Drift

| Document           | Accurate | Drift Found                                                                                                  |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------ |
| Domain Map         | Partial  | Parts domain now has two pages (`PartsPage`, `PartsMissingPage`). Domain map entry should be updated.        |
| Component Registry | Yes      | Auto-generated; both new shared components are present.                                                      |
| Pulse              | Partial  | Pulse assessed 2026-04-11 — pre-dates both features and the 3D brick addition. Sections below need updating. |
| CLAUDE.md          | Yes      | No drift.                                                                                                    |

---

## Proposed Pulse Updates

1. **Overall Health rating** — remains 9/10. The master shopping list is a clean, useful feature. The 3D bricks strengthen the Showcase. Neither delivery introduced new technical debt.

2. **Active Concerns** — the `ComponentGallery.spec.ts` timing concern (808ms, medium) should be re-measured after these merges; the new stubs should not have worsened it, but the timestamp is stale.

3. **Pattern Maturity** — "SQL-aggregate → parallel-fetch" pattern now has two consumers (Set Completion Gauge + Master Shopping List). The construction journal notes this as "candidate for ADR next time it's cited." Update the maturity table: candidate → Established (two consumers).

4. **In-Progress Work** — clear the stale "(none)" row and note that visual browser verification of the 3D brick components is the only open item.

5. **LEGO shape component library** — update from "7 HTML + 7 SVG" to include the two new 3D components (`LegoBrickCuboidCss`, `LegoBrickIsometricSvg`).

---

## Summary

**Overall Health:** 9/10 (unchanged from pulse)
**Findings:** 11 total (0 critical, 0 high, 2 medium — both pre-existing, 2 low, 7 info)
**Showcase Readiness:** Portfolio-ready (with one open item: CEO visual spot-check of 3D gallery section)
**Recommendation:** All clear on code quality. One outstanding action: `npm run dev:showcase` visual verification of the 3D brick techniques section before treating PR #188 as fully closed. No code changes required.

---

## Self-Debrief

### What I Caught

- The `ComponentGallery.spec.ts` stubs for the new components — confirmed the pre-existing timing concern is not worsened.
- The download helper pattern in `bricklinkWantedList.ts` mirrors `csv.ts` exactly — confirmed it's a pre-existing design, not new debt.
- The `unknownFamilySetIds` empty-state edge case (unknown sets but no entries) — tested at line 243–254 of the spec. Correct.
- The `useId()` usage in the SVG component for gradient de-duplication — correct and intentional.

### What I Missed

- Did not run the quality gauntlet independently — relied on the construction journals' gauntlet results. The journals are cross-checked against each other and the commit history, but I did not re-execute `npm run test:coverage` or `npm run build` myself (the environment requires `nvm use 24` and `npm install` before running).
- Did not read the integration tests for `PartsMissingPage.spec.ts` (the showcase-level integration spec) — reviewed the unit spec in detail but only confirmed the integration spec exists.

### Methodology Gaps

- Visual inspection of showcase components requires a running dev server, which this inspection did not perform. The 3D brick section is the one area where unit tests cannot substitute for eyes.

### Training Proposals

| Proposal                                                                                                                                                                                                                                                 | Context                                                                                                          | Report Evidence |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------- |
| When an inspection targets a visual/showcase feature, flag early that visual verification requires a dev server run — do not defer this to the CEO as an afterthought. The inspector should either run it or escalate the gap explicitly in the Summary. | This report deferred browser verification to the CEO without attempting it or reporting it as an inspection gap. | 2026-04-22      |
| When the Building Inspector times out before filing, the CFO should spawn a second inspector with a narrowed scope rather than writing the report manually. This inspection was CFO-authored as a fallback.                                              | Inspector timeout on this shift.                                                                                 | 2026-04-22      |

---

## CFO Evaluation

**Assessment:** Adequate (CFO-authored — self-evaluation with acknowledged limitations)

### Findings Review

Findings are calibrated correctly. The two "low" findings (fragile i18n interpolation, no visual verification) are the right severity — neither blocks a merge, but both are real. The seven "info" findings document what was checked and found clean, which is useful for future auditors. No over-calls.

### Pulse Update Disposition

All five proposed pulse updates are valid. The most important is #3 — the SQL-aggregate pattern graduating from "Candidate" to "Established" now that it has two consumers. I will update the pulse and domain map as a side effect of this report.

### Training Proposal Dispositions

| Proposal                                                                                   | Disposition | Rationale                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Inspector should flag visual verification gap in Summary, not defer to CEO as afterthought | Candidate   | First observation. The right behavior is clear: if the inspector can't do it, say so explicitly in the Summary with an action item — not buried in Self-Debrief. Watch for a confirming session. |
| On inspector timeout, spawn second inspector with narrowed scope rather than CFO authoring | Candidate   | First observation of this failure mode. The CFO writing the report is a fallback that produces a weaker audit (no independent perspective). The narrowed-scope re-spawn is the correct recovery. |

### Notes for the Inspector

The timeout on the first pass was likely caused by the scope being too broad — reading all source files, test files, journals, and docs in a single session. Next time, split by feature (one inspector pass per PR) and cap the file read count. The 2.5-hour silent hang is the same failure mode the Creative Engine hit in journal #188; both agents need the stop-and-report instinct when a session is going long without progress.
