# Work Order: Gallery — Coverage-Gate Scope Honesty

**Work Order #:** 2026-05-29-coverage-gate-scope-honesty
**Filed:** 2026-05-29
**Issued By:** CEO (via 2026-05-29 cross-wing sweep follow-up)
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `coverage-gate-scope-honesty`

---

## The Job

Sweep finding **G-debt-2** (medium): the 100/100/100/100 coverage thresholds in `frontend/vitest.config.ts` are real, but the `coverage.exclude` block removes `src/apps/**/{domains,pages,services,stores,types,router}/**`, `main.ts`, and `App.vue`. The headline "100% coverage" therefore measures `src/shared/**` plus app-root files only — app services and stores (e.g. `familySetStore.ts`, the 31KB `translation.ts`) are not under the unit gate. `frontend/CLAUDE.md` Coverage Policy and the Pulse Quality Metrics line read as if 100% is comprehensive; the Pulse Tech Debt register understates the exclusion ("Domain pages excluded" — actual is broader).

## ⚠️ Issuer Decision Required

**Steward recommends (a)** as the honest-now move, with (b) as a tracked stretch:

- **(a) Qualify the claim:** correct `frontend/CLAUDE.md` Coverage Policy and the Pulse to state the gate's true scope (shared + app-root), and name the integration suite as the coverage path for excluded app code. Small, immediately honest. *Recommended now.*
- **(b) Widen the gate:** narrow the exclude list to bring app `services/` and `stores/` under the unit gate and write the missing specs. Larger; raises real coverage but is a multi-page effort.

This WO is written for **(a)** with (b) flagged as a follow-up. CEO may instead order (b) directly.

## Scope

### In the Box (Path a)

1. Correct the `frontend/CLAUDE.md` Coverage Policy wording to state the gate covers shared + app-root, and that excluded app code (domains/pages/services/stores/types/router) is covered by the integration suite.
2. Confirm whether the integration suite (`vitest.integration.config.ts`) actually exercises app services/stores; if it has no coverage block, note that gap honestly rather than implying coverage that isn't measured.
3. Hand the Pulse Quality Metrics + Tech Debt corrections to the Steward (Pulse is Steward territory) — produce drop-in replacement text in the Build Record.

### Not in This Set

- Path (b) widening the gate — separate WO if the CEO orders it.

## Acceptance Criteria

- [ ] CLAUDE.md Coverage Policy states the gate's true scope; no overstated "everything is 100%" implication.
- [ ] Integration-suite coverage reality confirmed and stated (covered / not measured).
- [ ] Drop-in Pulse replacement text produced for the Steward.
- [ ] Gallery gauntlet green.
- [ ] Build Record filed.

## References

- Audit: [`2026-05-29-warden-cross-wing-sweep`](../audits/2026-05-29-warden-cross-wing-sweep.md) — finding G-debt-2

---

**Status:** Migrated to Kendo — BIO-0007 (2026-07-16), Issuer decision (a)/(b) carried onto the issue. File frozen as archive; live tracking on the board.
