# Building Permit: Fix SVG Slope & Arch Top-Down Renderings

**Permit #:** 2026-04-16-fix-svg-slope-arch
**Filed:** 2026-04-16
**Issued By:** CFO (on CEO's direction)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Fix two SVG shape components whose top-down visual hints look wrong. The slope's diagonal line is confusing and the arch's semicircle is comically small, reading as "a little arch inside a rectangle" rather than communicating the brick's actual shape.

## Scope

### In the Box

- **LegoSlopeSvg.vue** — Replace the single diagonal line slope hint with a more readable visual. The current line from bottom-left to top-right across the full body reads as an arbitrary slash rather than "this surface slopes at 45 degrees." A better approach: a subtle shaded triangular region or a pair of parallel lines suggesting the slope direction, so the viewer immediately understands "top half slopes, bottom half is flat with studs."
- **LegoArchSvg.vue** — Replace the tiny semicircle arch hint (r=20 in a 180x60 body) with a properly proportioned arch opening. The arch should span the space between the two inner studs and feel like an actual arch cutout, not a decorative dot.
- **Tests** — Update `LegoSlopeSvg.spec.ts` and `LegoArchSvg.spec.ts` to match the new SVG structure. No new test files needed.
- **Full quality gauntlet must pass.**

### Not in This Set

- HTML/CSS counterparts (`LegoSlope.vue`, `LegoArch.vue`) — leave those as-is for now
- Other shape SVGs — only slope and arch are affected
- Showcase layout changes — the gallery structure stays the same
- Animation or interaction changes

## Acceptance Criteria

- [ ] LegoSlopeSvg renders a visually clear slope indicator that reads as "angled surface" at a glance
- [ ] LegoArchSvg renders a proportionate arch opening that reads as "arch brick" at a glance
- [ ] Both components maintain existing props API (`color`, `shadow`)
- [ ] Both components maintain accessibility attributes (`role="img"`, `aria-label`)
- [ ] Tests updated and passing at 100% coverage
- [ ] Full gauntlet passes: type-check, knip, lint, format, tests, build

## References

- Original permit: `.claude/records/permits/2026-04-06-lego-brick-shapes.md`
- Components: `src/shared/components/LegoSlopeSvg.vue`, `src/shared/components/LegoArchSvg.vue`
- Tests: `src/tests/unit/shared/components/LegoSlopeSvg.spec.ts`, `src/tests/unit/shared/components/LegoArchSvg.spec.ts`

## Notes from the Issuer

These are pure visual fixes — the SVG geometry needs to better communicate the brick type at a glance. The architect has latitude on the exact visual approach, but the result must be immediately legible to someone who has never seen a LEGO slope or arch brick. When in doubt, look at actual LEGO instruction manuals — they use simple, clean top-down representations.

Keep the same constants/grid system (CELL=40, PAD=10, etc.) so the shapes stay consistent with the rest of the brick family.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-04-16-fix-svg-slope-arch.md`
