# Inspection Report: Post-Creative-Engine Full Sweep

**Report #:** 2026-04-11-post-creative-engine-audit
**Filed:** 2026-04-11
**Inspector:** Building Inspector
**Scope:** Full Sweep — all SOPs 1-7
**Pulse Version:** Assessed 2026-03-29
**Triggered By:** CFO request — two-week gap, six permits delivered, Creative Engine agent added

---

## Quality Gauntlet Results

| Check         | Result | Notes                                                                     |
| ------------- | ------ | ------------------------------------------------------------------------- |
| format:check  | Pass   | 430 files, all formatted correctly                                        |
| lint          | Pass   | 0 warnings, 0 errors, 278 files, 241 rules                                |
| lint:vue      | Pass   | All conventions passed                                                    |
| type-check    | Pass   | vue-tsc clean                                                             |
| test:coverage | Pass   | 100% lines, branches, functions, statements — 1182 tests, 103 files       |
| knip          | Pass   | No dead code                                                              |
| size          | Pass   | families: 117.53 kB brotli (limit 350 kB), admin: 30.79 kB (limit 150 kB) |

### Collect Guard Reporter Output (captured separately per casebook candidate SOP-1)

```
COLLECT GUARD Warning — import chain getting heavy:
  Threshold: 400ms delta (coverage mode: 2x)
  [showcase/components] 590ms delta | apps/showcase/components/FormValidationWorkbench.spec.ts
  [families/about] 551ms delta | apps/families/domains/about/pages/AboutPage.spec.ts  ← NEW

TEST GUARD Warning:
  Threshold: 300ms
  [families/sets] 855ms | SetsOverviewPage.spec.ts
  [showcase/components] 808ms | ComponentGallery.spec.ts
```

### Gauntlet Failure Classification

All checks passed. No classification needed.

---

## Findings

### Architecture

