# Building Permit: fs-toast Migration

**Permit #:** 2026-04-02-fs-toast-migration
**Filed:** 2026-04-02
**Issued By:** General
**Assigned To:** Lead Brick Architect
**Priority:** When-convenient

---

## The Job

Replace the local `toast.ts` shared service with `@script-development/fs-toast`. The package was extracted verbatim from this file — the API is identical. This is a dependency swap, not a rewrite.

## Scope

### In the Box

1. **Install the package** — `npm install @script-development/fs-toast` in the frontend workspace.

2. **Replace imports in consuming files** — 3 files import from `@shared/services/toast`:

    **`src/apps/families/domains/sets/pages/ScanSetPage.vue`** (line 12):

    ```ts
    // Before
    import {createToastService} from '@shared/services/toast';

    // After
    import {createToastService} from '@script-development/fs-toast';
    ```

    **`src/apps/showcase/components/ToastServiceDemo.vue`** (line 4):

    ```ts
    // Before
    import {createToastService} from '@shared/services/toast';

    // After
    import {createToastService} from '@script-development/fs-toast';
    ```

    **`src/tests/unit/shared/services/toast.spec.ts`** (line 1):

    ```ts
    // Before
    import {createToastService} from '@shared/services/toast';

    // After
    import {createToastService} from '@script-development/fs-toast';
    ```

3. **Remove the local service file** — Once all imports are migrated:
    - Delete `src/shared/services/toast.ts`

4. **Delete the local unit tests** — The package has 15 tests with 100% coverage. These are now the package's responsibility:
    - Delete `src/tests/unit/shared/services/toast.spec.ts`

    The `ToastServiceDemo.spec.ts` stays — it tests the showcase component, not the service.

5. **Run knip** — Verify no dead exports remain after removing the local file.

### Not in This Set

- The `ToastMessage.vue` component — territory-sovereign, stays in `src/shared/components/`
- The `ToastServiceDemo.vue` showcase component and its tests — stays as-is (import path update only)
- Admin app toast integration — no current toast usage there
- Any toast behavior changes — this is a pure dependency swap

## Acceptance Criteria

- [ ] `@script-development/fs-toast` is installed and importable
- [ ] `createToastService` and `ToastService` types resolve from the package
- [ ] `ScanSetPage.vue` toast behavior is unchanged (show success/error toasts, FIFO queue)
- [ ] `ToastServiceDemo.vue` showcase works identically
- [ ] Local `toast.ts` is deleted from `src/shared/services/`
- [ ] Local `toast.spec.ts` is deleted from `src/tests/unit/shared/services/`
- [ ] No references to `@shared/services/toast` remain in the codebase
- [ ] `npm run knip` reports no dead exports
- [ ] Full quality gauntlet passes: `npm run type-check && npm run knip && npm run test:coverage && npm run build`

## References

- Package: `@script-development/fs-toast@0.1.0` on npm
- Package source: `fs-packages/packages/toast/` (Armory)
- PR: script-development/fs-packages#9
- Deployment orders: `war-room/orders/fs-packages/fs-toast-extraction-deployment.md`
- Precedent: `fs-loading-migration` permit (2026-04-01) — same swap pattern
- Local source being replaced: `src/shared/services/toast.ts`

## Notes from the Issuer

The simplest migration in the Armory series — the package is a verbatim extraction of `toast.ts`. The `ToastService<C>` interface, the `createToastService<C>()` factory, the `show`/`hide`/`ToastContainerComponent` return shape, the `maxToasts` clamping, the `onClose` prop injection — all identical.

The only potential snag: if `vue-component-type-helpers` version in the package conflicts with the version already in the frontend's lockfile. Both should resolve to `^2.0.0` — if there's a type mismatch on `ComponentProps<C>`, check that the package and frontend agree on the `vue-component-type-helpers` version.

---

**Status:** Open
**Journal:** _link to construction journal when filed_
