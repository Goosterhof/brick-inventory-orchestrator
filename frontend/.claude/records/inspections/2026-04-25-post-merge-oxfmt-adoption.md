# Inspection Report: Post-Merge Audit — oxfmt Template Adoption (PR #194)

**Report #:** 2026-04-25-post-merge-oxfmt-adoption
**Filed:** 2026-04-25
**Inspector:** Building Inspector
**Scope:** Targeted: PR #194 (oxfmt template adoption, 301 files), outstanding action items from prior reports
**Pulse Version:** Assessed 2026-04-11 (rating 9/10)
**Triggered By:** CFO request — inspect code merged in the last 24 hours

---

## Quality Gauntlet Results

| Check         | Result | Notes                                                                 |
| ------------- | ------ | --------------------------------------------------------------------- |
| format:check  | Pass   | 464 files all compliant                                               |
| lint          | Pass   | 0 warnings, 0 errors across 294 files                                 |
| lint:vue      | Pass   | All conventions passed                                                |
| type-check    | Pass   | vue-tsc --build silent                                                |
| test:coverage | Pass   | 109 files, 1278 tests, 100% all axes                                  |
| knip          | Pass   | No unused exports                                                     |
| size          | Fail   | dist/ absent — no build run in this session; pre-existing environment |

### Gauntlet Failure Classification

`size` fails because `dist/` does not exist in this environment — no `npm run build` was performed. This is an environment constraint, not a code regression. The construction journal for PR #194 confirms `size` passed with `families 121.37 kB/350 kB, admin 30.79 kB/150 kB` at merge time.

### Collect Guard Reporter Output

The collect guard reported 7 files exceeding thresholds (coverage mode 2x — thresholds doubled):

| File                                                         | Delta  | Raw    | Baseline | Status                                               |
| ------------------------------------------------------------ | ------ | ------ | -------- | ---------------------------------------------------- |
| `apps/families/domains/about/pages/AboutPage.spec.ts`        | 1522ms | 1522ms | 0ms      | Pre-existing (551ms in 2026-04-11 report) — worsened |
| `apps/families/domains/home/pages/HomePage.spec.ts`          | 1609ms | 4295ms | 2686ms   | Pre-existing                                         |
| `apps/families/domains/sets/pages/SetDetailPage.spec.ts`     | 1782ms | 4179ms | 2397ms   | Pre-existing                                         |
| `apps/showcase/components/FormValidationWorkbench.spec.ts`   | 2571ms | 3832ms | 1261ms   | Pre-existing (590ms in 2026-04-11 report) — worsened |
| `apps/families/domains/brick-dna/pages/BrickDnaPage.spec.ts` | 2408ms | 2408ms | 0ms      | Pre-existing (single-file project — raw applies)     |
| `apps/families/App.spec.ts`                                  | 2913ms | 2913ms | 0ms      | Pre-existing                                         |
| `apps/admin/App.spec.ts`                                     | 1280ms | 1280ms | 0ms      | Pre-existing                                         |

The collect guard also flagged these in the threshold-warning zone (below violation):

- `apps/showcase/components/ComponentGallery.spec.ts` — 425ms delta (was 808ms execution in prior report)
- `apps/showcase/components/ResourceAdapterPlayground.spec.ts` — 484ms delta
- `shared/services/auth/index.spec.ts` — 512ms delta
- `apps/families/domains/sets/pages/SetsOverviewPage.spec.ts` — 728ms delta
- `apps/families/domains/sets/pages/ScanSetPage.spec.ts` — 623ms delta
- `apps/families/domains/sets/pages/SetsOverviewTheme.spec.ts` — 855ms delta

None of these are new to this cycle. All pre-existing.

**TEST GUARD** (execution time — 600ms threshold in coverage mode 2x):

| File                                                         | Execution | Threshold                | Status                                                                    |
| ------------------------------------------------------------ | --------- | ------------------------ | ------------------------------------------------------------------------- |
| `apps/families/domains/sets/pages/SetsOverviewPage.spec.ts`  | 1603ms    | 600ms warn / 4000ms fail | Pre-existing warning                                                      |
| `architecture.spec.ts`                                       | 1099ms    | 600ms warn / 4000ms fail | Pre-existing warning (new threshold visibility — see Finding 2)           |
| `apps/families/domains/sets/pages/SetsOverviewTheme.spec.ts` | 907ms     | 600ms warn / 4000ms fail | Pre-existing warning                                                      |
| `apps/showcase/components/ComponentGallery.spec.ts`          | 933ms     | 600ms warn / 4000ms fail | Pre-existing warning (was 808ms in 2026-04-11 report — marginal increase) |

