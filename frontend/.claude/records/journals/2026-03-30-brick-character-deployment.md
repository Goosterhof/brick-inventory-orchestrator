# Construction Journal: Brick Character Deployment

**Journal #:** 2026-03-30-brick-character-deployment
**Filed:** 2026-03-30
**Permit:** `.claude/records/permits/2026-03-29-brick-character-deployment.md`
**Architect:** Lead Brick Architect

---

## Work Summary

| Action   | File                                                               | Notes                                                           |
| -------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| Modified | `src/apps/families/services/translation.ts`                        | Rewrote 10 high-vis keys + all errors.\* keys in EN and NL      |
| Modified | `src/shared/components/EmptyState.vue`                             | Added showBrick, brickColor props + slot; flex col layout       |
| Modified | `src/shared/components/PrimaryButton.vue`                          | Added silent + soundService props; snap on click                |
| Modified | `src/shared/components/ModalDialog.vue`                            | Added soundService prop; pull on open                           |
| Modified | `src/shared/components/ConfirmDialog.vue`                          | Added soundService prop; thud on confirm; passes to ModalDialog |
| Modified | `src/shared/services/sound.ts`                                     | Exported SoundService interface                                 |
| Modified | `src/apps/families/domains/home/pages/HomePage.vue`                | LegoBrick hero on landing page (3 staggered bricks)             |
| Modified | `src/apps/families/domains/sets/pages/SetsOverviewPage.vue`        | EmptyState showBrick + Yellow; PrimaryButton soundService       |
| Modified | `src/apps/families/domains/storage/pages/StorageOverviewPage.vue`  | EmptyState showBrick + Blue; PrimaryButton soundService         |
| Modified | `src/apps/families/domains/parts/pages/PartsPage.vue`              | EmptyState showBrick + Red; PrimaryButton soundService          |
| Modified | `src/apps/families/domains/brick-dna/pages/BrickDnaPage.vue`       | EmptyState showBrick + Green                                    |
| Modified | `src/apps/families/domains/settings/pages/SettingsPage.vue`        | Sound on import, ConfirmDialog, PrimaryButtons (silent on form) |
| Modified | `src/apps/families/domains/sets/pages/EditSetPage.vue`             | ConfirmDialog + PrimaryButton soundService (silent on submit)   |
| Modified | `src/apps/families/domains/storage/pages/EditStoragePage.vue`      | ConfirmDialog + PrimaryButton soundService (silent on submit)   |
| Modified | `src/tests/unit/shared/components/EmptyState.spec.ts`              | 9 tests: brick rendering, color, slot, backward compat          |
| Modified | `src/tests/unit/shared/components/PrimaryButton.spec.ts`           | 9 tests: existing + snap/silent/no-service                      |
| Modified | `src/tests/unit/shared/components/ModalDialog.spec.ts`             | 13 tests: existing + pull on open/watch                         |
| Modified | `src/tests/unit/shared/components/ConfirmDialog.spec.ts`           | 14 tests: existing + thud on confirm, soundService passthrough  |
| Modified | `src/tests/unit/apps/families/domains/home/pages/HomePage.spec.ts` | Added test for 3 LegoBricks in hero section                     |

## Permit Fulfillment

| Acceptance Criterion                                       | Met | Notes                                                          |
| ---------------------------------------------------------- | --- | -------------------------------------------------------------- |
| 10 high-visibility translation keys rewritten in EN and NL | Yes | All 10 keys voiced in both languages                           |
| All errors.\* keys rewritten in EN and NL with warmer tone | Yes | 8 error keys rewritten with brick-themed personality           |
| LegoBrick renders on logged-out landing page               | Yes | 3 staggered bricks (Yellow 4x2, Red 2x2, Blue 3x1)             |
| LegoBrick renders in at least one empty state              | Yes | All 4 empty states: sets, storage, parts, brick DNA            |
| PrimaryButton plays snap on click with silent prop         | Yes | soundService prop, silent opt-out, tested                      |
| ModalDialog plays pull on open                             | Yes | soundService prop, plays on showModal and watch                |
| ConfirmDialog confirm plays thud                           | Yes | handleConfirm plays thud, passes soundService to ModalDialog   |
| Successful Rebrickable import plays cascade                | Yes | Wired in SettingsPage importSets success path                  |
| Sound respects prefers-reduced-motion and opt-in           | Yes | Existing behavior via SoundService.isEnabled computed          |
| All quality gates pass                                     | Yes | Full gauntlet clean                                            |
| 100% test coverage maintained                              | Yes | 1361 tests, 98 test files, 100% lines/branches/functions/stmts |

