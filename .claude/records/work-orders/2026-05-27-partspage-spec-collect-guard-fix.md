# Work Order: PartsPage.spec.ts collect-guard violation fix

**Work Order #:** 2026-05-27-partspage-spec-collect-guard-fix
**Filed:** 2026-05-27
**Issued By:** The Steward
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `partspage-spec-collect-guard-fix`

---

## The Job

`PartsPage.spec.ts` breached the 1000ms collect-duration threshold under 2x coverage mode (measured 1713ms delta on 2026-05-20). This is an ADR-0012 violation, not a warning. Bring the collect delta back below threshold by trimming the top-level import chain or restructuring the spec.

## Scope

### In the Box

- File: `frontend/src/tests/unit/apps/families/domains/parts/pages/PartsPage.spec.ts`
- Root cause (per Casebook + Pulse): 7 components imported at the top of the spec — `PartUsageModal`, `EmptyState`, `FilterChip`, `TextInput`, `PageHeader`, `PartListItem`, `PrimaryButton`. The mock chain when the spec collects is the cost driver.
- Bring collect delta below 1000ms in 2x coverage mode. The acceptable approach space (Brickwright picks):
  - Lazy-import the heavy components inside the test factory / `beforeEach` rather than module top-level
  - Stub the components by name in `shallowMount` rather than importing them
  - Move PartUsageModal-specific tests to a sibling spec if the modal is the largest single contributor
  - Split the spec into `PartsPage.spec.ts` + `PartsPageUsageModal.spec.ts` if that's the cleanest separation
- Re-measure with `npm run test:coverage` and capture the new collect delta value in the Build Record's Quality Gauntlet table.

### Not in This Set

- No production-code edits to `PartsPage.vue` or the imported components. This is a test-architecture fix; the components themselves are not the violator.
- No threshold edits to `vitest.config.ts` or the test-guard reporter. The fix is to the spec, not to the gauge.
- No bundling with the `SetsOverviewPage` or `ComponentGallery` fixes — those are sibling WOs filed today and should ship as separate PRs (each branch slug must match its own WO per ADR-0028).
- No changes to `PartsMissingPage` or `PartsUnsortedPage` specs unless they share a violating import chain (verify only; don't touch unless required).

## Acceptance Criteria

- [ ] `PartsPage.spec.ts` collect delta < 1000ms under 2x coverage mode (`npm run test:coverage`), measured and recorded in the Build Record.
- [ ] All `PartsPage` tests still green (assertion count and coverage unchanged or improved).
- [ ] Frontend pre-push gauntlet green (`type-check → knip → test:coverage → build`).
- [ ] Build Record records the chosen approach (which of the 4 acceptable approach-space options was picked) and the resulting delta number.
- [ ] Casebook Standing Suspicion row for `PartsPage.spec.ts collect guard VIOLATION` updated by the Steward post-merge (status → resolved, with the measured delta noted).

## References

- ADR: [`0012` or equivalent test-guard ADR — verify exact number]; Casebook Standing Suspicion (Gallery) for `PartsPage.spec.ts`
- Standup history: Surfaced 2026-05-20 in [`2026-05-20-gallery-pulse-refresh`](../audits/2026-05-20-gallery-pulse-refresh.md). Carried as a Steward AI across **7 standups** (2026-05-20, -25 ×2, -26, -27 ×2) before filing as a WO.
- Pulse: Gallery Wing Active Concerns row (Medium severity)

## Notes from the Issuer

This is the loudest Gallery medium and the longest-carried Steward AI in the firm's recent history. It's filed today as part of a 5-WO residue burndown to clear the slate. The cost of carrying it across 7 standups already weakens the paper trail's "open means actually-open" semantics in the inverse direction; getting it filed and shipped tightens the trail back up.

Sub-threshold (single spec file, well under 20-file / 500-line gate threshold). PrePushPermitGate will not run on this branch — close in the work commit per ADR-0028 Amendment 2026-05-27 (uniform-rule trial doctrine: close post-merge on `main`, always — note that "post-merge close" applies to the WO file's Status field; the gate not firing on a sub-threshold push doesn't change the convention).

---

**Status:** Open
**Build Record:** _to be filled when filed_