No files exceeded the 4000ms failure threshold. Suite passed.

---

## Findings

### Architecture

1. **ADR-004 casebook suspicion resolved — no remaining violations** `info`
    - **Location:** `src/shared/services/auth/index.ts`, `src/shared/composables/useValidationErrors.ts`
    - **Standard:** ADR-004 — case conversion at HTTP boundary; casebook standing suspicion
    - **Observation:** The casebook recorded `auth/index.ts` as importing `deepSnakeKeys` and `DeepSnakeKeys` directly from `string-ts` (filed 2026-04-11). The file now correctly imports both from `@shared/helpers/string`. `useValidationErrors.ts` was already fixed. A broad grep for `from 'string-ts'` across all production `.ts` and `.vue` files returned zero hits outside `src/shared/helpers/string.ts` itself (which re-exports `DeepSnakeKeys` as a type — this is the correct single-point pattern).
    - **Recommendation:** Close casebook standing suspicion. Move to Crossed-Out.

### Docs

2. **ADR-010 fail threshold documents 1000ms — implementation uses 2000ms** `medium`
    - **Location:** `.claude/docs/decisions/010-test-isolation-collect-guard.md` — lines 49–50, 52, 156
    - **Standard:** ADR accuracy — documented thresholds must match enforced thresholds
    - **Observation:** ADR-010 states throughout: "300–1000ms: warning" and "1000ms+: failure" and "warn at 300ms, **fail at 1000ms**". The implementation at `src/tests/unit/test-guard-reporter.ts` line 30 uses `FAIL_THRESHOLD_MS = 2000`. Under coverage mode (2x multiplier), the effective failure threshold is 4000ms. The ADR's docstring in the reporter source correctly describes the actual behavior (2000ms base / 4000ms under coverage), but the ADR document itself has not been updated. The architect noted this as "low urgency" and "did not want to grow scope a third time" in the construction journal — the acknowledgment is honest, but the drift now exists and the ADR is the authoritative record for a client reviewer.
    - **Recommendation:** Update ADR-010 in the Decision section, the Enforcement table, and the Open Questions paragraph to reflect 300/2000ms base thresholds (600/4000ms under coverage). This is a one-file edit, not a policy debate.

3. **Pulse Active Concerns — ComponentGallery execution time figure stale** `low`
    - **Location:** `.claude/docs/pulse.md` — Active Concerns table, `ComponentGallery.spec.ts` row
    - **Standard:** Pulse accuracy — must reflect current values
    - **Observation:** Pulse reports "808ms execution time" for `ComponentGallery.spec.ts`. Current run measures 933ms. Not a dramatic drift, but the Pulse is a live document that clients and new hires read. Accuracy matters.
    - **Recommendation:** CFO updates Pulse Active Concerns row to "933ms execution time" with assessed date 2026-04-25.

4. **Pulse Active Concerns — AboutPage delta figure stale** `low`
    - **Location:** `.claude/docs/pulse.md` — Active Concerns table, `AboutPage.spec.ts` row
    - **Standard:** Pulse accuracy
    - **Observation:** Pulse reports "618ms delta in coverage mode." Current run shows 1522ms delta in the collect guard output. The root cause is unchanged (16 shape component imports at collect time), but the magnitude has grown substantially — nearly 2.5x the previously reported figure. The breach is worsening, not stabilizing. This warrants attention beyond a number update.
    - **Recommendation:** CFO updates Pulse with current delta (1522ms) and changes status from "Active" to "Escalating" — the breach is worsening across inspection cycles, suggesting the import chain is growing alongside the shape library. Consider splitting the spec or moving to a single-stub barrel mock for all shape components.

