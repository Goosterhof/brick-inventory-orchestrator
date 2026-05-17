# Construction Journal: Dialog & Toast Service Showcase Sections

**Journal #:** 2026-03-24-dialog-toast-showcase
**Filed:** 2026-03-24
**Permit:** `.claude/records/permits/2026-03-24-dialog-toast-showcase.md`
**Architect:** Lead Brick Architect

---

## Work Summary

| Action   | File                                                                | Notes                                                                                  |
| -------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Verified | `src/apps/showcase/components/DialogServiceDemo.vue`                | Already existed with complete implementation. Section 09.                              |
| Verified | `src/apps/showcase/components/ToastServiceDemo.vue`                 | Already existed with complete implementation. Section 10.                              |
| Verified | `src/apps/showcase/App.vue`                                         | Already imported and rendered both new sections after ComponentHealth.                 |
| Created  | `src/tests/unit/apps/showcase/components/DialogServiceDemo.spec.ts` | 10 tests covering rendering, programmatic open, stacking, close, closeAll.             |
| Created  | `src/tests/unit/apps/showcase/components/ToastServiceDemo.spec.ts`  | 14 tests covering rendering, success/error toasts, FIFO max, hide, event log, log cap. |
| Modified | `vitest.config.ts`                                                  | Added `showcase/components` project to enable test discovery for showcase tests.       |

## Permit Fulfillment

| Acceptance Criterion                                                                                 | Met | Notes                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| DialogServiceDemo renders and demonstrates programmatic dialog opening, stacking, and closeAll       | Yes | Three demo boxes: single open, stackable (with inner "Open Stacked" button), and closeAll with red danger button. DialogContainerComponent mounted. |
| ToastServiceDemo renders and demonstrates programmatic toast showing, queuing, max limit, and hiding | Yes | Success/error variants, "Show 6 Toasts" for FIFO overflow, "Hide Last" with ID tracking, event log with clear.                                      |
| Both sections follow established showcase section pattern                                            | Yes | SectionHeading with correct numbers (09, 10), brick-border demo boxes, monospace labels.                                                            |
| App.vue includes both new sections in logical order                                                  | Yes | Already in place: DialogServiceDemo and ToastServiceDemo after ComponentHealth.                                                                     |
| Full quality gauntlet passes                                                                         | Yes | All 7 checks pass.                                                                                                                                  |
| No changes to shared services or components                                                          | Yes | Only showcase components and test infrastructure modified.                                                                                          |

## Decisions Made

1. **Added vitest project for showcase tests** -- The vitest config had no `showcase/components` project, so the test files would not be discovered. Added `project("showcase/components", "apps/showcase/components")` alongside existing app projects. The alternative was putting tests in an existing project, but that would violate the project-per-directory convention.

2. **Full mount instead of shallow mount for showcase tests** -- Used `mount()` instead of `shallowMount()` because the showcase demos exercise real service behavior (dialog stacking, toast queuing). Shallow mounting would stub the service containers and defeat the purpose of testing the demo interactions.

3. **Counted toasts by dismiss button aria-label instead of findAllComponents** -- The FIFO test needed to count rendered toasts. Using `findAllComponents({name: "ToastMessage"})` triggered an `any` type lint error. Used `findAll("button[aria-label='Dismiss']")` instead, which is type-safe and semantically correct (each ToastMessage has exactly one dismiss button).

## Quality Gauntlet

| Check         | Result | Notes                                                                                                                                  |
| ------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| format:check  | Pass   | oxfmt reordered imports in test files; applied via `npm run format` first.                                                             |
| lint          | Pass   | 0 errors. 1 pre-existing warning (unrelated to this work).                                                                             |
| lint:vue      | Pass   | All conventions passed.                                                                                                                |
| type-check    | Pass   | Clean vue-tsc build.                                                                                                                   |
| test:coverage | Pass   | Lines: 100%, Branches: 100%, Functions: 100%, Statements: 100%. Showcase source excluded from coverage thresholds per existing config. |
| knip          | Pass   | No unused exports or dead code.                                                                                                        |
| size          | Pass   | families: 99.41 kB / 350 kB limit. admin: 30.79 kB / 150 kB limit.                                                                     |

## Showcase Readiness

The implementation is portfolio-grade. Both sections demonstrate the service layer cleanly:

- DialogServiceDemo shows the three key service capabilities (open, stack, closeAll) with visually distinct buttons and a code snippet showing the container mount pattern. The inline `defineComponent` with render function is the same pattern the service itself uses internally.
- ToastServiceDemo adds an event log that makes the FIFO behavior observable -- a viewer can see toast IDs being assigned and evicted. The max-4 overflow demo is a single button press that shows all 6 then trims to 4.