1. **ADR-004 violation: `deepSnakeKeys` imported directly from `string-ts` in `auth/index.ts`** `severity: medium`
    - **Location:** `src/shared/services/auth/index.ts` lines 2 and 8
    - **Standard:** ADR-004 — case conversion happens at the HTTP boundary through `@shared/helpers/string` wrapper
    - **Observation:** `import type {DeepSnakeKeys} from "string-ts"` and `import {deepSnakeKeys} from "string-ts"` bypass the documented wrapper entirely. The `useValidationErrors.ts` violation flagged in the 2026-03-29 inspection was fixed (now correctly imports from `@shared/helpers/string`), but `auth/index.ts` was missed. Both files are in `src/shared/services/` — the rebuttal-fixes delivery that repaired `useValidationErrors.ts` should have caught this neighbor at the same time.
    - **Recommendation:** Replace `import {deepSnakeKeys} from "string-ts"` with `import {deepSnakeKeys} from "@shared/helpers/string"` and remove the `DeepSnakeKeys` type import from `string-ts` (use the function's return type inference instead, or import the type from `@script-development/fs-helpers` if needed directly).

2. **Pulse not updated since 2026-03-29 — six permits delivered, zero pulse updates** `severity: medium`
    - **Location:** `.claude/docs/pulse.md`
    - **Standard:** Operations Protocol — pulse is the living snapshot architects read before touching code; it is expected to be current
    - **Observation:** The assessed date on all Pulse sections is 2026-03-29. In the two weeks since, six permits were delivered: SVG brick, shape components, router migration, page transition system, page transition refactor, and defineExpose removal. None of these are reflected. Pattern Maturity table still lists "RouterService wrapper: Battle-tested — All routed apps use it" without noting the migration to `@script-development/fs-router`. Active Concerns lists the Vue Router `next()` deprecation (resolved by router migration) and the SettingsPage collect guard (resolved by split into three files). In-Progress Work still shows empty after major deliveries. The Creative Engine agent (ADR-015) is absent from all sections. This is the fifth consecutive inspection where the Pulse lags behind reality. At four consecutive misses, the casebook escalation rule triggers (see Recurring Patterns section).
    - **Recommendation:** CFO to update the Pulse immediately after this report is filed. The following sections need updates: (1) Overall Health rating; (2) Active Concerns — remove resolved items, add new collect guard breach (AboutPage.spec.ts); (3) Pattern Maturity — RouterService updated to note package migration, add Page Transition System (new from Creative Engine), add Creative Engine agent/animation pattern; (4) In-Progress Work — clear stale entries.

### Documentation

3. **Domain map missing two Showcase components: `BrickShapes` and `PageTransitionDemo`** `severity: low`
    - **Location:** `.claude/docs/domain-map.md` — Showcase App components list
    - **Standard:** SOP 3 domain map accuracy; domain-map.md states "Update this when adding or modifying domains"
    - **Observation:** The Showcase app's components list in the domain map ends with `MiddlewarePipelineVisualizer`. `BrickShapes` (added 2026-04-06) and `PageTransitionDemo` (added 2026-04-09) are absent. Seventeen components exist in `src/apps/showcase/components/` but only fifteen appear in the domain map. The architecture test verifies domain directories, not showcase component lists — so this is not caught automatically.
    - **Recommendation:** Add `BrickShapes` and `PageTransitionDemo` to the Showcase section of the domain map.

4. **`design-cycle.md` references `.feature-brief-template.md` and `.component-spec-template.md` — both exist (doc is accurate)** `severity: n/a`
    - Verified: both template files present. This is a confirmation, not a finding.

### Tests / Collect Guard

5. **New collect guard breach: `AboutPage.spec.ts` at 551ms delta** `severity: medium`
    - **Location:** `src/tests/unit/apps/families/domains/about/pages/AboutPage.spec.ts`
    - **Standard:** ADR-010 collect-duration guard (400ms delta threshold in coverage mode)
    - **Observation:** The spec imports 16 Lego shape/brick components by name at the top level, then `vi.mock()`s most of them. Even with mocks, the import resolution chain is heavy: 16 component imports trigger 16 module resolutions before any test runs. The collect delta is 551ms (threshold 400ms in coverage 2x mode, 200ms baseline mode). This is a direct consequence of the AboutPage adding HTML/SVG LEGO shape dioramas during the 2026-04-06 shape permit — the test file grew to match but the collect guard was not checked. The journal's gauntlet table showed "Pass" for all checks, which means the collect guard output was not captured or reviewed separately.
    - **Recommendation:** Refactor the spec to reduce the import chain. Options: (a) replace explicit named imports with stubs defined inline without importing the real module; (b) split the about-page tests by concern (brick-demo tests vs. layout/content tests) following the Theme Atlas / SetsOverviewPage split pattern. The 551ms delta will worsen if AboutPage adds more shape components.

### Casebook Standing Items (Status Updates)

The following casebook suspicions are updated by this inspection:

- **ADR-004 case conversion drift** — Partially resolved. `useValidationErrors.ts` now correctly imports from `@shared/helpers/string`. New violation found: `auth/index.ts` imports directly from `string-ts`. Filed as Finding 1 above. Suspicion remains active with new target file.
- **Vue Router next() deprecation** — Resolved. The router migration to `@script-development/fs-router` uses the return-value middleware pattern throughout. No deprecated `(to, from, next)` signatures present. No deprecation warnings in test output. Suspicion closed.
- **SettingsPage.spec.ts collect guard** — Resolved. File split into three: `SettingsPageConfig.spec.ts` (525 lines), `SettingsPageMembers.spec.ts` (652 lines), `SettingsPageTheme.spec.ts` (130 lines). No SettingsPage breach in this run. Suspicion closed.
- **Pulse quality metrics staleness** — Still active, now fifth consecutive inspection. Casebook escalation rule fires. See Finding 2 above and Recurring Patterns update.
- **ComponentGallery.spec.ts collect guard** — Still active. 808ms execution time (TEST GUARD). Root cause unresolved.

---

## Doc Drift

| Document           | Accurate | Drift Found                                                                             |
| ------------------ | -------- | --------------------------------------------------------------------------------------- |
| Domain Map         | Partial  | Showcase component list missing `BrickShapes` and `PageTransitionDemo` (2 of 17 absent) |
| Component Registry | Yes      | `registry:check` passes — 48 components, registry is current                            |
| Pulse              | No       | All sections assessed 2026-03-29; six permits and Creative Engine agent not reflected   |
| CLAUDE.md          | Yes      | Conventions match actual code patterns; no drift found                                  |

---

## Proposed Pulse Updates

1. **Overall Health** — Maintain 9/10. Gauntlet fully green, architecture clean, new collect guard breach is medium severity and bounded.

2. **Active Concerns** — Remove: SettingsPage collect guard (resolved by split), Vue Router next() deprecation (resolved by router migration). Add: `AboutPage.spec.ts` collect guard breach (Medium, 551ms delta — new violation from shape diorama imports). Update: ComponentGallery collect guard — still active; `auth/index.ts` ADR-004 violation (Medium — direct string-ts import, same pattern as useValidationErrors.ts violation from last cycle).

3. **Pattern Maturity** — Update RouterService to "Battle-tested (migrated to @script-development/fs-router; BioRouterService thin wrapper for app-specific features)". Add: "Page Transition System: New — Creative Engine first delivery, active in Families app, `prefers-reduced-motion` compliant". Add: "Creative Engine agent: Active — ADR-015 accepted 2026-04-09, three deliveries completed".

4. **Quality Metrics** — Test count: 1182 (from gauntlet). Test files: 103. Shared components: 48 (from registry).

---

## Summary

**Overall Health:** 9/10 (unchanged from 2026-03-29)
**Findings:** 3 substantive (0 high, 2 medium, 1 low)
**Showcase Readiness:** Portfolio-ready
**Recommendation:** Targeted fixes — ADR-004 in auth/index.ts, Pulse update, domain map patch, AboutPage spec refactor

### Showcase Readiness Assessment

The codebase would impress a senior architect from a prospective client. Specific strengths visible in this audit:

- **Architecture discipline**: The router migration to `@script-development/fs-router` is clean — thin wrapper pattern, BIO-specific features separated, minimal test surface. Exactly what an "extraction to shared library" should look like.
- **Creative/structural balance**: The Creative Engine's page transition system demonstrates sophisticated Vue Transition usage (GPU-composited, `prefers-reduced-motion` compliant, live media query listener) alongside the Architect's structural discipline. The three-delivery arc (initial → refactor → cleanup) documents a team that iterates toward the right answer rather than shipping the first thing that works.
- **Pattern consistency in new components**: All 14 LEGO shape components (7 HTML, 7 SVG) share identical prop interfaces (`color?`, `shadow?`), naming conventions, and data-attribute testability patterns. A reviewer looking at any one component can predict all others.
- **Self-documenting showcase**: The `PageTransitionDemo` with live variant selector, active parameter display, and comparison table is exactly what ADR-015 called for. It demonstrates creative sophistication without sacrificing legibility.
- **One concern**: The `auth/index.ts` ADR-004 violation is in `@shared/services/auth/index.ts` — a core service file. A sharp reviewer doing architecture due diligence would grep for direct third-party imports in shared services and find it. Fix before client demo.

---

## ADR Pressure

No ADR pressure signals detected this cycle. All active ADRs are functioning as intended:

- ADR-003 (UnoCSS): `<style scoped>` in PageTransition.vue is the documented exception for framework-required CSS class naming. No overreach.
- ADR-015 (Creative Engine): Three deliveries, no scope boundary violations, arbitration pipeline not needed.
- ADR-010 (collect guard): New breach in AboutPage.spec.ts is the mechanism working correctly — the guard caught a heavy import chain.

---

## Self-Debrief

### What I Caught

- **ADR-004 violation in auth/index.ts**: The graduated SOP-2 grep check (`deepCamelKeys` outside helpers) was extended to `string-ts` direct imports. This caught the auth service violation that the previous cycle missed. Pattern: audit all shared services for direct third-party case conversion imports, not just the composables directory.
- **Pulse staleness escalation**: The fifth consecutive inspection with no pulse update. Filed as medium severity per casebook rule.
- **AboutPage.spec.ts collect guard**: New breach from the 2026-04-06 shape permit. Found by reading full collect guard reporter output (casebook candidate SOP-1 behavior).
- **Resolved suspicions**: Three casebook suspicions closed in one inspection — Vue Router next() deprecation, SettingsPage collect guard, useValidationErrors ADR-004. All resolved by the six permits delivered.
- **Domain map drift**: Two showcase components missing. Found by comparing `ls showcase/components/` against domain map list rather than trusting the map.

### What I Missed

- Did not audit the Creative Engine's graduation log in `creative-engine.md` to verify that parameter tracking is being maintained correctly. ADR-015 requires parameter records on every creative delivery — the journals show they were filed, but I didn't cross-reference against the agent's own graduation log.
- Did not sample integration tests for the router migration — the router journal noted this blind spot. The architecture test verifies structure but not that integration mocks still pass correctly with the new package.

### Methodology Gaps

- SOP-2 (ADR-004 grep) covers `deepCamelKeys` outside helpers. It should be broadened to also grep for any direct `string-ts` or `@script-development/fs-helpers` imports outside `@shared/helpers/string.ts`. The current formulation would have missed `auth/index.ts` importing `deepSnakeKeys` (not `deepCamelKeys`). The violation was caught only because I ran a broader `from "string-ts"` grep.
- SOP-4 (Pattern Maturity audit) doesn't have a step for checking whether the Creative Engine's parameter tracking log is being maintained. ADR-015 specifies parameter records as the graduation mechanism — verifying the log is accurate is in scope for the Inspector.

### Training Proposals

| Proposal                                                                                                                                                                                                                                                                           | Context                                                                                                                    | Report Evidence                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| SOP-2 ADR-004 check should grep for ALL direct imports from `string-ts` or `@script-development/fs-helpers` in production code, not just `deepCamelKeys` by name — the violation in `auth/index.ts` was `deepSnakeKeys`, which would have been missed by the current narrower grep | `auth/index.ts` imports `deepSnakeKeys` directly from `string-ts`; not `deepCamelKeys`                                     | 2026-04-11-post-creative-engine-audit |
| SOP-4 (Pattern Maturity) should include a step: for any agent with a parameter/graduation tracking requirement (currently Creative Engine per ADR-015), verify the tracking log is current and matches the claimed delivery count                                                  | ADR-015 requires parameter records per delivery; inspector did not verify the creative-engine.md graduation log this cycle | 2026-04-11-post-creative-engine-audit |

---

## CFO Evaluation

**Reviewed:** 2026-04-11
**Verdict:** Strong audit. The inspector covered two weeks of work thoroughly, resolved three standing casebook suspicions, and correctly identified the ADR-004 recurrence pattern. One accounting error noted below.

### Finding Disposition

**Finding 1 — ADR-004 in `auth/index.ts` (medium):** Accepted. The irony is sharp — the same file imports `toCamelCaseTyped` from the wrapper on line 6 and then `deepSnakeKeys` directly from `string-ts` on line 8. Same file, inconsistent approach. This is the second ADR-004 violation in two inspection cycles. The fix is trivial. The pattern concern is real: shared services need a systematic sweep. Forwarding to architect for fix.

**Finding 2 — Pulse staleness (medium):** Accepted. This one lands on the CFO, not the architect. Five consecutive inspections with stale Pulse is a process failure. The inspector is right to flag it, and the escalation to high severity on the next cycle is warranted. I will update the Pulse immediately after filing this evaluation.

**Finding 3 — Domain map missing showcase components (low):** Accepted. Second occurrence of domain map underdocumentation. Will be corrected during Pulse update.

**Finding 5 — AboutPage collect guard breach (medium):** Accepted. The 551ms delta from 16 shape component imports is a direct consequence of the shape permit. The journal's gauntlet table showing "Pass" for all checks without capturing the collect guard output is a known gap that the SOP-1 graduation candidate addresses.

**Accounting note:** The summary claims "3 findings total: 0 high, 2 medium, 1 low" but the report contains 4 substantive findings (Findings 1, 2, 3, 5) totaling 0 high, 3 medium, 1 low. Finding 5 (AboutPage collect guard) is filed with medium severity but not counted in the summary. Minor bookkeeping error — does not affect the quality of the audit.

### Training Proposal Evaluation

| Proposal                                                                         | Verdict   | Reason                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SOP-2: grep for ALL direct `string-ts` imports, not just `deepCamelKeys` by name | Candidate | Sound reasoning — the graduated SOP-2 check was scoped too narrowly to a single function name. A broader pattern (`from "string-ts"` in production code outside helpers) would catch the full ADR-004 surface. First observation. |
| SOP-4: verify Creative Engine parameter tracking log accuracy                    | Candidate | Valid gap. ADR-015 defines parameter records as the graduation mechanism, and the inspector should verify them. First observation.                                                                                                |

### Graduation Check

**Two candidates hit their second confirmation this cycle:**

**Candidate: SOP 3 reverse-verify domain directories against domain map**

- First observed: 2026-03-29 — `brick-dna` domain absent from domain map
- Second observed: 2026-04-11 — `BrickShapes` and `PageTransitionDemo` absent from domain map showcase section

| Scenario                                                                                                                                                       | Without Training                                                                                                                                                            | With Training                                                                                                                                                   | Assertion                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| A new domain `notifications` exists in `src/apps/families/domains/` but domain-map.md hasn't been updated                                                      | Inspector reads the domain map and verifies listed domains exist on disk. Finds no discrepancies because listed entries are accurate. Misses the unlisted domain entirely.  | After verifying listed entries, Inspector runs `ls src/apps/*/domains/` and diffs the actual directories against the domain map. Finds `notifications` missing. | Report includes a finding that `notifications` is absent from domain map.    |
| Three new showcase demo components (`AnimationSandbox`, `A11yAudit`, `ThemeSwitcher`) added to `src/apps/showcase/components/` but not listed in domain-map.md | Inspector reads showcase section in domain map and verifies listed components exist. All listed components are present — no discrepancy detected. New components invisible. | Inspector lists actual `src/apps/showcase/components/` directory and compares against domain map list. Finds three components missing.                          | Report flags all three as absent, with file paths and a count mismatch note. |

**Verdict: Pass.** The inspector demonstrated this exact behavior in both confirming sessions — the `brick-dna` find (2026-03-29) and the showcase components find (2026-04-11) were both discovered by independently listing directories rather than trusting the map. The training makes this systematic instead of ad-hoc.

**Candidate: SOP 1 capture full collect guard reporter output**

- First observed: 2026-03-29 — SettingsPage breach only visible in reporter output, not exit code
- Second observed: 2026-04-11 — AboutPage breach found by reading reporter output; separate "Collect Guard Reporter Output" section in gauntlet results

| Scenario                                                                                                                              | Without Training                                                                                                                                     | With Training                                                                                                                                                       | Assertion                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run test:coverage` exits 0, but the collect guard warns that `NewFeaturePage.spec.ts` has a 480ms delta (above 400ms threshold). | Inspector records "test:coverage: Pass" in the gauntlet table and moves to the next check. The 480ms breach goes unreported because exit code was 0. | Inspector captures the full reporter output after the pass/fail result. Notices the 480ms breach, classifies it as new vs. pre-existing, and files it as a finding. | Report includes a collect guard section with the specific file name, delta value, and threshold. |
| Two collect guard warnings: one pre-existing (FormValidationWorkbench, 590ms) and one new (ImportWizard, 510ms).                      | Inspector may note a general "collect guard warning" but doesn't distinguish new from pre-existing. Finding lacks actionability.                     | Inspector captures full output, identifies ImportWizard as new this cycle, and classifies FormValidationWorkbench as pre-existing per SOP-1 failure classification. | Report distinguishes new breach from pre-existing with explicit classification labels.           |

**Verdict: Pass.** The inspector's 2026-04-11 report includes a dedicated "Collect Guard Reporter Output" subsection with exact file names, delta values, and a "← NEW" annotation for the AboutPage breach. This is exactly the behavior the training encodes.

### Concerns

The inspector noted it did not audit the Creative Engine's graduation log in `creative-engine.md` — that's an honest miss and the SOP-4 training proposal addresses it. No other concerns. The audit quality is high: the casebook management is maturing (three suspicions closed, two opened, recurring patterns tracked with escalation rules), and the SOP-7 test quality sampling was substantive rather than perfunctory.
