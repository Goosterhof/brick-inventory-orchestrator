# Construction Journal: LEGO Brick Shapes -- HTML vs SVG Exploration

**Journal #:** 2026-04-06-lego-brick-shapes
**Filed:** 2026-04-06
**Permit:** `.claude/records/permits/2026-04-06-lego-brick-shapes.md`
**Architect:** Lead Brick Architect

---

## Work Summary

| Action   | File                                                          | Notes                                                 |
| -------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| Created  | `src/shared/components/LegoSlope.vue`                         | HTML/CSS 2x2 45-degree slope with clip-path           |
| Created  | `src/shared/components/LegoSlopeSvg.vue`                      | SVG slope with polygon geometry                       |
| Created  | `src/shared/components/LegoArch.vue`                          | HTML/CSS 1x4 arch with semicircle cutout              |
| Created  | `src/shared/components/LegoArchSvg.vue`                       | SVG arch with path and arc commands                   |
| Created  | `src/shared/components/LegoWedge.vue`                         | HTML/CSS 2x4 wedge plate with clip-path               |
| Created  | `src/shared/components/LegoWedgeSvg.vue`                      | SVG wedge with polygon                                |
| Created  | `src/shared/components/LegoRound.vue`                         | HTML/CSS 1x1 round brick with border-radius           |
| Created  | `src/shared/components/LegoRoundSvg.vue`                      | SVG round brick with circles                          |
| Created  | `src/shared/components/LegoPlate.vue`                         | HTML/CSS 2x4 plate at 1/3 height                      |
| Created  | `src/shared/components/LegoPlateSvg.vue`                      | SVG plate with compact body                           |
| Created  | `src/shared/components/LegoTile.vue`                          | HTML/CSS 1x2 tile (no studs)                          |
| Created  | `src/shared/components/LegoTileSvg.vue`                       | SVG tile (no studs)                                   |
| Created  | `src/shared/components/LegoTechnicBeam.vue`                   | HTML/CSS 1x4 beam with pin holes                      |
| Created  | `src/shared/components/LegoTechnicBeamSvg.vue`                | SVG beam with pin holes (only component I authored)   |
| Created  | `src/apps/showcase/components/BrickShapes.vue`                | Showcase section displaying all 7 shapes side-by-side |
| Modified | `src/apps/showcase/App.vue`                                   | Added BrickShapes import and section                  |
| Created  | `src/tests/unit/shared/components/LegoSlope.spec.ts`          | 7 tests                                               |
| Created  | `src/tests/unit/shared/components/LegoSlopeSvg.spec.ts`       | 9 tests                                               |
| Created  | `src/tests/unit/shared/components/LegoArch.spec.ts`           | 7 tests                                               |
| Created  | `src/tests/unit/shared/components/LegoArchSvg.spec.ts`        | 9 tests                                               |
| Created  | `src/tests/unit/shared/components/LegoWedge.spec.ts`          | 7 tests                                               |
| Created  | `src/tests/unit/shared/components/LegoWedgeSvg.spec.ts`       | 8 tests                                               |
| Created  | `src/tests/unit/shared/components/LegoRound.spec.ts`          | 7 tests                                               |
| Created  | `src/tests/unit/shared/components/LegoRoundSvg.spec.ts`       | 8 tests                                               |
| Created  | `src/tests/unit/shared/components/LegoPlate.spec.ts`          | 8 tests                                               |
| Created  | `src/tests/unit/shared/components/LegoPlateSvg.spec.ts`       | 8 tests                                               |
| Created  | `src/tests/unit/shared/components/LegoTile.spec.ts`           | 6 tests                                               |
| Created  | `src/tests/unit/shared/components/LegoTileSvg.spec.ts`        | 6 tests                                               |
| Created  | `src/tests/unit/shared/components/LegoTechnicBeam.spec.ts`    | 7 tests                                               |
| Created  | `src/tests/unit/shared/components/LegoTechnicBeamSvg.spec.ts` | 9 tests                                               |
| Created  | `src/tests/unit/apps/showcase/components/BrickShapes.spec.ts` | 6 tests                                               |

## Permit Fulfillment

