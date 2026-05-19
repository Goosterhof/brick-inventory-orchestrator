# Building Permit: fs-theme Integration

**Permit #:** 2026-04-01-fs-theme-integration
**Filed:** 2026-04-01
**Issued By:** General
**Assigned To:** Lead Brick Architect
**Priority:** When-convenient

---

## The Job

Install and wire `@script-development/fs-theme` into the Families app, giving users dark/light mode toggling with localStorage persistence. This is the first territory to consume fs-theme — the package was just published to npm.

## Scope

### In the Box

1. **Install the package** — `npm install @script-development/fs-theme` in the frontend workspace.

2. **Create the service instance** — Add `src/apps/families/services/theme.ts` following the established pattern:

    ```ts
    import {createThemeService} from '@script-development/fs-theme';
    import {familyStorageService} from './storage';

    export const familyThemeService = createThemeService(familyStorageService);
    ```

    The `familyStorageService` (fs-storage) satisfies fs-theme's `ThemeStorageContract` — no adapter needed. Theme will be stored under the key `families:theme` in localStorage.

3. **Export from service barrel** — Add `familyThemeService` to `src/apps/families/services/index.ts`.

4. **Add a theme toggle to the Settings page** — `src/apps/families/domains/settings/pages/SettingsPage.vue` is the natural home. Add a toggle control (button or switch) that calls `familyThemeService.toggleTheme()` and reflects `isDark` state. Use the neo-brutalist design system (brick-border, brick-shadow, etc.).

5. **Add CSS custom properties for dark mode** — Create dark theme overrides using the `[data-theme="light"]` selector (dark is the default when no attribute is present — this matches the package's DOM strategy). The brand colors that need dark variants: Brick Surface (background), Brick Ink (text), and any intermediate grays. The core brand colors (Yellow, Red, Blue, Green) should remain constant across themes.

6. **Add translations** — Add theme-related translation keys to `src/apps/families/services/translation.ts` for both English and Dutch locales (e.g., "Dark mode" / "Donkere modus", "Light mode" / "Lichte modus").

7. **Unit tests** — Test the theme service instance creation and the Settings page toggle interaction. Follow existing patterns in the test suite.

8. **Integration test** — If a Settings page integration test exists, extend it to cover the theme toggle. If not, create one following the mock-server pattern.

### Not in This Set

- Admin app or Showcase app theme integration — separate permits if needed
- Custom theme beyond dark/light (e.g., "high contrast", "LEGO classic")
- System preference change listener (watching for OS-level theme switches at runtime)
- Backend persistence of theme preference — localStorage is sufficient for a personal-domain app

## Acceptance Criteria

- [ ] `@script-development/fs-theme` is installed and importable
- [ ] `familyThemeService` is created using `familyStorageService` (no separate storage instance)
- [ ] Theme toggle is accessible on the Settings page
- [ ] Toggling switches between dark and light mode visually
- [ ] Theme preference persists across page reloads (stored in localStorage under `families:theme`)
- [ ] Dark mode respects the neo-brutalist design system — brick borders, shadows, and brand colors remain recognizable
- [ ] All existing tests still pass (no regressions from CSS changes)
- [ ] New tests cover the theme toggle interaction
- [ ] Full quality gauntlet passes: `npm run type-check && npm run knip && npm run test:coverage && npm run build`

## References

- Package: `@script-development/fs-theme@0.1.0` on npm
- Package source: `fs-packages/packages/theme/` (Armory)
- PR: script-development/fs-packages#5
- Precedent: `fs-storage-migration` permit (2026-03-31) — same install + wire pattern
- Design system: BIO frontend CLAUDE.md "The Style Guide" section

## Notes from the Issuer

The fs-theme package uses a simple DOM strategy: dark mode = no `data-theme` attribute (default), light mode = `data-theme="light"`. This means the existing BIO styles are already the dark theme baseline if you choose dark-first. Alternatively, if the current bright neo-brutalist palette should remain the default experience, invert the convention: treat the current styles as light mode and build dark overrides on `[data-theme="light"]` being absent.

The architect should decide which direction feels right for the LEGO aesthetic — the bright yellow/white palette might be more on-brand as the default, with a muted dark mode as the alternative. Either way, the package handles the toggle and persistence; the CSS strategy is the architect's call.

The `ThemeStorageContract` is intentionally a soft link to fs-storage — this is documented in the package's `types.ts`. No need for type assertions or adapters.

---

**Status:** Open
**Journal:** _link to construction journal when filed_
