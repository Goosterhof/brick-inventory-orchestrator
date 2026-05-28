# Work Order: ComponentGallery.spec.ts — mount → shallowMount

**Work Order #:** 2026-05-27-componentgallery-spec-shallow-mount
**Filed:** 2026-05-27
**Issued By:** The Steward
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `componentgallery-spec-shallow-mount`

---

## The Job

`ComponentGallery.spec.ts` execution time has degraded across six consecutive inspections (855ms → 933ms → 1050ms, 2026-04-25 → 2026-05-20). Currently in TEST GUARD warning zone; collect delta 439ms (warning, not violation). Root cause identified by the Warden multiple times: the spec uses `mount` instead of `shallowMount`, which imports every shared component the gallery showcases. Switch to `shallowMount` and unstub by name only the components whose rendered state the assertions actually depend on.

## Scope

### In the Box

- File: `frontend/src/tests/unit/apps/showcase/components/ComponentGallery.spec.ts`
- Replace `mount` with `shallowMount` from `@vue/test-utils`.
- For any assertions that genuinely require a rendered component (not just a stub), unstub by name via `{ ComponentName: false }` rather than reverting the test to `mount`.
- Re-measure execution time with `npm run test:coverage`; record in the Build Record.

### Not in This Set

- No edits to `ComponentGallery.vue` or any of the components it showcases.
- No changes to other showcase specs.
- No threshold edits.
- No bundling with the `PartsPage` or `SetsOverviewPage` fixes.

## Acceptance Criteria

- [ ] `ComponentGallery.spec.ts` uses `shallowMount` (`grep -n "shallowMount\|^import .*mount" <file>` confirms; no remaining `mount(` calls).
- [ ] Execution time < 800ms under `npm run test:coverage` (out of TEST GUARD warning zone).
- [ ] All assertions still pass; coverage unchanged or improved.
- [ ] Frontend pre-push gauntlet green.
- [ ] Build Record records the unstubbing-by-name list (which components remain rendered and why).
- [ ] Casebook Standing Suspicion row for `ComponentGallery.spec.ts collect guard` updated by the Steward post-merge.

## References

- Casebook (Gallery) Standing Suspicion: `ComponentGallery.spec.ts collect guard` — first noticed 2026-03-25, persists across 6+ inspections, root cause `mount` vs `shallowMount` documented multiple times.
- Standup history: Carried as a Steward AI across 7 standups.
- Pulse: Gallery Wing Active Concerns row (Medium severity).
- Arch test: `mount boundary enforcement` — unit tests must not use `mount`. (Note from 2026-05-19 dependabot session in MINUTES.md: the arch test exists and would have caught this earlier; check whether this spec has been grandfathered out via an exclusion that should be removed as part of the fix.)

## Notes from the Issuer

This is the smallest of the three Gallery test-guard WOs — surgical fix, well-understood root cause, no design questions. Filed last of the three deliberately so the Brickwright can pick it as a warm-up or as the closer.

If the `mount boundary enforcement` arch test does have an exclusion for this file, removing the exclusion as part of the fix is in scope (it's the natural completion of the work). The Build Record should note whether an exclusion existed and was removed.

Sub-threshold push. ADR-0028 uniform-rule applies.

---

**Status:** Completed (closed 2026-05-27 post-merge per ADR-0028 uniform-rule)
**Build Record:** [`2026-05-27-componentgallery-spec-shallow-mount`](../build-records/2026-05-27-componentgallery-spec-shallow-mount.md) — shipped in PR #121 (commit `b689da2`)
