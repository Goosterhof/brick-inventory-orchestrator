# Inspection Report: Integration-Test Baseline Triage

**Report #:** 2026-05-05-integration-test-baseline-triage
**Filed:** 2026-05-05
**Inspector:** Building Inspector
**Scope:** Targeted: integration test suite failure triage
**Pulse Version:** Assessed 2026-04-11
**Triggered By:** Post-permit: 2026-05-05-integration-test-baseline-triage (CFO + CEO authorization)

---

## Quality Gauntlet Results

Gauntlet not run in full — permit explicitly narrows scope to integration-test triage only. Unit coverage, knip, size, lint, and type-check are out of scope for this shift. Integration suite run in place of the standard gauntlet.

| Check                | Result | Notes                                                     |
| -------------------- | ------ | --------------------------------------------------------- |
| test:integration:run | FAIL   | 5 failures in 4 files; 121 passing; total duration 19.37s |

The 5 failures match the permit's verbatim expected/received strings. No additional failures discovered beyond the 5 listed in the permit.

---

## Per-Failure Diagnostics

### Failure 1: BrickDnaPage — "renders real EmptyState when API returns no data"

**File:** `src/tests/integration/apps/families/domains/brick-dna/pages/BrickDnaPage.spec.ts:66`

**Failure Signature:**

```
Expected: "No collection data available yet"
Received: "No DNA profile yet. Add some sets and we'll map your building fingerprint."
```

**Root Cause Classification:** Stale assertion

The test asserts hardcoded English text that was a valid translation value at the time the assertion was written — but the translation key `brickDna.empty` has since been updated with brand voice copy. The test was written in `e24b0d3` (2026-03-31) asserting `"No collection data available yet"`, but by that date the translation had already been updated to the current value by `4af9452` (2026-03-30 00:43 UTC, "feat: deploy brick character infrastructure into Families app"). The assertion was stale from its first commit.

**Introducing Commit:** `4af9452` (2026-03-30, direct push to branch, merged via PR into main)

The commit that changed `brickDna.empty` from `"No collection data available yet. Add some sets to see your Brick DNA profile."` to `"No DNA profile yet. Add some sets and we'll map your building fingerprint."`. The BrickDnaPage integration spec (`64896f3`, 2026-03-29) initially asserted the translation key itself (`"brickDna.empty"`), not the resolved value. The mock-server refactor (`e24b0d3`, 2026-03-31) replaced this with a hardcoded English string — but used a value already superseded 19 hours earlier.

**Time-to-Detection Cost:** 65 merges since the mock-server refactor commit that locked in the stale assertion.

**Fix Scope:** Small — one-line update: change `'No collection data available yet'` to `'No DNA profile yet. Add some sets and we\'ll map your building fingerprint.'`

**Severity:** Low — no production regression; only the integration assertion is stale.

---

### Failure 2: HomePage — "renders dashboard with real PageHeader and StatCards when logged in"

**File:** `src/tests/integration/apps/families/domains/home/pages/HomePage.spec.ts:55`

**Failure Signature:**

```
Expected: "Dashboard"
Received: "Build Control"
```

**Root Cause Classification:** Stale assertion

Test asserts `pageHeader.find('h1').text()` equals `"Dashboard"`. The production page renders `t('home.dashboardTitle').value`. The translation key `home.dashboardTitle` was changed from `"Dashboard"` to `"Build Control"` in commit `c6e2547` (2026-03-30, "feat: rewrite translation keys with brand voice (EN partial)"). The integration test suite was created on 2026-03-27 (`60558ab`) asserting the pre-brand-voice value.

**Introducing Commit:** `c6e2547` (2026-03-30, direct push to branch). Author: Claude. The commit explicitly modified `home.dashboardTitle` from `"Dashboard"` to `"Build Control"` without updating the HomePage integration spec.

**Time-to-Detection Cost:** 66 merges since `c6e2547`.

**Fix Scope:** Small — one-line update: change `'Dashboard'` to `'Build Control'`

**Severity:** Low — no production regression; only the integration assertion is stale.

---

### Failure 3: HomePage — "shows loading state before stats resolve"

**File:** `src/tests/integration/apps/families/domains/home/pages/HomePage.spec.ts:88`

**Failure Signature:**

```
Expected: "Loading your collection..."
Received: "Build ControlUnpacking your collection..."
```

**Root Cause Classification:** Stale assertion (two stale values in one test)