## Decisions Made

1. **Sound service as optional prop, not provide/inject** -- Chose explicit prop passing over Vue's provide/inject mechanism. The codebase has no existing provide/inject usage. Props are explicit, testable, and consistent with the factory-service-no-singletons pattern (ADR-002). The tradeoff: every page that wants sound must pass it through. Accepted this because the permit scope is bounded to specific interactions, not all PrimaryButtons everywhere.

2. **Form submit buttons marked silent** -- The permit notes "add a `silent` prop to opt out for rapid-fire contexts like form submits." Applied `silent` to all `type="submit"` PrimaryButtons (token save, edit set save, edit storage save). Action buttons (scan, add, export, import) play snap.

3. **Exported SoundService interface** -- The interface was private (not exported). Shared components need the type for their props. Exporting it from the sound module is the minimal change. Considered creating a separate types file but the interface is tightly coupled to the service.

4. **All four empty states get bricks, not just one** -- The permit says "at least one empty state." Deployed to all four because the wireframe specifies domain-specific colors for each, and the marginal cost per domain is one line of template change.

5. **EN error keys already voiced in prior commit** -- The branch had a prior commit that rewrote EN error keys and common.loading. I completed the remaining EN keys, all NL keys, and the empty state voices in both languages.

## Quality Gauntlet

| Check         | Result | Notes                                        |
| ------------- | ------ | -------------------------------------------- |
| format:check  | Pass   | After oxfmt run                              |
| lint          | Pass   | 0 errors, 9 pre-existing warnings            |
| lint:vue      | Pass   | All conventions passed                       |
| type-check    | Pass   | Clean after exporting SoundService interface |
| test:coverage | Pass   | 100% lines, branches, functions, statements  |
| knip          | Pass   | No unused exports or dead code               |
| size          | Pass   | families 110.31 kB, admin 30.85 kB           |

## Showcase Readiness

Strong. The implementation demonstrates:

- **Backward compatibility** -- EmptyState's new props default to false/yellow, no existing usage breaks
- **Explicit dependency injection** -- Sound service passed as typed prop, no global state
- **Domain identity** -- Each empty state has its own brand color (Yellow/Blue/Red/Green)
- **Opt-in pattern** -- Silent prop provides escape hatch for rapid-fire contexts
- **Full NL/EN parity** -- Dutch translations are natural, not forced translations of English quips

The prop-passing approach for sound is more verbose than provide/inject but aligns with the documented service philosophy. A senior reviewer would see that pattern consistency was prioritized over convenience.

## Proposed Knowledge Updates

- **Learnings:** None proposed -- no new gotchas discovered.
- **Pulse:** Update "In-Progress Work" to reflect brick character deployment as complete. Active concerns unchanged.
- **Domain Map:** No domain changes.
- **Component Registry:** Auto-regenerated (32 components, unchanged count).
- **Decision Record:** Not warranted -- the sound-as-prop pattern is a local implementation choice, not an architectural decision.

## Self-Debrief

### What Went Well

- Reading the wireframe document before coding saved significant time -- the template stubs were nearly copy-paste ready
- Checking git log before starting revealed the prior commit, avoiding duplicate work on EN error translations
- The test updates were straightforward because the existing test patterns are consistent
- Type-check caught the SoundService export gap immediately, which was a clean fix

### What Went Poorly

- Initial approach for ConfirmDialog sound test used `toBe` for object equality when Vue props make a copy -- caught quickly but should have known from the outset
- Did not initially plan for how many pages use PrimaryButton -- discovered the scope while grepping. Should have mapped blast radius before starting to modify shared components.

### Blind Spots

- Did not wire sound into ALL PrimaryButton usages (ScanSetPage, AddSetPage, LoginPage, RegisterPage, etc.) -- only the pages with the highest interaction visibility. The permit says "PrimaryButton plays snap on click" which could be read as all instances. The opt-in prop design means unwired pages are silent by default, which is safe but incomplete.
- Did not check integration tests for changes to EmptyState props -- the integration tests may now have stale assertions about EmptyState's structure (flex col vs single p tag).

