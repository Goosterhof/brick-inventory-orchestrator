# Building Permit: Dark Mode Contrast Violations

**Permit #:** 2026-05-17-dark-mode-contrast-violations
**Filed:** 2026-05-17
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

CEO reports unreadable text in dark mode. Investigation found the dark theme tokens are sound, but multiple components bypass the token system and hardcode brand colors (`brick-red-dark`, raw Tailwind `yellow-100`/`gray-100`/`white`) that fail against the dark navy page background. Plus the dark-mode `--brick-shadow-color` is set to 15% white opacity, rendering the signature brick shadows nearly invisible.

Fix the worst offenders. No palette redesign — the dark navy (`#1a1a2e`) base stays.

## Scope

### In the Box

- **Error/danger text token.** Introduce a `--brick-danger-text` (or similar) CSS custom property that resolves to `brick-red-dark` (`#9B1510`) in light mode and a lighter red (e.g., `#F8D0CF` or `#F87171`) in dark mode. Replace every `text="brick-red-dark"` / `text-color="brick-red-dark"` / `text="sm brick-red-dark"` use across:
    - `src/shared/components/FormError.vue`
    - `src/shared/components/ToastMessage.vue` (the icon and paragraph both)
    - `src/shared/components/DangerButton.vue`
    - `src/apps/families/domains/settings/pages/SettingsPage.vue` (multiple error paragraphs)
    - `src/apps/families/domains/sets/pages/ScanSetPage.vue`
    - `src/apps/families/domains/sets/pages/SetDetailPage.vue`
    - `src/apps/families/domains/sets/components/CompletionGauge.vue` (`text-brick-red-dark` class binding)
- **Raw Tailwind palette violations.** Tokenize these so they adapt to theme (or pick a defensible per-site replacement):
    - `bg="yellow-100"` in `AddSetPage.vue`, `ScanSetPage.vue`, `PartsUnsortedPage.vue` → use `--brick-surface-subtle` or a new "soft highlight" token
    - `bg="gray-100"` / `bg="gray-200"` in `BadgeLabel.vue` → tokenize
    - `bg="white"` in scanner UI (`BarcodeScanner.vue`, `CameraCapture.vue`) → use `--brick-card-bg`
    - `bg="black"` capture button in `CameraCapture.vue` → tokenize (intentional inversion may be OK; document if so)
    - `disabled:gray-200` in `CameraCapture.vue` → use `--brick-surface-subtle`
- **Brick shadow visibility in dark mode.** Bump `--brick-shadow-color` in `theme.css` `:root` (dark) from `rgba(255, 255, 255, 0.15)` to something visible — pure white or near-pure (`rgba(255, 255, 255, 0.85)` or `#ffffff`). Adjust until the shadows are legible without overpowering.
- **Form input focused-state text contrast.** When form inputs (`TextInput`, `NumberInput`, `DateInput`, `TextareaInput`, `SelectInput`) focus to `bg-brick-yellow`, the text is `var(--brick-page-text)` — light gray in dark mode → low contrast on yellow. Force text to `brick-ink` (black) when the focused yellow background is active, OR tokenize the text color to match.
- **Tests.** Update specs for any text/bg attribute strings that change. Architecture spec at `src/tests/unit/architecture.spec.ts:692` may already catch some of these — if it doesn't catch a class we removed, that's intentional cleanup (no rule loosening). Maintain 100% coverage.
- **Docs.** If a new token is introduced, add it to `theme.css` comments alongside the existing tokens.

### Not in This Set

- Palette redesign (navy stays).
- Brand-identity questions for `PrimaryButton` dark-mode treatment (currently swaps yellow→light-gray; functional, defer to a separate decision if the CEO wants brand fidelity in dark mode).
- WCAG AA audit of every screen — only the called-out violations.
- Admin/Showcase apps (no reported issue; touch only if a shared component change ripples in).
- Dark theme default-vs-light-default policy. Current `data-theme` strategy (dark = no attribute, light = `data-theme="light"`) stays.

## Acceptance Criteria

- [ ] No occurrence of `text="brick-red-dark"`, `text-color="brick-red-dark"`, `text="sm brick-red-dark"`, or `text-brick-red-dark` class binding remains in `src/shared` or `src/apps/families` (grep verifies).
- [ ] No occurrence of `bg="yellow-100"`, `bg="gray-100"`, `bg="gray-200"`, `bg="white"`, `bg="black"`, `disabled:gray-200` remains in the files listed above (decorative `LegoTechnicBeam.vue` may keep `bg="white"` if justified in the journal — that's a LEGO pin, not chrome).
- [ ] In dark mode, brick shadows on cards, buttons, and inputs are clearly visible against the navy bg.
- [ ] In dark mode, focused form inputs show readable text against the yellow focus bg.
- [ ] `npm run lint`, `npm run type-check`, `npm run test:coverage` (100%), `npm run build` all pass — the pre-push gauntlet.
- [ ] Manual sanity check: dark mode is on by default — load the dev server, toggle to light, toggle back, verify error messages, badges, scan flow, settings errors are all readable.

## References

- ADR Decision Log: `.claude/docs/decisions.md` — check for prior theming decisions (especially around hardcoded vs. tokenized colors).
- Architecture test: `src/tests/unit/architecture.spec.ts:692` — existing rule against hardcoded colors; this fix advances the discipline.
- Theme source: `src/shared/assets/theme.css`
- Theme service: `src/apps/families/services/theme.ts` (uses `@script-development/fs-theme`)

## Notes from the Issuer

CEO selected "worst offenders only" and "keep navy, fix violations" from a 2x2 scope matrix. Don't expand. If you discover a contrast violation that's worse than the called-out list but outside scope, log it in the journal as a follow-up recommendation — don't fix it on this permit.

Environment note: Node v22 is installed but the gauntlet requires 24+. `node_modules` is missing. Architect: ensure `nvm install 24 && nvm use 24 && npm install` runs cleanly before any commits.

The branch is already named `claude/fix-dark-mode-contrast-cvPUo` and is the current working branch. Push there.

---

**Status:** Complete
**Journal:** [`.claude/records/journals/2026-05-17-dark-mode-contrast-violations.md`](../journals/2026-05-17-dark-mode-contrast-violations.md)
