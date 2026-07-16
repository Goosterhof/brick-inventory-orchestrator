# Work Order: Arch cleanup 5 — Storage pages + modals

**Work Order #:** 2026-05-27-arch-cleanup-5-storage-pages-and-modals
**Filed:** 2026-05-27
**Issued By:** The Steward (per CEO direction 2026-05-27)
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** When-convenient
**Branch slug (for PrePushPermitGate):** `arch-cleanup-5-storage-pages-and-modals`

---

## The Job

Pay down 5 entries from `LEGACY_CROSS_COMPONENT_IMPORTS` covering the Storage domain page specs plus the `PlacePartModal` modal spec. Remove unused top-level imports and the allowlist entries.

## Scope

### In the Box

5 specs, 26 imports total:

| # | Spec | Imports to remove |
|---|---|---|
| 1 | `frontend/src/tests/unit/apps/families/domains/storage/pages/AddStoragePage.spec.ts` | `NumberInput.vue`, `PrimaryButton.vue`, `TextInput.vue`, `TextareaInput.vue` |
| 2 | `frontend/src/tests/unit/apps/families/domains/storage/pages/EditStoragePage.spec.ts` | `ConfirmDialog.vue`, `DangerButton.vue`, `LoadingState.vue`, `NumberInput.vue`, `PrimaryButton.vue`, `TextInput.vue`, `TextareaInput.vue` |
| 3 | `frontend/src/tests/unit/apps/families/domains/storage/pages/StorageDetailPage.spec.ts` | `BackButton.vue`, `DetailRow.vue`, `EmptyState.vue`, `LoadingState.vue`, `PartListItem.vue`, `PrimaryButton.vue` |
| 4 | `frontend/src/tests/unit/apps/families/domains/storage/pages/StorageOverviewPage.spec.ts` | `EmptyState.vue`, `ListItemButton.vue`, `PageHeader.vue`, `PrimaryButton.vue`, `TextInput.vue` |
| 5 | `frontend/src/tests/unit/apps/families/modals/PlacePartModal.spec.ts` | `ModalDialog.vue`, `NumberInput.vue`, `PrimaryButton.vue`, `SelectInput.vue` |

For each spec:

1. Remove the matching top-level `.vue` imports.
2. Confirm `findComponent({name: 'X'})` calls + `vi.mock(...)` stubs still pass.
3. Remove the spec's entry from `LEGACY_CROSS_COMPONENT_IMPORTS`.

### Not in This Set

- Any spec outside the Storage domain or the listed modal.
- The other modal spec `PartUsageModal.spec.ts` (lives in the parts cleanup WO).
- Architecture test rule-logic changes.

## Acceptance Criteria

- [ ] All 5 specs have their top-level imports removed (26 total).
- [ ] All 5 allowlist entries removed.
- [ ] `npm run test:coverage` green; 100% coverage maintained.
- [ ] Architecture test green.
- [ ] Frontend pre-push gauntlet green.
- [ ] Build Record records: collect-delta before/after on `EditStoragePage` (the heaviest at 7 imports) and `StorageDetailPage` (6 imports); any non-trivial findings.

## References

- Parent arch test: PR [#127](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/127)
- ADR-0012
- Sibling cleanup WOs (1, 2, 3, 4, 6)

## Notes from the Issuer

Fifth in the 6-WO sibling sequence. Storage forms have the same form-input-import shape as Sets pages (NumberInput/TextInput/TextareaInput/SelectInput). `PlacePartModal` is included here rather than with the parts-pages batch because the modal mounts in storage flows.

Sub-threshold push; close in post-merge commit per ADR-0028 uniform-rule.

---

**Status:** Migrated to Kendo — BIO-0005 (2026-07-16). File frozen as archive; live tracking on the board.
**Build Record:** _superseded — closure is recorded on the Kendo issue_
