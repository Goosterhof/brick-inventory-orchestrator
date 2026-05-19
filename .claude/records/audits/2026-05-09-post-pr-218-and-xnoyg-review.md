# Inspection Report: Post-merge PR #218 + unmerged branch xNOYG review

**Report #:** 2026-05-09-post-pr-218-and-xnoyg-review
**Filed:** 2026-05-09
**Inspector:** Building Inspector
**Scope:** Targeted: PR #218 (merged 2026-05-07) + `origin/claude/charming-newton-xNOYG` (unmerged, 2026-05-06 commits)
**Pulse Version:** Assessed 2026-04-11 (health sections) / 2026-03-29 (patterns/quality)
**Triggered By:** CFO request — post-merge audit

---

## Quality Gauntlet Results

| Check         | Result | Notes                                                                                                           |
| ------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| format:check  | Pass   | 488 files checked, all correct                                                                                  |
| lint          | Pass   | 0 warnings, 0 errors (297 files, 251 rules)                                                                     |
| lint:vue      | Pass   | All conventions passed                                                                                          |
| type-check    | Pass   | vue-tsc clean                                                                                                   |
| test:coverage | Pass   | 1310/1310 tests, Lines: 100%, Branches: 100% (coverage run required `--pool=forks` workaround — see note below) |
| knip          | Pass   | No dead code                                                                                                    |
| size          | Pass   | families: 124.59 kB / 350 kB limit; admin: 30.8 kB / 150 kB limit                                               |

**Coverage run environment note:** `npm run test:coverage` fails on the first two runs with `ENOENT: no such file or directory, coverage/.tmp/coverage-N.json` — "Something removed the coverage directory Vitest created earlier." This is a race condition in the parallel multi-project coverage run where one Vitest project deletes the `.tmp` directory while another is still writing to it. Adding `--pool=forks` stabilizes the run. Node.js version is 22.22.2 (`.nvmrc` specifies 24; CLAUDE.md requires 24+). The Node version mismatch may be a contributing factor. The 100% coverage result is confirmed correct once the environment stabilizes.

### Gauntlet Failure Classification

No hard failures. The coverage environment issue (ENOENT on `.tmp`) is a pre-existing environment artifact unrelated to the PR #218 changes. Node 22 vs. required Node 24 is a pre-existing environment constraint.

### Collect Guard Reporter Output

Run under `--pool=forks` with coverage enabled (2x thresholds apply: warn = 400ms delta, violation = 1000ms delta, hard cap = 10000ms raw):

**COLLECT GUARD warnings (delta 200–400ms range):**

| File                                                       | Delta | Raw   | Baseline | Status                                          |
| ---------------------------------------------------------- | ----- | ----- | -------- | ----------------------------------------------- |
| `apps/families/domains/parts/pages/PartsPage.spec.ts`      | 679ms | 889ms | 210ms    | Pre-existing                                    |
| `apps/showcase/components/FormValidationWorkbench.spec.ts` | 557ms | 737ms | 180ms    | Pre-existing                                    |
| `apps/admin/App.spec.ts`                                   | 404ms | 404ms | 0ms      | Pre-existing (single-file project, raw = delta) |

No collect guard violations (delta >= 1000ms) in this run. No files from the PR #218 scope appear in the collect guard output.

**TEST GUARD warnings (600ms threshold in coverage mode):**

| File                                                         | Duration | Tests | Status                                                                    |
| ------------------------------------------------------------ | -------- | ----- | ------------------------------------------------------------------------- |
| `apps/families/domains/sets/pages/SetsOverviewPage.spec.ts`  | 1143ms   | 24    | Pre-existing — worsened from 1056ms last run (2 new tests added in xNOYG) |
| `apps/showcase/components/ComponentGallery.spec.ts`          | 647ms    | 18    | Pre-existing                                                              |
| `apps/families/domains/sets/pages/SetsOverviewTheme.spec.ts` | 639ms    | 13    | Pre-existing                                                              |

All within warning zone (600–4000ms). No test guard violations (failures). The SetsOverviewPage.spec.ts is trending upward: 855ms (2026-04-25) → 1056ms (2026-05-05) → 1143ms (this run). Two new tests were added in xNOYG; those tests contribute to the growth.

---

## Findings

### Architecture / Correctness

