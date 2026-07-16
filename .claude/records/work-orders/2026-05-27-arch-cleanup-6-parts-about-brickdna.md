# Work Order: Arch cleanup 6 — Parts pages + AboutPage + BrickDna

**Work Order #:** 2026-05-27-arch-cleanup-6-parts-about-brickdna
**Filed:** 2026-05-27
**Issued By:** The Steward (per CEO direction 2026-05-27)
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** When-convenient
**Branch slug (for PrePushPermitGate):** `arch-cleanup-6-parts-about-brickdna`

---

## The Job

Pay down 5 entries from `LEGACY_CROSS_COMPONENT_IMPORTS` covering the Parts domain pages, the Parts modal, AboutPage, and BrickDnaPage. The heaviest of the 6 sibling cleanup WOs by raw import count — `AboutPage.spec.ts` alone carries 16 imports (the entire Lego shape gallery). Remove unused top-level imports and the allowlist entries.

## Scope

### In the Box

5 specs, 40 imports total:

| # | Spec | Imports to remove |
|---|---|---|
| 1 | `frontend/src/tests/unit/apps/families/domains/about/pages/AboutPage.spec.ts` | `LegoArch.vue`, `LegoArchSvg.vue`, `LegoBrick.vue`, `LegoBrickSvg.vue`, `LegoPlate.vue`, `LegoPlateSvg.vue`, `LegoRound.vue`, `LegoRoundSvg.vue`, `LegoSlope.vue`, `LegoSlopeSvg.vue`, `LegoTechnicBeam.vue`, `LegoTechnicBeamSvg.vue`, `LegoTile.vue`, `LegoTileSvg.vue`, `LegoWedge.vue`, `LegoWedgeSvg.vue` (16 total) |
| 2 | `frontend/src/tests/unit/apps/families/domains/brick-dna/pages/BrickDnaPage.spec.ts` | `CardContainer.vue`, `EmptyState.vue`, `PageHeader.vue`, `SectionDivider.vue`, `StatCard.vue` |
| 3 | `frontend/src/tests/unit/apps/families/domains/parts/modals/PartUsageModal.spec.ts` | `EmptyState.vue`, `ListItemButton.vue`, `ModalDialog.vue` |
| 4 | `frontend/src/tests/unit/apps/families/domains/parts/pages/PartsMissingPage.spec.ts` | `BackButton.vue`, `EmptyState.vue`, `FilterChip.vue`, `PageHeader.vue`, `PartListItem.vue`, `PrimaryButton.vue`, `TextInput.vue` |
| 5 | `frontend/src/tests/unit/apps/families/domains/parts/pages/PartsUnsortedPage.spec.ts` | `BackButton.vue`, `EmptyState.vue`, `FilterChip.vue`, `ListItemButton.vue`, `PageHeader.vue`, `PartListItem.vue`, `PlacePartModal.vue`, `PrimaryButton.vue`, `TextInput.vue` |

For each spec:

1. Remove the matching top-level `.vue` imports.
2. Confirm `findComponent({name: 'X'})` calls + `vi.mock(...)` stubs still pass.
3. Remove the spec's entry from `LEGACY_CROSS_COMPONENT_IMPORTS`.

### Not in This Set

- Any spec not in the table above.
- The `PartsPage.spec.ts` — that one was already cleaned up in PR #119 (the source story for this whole series) and is NOT in the allowlist.
- Architecture test rule-logic changes.

## Acceptance Criteria

- [ ] All 5 specs have their top-level imports removed (40 total).
- [ ] All 5 allowlist entries removed.
- [ ] `npm run test:coverage` green; 100% coverage maintained.
- [ ] Architecture test green.
- [ ] Frontend pre-push gauntlet green.
- [ ] Build Record records: collect-delta before/after on `AboutPage.spec.ts` (16 imports — likely the largest single payoff in the entire cleanup series) AND `PartsUnsortedPage.spec.ts` (9 imports). Any non-trivial findings, especially around the Lego shape import chain on AboutPage which has been flagged in the Casebook since 2026-04-11.

## References

- Parent arch test: PR [#127](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/127)
- ADR-0012
- Sibling cleanup WOs (1, 2, 3, 4, 5)
- Pulse Gallery Active Concerns row: `AboutPage.spec.ts collect guard warning` (Low, monitoring) — this WO should resolve it
- Casebook Standing Suspicion row: `AboutPage.spec.ts collect guard` — first noticed 2026-04-11, root cause `16 named Lego shape component imports at the top of the spec` — this WO directly addresses the root cause

## Notes from the Issuer

Sixth and largest in the 6-WO sibling sequence. **AboutPage's 16 Lego shape imports are the single most impactful cleanup in the entire arch-test discovery** — they've been carried as a known low-severity Casebook entry since 2026-04-11 with the root cause explicitly named. This WO closes that 47-day-old Standing Suspicion.

The `PartsUnsortedPage.spec.ts` at 9 imports is the second-heaviest spec in the cleanup series after AboutPage. Together they account for 25 of the batch's 40 imports.

Sub-threshold push; close in post-merge commit per ADR-0028 uniform-rule.

---

**Status:** Migrated to Kendo — BIO-0006 (2026-07-16). File frozen as archive; live tracking on the board.
**Build Record:** _superseded — closure is recorded on the Kendo issue_
