# Construction Journal: 3D 6x2 Brick — Technique Comparison

**Journal #:** 2026-04-16-3d-brick-techniques
**Filed:** 2026-04-16
**Permit:** `.claude/records/permits/2026-04-16-3d-brick-techniques.md`
**Architect:** Creative Engine (construction) + CFO (gauntlet + filing)

---

## Work Summary

The Creative Engine drafted both components, their specs, and the ComponentGallery wiring in a single pass but never committed or pushed. The session went silent with files on disk and no completion signal — the pre-push gauntlet was blocked on the Node v22/v24 environment mismatch called out in the permit. The CFO took over, fixed the environment (`nvm use 24` + `npm install`), ran the full gauntlet, and filed this journal.

| Action   | File                                                               | Notes                                                                  |
| -------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Created  | `src/shared/components/LegoBrickCuboidCss.vue`                     | Pure CSS 3D cuboid — six faces, 12 studs as top-disk + side-band combo |
| Created  | `src/shared/components/LegoBrickIsometricSvg.vue`                  | SVG 30° isometric projection — three visible faces + cylindrical studs |
| Created  | `src/tests/unit/shared/components/LegoBrickCuboidCss.spec.ts`      | 10 tests — footprint, faces, studs, color, shadow, transforms          |
| Created  | `src/tests/unit/shared/components/LegoBrickIsometricSvg.spec.ts`   | 14 tests — faces, studs, gradients, viewBox sanity, path shape         |
| Modified | `src/apps/showcase/components/ComponentGallery.vue`                | New "3D Brick Techniques" section with side-by-side comparison caption |
| Modified | `src/tests/unit/apps/showcase/components/ComponentGallery.spec.ts` | Stubs + section test for both new components                           |

**Naming note:** The permit referenced `LegoBrick3dCss.vue` / `LegoBrick3dIsometric.vue`. The Creative Engine chose `LegoBrickCuboidCss` and `LegoBrickIsometricSvg` — matching the existing `LegoBrickSvg` / `LegoBrickSideSvg` pattern (technique suffix rather than `3d` prefix). The CFO accepts this rename: it reads more consistently with the existing brick family and makes the technique explicit in the filename.

## Permit Fulfillment

| Acceptance Criterion                                                                       | Met | Notes                                                                                |
| ------------------------------------------------------------------------------------------ | --- | ------------------------------------------------------------------------------------ |
| CSS component renders 6x2 brick with all six faces                                         | Yes | Top, bottom, front, back, left, right — all present with data-face                   |
| 12 studs visible with cylindrical appearance                                               | Yes | Stud = top disk + side band, assembled with `transform-style: preserve-3d`           |
| SVG component renders brick in isometric projection with 3 visible faces shaded distinctly | Yes | Top / front / right — three gradient overlays per face                               |
| Both components accept `color` with per-face shading                                       | Yes | Body color flat, gradients supply the shading                                        |
| Both components accessible (`role="img"` + `aria-label`)                                   | Yes | Asserted in specs                                                                    |
| Both in Showcase ComponentGallery with comparison caption                                  | Yes | New section, caption explicitly names the tradeoff                                   |
| 100% coverage on new components                                                            | Yes | Lines / Functions / Branches / Statements all 100%                                   |
| ComponentGallery test updated                                                              | Yes | New stubs + new section test                                                         |
| Full gauntlet passes                                                                       | Yes | format:check, lint, lint:vue, type-check, knip, test:coverage, build, size all green |

## Decisions Made

1. **Component names** — Chose `LegoBrickCuboidCss` / `LegoBrickIsometricSvg` over the permit's `LegoBrick3dCss` / `LegoBrick3dIsometric`. Reason: the existing family uses technique suffixes (`Svg`, `SideSvg`), and `Cuboid` reads as "the six-face geometry" while `Isometric` names the projection. Cleaner alphabetical grouping in the shared components directory.
2. **Stud technique in CSS version** — Composed each stud as a top disk (`translateZ(10px)`) plus a thin side ring (3px border on a flat disk) rather than a true extruded cylinder. A true cylinder would require many stacked transform layers; the disk+ring reads as cylindrical in the three-quarter view and stays fast. Documented in the component's doc comment.
3. **Shadow in CSS version** — Used `filter: drop-shadow` on the stage rather than a 7th face at z=0. Follows the brick-shadow pattern from the rest of the design system and avoids z-fighting with the bottom face.
4. **Hover interaction** — Tilts the scene a few degrees on hover via CSS `transition`. Restricted to transform, which the global `prefers-reduced-motion` override neutralizes automatically — no JS logic needed.
5. **SVG projection math** — Pre-computed `cos(30°)` and `sin(30°)` as module constants rather than calling `Math.cos` in every computed. The projection runs once per mount; the readability win outweighs the micro-optimization.
6. **SVG stud geometry** — Side band uses a single `A` (elliptical arc) command along the base ellipse's front half, rather than approximating with bezier curves. Matches the isometric projection exactly — a stud's base really is an ellipse with `rx = STUD_RADIUS * cos(30°)`, `ry = STUD_RADIUS * sin(30°)`.
7. **viewBox bounds** — Computed from projected corners plus stud headroom and shadow offset, rather than hard-coded. Means the SVG crops tight to content at any `STUD_HEIGHT` / `BODY_HEIGHT` combination if we ever parameterize them.

## Quality Gauntlet

