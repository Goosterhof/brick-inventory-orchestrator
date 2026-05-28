# Work Order: Arch cleanup 4 — Sets domain pages

**Work Order #:** 2026-05-27-arch-cleanup-4-sets-pages
**Filed:** 2026-05-27
**Issued By:** The Steward (per CEO direction 2026-05-27)
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** When-convenient
**Branch slug (for PrePushPermitGate):** `arch-cleanup-4-sets-pages`

---

## The Job

Pay down 5 entries from `LEGACY_CROSS_COMPONENT_IMPORTS` covering the Sets domain page specs (excluding the split-spec `SetsOverview*` entries which stay). Remove unused top-level imports and the allowlist entries.

## Scope

### In the Box

5 specs, 25 imports total:

| # | Spec | Imports to remove |
|---|---|---|
| 1 | `frontend/src/tests/unit/apps/families/domains/sets/pages/AddSetPage.spec.ts` | `DateInput.vue`, `NumberInput.vue`, `PrimaryButton.vue`, `SelectInput.vue`, `TextInput.vue`, `TextareaInput.vue` |
| 2 | `frontend/src/tests/unit/apps/families/domains/sets/pages/EditSetPage.spec.ts` | `ConfirmDialog.vue`, `DangerButton.vue`, `LoadingState.vue`, `NumberInput.vue`, `PrimaryButton.vue`, `SelectInput.vue` |
| 3 | `frontend/src/tests/unit/apps/families/domains/sets/pages/IdentifyBrickPage.spec.ts` | `BackButton.vue`, `CameraCapture.vue`, `PageHeader.vue`, `PrimaryButton.vue` |
| 4 | `frontend/src/tests/unit/apps/families/domains/sets/pages/ScanSetPage.spec.ts` | `BackButton.vue`, `BarcodeScanner.vue`, `PageHeader.vue`, `PrimaryButton.vue` |
| 5 | `frontend/src/tests/unit/apps/families/domains/sets/pages/SetDetailPage.spec.ts` | `BackButton.vue`, `LoadingState.vue`, `PartListItem.vue`, `PlacePartModal.vue`, `PrimaryButton.vue` |

For each spec:

1. Remove the matching top-level `.vue` imports.
2. Confirm `findComponent({name: 'X'})` calls + `vi.mock(...)` stubs still pass.
3. Remove the spec's entry from `LEGACY_CROSS_COMPONENT_IMPORTS`.

### Not in This Set

- `SetsOverviewFiltering.spec.ts` / `SetsOverviewTheme.spec.ts` (split-spec — stable).
- Any spec outside the Sets domain (other domain pages are in sibling cleanup WOs).
- Architecture test rule-logic changes.

## Acceptance Criteria

- [ ] All 5 specs have their top-level imports removed (25 total).
- [ ] All 5 allowlist entries removed.
- [ ] `npm run test:coverage` green; 100% coverage maintained.
- [ ] Architecture test green.
- [ ] Frontend pre-push gauntlet green.
- [ ] Build Record records: collect-delta before/after on AddSetPage and EditSetPage (the heaviest in this batch — 6 imports each); any non-trivial findings.

## References

- Parent arch test: PR [#127](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/127)
- ADR-0012
- Sibling cleanup WOs (1, 2, 3, 5, 6)

## Notes from the Issuer

Fourth in the 6-WO sibling sequence. Sets-domain specs are heavier than showcase specs because they touch form inputs (Date/Number/Select/Text/Textarea) which pull translation + validation chains. Larger collect-delta payoff per spec.

`IdentifyBrickPage` and `ScanSetPage` both reference camera/barcode hardware components (`CameraCapture.vue`, `BarcodeScanner.vue`) that might carry transitive `@phosphor-icons/vue` traversal. Worth measuring collect-delta on those to validate the hypothesis.

Sub-threshold push; close in post-merge commit per ADR-0028 uniform-rule.

---

**Status:** Open
**Build Record:** _to be filled when filed_
