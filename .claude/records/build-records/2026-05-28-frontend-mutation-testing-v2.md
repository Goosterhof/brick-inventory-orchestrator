# Build Record: Reintroduce frontend mutation testing (v2), CI-gated this time

**Build Record #:** 2026-05-28-frontend-mutation-testing-v2
**Filed:** 2026-05-28
**Brickwright:** The Steward (operating directly)
**Wing:** Gallery
**Work Order:** [2026-05-28-frontend-mutation-testing-v2](../work-orders/2026-05-28-frontend-mutation-testing-v2.md)
**Branch:** `feat/frontend-mutation-testing-v2`

---

## Work Summary

Reintroduced Stryker mutation testing in the Gallery Wing as a CI-gated step. v2 redo of the 2026-03-28 install (build record `2026-03-28-mutation-testing.md`) that was retired as VESTIGIAL in PR #133 on 2026-05-28. The redo is deliberately wired with a CI consumer before the lockfile entries are accepted — the v1 failure was structural (no consumer = vestigial by construction), not technical.

Reference setup: `script-development/fs-packages` (local at `/home/goosterhof/Code/war-room/territories/fs-packages`), which runs identical Stryker config across 11 published packages with a gating CI step. v2 mirrors that setup.

## Deliverables

| Action | File | Notes |
|---|---|---|
| Created | `frontend/stryker.config.mjs` | Mirrors fs-packages template structure. `mjs` over `json` for IDE JSDoc intellisense. Scope narrowed to high-value pure-TS paths. |
| Modified | `frontend/package.json` | Added `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` (^9, fs-packages parity); added `test:mutation` script; added `overrides: {qs: "^6.15.2"}` to pin the transitive that motivated PR #133. |
| Regenerated | `frontend/package-lock.json` | `npm install` regen. `npm audit` reports 0 vulnerabilities — the qs/typed-rest-client chain that v1 reopened is closed by the override. |
| Modified | `frontend/.gitignore` | Re-added `.stryker-tmp/` and `.stryker-incremental.json`. |
| Modified | `frontend/knip.json` | Added `@stryker-mutator/api` to `ignoreDependencies` (JSDoc-only type reference; not a runtime import). |
| Modified | `.github/workflows/frontend-ci.yml` | Added `Mutation testing (Stryker)` step between `Test with coverage` and `Integration tests` as a **gating** step. This is the v1 fix. |
| Modified | `frontend/src/tests/unit/shared/helpers/csv.spec.ts` | Tightened `downloadCsv` test to capture the Blob argument and assert on `.type` and content. Killed 3 surviving mutants (csv.ts went 86.96 → 100%). |
| Modified | `frontend/src/tests/unit/shared/helpers/bricklinkWantedList.spec.ts` | Same Blob-inspection pattern applied to `downloadBrickLinkWantedList`. Killed 3 surviving mutants (bricklinkWantedList.ts went 81.82 → 88.64%). |
| Modified | `.claude/docs/pulse.md` | Re-added Mutation testing (Stryker) v2 row at maturity **Established** (not "Configured" — this time it runs). Will promote to Battle-tested after one sprint of green CI runs. |

## Mutation Testing Results

