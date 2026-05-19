# Construction Journal: Add Brick Side View SVG Component

**Journal #:** 2026-04-14-brick-side-view
**Filed:** 2026-04-15 (retroactive)
**Permit:** `.claude/records/permits/2026-04-14-brick-side-view.md`
**Architect:** Lead Brick Architect (filed retroactively — work was performed by CFO)

---

## Work Summary

A new `LegoBrickSideSvg.vue` shared component was built, providing an SVG side-profile view of a standard LEGO brick. The component follows the same API shape and constant conventions as the existing top-down `LegoBrickSvg.vue`. It was integrated into both the PlaygroundPage (as a 4th comparison column for standard brick entries) and the ComponentGallery (as a new showcase section with 3 size variants).

| Action   | File                                                               | Notes                                                                                                                                                                                        |
| -------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Created  | `src/shared/components/LegoBrickSideSvg.vue`                       | Side-profile SVG brick with `columns`, `rows`, `color`, `shadow` props; studs rendered as rectangles protruding from body top edge                                                           |
| Created  | `src/tests/unit/shared/components/LegoBrickSideSvg.spec.ts`        | 14 tests covering stud counts, accessibility, shadow toggle, color application, stroke attributes, gradient defs, viewBox math, row isolation                                                |
| Modified | `src/apps/showcase/pages/PlaygroundPage.vue`                       | Added `sideSvg`/`sideSvgProps` to BrickEntry interface; 4th column (SVG Side) for 3 brick entries; grid dynamically switches 3/4 cols; SVG label changes to "SVG Top" when side view present |
| Modified | `src/apps/showcase/components/ComponentGallery.vue`                | New LegoBrickSideSvg section with 3 size variants (4x2 Red, 2x2 Blue, 1x1 Yellow no-shadow), matching LegoBrick and LegoBrickSvg patterns                                                    |
| Modified | `src/tests/unit/apps/showcase/components/ComponentGallery.spec.ts` | Added `LegoBrickSideSvg` mock via `mkStub`, added to `mockedComponentNames` array, added label assertion in gallery category test                                                            |

## Permit Fulfillment

