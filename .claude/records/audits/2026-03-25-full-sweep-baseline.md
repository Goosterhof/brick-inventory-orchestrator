# Audit Report: Full Sweep — Baseline

**Report #:** 2026-03-25-full-sweep-baseline
**Filed:** 2026-03-25
**Auditor:** Inventory Auditor
**Scope:** Full Sweep — all SOPs (1–6)
**Pulse Version:** Pending first audit (all sections TBD)
**Triggered By:** CEO request

---

## Quality Gauntlet Results

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | Rector + Pint — no issues |
| phpstan | Pass | Level max, 0 errors, 155 files analysed |
| deptrac | Pass | 0 violations, 336 uncovered (expected), 431 allowed |
| test | Pass | 343 tests, 1181 assertions, all pass (warnings are environment log-path noise) |
| test:coverage | FAIL | No PHP coverage driver installed (no xdebug, no pcov) — cannot measure |
| test:feature-coverage | FAIL | Same — no coverage driver |
| mutation | FAIL | Requires coverage driver — cannot measure |

**Coverage driver status:** PHP 8.4.18 NTS build has neither xdebug nor pcov installed. This is an environment gap, not a code gap. The commands themselves are correctly configured; they cannot run.

---

## Findings

### Architecture

1. **`ImportOwnedSetsAction` contains a try-catch block** `high`
   - **Location:** `app/Actions/FamilySet/ImportOwnedSetsAction.php` (lines 49–71)
   - **Standard:** ADR-0003 — "No try-catch — exceptions bubble to the global handler." This is documented in both the ADR and CLAUDE.md with no noted exceptions.
   - **Observation:** The action wraps its pagination loop in `try { foreach ... } catch (RebrickableApiException|InvalidApiResponseException $e)` to implement partial-import resilience. When a page fails after at least one successful page, the exception is caught, the import is marked incomplete, and a partial result is returned. When the first page fails, the exception is re-thrown. This is intentional, tested, and documented in unit tests. However, no ADR exception or amendment documents this deviation from the rule.
   - **Recommendation:** Either (a) amend ADR-0003 to document "Actions may use try-catch when implementing partial-failure resilience patterns, provided the behavior is fully tested and the exception is not silently swallowed," or (b) extract the partial-failure logic into a documented pattern that does not require try-catch in the Action itself. The current implementation is not broken — it is undocumented as an exception to the rule.

2. **Three architecture tests produce no assertions ("risky")** `medium`
   - **Location:** `tests/Architecture/ControllerArchitectureTest.php` (tests: "should not return ResourceData directly," "should not have constructors," "should not use try-catch"); `tests/Architecture/PolicyArchitectureTest.php` (test: "should not inject Gate contract")
   - **Standard:** Architecture tests must actually catch violations. A test that runs and asserts nothing is indistinguishable from a test that was misconfigured.
   - **Observation:** These four tests iterate over controllers/policies looking for violations. Because no violations exist today, the loops produce no assertions, and Pest marks them "risky." If a future controller introduces a constructor, the test will still produce one assertion (the failing one) — so the tests are not useless. But today they provide zero confidence, and Pest's "risky" warning will persist indefinitely as a false positive, desensitising the team to the signal.
   - **Recommendation:** Add a baseline assertion to each test. Example: after the loop, `expect($controllersChecked)->toBeGreaterThan(0)` using a counter variable. This converts each test from "passed with no assertions" to "passed after checking N controllers." The warning disappears and the tests demonstrate they actually ran.

### Exception Handling

