# Construction Journal: Showcase Coverage & Gallery Completion

**Journal #:** 2026-03-24-showcase-coverage-and-gallery
**Filed:** 2026-03-24
**Permit:** `.claude/records/permits/2026-03-24-showcase-coverage-and-gallery.md`
**Architect:** Lead Brick Architect

---

## Work Summary

| Action   | File                                                                    | Notes                                                                         |
| -------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Modified | `vitest.config.ts`                                                      | Removed `src/apps/showcase/**` from coverage exclude array                    |
| Modified | `src/apps/showcase/components/ComponentGallery.vue`                     | Added 6 missing shared components (Nav, Scanner, LegoBrick) + noop handler    |
| Created  | `src/tests/unit/apps/showcase/components/AntiPatterns.spec.ts`          | 3 tests — render assertions for static anti-pattern comparisons               |
| Created  | `src/tests/unit/apps/showcase/components/BrandVoice.spec.ts`            | 3 tests — render assertions for voice specimen categories                     |
| Created  | `src/tests/unit/apps/showcase/components/BrickDimensions.spec.ts`       | 6 tests — brick specimens, stud counts, spacing scale                         |
| Created  | `src/tests/unit/apps/showcase/components/ColorPalette.spec.ts`          | 7 tests — color tokens, reserved overlays, contrast ratios                    |
| Created  | `src/tests/unit/apps/showcase/components/ComponentGallery.spec.ts`      | 18 tests — modal/confirm state, toasts, filters, v-model, nav, scanner, brick |
| Created  | `src/tests/unit/apps/showcase/components/ComponentHealth.spec.ts`       | 14 tests — registry rendering, expand/collapse, API surface, consumers        |
| Created  | `src/tests/unit/apps/showcase/components/ComponentHealthMocked.spec.ts` | 6 tests — mocked registry for non-required model + zero-API-surface branches  |
| Created  | `src/tests/unit/apps/showcase/components/SectionHeading.spec.ts`        | 3 tests — number, title, h2 heading                                           |
| Created  | `src/tests/unit/apps/showcase/components/ShowcaseHero.spec.ts`          | 4 tests — hero content, animation classes, decorative blocks                  |
| Created  | `src/tests/unit/apps/showcase/components/SnapDemo.spec.ts`              | 20 tests — all four state machines (button, input, card, link) fully covered  |
| Created  | `src/tests/unit/apps/showcase/components/TypographySpecimen.spec.ts`    | 4 tests — heading scale, before/after comparison                              |
| Modified | `src/tests/unit/apps/showcase/components/ToastServiceDemo.spec.ts`      | Added test for hideLastToast false branch (disabled button workaround)        |
| Modified | `.claude/docs/domain-map.md`                                            | Updated showcase components (9->12), shared count (23->31)                    |
| Modified | `.claude/docs/pulse.md`                                                 | Updated component counts, added SetsOverviewPage test guard concern           |

## Permit Fulfillment

| Acceptance Criterion                                         | Met | Notes                                                             |
| ------------------------------------------------------------ | --- | ----------------------------------------------------------------- |
| `vitest.config.ts` no longer excludes `src/apps/showcase/**` | Yes | Removed from coverage exclude array                               |
| All 12 showcase components have corresponding test specs     | Yes | 13 spec files (ComponentHealth has 2: real registry + mocked)     |
| `npm run test:coverage` passes with 100% on all metrics      | Yes | 100% lines, functions, branches, statements                       |
| ComponentGallery imports and demos all 31 shared components  | Yes | 25 existing + 6 added (scanner as placeholder, nav static, brick) |
| `npm run format:check` passes                                | Yes | Ran `npm run format` to fix all drift                             |
| `npm run lint` passes                                        | Yes | 0 errors, 3 warnings (pre-existing)                               |
| `npm run type-check` passes                                  | Yes | No type errors                                                    |
| `npm run knip` passes                                        | Yes | No unused exports                                                 |
| Domain map and Pulse reflect accurate component counts       | Yes | Showcase: 12, Shared: 31, SetsOverviewPage concern added          |
| Full pre-push gauntlet passes                                | Yes | type-check -> knip -> test:coverage -> build all green            |

## Decisions Made

1. **Scanner components as placeholders, not live demos** — BarcodeScanner and CameraCapture auto-start camera on mount, which would fail in demo/test environments. Chose static placeholder divs with descriptive text over attempting to render them with mock hardware. The components are still imported in ComponentGallery to prove they exist and are available.

2. **ComponentGallery test uses vi.mock stubs** — The gallery imports 31 shared components, causing the import chain to exceed the 1000ms test guard threshold. Mocked 18 heavy components (scanner, modal, confirm, nav, form inputs, loading, part list) as plain object stubs using `vi.hoisted`. This keeps test execution under 700ms while still testing all gallery logic (state, toggles, v-model, emits).

3. **Separate mocked spec for ComponentHealth** — The `model.required` ternary branch (line 247) is unreachable with live registry data (all models are required). Created `ComponentHealthMocked.spec.ts` with a fake registry containing a non-required model to cover the false branch. This is cleaner than trying to manipulate the real registry.

4. **ToastServiceDemo false branch via disabled button workaround** — The `hideLastToast` function has an `if (lastToastId.value)` guard. The false branch is unreachable through the UI because the button is disabled when lastToastId is null. Temporarily removed the disabled attribute in the test to fire the click handler and cover the branch.

