# Building Permit: Page Transition Refactor — Component Owns Its Brain

**Permit #:** 2026-04-10-page-transition-refactor
**Filed:** 2026-04-10
**Issued By:** CFO (on CEO direction)
**Assigned To:** Creative Engine
**Priority:** Standard

---

## The Job

Refactor the page transition system to eliminate the unnecessary composable/component split. The `usePageTransition` composable does all the thinking while `PageTransition.vue` is a braindead prop pass-through. The component should own its own logic. The composable should be deleted.

## Scope

### In the Box

- Delete `src/shared/composables/usePageTransition.ts` — all logic moves into the component
- Rewrite `src/shared/components/PageTransition.vue` to absorb all composable logic:
    - Props: `routePath: string`, `defaultVariant?: TransitionVariant` (defaults to "brick-snap")
    - Internal: reduced motion detection + live listener, variant state, route key computation
    - `defineExpose`: `setVariant`, `setBackNavigation`, `activeVariant`, `prefersReducedMotion`
    - Types (`TransitionVariant`, `TransitionName`) exported via dual `<script>` block (non-setup for types, setup for logic)
    - CSS stays as-is (already correct)
- Update `src/apps/families/App.vue`:
    - Remove `usePageTransition` import
    - Use `<PageTransition :route-path="familyRouterService.currentRouteRef.value.path">` — one prop, no composable wiring
- Update `src/apps/showcase/components/PageTransitionDemo.vue`:
    - Import types from `PageTransition.vue` (dual script block export)
    - Use template ref + `defineExpose` for `setVariant`, `activeVariant`, `prefersReducedMotion`
    - Remove `usePageTransition` import
- Delete `src/tests/unit/shared/composables/usePageTransition.spec.ts`
- Rewrite `src/tests/unit/shared/components/PageTransition.spec.ts` to cover all logic (composable tests absorbed here)
- Update `src/tests/unit/apps/showcase/components/PageTransitionDemo.spec.ts` for new component API
- Full quality gauntlet pass
- Construction journal with honest self-debrief on the over-engineering lesson

### Not in This Set

- No new animation variants or CSS changes
- No changes to showcase demo visual design or parameter display
- No new features — this is a pure architectural refactor

## Acceptance Criteria

- [ ] `usePageTransition.ts` deleted — no composable file exists
- [ ] `usePageTransition.spec.ts` deleted — no composable test file exists
- [ ] `PageTransition.vue` contains all transition logic (reduced motion, variant state, route keying)
- [ ] `PageTransition.vue` exports `TransitionVariant` and `TransitionName` types via dual script block
- [ ] `PageTransition.vue` exposes `setVariant`, `setBackNavigation`, `activeVariant`, `prefersReducedMotion` via `defineExpose`
- [ ] `App.vue` uses only `<PageTransition :route-path="...">` — no composable import
- [ ] `PageTransitionDemo.vue` uses template ref for exposed methods — no composable import
- [ ] No imports of `usePageTransition` remain anywhere in the codebase
- [ ] All existing behavior preserved (same animations, same reduced motion, same variant switching)
- [ ] Full quality gauntlet passes (format, lint, lint:vue, type-check, test:coverage, knip, size)
- [ ] Construction journal filed with Parameter Record (no new parameters — note "refactor only") and self-debrief documenting the over-engineering lesson

## References

- Related Permit: [2026-04-09-page-transition-system](2026-04-09-page-transition-system.md)
- Decision: [ADR-015](../../docs/decisions/015-creative-engine-agent.md)

## Notes from the Issuer

This is a CEO-directed refactor. The CEO reviewed the Creative Engine's first delivery and said the composable/component split was over-engineered — "massive composable" for logic that should live in the component. This is a learning opportunity: the Creative Engine should document in its self-debrief why the original split was wrong, what the right heuristic is for composable vs. component-owned logic, and propose a training update.

The refactor must preserve identical behavior. No animation changes, no new features. Clean restructure.

---

**Status:** Open
**Journal:** _link to construction journal when filed_