1. **`partsLoading` ref is dead code in StorageDetailPage after sequential refactor** `medium`
    - **Location:** `src/apps/families/domains/storage/pages/StorageDetailPage.vue` lines 20, 37-38
    - **Standard:** ADR-006 (resource adapter correctness); general "no inert state that misleads readers"
    - **Observation:** Before PR #218, `onMounted` ran `Promise.all([getOrFailById, getRequest])` — both requests in parallel — then set `loading = false` and `partsLoading = false` at the same time. The intent was that future work could split the two phases (show metadata first, then separately show parts). After the PR, the requests are sequential (store fetch, then parts fetch), and both `loading` and `partsLoading` are still cleared at lines 37-38 in the same tick. Because `adapted.value = storageOption` is set at line 35 before `loading.value = false` at line 37, Vue batches all three reactive assignments — the component transitions directly from outer `LoadingState` to fully-rendered content. The `<LoadingState v-if="partsLoading">` inside `<template v-else-if="adapted">` can never render: `partsLoading` is always `false` by the time `adapted` is truthy. The ref starts as `ref(true)` but exists only to satisfy a dead code path in the template. A new developer reading this will reasonably expect a two-phase load that doesn't exist.
    - **Recommendation:** Remove `partsLoading` ref and the `<LoadingState v-if="partsLoading">` template block, or — if a two-phase load is genuinely desired — move `adapted.value = storageOption` and `loading.value = false` before the parts request and reset `partsLoading = false` after the parts response. The current code claims a design it doesn't implement.

2. **Try-catch in fallback pattern swallows non-`EntryNotFoundError` errors** `low`
    - **Location:** `src/apps/families/domains/storage/pages/EditStoragePage.vue` line 33-38, `src/apps/families/domains/storage/pages/StorageDetailPage.vue` lines 29-33, `src/apps/families/domains/sets/pages/EditSetPage.vue` lines 46-50, `src/apps/families/domains/sets/pages/SetDetailPage.vue` lines 119-124
    - **Standard:** General error handling; CLAUDE.md error handling conventions
    - **Observation:** The bare `catch {}` block silently swallows any error thrown by `getOrFailById`, not just `EntryNotFoundError`. In practice, `getOrFailById` from `fs-adapter-store` only throws `EntryNotFoundError` (confirmed by reading source: `if (!item) throw new EntryNotFoundError(domainName, id)`). However, it also calls `await loadingService.ensureLoadingFinished()` — if the loading service itself throws (e.g., on timeout or internal error), that exception would be silently swallowed and the fallback `retrieveAll()` would run unnecessarily. This is an observation-level concern today but warrants a note. The fallback `getOrFailById` after `retrieveAll()` is unprotected — if the item genuinely doesn't exist on the server, the page will throw an unhandled error.
    - **Recommendation:** Low severity given the current implementation, but worth noting as a future hardening target. If `EntryNotFoundError` is exported from `fs-adapter-store`, narrow the catch: `catch (e) { if (!(e instanceof EntryNotFoundError)) throw e; ... }`. The second `getOrFailById` should also be wrapped or the error surfaced to the user rather than crashing silently.

### Tests

3. **`currentRouteRef` missing from `mockFamilyServices` defaults on main — per-test boilerplate required** `low`
    - **Location:** `src/tests/helpers/mockFamilyServices.ts` (main branch)
    - **Standard:** ADR-012 (typed mock helpers — eliminate per-file duplication); ADR-001 (RouterService as the API surface)
    - **Observation:** PR #218 uses `currentRouteRef` directly in the RegisterPage unit spec (`mockFamilyServices.ts` override in that file). The xNOYG branch adds `currentRouteRef: ref({name: '', path: '', query: {}})` to the `familyRouterService` defaults in `mockFamilyServices.ts`, which is the correct long-term fix. On main, any other spec that needs `currentRouteRef` must redeclare it as an override. The gap exists because PR #218 only fixed the production code and the specific test, but the shared mock wasn't updated to match. This is not a test failure (coverage is 100%) but it is per-spec boilerplate that ADR-012 exists to prevent.
    - **Recommendation:** The xNOYG branch fix is the right approach. When that branch is merged, this is resolved. No action needed if xNOYG merges promptly.

