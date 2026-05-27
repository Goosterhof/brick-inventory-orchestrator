# Work Order: SetsOverviewPage.spec.ts split

**Work Order #:** 2026-05-27-setsoverviewpage-spec-split
**Filed:** 2026-05-27
**Issued By:** The Steward
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `setsoverviewpage-spec-split`

---

## The Job

`SetsOverviewPage.spec.ts` is in the TEST GUARD alarming zone — 2397ms execution at 30 tests (measured 2026-05-20), a 2.1× jump from 1143ms on 2026-05-09. Trend: 855ms → 1056ms → 1143ms → 2397ms. The xNOYG `in_storage` enum merge added 6 tests and pushed it past the alarm. Split the spec by concern so each child spec is well under the alarm threshold and the suite stays maintainable.

## Scope

### In the Box

- File: `frontend/src/tests/unit/apps/families/domains/sets/pages/SetsOverviewPage.spec.ts`
- Casebook-recommended split: `SetsOverviewPage.spec.ts` + `SetsOverviewFiltering.spec.ts`. The recommendation predates this WO and stands as the preferred shape unless the Brickwright finds a cleaner cut during the work.
- Each child spec's execution time under 1500ms; combined run time of the two children should not exceed the current monolith run time by more than ~10% (some duplication of setup is expected and acceptable).
- Re-measure both child specs with `npm run test:coverage` and record numbers in the Build Record.

### Not in This Set

- No edits to `SetsOverviewPage.vue` or any underlying production code.
- No edits to `SetsOverviewTheme.spec.ts` (already a sibling, presumed unaffected).
- No changes to the test-guard reporter or thresholds.
- No bundling with the `PartsPage` or `ComponentGallery` fixes.
- The integration counterpart at `frontend/src/tests/integration/apps/families/domains/sets/pages/SetsOverviewPage.spec.ts` is out of scope unless the unit-spec split forces an integration-spec rename (which it should not — they're in different test-tree roots).

## Acceptance Criteria

- [ ] `SetsOverviewPage.spec.ts` execution time < 1500ms (out of TEST GUARD alarm zone) under `npm run test:coverage`.
- [ ] `SetsOverviewFiltering.spec.ts` (or the chosen split-name) execution time < 1500ms.
- [ ] No test loss: assertion count in the two child specs equals or exceeds the original monolith's assertion count.
- [ ] Frontend pre-push gauntlet green.
- [ ] Build Record records the split shape, the rationale for any deviation from the Casebook-recommended cut, and the measured execution times for both children.
- [ ] Casebook Standing Suspicion row for `SetsOverviewPage.spec.ts slow` updated by the Steward post-merge.

## References

- Casebook (Gallery) Standing Suspicion: `SetsOverviewPage.spec.ts slow` — explicit recommendation to split filed 2026-05-20.
- Standup history: Surfaced 2026-04-25 (warning zone), escalated 2026-05-20 (alarming). Carried as a Steward AI across 7 standups.
- Pulse: Gallery Wing Active Concerns row (Medium severity).

## Notes from the Issuer

The Casebook recommendation has been on file for 7 standups — the Warden was right to flag it early. Splitting now also frontloads the architectural shape before any further filter merges add more tests to the monolith.

Sub-threshold push. Same ADR-0028 uniform-rule convention as the sibling WOs filed today.

---

**Status:** Completed (closed 2026-05-27 post-merge per ADR-0028 uniform-rule)
**Build Record:** [`2026-05-27-setsoverviewpage-spec-split`](../build-records/2026-05-27-setsoverviewpage-spec-split.md) — shipped in PR #120 (commit `9f6b8b4`)
