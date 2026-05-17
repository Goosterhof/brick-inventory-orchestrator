# Construction Journal: Mount Boundary Enforcement

**Journal #:** 2026-04-01-mount-boundary-enforcement
**Filed:** 2026-04-01
**Permit:** `.claude/records/permits/2026-03-31-mount-boundary-enforcement.md`
**Architect:** Lead Brick Architect

---

## Work Summary

Added architecture test rule enforcing `shallowMount` in unit tests and `mount` in integration tests. Migrated all 15 unit test files from `mount` to `shallowMount` with explicit unstubbing where assertions depend on child content.

| Action   | File                                                                        | Notes                                                                                                      |
| -------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Modified | `src/tests/unit/architecture.spec.ts`                                       | Added mount boundary enforcement rules (unit: no mount, integration: no shallowMount)                      |
| Modified | `src/tests/unit/apps/showcase/components/AntiPatterns.spec.ts`              | mount -> shallowMount, unstub SectionHeading                                                               |
| Modified | `src/tests/unit/apps/showcase/components/BrandVoice.spec.ts`                | mount -> shallowMount, unstub SectionHeading                                                               |
| Modified | `src/tests/unit/apps/showcase/components/BrickDimensions.spec.ts`           | mount -> shallowMount, unstub SectionHeading                                                               |
| Modified | `src/tests/unit/apps/showcase/components/ColorPalette.spec.ts`              | mount -> shallowMount, unstub SectionHeading                                                               |
| Modified | `src/tests/unit/apps/showcase/components/SnapDemo.spec.ts`                  | mount -> shallowMount, unstub SectionHeading                                                               |
| Modified | `src/tests/unit/apps/showcase/components/ComponentHealthMocked.spec.ts`     | mount -> shallowMount, unstub SectionHeading                                                               |
| Modified | `src/tests/unit/apps/showcase/components/FormValidationWorkbench.spec.ts`   | mount -> shallowMount, unstub SectionHeading + all form inputs + PrimaryButton                             |
| Modified | `src/tests/unit/apps/showcase/components/ResourceAdapterPlayground.spec.ts` | mount -> shallowMount, unstub SectionHeading + TextInput/NumberInput/PrimaryButton/DangerButton            |
| Modified | `src/tests/unit/apps/showcase/components/ToastServiceDemo.spec.ts`          | mount -> shallowMount, unstub SectionHeading + PrimaryButton + ToastMessage + ToastContainer:false         |
| Modified | `src/tests/unit/apps/showcase/components/DialogServiceDemo.spec.ts`         | mount -> shallowMount, unstub SectionHeading + PrimaryButton + DialogContainer:false                       |
| Modified | `src/tests/unit/apps/showcase/components/ComponentGallery.spec.ts`          | mount -> shallowMount, added 13 new vi.mock entries for button/toast/layout components, noAutoStub pattern |
| Modified | `src/tests/unit/apps/showcase/components/SectionHeading.spec.ts`            | mount -> shallowMount (no children, trivial swap)                                                          |
| Modified | `src/tests/unit/apps/showcase/components/ShowcaseHero.spec.ts`              | mount -> shallowMount (no children, trivial swap)                                                          |
| Modified | `src/tests/unit/apps/showcase/components/TypographySpecimen.spec.ts`        | Already migrated in prior session, committed as part of this batch                                         |
| Modified | `src/tests/unit/shared/components/PartListItem.spec.ts`                     | Already migrated in prior session, committed as part of this batch                                         |

## Permit Fulfillment

| Acceptance Criterion                                                       | Met | Notes                                                                        |
| -------------------------------------------------------------------------- | --- | ---------------------------------------------------------------------------- |
| Architecture test enforces shallowMount in unit/ and mount in integration/ | Yes | Two new test cases in architecture.spec.ts                                   |
| All 15 unit test files migrated from mount to shallowMount                 | Yes | All 15 files modified, 4 were pre-migrated from prior session                |
| All 1312+ tests still pass                                                 | Yes | 1312 tests pass (96 files)                                                   |
| No test guard violations at the 1000ms threshold                           | Yes | No execution threshold violations post-migration                             |
| 100% test coverage maintained                                              | Yes | 100% lines/branches/functions/statements                                     |
| All quality gates pass                                                     | Yes | format:check, lint, lint:vue, type-check, test:coverage, knip, size all pass |

## Decisions Made

1. **Unstub vs. adjust assertions** -- Chose to unstub child components (passing them in `global.stubs`) rather than rewriting assertions to use `findComponent` patterns. This preserves the existing assertion style (DOM queries, text content checks) and keeps tests readable. The alternative would have been more invasive changes for marginal benefit.

2. **ComponentGallery: noAutoStub pattern** -- For ComponentGallery (which already had 18 vi.mock entries), added 13 more mocks for button/toast/layout components, plus a `noAutoStub` object mapping all 31 mocked component names to `false`. This prevents shallowMount from double-stubbing the vi.mock'd components. Considered importing all mocked components individually into the stubs config, but the `noAutoStub` pattern is more maintainable and self-documenting.

3. **Dynamic component containers** -- For ToastServiceDemo and DialogServiceDemo, used `ToastContainer: false` and `DialogContainer: false` in stubs to prevent shallowMount from stubbing the dynamically rendered container components (`<component :is="service.ContainerComponent" />`). These containers are created at runtime by the service factories and have known names.

4. **Button-rendering mocks for ComponentGallery** -- Created `mkButtonStub` and `mkToastStub` factories alongside the existing `mkStub`, providing mocks that render actual `<button>` elements. This preserves existing test queries like `wrapper.findAll("button").find(...)`.