4. **Integration test failures are pre-existing and unresolved (5 failures)** `medium`
    - **Location:** `src/tests/integration/` — 4 test files, 5 tests
    - **Standard:** ADR-013 (page integration tests); 2026-05-05 triage finding (pre-existing)
    - **Observation:** Running `npm run test:integration:run` shows 5 failures across 4 files — the same failures documented in the 2026-05-05-integration-test-baseline-triage report. The failures are hardcoded copy assertion drift (copy changed after brand voice deployment, tests not updated) and one format assertion mismatch. None of these failures are caused by PR #218 or the xNOYG changes. PR #218's new `RegisterPage` integration spec passes cleanly. However, per the casebook, these failures have been silently red for 65+ merges with no CI gate to catch them. The 2026-05-05 report filed this as a high-severity systemic concern (permit 2026-05-05-wire-integration-tests-into-ci).
    - **Recommendation:** No new action needed — this was already escalated. Verify the CI wiring permit is still open and not blocked.

### ADR Compliance

5. **ADR-001: `currentRouteRef` usage is correct — no violation** `observation`
    - **Location:** `src/apps/families/domains/auth/pages/RegisterPage.vue` line 16
    - **Standard:** ADR-001 (RouterService as API surface, no raw `useRouter`/`useRoute`)
    - **Observation:** The PR correctly replaced `useRoute()` from `vue-router` with `familyRouterService.currentRouteRef.value.query.invite`. This is the ADR-001-compliant pattern. `currentRouteRef` is a documented property of the `fs-router` RouterService (verified in the `@script-development/fs-router` type declarations). The fix is correct and there is no violation.
    - **Recommendation:** None. This is a positive confirmation.

---

## Doc Drift

| Document           | Accurate | Drift Found                                                                                                                              |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Domain Map         | Yes      | No drift — all 4 changed pages (RegisterPage, EditSetPage, SetDetailPage, EditStoragePage, StorageDetailPage) are listed correctly       |
| Component Registry | Yes      | `registry:check` passes: 51 components, up to date                                                                                       |
| Pulse              | No       | See Proposed Pulse Updates below — Pattern Maturity and Active Concerns are stale (last assessed 2026-03-29 and 2026-04-11 respectively) |
| CLAUDE.md          | Yes      | No drift from PR scope                                                                                                                   |

---

## Proposed Pulse Updates

1. **Pattern Maturity — "Page integration tests" status.** The current rating of "Battle-tested" is still inaccurate. 5 integration test failures remain red on main, not in any automated gate. The PR #218 added a new integration test (RegisterPage) that passes, which is positive. But the systemic failures from 2026-05-05 are unresolved. The maturity rating should be "Tested, not fully green" or "Active failures" until CI wiring is complete and the copy drift tests are fixed.

2. **Active Concerns — test:coverage race condition (new).** The `ENOENT: coverage/.tmp/coverage-N.json` error under parallel multi-project coverage runs is a new environment behavior seen on this cycle. Root cause is likely the parallel project runner cleaning `.tmp` while another project is writing to it. Node 22 is installed vs. the required Node 24 (.nvmrc). Add as a low-severity active concern: "Coverage parallel race — `npm run test:coverage` fails first 1-2 runs with ENOENT on `.tmp`; `--pool=forks` workaround confirmed; root cause under investigation."

3. **In-Progress Work — update status.** The PR #218 changes are now merged. The `xNOYG` branch (`ecf22b1` + `73b87b0`) has two unmerged commits with clean changes ready for merge. Mark as "pending merge."

4. **Pattern Maturity — "Adapter-store module" — add self-healing fallback pattern.** PR #218 introduced a `try { getOrFailById } catch { retrieveAll; getOrFailById }` pattern across all four detail/edit pages. This is a new sub-pattern of the adapter-store that should be documented. It is now in use across 4 pages, making it "battle-tested" for direct navigation recovery.

---

## Summary

**Overall Health:** 9/10 (unchanged from Pulse — the PR fixes were correctness patches for real bugs, no architectural regression)
**Findings:** 5 total (0 high, 2 medium, 2 low, 1 observation)
**Showcase Readiness:** Portfolio-ready — the fixes are clean, well-commented, and the comment in `main.ts` explaining the auth/router ordering constraint is exactly the kind of documentation that impresses reviewers. The `partsLoading` dead-code issue is the one rough edge.
**Recommendation:** Targeted fixes — specifically the `partsLoading` cleanup in StorageDetailPage. All other findings are either pre-existing systemic issues (integration tests) or the xNOYG branch already has the fix in flight.

---

## Self-Debrief

### What I Caught