| Acceptance Criterion                                                 | Met | Notes                                                             |
| -------------------------------------------------------------------- | --- | ----------------------------------------------------------------- |
| All 7 shape categories rendered in both HTML/CSS and SVG             | Yes | 14 components total: 7 HTML, 7 SVG                                |
| Showcase section displays all shapes with HTML vs SVG comparison     | Yes | BrickShapes.vue section #14 with side-by-side grid                |
| Each component has proper TypeScript props with inline types         | Yes | All use `defineProps<{color?: string; shadow?: boolean}>()`       |
| All components use brick design system colors and neo-brutalist look | Yes | 3px borders, 4px shadows, black strokes                           |
| SVG components have proper ARIA labels/accessibility                 | Yes | All SVG components have `role="img"` and descriptive `aria-label` |
| 100% test coverage on all new components                             | Yes | 100% lines, functions, branches, statements                       |
| Full quality gauntlet passes                                         | Yes | All 7 checks green                                                |
| Construction journal includes HTML vs SVG comparison matrix          | Yes | See below                                                         |

## HTML vs SVG Comparison Matrix

| Shape       | HTML Complexity | SVG Complexity | HTML Approach                          | SVG Approach                           | Winner   | Why                                                                                       |
| ----------- | --------------- | -------------- | -------------------------------------- | -------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| **Slope**   | Medium          | Medium         | clip-path polygon + stacked divs       | polygon + rect + circle groups         | **SVG**  | SVG slope geometry is explicit and precise; HTML clip-path clips the border too           |
| **Arch**    | Medium          | Medium         | Semicircle div with border-radius hack | Path with arc command + fill-rule      | **SVG**  | SVG arch cutout is a real geometric subtraction; HTML relies on overlaid white div        |
| **Wedge**   | Low             | Medium         | Single div with clip-path polygon      | Polygon vertices + stud circles        | **Tie**  | HTML is simpler (one div) but clip-path clips shadow/border; SVG is geometrically cleaner |
| **Round**   | Low             | Low            | border-radius 50%/20% + stud div       | Circle elements                        | **SVG**  | Circles in SVG are native primitives; HTML border-radius approximation is imprecise       |
| **Plate**   | Low             | Medium         | Same as LegoBrick with compact padding | Same as LegoBrickSvg with HEIGHT_RATIO | **HTML** | Trivially a thinner LegoBrick; SVG adds unnecessary computed stud layout overhead         |
| **Tile**    | Trivial         | Low            | Single styled div                      | Two rects (body + shadow)              | **HTML** | 15 lines vs 38 lines; no studs means no geometry advantage for SVG                        |
| **Technic** | Low             | Low            | Div with white circle pin holes        | Rect with circle pin holes             | **Tie**  | Both approaches map naturally; SVG holes are true geometric circles                       |

**Overall finding:** SVG wins for shapes with non-rectangular geometry (slopes, arches, rounds) where precise geometric primitives matter. HTML/CSS wins for rectangular variants (plates, tiles) where the shape is a trivial CSS modification. For shapes that are borderline (wedge, technic beam), both approaches are viable.

## Decisions Made

1. **LegoTechnicBeamSvg was the only component I created from scratch** -- 13 of 14 components already existed as untracked files on the branch. I checked git status before creating any files, which saved significant time. The existing components followed the conventions from `LegoBrick.vue` and `LegoBrickSvg.vue` consistently.

2. **Used data attributes for testability** -- All components use `data-stud`, `data-body`, `data-shadow`, `data-arch`, `data-pin-hole`, `data-slope`, `data-tile` attributes for test selectors, consistent with the existing `LegoBrickSvg.vue` pattern of `data-shadow` and `data-body`.

3. **Showcase section uses `<component :is>` for shape pairs** -- Rather than importing and manually placing 14 components in the template, the `shapes` array maps each entry to its HTML and SVG component references. This makes the comparison grid data-driven and extensible.

4. **No gradient defs on LegoTechnicBeamSvg** -- Unlike other SVG shapes, the Technic beam has no studs (only pin holes rendered as white circles), so no radial gradient for 3D stud effect is needed. This keeps the component lean.

## Quality Gauntlet

| Check         | Result | Notes                                       |
| ------------- | ------ | ------------------------------------------- |
| format:check  | Pass   |                                             |
| lint          | Pass   | 0 warnings, 0 errors                        |
| lint:vue      | Pass   | All conventions passed                      |
| type-check    | Pass   |                                             |
| test:coverage | Pass   | 100% lines, branches, functions, statements |
| knip          | Pass   |                                             |
| size          | Pass   |                                             |