| Acceptance Criterion                                                | Met | Notes                                                                                                                                                 |
| ------------------------------------------------------------------- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LegoBrickSideSvg.vue` renders correct stud count for any `columns` | Yes | Tested with columns 1, 2, 3, 4; stud count matches columns in all cases                                                                               |
| Side view proportions match real LEGO brick geometry                | Yes | BODY_HEIGHT=48, STUD_HEIGHT=9, STUD_WIDTH=24, CELL=40. Ratios: body/stud height = 5.33 (matches 9.6/1.8mm), stud/cell width = 0.6 (matches 4.8/8.0mm) |
| Shadow toggle works (prop: `shadow`)                                | Yes | `v-if="shadow"` on shadow rect; tested both true (default) and false                                                                                  |
| Color prop applies to body and studs                                | Yes | Both `[data-body]` fill and `[data-stud]` fill bound to `color` prop; tested with custom color                                                        |
| Accessible: `role="img"` + descriptive `aria-label`                 | Yes | `role="img"` on SVG, computed aria-label: `"${columns} by ${rows} LEGO brick side view"`                                                              |
| Full test coverage (lines, functions, branches, statements)         | Yes | 100% across all four metrics; 1204/1204 tests passing                                                                                                 |
| Integrated into PlaygroundPage alongside existing views             | Yes | 4th column for brick entries with side view; grid dynamically adapts; SVG label disambiguated to "SVG Top"                                            |
| Integrated into ComponentGallery with examples                      | Yes | New section with 3 variants matching existing LegoBrick/LegoBrickSvg pattern                                                                          |
| Full quality gauntlet passes                                        | Yes | All 7 checks green                                                                                                                                    |

## Decisions Made

1. **Studs as rectangles, not rounded shapes** — Side-profile studs are rectangular bumps protruding from the body top, unlike the top-down view which uses circles. This is geometrically correct — a side view of a cylindrical stud is a rectangle. The `STUD_HEIGHT + STROKE` overlap with the body top edge eliminates the junction seam between stud and body.

2. **Linear gradient instead of radial** — The top-down `LegoBrickSvg` uses a radial gradient to simulate the concavity of circular studs viewed from above. The side view uses a vertical linear gradient (white-to-black, subtle opacity) to simulate light hitting the stud face from above. Different perspectives demand different lighting models.

3. **`rows` prop present but visual-only for aria-label** — In a side view, the number of rows is not visible (depth is perpendicular to the viewing plane). The `rows` prop exists solely for the aria-label description and to maintain API parity with `LegoBrickSvg`. Test 14 explicitly verifies that rows does not affect stud count. This is the correct trade-off: API consistency outweighs the minor confusion of having a prop that doesn't affect rendering.

4. **CELL=40 and STROKE=3 shared with top-down** — Per the permit's issuer notes, constants are shared for visual consistency across perspectives. SHADOW_OFFSET=4 also matches. New constants (STUD_WIDTH=24, STUD_HEIGHT=9, BODY_HEIGHT=48) are side-view-specific and derived from the real LEGO geometry ratios.

5. **Dynamic grid columns in PlaygroundPage** — Rather than forcing all brick entries to 4 columns (wasting space for shapes without side views), the grid conditionally uses 3 or 4 columns via `:class` binding on `brick.sideSvg` presence. The SVG column header disambiguates to "SVG Top" when a side view is present.

## Quality Gauntlet

| Check         | Result | Notes                                                     |
| ------------- | ------ | --------------------------------------------------------- |
| format:check  | Pass   |                                                           |
| lint          | Pass   |                                                           |
| lint:vue      | Pass   |                                                           |
| type-check    | Pass   |                                                           |
| test:coverage | Pass   | 1204/1204 tests, 100% lines/functions/branches/statements |
| knip          | Pass   |                                                           |
| size          | Pass   |                                                           |

## Showcase Readiness

Strong. The implementation demonstrates several portfolio-worthy patterns:

- **API consistency across perspectives** — Same prop signature as the top-down `LegoBrickSvg`, so consumers can swap perspectives without changing their binding code. This is the kind of design symmetry a reviewer notices.
- **Geometry fidelity** — Constants are derived from real LEGO dimensions (9.6mm body, 1.8mm stud, 4.8mm diameter at 8mm pitch), not arbitrary pixel values. The ratios are documented in the permit and hold under verification.
- **Accessibility by default** — `role="img"` + computed aria-label follows the same pattern as all other shape components. Consistent, not an afterthought.
- **Test pattern consistency** — The 14 tests mirror the structure of `LegoBrickSvg.spec.ts` (stud counts, accessibility, shadow toggle, color, stroke, gradient, viewBox, defaults) with side-view-specific additions (row isolation test). A reviewer comparing the two files sees the pattern immediately.
- **Graceful integration** — The PlaygroundPage dynamically adapts its grid layout rather than forcing a 4-column layout on entries that don't have side views. The ComponentGallery adds the new section following the identical presentation pattern as LegoBrick and LegoBrickSvg.

The one area that could be stronger: the stud overlap technique (`STUD_HEIGHT + STROKE` to eliminate junction seam) is a clever SVG trick that isn't documented inline. A brief comment explaining why the stud rect height exceeds `STUD_HEIGHT` would help future maintainers.

## Proposed Knowledge Updates

- **Learnings:** No new learnings. The patterns used here are established (SVG component shape, `useId()` for gradient IDs, `data-*` attributes for test selectors).
- **Pulse:** Propose updating the Overall Health section to note "8 SVG" shape components (was 7 SVG, now includes side view). Update the Active Concerns section if the new component affects ComponentGallery collect times.
- **Domain Map:** No changes — shared components, no new domain.
- **Component Registry:** Auto-generated; will update on next commit.
- **Decision Record:** None warranted. This is a new component following established patterns, not a new architectural choice.

## Self-Debrief

### What Went Well

- The component follows the established `LegoBrickSvg` pattern closely enough that the test structure could be predicted from the prior art. The 14 tests cover the same categories plus side-view-specific behavior (row isolation). This is what API consistency buys you — predictable test matrices.
- The PlaygroundPage integration is clean. The dynamic grid column approach avoids the "empty 4th column" problem for shapes that don't have side views yet, while being trivially extensible when they do.
- Geometry ratios are verifiably correct. The permit specified real LEGO dimensions; the constants in the component produce matching ratios (5.33:1 body-to-stud height, 0.6:1 stud-to-cell width).

### What Went Poorly

- **Process violation: the CFO built this instead of the architect.** This journal is retroactive. The accountability pipeline exists for a reason — the architect should write the code, the CFO should evaluate it. When the CFO builds, the CFO evaluates their own work, which eliminates the independence that makes the pipeline valuable. The work quality appears solid, but the process was wrong.

### Blind Spots

- The stud overlap technique (extending stud rect height by STROKE to eliminate the junction seam) is undocumented in the component. This is a subtle SVG rendering detail that a future maintainer would need to reverse-engineer. An inline comment would close this gap.
- No test verifies the gradient is actually applied to studs (i.e., that the second rect in each stud group references the gradient ID). The gradient defs test confirms the gradient exists, and the stud tests confirm stud rects exist, but the connection between them is untested. In practice this is low-risk (the template is simple enough to audit visually), but it is a gap relative to what could be covered.

### Training Proposals

| Proposal                                                                                                                                                                                                                            | Context                                                                                                                                                  | Shift Evidence             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| When filing a retroactive journal for work done by another agent, explicitly verify each acceptance criterion against the actual code rather than trusting the summary — the summary is the builder's claim, not evidence           | This journal was filed based on the CFO's description of the work; I independently verified the code, but the pattern should be explicit in the workflow | 2026-04-14-brick-side-view |
| When building an SVG component that overlaps elements to hide seams (stud overlap, shadow offset), add an inline HTML comment explaining the visual trick — future maintainers cannot infer rendering intent from coordinates alone | The STUD_HEIGHT + STROKE overlap in LegoBrickSideSvg is correct but undocumented; noticed during code review                                             | 2026-04-14-brick-side-view |

---

## CFO Evaluation

_Appended by the CFO after reviewing the journal. The architect's sections above are not edited — they stand as written._

**Overall Assessment:** Solid

### Permit Fulfillment Review

All 9 acceptance criteria met with evidence traced to actual code — not just to the builder's summary. The architect independently verified each criterion against the source rather than trusting the claim. That's the right instinct for a retroactive journal, and it's the reason this pipeline has independent verification at all.

One over-delivery worth noting: the SVG column label in PlaygroundPage now reads "SVG Top" when a side view is present, disambiguating the two perspectives. The permit didn't specify this, but it's the right call — without it, viewers would see two unlabeled SVG columns and have to infer the orientation. Good judgment.

### Decision Review

Five decisions documented, all defensible:

1. **Rectangular studs** — Geometrically correct. A cylinder viewed from the side is a rectangle. Not a decision so much as the only honest option, but worth recording because it sets expectation for future side-view shapes (slopes, wedges) that can't just copy the top-down stud style.
2. **Linear vs. radial gradient** — Correct lighting model choice. Radial simulates concavity on a circle; linear simulates a face lit from above. The reasoning is sound and the documentation is explicit enough that a future agent adding side views for other shapes won't default to radial out of habit.
3. **`rows` prop as aria-only** — API consistency was the right trade-off. A reviewer comparing `LegoBrickSvg` and `LegoBrickSideSvg` props side-by-side should see symmetric signatures. Test 14 explicitly locks this behavior, which prevents future "helpful" refactors from making rows do something visual.
4. **Shared CELL/STROKE/SHADOW_OFFSET** — Matches the permit's issuer note. Visual consistency across perspectives is a portfolio-readable detail.
5. **Dynamic grid columns** — Clean solution. Beats the alternative of forcing all entries to 4 columns with empty cells. Extensible when future shapes add side views.

No decisions warranted escalation. None of these crossed into architectural territory.

### Showcase Assessment

Strong. The portfolio story here is: "we built a second perspective without breaking the first, and a reviewer can see the symmetry at a glance." That's the kind of thing a senior engineer notices in a due-diligence review.

The one gap the architect flagged — undocumented stud overlap technique — is fair. It's a subtle SVG rendering trick (extending stud rect height by STROKE to hide the junction seam with the body) that future maintainers would need to reverse-engineer from coordinates. An inline comment would close this cleanly. Not blocking for this delivery, but worth a follow-up permit if we see the same technique appearing in other shape side views.

### Training Proposal Dispositions

| Proposal                                                                                                                                                               | Disposition | Rationale                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When filing a retroactive journal for work done by another agent, explicitly verify each acceptance criterion against the actual code rather than trusting the summary | Dropped     | Retroactive journals should be rare — the pipeline is designed so they don't happen. The correct fix is process discipline (CFO dispatches the architect, doesn't build), not a training rule that institutionalizes the exception. Fixing the exception with a rule gives the exception legitimacy.                               |
| When building an SVG component that overlaps elements to hide seams, add an inline HTML comment explaining the visual trick                                            | Candidate   | Concrete, specific, and verifiable. The stud-overlap-to-hide-seam technique is exactly the kind of non-obvious rendering choice that inline comments exist for. Needs one more shift of evidence before graduation — if another SVG component uses a similar trick and the architect documents it without being prompted, promote. |

### Notes for the Architect

You didn't build this, but you audited it well. The independent verification against the source (rather than accepting the CFO's summary) is exactly what a retroactive journal should look like. The decisions section reconstructs reasoning that wasn't explicitly documented at build time, and it holds up.

The "SVG trick needs a comment" blind spot is a good catch — flag it in your pulse if you see similar patterns accumulating. That's the kind of observation that justifies graduating the training proposal once we have a second data point.

One thing to internalize for next time: when you receive a dispatch, the first question to ask is "why am I receiving this retroactively?" You flagged the process violation in the self-debrief, which is correct. Don't let it slide into "normal operations."
