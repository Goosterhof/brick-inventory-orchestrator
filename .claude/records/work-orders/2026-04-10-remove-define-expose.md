# Building Permit: Remove defineExpose from PageTransition

**Permit #:** 2026-04-10-remove-define-expose
**Filed:** 2026-04-10
**Issued By:** CFO (CEO directive)
**Assigned To:** Creative Engine
**Priority:** Urgent

---

## The Job

Remove `defineExpose` from `PageTransition.vue` entirely. The CEO has ruled it a hard no — it's an escape hatch that normalizes bad patterns for juniors reading the portfolio. The showcase demo doesn't need it. Revert the lint exception mechanism.

## Scope

### In the Box

- **`src/shared/components/PageTransition.vue`:**
    - Remove `defineExpose({setVariant, setBackNavigation, activeVariant, prefersReducedMotion})`
    - Remove `// lint-vue-allow-expose:` comment
    - Remove `overrideVariant` ref — dead code without expose
    - Remove `setVariant()` function — dead code without expose
    - Remove `setBackNavigation()` function — dead code without expose
    - Remove the `watch` on routePath that reset overrideVariant — no longer needed
    - Simplify `activeVariant` computed to just use `defaultVariant` directly (or inline it into transitionName)
    - The component becomes a pure animation renderer: routePath + defaultVariant props in, animated transition out
    - Keep the dual `<script>` block for `TransitionVariant` type export
    - Keep `prefersReducedMotion` detection (internal, not exposed)

- **`src/apps/showcase/components/PageTransitionDemo.vue`:**
    - Remove template ref (`transitionRef`) and `InstanceType<typeof PageTransition>` typing
    - Remove `ref="transitionRef"` from the template
    - `handleVariantChange(variant)`: just set `selectedVariant.value = variant` (component reacts via `:default-variant` prop)
    - `navigateTo(page)`: just set `currentPage.value = page` (component reacts via `:route-path` prop)
    - Add own `prefersReducedMotion` detection using `window.matchMedia` (same pattern the component uses)
    - `parameters` computed: derive from local `selectedVariant` and local `prefersReducedMotion` — don't read from the component
    - The `prefersReducedMotion` computed at the bottom of script can use the local detection instead of reading from ref
    - Remove the oxlint-disable comment for consistent-type-imports (no longer needed since PageTransition isn't imported as both type and value for template ref)

- **`scripts/lint-vue-conventions.mjs`:**
    - Revert the `// lint-vue-allow-expose:` exception mechanism
    - Restore unconditional `defineExpose` ban (the original rule)

- **`src/tests/unit/shared/components/PageTransition.spec.ts`:**
    - Remove tests that access `wrapper.vm.setVariant`, `wrapper.vm.setBackNavigation`, `wrapper.vm.activeVariant`
    - Test behavior through rendered output only (transition name attribute, slot content)
    - Keep reduced motion tests (they work through rendered output)
    - Keep tests for defaultVariant prop affecting transition name
    - The "expose" test and "override variant" tests should be removed entirely

- **`src/tests/unit/apps/showcase/components/PageTransitionDemo.spec.ts`:**
    - Adapt for new pattern (no template ref, local reduced motion detection)
    - All visual/behavioral tests should still pass — same UI, different internal wiring

- Full quality gauntlet pass
- Construction journal documenting the defineExpose lesson

### Not in This Set

- No changes to CSS or animation behavior
- No changes to App.vue (it doesn't use defineExpose)
- No new features

## Acceptance Criteria

- [ ] Zero occurrences of `defineExpose` in the codebase
- [ ] Zero occurrences of `lint-vue-allow-expose` in the codebase
- [ ] `lint-vue-conventions.mjs` has unconditional `defineExpose` ban (no exception mechanism)
- [ ] `PageTransition.vue` has no internal override state (`overrideVariant`, `setVariant`, `setBackNavigation`)
- [ ] `PageTransitionDemo.vue` has no template ref to PageTransition
- [ ] `PageTransitionDemo.vue` has its own `prefersReducedMotion` detection
- [ ] Showcase demo visually identical — same parameter display, same variant switching, same reduced motion indicator
- [ ] Full quality gauntlet passes
- [ ] Construction journal filed with self-debrief on why defineExpose was the wrong choice

## References

- Related Permit: [2026-04-10-page-transition-refactor](2026-04-10-page-transition-refactor.md)
- Decision: [ADR-015](../../docs/decisions/015-creative-engine-agent.md)

## Notes from the Issuer

CEO directive: defineExpose is a hard no. It's an escape hatch that normalizes itself. In a portfolio piece where juniors learn by reading, having defineExpose with a "sometimes it's OK" comment teaches the wrong lesson. The demo doesn't need it — it can derive everything from its own state and the component's props.

The deeper lesson for the Creative Engine: when you need to expose internal state for a demo to read, the architecture is wrong. The demo should own its own state and pass it down. Props down, events up. That's the Vue contract. Don't break it for convenience.

---

**Status:** Open
**Journal:** _link to construction journal when filed_
