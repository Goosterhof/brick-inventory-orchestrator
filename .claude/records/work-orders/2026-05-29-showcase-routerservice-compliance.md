# Work Order: Gallery — Showcase RouterService Compliance + Linter Gap

**Work Order #:** 2026-05-29-showcase-routerservice-compliance
**Filed:** 2026-05-29
**Issued By:** CEO (via 2026-05-29 cross-wing sweep follow-up)
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `showcase-routerservice-compliance`

---

## The Job

Sweep finding **G-arch-1** (medium): the showcase app bypasses the RouterService wrapper (ADR-0003, "no exceptions for 'simple' apps") — `router/index.ts` calls `createRouter`/`createWebHistory` directly, `main.ts` does `app.use(showcaseRouter)`, `App.vue` uses raw `RouterLink`/`RouterView`. Families and admin both comply. The violation survives every gate because oxlint's `no-restricted-imports` bans only `useRouter`/`useRoute` and `lint-vue-conventions.mjs` check 6 is scoped to `src/shared/` only. The showcase is the design-system showroom — the artifact a prospective client opens to judge pattern discipline.

## Issuer Decision — RESOLVED 2026-05-29: (a) Migrate

The CEO ruled **(a) Migrate** showcase to `createRouterService()` to match families/admin — keep one routing dialect, no ADR carve-out. (Declined: (b) amend ADR-0003 for a dev-only exception.) Scope below executes path (a) + the linter-gap close.

## Scope

### In the Box

1. **(Path a)** Migrate `src/apps/showcase/router/index.ts`, `main.ts`, and `App.vue` to `createRouterService()` and the RouterService-sanctioned link/view usage, matching families/admin.
2. **Close the enforcement gap (both paths):** extend `lint-vue-conventions.mjs` check 6 (or an oxlint `no-restricted-imports` rule) to flag `createRouter`/`createWebHistory`/`RouterView`/`RouterLink` usage in `src/apps/**`, so a future raw-Vue-Router regression cannot pass silently.

### Not in This Set

- Other showcase polish unrelated to routing.

## Acceptance Criteria

- [x] (Path a) Showcase routes through `createRouterService()`; no raw `vue-router` primitives remain in the app.
- [x] Linter flags raw Vue Router usage anywhere under `src/apps/**`; a regression test/fixture proves it.
- [x] Gallery gauntlet green (type-check, lint, lint:vue, knip, test:coverage, build).
- [x] Build Record filed.

## References

- Audit: [`2026-05-29-warden-cross-wing-sweep`](../audits/2026-05-29-warden-cross-wing-sweep.md) — finding G-arch-1
- ADR-0003 (Custom RouterService)

---

**Status:** Completed (2026-05-29) — [Build Record](../build-records/2026-05-29-showcase-routerservice-compliance.md)

_Steward note: Brickwright's new linter messages initially cited "ADR-003" (deprecated pre-merger format, mirroring the adjacent stale check-4 string). Steward corrected the four new RouterService citations to the consolidated **ADR-0003** on review; the pre-existing stale numbers remain for the `warden-sweep-doc-reconciliation` WO (G-arch-2) to reconcile wholesale._