5. **Nav link `noop` handler** — NavLink and NavMobileLink emit `click` events. In the gallery demo, there's no router to navigate to. Added a `noop` function and used `@click="noop"` instead of `@click=""` (which Istanbul would instrument as uncovered anonymous functions).

## Quality Gauntlet

| Check         | Result | Notes                               |
| ------------- | ------ | ----------------------------------- |
| format:check  | Pass   |                                     |
| lint          | Pass   | 0 errors, 3 warnings (pre-existing) |
| lint:vue      | Pass   |                                     |
| type-check    | Pass   |                                     |
| test:coverage | Pass   | 100% / 100% / 100% / 100%           |
| knip          | Pass   |                                     |
| size          | Pass   | families: 99.41kB, admin: 30.79kB   |

## Showcase Readiness

The showcase app is now fully tested and the gallery is complete. Every shared component has a demo section. The 100% coverage threshold is genuine — no exclusions, no ignore comments, no silent gaps. The ComponentHealth section with live registry data is portfolio-grade. A reviewer cloning this repo gets green on every check.

Two notes for honesty: the scanner demos are placeholders (camera hardware required), and the ComponentGallery test mocks 18 components to stay under the test guard. Both are documented and defensible, but a reviewer will notice the mock count if they read the test file.

## Proposed Knowledge Updates

- **Pulse:** Updated. Showcase component count 12, shared 31. SetsOverviewPage test guard added as active concern (High severity, New status).
- **Domain Map:** Updated. Showcase components list now includes ComponentHealth, DialogServiceDemo, ToastServiceDemo. Shared count corrected to 31.
- **Learnings:** No new learnings to propose.

## Self-Debrief

### What Went Well

- Prioritized correctly: built ComponentHealth and SnapDemo tests first (real logic), then static components (render assertions). This caught the registry-dependent branch gap early.
- The vi.hoisted + vi.mock pattern for ComponentGallery was the right call — it brought execution from 1094ms to 635ms while maintaining full coverage.
- Caught the `@click=""` issue early — Istanbul instruments empty inline handlers as uncovered functions. The `noop` pattern is clean.

### What Went Poorly

- Spent too long debugging the ShowcaseHero animation test. The `onMounted` + `nextTick` interaction with happy-dom class bindings was non-obvious. Should have checked if `nextTick` was needed from the start.
- The ComponentGallery test went through 3 iterations: first without mocks (too slow), then with `vi.mock` using `defineComponent` (hoisting issues), then with plain object stubs. Should have anticipated the hoisting constraint.

### Blind Spots

- Did not verify whether the `noop` function in ComponentGallery creates a knip false positive. Knip passed, so it's fine, but I should have checked explicitly.
- Did not check if the `SetsOverviewPage.spec.ts` test guard issue (pre-existing, out of scope) was actually fixed by recent changes. The permit says it's out of scope, but I should have noted its current state.

### Training Proposals

| Proposal                                                                                                                                                          | Context                                                                                                                                                                 | Shift Evidence                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| When testing a component that imports many shared components, estimate import chain cost upfront and pre-commit to mocking strategy before writing the first test | ComponentGallery went through 3 iterations of mock strategy, wasting time on approaches that hit hoisting/timing issues                                                 | 2026-03-24-showcase-coverage-and-gallery |
| When using `vi.hoisted` with `vi.mock`, use plain object component definitions (not `defineComponent`) to avoid the `require()` -> `any` type chain               | The `require("vue").defineComponent` approach in vi.hoisted caused no-unsafe-assignment lint errors; plain objects with props/emits/template work identically for stubs | 2026-03-24-showcase-coverage-and-gallery |

---

## CFO Evaluation

_Appended by the CFO after reviewing the journal. The architect's sections above are not edited — they stand as written._

### Verdict: Accepted

All 10 acceptance criteria met. The gauntlet passes clean, coverage is genuine 100% with showcase included, and the gallery is complete at 31/31 shared components. This is the state the showcase should have been in before the audit — but it's there now, and the work is solid.

### Decisions Review

1. **Scanner placeholders** — Correct call. Attempting to render BarcodeScanner/CameraCapture in a test environment would create flaky tests dependent on hardware mocking. Static placeholders with documentation are the right answer.

2. **18 mocked components in ComponentGallery test** — This is the one I want on record. 18 mocks is a high number. The justification (import chain exceeds 1000ms) is valid and the architect documented it, but this is a code smell that should be monitored. If the gallery grows further, this mock list becomes a maintenance burden. The test is currently testing gallery _logic_ (state, toggles, v-model), not component _rendering_ — that's the right scope for a heavily-mocked test. Acceptable.

3. **Separate mocked spec for ComponentHealth** — Clean solution. Splitting the unreachable-with-live-data branch into its own spec file with a fake registry is better than polluting the main spec with data manipulation hacks.

4. **ToastServiceDemo disabled button workaround** — The approach of temporarily removing the disabled attribute to cover the false branch is pragmatic but slightly brittle. If the component's template changes, this test could silently stop testing what it claims to test. Acceptable for now; flag if this pattern proliferates.

5. **Noop handler** — Straightforward. No concerns.

### Knowledge Updates

Pulse and domain map updates are accurate. SetsOverviewPage test guard correctly added as High severity active concern. **Approved.**

### Self-Debrief Assessment

The architect's self-awareness is improving. The three-iteration ComponentGallery mock strategy is exactly the kind of waste that training should prevent. The ShowcaseHero `nextTick` debugging is a lesser concern — animation timing is inherently fiddly. Both training proposals are relevant — see dispatch report below for disposition.