3. **`InvalidApiResponseException` has no global exception handler registration** `high`
   - **Location:** `bootstrap/app.php` (exception rendering section); `app/Exceptions/InvalidApiResponseException.php`
   - **Standard:** CLAUDE.md Incident Reports table lists `RebrickableApiException → 502 or 404` and `BrickognizeApiException → 502`. `InvalidApiResponseException` is listed as a sibling in the hierarchy but has no renderer.
   - **Observation:** `InvalidApiResponseException` extends `ExternalApiException`, which extends `Exception`. It does not extend `RebrickableApiException` or `BrickognizeApiException`. When thrown — from either the Rebrickable or Brickognize service — it will not be caught by either registered renderer and will produce a 500 Internal Server Error with a full stack trace in development, or a generic 500 in production. This affects at least 20+ code paths where the services validate API responses.
   - **Recommendation:** Register a renderer in `bootstrap/app.php`:
     ```php
     $exceptions->render(fn (InvalidApiResponseException $e, Request $request): JsonResponse =>
         response()->json(['error' => 'Unexpected response from external API'], 502)
     );
     ```
     This is a correctness bug, not a style issue.

### Documentation / Manifest Accuracy

4. **`decisions.md` references a broken ADR-000 link** `low`
   - **Location:** `.claude/docs/decisions.md` — first row references `[000](ADR-000.md)`
   - **Standard:** SOP 3 — ADR index accuracy
   - **Observation:** The file `docs/adr/ADR-000.md` does not exist. The ADR folder contains `0001-session-auth-not-tokens.md` through `0009-thin-controllers-method-injection.md` and a `README.md`. There is no `ADR-000.md` or `0000-*.md`. The link is broken.
   - **Recommendation:** Either create `docs/adr/0000-why-this-warehouse-exists.md` (referenced in the CLAUDE.md description of ADR-000) or update `decisions.md` to remove the broken reference. The CLAUDE.md mentions "ADR-000 — Why This Warehouse Exists" as explaining the decision laboratory context. If this ADR was never written, it should be written. It is referenced by the auditor's own brief as the strategic context document.

5. **Pulse Action count inaccuracy** `low`
   - **Location:** `.claude/docs/pulse.md` — Pattern Maturity section says "Action layer (27 classes)"
   - **Standard:** SOP 3 — Manifest accuracy
   - **Observation:** A direct count of `app/Actions/` yields 26 `.php` files: 2 Auth, 1 BrickIdentification, 3 Family, 5 FamilySet, 7 StorageOption, 4 Sync, and 4 top-level (GetSetAction, GetSetByEanAction, GetSetPartsAction, GetSetStorageMapAction). Count is 26, not 27.
   - **Recommendation:** Logistics Director should update the pulse to 26 when establishing the baseline.

### Tests

6. **`FamilyPolicyTest` does not test `viewParts()` and `viewStats()`** `low`
   - **Location:** `tests/Unit/Policies/FamilyPolicyTest.php`
   - **Standard:** SOP 5 — Unit tests should cover all policy methods. Coverage threshold is 100% for unit tests.
   - **Observation:** `FamilyPolicy` has four public methods: `viewMembers`, `viewParts`, `viewStats`, and `setRebrickableToken`. The test file covers `viewMembers` (1 test) and `setRebrickableToken` (2 tests). `viewParts` and `viewStats` — both of which simply `return true` — have no test cases. These are trivial methods, but they are untested. If coverage were measurable, they would create a coverage gap.
   - **Recommendation:** Add two tests — one for `viewParts` and one for `viewStats` — confirming each returns `true` for any authenticated user. The tests are two lines each. The gap is small but real.

### Patterns

7. **`GetFamilyPartsAction` returns raw arrays — no ResourceData** `low`
   - **Location:** `app/Actions/Family/GetFamilyPartsAction.php`; `app/Http/Controllers/FamilyController.php` (the `parts()` method)
   - **Standard:** ADR-0006 — ResourceData pattern for structured output. SOP 6 — pattern consistency.
   - **Observation:** Every other endpoint in the warehouse uses a ResourceData class for output shaping. The `family/parts` endpoint has the Action return a raw `array` and the controller pass it directly to `new JsonResponse(...)`. This works correctly, but it is the only endpoint without a typed ResourceData. A junior following the pattern would not know this was intentional.
   - **Recommendation:** This is an observation, not a regulation violation — there is no rule that forbids Actions from returning arrays. The recommendation is to either (a) create a `FamilyPartResourceData` for consistency, or (b) document in a code comment that this endpoint intentionally bypasses ResourceData due to [reason]. Without documentation, the inconsistency looks like an oversight.

