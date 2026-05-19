# Building Permit: fs-dialog Migration

**Permit #:** 2026-04-02-fs-dialog-migration
**Filed:** 2026-04-02
**Issued By:** General
**Assigned To:** Lead Brick Architect
**Priority:** When-convenient

---

## The Job

Replace the local `dialog.ts` shared service with `@script-development/fs-dialog`. The package was extracted from this file with two targeted changes: UnoCSS attributes replaced with inline style resets, and Suspense fallback changed from `"Loading..."` to `null`. API is identical.

## Scope

### In the Box

1. **Install the package** — `npm install @script-development/fs-dialog` in the frontend workspace.

2. **Replace the service import** — In `src/apps/families/services/dialog.ts`:

    ```ts
    // Before
    import {createDialogService} from '@shared/services/dialog';

    // After
    import {createDialogService} from '@script-development/fs-dialog';
    ```

    The rest of the file (error middleware registration) stays identical.

3. **Replace the showcase import** — In `src/apps/showcase/components/DialogServiceDemo.vue`:

    ```ts
    // Before
    import {createDialogService} from '@shared/services/dialog';

    // After
    import {createDialogService} from '@script-development/fs-dialog';
    ```

4. **Update any type imports** — Search for `DialogService` or `DialogErrorHandler` type imports from `@shared/services/dialog` and point them to the package.

5. **Remove the local service file** — Once all imports are migrated:
    - Delete `src/shared/services/dialog.ts`

6. **Delete the local unit tests** — The package has 33 tests with 100% coverage:
    - Delete `src/tests/unit/shared/services/dialog.spec.ts`

    The `DialogServiceDemo.spec.ts` stays — it tests the showcase component.

7. **Restore territory styling** — The package uses inline style resets instead of UnoCSS attributes. BIO's dialog components (`ModalDialog.vue`, `ConfirmDialog.vue`) handle their own styling — they render inside the `<dialog>` element, so no visual change expected. However, the backdrop styling (`backdrop:bg-black` UnoCSS class) was on the `<dialog>` element in the old service. You'll need to add equivalent backdrop styling via CSS:

    ```css
    dialog::backdrop {
        background-color: rgba(0, 0, 0, 0.5);
    }
    ```

    Or via UnoCSS on the consumer's dialog content wrapper. Verify backdrop appearance after migration.

8. **Run knip** — Verify no dead exports remain.

### Not in This Set

- `ModalDialog.vue` and `ConfirmDialog.vue` components — territory-sovereign, stay in `src/shared/components/`
- The `DialogServiceDemo.vue` showcase component and its tests — stays (import path update only)
- Sound integration in ConfirmDialog — stays local
- Any dialog behavior changes — this is a dependency swap with one styling caveat (backdrop)

## Acceptance Criteria

- [ ] `@script-development/fs-dialog` is installed and importable
- [ ] `createDialogService` and `DialogService` types resolve from the package
- [ ] `familyDialogService` error middleware still auto-closes on `EntryNotFoundError`
- [ ] Dialog stacking, backdrop click, ESC prevention all work as before
- [ ] Backdrop has dark overlay (verify — this is the one visual change that needs attention)
- [ ] `DialogServiceDemo.vue` showcase works identically
- [ ] Local `dialog.ts` is deleted from `src/shared/services/`
- [ ] Local `dialog.spec.ts` is deleted from `src/tests/unit/shared/services/`
- [ ] No references to `@shared/services/dialog` remain in the codebase
- [ ] `npm run knip` reports no dead exports
- [ ] Full quality gauntlet passes: `npm run type-check && npm run knip && npm run test:coverage && npm run build`

## References

- Package: `@script-development/fs-dialog@0.1.0` on npm
- Package source: `fs-packages/packages/dialog/` (Armory)
- PR: script-development/fs-packages#10
- Deployment orders: `war-room/orders/fs-packages/fs-dialog-extraction-deployment.md`
- Precedent: `fs-toast-migration` permit (2026-04-02) — same swap pattern
- Local source being replaced: `src/shared/services/dialog.ts`

## Notes from the Issuer

The main gotcha is **backdrop styling**. The old service applied `class="backdrop:bg-black"` (UnoCSS) directly on the `<dialog>` element. The package uses only inline style resets — no backdrop class. BIO needs to restore the dark backdrop via CSS (`dialog::backdrop`) or by adding the class in the territory's dialog wrapper. This is the one place where "pure dependency swap" has a visual side effect. Test visually.

The `v-model` prop interception, `closeFrom(index)` LIFO semantics, error middleware chain, body scroll lock, and Suspense wrapping are all functionally identical. The only API difference is `DialogErrorHandler` is now an exported type (was internal in BIO) — no breaking change, just more accessible.

---

**Status:** Open
**Journal:** _link to construction journal when filed_