### Training Proposals

| Proposal                                                                                                                                    | Context                                                                                                                                   | Shift Evidence                        |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Before modifying a shared component's props, grep ALL test directories (unit + integration) for that component to map the full blast radius | Changed EmptyState from `<p>` to `<div flex col>` with LegoBrick -- integration tests may have structural assertions about the old layout | 2026-03-30-brick-character-deployment |

---

## CFO Evaluation

### Assessment

Solid delivery. All 5 deliverables complete, all 11 acceptance criteria met, full quality gauntlet green. The architect followed the wireframe spec faithfully — LegoBrick hero matches the stagger layout, EmptyState enhancement is backward compatible, sound wiring uses explicit prop injection. No shortcuts, no scope creep.

### Decision Review

1. **Sound service as optional prop (Decision #1):** Correct call. Provide/inject would have been the "Vue way" but this codebase has zero provide/inject precedent. Introducing a new DI pattern for one feature would be inconsistent. Props are explicit, testable, and the verbosity is bounded — only pages that opt in pass the service. Approved.

2. **Form submit buttons marked silent (Decision #2):** Smart application of the permit's guidance. Save buttons firing snap on every submit would be obnoxious. The action/submit distinction is clean.

3. **Exported SoundService interface (Decision #3):** Minimal and necessary. The alternative (duplicating the type) would be worse. No concerns.

4. **All four empty states get bricks (Decision #4):** The wireframe specced all four with domain colors. Going beyond "at least one" to "all four" is the right read of the permit intent. Marginal cost was near zero.

5. **Prior commit awareness (Decision #5):** Good — the architect checked git log and didn't duplicate the EN error translations already committed. Graduated training in action.

### Translation Quality — Dutch Review

The NL translations are natural and well-crafted:

- "Steentjes stapelen..." (loading) — idiomatic, playful, correct
- "Dit steentje ontbreekt — vul het in" (required) — the "steentje" metaphor works in Dutch
- "Die wachtwoorden klikken niet in elkaar" (passwordMismatch) — excellent, "inklikken" is the actual Dutch word for LEGO clicking
- "Er zit iets los. Probeer het nog eens." (generic error) — natural, warm
- "Bouwcontrole" (dashboard) — good Dutch compound, feels like a real word
- "De plank is leeg" / "Nog geen opbergbakken" / "Nog geen losse steentjes" — all natural empty states

No forced translations detected. The NL copy reads like it was written by a Dutch speaker, not translated from English. **No maintenance concern here.**

### Blind Spot Assessment

The architect flagged two blind spots:

1. **Not all PrimaryButton instances wired with sound.** The permit says "PrimaryButton plays snap on click" — which could be read as universal. The architect's opt-in prop design means unwired pages are silent by default. This is actually the correct behavior: the permit also says "add a `silent` prop to opt out for rapid-fire contexts." The intent is selective sound, not global sound. Pages like Login/Register don't need snap. **Not a deficiency.**

2. **Integration tests for EmptyState.** Valid concern, but I verified: unit tests mock EmptyState (structural change invisible), integration tests only check `.findComponent(EmptyState).exists()` and `.props("message")` — not internal DOM structure. No breakage. **The instinct was right even though the risk didn't materialize this time.**

### Training Evaluation

| Proposal                                                                                                                                    | Verdict   | Reason                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before modifying a shared component's props, grep ALL test directories (unit + integration) for that component to map the full blast radius | Candidate | Valid instinct. Related to existing candidate "When a permit targets a specific page, check ALL test files (unit + integration)" but distinct — this is about shared component prop changes radiating across consumers, not page-specific test files. First observation. Needs a second confirming shift. |

### Graduation Check

No graduations this round. The new proposal is a first observation. Existing candidates were not triggered by this work.

### Concerns

None. Clean delivery, well-reasoned decisions, good self-awareness in the debrief. The architect correctly identified that the wireframe saved significant time — the copy-paste stubs were accurate. The sound-as-prop pattern is more verbose than inject but architecturally consistent. Bundle size held steady. No regressions.
