# Work Order: Foundry — EAGER_LOAD N+1 Fix + Arch-Test Coverage Check

**Work Order #:** 2026-05-29-foundry-eager-load-n1-archtest
**Filed:** 2026-05-29
**Issued By:** CEO (via 2026-05-29 cross-wing sweep follow-up)
**Assigned To:** Brickwright
**Wing:** Foundry
**Priority:** High
**Branch slug (for PrePushPermitGate):** `foundry-eager-load-n1-archtest`

---

## The Job

Sweep finding **F-debt-1** (medium): `FamilySetResourceData::EAGER_LOAD = ['set']` omits the nested `set.theme` relation that `SetSummaryResourceData` requires, firing an N+1 (one theme query per row) on the family-sets **index** — a hot list endpoint. The bug is masked by self-healing `loadMissing` (output is correct) and passes the gauntlet because the arch test (`ResourceDataArchitectureTest`) checks only that an `EAGER_LOAD` constant *exists* on nesting classes, never that it *covers* the nested resource's required relations.

Fix both the symptom and the root cause — the symptom alone leaves the next nested resource free to reintroduce the same N+1.

## Scope

### In the Box

1. **Symptom:** change `backend/app/Http/Resources/FamilySetResourceData.php` `EAGER_LOAD` from `['set']` to `['set','set.theme']` (mirror `SetWithPartsResourceData`).
2. **Root cause:** strengthen `tests/Architecture/ResourceDataArchitectureTest.php` so that for any ResourceData nesting another ResourceData via `::from($model->relation)`, the parent's `EAGER_LOAD` must declare the relation **and** relation-prefixed entries for each relation the nested resource's own `EAGER_LOAD` requires. The new check must fail on the pre-fix `['set']` state and pass on `['set','set.theme']`.
3. Add/extend a feature or unit test asserting the family-sets index issues a bounded query count (no per-row theme query) — the definitive confirmation the N+1 is gone.

### Not in This Set

- Auditing every other ResourceData for the same gap beyond what the strengthened arch test now surfaces. If the arch test flags additional offenders, list them in the Build Record for a follow-up WO; do not expand scope to fix them all here unless trivial.

## Acceptance Criteria

- [x] `FamilySetResourceData::EAGER_LOAD` includes `set.theme`.
- [x] `ResourceDataArchitectureTest` asserts nested-resource EAGER_LOAD coverage and fails on the old constant.
- [x] A query-count assertion proves the family-sets index has no per-row theme query.
- [x] Backend gauntlet green (lint:test, phpstan, deptrac, test:arch, test).
- [x] Build Record filed; any further EAGER_LOAD offenders the new arch test surfaces are listed for follow-up.

## References

- Audit: [`2026-05-29-warden-cross-wing-sweep`](../audits/2026-05-29-warden-cross-wing-sweep.md) — finding F-debt-1
- Pattern reference: `backend/app/Http/Resources/SetWithPartsResourceData.php` (correct dot-notation EAGER_LOAD)

---

**Status:** Completed (2026-05-29) — [Build Record](../build-records/2026-05-29-foundry-eager-load-n1-archtest.md)

_Steward note: scope expanded by one file beyond the WO — `ResourceData.php::validateRelationsLoaded()` was modified to validate only the root segment of dotted EAGER_LOAD entries (Eloquent's `relationLoaded()` can't parse dotted keys, so `set.theme` always reported missing → 500). Verified safe: non-dotted resources (20 of 21) are unaffected. (Framing corrected on PR #147 review — the nested `theme` segment is **self-healed by the nested resource's `loadMissing`, not loudly validated**, since `SetSummaryResourceData::from()` doesn't call `validateRelationsLoaded`; the nested segment's loud-failure guarantee now lives at CI time in the new arch test, not at runtime. The root segment stays loudly validated at runtime. See the Build Record's "Framing correction" note.) Steward independently re-ran the full suite (702 green) and proved the new arch test red/green (revert constant → RED with the N+1 message → restore → GREEN). No other EAGER_LOAD offenders surfaced across all 21 resources._
