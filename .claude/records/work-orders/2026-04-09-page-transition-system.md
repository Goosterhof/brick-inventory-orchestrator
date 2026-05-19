# Building Permit: Page Transition System

**Permit #:** 2026-04-09-page-transition-system
**Filed:** 2026-04-09
**Issued By:** CEO
**Assigned To:** Creative Engine
**Priority:** Standard

---

## The Job

Build a page transition system for the Families app that makes route changes feel tactile and alive — like LEGO bricks clicking into place rather than pages blinking in and out. This is the Creative Engine's inaugural delivery and first opportunity to discover the animation language.

## Scope

### In the Box

- A reusable page transition composable or component that integrates with Vue Router's navigation
- At least two transition variants (e.g., default navigation and a "back" variant) to demonstrate range
- `prefers-reduced-motion` compliance — instant transitions when reduced motion is requested
- A Showcase section demonstrating the page transition system with visible parameters and interactive controls
- Full test coverage (100% lines, branches, functions, statements)
- Parameter Record in the construction journal documenting all animation values tried and their verdicts

### Not in This Set

- Transitions for the Admin or Showcase apps themselves (Families only for now)
- Modal transitions (separate permit)
- Component-level micro-interactions (separate permit)
- Any external animation libraries — CSS transitions and Vue's `<Transition>` are the tools

## Acceptance Criteria

- [ ] Route changes in the Families app use the new transition system
- [ ] At least two distinct transition variants exist
- [ ] `prefers-reduced-motion: reduce` disables all animation (instant swap)
- [ ] Showcase section exists demonstrating the transitions with visible parameter values
- [ ] Full quality gauntlet passes (format, lint, type-check, coverage, knip, size)
- [ ] Parameter Record in journal documents every animation variant attempted with quantifiable values
- [ ] No layout shift or flash of unstyled content during transitions

## References

- Decision: [ADR-015 — Creative Engine agent](../../docs/decisions/015-creative-engine-agent.md)
- Related: `src/shared/assets/theme.css` (existing body transition)
- Related: `src/shared/assets/accessibility.css` (existing `prefers-reduced-motion` override)

## Notes from the Issuer

This is the Creative Engine's first deployment. The parameter data from this delivery seeds the graduation log — every duration, easing curve, and distance tried should be recorded, whether it worked or not. The discovery process matters as much as the final result.

Start with the feeling: "a brick snapping into its spot on the baseplate." Find the numbers that create that feeling. Document them.

---

**Status:** Open
**Journal:** _pending_
