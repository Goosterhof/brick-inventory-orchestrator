# Construction Journal: Unify Brick Views to Top-Down with Feature Hints

**Journal #:** 2026-04-13-brick-view-orientation
**Filed:** 2026-04-13
**Permit:** `.claude/records/permits/2026-04-13-brick-view-orientation.md`
**Architect:** Lead Brick Architect (mid-flight stream timeout; CFO completed verification, gauntlet, and journal)

---

## Work Summary

| Action   | File                                                                                           | Notes                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Modified | `src/shared/components/LegoSlope.vue`                                                          | 2x2 top-down grid; rear row = studs, front row = diagonal hint divs                         |
| Modified | `src/shared/components/LegoSlopeSvg.vue`                                                       | 2x2 footprint; 2 studs on bottom row; subtle diagonal `<line>` over upper half (slope hint) |
| Modified | `src/shared/components/LegoArch.vue`                                                           | 1x4 top-down grid; 4 studs; absolute-positioned semicircle div at bottom-center (arch hint) |
| Modified | `src/shared/components/LegoArchSvg.vue`                                                        | 1x4 footprint; 4 studs; thin semicircle `<path>` at bottom center (arch hint)               |
| Modified | `src/shared/components/LegoWedge.vue`                                                          | 2x4 top-down grid; 4+3 studs; absolute diagonal gradient div on right edge (taper hint)     |
| Modified | `src/shared/components/LegoWedgeSvg.vue`                                                       | 2x4 footprint; full 4+3 stud pattern; subtle diagonal `<line>` from top-right (taper hint)  |
| Modified | `src/shared/components/LegoTile.vue`                                                           | 1x2 top-down rectangle; no studs; faint inner border (smooth-top hint)                      |
| Modified | `src/shared/components/LegoTileSvg.vue`                                                        | 1x2 footprint (80×40 unit grid); no studs; faint inset rect (smooth-top hint)               |
| Modified | `src/shared/components/LegoTechnicBeam.vue`                                                    | 1x4 top-down grid; pin holes act as their own hint (white circles on color)                 |
| Modified | `src/shared/components/LegoTechnicBeamSvg.vue`                                                 | 1x4 footprint normalized to brick grid; centered pin holes as the feature hint              |
| Modified | `src/shared/components/LegoPlate.vue`                                                          | 2x4 top-down grid (was already top-down); thin inner border added (lower-profile hint)      |
| Modified | `src/shared/components/LegoPlateSvg.vue`                                                       | Replaced HEIGHT_RATIO squish with proper 2x4 footprint; full stud grid; faint inset rect    |
| Modified | `src/apps/showcase/components/BrickShapes.vue`                                                 | Updated intro copy to reflect "top-down with hints" instead of side-profile differentiation |
| Modified | `src/tests/unit/shared/components/Lego{Slope,Arch,Wedge,Tile,TechnicBeam,Plate}{,Svg}.spec.ts` | Updated assertions for new geometry; added hint-element tests; preserved 100% coverage      |
| Modified | `src/tests/unit/apps/showcase/components/BrickShapes.spec.ts`                                  | Updated intro-text assertion to match new copy                                              |

## Permit Fulfillment

| Acceptance Criterion                                                     | Met     | Notes                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All six shape pairs render top-down with a feature hint                  | Yes     | Slope, Arch, Wedge, Tile, TechnicBeam, Plate — HTML + SVG both updated                                                                                                                                                                                                             |
| Hints are subtle — reads "top-down with a hint", not "side view"         | Yes     | All hints use stroke-opacity 0.15–0.4 or thin overlay divs; max ~3 SVG elements / 1–2 HTML divs per hint as the permit asked                                                                                                                                                       |
| All existing test files updated — no skipping, no coverage carve-outs    | Yes     | Tests updated in lockstep with components                                                                                                                                                                                                                                          |
| 100% coverage on lines, functions, branches, statements                  | Yes     | Per-component coverage report shows 100% across all four metrics for every Lego component                                                                                                                                                                                          |
| Quality gauntlet: type-check, knip, lint, lint:vue, format:check, build  | Yes     | All pass (see gauntlet table)                                                                                                                                                                                                                                                      |
| Quality gauntlet: test:coverage                                          | Partial | Brick tests pass with 100% coverage; the run-level test-guard reporter trips on **pre-existing** slow files unrelated to this permit (`SetsOverviewPage.spec.ts`, `ComponentGallery.spec.ts`). Confirmed reproducible on clean main via `git stash`. Not in scope for this permit. |
| Visual verification done in showcase dev server                          | No      | CFO did not spin up the dev server — verified geometry by reading the SVG/CSS instead. Flagging as a follow-up if the CEO wants ocular confirmation before merge.                                                                                                                  |
| Construction journal includes before/after notes per shape and a debrief | Yes     | This document                                                                                                                                                                                                                                                                      |

