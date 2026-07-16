# Work Order: Arch cleanup sweep — bundle WOs 1-6

**Work Order #:** 2026-05-28-arch-cleanup-sweep
**Filed:** 2026-05-28
**Issued By:** The Steward (per CEO direction 2026-05-28 — "let's pick up the next bundle, arch cleanup 1-6 sweep")
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** When-convenient (inherits from sibling priority)
**Branch slug (for PrePushPermitGate):** `arch-cleanup-sweep`

---

## The Job

Execute all six 2026-05-27 arch-cleanup sibling WOs in one bundled sweep. Each sibling WO defines a specific batch of specs in `frontend/src/tests/unit/`; together they pay down all 33 entries in `LEGACY_CROSS_COMPONENT_IMPORTS` (excluding the 6 split-spec entries which are intentional and stable). The umbrella exists to satisfy ADR-0028 PrePushPermitGate slug match — bundle scope (34 files) is above the 20-file threshold, so a single branch with a slug matching a single WO is required.

## Scope

### In the Box

**All scope from sibling WOs, executed in one branch:**

- [`2026-05-27-arch-cleanup-1-showcase-section-heading-singles`](./2026-05-27-arch-cleanup-1-showcase-section-heading-singles.md) — 7 showcase SectionHeading-only specs (7 imports)
- [`2026-05-27-arch-cleanup-2-showcase-multi-and-shared`](./2026-05-27-arch-cleanup-2-showcase-multi-and-shared.md) — 6 showcase multi + 2 shared specs (17 imports)
- [`2026-05-27-arch-cleanup-3-app-shells-and-auth`](./2026-05-27-arch-cleanup-3-app-shells-and-auth.md) — 5 app-shell + auth + home specs (13 imports)
- [`2026-05-27-arch-cleanup-4-sets-pages`](./2026-05-27-arch-cleanup-4-sets-pages.md) — 5 Sets domain page specs (25 imports)
- [`2026-05-27-arch-cleanup-5-storage-pages-and-modals`](./2026-05-27-arch-cleanup-5-storage-pages-and-modals.md) — 5 Storage page + modal specs (26 imports)
- [`2026-05-27-arch-cleanup-6-parts-about-brickdna`](./2026-05-27-arch-cleanup-6-parts-about-brickdna.md) — 5 Parts + About + BrickDna specs (40 imports)

**Aggregate:** 33 specs touched + `frontend/src/tests/unit/architecture.spec.ts` allowlist edited. ~128 import lines removed + ~33 allowlist entries removed.

Each sibling WO's "In the Box" tables remain the authoritative source of truth for which imports to remove from which specs. The umbrella does not re-list them.

### Not in This Set

- The 6 split-spec entries (`SetsOverview*`, `SettingsPage*`) — intentional, stable per all sibling WOs.
- Architecture test rule-logic, opt-out mechanism, or rule-shape changes.
- Any spec not listed in any of the 6 sibling WO tables.

## Acceptance Criteria

- [ ] All 33 spec imports removed per the sibling WO tables (cross-check each one against its source WO).
- [ ] All 33 corresponding entries removed from `LEGACY_CROSS_COMPONENT_IMPORTS` in `frontend/src/tests/unit/architecture.spec.ts`.
- [ ] After cleanup, the 6 split-spec entries are the only remaining entries in `LEGACY_CROSS_COMPONENT_IMPORTS`.
- [ ] `npm run test:coverage` green from `frontend/`; 100% coverage maintained.
- [ ] Architecture test green (the self-cleaning rule that fails on stale allowlist entries passes).
- [ ] Frontend pre-push gauntlet green (`type-check → knip → test:coverage → build`).
- [ ] **One** Build Record at `.claude/records/build-records/2026-05-28-arch-cleanup-sweep.md` covering all six sibling WOs. Link all 6 sibling WO files + this umbrella WO in the BR header. Include collect-delta measurements per the heaviest-spec guidance from each sibling WO:
  - WO 1 — sampling of 2+ of the 7 specs (per WO note)
  - WO 2 — `FormValidationWorkbench.spec.ts` (7 imports, largest in batch)
  - WO 3 — `HomePage.spec.ts` (6 imports, largest in batch)
  - WO 4 — `AddSetPage.spec.ts` + `EditSetPage.spec.ts` (6 imports each, heaviest)
  - WO 5 — `EditStoragePage.spec.ts` (7 imports) + `StorageDetailPage.spec.ts` (6 imports)
  - WO 6 — `AboutPage.spec.ts` (16 imports — largest single payoff in the entire cleanup) + `PartsUnsortedPage.spec.ts` (9 imports)
- [ ] BR records any non-trivial findings: missing `vi.mock` stubs that blocked a removal, unexpected `findComponent({name: 'X'})` failures, transitive import chains worth flagging.

## References

- Parent arch test: PR [#127](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/127) (`enforce-sut-only-vue-imports-in-unit-specs`)
- ADR-0012 — the test-perf regression class this sweep directly improves
- ADR-0028 — PrePushPermitGate doctrine; this umbrella exists to satisfy the slug-match requirement for a 34-file sweep
- Pulse Gallery Active Concerns row: `AboutPage.spec.ts collect guard warning` — this sweep closes it
- Casebook Standing Suspicion row: `AboutPage.spec.ts collect guard` (first noticed 2026-04-11) — this sweep addresses the 47-day-old root cause
- Sibling WOs: 1, 2, 3, 4, 5, 6 (links above)

## Notes from the Issuer

**Why an umbrella WO?** The 6 sibling WOs were filed parallel-dispatch-friendly with the explicit anticipation that "if multiple cleanup WOs are dispatched in parallel and land back-to-back, the architecture.spec.ts diff will combine cleanly" (WO 1 § Notes). The CEO opted for a single-sweep bundle on 2026-05-28 instead. That bundle exceeds the 20-file PrePushPermitGate threshold, so a single branch with a single matching WO slug is needed. The umbrella is the lightest paper-trail move: one WO file, six sibling WOs reference-linked, one BR closes all seven post-merge.

**Order of operations in the post-merge close-out commit on main:** flip Status on all 6 sibling WOs + this umbrella + add Build Record back-links to all 7. One commit. Mirrors the `0c91b13` pattern from the PR #134/#135 close-out wave.

Per-WO Build Records are **not** filed for the siblings — the umbrella BR carries all six, with per-sibling sections inside it. The sibling WOs' `Build Record:` fields link to the umbrella BR.

**Likely above threshold; explicitly designed to pass the gate.** Branch slug `arch-cleanup-sweep` matches this umbrella's slug.

---

**Status:** Migrated to Kendo — Epic #1 "Arch cleanup sweep" (2026-07-16). File frozen as archive; live tracking on the board.
**Build Record:** _superseded — closure is recorded on the Kendo epic_
