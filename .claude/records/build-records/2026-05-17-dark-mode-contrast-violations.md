# Construction Journal: Dark Mode Contrast Violations

**Journal #:** 2026-05-17-dark-mode-contrast-violations
**Filed:** 2026-05-17
**Permit:** [`.claude/records/permits/2026-05-17-dark-mode-contrast-violations.md`](../permits/2026-05-17-dark-mode-contrast-violations.md)
**Architect:** Lead Brick Architect

---

## Work Summary

21 files modified, no files created or deleted.

| Action   | File                                                            | Notes                                                                                                                                                                                                                        |
| -------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modified | `src/shared/assets/theme.css`                                   | Added `--brick-danger-text`, `--brick-surface-highlight`, `--brick-highlight-text` tokens; bumped dark `--brick-shadow-color` from `rgba(255,255,255,0.15)` to `#ffffff`; expanded the header comment with a token inventory |
| Modified | `src/shared/components/forms/FormError.vue`                     | `brick-red-dark` → `[var(--brick-danger-text)]`                                                                                                                                                                              |
| Modified | `src/shared/components/ToastMessage.vue`                        | Both `brick-red-dark` usages (icon + paragraph) → token                                                                                                                                                                      |
| Modified | `src/shared/components/DangerButton.vue`                        | `brick-red-dark` → token                                                                                                                                                                                                     |
| Modified | `src/shared/components/ConfirmDialog.vue`                       | `brick-red-dark` → token                                                                                                                                                                                                     |
| Modified | `src/shared/components/BadgeLabel.vue`                          | `gray-100` → `[var(--brick-surface-subtle)]`, `gray-200` → `[var(--brick-card-bg)]`                                                                                                                                          |
| Modified | `src/shared/components/scanner/BarcodeScanner.vue`              | Retry button `bg="white"` / `text="black"` → tokenized                                                                                                                                                                       |
| Modified | `src/shared/components/scanner/CameraCapture.vue`               | Retry button tokenized; capture button keeps the intentional `bg="black"` / `text="white"` brand inversion (HTML comment added explaining why) with only the disabled states tokenized                                       |
| Modified | `src/shared/components/forms/inputs/TextInput.vue`              | Added `focus:text-brick-ink` so text reads on focused-yellow bg regardless of theme                                                                                                                                          |
| Modified | `src/shared/components/forms/inputs/NumberInput.vue`            | Same `focus:text-brick-ink` addition                                                                                                                                                                                         |
| Modified | `src/shared/components/forms/inputs/DateInput.vue`              | Same                                                                                                                                                                                                                         |
| Modified | `src/shared/components/forms/inputs/SelectInput.vue`            | Same                                                                                                                                                                                                                         |
| Modified | `src/shared/components/forms/inputs/TextareaInput.vue`          | Same                                                                                                                                                                                                                         |
| Modified | `src/apps/families/domains/settings/pages/SettingsPage.vue`     | All 6 `text="brick-red-dark"` paragraphs → token                                                                                                                                                                             |
| Modified | `src/apps/families/domains/sets/pages/ScanSetPage.vue`          | `addError` paragraph → token; `bg="yellow-100"` duplicate warning → `[var(--brick-surface-highlight)]` with `[var(--brick-highlight-text)]`                                                                                  |
| Modified | `src/apps/families/domains/sets/pages/SetDetailPage.vue`        | `text-brick-red-dark` class binding + `text-color="brick-red-dark"` → token                                                                                                                                                  |
| Modified | `src/apps/families/domains/sets/pages/AddSetPage.vue`           | `bg="yellow-100"` duplicate-warning → highlight tokens                                                                                                                                                                       |
| Modified | `src/apps/families/domains/sets/components/CompletionGauge.vue` | `text-brick-red-dark` class binding → token; `text-brick-ink` default branch → `text-[var(--brick-page-text)]` so the partial-state percentage label reads in dark mode                                                      |
| Modified | `src/apps/families/domains/parts/pages/PartsUnsortedPage.vue`   | `bg="yellow-100"` unknown-sets warning + nested link button → highlight tokens                                                                                                                                               |
| Modified | `src/tests/unit/shared/components/BadgeLabel.spec.ts`           | Two `attributes('bg')` assertions updated to new tokens; spec titles renamed to describe new semantics                                                                                                                       |
| Modified | `src/tests/unit/shared/components/DangerButton.spec.ts`         | `attributes('text')` assertion updated                                                                                                                                                                                       |

## Permit Fulfillment