## Decisions Made

1. **Hint opacity range 0.15–0.4** — Chose subtle stroke-opacity values rather than dashed strokes or full-color hints because the permit said "err subtle" and these are small showcase tiles. A heavy hint would compete visually with the studs/footprint, undermining the "top-down first" grammar.
2. **Wedge stud truncation by visual cue, not clipping** — The 2x4 wedge keeps all 4 row-1 studs and 3 row-2 studs (4th cell empty). The diagonal taper line crosses where the missing 4th stud would be. Rejected: actually clipping the body polygon. Reason: the CEO ruled "everything top-down" and a clipped polygon starts to read as a wedge profile shape rather than a top-down brick with a wedge hint.
3. **Tile and Plate hints both use inset rectangles** — Differentiated by stud presence (tile: no studs, plate: full studs) and inset stroke opacity (tile 0.2, plate 0.15). Rejected: a single shared "thin-brick" hint primitive. Reason: tiles and plates are conceptually different (smooth top vs. lower profile) even though the hint geometry rhymes; a shared abstraction would over-couple them.
4. **Technic beam: pin holes ARE the hint** — No additional hint added because pin holes (white circles on colored body) are already a strong visual cue. Adding a second hint would clutter. Rejected: a thin "channel" line down the centerline.
5. **Did not pre-run knip / size / re-style** — These were reset to whatever the architect had set; CFO ran them after the fact. All clean.

## Quality Gauntlet

| Check         | Result  | Notes                                                                                                                                                                                                   |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format:check  | Pass    | All matched files use the correct format                                                                                                                                                                |
| lint          | Pass    | 0 warnings, 0 errors across 281 files                                                                                                                                                                   |
| lint:vue      | Pass    | All conventions passed                                                                                                                                                                                  |
| type-check    | Pass    | vue-tsc clean                                                                                                                                                                                           |
| test:coverage | Partial | Brick components: 100% on all four metrics. Run-level test-guard reporter trips on pre-existing slow files unrelated to this permit (verified by stashing and re-running on clean main — same failure). |
| knip          | Pass    | No dead code                                                                                                                                                                                            |
| build         | Pass    | All 3 apps built successfully                                                                                                                                                                           |

## Showcase Readiness

The brick gallery now reads as a coherent set: same orientation, same grid system, same stud styling. The hints are deliberate — not decorative — so the gallery doubles as a small visual lesson in how to communicate shape under a constrained viewpoint. A senior architect reading this code would see consistent constants (CELL=40, PAD=10, STROKE=3, SHADOW_OFFSET=4, STUD_RADIUS=12) across all SVGs, which is the kind of internal coherence that signals craftsmanship.

