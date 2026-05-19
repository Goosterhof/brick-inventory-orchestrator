# Construction Journal: Fix SVG Slope & Arch Top-Down Renderings

**Journal #:** 2026-04-16-fix-svg-slope-arch
**Filed:** 2026-04-16
**Permit:** `.claude/records/permits/2026-04-16-fix-svg-slope-arch.md`
**Architect:** Lead Brick Architect

---

## Work Summary

| Action   | File                                                    | Notes                                                              |
| -------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| Modified | `src/shared/components/LegoSlopeSvg.vue`                | Replaced diagonal line with gradient-filled triangle + edge line   |
| Modified | `src/shared/components/LegoArchSvg.vue`                 | Replaced tiny r=20 semicircle with proportionate r=40 filled arch  |
| Modified | `src/tests/unit/shared/components/LegoSlopeSvg.spec.ts` | Updated: 9 tests -> 11 tests (polygon, edge line, linear gradient) |
| Modified | `src/tests/unit/shared/components/LegoArchSvg.spec.ts`  | Updated: 9 tests -> 10 tests (filled cutout, dimension assertions) |

## Permit Fulfillment

| Acceptance Criterion                                | Met | Notes                                                                         |
| --------------------------------------------------- | --- | ----------------------------------------------------------------------------- |
| LegoSlopeSvg renders visually clear slope indicator | Yes | Gradient-shaded triangle + diagonal edge line reads as "angled surface"       |
| LegoArchSvg renders proportionate arch opening      | Yes | r=40 filled semicircle spans middle two stud positions, reads as "arch brick" |
| Both components maintain existing props API         | Yes | No props changes, destructured with same defaults                             |
| Both components maintain accessibility attributes   | Yes | `role="img"` and `aria-label` unchanged                                       |
| Tests updated and passing at 100% coverage          | Yes | 100% lines, functions, branches, statements                                   |
| Full gauntlet passes                                | Yes | All 7 checks green; pre-existing test guard timing issue is unrelated         |

## Decisions Made

1. **Slope: gradient-filled triangle over hatch lines** -- Chose a `<polygon>` with a `<linearGradient>` (transparent at the high edge, 25% black opacity at the low edge) over parallel hatch lines. A single shaded region is immediately legible at small sizes where hatch lines would become visual noise. The gradient communicates directionality (light = high, dark = low). Added a separate `data-slope-edge` `<line>` element for the diagonal boundary so the slope/flat division has a crisp edge.

2. **Arch: filled dark semicircle over clip-path cutout** -- Chose `fill="black" fill-opacity="0.2"` over a true clip-path. A clip-path would require restructuring the body into a `<path>` or adding a `<clipPath>` def, adding complexity for marginal visual improvement. The filled semicircle achieves the "looking through the opening" effect and stays consistent with how other hint elements use semi-transparent overlays. Radius changed from 20 to 40 (= CELL), spanning two full cell widths between studs 2 and 3.

3. **slopeGradientId as derived string** -- Used `${gradientId}-slope` rather than a second `useId()`. Avoids an extra call, keeps IDs visually related in the DOM, and is unique per instance because `gradientId` already is.

## Quality Gauntlet

| Check         | Result | Notes                                         |
| ------------- | ------ | --------------------------------------------- |
| format:check  | Pass   |                                               |
| lint          | Pass   | 0 warnings, 0 errors                          |
| lint:vue      | Pass   |                                               |
| type-check    | Pass   |                                               |
| test:coverage | Pass   | 104 files, 1199 tests, 100% coverage          |
| knip          | Pass   |                                               |
| size          | Pass   | families: 117.9kB/350kB, admin: 30.79kB/150kB |

## Showcase Readiness

Yes. The slope communicates "angled surface" through directional gradient shading. The arch has a proportionate opening that reads as "arch brick." Both use the same visual language (semi-transparent overlays on the body) as the other shape components. Consistent design thinking across the family.

## Proposed Knowledge Updates

- **Learnings:** None -- straightforward geometry fix with no gotchas.
- **Pulse:** No updates needed.
- **Domain Map:** No changes.
- **Decision Record:** Not warranted.

## Self-Debrief

### What Went Well

- Clean, focused scope. Four files modified, no blast radius.
- Read sibling SVG components before building to match the established visual language.
- Tests passed on first run.

### What Went Poorly

- Nothing on the implementation side.

### Blind Spots

- Did not visually render the SVGs in a browser. Relied on geometric reasoning.

### Training Proposals

| Proposal | Context | Shift Evidence |
| -------- | ------- | -------------- |
| _None_   |         |                |

---

## CFO Evaluation

**Overall Assessment:** Solid

### Permit Fulfillment Review

Full delivery. All six acceptance criteria met. Four files modified, exactly the scope specified in the permit. No scope creep, no under-delivery.

### Decision Review

All three decisions are well-reasoned:

1. **Gradient triangle over hatch lines** -- Correct call. Hatch lines at small render sizes would degrade to visual noise. The directional gradient is a cleaner signal.
2. **Filled semicircle over clip-path** -- Pragmatic. The filled overlay is consistent with the existing visual language across the shape family. A clip-path would add structural complexity for marginal visual improvement. Good tradeoff.
3. **Derived gradient ID** -- Clean pattern. No concerns.

No decisions needed escalation.

### Showcase Assessment

Strengthens the portfolio. The two weakest shapes in the lineup are now fixed. The visual language (semi-transparent overlays for shape hints) is consistent across the entire brick shape family.

### Training Proposal Dispositions

No proposals filed. Clean execution -- nothing to disposition.

### Notes for the Architect

Solid, focused delivery. The blind spot on visual browser verification is honest and noted, but the geometric reasoning checks out -- the math is straightforward enough that this is acceptable for pure SVG geometry work.
