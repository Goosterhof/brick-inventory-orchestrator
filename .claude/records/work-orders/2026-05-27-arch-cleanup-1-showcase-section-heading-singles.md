# Work Order: Arch cleanup 1 — Showcase SectionHeading-only specs

**Work Order #:** 2026-05-27-arch-cleanup-1-showcase-section-heading-singles
**Filed:** 2026-05-27
**Issued By:** The Steward (per CEO direction 2026-05-27 — "let's write the 5-6 small cleanup WOs for the arch test")
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** When-convenient
**Branch slug (for PrePushPermitGate):** `arch-cleanup-1-showcase-section-heading-singles`

---

## The Job

Pay down 7 entries from `LEGACY_CROSS_COMPONENT_IMPORTS` in `frontend/src/tests/unit/architecture.spec.ts` (added in PR #127). All seven are showcase specs that import only `SectionHeading.vue` at top level — the smallest, most uniform batch in the cleanup series. For each spec, remove the unused top-level `import` and remove the corresponding allowlist entry. The component is already stubbed via `vi.mock(...)` and referenced via `findComponent({name: 'SectionHeading'})`; the static import is dead weight that drags the transitive dependency graph into the Vite collect phase (ADR-0012).

## Scope

### In the Box

7 specs, each with a single `SectionHeading.vue` import to remove:

| # | Spec | Imports to remove | Allowlist entries to delete |
|---|---|---|---|
| 1 | `frontend/src/tests/unit/apps/showcase/components/AntiPatterns.spec.ts` | `SectionHeading.vue` | `'apps/showcase/components/AntiPatterns.spec.ts'` |
| 2 | `frontend/src/tests/unit/apps/showcase/components/BrandVoice.spec.ts` | `SectionHeading.vue` | `'apps/showcase/components/BrandVoice.spec.ts'` |
| 3 | `frontend/src/tests/unit/apps/showcase/components/BrickDimensions.spec.ts` | `SectionHeading.vue` | `'apps/showcase/components/BrickDimensions.spec.ts'` |
| 4 | `frontend/src/tests/unit/apps/showcase/components/BrickShapes.spec.ts` | `SectionHeading.vue` | `'apps/showcase/components/BrickShapes.spec.ts'` |
| 5 | `frontend/src/tests/unit/apps/showcase/components/ColorPalette.spec.ts` | `SectionHeading.vue` | `'apps/showcase/components/ColorPalette.spec.ts'` |
| 6 | `frontend/src/tests/unit/apps/showcase/components/SnapDemo.spec.ts` | `SectionHeading.vue` | `'apps/showcase/components/SnapDemo.spec.ts'` |
| 7 | `frontend/src/tests/unit/apps/showcase/components/TypographySpecimen.spec.ts` | `SectionHeading.vue` | `'apps/showcase/components/TypographySpecimen.spec.ts'` |

For each spec:

1. Remove the `import SectionHeading from '...SectionHeading.vue'` line from the spec file.
2. Confirm the spec's `findComponent({name: 'SectionHeading'})` calls still resolve and that the `vi.mock(...)` stub is in place — the spec must still pass.
3. Remove the spec's entry from `LEGACY_CROSS_COMPONENT_IMPORTS` in `frontend/src/tests/unit/architecture.spec.ts`.

### Not in This Set

- Any spec not in the table above (the other 26 allowlist entries are scoped into sibling cleanup WOs filed today).
- The 6 split-spec entries (`SetsOverview*`, `SettingsPage*`) — those are intentional SUT-filename mismatches and stable.
- Any change to the architecture test's rule logic, opt-out mechanism, or rule-shape.
- The component-registry residual cleanup or backend dispatch block findings from the worktree-hook BR — separate concerns.

## Acceptance Criteria

- [ ] All 7 specs have their `SectionHeading.vue` top-level imports removed.
- [ ] All 7 corresponding entries removed from `LEGACY_CROSS_COMPONENT_IMPORTS`.
- [ ] `npm run test:coverage` green; 100% coverage maintained.
- [ ] Architecture test green (the self-cleaning rule that fails on stale allowlist entries passes).
- [ ] Frontend pre-push gauntlet green.
- [ ] Build Record records: collect-delta before/after on at least 2 of the 7 specs (sampling adequate); any spec that turned out NOT to be cleanable (e.g., the `vi.mock` was missing); any unexpected finding.

## References

- Parent arch test: PR [#127](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/127) (`enforce-sut-only-vue-imports-in-unit-specs`)
- ADR-0012 — the test-perf regression class this paydown directly improves
- Source of the legacy debt: each spec was stubbed via `vi.mock` at some point but the unused `import` was never removed
- Brickwright's batch recommendation: ~6-8 per batch, 5-6 batches total to drive the allowlist toward the 6-entry split-spec floor

## Notes from the Issuer

Smallest of the 6 sibling cleanup WOs filed 2026-05-27. Trivial mechanical work — pick this up as a warmup. All 7 specs share the same shape (single import, same component); the cleanest possible introduction to the cleanup pattern.

The 5 sibling cleanup WOs are independent and parallel-dispatch-friendly. They all touch `architecture.spec.ts` to remove their own allowlist entries (no overlapping keys, no merge conflicts on distinct removals). If multiple cleanup WOs are dispatched in parallel and land back-to-back, the architecture.spec.ts diff will combine cleanly.

Sub-threshold push. ADR-0028 uniform-rule applies; close in post-merge commit on `main`.

---

**Status:** Migrated to Kendo — BIO-0001 (2026-07-16). File frozen as archive; live tracking on the board.
**Build Record:** _superseded — closure is recorded on the Kendo issue_