- **`partsLoading` dead code** (Finding 1): Caught by reading the diff carefully and tracing the reactive assignments through to their template effects. The original `Promise.all` intent was preserved in the flags but not in the behavior after refactor. SOP 2 (architecture compliance) and the targeted inspection brief both pointed me at StorageDetailPage.
- **Try-catch scope** (Finding 2): Caught by verifying the error type that `getOrFailById` can throw, then checking whether the bare `catch {}` was safe. Confirmed by reading `fs-adapter-store/dist/index.mjs`. Low severity because the error type in practice is constrained, but the unprotected second `getOrFailById` is a real gap.
- **`currentRouteRef` missing from defaults** (Finding 3): Caught by comparing the xNOYG branch diff to main. The fix exists in the branch but not yet on main. Flagged as low since xNOYG likely merges soon.
- **Integration test failures** (Finding 4): Already in casebook. Confirmed they are pre-existing and not caused by this PR.

### What I Missed

- I did not run `npm run test:integration:run` on the xNOYG branch specifically to verify the new tests on that branch pass. The branch isn't checked out in this environment, so I couldn't run that gauntlet in its context. I inspected the diff and verified the tests look correct, but didn't execute them.
- I did not verify whether the `SetsOverviewPage.spec.ts` growth trend (now at 1143ms, up from 855ms across two cycles) crosses into test guard territory under normal (non-forks, non-coverage) mode. It's in warning territory under coverage mode now.

### Methodology Gaps

- SOP 1 notes that `npm run test:integration:run` should be run when the scope includes page composition or cross-domain integration work. The RegisterPage integration spec is new in this PR. I ran the integration suite and confirmed it passes for RegisterPage. The pre-existing 5 failures are out of scope for this PR but still surfaced, which is the correct behavior.
- The Node.js version mismatch (22 vs 24 required) caused the coverage parallel race. SOP 1 doesn't currently specify checking the Node version before running coverage. This is worth noting.

### Training Proposals

| Proposal                                                                                                                                                                                                                                                                       | Context                                                                                                                                                                | Report Evidence                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| SOP 1 should check Node.js version against `.nvmrc` before running `test:coverage` — version mismatch is a likely cause of the coverage `.tmp` race condition, and early detection prevents two failed runs before finding the workaround                                      | The ENOENT on `.tmp` only appeared in this environment where Node 22 is running vs. the required Node 24; this would have been caught immediately with a version check | 2026-05-09-post-pr-218-and-xnoyg-review |
| SOP 5 (tech debt) should include: after any sequential refactor that converts `Promise.all` to sequential awaits, verify that any "loading phase" state variables are still reachable in the template — they may become dead code when both flags are cleared in the same tick | The `partsLoading` dead code in StorageDetailPage was introduced by exactly this refactor pattern                                                                      | 2026-05-09-post-pr-218-and-xnoyg-review |

---

## CFO Evaluation

**Assessment:** Thorough

### Findings Review

Calibration is correct across the board. Finding 1 (`partsLoading` dead code) deserves medium — it is not a crash but it actively lies to the next developer who reads the component: the two-phase load affordance is gone but the scaffolding remains. Finding 2 (bare catch) is correctly low; the `fs-adapter-store` source confirms the error domain is narrow. I would have accepted high only if the second unprotected `getOrFailById` were in a path that could silently strand the user — it can throw an unhandled error, but the crash surface is narrow and recoverable on reload. Findings 3 and 4 are pre-existing; both correctly scoped to "no action needed here."

The ADR-001 compliance observation is worth keeping — positive confirmation in a report is useful signal for the Graduation Log when patterns are actively under watch.

### Training Proposal Dispositions

| Proposal                                                                                      | Disposition | Rationale                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SOP 1: check Node version against `.nvmrc` before `test:coverage`                             | Candidate   | First confirmed instance of this catch. The coverage ENOENT was also resolved this session by adding `pretest:coverage` cleanup, which eliminated the symptom. The Node version check is still worth adding as a separate guard. Needs one more session to graduate. |
| SOP 5: after Promise.all → sequential refactor, verify loading state vars are still reachable | Candidate   | First confirmed instance. The partsLoading dead code is a clean example of exactly this failure mode. Needs one more session to graduate.                                                                                                                            |

### Notes for the Inspector

Solid methodology. Two specific observations: (1) the coverage environment note is detailed and useful — the `--pool=forks` workaround is documented correctly, though note that this session's architect has already added a `pretest:coverage` cleanup script that resolves the ENOENT without needing `--pool=forks`, so the Active Concerns pulse entry should reflect the fix rather than just the workaround. (2) Calling out the `SetsOverviewPage.spec.ts` timing trend (855ms → 1056ms → 1143ms across three cycles) without escalating is the right call — it is in warning territory, not violation territory, and the cause is attributable. Worth monitoring one more cycle before flagging.