5. **Pulse Pattern Maturity — assessed 2026-03-29, still not updated** `low`
    - **Location:** `.claude/docs/pulse.md` — Pattern Maturity section
    - **Standard:** Pulse freshness — major deliveries should update pattern maturity
    - **Observation:** The Pattern Maturity table was last assessed 2026-03-29. Since then: router migration to `@script-development/fs-router` completed (mentioned in Overall Health text but not in the table), page transitions added by Creative Engine, LEGO shape component library added. This was flagged in the 2026-04-11 report (Finding 2) and remains unaddressed. Sixth consecutive inspection with this stale section.
    - **Recommendation:** CFO updates Pattern Maturity table with: `fs-router adapter pattern | Battle-tested | Thin app wrappers over fs-router, FamilyRouterLink provided`, `Page transition system | Battle-tested | ADR-015 delivery, all three apps`, `LEGO shape component library | Battle-tested | 7 HTML + 7 SVG shapes, tested`. Assessed date: 2026-04-25.

6. **Construction journal for PR #194 — CFO Evaluation still pending** `low`
    - **Location:** `.claude/records/journals/2026-04-23-oxfmt-template-adoption.md` — CFO Evaluation section
    - **Standard:** Operations Protocol — CFO evaluates every construction journal before the next inspection
    - **Observation:** The journal was filed 2026-04-23. The CFO Evaluation section reads "Pending CFO review" across all sub-sections. The journal contains three training proposals that have not been dispositioned. The PR has been merged; the paper trail is incomplete.
    - **Recommendation:** CFO completes the evaluation and training proposal dispositions before the next session.

### Outstanding Action Items from Prior Reports

7. **`prevCursor` in `CursorPaginatedParts` — still undocumented dead field** `low`
    - **Location:** `src/apps/families/types/part.ts` line 74
    - **Standard:** Type surface honesty — interfaces should represent what the code actually uses
    - **Observation:** Filed as Finding 1 (low) in 2026-04-21 report. The field remains. No comment documents intent. No code reads it. `knip` does not flag interface members. Still looks like a typo omission to a reader unfamiliar with the type's history.
    - **Recommendation:** Remove or annotate. If backward pagination is not planned, remove. If retained intentionally, add `// retained for future backward-cursor pagination` — one comment, zero ambiguity.

8. **PartsMissingPage sort chip test — optional chain still unguarded** `low`
    - **Location:** `src/tests/integration/apps/families/domains/parts/pages/PartsMissingPage.spec.ts` line 172
    - **Standard:** Test reliability
    - **Observation:** Filed as Finding 2 (medium) in the 2026-04-21 report, then downgraded to low in the 2026-04-22-post-merge follow-up. `nameChip?.find('button').trigger('click')` uses optional chaining. As documented in the prior report, this is not strictly vacuous — the ordering assertion would catch a missing chip — but the intent is not explicit. Still unaddressed across two inspection cycles.
    - **Recommendation:** Add `expect(nameChip).toBeDefined()` before `nameChip!.find('button').trigger('click')`. One line. Closes a long-standing open item.

### Formatting Spot-Check (PR #194 — oxfmt adoption)

Verified 8 representative files across directories for formatting compliance after the 301-file reformat:

| File                                                                               | Single Quotes | 4-Space Indent | No Bracket Spacing | Trailing Commas | Semicolons | Result |
| ---------------------------------------------------------------------------------- | ------------- | -------------- | ------------------ | --------------- | ---------- | ------ |
| `src/apps/families/domains/home/pages/HomePage.vue`                                | Yes           | Yes            | Yes                | Yes             | Yes        | Pass   |
| `src/apps/families/domains/storage/pages/StorageOverviewPage.vue`                  | Yes           | Yes            | Yes                | Yes             | Yes        | Pass   |
| `src/apps/families/domains/brick-dna/pages/BrickDnaPage.vue`                       | Yes           | Yes            | Yes                | Yes             | Yes        | Pass   |
| `src/apps/families/domains/parts/pages/PartsMissingPage.vue`                       | Yes           | Yes            | Yes                | Yes             | Yes        | Pass   |
| `src/shared/helpers/string.ts`                                                     | Yes           | Yes            | N/A                | Yes             | Yes        | Pass   |
| `src/shared/composables/useValidationErrors.ts`                                    | Yes           | Yes            | Yes                | Yes             | Yes        | Pass   |
| `src/shared/services/auth/index.ts`                                                | Yes           | Yes            | Yes                | Yes             | Yes        | Pass   |
| `src/tests/integration/apps/families/domains/parts/pages/PartsMissingPage.spec.ts` | Yes           | Yes            | Yes                | Yes             | Yes        | Pass   |