```
-------------------------|------------------|----------|-----------|------------|----------|----------|
                         | % Mutation score |          |           |            |          |          |
File                     |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
-------------------------|--------|---------|----------|-----------|------------|----------|----------|
All files                |  93.36 |   93.36 |      219 |         6 |         16 |        0 |        1 |
 composables             |  93.94 |   93.94 |      124 |         0 |          8 |        0 |        1 |
  useBrickPickup.ts      |  92.78 |   92.78 |       90 |         0 |          7 |        0 |        0 |
  useFormSubmit.ts       | 100.00 |  100.00 |       17 |         0 |          0 |        0 |        1 |
  useValidationErrors.ts |  94.44 |   94.44 |       17 |         0 |          1 |        0 |        0 |
 helpers                 |  93.33 |   93.33 |       70 |         0 |          5 |        0 |        0 |
  bricklinkWantedList.ts |  88.64 |   88.64 |       39 |         0 |          5 |        0 |        0 |
  csv.ts                 | 100.00 |  100.00 |       23 |         0 |          0 |        0 |        0 |
  type-check.ts          | 100.00 |  100.00 |        8 |         0 |          0 |        0 |        0 |
 middleware              |  93.33 |   93.33 |       13 |         1 |          1 |        0 |        0 |
  fromQuery.ts           |  93.33 |   93.33 |       13 |         1 |          1 |        0 |        0 |
 services                |  89.47 |   89.47 |       12 |         5 |          2 |        0 |        0 |
  auth                   |  89.47 |   89.47 |       12 |         5 |          2 |        0 |        0 |
   guards.ts             |  89.47 |   89.47 |       12 |         5 |          2 |        0 |        0 |
-------------------------|--------|---------|----------|-----------|------------|----------|----------|
Final mutation score of 93.36 is greater than or equal to break threshold 90
```

- **9 files mutated, 242 mutants instrumented, ~770 tests run per evaluation (10.63 tests per mutant on average).**
- **Initial run: 89.21% (failed break threshold by 0.79).** Per CEO directive (Path A — no slack-cutting), tightened tests rather than lowering threshold.
- **Second run after test tightening (csv + bricklinkWantedList Blob inspection): 91.70% (passed).**
- **Third run after additional triage (useValidationErrors per-file score from 72.22 → 94.44): 93.36%.** The third tightening was filed in response to General review feedback that the aggregate-only floor let `useValidationErrors.ts` hide below the per-file threshold; two new tests target the `error.response?.status === 422 && error.response?.data` decision tree (network-error case + non-422-after-422 case).
- **16 survivors remain.** Per-file scores: 6 files at or above 90% (useFormSubmit 100, csv 100, type-check 100, useValidationErrors 94.44, useBrickPickup 92.78, fromQuery 93.33), 2 files within ~1.5 points of the 90% floor (bricklinkWantedList 88.64, guards 89.47). The two laggards are tracked in follow-up WO [2026-05-28-mutation-per-file-floor](../work-orders/2026-05-28-mutation-per-file-floor.md).
- **`useFormSubmit.ts` shows `# errors: 1` despite 100% score.** Investigation: under Stryker's instrumentation overhead the test `should no-op when handleSubmit is called while already submitting` (which uses microtask timing) fails with a runtime error rather than an assertion failure for one specific mutant. Stryker categorizes runtime errors separately from killed mutants, but functionally the mutant was killed — the test exception triggered when the mutated code changed behavior. Pulse already tracks `useFormSubmit` timing sensitivity at the suite level; no new action needed.

## Permit Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| `frontend/stryker.config.mjs` exists, matches fs-packages template structure, scope is the four directories listed above | Yes | mjs format, JSDoc type hint, scope: helpers/composables/middleware/services/auth |
| `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` in `frontend/package.json` devDependencies | Yes | Both at `^9` (fs-packages parity) |
| `test:mutation` script in `frontend/package.json` | Yes | `"test:mutation": "stryker run"` |
| `.stryker-tmp/` and `.stryker-incremental.json` re-added to `frontend/.gitignore` | Yes | Plus matched ordering against fs-packages template |
| `npm run test:mutation` runs to completion locally and meets the 90% break threshold | Yes | 93.36% achieved after three rounds of test tightening (the third in response to General review feedback on per-file floor) |
| `frontend-ci.yml` runs `test:mutation` as a gating step (build breaks on threshold violation) | Yes | Inserted between `Test with coverage` and `Integration tests` |
| CI green on the PR (including the new mutation step) | Pending | To be verified on PR creation |
| Pulse row re-added with actual achieved score and "Battle-tested" or "Established" maturity (NOT "Configured") | Yes | Filed as **Established** with explicit score (91.70%) and CI-gate status; promotion to Battle-tested deferred to post-CI-cycle |
| Build Record explicitly captures the v1 → v2 lesson | Yes | See Decisions Made #1 and Self-Debrief below |
| `npm audit` reports 0 new vulnerabilities | Yes | `overrides: {qs: "^6.15.2"}` closes the chain that motivated PR #133 |

