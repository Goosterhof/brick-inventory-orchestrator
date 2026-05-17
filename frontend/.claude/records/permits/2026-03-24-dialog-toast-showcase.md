# Building Permit: Dialog & Toast Service Showcase Sections

**Permit #:** 2026-03-24-dialog-toast-showcase
**Filed:** 2026-03-24
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Add two new showcase sections demonstrating the DialogService and ToastService — not just the components (already in the Component Gallery), but the **service layer**: programmatic opening, stacking, queuing, and dismissal.

## Scope

### In the Box

- `DialogServiceDemo.vue` — showcase section demonstrating:
    - Programmatic dialog opening via `createDialogService()`
    - Dialog stacking (open a second dialog from within the first)
    - `closeAll()` behavior
    - The service's `DialogContainerComponent` rendering pattern
- `ToastServiceDemo.vue` — showcase section demonstrating:
    - Programmatic toast showing via `createToastService(ToastMessage)`
    - Success and error variants
    - FIFO queue behavior (max limit, oldest removed)
    - Programmatic `hide()` by ID
    - The service's `ToastContainerComponent` rendering pattern
- Update `App.vue` to include both new sections
- Tests for both components at 100% coverage

### Not in This Set

- Changes to the services themselves
- Changes to existing Component Gallery demos (those stay as component-level demos)
- Changes to ModalDialog, ConfirmDialog, or ToastMessage components
- New routing — showcase remains a single-page scroll

## Acceptance Criteria

- [ ] DialogServiceDemo renders and demonstrates programmatic dialog opening, stacking, and closeAll
- [ ] ToastServiceDemo renders and demonstrates programmatic toast showing, queuing, max limit, and hiding
- [ ] Both sections follow the established showcase section pattern (SectionHeading, brick-border demo boxes)
- [ ] App.vue includes both new sections in logical order
- [ ] Full quality gauntlet passes (format, lint, lint:vue, type-check, test:coverage 100%, knip, size)
- [ ] No changes to shared services or components

## References

- Dialog service: `src/shared/services/dialog.ts`
- Toast service: `src/shared/services/toast.ts`
- Existing component demos: `src/apps/showcase/components/ComponentGallery.vue`

## Notes from the Issuer

Section numbers: use 09 and 10. Place them after ComponentHealth in App.vue — they're "advanced patterns" sections that build on the Component Gallery. The showcase is a portfolio piece; these sections should demonstrate that we don't just build components, we build the infrastructure that powers them.

The dialog service uses render functions, `markRaw`, Suspense, and native `<dialog>` API stacking. The toast service uses FIFO queuing with configurable max. These are the patterns that impress in a code review — make sure the demos make them visible and interactive.

---

**Status:** Complete
**Journal:** _pending_
