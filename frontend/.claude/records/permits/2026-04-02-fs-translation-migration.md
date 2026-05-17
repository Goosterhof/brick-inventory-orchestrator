# Building Permit: fs-translation Migration

**Permit #:** 2026-04-02-fs-translation-migration
**Filed:** 2026-04-02
**Issued By:** General
**Assigned To:** Lead Brick Architect
**Priority:** When-convenient

---

## The Job

Replace the local `translation.ts` shared service with `@script-development/fs-translation`. The package was extracted verbatim from this file — the API is identical. This is a dependency swap, not a rewrite.

## Scope

### In the Box

1. **Install the package** — `npm install @script-development/fs-translation` in the frontend workspace.

2. **Replace the service import** — In `src/apps/families/services/translation.ts`:

    ```ts
    // Before
    import {createTranslationService} from '@shared/services/translation';

    // After
    import {createTranslationService} from '@script-development/fs-translation';
    ```

    The rest of the file (translation dictionaries, `familyTranslationService` creation) stays identical.

3. **Update any type imports** — Search for `TranslationService`, `TranslationSchema`, or `NestedKeys` type imports from `@shared/services/translation` and point them to the package.

4. **Remove the local service file** — Once all imports are migrated:
    - Delete `src/shared/services/translation.ts`

5. **Delete the local unit tests** — The package has 20 tests with 100% coverage:
    - Delete `src/tests/unit/shared/services/translation.spec.ts`

6. **Run knip** — Verify no dead exports remain.

### Not in This Set

- Translation dictionaries (the `en`/`nl` data in `families/services/translation.ts`) — territory-sovereign
- Any translation key changes — this is a pure dependency swap
- Admin or Showcase app translation setup — no current usage there

## Acceptance Criteria

- [ ] `@script-development/fs-translation` is installed and importable
- [ ] `createTranslationService` and `TranslationService` types resolve from the package
- [ ] `familyTranslationService` works identically (`t()` returns `ComputedRef<string>`, locale switching works)
- [ ] Parameter interpolation unchanged (`{field}`, `{count}`, etc.)
- [ ] Local `translation.ts` is deleted from `src/shared/services/`
- [ ] Local `translation.spec.ts` is deleted from `src/tests/unit/shared/services/`
- [ ] No references to `@shared/services/translation` remain in the codebase
- [ ] `npm run knip` reports no dead exports
- [ ] Full quality gauntlet passes: `npm run type-check && npm run knip && npm run test:coverage && npm run build`

## References

- Package: `@script-development/fs-translation@0.1.0` on npm
- Package source: `fs-packages/packages/translation/` (Armory)
- PR: script-development/fs-packages#11
- Deployment orders: `war-room/orders/fs-packages/fs-translation-extraction-deployment.md`
- Precedent: `fs-toast-migration` permit (2026-04-02) — same swap pattern
- Local source being replaced: `src/shared/services/translation.ts`

## Notes from the Issuer

The cleanest migration of the three filed today. The package is a verbatim extraction — `createTranslationService`, `TranslationService<TSchema, TLocale>`, `NestedKeys<TSchema>`, the `t()` method, the `locale` ref, the memoization cache, the `{param}` interpolation — all identical. The only difference is the import path.

The `string-ts` dependency (`replaceAll`) is now bundled in the package — if BIO's `package.json` has `string-ts` as a direct dependency only for the translation service, it can be removed after migration (verify with knip).

---

**Status:** Open
**Journal:** _link to construction journal when filed_
