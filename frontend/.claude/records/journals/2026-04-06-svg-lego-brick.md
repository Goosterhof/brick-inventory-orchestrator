# Construction Journal: SVG LEGO Brick Component

**Journal #:** 2026-04-06-svg-lego-brick
**Filed:** 2026-04-06
**Permit:** `.claude/records/permits/2026-04-06-svg-lego-brick.md`
**Architect:** Lead Brick Architect

---

## Work Summary

| Action   | File                                                                 | Notes                                                                                          |
| -------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Created  | `src/shared/components/LegoBrickSvg.vue`                             | Pure SVG brick component — rect body, shadow rect, circular studs with radial gradient overlay |
| Modified | `src/apps/showcase/components/ComponentGallery.vue`                  | Added LegoBrickSvg section with 3 demo variants (4x2 red, 2x2 blue, 1x1 yellow no-shadow)      |
| Modified | `src/apps/families/domains/about/pages/AboutPage.vue`                | Added SVG brick arrangement side-by-side with existing HTML bricks in a flex row               |
| Modified | `src/shared/generated/component-registry.json`                       | Auto-generated entry for LegoBrickSvg                                                          |
| Created  | `src/tests/unit/shared/components/LegoBrickSvg.spec.ts`              | 13 tests covering studs, shadow, color, accessibility, viewBox, gradient defs                  |
| Modified | `src/tests/unit/apps/families/domains/about/pages/AboutPage.spec.ts` | 5 new tests for SVG brick integration (count, colors, dimensions, shadow, side-by-side layout) |
| Modified | `src/tests/unit/apps/showcase/components/ComponentGallery.spec.ts`   | Mock for LegoBrickSvg, added to mockedComponentNames, label assertion updated                  |

## Permit Fulfillment

| Acceptance Criterion                         | Met | Notes                                                                        |
| -------------------------------------------- | --- | ---------------------------------------------------------------------------- |
| LegoBrickSvg.vue exists with same props      | Yes | Identical interface: `color`, `shadow`, `columns`, `rows` with same defaults |
| Variable columns/rows/color/shadow rendering | Yes | Computed viewBox, studs array, conditional shadow rect                       |
| Unique gradient IDs per instance             | Yes | Uses Vue 3.5 `useId()` for `radialGradient` ID                               |
| Accessible with role and aria-label          | Yes | `role="img"`, `aria-label="${columns} by ${rows} LEGO brick"`                |
| Visible in Showcase ComponentGallery         | Yes | New "LegoBrickSvg" section after existing "LegoBrick" section                |
| Visible on About page alongside HTML bricks  | Yes | Side-by-side flex layout with `gap-8`                                        |
| 100% test coverage                           | Yes | 13 tests for component, 5 new tests for AboutPage, gallery label assertion   |
| Existing tests passing                       | Yes | All 380+ tests pass                                                          |
| Full quality gauntlet passes                 | Yes | Coverage 100%, knip clean, tests green                                       |

## Decisions Made

1. **Used `useId()` over module-level counter** — Vue 3.5's `useId()` is the framework-blessed solution for unique IDs. A counter works but is fragile in SSR contexts and not idiomatic.

2. **Used `data-shadow` and `data-body` attributes for test selectors** — SVG elements can't use UnoCSS attribute selectors the same way HTML elements do. Data attributes provide stable, semantic test hooks without coupling tests to SVG geometry.

3. **Fixed-width wrappers on About page SVG bricks (`w="[180px]"`)** — SVGs without explicit dimensions fill their container. The HTML bricks size naturally via `inline-grid`. Each SVG brick gets a width-constrained wrapper to control visual size. This is pragmatic but slightly brittle — a future improvement could compute width from props.

4. **Same gradient for all studs per instance** — Rather than per-stud gradients, a single `radialGradient` in `<defs>` is referenced by all stud overlay circles. More efficient SVG and simpler DOM.

5. **Radial gradient highlight (white→slight dark)** — Creates a 3D cylindrical stud appearance. `cx="35%" cy="35%"` positions the highlight off-center top-left for a natural light source effect. This is the key visual differentiator from the flat HTML version.