Both sections use consistent Brick Brutalism styling and follow the established showcase section structure.

## Proposed Knowledge Updates

- **Learnings:** None. No new gotchas discovered.
- **Pulse:** Showcase app staleness concern can be updated -- the showcase now has 10 sections (was 8). Component count note ("Showcase (9) lags behind shared components (26)") should be revisited.
- **Domain Map:** No domain changes.
- **Brick Catalog:** No shared component changes.
- **Decision Record:** Not warranted. Adding a vitest project for showcase tests is a routine config extension, not an architectural decision.

## Self-Debrief

### What Went Well

- The showcase components were already implemented and well-structured. The work was primarily creating the test infrastructure and tests.
- The vitest project addition followed the existing convention exactly -- one `project()` call with the standard pattern.
- All 24 tests passed after one minor fix (the "hide(" string matching issue).

### What Went Poorly

- First attempt at the FIFO test used `findAllComponents({name: "ToastMessage"})` which triggered an `any` type lint error. Had to find an alternative selector.
- The "should not attempt hide when lastToastId is null" test initially checked for `"hide("` in the page text, but the static label `toastService.hide(id)` contains that substring. Needed to tighten to `"hide(toast-"`.

### Blind Spots

- Did not initially check whether the showcase component files already existed. Assumed they needed to be created from scratch. The permit language said "What to Build" which implied creation, but they were already in place.
- The collect guard warning on ToastServiceDemo (302ms delta) suggests the import chain is heavy. This is not a test failure, but could indicate the component pulls in a large dependency tree. Worth monitoring if more showcase tests are added.

### Training Proposals

| Proposal                                                                                                                                                                                               | Context                                                                                                                                 | Shift Evidence                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Before creating files specified in a permit, check if they already exist -- the permit may describe existing work that needs tests or verification, not creation from scratch                          | Assumed DialogServiceDemo.vue needed creation, but it was already present. Wasted time preparing to write a file that existed.          | 2026-03-24-dialog-toast-showcase |
| When testing that specific dynamic text is absent, ensure the assertion pattern does not match static labels already in the template -- use a more specific pattern that includes dynamic-only content | "hide(" matched the static label "toastService.hide(id)" in the template. Tightened to "hide(toast-" to match only dynamic log entries. | 2026-03-24-dialog-toast-showcase |

---

## CFO Evaluation

_Appended by the CFO after reviewing the journal. The architect's sections above are not edited -- they stand as written._

**Overall Assessment:** Solid

### Permit Fulfillment Review

All six acceptance criteria met. The architect delivered exactly what was specified — no over-delivery, no gaps. The vitest config addition was the right call and follows existing convention.

### Decision Review

1. **Vitest project for showcase** — Correct. Without it, tests would be invisible to the runner. Follows the one-project-per-directory pattern established by the rest of the config.
2. **Full mount over shallow mount** — Correct. These tests exercise real service behavior; stubbing the containers would defeat the purpose.
3. **Dismiss button selector over findAllComponents** — Pragmatic solution to a type-safety lint issue. The semantic selector is actually more robust than component name matching.

No decisions required CEO escalation.

### Showcase Assessment

The delivery strengthens the portfolio. The Dialog Service demo makes the stacking behavior visible and interactive — a reviewer can open two dialogs and see the native `<dialog>` stack in action. The Toast Service demo with its event log is the standout: showing toast IDs being assigned and evicted makes the FIFO behavior observable, not just described.

The inline `defineComponent` with render function in DialogServiceDemo is the right approach — it mirrors how the service itself works, which is the point of the showcase.

### Training Proposal Dispositions

| Proposal                                                     | Disposition | Rationale                                                                                                                                                                                       |
| ------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Check if files exist before creating them                    | Candidate   | Valid observation. The permit language was ambiguous ("What to Build" vs "What to Test"), and the architect assumed creation. First occurrence — needs a second confirming session to graduate. |
| Use specific patterns when asserting absence of dynamic text | Candidate   | Good general testing hygiene. The "hide(" vs "hide(toast-" issue is a real footgun in component tests with mixed static/dynamic content. First occurrence — needs confirmation.                 |

### Notes for the Architect

Clean work. The honest self-debrief about the FIFO test selector and the existing-file blind spot shows good self-awareness. The event log on the Toast Service demo was a nice touch that adds genuine portfolio value — it makes the service behavior observable without requiring DevTools.