8. **`FamilyController::members()` uses bespoke `fromFamily()` instead of `collection()`** `low`
   - **Location:** `app/Http/Controllers/FamilyController.php` (line 22); `app/Http/Resources/FamilyMemberResourceData.php`
   - **Standard:** ADR-0006 — ResourceData with `from()` factory and `collection()` for bulk construction.
   - **Observation:** All other collection endpoints use `ResourceData::collection($models)`. The `members()` endpoint uses `FamilyMemberResourceData::fromFamily($user->family)`, a bespoke static method that is not part of the established pattern. This bypasses the EAGER_LOAD mechanism (no EAGER_LOAD constant is defined on FamilyMemberResourceData — acceptable since there are no nested relations). However, it is a one-off pattern that a junior may not recognise as intentional.
   - **Recommendation:** Either standardise to use `collection()` with a pre-loaded family users relationship, or add a comment explaining why `fromFamily()` is needed (e.g., the head_id check requires the Family context, not just the User model). The architectural test for `from()` methods does not catch this, and the `fromFamily()` method is additional, not a replacement.

---

## Doc Drift

| Document | Accurate | Drift Found |
|---|---|---|
| Pulse | No | Action count says 27, actual is 26; all quality metrics are TBD (expected for first audit) |
| Learnings | N/A | All sections pending — expected for first audit, no drift to report |
| CLAUDE.md | Mostly | Architecture test count (18) is correct. ADR list (9 ADRs) accurate. Incident Reports table does not list `InvalidApiResponseException` as a separately handled exception — this is consistent with the gap in bootstrap/app.php, but it means the omission isn't flagged anywhere |
| decisions.md | No | ADR-000 link is broken — file does not exist |
| ADR README.md | Yes | Lists 9 ADRs correctly, matches actual files |

---

## Proposed Pulse Updates

The Logistics Director should update pulse.md with the following confirmed values after this audit:

**Overall Health:** 7/10 — architecture is sound, tests pass, static analysis clean. Two high findings (try-catch violation + missing exception handler) require attention before this is showcase-ready.

**Quality Metrics:**
- lint:test: Pass
- phpstan: Pass (level max, 0 errors)
- deptrac: Pass (0 violations)
- test: Pass (343 tests, 1181 assertions)
- test:coverage: Cannot measure — no coverage driver in environment
- test:feature-coverage: Cannot measure — no coverage driver in environment
- mutation: Cannot measure — no coverage driver in environment

**Pattern Maturity:**
- Action layer (26 classes): Battle-tested — 9 ADRs enforce it, architecture tests guard it, all tests pass. One documented deviation (try-catch in ImportOwnedSetsAction) requires ADR amendment.
- Service layer (2 classes): Battle-tested — correct interfaces, Deptrac boundaries hold, no facade or model leakage.
- ResourceData pattern (11 classes): Battle-tested — all have `from()` factories, EAGER_LOAD where needed. One endpoint (family/parts) bypasses the pattern without documentation.
- Explicit cascade deletion: Battle-tested — architecture test confirms all HasMany/HasOne relations are declared, delete actions handle all cascades.
- Thin controllers: Battle-tested — no constructors, no try-catch, method injection only.

**Active Concerns:**
- InvalidApiResponseException not globally handled (HIGH — correctness bug)
- ImportOwnedSetsAction try-catch violates ADR-0003 with no documented exception (HIGH — regulation violation)
- Coverage infrastructure absent from environment (MEDIUM — quality gap)
- 3 architecture tests produce no assertions (MEDIUM — false assurance)

