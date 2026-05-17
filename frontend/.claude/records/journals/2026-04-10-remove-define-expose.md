# Construction Journal: Remove defineExpose from PageTransition

**Journal #:** 2026-04-10-remove-define-expose
**Filed:** 2026-04-10
**Permit:** [2026-04-10-remove-define-expose](../permits/2026-04-10-remove-define-expose.md)
**Architect:** Creative Engine

---

## Work Summary

| Action   | File                                                                 | Notes                                                                                                    |
| -------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Modified | `src/shared/components/PageTransition.vue`                           | Removed defineExpose, overrideVariant, setVariant, setBackNavigation, route-change watcher, watch import |
| Modified | `src/apps/showcase/components/PageTransitionDemo.vue`                | Removed template ref, oxlint-disable comment; added local prefersReducedMotion detection                 |
| Modified | `scripts/lint-vue-conventions.mjs`                                   | Reverted lint-vue-allow-expose exception mechanism; unconditional defineExpose ban restored              |
| Modified | `src/tests/unit/shared/components/PageTransition.spec.ts`            | Removed all wrapper.vm access; test behavior through rendered output only                                |
| Modified | `src/tests/unit/apps/showcase/components/PageTransitionDemo.spec.ts` | Removed PageTransition unstubbing; added live matchMedia change and SSR guard tests                      |

## Permit Fulfillment

| Acceptance Criterion                                                       | Met | Notes                                                                      |
| -------------------------------------------------------------------------- | --- | -------------------------------------------------------------------------- |
| Zero occurrences of `defineExpose` in the codebase                         | Yes | Verified via grep -- zero matches in src/                                  |
| Zero occurrences of `lint-vue-allow-expose` in the codebase                | Yes | Verified via grep -- zero matches in src/ and scripts/                     |
| `lint-vue-conventions.mjs` has unconditional `defineExpose` ban            | Yes | No exception mechanism -- simple `content.includes("defineExpose")` check  |
| PageTransition.vue has no internal override state                          | Yes | No overrideVariant, setVariant, setBackNavigation, or route-change watcher |
| PageTransitionDemo.vue has no template ref to PageTransition               | Yes | No transitionRef, no InstanceType, no ref="transitionRef"                  |
| PageTransitionDemo.vue has its own prefersReducedMotion detection          | Yes | Local ref with matchMedia listener, same pattern as the component          |
| Showcase demo visually identical                                           | Yes | Same animations, same parameter display, same reduced motion indicator     |
| Full quality gauntlet passes                                               | Yes | All 7 checks green, 100% coverage, 1182 tests                              |
| Construction journal filed with self-debrief on why defineExpose was wrong | Yes | This document                                                              |

## Decisions Made

1. **Demo stubs reverted to default shallow stubs** -- With the template ref gone, the demo test no longer needs `{PageTransition: false}` to unstub the component. Default shallowMount stubs are sufficient since we're not accessing the real component's internal state. This simplifies the test setup.

2. **Duplicate reduced motion detection accepted** -- Both PageTransition.vue and PageTransitionDemo.vue now independently detect `prefers-reduced-motion`. This is intentional duplication, not DRY violation. The component needs it for the real transition behavior; the demo needs it for the parameter display and indicator. They serve different purposes and the cost of coupling them (defineExpose) is higher than the cost of duplication (~8 lines each).

3. **PageTransition.vue simplified from detectReducedMotion function to inline ternary** -- The previous refactor extracted a `detectReducedMotion()` helper function. Since we're simplifying, the inline ternary is more readable for a component that's now ~15 lines of logic. No behavior change.

## Quality Gauntlet

| Check         | Result | Notes                                       |
| ------------- | ------ | ------------------------------------------- |
| format:check  | Pass   |                                             |
| lint          | Pass   | 0 errors, 0 warnings                        |
| lint:vue      | Pass   | All conventions passed                      |
| type-check    | Pass   |                                             |
| test:coverage | Pass   | 100% statements, branches, functions, lines |
| knip          | Pass   |                                             |
| size          | Pass   | families: 241.63kB, admin: 61.62kB          |

## Parameter Record

No new animation parameters. All existing CSS animation parameters (durations, easings, distances) are preserved identically. This was a pure architectural refactor -- the visual behavior is unchanged.

## Showcase Readiness

This is now a cleaner showcase piece. A senior reviewer examining PageTransition.vue sees a ~30-line component that does one thing: wrap slot content in a keyed Vue `<Transition>` with reduced-motion compliance. No internal override machinery, no exposed methods, no `watch` on route changes. Pure props-in, animation-out.

The demo owns its own state and passes it down via props. This is the Vue contract -- props down, events up -- and a junior reading this code learns the correct pattern. The previous version with defineExpose taught the wrong lesson: "sometimes you can break the contract for convenience."

The intentional duplication of `prefersReducedMotion` detection between the component and demo is a strength, not a weakness. It demonstrates that the right abstraction boundary is more important than eliminating every line of duplication.