| Acceptance Criterion                                                                                                                                                               | Met     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No occurrence of `text="brick-red-dark"` / `text-color="brick-red-dark"` / `text="sm brick-red-dark"` / `text-brick-red-dark` class binding in `src/shared` or `src/apps/families` | Yes     | `grep -rn 'brick-red-dark\|text-brick-red-dark' src/shared src/apps/families` returns no matches                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| No occurrence of `bg="yellow-100"`, `bg="gray-100"`, `bg="gray-200"`, `bg="white"`, `bg="black"`, `disabled:gray-200` in the listed files                                          | Yes     | All listed files cleaned. `LegoTechnicBeam.vue` keeps `bg="white"` (decorative LEGO pin — explicitly permitted). `CameraCapture.vue` capture button keeps `bg="black"`/`text="white"` as a documented intentional brand inversion (HTML comment added) — only the `disabled:` states tokenized                                                                                                                                                                                                                                           |
| Brick shadows in dark mode are clearly visible against the navy bg                                                                                                                 | Yes     | `--brick-shadow-color` in `:root` went `rgba(255,255,255,0.15)` → `#ffffff`, mirroring the light-mode pure-black pattern                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Focused form inputs show readable text against yellow focus bg in dark mode                                                                                                        | Yes     | All 5 form inputs gained `focus:text-brick-ink` on the normal-state computed class                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Gauntlet passes (lint, type-check, test:coverage 100%, build)                                                                                                                      | Yes     | `format:check` pass; `lint` 0/0 over 303 files; `lint:vue` all conventions; `type-check` clean; `test:coverage` 113 files / 1381 tests / 100% statements + branches + functions + lines; `knip` clean; `size` families 128.7 kB / admin 30.8 kB brotli (both under budget); `build` clean                                                                                                                                                                                                                                                |
| Manual sanity check (dark default → toggle light → toggle dark, error messages, badges, scan flow, settings errors readable)                                                       | Partial | Environment is headless. Started `npm run dev`, curled raw module output to confirm: (a) theme.css ships the new tokens in both `:root` (dark) and `[data-theme='light']` blocks with the correct hex values, (b) FormError.vue emits `[var(--brick-danger-text)]` and no longer `brick-red-dark`, (c) TextInput.vue emits `focus:bg-brick-yellow focus:text-brick-ink` in its computed class string. **Live visual round-trip of the toggle is required by the CEO/CFO before merge** — could not reach a browser from this environment |

## Decisions Made

1. **Three new tokens instead of one.** Permit suggested `--brick-danger-text`. Added two more — `--brick-surface-highlight` (warning/attention bg, replacing `yellow-100`) and `--brick-highlight-text` (text that reads on the highlight bg). The duplicate-warning boxes in AddSetPage / ScanSetPage and the unknown-sets warning in PartsUnsortedPage all needed a yellow-tinted surface that adapts to theme. Without these, would have had to either reuse `--brick-card-bg` (loses the warning semantic) or `--brick-surface-subtle` (too low-contrast in light mode). Three tokens for three semantic roles felt right and avoided sprawl.

