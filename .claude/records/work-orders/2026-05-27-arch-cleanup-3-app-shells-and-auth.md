# Work Order: Arch cleanup 3 — App shells + Auth + Home

**Work Order #:** 2026-05-27-arch-cleanup-3-app-shells-and-auth
**Filed:** 2026-05-27
**Issued By:** The Steward (per CEO direction 2026-05-27)
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** When-convenient
**Branch slug (for PrePushPermitGate):** `arch-cleanup-3-app-shells-and-auth`

---

## The Job

Pay down 5 entries from `LEGACY_CROSS_COMPONENT_IMPORTS` in `frontend/src/tests/unit/architecture.spec.ts` (added in PR #127). Covers the two app-shell `App.spec.ts` files, the two Auth pages, and HomePage. Remove unused top-level imports and the allowlist entries.

## Scope

### In the Box

5 specs, 13 imports total:

| # | Spec | Imports to remove |
|---|---|---|
| 1 | `frontend/src/tests/unit/apps/admin/App.spec.ts` | `NavLink.vue` |
| 2 | `frontend/src/tests/unit/apps/families/App.spec.ts` | `NavHeader.vue`, `NavMobileLink.vue` |
| 3 | `frontend/src/tests/unit/apps/families/domains/auth/pages/LoginPage.spec.ts` | `PrimaryButton.vue`, `TextInput.vue` |
| 4 | `frontend/src/tests/unit/apps/families/domains/auth/pages/RegisterPage.spec.ts` | `PrimaryButton.vue`, `TextInput.vue` |
| 5 | `frontend/src/tests/unit/apps/families/domains/home/pages/HomePage.spec.ts` | `CardContainer.vue`, `LegoBrick.vue`, `NavLink.vue`, `PageHeader.vue`, `StatCard.vue`, `YearDistributionChart.vue` |

For each spec:

1. Remove the matching top-level `.vue` imports.
2. Confirm `findComponent({name: 'X'})` calls + `vi.mock(...)` stubs still pass.
3. Remove the spec's entry from `LEGACY_CROSS_COMPONENT_IMPORTS`.

### Not in This Set

- Any spec not in the table above.
- Settings pages (those are split-spec entries — intentional).
- Architecture test rule-logic changes.

## Acceptance Criteria

- [ ] All 5 specs have their top-level imports removed.
- [ ] All 5 allowlist entries removed.
- [ ] `npm run test:coverage` green; 100% coverage maintained.
- [ ] Architecture test green.
- [ ] Frontend pre-push gauntlet green.
- [ ] Build Record records: collect-delta before/after on HomePage at minimum (6 imports — the largest payoff in this batch); any non-trivial findings.

## References

- Parent arch test: PR [#127](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/127)
- ADR-0012
- Sibling cleanup WOs (1, 2, 4, 5, 6)

## Notes from the Issuer

Third in the 6-WO sibling sequence. HomePage carries the largest import set in this batch — measure the collect-delta there for evidence. Sub-threshold push; close in post-merge commit per ADR-0028 uniform-rule.

---

**Status:** Migrated to Kendo — BIO-0003 (2026-07-16). File frozen as archive; live tracking on the board.
**Build Record:** _superseded — closure is recorded on the Kendo issue_