## Showcase Readiness

Strong. The BrickShapes section demonstrates two things a reviewing architect would appreciate: (1) the team understands the tradeoffs between HTML/CSS and SVG rendering and chose deliberately per shape, and (2) the component API is consistent across all 14 variants -- same props interface, same styling conventions, same test patterns. The side-by-side comparison is the kind of technical depth that distinguishes a portfolio piece from a toy project, as the CFO noted in the permit.

## Proposed Knowledge Updates

- **Learnings:** JSDOM normalizes CSS shorthand properties in style attributes. `border-radius: 999px 999px 0 0` becomes `border-radius: 999px 999px 0px 0px` in JSDOM. Test assertions should use the normalized form.
- **Pulse:** Shared component count increased significantly (from ~33 to 47 per the registry auto-generation). Pattern maturity for Brick Brutalism design system further strengthened.
- **Domain Map:** Add BrickShapes to the Showcase app component list.
- **Component Registry:** Auto-generated; no manual update needed.
- **Decision Record:** Not needed. No significant architectural choice was made -- all components follow established patterns from the existing LegoBrick/LegoBrickSvg pair.

## Self-Debrief

### What Went Well

- Checking `git status` first revealed 13 of 14 components already existed. This saved massive time vs. creating them from scratch.
- The existing LegoBrick/LegoBrickSvg pair provided a clear template. All new components are structurally consistent.
- Tests passed almost entirely on first run -- only 2 JSDOM normalization issues to fix.
- Full gauntlet passed on first attempt after formatting.

### What Went Poorly

- Hit JSDOM style normalization twice: `border-radius: 999px 999px 0 0` normalized to `0px 0px`, and `border-radius: 50% / 20%` expanded into longhand properties and not present in `style` attribute at all. Both required test adjustments.

### Blind Spots

- Did not verify npm dependencies were installed before attempting to run tests. Could have saved one failed command.

### Training Proposals

| Proposal                                                                                                                                                                            | Context                                                                                   | Shift Evidence               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------- |
| When testing CSS shorthand properties in JSDOM (border-radius, margin, padding), always check the normalized/longhand form -- JSDOM expands shorthands and adds `px` to zero values | Hit on LegoArch (`0` -> `0px`) and LegoRound (`50% / 20%` expanded to individual corners) | 2026-04-06-lego-brick-shapes |

---

## CFO Evaluation

### Assessment

Solid delivery. 14 components, 112 tests, full gauntlet green, all acceptance criteria met. The comparison matrix is the real deliverable here — it's a defensible technical artifact that demonstrates the team understands rendering tradeoff analysis, not just "we can draw shapes."

### Work Quality

- **Component consistency:** All 14 follow the same prop interface (`color?`, `shadow?`), same naming convention, same data-attribute testability pattern. This is what scales.
- **SVG craftsmanship:** `LegoSlopeSvg.vue` shows proper geometric thinking — polygon for the slope surface, rect for the body, gradient-overlaid circles for studs. Clean separation of concerns within the SVG.
- **HTML pragmatism:** `LegoArch.vue` honestly demonstrates the limitation — the arch cutout is a white div overlay, not a true geometric subtraction. The journal correctly flagged this as a reason SVG wins for non-rectangular shapes.
- **Showcase section:** The `<component :is>` data-driven approach is clean and extensible. Good call.
- **The "13 of 14 already existed" note:** Architect correctly checked `git status` before creating files — that's the graduated training from 2026-03-28 in action. Good to see it working.

### Comparison Matrix Verdict

The findings are sound: SVG for geometry, HTML for simplicity on rectangles. This aligns with my pre-permit prediction, and now we have the code to prove it. That's the point.

### Training Proposal Disposition

| Proposal                                                      | Verdict       | Reason                                                                                                                                                           |
| ------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JSDOM CSS shorthand normalization: always check longhand form | **Candidate** | Hit twice within the same shift (LegoArch + LegoRound), demonstrating it's a recurring pattern. First observation — needs a second confirming shift to graduate. |

### Graduation Check

No graduations this round. The JSDOM shorthand proposal is a first-observation candidate. No existing candidates received second confirmation from this shift.

### Concerns

None. Clean delivery, accurate self-assessment, honest about the JSDOM stumble. The architect noted only 1 of 14 components was authored from scratch — that's transparency, not laziness.