The test checks `wrapper.text()` contains `"Loading your collection..."`. The production page renders `t('home.loadingStats').value` inside the dashboard branch — but only when `loading` is `true`. The received string `"Build ControlUnpacking your collection..."` reveals that the PageHeader title ("Build Control", previously "Dashboard") and the loading text ("Unpacking your collection...", previously "Loading your collection...") are both captured.

Both translation keys were changed in `c6e2547` (same commit as Failure 2): `home.loadingStats` from `"Loading your collection..."` to `"Unpacking your collection..."`.

**Introducing Commit:** `c6e2547` (2026-03-30, same as Failure 2)

**Time-to-Detection Cost:** 66 merges since `c6e2547`.

**Fix Scope:** Small — one-line update: change `'Loading your collection...'` to `'Unpacking your collection...'`

**Severity:** Low — no production regression; only the integration assertion is stale.

---

### Failure 4: AddSetPage — "renders real SelectInput with status options"

**File:** `src/tests/integration/apps/families/domains/sets/pages/AddSetPage.spec.ts:56`

**Failure Signature:**

```
Expected: 5 options
Received: 6 options
```

**Root Cause Classification:** Stale assertion

The test asserts `options.toHaveLength(5)`. Production `AddSetPage.vue` defines a `statusOptions` array with six entries: `sealed`, `built`, `in_progress`, `in_storage`, `incomplete`, `wishlist`. The `in_storage` entry was added in `3a768c1` (2026-05-05, PR #208: "feat: add in_storage set status across families app and showcase"), merged as `ce812f7`. The integration test was not updated when the status was added.

**Introducing Commit:** `ce812f7` / `3a768c1` (2026-05-05, landed via PR #208 with code review)

**Time-to-Detection Cost:** 2 merges since PR #208 (PRs #209 and #210).

**Fix Scope:** Small — one-line update: change `toHaveLength(5)` to `toHaveLength(6)`. The permit also flagged this as the likely culprit based on PR #208.

**Severity:** Low — no production regression; the new status option is working correctly.

---

### Failure 5: StorageOverviewPage — "renders real EmptyState when no storage options"

**File:** `src/tests/integration/apps/families/domains/storage/pages/StorageOverviewPage.spec.ts:49`

**Failure Signature:**

```
Expected: "No storage locations yet"
Received: "No storage bins yet. Every brick needs a home."
```

**Root Cause Classification:** Stale assertion

The test asserts `emptyState.text()` contains `"No storage locations yet"`. The production page renders `t('storage.noStorage').value`. That key was changed from `"No storage locations yet. Add your first storage location!"` to `"No storage bins yet. Every brick needs a home."` in `4af9452` (2026-03-30, "feat: deploy brick character infrastructure into Families app"). The StorageOverviewPage integration spec was created in the original ADR-013 commit (`60558ab`, 2026-03-27) with the pre-brand-voice value, then left unsynced after the character deployment.

**Introducing Commit:** `4af9452` (2026-03-30, direct push to branch)

**Time-to-Detection Cost:** 65 merges since the mock-server refactor that locked in the stale value (same epoch as Failure 1).

**Fix Scope:** Small — one-line update: change `'No storage locations yet'` to `'No storage bins yet. Every brick needs a home.'`

**Severity:** Low — no production regression; only the integration assertion is stale.

---

## Systemic Findings

### Q1: Why Doesn't the Pre-Push Gauntlet Run Integration Tests?

**Finding (medium severity)**

**Evidence:**

The pre-push hook at `.husky/pre-push` contains:

```
npm run type-check && npm run knip && npm run test:coverage && npm run build
```

The `test:integration:run` script is absent. The CI workflow at `.github/workflows/ci.yml` also has no `test:integration:run` step (confirmed by grepping the file — zero references to `test:integration*`).

**Root cause:** No documented decision. ADR-013 specifies a separate Vitest config and separate npm scripts but says nothing about pre-push execution. The ADR's Enforcement section lists four mechanisms (architecture test, lint rule, test-guard reporter, separate coverage config) — none of which include CI or pre-push inclusion. The Open Questions section at the bottom of ADR-013 does not address pre-push inclusion either.

This is a documentation gap, not an intentional exclusion. There is no ADR, comment in the pre-push hook, or package.json note indicating the integration suite was deliberately kept off the merge gate. The integration suite was created knowing it would be "slower than unit tests" (ADR-013 notes ~100-300ms per file vs ~50-150ms for unit tests) — the actual total runtime confirmed today is **19.37 seconds**. The unit gauntlet's `test:coverage` (all 4 apps + coverage instrumentation) typically takes 30-60 seconds in CI. At 19.37s, integration tests add roughly one-third to the test phase — non-trivial but proportionate.

**Assessment given CEO directive:** The CEO has decided integration tests must run in CI. The historical reason for the absence is not a deliberate "too slow" call — it was an unaddressed open question left after ADR-013 was accepted. The 19.37s runtime does not justify continued exclusion. The same discipline that governs the pre-push gauntlet (type-check → knip → test:coverage → build, all must pass) should govern the integration layer.

---

### Q2: Is the Integration Suite Actually Run Anywhere?

**Finding (high severity)**

**Evidence (grep results):**

- `.husky/pre-push`: references `test:coverage` only. Zero references to `test:integration*`.
- `.github/workflows/ci.yml`: references `npm run test:coverage` only. Zero references to `test:integration*`.
- `package.json`: defines `test:integration` (watch) and `test:integration:run` (single-run) scripts. Both exist. Neither is invoked by any automated process.

**Conclusion: The integration suite has no automated execution path.** It exists in `package.json` and has a passing 121/126 test record — but only when a developer manually runs `npm run test:integration:run`. No process enforces this. The 5 failing tests have been silently red on `main` for at minimum 65 merges because no automated gate caught them.

This is the systemic finding. The 5 individual failures are the symptom. The absence of any automated run is the cause.

---

### Q3: How Should Integration Tests Be Wired Into CI?

**Recommendation**

**CI landscape:** One workflow file exists: `.github/workflows/ci.yml`. It runs on push to `main` and on pull requests targeting `main`. It currently runs 9 sequential steps: Checkout, Setup Node, Install deps, Lint, Lint:vue, Knip, Format check, Type check, Test with coverage, Build, Bundle size, Commit lint (PR only).

**Recommendation: Add `test:integration:run` as a required merge gate in the existing `ci.yml` workflow.**

Rationale for placement decisions:

1. **Target file:** `.github/workflows/ci.yml` — not a new workflow. The integration tests are not a separate concern worthy of a separate YAML file; they are part of the test suite. Adding a separate `integration.yml` would create two status checks that PRs must watch, adding cognitive overhead. One CI file, one status check.

2. **Placement in step order:** After `Test with coverage` (unit tests), before `Build`. The unit suite must pass first — if unit tests are broken, integration results are noise. The build can fail independently of integration tests.

3. **Trigger:** Both `push` to `main` and `pull_request` — same as the existing job. The directive is to gate merges; PR-only would leave direct pushes to `main` unguarded.

4. **Merge-gating posture:** Required check (not allowed-failure). The CEO directive is explicit. The 19.37s runtime is not a valid exemption. Allowed-failure is the mechanism that created this problem — it would be ironic to reproduce it.

5. **Parallel vs serial:** Run serially in the same job, not a parallel job. A parallel job would shave ~19s off wall-clock time but adds job-setup overhead (~45-60s for Checkout + Setup Node + npm ci) that exceeds the savings. The current CI job runs all 11 steps in sequence anyway. Serial is simpler and correct.

6. **Fail-fast vs run-to-completion:** Run-to-completion. This matches the firm's discipline on the unit gauntlet — all 7 stages run before failing. For integration tests: if BrickDnaPage fails but StorageOverviewPage passes, both results should be visible in the CI log so fixes can be batched, not serialized.

**Recommended CI diff (exact step to add to `.github/workflows/ci.yml`):**

```yaml
- name: Integration tests
  run: npm run test:integration:run
```

Insert this step between `Test with coverage` and `Build` in the `ci.yml` steps list. No additional configuration is required — the integration config (`vitest.integration.config.ts`) is self-contained and the Node/npm environment is already set up by the preceding steps.

**Implementation note for the architect:** The `test:integration:run` command runs to completion and exits with code 1 if any test fails. GitHub Actions will mark the step as failed and the check as blocking. No additional flags needed. The current integration output format (Vitest's default reporter) is sufficient for CI log readability.

---

## Findings

### Tests

1. **Five integration tests assert copy that was updated by brand voice / feature work** `severity: low`
    - **Locations:** BrickDnaPage.spec.ts:66, HomePage.spec.ts:55+88, AddSetPage.spec.ts:56, StorageOverviewPage.spec.ts:49
    - **Standard:** Integration tests must assert user-visible text that matches production rendering (ADR-013 Mock Boundary Evolution section)
    - **Observation:** All 5 are stale assertions — the production translations and feature options are correct; the test strings hardcode values that changed. No genuine production regressions. 4 of 5 are copy updates from the neo-brutalist brand voice deployment (2026-03-30); 1 of 5 is a feature option count that wasn't updated when `in_storage` status was added (2026-05-05).
    - **Recommendation:** Fix all 5 in a single architect permit (see prioritization below).

### Architecture / Process

2. **Integration suite has no automated execution path — decoupled from every merge gate** `severity: high`
    - **Location:** `.husky/pre-push`, `.github/workflows/ci.yml`, `package.json`
    - **Standard:** No ADR exists that excludes integration tests from the merge gate — this is a gap, not a decision. ADR-013's Enforcement section does not address pre-push or CI inclusion.
    - **Observation:** Both the pre-push hook and the CI workflow run only `test:coverage` (unit suite). `test:integration:run` is unreachable from any automated process. The 5 failing tests have been silently red for 65+ merges with no automated signal.
    - **Recommendation:** Wire `test:integration:run` into `.github/workflows/ci.yml` as a required merge gate (see Q3 above for exact specification). File a separate architect permit for this CI change.

---

## Prioritized Recommendation

**Fix order:**

1. **Immediate (Permit A — per-failure fixes):** All 5 stale assertions should be fixed in a single architect permit. They are all small (one-line assertion updates), all in the integration test layer, and are blocking a clean CI baseline. Fix all 5 before wiring CI — otherwise the first CI run will fail on the stale assertions and the green baseline is never established.

2. **After Permit A (Permit B — CI wiring):** Wire `test:integration:run` into CI after the test suite is clean. This ensures the first gated run is green, establishing a baseline that future changes must maintain.

**Proposed follow-up permit slugs:**

- `2026-05-05-fix-integration-test-assertions` — architect repairs all 5 stale assertions (small scope, all one-line updates)
- `2026-05-05-wire-integration-tests-into-ci` — architect adds the `test:integration:run` step to `.github/workflows/ci.yml`

---

## Doc Drift

Gauntlet scope is narrowly integration tests. Full doc audit is out of scope for this permit. The following observations surfaced incidentally and are flagged for CFO awareness:

| Document  | Accurate | Drift Found                                                                                                                                                                                                                                      |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pulse     | Partial  | "Integration tests: Battle-tested" in Pattern Maturity table — 5 failing tests and no CI wiring undermine this claim. Recommend CFO update Pulse to note the active test failures and the CI gap.                                                |
| ADR-013   | Partial  | Open Questions section does not include "should integration tests run in CI?" — now resolved by CEO directive. After CI wiring is delivered, ADR-013 Enforcement section should be updated to add "test:integration:run in CI as required gate." |
| CLAUDE.md | Accurate | Pre-push gauntlet documented accurately — it runs type-check, knip, test:coverage, build. Accurate as-written; the gap is that integration tests are absent, not that the doc is wrong.                                                          |

## Proposed Pulse Updates

- Pattern Maturity: "Page integration tests (ADR-013)" status should be downgraded from "Battle-tested" to "Active gap: 5 failing tests, no CI wiring" until both follow-up permits are delivered.
- Active Concerns: Add "Integration suite decoupled from merge gate — 5 silent test failures" (high, active).

---

## Summary

**Overall Health:** Not rated — this inspection is narrowly scoped to integration-test triage, not a full sweep.
**Findings:** 2 total (0 high on individual failures, 1 high systemic, 1 medium systemic)
**Showcase Readiness:** Concern — a senior reviewer cloning this repo and running `npm run test:integration:run` would see 5 red tests on a green `main`. The copy changes are brand-consistent and correct in production; only the test assertions are stale. But stale tests on main with no CI gate is a portfolio signal that cuts against the "disciplined engineering team" narrative.
**Recommendation:** Targeted fixes — two follow-up permits (per-failure assertion fixes first, then CI wiring).

**Overall cluster severity:** Medium — not regressions in production, but a systemic process gap that allowed 5 integration tests to fail silently for 65+ merges. The gap closes with two permits.

---

## Self-Debrief

### What I Caught

- All 5 failures diagnosed to the specific introducing commit, root cause class, and fix scope as specified by the permit. No failures left incomplete.
- Discovered that Failure 1's assertion was stale from the moment it was written — the mock-server refactor (`e24b0d3`, Mar 31) hardcoded a value that had already been changed the previous day. This is a sharper finding than "the translation changed after the test was written."
- Q1 and Q2 confirmed: no documented decision excluding integration tests from the gate, and the suite has zero automated execution paths. The systemic gap is clear.
- Q3 recommendation is specific: exact workflow file, exact step, exact placement, exact rationale for serial-not-parallel and run-to-completion.

### What I Missed

- Did not investigate whether any `git stash` baseline or manual invocation by the architect in the predecessor journals (`2026-05-03-invite-code-by-email`, `2026-05-05-snake-case-payload-keys-cleanup`) could have caught these earlier. This is historical; it doesn't change the diagnosis.
- Did not audit the integration suite's remaining 121 passing tests for quality depth. The permit did not require this, but a future inspection of the integration layer should sample assertion depth (L0/L1/L2/L3) across passing tests to verify they're catching real composition issues.

### Methodology Gaps

- SOP 7 (test quality audit) has a sampling step for unit tests (3 test files, rate assertion depth). There is no equivalent SOP for the integration layer. Integration tests serve a different purpose than unit tests (composition proof vs logic proof), and their assertion depth should be evaluated differently — an integration test that checks `emptyState.exists() === true` without asserting the message content is L0, which is too shallow for a suite meant to catch composition failures.
- SOP 1 (quality gauntlet) does not include `test:integration:run`. For post-permit inspections that touch page composition, the integration suite should be in scope.

### Training Proposals

| Proposal                                                                                                                                                                                                                                         | Context                                                                                                                                                                                                                                               | Report Evidence                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| SOP 1 (quality gauntlet) should include `npm run test:integration:run` when the inspection scope includes page composition or cross-domain integration work                                                                                      | Integration suite is not in the standard gauntlet, so it can fail silently on every inspection without triggering a finding — this exact scenario happened across 65+ merges                                                                          | 2026-05-05-integration-test-baseline-triage |
| SOP 7 (test quality audit) should add a paragraph for integration test assertion depth: integration tests that assert only component existence (L0) without asserting rendered content provide no detection advantage over unit tests with stubs | Stale copy assertions (Failures 1–3, 5) were caught precisely because the mock-server refactor upgraded assertions from translation-key checks to user-visible text checks. A future regression to L0 assertions would lose that detection capability | 2026-05-05-integration-test-baseline-triage |

---

## CFO Evaluation

_Appended 2026-05-05 by the CFO after reviewing the report and verifying its claims independently against the codebase._

**Assessment:** Thorough

### Findings Review

The Inspector delivered exactly what the permit demanded, plus one calibration step the CFO would not have asked for explicitly but is glad to see: the time-to-detection metric in merges is the right unit for "how long did this fail silently?" — not days, not commits, but merges-since-introducing-commit. That's the unit that matches how the firm thinks about the merge gate.

CFO independently verified the Q1/Q2 grep claims:

- `.husky/pre-push` runs only `type-check && knip && test:coverage && build` — no `test:integration*` reference. Confirmed.
- `.github/workflows/ci.yml` has 11 sequential steps; only `Test with coverage` runs unit tests. No `test:integration*` reference. Confirmed.
- The Q3 placement recommendation ("between `Test with coverage` and `Build`") is correct given the actual `ci.yml` step order. Confirmed.

Severity calibration looks right. All five failures are genuinely Low individually (no production regressions; only stale assertions in test code). The systemic cluster severity of Medium with one High systemic finding (Q2: no automated execution path) is well-calibrated. CFO would have considered going harder on Q2 — "every merge for 65 cycles passed CI green while integration tests sat red" is a pretty direct portfolio signal — but Medium-overall + High-on-Q2 communicates the same posture and lets the architect's two follow-up permits do the actual work.

The Inspector's sharpest finding is on Failure 1 (BrickDnaPage): "stale from the moment it was written — the mock-server refactor hardcoded a value that had already been changed the previous day." That's the kind of detail the CFO did not ask for and the permit did not require. It's also the detail that makes the architect's eventual fix more informed: knowing that `e24b0d3` locked in a value that was already obsolete tells the architect to verify the _current_ translation when fixing, not the value the test asserts.

**One calibration concern the CFO would add to the report:**

- **Failure 4 (AddSetPage option count) is fresh.** It was introduced 2026-05-05 by PR #208, which is _today_. The Inspector noted this in the time-to-detection cell ("2 merges since PR #208") but did not draw the obvious process implication: PR #208 shipped without integration test verification. CI was green at merge time because integration tests aren't gated; the architect or reviewer who shipped PR #208 had no signal that integration coverage was incomplete. The other 4 failures are 65-merge-old skeletons; this one is hours old and arose from the same gap that the rest of the report addresses. The CFO is flagging this to the CEO not as a finding to add (the Inspector's writeup already names PR #208) but as a process signal — until Permit B (CI wiring) lands, every merge has the same exposure that PR #208 had today.

The Doc Drift section is honestly out-of-scope but the Pulse observation is correct: claiming "Battle-tested" while five tests are silently red is a credibility issue. CFO will downgrade Pulse Pattern Maturity for ADR-013 after Permit A delivers; until then, the report's flag stands.

### Training Proposal Dispositions

| Proposal                                                                                                                                                                                                                                         | Disposition   | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SOP 1 (quality gauntlet) should include `npm run test:integration:run` when the inspection scope includes page composition or cross-domain integration work                                                                                      | **Candidate** | Genuinely useful as a backup detection layer — the Inspector catches integration-suite regressions independently of CI gating. CFO note: once Permit B lands and CI gates integration tests, this candidate becomes a "second-line" check rather than the primary detection mechanism. Still valuable: an inspector running a post-permit audit on a feature branch _before_ CI runs benefits from running the integration suite locally. Tracking.                                                                                                        |
| SOP 7 (test quality audit) should add a paragraph for integration test assertion depth: integration tests that assert only component existence (L0) without asserting rendered content provide no detection advantage over unit tests with stubs | **Candidate** | Strong proposal. The L0/L1/L2/L3 framework currently exists for unit tests but not integration tests, despite their different purpose (composition proof vs logic proof). The Inspector's evidence is precise: failures 1, 2, 3, and 5 were detectable specifically because the mock-server refactor upgraded assertions from key-checks to user-visible-text checks. A regression to `emptyState.exists() === true` would lose that detection capability silently. This is exactly the kind of methodology evolution that earns SOP graduation. Tracking. |

Both proposals tracked as fresh candidates. Neither matches an existing candidate. Promotion requires one more inspection where the SOP enhancement's value is demonstrably exercised — i.e., a future inspection where running the integration suite as part of the gauntlet catches a finding the unit gauntlet missed (SOP 1 confirmation), or where assertion-depth audit catches an L0 integration test that the inspector flags as too-shallow (SOP 7 confirmation).

### Notes for the Inspector

Repeat:

- **Time-to-detection in merges, not days.** This is the right unit and the CFO did not have to ask for it. Keep applying this metric whenever a finding involves "how long has this been broken."
- **The "stale from the moment it was written" framing on Failure 1.** That's the kind of forensic precision that turns a generic "stale assertion" finding into actionable diagnosis. The architect fixing Permit A will know to verify against the _current_ translation, not assume the test's expected value was ever correct.
- **Q3's specificity.** Exact step, exact placement, exact rationale for serial-not-parallel and run-to-completion. The architect's follow-up permit will be a 5-line YAML diff because this report did the design work. That's the inspector role at its sharpest.
- **Honest scope boundaries.** The Self-Debrief acknowledges what the report did _not_ audit (assertion-depth across the 121 passing tests, the predecessor journals' baseline runs) without trying to fold those into this report. That discipline keeps reports focused.

Do differently:

- **Connect process signals across findings when they share a root cause.** Failure 4's freshness (2 merges old, introduced today by PR #208) is not just a per-failure detail — it's evidence that the same gap that rotted the brand-voice failures over 65 merges is _still active_ and produced a fresh failure in the most recent merge cycle. The inspection report mentions PR #208 in the time-to-detection cell but does not draw this connection in either the Findings section or the Summary. A future inspection where two findings share a root cause should explicitly note "these are not independent — they are the same gap, operative at different points in time."

The CFO is satisfied with the two follow-up permit proposals. **Permit A first** (`2026-05-05-fix-integration-test-assertions`) so the suite is clean before CI gates it. **Permit B second** (`2026-05-05-wire-integration-tests-into-ci`) to lock in the gate. The CEO has authorized the directive; the CFO will file both permits when ready.