---

## Summary

**Overall Health:** 7/10
**Findings:** 8 total (2 high, 1 medium, 5 low)
**Showcase Readiness:** Needs polish
**Recommendation:** Targeted fixes — two high findings must be resolved before portfolio presentation

**Rationale:** The warehouse architecture is genuinely impressive. PHPStan at max passes clean. Deptrac has zero violations. 343 tests pass in 6 seconds. The ADR set is coherent and the enforcement mechanisms are comprehensive. A senior architect scanning this codebase would come away nodding at the discipline.

The two high findings are what prevent "portfolio-ready" status:

1. `InvalidApiResponseException` falling through to a 500 is a correctness bug — it will surface in production the first time a supplier returns a malformed response. This is not hypothetical; the services validate responses aggressively and throw this exception frequently.

2. `ImportOwnedSetsAction`'s try-catch is documented nowhere as an intentional exception to ADR-0003. A junior reading the regulations would see "no try-catch in Actions" and then find one in a prominent action. Either the regulation needs an ADR amendment, or the implementation needs a documented exception. The gap is not the code — it is the governance.

The medium finding (coverage infrastructure) is an environment concern, not a code concern. The architecture tests' no-assertion risk is real but low-probability given the current state of the controllers.

The five low findings are calibration opportunities — three are documentation gaps (broken link, inaccurate count, missing pattern documentation), and two are minor test coverage gaps.

---

## Self-Debrief

### What I Caught

- The `InvalidApiResponseException` global handler gap: this required reading bootstrap/app.php against the full exception hierarchy. The CLAUDE.md incident table hinted at it but the gap is easy to miss.
- The `ImportOwnedSetsAction` try-catch: the ActionArchitectureTest does not scan for try-catch inside Actions (it checks for arrow functions in transactions, not for try-catch blocks generally). This is a real blind spot in the architecture test suite.
- The risky architecture tests: the "0 assertions" warning in the test output is easy to dismiss as a Pest quirk. Documenting it as a finding forces the team to decide whether to fix it.
- The broken ADR-000 link: directly visible when reading decisions.md, but easy to miss because the document itself is readable without following the link.

### What I Missed

- I did not read every FormRequest for the `$this->input()` vs `$this->safe()` check (ADR-0006). I spot-checked `StoreFamilySetRequest` which was compliant, but I did not check all 7 request classes. Given PHPStan passes at max, a `$this->input()` call would not be caught statically — it's a runtime-only concern.
- I did not inspect the migration files for schema correctness. I confirmed no cascade deletes (architecture test passes), but I did not read the actual column definitions.
- I could not run the mutation drill or measure coverage. The quality picture is incomplete on those dimensions.
- I did not check the `phpunit.coverage.xml` and `phpunit.feature-coverage.xml` configurations to verify the coverage thresholds are correctly set.

### Methodology Gaps

- **SOP 1 assumes a coverage driver is present.** The command spec says "record result: pass/fail, coverage percentages." When the entire coverage subsystem is absent, there is no graceful degradation in the SOP. The auditor has no way to substitute an alternative measurement.
- **SOP 2 spot-check for Actions does not include a try-catch scan.** The current spot-check verifies `final readonly`, single `execute()`, no facades, no Request dependencies. It does not explicitly check for try-catch blocks. The ActionArchitectureTest does not check for this either (it only checks for arrow functions in transactions). A try-catch in an Action will pass all tests and all spot-checks.
- **SOP 3 does not have a step for "check all FormRequests use `$this->safe()` not `$this->input()`."** ADR-0006 is explicit about this, but no architecture test enforces it and SOP 3 does not flag it as a manual check.

### Training Proposals

