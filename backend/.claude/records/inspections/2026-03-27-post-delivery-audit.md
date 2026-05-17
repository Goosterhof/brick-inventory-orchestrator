# Audit Report: Post-Delivery Audit — Recent Sessions

**Report #:** 2026-03-27-post-delivery-audit
**Filed:** 2026-03-27
**Auditor:** Inventory Auditor (compiled by Logistics Director from auditor's investigative work — auditor timed out before filing)
**Scope:** Full Sweep — all SOPs (1–6)
**Pulse Version:** Assessed 2026-03-26
**Triggered By:** CEO request

---

## Quality Gauntlet Results

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | Rector + Pint — no issues |
| phpstan | Pass | Level max, 0 errors, 262 files analysed (was 171 at last audit) |
| deptrac | Pass | 0 violations, 439 uncovered (+41 since last audit), 513 allowed (+19 since last audit) |
| test | Pass | 433 tests, 1546 assertions (was 417 tests, 1472 assertions at last audit) |
| test:arch | Pass | 18 files, 84 passed, 0 risky, 2 warnings (1049 assertions) |
| test:coverage | Unable to run | No PHP coverage driver (no xdebug, no pcov) — environment gap unchanged |
| test:feature-coverage | Unable to run | Same — no coverage driver |
| mutation | Unable to run | Requires coverage driver — environment gap unchanged |

**Delta since last audit:** +16 tests, +74 assertions, +91 PHPStan files analysed. All growth metrics positive.

---

## Findings

### Architecture

1. **DTO-accepting ResourceData classes bypass the `ResourceData<TModel>` contract** `medium`
   - **Location:** `app/Http/Resources/FamilySetCompletionResourceData.php:26`, `app/Http/Resources/BrickDnaResourceData.php:32`
   - **Standard:** ADR-0006 — ResourceData with `from()` factory method. The base class `ResourceData<TModel>` declares `abstract public static function from(Model $model): static` — the contract requires a Model.
   - **Observation:** Both `FamilySetCompletionResourceData` and `BrickDnaResourceData` accept DTOs (not Models) and use `mixed` parameter type with `@phpstan-ignore method.childParameterType` to suppress the type mismatch. PHPStan passes because the inline ignores match real errors. The pattern works at runtime but violates the generic contract: `collection()` (which calls `from()` with a Model) cannot be used with these classes. This is an undocumented variant of the ResourceData pattern — two classes follow it, but no ADR or documentation acknowledges it.
   - **Impact:** A junior implementing a new aggregation endpoint would see the base class requires a Model, then discover these two classes ignore the contract. Without documentation, they have no guidance on when a DTO-based ResourceData is appropriate vs. when to shape data differently. The `@phpstan-ignore` suppression should be a deliberate, documented exception — not a quiet workaround.
   - **Recommendation:** Either: (a) amend ADR-0006 to document a "DTO-based ResourceData" variant as a second approved pattern (when the source is computed data, not a persisted Model), or (b) introduce a separate base class (e.g., `DataResource`) for DTO-sourced output that doesn't inherit the Model-based contract. Option (a) is simpler and matches the current codebase; option (b) is cleaner but requires migration.

2. **CLAUDE.md coverage thresholds don't match actual composer.json values** `medium`
   - **Location:** `CLAUDE.md` (Quality Control Bay section); `composer.json` (scripts)
   - **Standard:** Doc accuracy — CLAUDE.md is the floor plan. It must match reality.
   - **Observation:** CLAUDE.md documents: Unit coverage 100%, Feature coverage 80%, Mutation 75%. Actual `composer.json` values (set by PR #125): `test:coverage --min=99`, `test:feature-coverage --min=90`, `mutation --min=76`. All three thresholds differ. PR #125 intentionally calibrated these to verified actuals, but CLAUDE.md was not updated.
   - **Impact:** Any crew member reading CLAUDE.md gets incorrect threshold expectations. The discrepancy is especially confusing for unit coverage (99% vs 100%) — it looks like a regression when it's a calibration.
   - **Recommendation:** Update CLAUDE.md Quality Control Bay section to match the actual thresholds: Unit 99%, Feature 90%, Mutation 76%.

### Tests

3. **`SetPolicyTest` is missing unit test for `viewStorageMap` method** `low`
   - **Location:** `tests/Unit/Policies/SetPolicyTest.php:19-22`; `app/Policies/SetPolicy.php:21`
   - **Standard:** SOP 4 — unit tests should cover all policy methods. Same recurrence pattern as FamilyPolicyTest gap from previous audit.
   - **Observation:** `SetPolicy` has 3 public methods (`viewParts`, `lookupByEan`, `viewStorageMap`). The test dataset covers only 2 — `viewStorageMap` is missing. The method returns unconditional `true`, so the test would be trivial. This gap predates the recent PRs — it was present at the time of the last audit but was not caught because the auditor only examined `FamilyPolicy`.
   - **Recommendation:** Add `'viewStorageMap' => ['viewStorageMap']` to the dataset in `SetPolicyTest.php`.

4. **Three ResourceData classes lack unit tests** `low`
   - **Location:** `tests/Unit/Resources/` — missing: `BrickDnaResourceDataTest.php`, `FamilySetCompletionResourceDataTest.php`, `InviteCodeResourceDataTest.php`
   - **Standard:** Pattern consistency — 12 of 15 ResourceData subclasses have unit tests. Three do not.
   - **Observation:** `BrickDnaResourceData`, `FamilySetCompletionResourceData`, and `InviteCodeResourceData` all lack dedicated unit tests. Feature tests exercise them through the HTTP layer, so the output format is tested indirectly. However, the 12/15 coverage ratio creates a visible gap. All three were added in recent sessions.
   - **Recommendation:** Add unit tests for all three. The two DTO-based ones (`BrickDna`, `FamilySetCompletion`) are especially important to test directly because their `from()` contract is non-standard.

5. **CLAUDE.md exception list is incomplete** `low`
   - **Location:** `CLAUDE.md` (Incident Reports section); `bootstrap/app.php`
   - **Standard:** Doc accuracy.
   - **Observation:** CLAUDE.md documents 5 exception types. `bootstrap/app.php` registers 10 renderers. The 5 missing from CLAUDE.md: `InvalidApiResponseException → 502`, `CannotRemoveSelfException → 422`, `UserNotInFamilyException → 404`, `InviteCodeNotFoundException → 404`, `InvalidInviteCodeException → 422`. All were added in recent sessions without updating CLAUDE.md.
   - **Recommendation:** Update the Incident Reports table to include all 10 exceptions.

### Documentation / Manifest Accuracy

6. **Pulse quality metrics stale after PR #125 threshold changes** `low`
   - **Location:** `.claude/docs/pulse.md` (Quality Metrics section)
   - **Standard:** Pulse should reflect current state.
   - **Observation:** Pulse says "417 tests, 1472 assertions" — actual is 433 tests, 1546 assertions. PHPStan says "171 files" — actual is 262 files (PHPStan type-coverage from PR #126 added many). Architecture tests say "83 passed" — actual is 84 passed. Deptrac says "398 uncovered, 494 allowed" — actual is 439 uncovered, 513 allowed.
   - **Recommendation:** Update all pulse quality metrics to current values.

---

## Doc Drift

| Document | Accurate | Drift Found |
|---|---|---|
| Pulse | No | Test count (417→433), assertion count (1472→1546), PHPStan files (171→262), arch tests (83→84), Deptrac uncovered (398→439) and allowed (494→513) all stale. |
| CLAUDE.md | No | Coverage thresholds don't match composer.json (Finding 2). Exception list incomplete (Finding 5). |
| Learnings | N/A | Still pending — no shifts have populated this document. |
| ADR-0006 | Partial | Does not document the DTO-based ResourceData variant (Finding 1). |

---

## Proposed Pulse Updates

**Overall Health:** 8/10 — unchanged. Architecture sound, gauntlet clean, four deliveries shipped since last audit with no regressions.

**Quality Metrics:**
- lint:test Pass, phpstan Pass (0 errors, 262 files), deptrac Pass (0 violations, 439 uncovered, 513 allowed)
- test Pass (433 tests, 1546 assertions)
- Architecture tests: 18 files, 84 passed, 2 warnings, 1049 assertions
- Coverage/mutation: unable to measure — environment gap continues

**Deptrac uncovered count:** 439 (+41 from last audit's 398). Growth is expected — new ResourceData classes, Data DTOs, and type-coverage additions. Still below the 500 threshold noted in last audit.

---

## Summary

**Overall Health:** 8/10 (unchanged — no regressions, growth across all positive metrics)
**Findings:** 6 total (0 high, 2 medium, 4 low)
**Showcase Readiness:** Needs polish (the DTO-based ResourceData pattern should be documented before portfolio review)
**Recommendation:** Targeted fixes — medium findings should be addressed; low findings at convenience

**Rationale:** Four deliveries shipped cleanly: a new feature endpoint (set completion), test quality improvements (covers/datasets), quality gauntlet calibration, and PHPStan type-coverage. The gauntlet passes clean. Test count grew by 16 (417→433), assertions by 74 (1472→1546). PHPStan now analyses 262 files (up from 171, driven by type-coverage addition).

The two medium findings are governance gaps, not correctness bugs:
1. The DTO-based ResourceData pattern is a legitimate variant but undocumented — two classes use `@phpstan-ignore` to bypass the Model contract without any ADR or documentation acknowledging this as an approved pattern.
2. CLAUDE.md's coverage thresholds are stale after PR #125's deliberate calibration. The floor plan doesn't match the floor.

Previous audit remediation verified: FamilyPolicyTest now covers all 9 methods, RoutingArchitectureTest covers all 32 authenticated routes, ADR-0003 documents both try-catch exception patterns. All prior medium findings held.

---

## Self-Debrief

### What I Caught

- **Finding 1 (DTO-based ResourceData):** Cross-referencing the base class contract against the two DTO-accepting subclasses revealed an undocumented pattern. The `@phpstan-ignore` inline annotations were the signal — they indicate a deliberate deviation from the generic type contract.
- **Finding 2 (CLAUDE.md threshold drift):** Direct comparison of CLAUDE.md's stated thresholds against `composer.json` scripts. PR #125 changed the values but didn't update the floor plan.
- **Finding 3 (SetPolicyTest gap):** Counting `SetPolicy` methods against the test dataset — the SOP 4 candidate (count methods vs test describe blocks) would have caught this systematically.
- **Finding 5 (exception list):** Counting bootstrap/app.php renderers against CLAUDE.md's documented list.

### What I Missed

- Did not inspect the `GetFamilySetCompletionAction` for query performance (N+1 risk, index coverage on the aggregation queries). The action uses raw DB queries — these bypass Eloquent's eager loading and need manual verification.
- Did not verify that the FamilySetCompletion feature test covers edge cases (empty family, sets with no parts, etc.).
- Did not check whether `phpstan:types` is in the CI pipeline or only in pre-commit hooks.

### Methodology Gaps

- **SOP 4 does not include: count Policy methods vs test dataset entries across ALL policy tests.** The candidate for this (from 2026-03-26-routine-sweep) would have caught Finding 3 in `SetPolicyTest`. This is the second observation of this gap — first was `FamilyPolicyTest` (routine sweep), now `SetPolicyTest`.
- **SOP 3 does not include: verify CLAUDE.md thresholds match composer.json script values.** When quality thresholds are changed, CLAUDE.md should be updated. No SOP checks this.

### Training Proposals

| Proposal | Context | Report Evidence |
|---|---|---|
| SOP 4: count Policy methods vs test dataset entries for ALL policy tests (not just FamilyPolicy) | SetPolicyTest missing viewStorageMap — same pattern as FamilyPolicyTest gap from routine sweep | 2026-03-27-post-delivery-audit (second observation; first: 2026-03-26-routine-sweep) |
| SOP 3: compare CLAUDE.md quality thresholds against composer.json script values | PR #125 changed thresholds but CLAUDE.md wasn't updated; no SOP caught this | 2026-03-27-post-delivery-audit |

---

## Logistics Director Evaluation

**Assessment:** Thorough investigation, well-calibrated findings.

**Note on process:** The Inventory Auditor performed 106 tool operations of investigation but timed out before filing the report. The Logistics Director compiled this report from the auditor's investigative output, preserving its findings, severity assessments, and observations faithfully. The self-debrief section reflects the auditor's actual investigative path and methodology gaps. This is an exceptional circumstance — the auditor did the work, just couldn't deliver the paperwork before the clock ran out.

### Findings Review

All findings concurred:

- **Finding 1 (DTO-based ResourceData) — medium:** Accepted. Two classes bypass the `ResourceData<TModel>` generic contract using `@phpstan-ignore`. The pattern is legitimate and pre-exists this session (BrickDna was earlier). The issue is governance: no ADR documents this as an approved variant. A senior architect reviewing the codebase would notice two `@phpstan-ignore` annotations suppressing type errors in production code and ask "why?" — the answer should be in the ADR, not tribal knowledge. Will forward to Head Sorter for rebuttal.
- **Finding 2 (CLAUDE.md threshold drift) — medium:** Accepted. The floor plan must match the floor. PR #125 deliberately changed thresholds but the shift log didn't include a CLAUDE.md update. This is a process gap — shift logs should verify that floor-plan-visible changes get reflected in CLAUDE.md. Will forward to Head Sorter for rebuttal.
- **Finding 3 (SetPolicyTest gap) — low:** Accepted. Same recurrence as FamilyPolicyTest. Third time this pattern has appeared (baseline: FamilyPolicy viewParts/viewStats; routine: FamilyPolicy 4 new methods; now: SetPolicy viewStorageMap). The SOP 4 candidate is ready for graduation.
- **Finding 4 (ResourceData unit test gaps) — low:** Accepted. 12/15 coverage is a visible gap. The two DTO-based ones especially need direct testing since their `from()` contract is non-standard.
- **Finding 5 (exception list) — low:** Accepted. Housekeeping — the table grew incrementally without anyone updating the docs.
- **Finding 6 (pulse metrics) — low:** Accepted. Housekeeping.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| SOP 4: count Policy methods vs test dataset entries for ALL policy tests | **Ready for graduation** | Second confirming observation (routine sweep: FamilyPolicyTest; this audit: SetPolicyTest). Same pattern, different policy. See graduation tests below. |
| SOP 3: compare CLAUDE.md thresholds against composer.json | Candidate | First observation. Valid gap — logged. Needs second confirming instance. |

### Graduation Tests: SOP 4 Policy Method Count

| Scenario | Without Training | With Training | Assertion |
|---|---|---|---|
| A new policy method `transferOwnership` is added to `FamilyPolicy` but not added to `FamilyPolicyTest` | Auditor checks FamilyPolicy for `final` keyword, return types, etc. but does not count methods against test entries. Gap is missed. | Auditor counts 10 public methods in FamilyPolicy, counts 9 entries in FamilyPolicyTest dataset, identifies `transferOwnership` as untested. | Report includes a finding naming `transferOwnership` as missing from FamilyPolicyTest. |
| `StorageOptionPolicy` has 4 methods but `StorageOptionPolicyTest` only tests 3 via dataset | Auditor may or may not spot-check this policy — SOP 4 says "do all return bool?" but not "compare count to tests." | Auditor systematically counts methods in every policy class and compares to corresponding test coverage. | Report identifies the specific missing method by name. |
| All policy methods have corresponding tests (no gap exists) | Auditor reports "policies look good" without evidence of systematic check. | Auditor reports "all N policies checked: method counts match test entries" with specific numbers. | Report explicitly states the count comparison was performed and found no gaps. |

**Verdict: Pass.** The training is a simple, mechanical check (count methods, count test entries, compare) that has caught real gaps in 3 of 3 audits where policies changed. It's not a judgment call — it's arithmetic. The scenarios are objectively verifiable. Graduated.

### Notes for the Auditor

Good investigative work, orange brick — 106 tool operations shows thorough coverage. The timeout was an execution issue, not a methodology issue. Two notes:

1. The DTO-based ResourceData finding is your strongest catch this round. You identified an undocumented architectural variant by following the `@phpstan-ignore` breadcrumbs — that's exactly the kind of signal-following that produces medium findings.
2. Your "What I Missed" section (query performance, edge case coverage, CI pipeline for phpstan:types) shows continued honest self-assessment. The query performance gap is worth noting — raw DB queries in Actions bypass Eloquent's safeguards and deserve scrutiny.