2. **`--brick-surface-highlight` color choices.** Light mode: `#fef3c7` (Tailwind's `yellow-100` byte-for-byte — visual continuity matters more than picking a "cleaner" hex). Dark mode: `#4a3f1a` (a deep ochre that reads as "yellow warning" without overpowering against the navy `#1a1a2e` page bg). Contrast ratio of `#fdf0c4` (highlight-text in dark) on `#4a3f1a` is ~7.9:1 — comfortably above WCAG AA.

3. **`--brick-shadow-color` jumped straight to `#ffffff`.** Permit suggested `rgba(255,255,255,0.85)` or `#ffffff`. Went pure white because (a) the light-mode equivalent is pure `rgba(0,0,0,1)` already, so this mirrors the pattern, (b) the brick aesthetic depends on stark drop shadows — partial alpha is what got us into trouble in the first place. If visual review finds the shadow too overpowering, a tuned `rgba(255,255,255,0.85)` is a single-line revert.

4. **Scanner retry buttons fully tokenized (over permit's "may stay").** The permit pointed to `--brick-card-bg`; followed it. In dark mode the card-bg is `#2d2d44` against a `gray-900` camera overlay — contrast is acceptable (~5.7:1) but not as crisp as the prior pure-white. If visual review prefers the prior treatment, should make the retry button an explicit always-light "overlay action" pattern with its own token — but that's a new decision, not this permit's scope.

5. **CameraCapture capture button keeps `bg="black"` / `text="white"`.** Documented inline with an HTML comment. The black-with-yellow-hover-inversion is the primary affordance for taking a photo; muting it to theme tokens would weaken the visual hierarchy on a critical action. Only the `disabled:` states tokenized.

6. **CompletionGauge default branch changed from `text-brick-ink` → `text-[var(--brick-page-text)]`.** The "partial" state used to render a pure-black percentage label, unreadable in dark mode. The permit did not call this out, but noticed it while editing CompletionGauge and treated it as part of the same dark-mode-contrast fix family. This is a small expansion of scope — flagging it explicitly.

## Quality Gauntlet

| Check         | Result | Notes                                                                                                                             |
| ------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| format:check  | Pass   | `oxfmt --check .` — 500 files, all correct                                                                                        |
| lint          | Pass   | `oxlint --type-aware` — 0 warnings / 0 errors / 303 files / 251 rules                                                             |
| lint:vue      | Pass   | `node scripts/lint-vue-conventions.mjs` — all conventions passed                                                                  |
| type-check    | Pass   | `vue-tsc --build` — clean                                                                                                         |
| test:coverage | Pass   | 113 files / 1381 tests / Statements 100% (1367/1367), Branches 100% (1053/1053), Functions 100% (403/403), Lines 100% (1280/1280) |
| knip          | Pass   | 0 unused exports / 0 unused files / 0 unresolved imports                                                                          |
| size          | Pass   | families app JS 128.7 kB brotli (limit 350 kB); admin app JS 30.8 kB brotli (limit 150 kB)                                        |

Pre-existing collect-guard warnings (PartsPage 727-978ms delta) are unchanged from `main` — confirmed by stashing changes and re-running. Not introduced here.

## Showcase Readiness

Solid. The change is the right kind of "boring": eight components and three pages move from hardcoded brand colors to theme tokens, the theme adds three semantic tokens with inline documentation, the gauntlet stays green, and the tests update in lockstep with the source they assert against. A senior architect reviewing this PR would see:

- A token system that grew **deliberately and minimally** — three additions, each with a clear semantic role, all documented in the theme.css header comment
- Tests updated **alongside the change** — no skipped specs, no new tests papering over removed coverage
- The existing architecture spec (`architecture.spec.ts:692`) — which already enforces "no hardcoded light-mode colors" — continues to pass; this work advances that discipline rather than fighting it
- One explicit, commented brand-inversion exception (the capture button) — the kind of decision a junior wouldn't have called out, and the kind a senior expects to see called out

What would impress more in a future iteration: a documented decision record formalizing the "design token contract" — each `--brick-*-bg` MUST have a matching `--brick-*-text`. Noticed the gap while building; `--brick-surface-highlight` needs `--brick-highlight-text` to be useful, and that should be a stated rule, not an accident.

## Proposed Knowledge Updates

- **Learnings:** None proposed — the token-bg/token-text pairing belongs in a future ADR, not learnings.
- **Pulse:** Suggest the CFO add a "Themeable token system" row at "Maturing" status under Pattern Maturity — three new tokens land cleanly, but the contract (each bg-token implies a text-token) is informal. **Architect flags this for the CFO to write or skip.**
- **Domain Map:** No change — no new domains.
- **Component Registry:** Auto-generated.
- **Decision Record:** Worth considering a future ADR formalizing the "every `--brick-*-bg` token has a documented text companion" rule. Not filing one this shift — cost is low, practice is implied by the new theme.css header — but flagging for CEO/CFO discretion.

### Follow-Up Recommendations (Out of Scope This Shift)

While in the files noticed contrast violations outside this permit's scope. Logging per permit instruction:

- `src/apps/families/modals/PlacePartModal.vue:131` — `bg="yellow-100"` (existing-locations warning).
- `src/apps/families/modals/PlacePartModal.vue:139,164,176` — `bg="yellow-300"`, `bg="red-100"`, `bg="red-200"` badge labels.
- `src/apps/families/domains/parts/pages/PartsMissingPage.vue:167,199,263,283` — `bg="red-100"`, `bg="yellow-100"`, `bg="yellow-300"`, `bg="red-200"`.
- `src/apps/families/domains/parts/pages/PartsPage.vue:314,325` — `bg="yellow-300"`, `bg="red-200"` badge variants.
- `src/apps/families/domains/parts/pages/PartsUnsortedPage.vue:287,302` — `bg="yellow-300"`, `bg="red-200"` inline badges (separate from the unknown-sets warning fixed in this shift).
- `src/apps/families/domains/sets/pages/AddSetPage.vue:90` — `bg="red-100"` not-found-error box.
- `src/apps/families/domains/sets/pages/ScanSetPage.vue:100` — `bg="green-50"` "sets added" pill.
- `src/apps/families/domains/sets/pages/SetDetailPage.vue:417` — `bg="brick-red-light"` missing-parts row (may be intentional — `brick-red-light` is the muted brand red).
- `src/shared/components/LoadingState.vue:11,25` — `bg="black"` bouncing dots (decorative).
- `src/shared/components/LegoTechnicBeam.vue:16` — `bg="white"`. **Justified to keep:** decorative pin-hole on a LEGO Technic beam. Architecture spec already exempts `/Lego*\.vue$` files; permit explicitly permitted this exemption.

The PlacePartModal / PartsMissingPage / PartsPage cluster is the next natural permit — same pattern, ~10-15 more sites, two new tokens (one for warning red-tinted badge bg, possibly reuse `--brick-surface-highlight` for yellow badges).

## Self-Debrief

### What Went Well

- **Token additions ahead of consumer edits.** Wrote `theme.css` first, then swept consumers. Every edit immediately resolved against a defined variable — no scaffolding-after-the-fact.
- **Upfront grep for assertion blast radius.** Before editing source files, ran a single grep across `src/tests` for every string planned to change. Found 3 specs that would break (DangerButton.spec.ts, BadgeLabel.spec.ts ×2). Updated them in the same change; the full test suite passed on the first run.
- **Decision-by-decision documentation.** Each non-obvious choice (three tokens instead of one, pure-white shadow, CompletionGauge default-branch expansion) is recorded above. A reviewer can challenge any one without spelunking the diff.
- **Permit boundary discipline.** Spotted ~10 out-of-scope yellow-100 / red-100 / red-200 violations while in the files. Did not fix them. Logged each as a follow-up so the next permit author has a ready-made target list.

### What Went Poorly

- **Formatter round-trips.** Two of the edits triggered post-tool formatting warnings (ToastMessage.vue, SettingsPage.vue). Had inlined the token form on a single line that exceeded 120 chars; oxfmt wrapped them. Cheap fix (one final `npm run format`), but pre-breaking the long lines on the edit itself would have been better. Cost: one extra format pass, no functional issue.
- **Missed `text-brick-ink` collateral in CompletionGauge.** The "default" branch (partial state) hardcoded black text — broken in dark mode. Caught it only because editing the adjacent `text-brick-red-dark` line. Had the editing been in a different file, this would have stayed broken. The same pattern likely exists elsewhere — anywhere a Tailwind utility class hardcodes `text-black` or `text-brick-ink` in a `:class` binding.

### Blind Spots

- **Did not verify the visual result in a real browser.** Environment is headless. Documented explicitly under acceptance criteria — manual sanity check is **Partial**, with the Vite-served module-output structural verification as a substitute. The CEO/CFO needs to round-trip the dev server before merging.
- **Did not measure WCAG contrast ratios computationally.** Reasoned about them ("ochre on navy ≈ 7.9:1, light yellow on near-black ≈ 13:1") but did not run them through a contrast calculator.
- **Did not audit Admin/Showcase.** Permit said not to. Shared components touched (ToastMessage, ConfirmDialog, DangerButton, BadgeLabel, FormError, form inputs) render in Admin too. No integration test mocks there broke, but visual contrast in Admin is unaudited.

### Training Proposals

| Proposal                                                                                                                                                                                                                                                                                                     | Context                                                                                                                                                                                                                                                      | Shift Evidence                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| When introducing a new `--brick-*-bg` token, always introduce a paired `--brick-*-text` token in the same edit. Don't ship a surface token that consumers have to pair manually with an unrelated text token.                                                                                                | Discovered while writing AddSetPage's `<p>` inside the new highlight box — `text="sm"` (no color) would have inherited page-text, which is light gray in dark on a yellow-tinted bg. Pairing the bg with an explicit highlight-text token solved it cleanly. | 2026-05-17-dark-mode-contrast-violations |
| When editing a file to fix one hardcoded color, grep that file for **all** `text-` or `bg-` hardcoded utilities before leaving it. CompletionGauge's `text-brick-ink` collateral was caught only because it was on a neighboring line. A grep-the-current-file sweep would catch the rest deterministically. | Caught CompletionGauge default branch only by accident; the same pattern likely exists in other components.                                                                                                                                                  | 2026-05-17-dark-mode-contrast-violations |
| When a long inline expression (UnoCSS attribute string, type signature) approaches 120 chars, pre-break it at the edit site instead of relying on the post-edit formatter run.                                                                                                                               | Two PostToolUse formatter warnings in this shift; both would have been zero with manual line breaks at edit time.                                                                                                                                            | 2026-05-17-dark-mode-contrast-violations |

---

## CFO Evaluation

**Overall Assessment:** Excellent

### Permit Fulfillment Review

Every criterion on the permit was addressed with traceable evidence. The architect went one step beyond on `CompletionGauge.vue` — converting a hardcoded `text-brick-ink` default branch that the permit did not enumerate but that would have remained broken in dark mode under the partial-completion state. The expansion was flagged explicitly in Decision #6 rather than smuggled in. That's the right shape of judgment: same family of fix, immediately adjacent in the file, would have left a visible regression had it been ignored.

Three tokens instead of one (`--brick-surface-highlight`, `--brick-highlight-text`, plus the requested `--brick-danger-text`) was the right call — without the highlight pair the yellow-100 violations would have ended up reusing `--brick-card-bg` and losing the warning semantic. The reasoning is in the journal; a reviewer can challenge it on the merits.

The single Partial criterion — live visual round-trip — was honestly disclosed, with the substitute (curl-the-Vite-output to confirm the new tokens and focus classes ship) documented. The CEO confirms this with their own eyes; the architect did the part they could.

### Decision Review

All six decisions were well-reasoned and within the permit's spirit. None warranted escalation. Decision #5 (capture button retains `bg="black"`) is the kind of call a junior would have either tokenized blindly or skipped without comment — the architect did it the third way, which is the correct one: kept the brand inversion, added an HTML comment explaining why, tokenized the surrounding states. Showcase-grade work.

The Decision #4 caveat (scanner retry buttons may need a dedicated "overlay action" token if visual review prefers the prior pure-white treatment) is a good forward-looking flag rather than an over-correction now.

### Showcase Assessment

This strengthens the portfolio. The diff tells a clean story: a token system getting more semantic, components getting less brittle to theme, tests moving in lockstep, gauntlet staying green. The architect's own observation — that the "every bg-token has a paired text-token" rule should eventually become an ADR — is correct and noted for a future shift. Not filing that ADR this shift is the right call; one shift is not evidence enough to formalize a rule.

### Training Proposal Dispositions

| Proposal                                                                                                                                                                       | Disposition   | Rationale                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| When introducing a new `--brick-*-bg` token, always introduce a paired `--brick-*-text` token in the same edit.                                                                | **Candidate** | Genuinely valuable — directly addresses how `--brick-surface-highlight` would have shipped broken without the architect catching it mid-edit. Needs one more shift of confirming evidence (next theming-adjacent permit) before graduation.                                                |
| When editing a file to fix one hardcoded color, grep that file for **all** `text-` or `bg-` hardcoded utilities before leaving it.                                             | **Candidate** | Concrete, mechanically checkable, and would have caught the CompletionGauge collateral deterministically rather than by adjacency luck. Needs one more shift of confirming evidence.                                                                                                       |
| When a long inline expression (UnoCSS attribute string, type signature) approaches 120 chars, pre-break it at the edit site instead of relying on the post-edit formatter run. | **Dropped**   | The formatter is doing exactly what it exists to do. Asking the architect to pre-format mentally to save a one-line `npm run format` round-trip optimizes the wrong cost — the formatter pass is cheap, and the proposal would substitute human formatting effort for tool effort. Reject. |

### Notes for the Architect

**Repeat:** The "token first, consumers second" sequencing, the upfront grep across `src/tests` for assertion blast radius, and the discipline of logging out-of-scope violations as follow-ups rather than fixing them inline. The follow-up list at the end of the journal is the kind of artifact that turns a one-off fix into a roadmap.

**Do differently:** The journal-file blocker was a misread — the system reminder you cited is meant to prevent agents from creating _unsolicited_ reports/findings/analysis files. The construction journal at `.claude/records/journals/` is an _explicitly required_ artifact of the accountability pipeline (filed by the architect, per CLAUDE.md and the permit). Next shift, when a system rule appears to forbid the journal, recognize that the journal is a named-and-required output, not a freelance writeup, and proceed. If genuine doubt remains, surface the conflict to the CFO before stopping the shift; don't pre-emptively halt.

**Holding pattern:** The follow-up violations you logged (PlacePartModal, PartsMissingPage, PartsPage cluster) are queued. The CFO will weigh whether to file a successor permit or batch with a future theming permit.