## Quality Gauntlet

| Check         | Result | Notes                                |
| ------------- | ------ | ------------------------------------ |
| format:check  | Pass   |                                      |
| lint          | Pass   | 11 warnings (pre-existing), 0 errors |
| lint:vue      | Pass   |                                      |
| type-check    | Pass   |                                      |
| test:coverage | Pass   | 100% all metrics, 1312 tests         |
| knip          | Pass   |                                      |
| size          | Pass   | families: 110.79 kB, admin: 30.85 kB |

## Showcase Readiness

The architecture test enforcement is portfolio-grade. A senior reviewer would see:

- Consistent boundary between unit and integration testing approaches
- Architecture test that catches violations at commit time, not code review time
- Practical unstubbing patterns that demonstrate understanding of vue-test-utils shallow rendering behavior
- The ComponentGallery `noAutoStub` pattern is a pragmatic solution to the vi.mock + shallowMount interaction -- it documents the problem and its resolution in the code itself

The one area that could be cleaner: ComponentGallery now mocks 31 components individually. This is a consequence of the component's complexity (it demos the entire shared component library). A future improvement might be to split ComponentGallery into subsection components, each with a simpler test.

## Proposed Knowledge Updates

- **Learnings:** When using `shallowMount` on a component that has `vi.mock`'d children, shallowMount still auto-stubs them. Pass mocked component names as `false` in the stubs config to let the vi.mock'd implementations render.
- **Learnings:** Dynamic `<component :is>` bindings are stubbed by shallowMount. If the dynamically rendered component has a known name (check the defineComponent `name` option), pass `ComponentName: false` in stubs to prevent stubbing.
- **Pulse:** ComponentGallery test guard status should be re-evaluated -- the migration to shallowMount with mocks brought it to ~820ms (within threshold).

## Self-Debrief

### What Went Well

- Reading the prior fix (commit 48726bb) before starting gave me the exact pattern to follow -- SectionHeading unstubbing with explicit import.
- Systematic file-by-file migration with an immediate test run after the first batch caught the shallowMount + vi.mock interaction early.
- The architecture test was already written (left as uncommitted changes from the prior session), reducing scope to just the migration work.

### What Went Poorly

- First attempt at ComponentGallery migration was naive -- I assumed vi.mock'd components would be rendered by shallowMount. Had to iterate to discover that shallowMount auto-stubs override vi.mock. This cost one full test-run cycle.
- Initially wrote the BrandVoice migration incorrectly (replaced import but not the body calls), requiring a re-read and full rewrite.

### Blind Spots

- Did not check upfront how shallowMount interacts with vi.mock'd modules. The vue-test-utils documentation is clear on this, but I assumed rather than verified. Should have written one test first for the most complex file (ComponentGallery) to discover the interaction before migrating simpler files.
- Did not check whether dynamic `<component :is>` is stubbed by shallowMount until the test failures told me. A quick grep for `:is=` in the affected component templates would have flagged this ahead of time.

### Training Proposals

| Proposal                                                                                                                                                                            | Context                                                                                                          | Shift Evidence |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------- |
| When migrating tests from mount to shallowMount in a file that uses vi.mock, verify in one test first that the mock'd components render -- shallowMount auto-stubs override vi.mock | ComponentGallery needed noAutoStub pattern because shallowMount double-stubbed vi.mock'd components              | This journal   |
| Before migrating tests that render dynamic components (`<component :is>`), grep the source template for `:is=` bindings and check the component name property to plan unstubbing    | ToastServiceDemo and DialogServiceDemo both needed explicit `false` stubs for their service container components | This journal   |

---

## CFO Evaluation

_Appended by the CFO after reviewing the journal. The architect's sections above are not edited — they stand as written._

### Assessment

Solid execution. The permit was infrastructure cleanup with an established pattern, and the architect treated it accordingly — systematic, file-by-file, no unnecessary invention. The architecture test (the real deliverable) is clean: it reads source files, checks imports, reports violations with actionable messages. This is the kind of structural enforcement that pays for itself on the first prevented regression.

The three-tier classification (simple/medium/complex) in the work summary is useful — it shows the architect thought about the work before doing it, not just grinding through files alphabetically.

### Decision Review

1. **Unstub vs. adjust assertions** — Correct call. Rewriting assertions to use `findComponent` patterns would have been more invasive and less readable for no benefit. The unstub approach preserves existing test intent.

2. **ComponentGallery noAutoStub pattern** — Pragmatic but ugly. 31 mocked components in one test file is a code smell the architect correctly flagged ("future improvement might be to split ComponentGallery into subsection components"). The pattern works, but this file is now carrying significant mock maintenance debt. Not a problem for this permit — the permit said "don't add new tests" — but worth tracking.

3. **Dynamic component stubs** — Good discovery, well-documented. The `ToastContainer: false` / `DialogContainer: false` pattern for `<component :is>` is non-obvious and the journal explains it clearly.

### Quality

All 7 gates green, 1312 tests, 100% coverage. No concerns.

### Concerns

- The journal notes "4 were pre-migrated from prior session" — meaning TypographySpecimen and PartListItem were already done but uncommitted. This is fine for this permit but suggests the prior session left work on the floor. Not a pattern I want to see repeated.
- ComponentGallery at ~820ms is cutting it close to the 1000ms threshold. The architect noted this in proposed knowledge updates. If we add more components to the gallery, that file will be the first to breach.
