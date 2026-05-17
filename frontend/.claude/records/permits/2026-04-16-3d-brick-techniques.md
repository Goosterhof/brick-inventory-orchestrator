# Building Permit: 3D 6x2 Brick — Technique Comparison

**Permit #:** 2026-04-16-3d-brick-techniques
**Filed:** 2026-04-16
**Issued By:** CFO (on CEO's direction)
**Assigned To:** Creative Engine
**Priority:** Standard

---

## The Job

Produce two 3D renderings of a standard 6x2 LEGO brick as a side-by-side comparison piece in the Showcase app. The existing brick library covers top-down and side-profile SVG views — this permit adds dimensional renderings using two distinct techniques so the portfolio demonstrates range in 3D presentation without pulling in a WebGL dependency.

## Scope

### In the Box

- **`LegoBrick3dCss.vue`** — Pure CSS 3D transforms. Six faces positioned via `transform: rotateX/rotateY translateZ`, 12 studs rendered as short cylinders (stacked layers or CSS-only cylinder technique). Props: `color`, `shadow` (optional ambient drop shadow). Fixed 6x2 footprint for this deliverable — no `columns`/`rows` props yet.
- **`LegoBrick3dIsometric.vue`** — SVG isometric projection. Single locked viewing angle (standard 30° isometric), crisp black outlines matching the brutalist aesthetic, gradient fills for face shading. Props: `color`, `shadow`. Fixed 6x2 footprint.
- **Showcase integration** — New `ComponentGallery` section titled "3D Brick Techniques" with both components side-by-side and a short caption describing the tradeoff (interactive CSS vs. crisp static SVG).
- **100% test coverage** on both new components.
- **Full quality gauntlet** passes: type-check, knip, lint, test:coverage, build.

### Not in This Set

- **No Three.js / WebGL.** Dependency weight not justified for a static showcase piece; revisit in a future permit if drag-to-rotate interactivity is scoped.
- **No variable `columns`/`rows` props.** This permit is a technique spike on the 6x2 form factor. Generalization is a follow-up once the technique proves itself.
- **No other shapes** (Slope, Arch, Plate, Tile, etc.) — 3D versions of those are future permits if the technique graduates.
- **No About page or PlaygroundPage integration** — Showcase gallery only for this round.
- **No animation beyond hover state on the CSS version** — a subtle hover tilt is acceptable but not a full orbit.

## Acceptance Criteria

- [x] `LegoBrick3dCss.vue` renders a recognizable 6x2 brick in 3D via CSS transforms — top, front, back, left, right, bottom faces all present and positioned correctly (shipped as `LegoBrickCuboidCss.vue`)
- [x] 12 studs are visible on the top face with believable cylindrical appearance
- [x] `LegoBrick3dIsometric.vue` renders the same brick in SVG isometric projection with the three visible faces (top, front, right) shaded distinctly (shipped as `LegoBrickIsometricSvg.vue`)
- [x] Both components accept a `color` prop and apply it consistently across faces (with appropriate shading per face)
- [x] Both components are accessible: `role="img"` + descriptive `aria-label`
- [x] Both components appear in a dedicated Showcase ComponentGallery section with a caption explaining the technique comparison
- [x] 100% test coverage on new components (lines, functions, branches, statements)
- [x] ComponentGallery test updated to cover the new section
- [x] Full quality gauntlet passes

## References

- Prior art (top-down): `src/shared/components/LegoBrick.vue`, `LegoBrickSvg.vue`
- Prior art (side profile): `src/shared/components/LegoBrickSideSvg.vue`
- Orientation permit: `.claude/records/permits/2026-04-13-brick-view-orientation.md`
- Side view permit: `.claude/records/permits/2026-04-14-brick-side-view.md`

## Notes from the Issuer

**Strategic framing.** The portfolio already demonstrates HTML/CSS, SVG top-down, and SVG side-profile mastery. A 3D pair extends the range into dimensional rendering without introducing a heavy dependency. Two techniques side-by-side is the point — the Showcase caption should make the tradeoff explicit, not hide it.

**Technique tradeoffs to make visible in the caption:**

- CSS 3D: real geometry, rotatable with hover or future interaction, demonstrates transform mastery; stud geometry is fiddly.
- SVG isometric: crisp at any size, pairs with brick-shadow naturally, no interaction without regeneration.

**Environment caveat.** Node v22 is installed locally; the gauntlet requires v24. Resolve (`nvm install 24` + `npm install`) before attempting the pre-push gauntlet — this is not optional.

**Scope discipline.** This is a technique spike. If the Creative Engine is tempted to generalize to `columns`/`rows` props or port every shape to 3D, stop and file a follow-up permit. Ship the 6x2 pair first, let it prove itself in the gallery, then generalize.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-04-16-3d-brick-techniques.md`