The `format:check` pass (464 files) corroborates the spot-check. No formatting damage detected in the reformat.

### Component Registry Hook

**Confirmed:** The component registry generator fires on every commit via the Husky pre-commit hook (line 1 of `.husky/pre-commit`). It is not scoped to Vue-file changes — it runs unconditionally. The generated file is immediately formatted with oxfmt and staged. `npm run registry:check` confirms the registry is current (51 components). This closes the prior concern noted in inspection 2026-04-22.

---

## Doc Drift

| Document           | Accurate | Drift Found                                                                 |
| ------------------ | -------- | --------------------------------------------------------------------------- |
| Domain Map         | Yes      | No new drift since 2026-04-23 report (PartsMissingPage added in PR #193)    |
| Component Registry | Yes      | `registry:check` clean (51 components)                                      |
| Pulse              | Partial  | Active Concerns execution times stale (F3, F4); Pattern Maturity stale (F5) |
| CLAUDE.md          | Yes      | Quote convention correctly updated to single quotes                         |
| ADR-010            | No       | Fail threshold documents 1000ms; implementation uses 2000ms (F2)            |

---

## Proposed Pulse Updates

1. **Active Concerns — ComponentGallery row:** Update "808ms execution time" to "933ms execution time." Assessed 2026-04-25.
2. **Active Concerns — AboutPage row:** Update "618ms delta" to "1522ms delta." Change status to "Escalating." Assessed 2026-04-25.
3. **Active Concerns — `format:check` failures on `.claude/` md row:** Confirm this concern is still accurate or close it — the PR #194 journal confirms format:check passed on 460 files. If agent-doc markdown still fails post-reformat, keep; if resolved, remove.
4. **Pattern Maturity section:** Add `fs-router adapter pattern`, `Page transition system`, `LEGO shape component library` rows. Assessed 2026-04-25.
5. **Standing Suspicion (casebook):** Close ADR-004 case conversion drift suspicion. Move to Crossed-Out.

---

## ADR Pressure

No new ADR pressure signals this cycle.

ADR-010 has a documented threshold mismatch (Finding 2) but this is doc drift from a deliberate implementation change, not pressure from the codebase fighting the pattern. The architect noted it as out-of-scope during PR #194; the ADR needs a targeted amendment, not re-interrogation.

---

## Summary

**Overall Health:** 9/10 (unchanged — no regressions, one doc drift finding)
**Findings:** 8 total (0 critical, 0 high, 1 medium, 7 low/info)
**Showcase Readiness:** Portfolio-ready

The oxfmt adoption is clean. 301 files reformatted, all pass `format:check`, no structural damage, no quote style drift. The `.git-blame-ignore-revs` file is a professional touch — the kind of detail a senior reviewer doing `git log` archaeology would notice and approve of. Architecture compliance is solid across the spot-checked files.

The one medium finding (ADR-010 threshold mismatch) is the only item worth the CFO's prioritized attention. The low findings are housekeeping. The outstanding action items from prior reports (prevCursor, sort chip optional chain) are low-priority but have now persisted for two inspection cycles — they should be dispatched in the next work session rather than carried a third time.

**Recommendation:** Targeted fixes — ADR-010 amendment (medium), Pulse updates (low), prevCursor / sort chip close-outs (low)

---

## Self-Debrief

### What I Caught

- ADR-010 threshold mismatch. The construction journal flagged this as a deferred ADR touch-up; without reading the actual reporter source and comparing `FAIL_THRESHOLD_MS` against the ADR's enforcement table, I would have missed it.
- AboutPage collect delta worsening (618ms → 1522ms). The Pulse figure was stale enough that this jump was visible without running prior comparisons.
- CFO evaluation pending on the PR #194 journal — caught by checking the journal file directly, not from any automated signal.
- ADR-004 casebook suspicion cleanly resolved. Closed with evidence.

### What I Missed

- I did not check the `SetsOverviewPage.spec.ts` worsening (855ms → 1603ms) against prior baseline in the same absolute terms. The new threshold scale (600ms coverage 2x) makes comparison harder. This may warrant a note in the casebook.
- I did not verify `src/apps/showcase/App.vue` RouterLink usage against the ADR-001 exception. I confirmed it's expected (showcase installs Vue Router directly) but did not read the ADR-001 full text to confirm there's a documented exception for showcase. Low risk but a gap.

### Methodology Gaps

- No gap identified in this cycle. The SOPs are sufficient for a targeted PR inspection. The ADR-010 mismatch was caught by SOP 2's "compare documentation against actual codebase" instinct applied to the reporter source — not a dedicated SOP step.

### Training Proposals

| Proposal                                                                                                                                                                                                                                                  | Context                                                                                                                         | Report Evidence                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| When a construction journal flags an ADR touch-up as "low urgency / deferred," the inspector should read both the implementation and the ADR text to verify the gap exists before the next inspection — not wait for the CFO to disposition the proposal. | ADR-010 threshold drift was acknowledged in the journal but left to drift. Reading `test-guard-reporter.ts` directly caught it. | 2026-04-25-post-merge-oxfmt-adoption |

---

## CFO Evaluation

**Appended:** 2026-04-25
**CFO:** 2x2 gray brick, with spreadsheets

### Assessment

Solid inspection. The oxfmt adoption is confirmed clean — 301 files, no structural damage, format:check green across 464 files. The `.git-blame-ignore-revs` touch is the kind of thing a reviewer notices; good catch on confirming it. ADR-004 suspicion closed with evidence. Component registry hook confirmed unconditional. These are the two most important unknowns from prior cycles and both resolved cleanly.

### Findings Review

**F2 (ADR-010 threshold mismatch — medium):** Upheld. The architect pre-acknowledged this in the construction journal as "low urgency / deferred." Given that pre-acknowledgment, the standard rebuttal protocol is waived — the finding is not in dispute, only the timing of the fix. Categorizing as an accepted deferred touch-up. Action: architect to close this in the next work session. A client reviewer finding a 2x mismatch between docs and code on a named ADR is an easy win for the inspection team and a credibility hit for the firm. It should not survive into a third cycle.

**F3–F4 (Pulse stale figures):** Upheld. F4 in particular — a 1522ms delta vs. 618ms documented is not a rounding error, it's a pattern change. Status change to "Escalating" is appropriate. The suggestion to consider a barrel mock for shape components in AboutPage is worth exploring; the import chain is growing with the shape library.

**F5 (Pattern Maturity — 6th consecutive cycle):** Upheld with escalation. Six cycles is a structural failure of the update loop, not a backlog item. The CFO will update the Pulse Pattern Maturity table in this session as part of committing this report's PR. This finding does not survive to a 7th cycle.

**F6 (PR #194 journal CFO evaluation pending):** Self-referential catch — the inspector is correct. The evaluation is pending. The CFO will complete it this session.

**F7 (prevCursor — 2nd cycle) and F8 (sort chip optional chain — 2nd cycle):** Both upheld. Two cycles is the policy threshold. Both dispatch to the Lead Brick Architect in the next work session with ACCEPT expected. If not actioned by end of next session, they escalate to medium.

**F1 (ADR-004 suspicion closed):** Positive confirmation accepted. Casebook updated.

### Training Proposal Dispositions

| Proposal                                                                                                                                             | Disposition   | Rationale                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When a journal flags an ADR touch-up as deferred, inspector should read implementation vs. ADR before next inspection — not wait for CFO disposition | **Candidate** | First confirmed instance. The inspector caught ADR-010 drift by reading `test-guard-reporter.ts` directly rather than trusting the journal's self-assessment. That's the right instinct. Needs one more confirming session before promotion into training. |

### Notes for the Inspector

Good instinct on the SetsOverviewPage timing (855ms → 1603ms) — logging it as a new casebook entry is the right call. The ADR-001 showcase RouterLink gap you self-identified is worth closing in the next inspection cycle. One missed check is better than zero self-awareness about what was missed.

The ADR-010 catch via source-vs-doc comparison is exactly the methodology gap this training proposal addresses. The fact that you caught it anyway is evidence the instinct is there; the proposal formalizes it so it fires reliably, not just when the journal happens to mention it.
