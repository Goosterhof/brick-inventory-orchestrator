# Building Permit: The Duplicate Detector

**Permit #:** 2026-03-26-duplicate-detector
**Filed:** 2026-03-26
**Issued By:** CEO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Show a warning when a user manually adds a set they already own. Check the local store for a matching set number before submission and display a confirmation — "You already own this set (quantity: X, status: Built). Add another copy?" Pure frontend guard, no backend changes.

## Scope

### In the Box

- Duplicate check in `AddSetPage.vue` against `familySetStoreModule` for matching `setNum`
- Warning banner/message showing existing ownership details (quantity, status)
- User can still proceed (it's a warning, not a block — people own multiple copies)
- Same check in `ScanSetPage.vue` after barcode lookup resolves a set number
- Translations (EN/NL)

### Not in This Set

- Backend duplicate prevention (the API intentionally allows multiple copies)
- Merge/consolidate duplicate entries
- Quantity increment instead of new entry (different UX model)

## Acceptance Criteria

- [ ] When entering a set number that already exists in the family, a warning appears before submission
- [ ] Warning shows the existing set's quantity and status
- [ ] User can dismiss the warning and proceed with adding
- [ ] Warning does not appear for set numbers not in the family
- [ ] Same check works on `ScanSetPage.vue` after barcode resolves
- [ ] Store data is available at check time (fetched on page load or already cached)
- [ ] 100% test coverage on new code
- [ ] All quality gates pass

## References

- Feature Brief: `docs/idea-vault.md` — The Duplicate Detector
- Existing: `AddSetPage.vue`, `ScanSetPage.vue`, `familySetStoreModule`

## Notes from the Issuer

Trivially small. The store already has all family sets loaded. A computed check against `setNum` before form submission is ~15 lines of code. The warning should be informative, not blocking — LEGO collectors legitimately own multiple copies of the same set.

---

**Status:** Complete
**Journal:** _link to construction journal when filed_
