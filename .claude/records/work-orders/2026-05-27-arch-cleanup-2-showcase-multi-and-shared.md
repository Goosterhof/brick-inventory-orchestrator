# Work Order: Arch cleanup 2 — Showcase multi-import + shared singles

**Work Order #:** 2026-05-27-arch-cleanup-2-showcase-multi-and-shared
**Filed:** 2026-05-27
**Issued By:** The Steward (per CEO direction 2026-05-27)
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** When-convenient
**Branch slug (for PrePushPermitGate):** `arch-cleanup-2-showcase-multi-and-shared`

---

## The Job

Pay down 6 entries from `LEGACY_CROSS_COMPONENT_IMPORTS` in `frontend/src/tests/unit/architecture.spec.ts` (added in PR #127). 4 multi-import showcase specs and 2 shared single-import specs. For each spec, remove the unused top-level `import`s and remove the allowlist entry. Components are already stubbed via `vi.mock(...)` and referenced via `findComponent({name: 'X'})`; the static imports drag the transitive dependency graph into the Vite collect phase (ADR-0012).

## Scope

### In the Box

6 specs, 17 imports total:

| # | Spec | Imports to remove |
|---|---|---|
| 1 | `frontend/src/tests/unit/apps/showcase/components/ComponentHealthMocked.spec.ts` | `ComponentHealth.vue`, `SectionHeading.vue` |
| 2 | `frontend/src/tests/unit/apps/showcase/components/DialogServiceDemo.spec.ts` | `PrimaryButton.vue`, `SectionHeading.vue` |
| 3 | `frontend/src/tests/unit/apps/showcase/components/FormValidationWorkbench.spec.ts` | `DateInput.vue`, `NumberInput.vue`, `PrimaryButton.vue`, `SectionHeading.vue`, `SelectInput.vue`, `TextInput.vue`, `TextareaInput.vue` |
| 4 | `frontend/src/tests/unit/apps/showcase/components/ResourceAdapterPlayground.spec.ts` | `DangerButton.vue`, `NumberInput.vue`, `PrimaryButton.vue`, `TextInput.vue` |
| 5 | `frontend/src/tests/unit/shared/components/ConfirmDialog.spec.ts` | `ModalDialog.vue` |
| 6 | `frontend/src/tests/unit/shared/components/EmptyState.spec.ts` | `LegoBrick.vue` |

For each spec:

1. Remove the matching top-level `import X from '...X.vue'` lines.
2. Confirm `findComponent({name: 'X'})` calls still resolve and the `vi.mock(...)` stubs are in place — spec must still pass.
3. Remove the spec's entry from `LEGACY_CROSS_COMPONENT_IMPORTS`.

### Not in This Set

- Any spec not in the table above.
- The 6 split-spec entries.
- Architecture test rule-logic changes.
- Component-registry residual cleanup or backend dispatch block findings.

## Acceptance Criteria

- [ ] All 6 specs have their top-level imports removed (17 total).
- [ ] All 6 allowlist entries removed.
- [ ] `npm run test:coverage` green; 100% coverage maintained.
- [ ] Architecture test green.
- [ ] Frontend pre-push gauntlet green.
- [ ] Build Record records: collect-delta before/after on at least 2 specs; any spec where the cleanup was non-trivial (e.g., `vi.mock` was missing); any unexpected finding.

## References

- Parent arch test: PR [#127](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/127)
- ADR-0012
- Sibling cleanup WOs filed 2026-05-27 (cleanups 1, 3, 4, 5, 6)

## Notes from the Issuer

Second in the 6-WO sibling sequence. `FormValidationWorkbench` carries the most imports of this batch (7) — likely the highest collect-delta payoff. Showcase specs are generally lighter than feature-domain specs since they mount design-system pieces in isolation. Sub-threshold push; close in post-merge commit per ADR-0028 uniform-rule.

---

**Status:** Open
**Build Record:** _to be filled when filed_
