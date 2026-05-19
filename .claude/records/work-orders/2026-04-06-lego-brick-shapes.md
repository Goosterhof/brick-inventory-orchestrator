# Building Permit: LEGO Brick Shapes — HTML vs SVG Exploration

**Permit #:** 2026-04-06-lego-brick-shapes
**Filed:** 2026-04-06
**Issued By:** CFO (on CEO's direction)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Expand our brick rendering beyond rectangles to support diverse LEGO shapes (slopes, arches, wedges, round bricks, plates, tiles, Technic beams). Build each shape in both HTML/CSS and SVG, compare the results, and determine which rendering approach works best per shape category.

## Scope

### In the Box

- **Shape catalog** — implement the following shapes in both HTML/CSS and SVG:
    - **Slope** (e.g., 2x2 45° slope) — angled top surface
    - **Arch** (e.g., 1x4 arch) — curved underside cutout
    - **Wedge/Wing** (e.g., 2x4 wedge plate) — trapezoidal/triangular profile
    - **Round brick** (e.g., 1x1 round, 2x2 round) — cylindrical shape with stud
    - **Plate** (e.g., 2x4 plate) — standard brick at 1/3 height
    - **Tile** (e.g., 1x2 tile) — plate without studs, smooth top
    - **Technic beam** (e.g., 1x4 beam) — with pin holes
- **Showcase section** — new "Brick Shapes" section in the Showcase app displaying all shapes side-by-side (HTML vs SVG)
- **Comparison assessment** — document which approach wins per shape and why (complexity, fidelity, animation-readiness, accessibility)
- **Consistent API** — all shape components accept `color` and `shadow` props at minimum, following existing conventions
- **Full test coverage** — unit tests for all new components (100% as always)

### Not in This Set

- Minifigure rendering
- 3D/WebGL rendering
- Animation or interaction behaviors (static shapes only for now)
- Refactoring existing `LegoBrick.vue` / `LegoBrickSvg.vue` (those stay as-is)
- Integration into Families app pages (showcase only)

## Acceptance Criteria

- [ ] All 7 shape categories rendered in both HTML/CSS and SVG (14 components total)
- [ ] Showcase section displays all shapes with HTML vs SVG comparison
- [ ] Each component has proper TypeScript props with inline types
- [ ] All components use the brick design system colors and follow neo-brutalist aesthetic
- [ ] SVG components have proper ARIA labels/accessibility
- [ ] 100% test coverage on all new components
- [ ] Full quality gauntlet passes (type-check, knip, lint, build, tests)
- [ ] Construction journal includes HTML vs SVG comparison matrix with findings

## References

- Existing components: `src/shared/components/LegoBrick.vue`, `LegoBrickSvg.vue`
- Showcase app: `src/apps/showcase/`
- Design system: `uno.config.ts` brick shortcuts

## Notes from the Issuer

The existing rectangular brick components already demonstrate the dual-approach pattern. This permit extends it to shapes where the tradeoffs become more interesting — HTML/CSS will likely struggle with slopes and arches (clip-path hacks, pseudo-element gymnastics), while SVG handles them natively with paths. Conversely, HTML/CSS plates and tiles are trivially simple.

The real value here is the **comparison artifact** — a documented, visual side-by-side that shows we understand the strengths and limits of each rendering approach. That's the kind of technical depth that distinguishes a portfolio piece from a toy project.

Keep components lean. Each shape is a focused rendering — no business logic, no state management. Pure visual components with typed props.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-04-06-lego-brick-shapes.md`