## Decisions Made

1. **CI integration order matters: the consumer is wired before the tool ships.** v1 was added on 2026-03-28 with `"test:mutation"` script and a `stryker.config.json` but no CI step. It ran exactly zero times in 62 days because nothing was looking at its output. v2 reverses that: CI gate is part of the same commit as the config. If the gate fails on this PR, the PR doesn't merge — the tool can't ship without a consumer.

2. **`overrides` path-scoped to `@stryker-mutator/core > typed-rest-client > qs` to keep the v1 disposition rationale intact without painting the whole tree.** PR #133 dropped Stryker partly to close the persistent `qs/typed-rest-client` moderate advisory chain. Reintroducing Stryker without addressing this would be an obvious regression on the day-of. The first commit used an unconstrained `{qs: "^6.15.2"}` override; per General review feedback, switched to the path-scoped form so other transitive qs consumers (if any are introduced later) are unaffected. `npm ls qs` confirms only one chain consumes qs today (`@stryker-mutator/core@9.6.1 → typed-rest-client@2.3.1 → qs@6.15.2`); the path-scoped form is future-proofing rather than a current-tree fix. `npm audit` reports 0 vulnerabilities.

3. **Threshold at fs-packages parity (break: 90, low: 90, high: 95) — Path A per CEO.** v1 used `break: 80` and never ran. The fs-packages parity threshold is harder but defensible: BIO frontend's pure-TS scope is a subset of what fs-packages mutation-tests, and the 100% line coverage policy gives us a strong substrate. The CEO explicitly chose Path A ("commit to 90/90/95; tighten tests if needed") over Path B (start at 75/80/85 and ratchet). Held to it — tightened tests when initial run was 89.21%, did not lower threshold.

4. **Scope narrowed vs fs-packages.** fs-packages mutates `src/**/*.ts` per package (entire surface). BIO's `src/` has Vue components and app glue that fs-packages doesn't. v2 scopes to four directories of pure TS logic: `src/shared/helpers/`, `src/shared/composables/`, `src/shared/middleware/`, `src/shared/services/auth/`. This maximizes signal-to-noise on the first run and matches the WO's "start narrow, prove the gate works" framing. Expanding scope is a follow-up WO decision after v2 has run in CI for a sprint.

5. **Format: `mjs` not `json`.** fs-packages chose `mjs`; v1 chose `json`. mjs allows the `/** @type {...} */` JSDoc annotation that gives IDE intellisense for the config object. Trivial win.

6. **Incremental mode enabled with `.stryker-incremental.json`.** fs-packages parity. Locally, this cuts second-run time from ~7min to ~2:30. In CI, every run is a fresh clone so the incremental file is absent — first run is full, which is what we want anyway. No-op cost.

7. **`@stryker-mutator/api` added to knip `ignoreDependencies`.** The stryker.config.mjs JSDoc type annotation references `@stryker-mutator/api/core`. It's a type-only reference (no runtime import), so it doesn't show up in package.json. knip's "Remove from ignoreDependencies" hint was a false positive on the slash-pathed form; the bare package name pattern resolves cleanly.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| `npm run type-check` | PASS | Clean (vue-tsc --build) |
| `npm run lint` | PASS | Pre-existing warnings only, no errors |
| `npm run lint:vue` | PASS | All conventions passed |
| `npm run knip` | PASS | After adding `@stryker-mutator/api` to ignoreDependencies |
| `npm run format:check` | PASS | All matched files use the correct format |
| `npm run test:coverage` | PASS | 100% statements / branches / functions / lines maintained |
| `npm run build` | PASS | 3 apps built in 6.38s |
| `npm run test:mutation` | PASS | 91.70% (>= 90% break threshold) |
| `npm audit` | PASS | 0 vulnerabilities (qs override holding) |