## Quality Gauntlet

| Check         | Result | Notes                                       |
| ------------- | ------ | ------------------------------------------- |
| format:check  | Pass   | oxfmt compliant                             |
| lint          | Pass   | No violations                               |
| lint:vue      | Pass   | Conventions met                             |
| type-check    | Pass   | vue-tsc clean                               |
| test:coverage | Pass   | 100% lines, branches, functions, statements |
| knip          | Pass   | No dead code                                |
| size          | Pass   | Within limits                               |

## Showcase Readiness

The implementation is clean and demonstrates SVG proficiency. The component is well-structured: computed values derive from constants, `useId()` handles multi-instance safety, and the gradient overlay adds visual sophistication the HTML version can't match. The side-by-side presentation on the About page is an effective comparison.

One area for future polish: the SVG bricks on the About page use hardcoded `w="[180px]"` wrappers regardless of column count, meaning a 1x1 brick sits in the same 180px container as a 2x2. This works visually (SVG scales to fit) but isn't as tight as the HTML version's natural sizing.

## Proposed Knowledge Updates

- **Learnings:** SVG components in Vue need unique IDs for gradient/filter/mask `<defs>` — `useId()` is the correct approach. Data attributes (`data-shadow`, `data-body`) are effective test selectors for SVG elements.
- **Pulse:** New shared component `LegoBrickSvg` added to the component inventory.
- **Component Registry:** Auto-updated via generation script.

## Self-Debrief

### What Went Well

- Clean separation of concerns: constants, computed values, and template are each focused
- Test coverage was thorough — 13 tests covering all props, accessibility, and SVG structure
- Integration into existing pages was non-disruptive

### What Went Poorly

- The architect was dispatched without a building permit — a process violation caught by the CEO
- No construction journal was filed initially — the CFO had to produce it retroactively

### Blind Spots

- The architect did not file paperwork, and the CFO failed to enforce the process before dispatching
- The `w="[180px]"` constraint on About page SVG wrappers is a rough solution that could be refined

### Training Proposals

| Proposal                                                                    | Context                                                                | Shift Evidence |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------- |
| Before dispatching architect, file building permit first — no exceptions    | CFO dispatched work without a permit; CEO had to flag the violation    | This journal # |
| After architect completes, verify journal was filed before reporting to CEO | No journal existed when CEO asked; CFO had to produce it retroactively | This journal # |

---

## CFO Evaluation

**Overall Assessment:** Solid

### Permit Fulfillment Review

All acceptance criteria met. The component delivers what was requested: a pure SVG LEGO brick with the same props interface, integrated into both the Showcase and About page. The 7 files changed are all justified — no bloat, no unnecessary side effects.

### Decision Review

Decisions are well-reasoned. `useId()` is the correct choice over a counter. Data attributes for test selectors are pragmatic for SVG. The fixed-width wrapper on the About page is the weakest decision — it works but introduces a magic number that doesn't scale with props. Not worth blocking over, but worth noting as tech debt.

### Showcase Assessment

Strengthens the portfolio. Having both HTML/CSS and SVG implementations of the same component demonstrates range. The radial gradient stud highlight is a subtle but effective touch that shows SVG isn't just "rectangles and circles" — it's leveraging SVG-specific capabilities (gradients) that the HTML version can't replicate.

The About page side-by-side presentation is effective for comparison but could use labels ("HTML" / "SVG") to make the distinction obvious to viewers. Not a blocker — enhancement material.

### Training Proposal Dispositions

| Proposal                                          | Disposition | Rationale                                                                                            |
| ------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| File building permit before dispatching architect | Candidate   | Valid — this is a clear process gap. First observation, needs one more confirming shift to graduate. |
| Verify journal filed before reporting to CEO      | Candidate   | Valid — part of the same accountability gap. First observation.                                      |

### Notes for the Architect

Clean implementation. The SVG geometry math is correct, the gradient is tasteful, and the test coverage is thorough. The `data-shadow`/`data-body` pattern for SVG test selectors was a good call — document it if it becomes a recurring pattern.

Next time: make sure the CFO has your paperwork before you start swinging the hammer.