| Proposal | Context | Report Evidence |
|---|---|---|
| SOP 2 spot-check should include: scan Actions for try-catch blocks, as ActionArchitectureTest does not check for this | Found try-catch in ImportOwnedSetsAction that architecture tests missed entirely | 2026-03-25-full-sweep-baseline |
| SOP 3 should include: verify all FormRequests use `$this->safe()` not `$this->input()` in their toDto() methods | ADR-0006 specifies this; no architecture test enforces it; spot-check was incomplete | 2026-03-25-full-sweep-baseline |
| SOP 1 should document a fallback procedure when the coverage driver is absent: note the environment gap as a finding and record "unable to measure" rather than leaving the table cells blank | Coverage driver absent in this environment; both test:coverage and mutation failed without actionable output | 2026-03-25-full-sweep-baseline |

---

## Logistics Director Evaluation

**Assessment:** Thorough

I independently verified all 8 findings against the codebase. Every finding is accurate and reproducible.

### Findings Review

**Finding 1 — `InvalidApiResponseException` handler gap (HIGH).** Correctly calibrated. Verified: `bootstrap/app.php` registers renderers for 5 exception types. `InvalidApiResponseException` extends `ExternalApiException extends Exception` — it is not a subclass of either `RebrickableApiException` or `BrickognizeApiException`, so neither registered renderer catches it. This is a correctness bug. HIGH is appropriate.

**Finding 2 — `ImportOwnedSetsAction` try-catch (HIGH).** Correctly calibrated, but I'll note the nuance: the code itself is well-engineered — the partial-failure resilience pattern with re-throw on first page is exactly what you'd want. The finding is about governance, not correctness. The severity is correct because the gap is between a documented regulation ("no try-catch in Actions") and the implementation, in a showcase project that bills itself as a decision laboratory. An ADR amendment is the right resolution — not removing the try-catch.

**Finding 3 — Risky architecture tests (MEDIUM).** Verified: `composer test:arch` reports `4 risky` tests. Correctly calibrated. The fix (add a counter assertion) is trivial and eliminates a persistent warning that erodes signal quality.

**Findings 4-8 (LOW).** All correctly calibrated as low. Action count is confirmed at 26. The broken ADR-000 link, missing policy tests, raw-array endpoint, and bespoke `fromFamily()` are all accurate observations. No severity over/under-calls.

**One observation the Auditor did not make:** The `deptrac` output shows 336 uncovered tokens. This is expected (not every class sits in a Deptrac layer), but the Auditor could have noted whether that number has grown unexpectedly. Not a gap — just a future refinement opportunity.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| SOP 2: scan Actions for try-catch | Candidate | Directly caught a real high-severity finding. The ActionArchitectureTest doesn't cover this — manual spot-check is the only safety net. Strong first observation. |
| SOP 3: verify `$this->safe()` in toDto() | Candidate | ADR-0006 is explicit about this convention, no architecture test enforces it, and the Auditor correctly identified this as a gap they couldn't cover. Needs a second observation to confirm value. |
| SOP 1: document coverage-driver fallback | Candidate | Pragmatic — the SOP assumed infrastructure that wasn't present. The Auditor handled it reasonably in practice (recorded "cannot measure") but the SOP should codify this as the expected behavior. |

All three are well-reasoned proposals with clear evidence. None are dropped. All enter the graduation log as candidates pending a second confirming observation.

### Notes for the Auditor

Strong first audit. The findings are calibrated honestly — you didn't inflate lows to pad the count, and you didn't soften the two highs to avoid confrontation. The self-debrief is genuinely useful: admitting you didn't check all FormRequests and didn't inspect migrations shows intellectual honesty, not weakness.

Two notes for next time:
1. When you identify a convention-only enforcement gap (like the try-catch in Actions), check the ADR's "Open Questions" section — it may already be flagged there. In this case it wasn't, which makes your finding stronger, but checking would have added a sentence of context.
2. The Deptrac uncovered count (336) is worth tracking across audits. If it grows significantly between audits, it means new code is being added outside the boundary fences.
