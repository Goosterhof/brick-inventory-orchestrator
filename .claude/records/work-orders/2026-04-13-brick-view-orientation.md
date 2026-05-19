# Building Permit: Unify Brick Views to Top-Down with Feature Hints

**Permit #:** 2026-04-13-brick-view-orientation
**Filed:** 2026-04-13
**Issued By:** CFO (on CEO's direction)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

The brick shape components in `src/shared/components/` are an inconsistent mix of side views, top-down views, and an in-between hybrid for the slope. The CEO has ruled: **every brick renders top-down for now**, with a subtle hint at the defining feature so shapes remain distinguishable. This permit brings the six non-conforming shapes (Slope, Arch, Wedge, Tile, Technic Beam, Plate) into line, in both HTML/CSS and SVG variants.

## Scope

### In the Box

- **`LegoSlope.vue` + `LegoSlopeSvg.vue`** — Render as a 2x2 square footprint. Two studs on the rear half (flat top). Front half renders as the slanted shingle face — indicated with a diagonal hint line and no studs. No more triangular protrusion or side-profile body.
- **`LegoArch.vue` + `LegoArchSvg.vue`** — Render as a 1x4 top-down brick (row of 4 studs). Hint at the arch underside via a subtle semicircular dashed/thin line on the lower body (suggesting the cutout beneath).
- **`LegoWedge.vue` + `LegoWedgeSvg.vue`** — Already mostly top-down, but the SVG only renders a single row of studs for a labeled 2x4 wedge. Correct to a proper 2x4 trapezoid footprint with studs arranged to match the plate's stud grid, truncated where the taper cuts them off.
- **`LegoTile.vue` + `LegoTileSvg.vue`** — Render as a 1x2 top-down footprint (same aspect as a 1x2 brick) with NO studs. Add a subtle hint that distinguishes the smooth top from a bare brick body — e.g., a faint inner rectangle outline or subtle highlight strip along the edge.
- **`LegoTechnicBeam.vue` + `LegoTechnicBeamSvg.vue`** — Render top-down as a rectangular footprint. Keep the pin hole circles as dark circles aligned along the centerline — they read as "studless with pin holes visible through" and serve as the feature hint.
- **`LegoPlate.vue` + `LegoPlateSvg.vue`** — HTML variant is already top-down; normalize it with the other top-down bricks. SVG variant currently uses `HEIGHT_RATIO = 0.33` which squishes it into a side-ish profile. Rebuild the SVG as a proper top-down 2x4 footprint with a 4x2 stud grid. Hint at the plate's thinness with a thin inner outline offset (suggesting a lower profile).
- **Full test coverage preserved** — update unit tests to match the new geometry. 100% coverage maintained.
- **Showcase section text updated** — the existing "Brick Shapes" intro paragraph mentions shape tradeoffs; update wording if it no longer matches reality.

### Not in This Set

- No changes to `LegoBrick(Svg)` or `LegoRound(Svg)` — both already top-down.
- No new shape categories.
- No animation or interaction changes.
- No changes to the component registry or showcase layout.
- No re-rendering of bricks used inside `AboutPage` or `PlaygroundPage` beyond what naturally follows from the component update.

## Acceptance Criteria

- [ ] All six shape pairs (HTML + SVG) render top-down with a feature hint
- [ ] Hints are subtle — a reviewer should read "top-down brick with a slope hint", not "side view"
- [ ] All existing test files updated — no test-skipping, no coverage carve-outs
- [ ] 100% coverage on lines, functions, branches, statements
- [ ] Full quality gauntlet passes: `type-check`, `knip`, `lint`, `test:coverage`, `build`
- [ ] Visual verification done in the showcase dev server
- [ ] Construction journal includes before/after visual notes per shape and a debrief

## References

- Original permit: `.claude/records/permits/2026-04-06-lego-brick-shapes.md`
- Original journal: `.claude/records/journals/2026-04-06-lego-brick-shapes.md`
- Showcase component: `src/apps/showcase/components/BrickShapes.vue`

## Notes from the Issuer

The CFO pushed back on this change — top-down views erase the visual differentiation between shapes (a 1x4 arch from above is just a 1x4 brick). The CEO acknowledged this and explicitly asked for **feature hints** to preserve distinguishability. That's the critical design nuance: this is not a "strip everything to rectangles" exercise. Every shape must still tell the viewer what it is, just with a top-down-first grammar.

Err on the side of subtle. These are small showcase tiles — heavy hint lines will clutter. A light diagonal, a thin semicircle stroke, a single edge line — that's the register. If a hint requires more than ~3 SVG elements or ~2 extra HTML divs to communicate, it's too much.

Coordinate with the Creative Engine if any of these hint lines deserve an animation layer (probably not in this permit, but flag it for a follow-up if you notice an opportunity).

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-04-13-brick-view-orientation.md`
