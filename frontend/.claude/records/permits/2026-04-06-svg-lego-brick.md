# Building Permit: SVG LEGO Brick Component

**Permit #:** 2026-04-06-svg-lego-brick
**Filed:** 2026-04-06 (retroactive — filed after work completed)
**Issued By:** CFO (translating CEO request)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Create a pure SVG implementation of the LEGO brick component alongside the existing HTML/CSS `LegoBrick.vue`. Integrate it into the Showcase app's ComponentGallery and the Families app's About page.

## Scope

### In the Box

- New `LegoBrickSvg.vue` shared component with same props interface as `LegoBrick.vue` (`color`, `shadow`, `columns`, `rows`)
- SVG rendering: rect body, hard shadow rect, circular studs with gradient highlight for 3D cylinder effect
- Unique gradient IDs per instance via Vue 3.5 `useId()`
- Showcase ComponentGallery integration (new section alongside existing LegoBrick section)
- About page integration (side-by-side with existing HTML brick arrangement)
- Full test coverage for the new component
- Updated tests for AboutPage and ComponentGallery

### Not in This Set

- Replacing the existing HTML LegoBrick component
- Adding to BrickDimensions showcase section
- 3D isometric or perspective views
- Animation or interactivity

## Acceptance Criteria

- [x] `LegoBrickSvg.vue` exists in `src/shared/components/` with same props as `LegoBrick.vue`
- [x] Component renders correctly with variable columns/rows/color/shadow
- [x] Gradient IDs are unique per instance (no SVG ID collisions)
- [x] Accessible: `role="img"` and descriptive `aria-label`
- [x] Visible in Showcase ComponentGallery with 3 demo variants
- [x] Visible on About page alongside existing HTML bricks
- [x] 100% test coverage on new component
- [x] Existing tests updated and passing
- [x] Full quality gauntlet passes

## References

- Existing component: `src/shared/components/LegoBrick.vue`
- CEO direction: "We got one with pure html. Now I would like to add one from pure SVG."

## Notes from the Issuer

This permit is filed retroactively. The CFO dispatched the architect without filing paperwork first — a process violation acknowledged and corrected. The work was completed and pushed before the permit was created.

The strategic rationale: demonstrating SVG proficiency alongside HTML/CSS implementation shows range in the portfolio. SVG provides resolution independence and enables more detailed brick geometry that's hard to achieve with pure CSS.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-04-06-svg-lego-brick.md`
