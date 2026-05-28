# Work Order: Reintroduce frontend mutation testing (v2), CI-gated this time

**Work Order #:** 2026-05-28-frontend-mutation-testing-v2
**Filed:** 2026-05-28
**Issued By:** The Steward
**Assigned To:** Brickwright (Gallery Wing)
**Wing:** Gallery
**Priority:** Now
**Branch slug (for PrePushPermitGate):** `frontend-mutation-testing-v2`

---

## The Job

Reintroduce Stryker mutation testing in the Gallery Wing, scoped to high-value pure-TypeScript targets, wired into `frontend-ci.yml` as a **gating** step from day one. This is a deliberate redo of the 2026-03-28 install that was retired on 2026-05-28 (PR #133) as VESTIGIAL.

The v1 failure mode was structural, not technical: infrastructure with no consumer dies. v2 must answer "who reads the score, and when does it break the build?" before the config ships — and the answer is "CI, on every PR, breaking the build on threshold violation."

## Why Now

1. **The fs-packages migration created the right surface.** Most of `src/shared/services/*` extracted out to `@script-development/fs-*` packages (themselves mutation-tested at 90% break). What remains in BIO frontend src/ is a focused set of pure logic — helpers, composables, route guards, middleware — that has 100% line coverage but no mutation signal.
2. **Reference setup is locally available.** `/home/goosterhof/Code/war-room/territories/fs-packages` has 11 packages all running Stryker with identical config and a gating CI step. Direct mirror.
3. **Clean baseline.** PR #133 removed all v1 residue. No stale config, no orphan deps, no transitive advisories. Greenfield.

## Scope

### In the Box

- **Config:** `frontend/stryker.config.mjs` mirroring fs-packages template byte-for-byte except for `mutate` scope.
- **Mutate scope (start narrow, prove the gate works):**
  - `src/shared/helpers/**/*.ts`
  - `src/shared/composables/**/*.ts`
  - `src/shared/middleware/**/*.ts`
  - `src/shared/services/auth/**/*.ts`
- **Exclude:** `src/**/types.ts`, `src/**/*.d.ts`, `src/**/index.ts` (barrels — Gallery has many)
- **Thresholds:** `{high: 95, low: 90, break: 90}` — exact fs-packages parity. We extracted services *to* fs-packages; their thresholds should be achievable on what remains. Per CEO directive (Path A), no slack-cutting.
- **Dependencies:** Add `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` to `frontend/package.json` devDependencies (Stryker 9.x, matches fs-packages).
- **Script:** `"test:mutation": "stryker run"` in `frontend/package.json`.
- **`.gitignore`:** re-add `.stryker-tmp/` and `.stryker-incremental.json` under `frontend/`.
- **CI integration:** add `npm run test:mutation` to `frontend-ci.yml` after `test:coverage`, in the same job, **gating** (failure breaks the build).
- **Test tightening (if required):** if the initial run lands below the 90% break threshold, tighten the affected tests (NOT lower the threshold). This is Path A's commitment.
- **Pulse:** re-add the Mutation testing (Stryker) row with actual achieved score, gate status, and an honest maturity classification (not "Configured, not yet run in anger" — this time it runs).

### Not in This Set

- **Vue component mutation testing.** Out of scope for v2. Components ship with brittle DOM-shape tests; mutation noise would dominate. Reassess after v2 has run in CI for a sprint.
- **Application-layer code under `src/apps/*/{stores,services}/`.** These are mostly thin wrappers around fs-* packages or app glue. v2 keeps scope tight to maximize signal-to-noise on the first run.
- **Mutation-testing the fs-packages themselves.** They're tested upstream; re-mutating in the consumer wastes compute.
- **Broader threshold ratcheting roadmap.** If 90% holds, fine. If we need to back off, that's a follow-up Work Order with explicit rationale — not a quiet config drop.

## Acceptance Criteria

- [ ] `frontend/stryker.config.mjs` exists, matches fs-packages template structure, scope is the four directories listed above
- [ ] `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` in `frontend/package.json` devDependencies
- [ ] `test:mutation` script in `frontend/package.json`
- [ ] `.stryker-tmp/` and `.stryker-incremental.json` re-added to `frontend/.gitignore`
- [ ] `npm run test:mutation` runs to completion locally and meets the 90% break threshold
- [ ] `frontend-ci.yml` runs `test:mutation` as a gating step (build breaks on threshold violation)
- [ ] CI green on the PR (including the new mutation step)
- [ ] Pulse row re-added with actual achieved score and "Battle-tested" or "Established" maturity (NOT "Configured")
- [ ] Build Record explicitly captures the v1 → v2 lesson: infrastructure without a CI consumer is vestigial by construction
- [ ] `npm audit` reports 0 new vulnerabilities (the qs/typed-rest-client chain was the v1 advisory pollution; verify Stryker 9.x still has the same transitive)

## References

- v1 install: `.claude/records/build-records/2026-03-28-mutation-testing.md`
- v1 disposition: PR #133 (commit `49270f4`, merged 2026-05-28). Surveyor reports in war-room.
- v2 inspiration: `/home/goosterhof/Code/war-room/territories/fs-packages/packages/*/stryker.config.mjs` (uniform across 11 packages) + `.github/workflows/ci.yml` (gating step pattern)
- ADR-0028 (Bypass Log Scope Amendment) — this WO is the gate for the expected lockfile regen size

## Notes from the Issuer

The whole reason this is a Work Order and not a casual "let's just add the config back" is the v1 lesson. v1 was added without commitment to a consumer; v2 is added with the consumer wired up before the tool is even installed in the lockfile. The order matters: if at any point during this WO it becomes clear the 90% break threshold isn't achievable without test rewrites that exceed the scope of "reintroduction," **stop and escalate**, don't lower the threshold to ship.

The branch slug `frontend-mutation-testing-v2` is the PrePushPermitGate match. Lockfile regen will easily exceed the 500-line/20-file threshold, so the gate will engage.

---

**Status:** Completed (merged 2026-05-28 in PR #135, merge commit `f8887e3`)
**Build Record:** [2026-05-28-frontend-mutation-testing-v2](../build-records/2026-05-28-frontend-mutation-testing-v2.md)