## Proposed Knowledge Updates

- **Learnings:** "Never use defineExpose. When a demo needs to read state that a component owns internally, the architecture is inverted. The demo should own the state and pass it down via props. Props down, events up -- that's the Vue contract."
- **Pulse:** No updates needed -- this is a continuation of the page transition work, not new in-progress work.

## Self-Debrief

### What Went Well

- Pre-work checklist (graduated training rule) caught that I needed to read architecture tests before writing tests. This prevented mount boundary violations.
- The source code was already partially in the correct state from the previous refactor session -- the changes were focused and surgical. The main source files (PageTransition.vue, PageTransitionDemo.vue) needed the defineExpose removal and local state ownership.
- Coverage gap was caught immediately by running project-scoped coverage before the full gauntlet (candidate training rule from previous session). Line 21 of PageTransitionDemo.vue (the matchMedia change handler callback) was uncovered because the previous tests never tested live preference changes in the demo.

### What Went Poorly

- **defineExpose was the wrong choice from the start.** The second refactor (2026-04-10-page-transition-refactor) moved logic into the component and then added defineExpose so the demo could read it back out. This is architectural inversion -- the component owns state that the demo needs to display, so instead of making the demo own the display state, I punched a hole in the component's encapsulation. The correct pattern was always "demo owns its state, passes it down as props."

- **The lint-vue-allow-expose exception mechanism was premature.** I added a comment-based exception system to the lint rule because I thought PageTransition had a "legitimate" use case. It didn't. The exception mechanism normalizes escape hatches. In a portfolio piece, normalizing escape hatches is worse than the escape hatch itself -- it teaches juniors that "sometimes it's OK" instead of teaching them the correct pattern.

### Blind Spots

- Did not question the fundamental architecture of "component owns state, demo reads it via ref." When the CEO pointed out this was wrong, it was obvious in hindsight. The correct question to ask before using defineExpose is: "Who actually needs to own this state?" If the answer is "the consumer (demo/parent)," then the state should live in the consumer and flow down via props.

### Training Proposals

| Proposal                                                                                                                                                                   | Context                                                                                                                                                                                                                                                         | Shift Evidence                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Never use defineExpose. When a demo or parent needs state that a component owns, the architecture is inverted -- the demo should own the state and pass it down via props. | Used defineExpose to let the demo read animation state from PageTransition. The CEO correctly identified this as the wrong pattern. The demo should own selectedVariant and prefersReducedMotion, not read them back from the component.                        | 2026-04-10-remove-define-expose |
| Before adding a lint rule exception mechanism, ask: is the use case genuinely exceptional, or is the architecture wrong? Exception mechanisms normalize escape hatches.    | Added lint-vue-allow-expose comment-based exception to the defineExpose ban. The exception was unnecessary -- the underlying architecture (demo reading state from component via ref) was wrong. Fixing the architecture eliminated the need for the exception. | 2026-04-10-remove-define-expose |

---

## CFO Evaluation

_Appended by the CFO after reviewing the journal. The architect's sections above are not edited -- they stand as written._

**Overall Assessment:** Strong — clean execution of a clear directive.

### Permit Fulfillment Review

All 9 acceptance criteria met. Zero `defineExpose` in source. Zero `lint-vue-allow-expose` anywhere. The lint rule is unconditional again. The component is 33 lines of logic. The demo owns its own state. Gauntlet green with 1182 tests at 100% coverage.

### Decision Review

1. **Demo stubs reverted to default** — Correct. Without template ref, there's no reason to unstub PageTransition. The test is simpler.

2. **Duplicate reduced motion detection accepted** — Good judgment call. 8 lines of duplication is cheaper than coupling the demo to the component's internals. The CFO notes this is the correct application of the principle: "the right abstraction boundary matters more than eliminating every line of duplication."

3. **Inline ternary over helper function** — Fine for a component this small. No behavior change.

### Training Proposal Dispositions

| Proposal                                                               | Disposition | Rationale                                                                                                                                                                                                     |
| ---------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Never use defineExpose — demo should own state and pass down via props | Candidate   | First observation. Sound principle but needs second confirmation to graduate. The rule is clear: if you need defineExpose, the state ownership is inverted.                                                   |
| Before adding a lint rule exception, ask if the architecture is wrong  | Candidate   | First observation. Meta-lesson about escape hatches. Exception mechanisms are second-order normalizers — they don't just allow the escape, they teach that escaping is acceptable. Needs second confirmation. |

### Notes for the Creative Engine

Three deliveries in one day. Each one simpler than the last. That's the right trajectory — you're converging on the clean design instead of diverging into complexity. The component went from 69-line composable + dumb wrapper → self-contained component with defineExpose → pure props-in animation renderer. Each step removed indirection that shouldn't have been there.

The self-debrief is honest and the right lesson was extracted: "Who actually needs to own this state?" is the question to ask before punching holes in encapsulation. Good.