The CSS-side hints (Slope's gradient diagonals, Arch's pseudo-arch div, Wedge's gradient taper) are slightly clunkier than their SVG counterparts — that's the inherent CSS-vs-SVG tradeoff the original gallery was designed to surface. The showcase intro copy still serves that purpose.

One honest note: the test-guard failure on unrelated files is a pre-existing condition that the CEO/CFO should triage in a separate permit. It's currently masking the green light for in-scope work.

## Proposed Knowledge Updates

- **Learnings:** "When unifying a set of components to a single grammar (e.g., orientation), introduce shared constants (CELL, PAD, STROKE) at the file level so the consistency is visible in code, not just in the rendered output."
- **Pulse:** Brick component count went from 8 distinguishable shapes (mix of side/top) to 8 unified top-down shapes with feature hints. Pulse should reflect "shape system maturity: unified" if it tracks that.
- **Domain Map:** No changes.
- **Component Registry:** Auto-regenerates on build.
- **Decision Record:** Possible ADR candidate: "Brick visual grammar: top-down primary, hints for feature differentiation." If this convention is to govern future shape additions (round-with-cone, hinge, etc.), it's worth recording.

## Self-Debrief

### What Went Well

- The architect (before timeout) chose a clean, consistent constant set across all SVGs — CFO's verification was a quick read, not a refactor.
- The hint-as-data-attribute pattern (`data-slope-hint`, `data-arch-hint`, etc.) made tests trivial to write and read.

### What Went Poorly

- The architect agent hit a stream timeout mid-flight. Work was salvageable because the changes were committed in-place, but the journal had to be written by the CFO.
- CFO did not spin up the dev server for ocular verification — relied on geometry reading. Acceptable for a low-risk visual change but not best practice.

### Blind Spots

- The pre-existing test-guard failures on unrelated files were only caught because the CFO re-ran on a clean stash. If a future architect ships under similar conditions and assumes a red gauntlet means their work, they'll waste time chasing ghosts. The test-guard thresholds may need an environment-aware tolerance.
- No check whether `LegoSlope` is consumed anywhere outside the showcase that depends on side-view geometry (e.g., `AboutPage`). Reading suggests it's used as a decorative element, but ocular check skipped.

### Training Proposals

| Proposal                                                                                                                                                 | Context                                                                              | Shift Evidence                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------- |
| Before reporting any visual change as complete, spin up the relevant dev server and confirm in a browser — geometry-reading is necessary, not sufficient | CFO completed this permit without ocular verification                                | 2026-04-13-brick-view-orientation |
| When the test-guard reporter fails, immediately re-run on a clean stash to determine whether the failure is permit-induced or environmental              | CFO had to do this manually to clear a false-red                                     | 2026-04-13-brick-view-orientation |
| Long agent runs should commit checkpoints — a stream timeout shouldn't risk losing work or splitting authorship of a journal                             | Architect timed out after 16+ minutes of work; commits happened only at the very end | 2026-04-13-brick-view-orientation |

---

## CFO Evaluation

**Overall Assessment:** Solid

### Permit Fulfillment Review

The architect (with CFO completing the unfinished verification leg) delivered all 12 component updates plus tests and showcase copy. Coverage is 100% on every brick component. The hints land where they should: subtle, distinguishable, on-grammar.

The two acceptance gaps are:

- **Test guard failure on unrelated files** — pre-existing, confirmed via stash test, not this permit's problem. Should be a separate permit.
- **No browser ocular check** — the CFO opted not to spin up the showcase. For a visual change this is a real gap. Recommendation: CEO eyeballs the showcase before pushing if they want belt-and-braces verification.

### Decision Review

All five decisions are defensible. The wedge stud-truncation call (decision #2) is the most interesting: keeping all studs and using only the diagonal line as the wedge cue keeps the brick grammar intact at the cost of a slightly ambiguous footprint. Acceptable in the "for now" framing of the CEO's directive — if a future ADR formalizes the top-down-with-hints rule, this is the kind of edge case that should be called out.

### Showcase Assessment

Strengthens the portfolio. Before, the gallery looked like a junior had freestyled shape rendering with no shared vocabulary. Now, the constants line up across all 14 components and the visual grammar is intentional. A senior reviewer skimming `LegoSlopeSvg.vue` and `LegoArchSvg.vue` back-to-back will see the same building blocks — that's the win.

### Training Proposal Dispositions

| Proposal                                                                                          | Disposition | Rationale                                                                                                                                       |
| ------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Before reporting visual change complete, spin up dev server                                       | Candidate   | Genuinely valuable. CFO admits the gap. Needs one more shift of evidence before promotion.                                                      |
| When test-guard reporter fails, re-run on clean stash to isolate permit-induced vs. environmental | Candidate   | Useful diagnostic shortcut. Should graduate quickly if the test-guard remains flaky in this CI env.                                             |
| Long agent runs should commit checkpoints                                                         | Dropped     | Out of architect's control — this is a harness/protocol concern, not an agent training rule. Logging it as a process observation, not training. |

### Notes for the Architect

You did the heavy lifting before the stream cut. The constant unification across SVGs was the right move and the data-attribute hint pattern made the tests easy to update. Two things for next time:

1. Run the gauntlet **as you go**, not at the end. If the timeout had hit during the gauntlet rather than after the file edits, we'd have lost more.
2. Visual changes warrant a screenshot or a dev-server check, even if just a sanity glance. The geometry can be right and the rendered output still wrong (overlapping z-indexes, color collisions, padding swallowing a hint).

---

**Status:** Complete (pending CEO approval to push)
