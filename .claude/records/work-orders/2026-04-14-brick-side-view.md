# Building Permit: Add Brick Side View SVG Component

**Permit #:** 2026-04-14-brick-side-view
**Filed:** 2026-04-14
**Issued By:** CFO (on CEO's direction)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Add a side-profile SVG component for the standard LEGO brick (`LegoBrickSideSvg`). The top-down views are established; this adds the complementary perspective — showing body height, stud bumps on top, and the brick's profile silhouette.

## Scope

### In the Box

- **`LegoBrickSideSvg.vue`** — SVG side-view component with `columns`, `rows`, `color`, `shadow` props. Renders the brick profile: rectangular body with stud bumps protruding from the top edge. `columns` determines visible studs, `rows` used for aria-label context. Proportions based on real LEGO geometry (9.6mm body height, 1.8mm stud height, 4.8mm stud diameter at 8mm pitch).
- **`LegoBrickSideSvg.spec.ts`** — Full test coverage matching the pattern of `LegoBrickSvg.spec.ts`.
- **PlaygroundPage integration** — Add side view as a 4th column for the three standard brick entries.
- **ComponentGallery integration** — Add a new section for the side view component.
- **100% coverage maintained.**

### Not in This Set

- No side views for other shapes (Slope, Arch, Wedge, etc.) — future permits.
- No HTML/CSS variant — SVG only per CEO direction.
- No changes to existing top-down components.
- No new UnoCSS shortcuts or design tokens.

## Acceptance Criteria

- [ ] `LegoBrickSideSvg.vue` renders correct stud count for any `columns` value
- [ ] Side view proportions match real LEGO brick geometry
- [ ] Shadow toggle works (prop: `shadow`)
- [ ] Color prop applies to body and studs
- [ ] Accessible: `role="img"` + descriptive `aria-label`
- [ ] Full test coverage (lines, functions, branches, statements)
- [ ] Integrated into PlaygroundPage alongside existing views
- [ ] Integrated into ComponentGallery with examples
- [ ] Full quality gauntlet passes: type-check, knip, lint, test:coverage, build

## References

- Prior art: `src/shared/components/LegoBrickSvg.vue` (top-down pattern to follow)
- Orientation permit: `.claude/records/permits/2026-04-13-brick-view-orientation.md`

## Notes from the Issuer

SVG-only is the right call. Side views have varying body heights and stud protrusions — CSS Grid can't express this naturally. The component should share the same CELL/STROKE/SHADOW_OFFSET constants as the top-down view for visual consistency across perspectives.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-04-14-brick-side-view.md`