## Showcase Readiness

Strong. The setup demonstrates a mature pattern: tool installed with explicit CI consumer, ambitious-but-grounded thresholds (matching the upstream packages we extracted services to), transitive advisory mitigation that respects the recent disposition, and tightened tests in the same commit as the threshold introduction. A reviewer would see this as deliberate redo of a known failure mode — not just "we tried again."

## Proposed Knowledge Updates

- **Pulse:** Row already updated in this PR (Established maturity, 91.70% score, CI-gated).
- **Learnings:** None new — the v1 lesson ("infrastructure without a CI consumer is vestigial by construction") was already known; this WO operationalizes it. Worth filing as a doctrinal note if a similar pattern emerges elsewhere.
- **Decision Record:** Borderline. The "CI consumer before tool ships" principle is one-step-removed from process and could be a doctrinal note rather than a full ADR. Defer the call until/unless a second tool-install rejects this principle and we need an arbitration point.
- **Domain Map:** No changes.

## Self-Debrief

### What Went Well

- **Reference setup was directly cloneable.** fs-packages had the exact pattern needed, including the CI integration step. Saved hours of config trial-and-error. The local availability at `/home/goosterhof/Code/war-room/territories/fs-packages` meant zero web research.
- **`overrides: {qs}` worked cleanly.** Anticipated risk (override might break Stryker due to API drift) didn't materialize. qs 6.15.2 is a drop-in for the older versions.
- **Test tightening was scope-respecting.** The 0.79-point gap to threshold was closeable by enhancing two existing tests (Blob inspection pattern), not by writing new tests or restructuring source code. Path A delivered without ballooning the WO.
- **Incremental Stryker dramatically reduced iteration time** between the first failing run and the second passing run (7min → 2:30). Made test tightening tractable in a single session.

### What Went Poorly

- **The initial 89.21% score was a near-miss.** Could have been a much harder near-miss (e.g., 85% needing rewrites of 5+ tests). If the next file or scope expansion lands at, say, 82%, Path A could become a significantly larger commitment. Worth monitoring as scope grows.
- **Knip required two-round configuration.** The first ignoreDependencies entry (`@stryker-mutator/api/core` with the slash path) was rejected. Should have tried the bare package name first.

### Blind Spots

- **CI step verification is deferred to post-PR-creation.** The Work Order's "CI green on the PR" criterion is the one open item. If CI behavior diverges from local (e.g., happy-dom vs. JSDOM differences for the Blob assertions), the gate could fail in CI. Mitigation: the assertions use vanilla Blob API surface (`.type`, `.text()`), both widely supported.
- **The 20 remaining survivors haven't been triaged.** Aggregate is fine, but `useValidationErrors.ts` at 72% is a notable per-file low. A future WO should triage these and either tighten or document why specific mutants are uninteresting.
- **Did not pin Stryker minor version.** Used `^9` matching fs-packages. If Stryker 9.x ships a breaking change that bumps our score below threshold, we'd notice in CI and could pin then — but a tighter pin upfront would prevent the surprise.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| When reintroducing a tool that was previously retired, pre-commit to its consumer (CI step, monitoring dashboard, lint rule, etc.) in the same PR — not as a follow-up | v1 of Stryker was uninstalled because no consumer ever read its output; v2 only ships if its CI gate ships with it | 2026-05-28-frontend-mutation-testing-v2 |
| For transitive advisory mitigation, try `package.json overrides` before considering tool removal or alternative tools | v1 was dropped partly to close the qs/typed-rest-client chain; v2 closes it via a one-line override, demonstrating that drop was not the only option | 2026-05-28-frontend-mutation-testing-v2 |

---

**Status:** Ready for CI verification
**PR:** _to be linked when filed_
