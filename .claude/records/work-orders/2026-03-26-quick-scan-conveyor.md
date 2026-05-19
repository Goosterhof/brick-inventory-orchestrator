# Building Permit: The Quick-Scan Conveyor

**Permit #:** 2026-03-26-quick-scan-conveyor
**Filed:** 2026-03-26
**Issued By:** CEO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Keep the barcode scanner camera open after successfully adding a set so collectors can scan multiple boxes in quick succession. Currently the flow is: scan → add → navigate away. The conveyor flow should be: scan → add → toast "Added!" → camera ready for next scan.

## Scope

### In the Box

- Modify `ScanSetPage.vue` to reset state after successful add instead of navigating away
- Success toast showing the added set name and set number
- "Done scanning" button/link to exit the conveyor and return to sets overview
- Running count of sets added this session ("3 sets added")
- Camera stays active (or re-initializes cleanly) between scans
- Handle the `BarcodeScanner.vue` component lifecycle — verify it can reset without remount, or use key-swap

### Not in This Set

- Changes to `BarcodeScanner.vue` shared component internals (if it already supports reset)
- Duplicate detection (that's a separate idea — The Duplicate Detector)
- Batch confirmation (each scan is individually confirmed and added)
- Changes to the add-set API or backend

## Acceptance Criteria

- [ ] After adding a set via barcode, the camera remains active for the next scan
- [ ] Success toast confirms the added set (name + set number)
- [ ] Running session count displayed ("X sets added this session")
- [ ] "Done" button navigates back to sets overview
- [ ] Scanner works reliably across consecutive scans (no camera freeze or permission issues)
- [ ] Error on one scan doesn't kill the conveyor (can retry or scan next)
- [ ] Translations (EN/NL) for new UI text
- [ ] 100% test coverage on new code
- [ ] All quality gates pass

## References

- Feature Brief: `docs/idea-vault.md` — The Quick-Scan Conveyor
- Existing: `ScanSetPage.vue`, `BarcodeScanner.vue`

## Notes from the Issuer

Small piece count. The main risk is the BarcodeScanner component lifecycle — test on a real device if possible. If the shared component can't cleanly reset, a `:key` swap to force remount is an acceptable workaround. The session count is a nice touch for the "unboxing haul" experience but keep it simple — a ref counter, not a persisted list.

---

**Status:** Complete
**Journal:** _link to construction journal when filed_