| Check         | Result | Notes                                                                |
| ------------- | ------ | -------------------------------------------------------------------- |
| format:check  | Pass   | All files compliant                                                  |
| lint          | Pass   | 0 warnings, 0 errors across 287 files                                |
| lint:vue      | Pass   | All conventions passed                                               |
| type-check    | Pass   | vue-tsc clean                                                        |
| test:coverage | Pass   | 1221 / 1221 tests, 100% on lines / branches / functions / statements |
| knip          | Pass   | No unused exports or files                                           |
| build         | Pass   | All three apps built — families 117.7 kB brotli, admin 30.79 kB      |
| size          | Pass   | Both apps under size budgets                                         |

## Showcase Readiness

Strong. The portfolio now covers four rendering techniques for the same primitive (HTML/CSS top-down, SVG top-down, SVG side, and now two 3D approaches side-by-side). The gallery caption makes the tradeoff explicit — a senior reviewer sees not just that we can render a brick three ways, but that we understand _why_ you'd pick each technique. The 30° projection math is documented inline, the stud ellipse derivation is spelled out, and the CSS hover interaction is tied to the reduced-motion override without bespoke JS.

One honest gap: both components ship with a fixed 6x2 footprint. Generalizing to `columns` / `rows` is genuinely not trivial for the CSS version (the grid dimensions drive face sizes _and_ transform distances), and the permit explicitly scoped that out. This lands as "technique spike proven," not "full product." That's the right outcome for this permit.

## Proposed Knowledge Updates

- **Learnings:** Add an entry on "Isometric projection in SVG" — documenting the (x - y) _ cos30, (x + y) _ sin30 - z formula, the stud-as-ellipse derivation, and the back-to-front painter's order for face layering. This is genuinely reusable knowledge if we ever port other shapes to 3D.
- **Pulse:** Note that the brick primitive now has a 3D variant pair — the technique graduates if we start porting Slope / Arch / Plate to 3D in future permits.
- **Domain Map:** No change — shared components only.
- **Component Registry:** Auto-generated.
- **Decision Record:** No ADR needed. The permit already documents the "no WebGL" strategic choice; that lives in the permit trail.

## Self-Debrief

### What Went Well

- The Creative Engine's technique choices are sound. Both files are well-structured with real documentation of the math, not just vibes.
- 100% coverage on first pass. The spec patterns match `LegoBrickSvg.spec.ts` cleanly.
- No scope creep — fixed 6x2, no port to other shapes, no About page meddling.

### What Went Poorly

- **The Creative Engine never committed or pushed.** Files landed on disk and the agent went silent. The CFO had to take over at the ~2.5-hour mark with no signal of what happened. Likely cause: the pre-push hook requires Node 24; the Creative Engine was running under v22 and couldn't complete the gauntlet, but also didn't raise the environment as a blocker before going dark. This is the primary process failure of the shift.
- No journal was produced by the Creative Engine itself — this journal is the CFO's reconstruction after inspecting the files. The architect's own self-debrief is missing.

### Blind Spots

- The CFO's permit flagged the Node version issue but didn't instruct the Creative Engine to raise a blocker if it couldn't resolve the environment. "Resolve before the gauntlet" isn't the same as "if you can't resolve, stop and report."
- No visual inspection of either component in a browser. Both are tested structurally and render at build time, but neither the CFO nor the Creative Engine has seen them in the Showcase gallery. The CEO should spot-check visually.

### Training Proposals

| Proposal                                                                                                                                                                                                     | Context                                                                                                                                                                                                 | Shift Evidence |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| **Creative Engine: when the environment is broken and can't be fixed in-session, STOP, file a partial journal naming the blocker, and return control — do not loop on failing gauntlet steps indefinitely.** | The Creative Engine appears to have gotten stuck after producing files, unable to complete the pre-push gauntlet on Node v22. It never surfaced the blocker; the CFO had to infer from file timestamps. | This journal   |
| **CFO: when dispatching a permit with a known environment prerequisite, explicitly instruct the agent on the stop-and-report protocol if the prerequisite can't be met.**                                    | The permit said "resolve before the gauntlet — not optional" but didn't say "if you can't resolve, stop and say so." Ambiguity produced the silent hang.                                                | This journal   |

---

## CFO Evaluation

**Overall Assessment:** Solid (construction) / Needs Improvement (process)

### Permit Fulfillment Review

Every acceptance criterion met. The component rename is accepted as an improvement on the permit — it matches the existing family's naming discipline. Scope held tight. No over-delivery.

### Decision Review

All seven decisions are defensible and well-documented in the code itself. The stud-as-ellipse derivation and the pre-computed projection constants are the kind of detail that demonstrates mastery, not just output. None of these required CEO escalation.

### Showcase Assessment

The gallery section is a genuine portfolio strengthener. The explicit tradeoff caption ("real geometry / future interactivity" vs. "crisp at any size / no layout thrash") is exactly the kind of context that separates a demo from a showcase. Visual spot-check by the CEO still recommended before calling this permit closed-and-proven.

### Training Proposal Dispositions

| Proposal                                                                            | Disposition | Rationale                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Creative Engine: stop-and-report on unresolvable environment blockers               | Candidate   | First observation of this failure mode. Needs a second shift to confirm the pattern before graduation — but the cost of the failure (2.5 silent hours) is high enough that even one observation justifies watching for it. |
| CFO: explicit stop-and-report instruction in permits with environment prerequisites | Candidate   | First observation. Cheap to add to the permit template's "Notes from the Issuer" guidance. Will watch for a confirming shift.                                                                                              |

### Notes for the Architect

Construction quality is strong. The failure on this shift was process, not code. Next time the environment is uncooperative, say so in the first ten minutes — a partial journal with a blocker is infinitely more useful than silence with files on disk. The CEO lost ~2.5 hours waiting for a signal that never came.

---

**Status:** Complete
