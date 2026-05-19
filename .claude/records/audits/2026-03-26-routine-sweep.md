# Audit Report: Routine Sweep — Post-Delivery

**Report #:** 2026-03-26-routine-sweep
**Filed:** 2026-03-26
**Auditor:** Inventory Auditor
**Scope:** Full Sweep — all SOPs (1–6)
**Pulse Version:** Assessed 2026-03-25
**Triggered By:** CEO request

---

## Quality Gauntlet Results

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | Rector + Pint — no issues |
| phpstan | Pass | Level max, 0 errors, 171 files analysed (was 155 at baseline) |
| deptrac | Pass | 0 violations, 398 uncovered (+62 since baseline), 494 allowed (+63 since baseline) |
| test | Pass | 410 tests, 1465 assertions (was 347 tests, 1187 assertions at baseline) |
| test:coverage | Unable to run | No PHP coverage driver (no xdebug, no pcov) — environment gap, not code gap |
| test:feature-coverage | Unable to run | Same — no coverage driver |
| mutation | Unable to run | Requires coverage driver — environment gap unchanged |

**Coverage driver status:** Unchanged since baseline — no driver installed. Recorded as "unable to measure" per SOP fallback.

---

## Findings

### Architecture

1. **Five additional Actions contain try-catch blocks with no ADR documentation** `medium`
   - **Location:** `app/Actions/StorageOption/AssignPartToStorageAction.php:22`, `app/Actions/Sync/UpsertColorAction.php:21`, `app/Actions/Sync/UpsertPartAction.php:21`, `app/Actions/Sync/UpsertSetAction.php:21`, `app/Actions/Sync/StoreSetPartsAction.php:32`
   - **Standard:** ADR-0003 — "No try-catch — exceptions bubble to the global handler." The approved-exception amendment (2026-03-25) documents the partial-failure pattern in `ImportOwnedSetsAction` but does not address this pattern.
   - **Observation:** All five Actions use an identical try-catch on `UniqueConstraintViolationException` for race-condition-safe upsert. The pattern is: attempt an insert-or-update inside a transaction; if a unique constraint violation occurs (concurrent write race), catch it and retry with a direct update. This is a legitimate and well-established pattern. The baseline audit identified `ImportOwnedSetsAction`'s try-catch and the ADR was amended — but these five pre-existing try-catch blocks were present at the time of the baseline audit and were not flagged. The pattern predates the ADR amendment and has not been subject to the same governance.
   - **Impact:** Five production Actions have undocumented exceptions to the "no try-catch" rule. A junior reading ADR-0003 sees only the ImportOwnedSetsAction exception documented. They would not know that `UniqueConstraintViolationException` handling is also sanctioned. If they added a new upsert Action without a try-catch, they would have no guidance to add one; conversely, if they added an unsanctioned try-catch, there's no benchmark against which to calibrate.
   - **Recommendation:** Amend ADR-0003 to document a second approved exception: "Actions implementing optimistic-locking upsert may use try-catch on `UniqueConstraintViolationException` to handle concurrent write races, provided the catch block only retries the operation (not swallows) and the behavior is tested." Reference the five Actions as the current examples.

2. **RoutingArchitectureTest has not been updated for five new routes** `medium`
   - **Location:** `tests/Architecture/RoutingArchitectureTest.php` (lines 21–51); `routes/api.php` (lines 94–99, 101–107)
   - **Standard:** ADR-0008 (explicit routes), ADR-0002 (three-layer authorization defense). The routing architecture test exists specifically to enforce that all authorized routes have `.can()` middleware.
   - **Observation:** The RoutingArchitectureTest hardcodes a list of 24 routes to check. Since the baseline, five new routes have been added: `GET /family/brick-dna`, `DELETE /family/members/{user}`, `POST /family/invite-code`, `GET /family/invite-code`, `DELETE /family/invite-code`. None of these are in the hardcoded list. The routes DO have correct `.can()` middleware (verified by reading `routes/api.php`), so there is no current authorization gap. However, the test no longer provides coverage assurance for the new routes — if someone accidentally removed a `.can()` call from one of these five routes, the test would not catch it.
   - **Impact:** The safety net for authorization enforcement has drifted. The test passes, but it is not testing what the team believes it tests. The gap grows with every new route that isn't added to the list.
   - **Recommendation:** Add the five new routes to the `$routesThatRequireCanMiddleware` array in `RoutingArchitectureTest.php`. Consider whether future route additions should be caught by a process step (e.g., the shift log should explicitly verify new routes are in the routing test).

### Tests

3. **`FamilyPolicyTest` is missing unit tests for four new policy methods** `low`
   - **Location:** `tests/Unit/Policies/FamilyPolicyTest.php`; `app/Policies/FamilyPolicy.php`
   - **Standard:** SOP 5 — unit tests should cover all policy methods. The baseline audit flagged the same gap for `viewParts` and `viewStats`, which were fixed in the audit remediation.
   - **Observation:** `FamilyPolicy` now has 9 public methods. The test file covers 5 of them (`viewMembers`, `viewParts`, `viewStats`, `removeMember`, `setRebrickableToken`). Four methods added since the baseline audit have no unit tests: `viewBrickDna` (unconditional true), `generateInviteCode` (head-only), `viewInviteCode` (head-only), `revokeInviteCode` (head-only). The feature tests cover the 403 response for non-head users on the invite-code endpoints, so the authorization logic is exercised in integration. However, the unit-test gap is real and identical to the pattern the audit remediation fixed last session.
   - **Recommendation:** Add four test cases — one for `viewBrickDna` (should return true for any user), and three for invite code methods (head allowed, non-head denied). The tests are identical in structure to the existing `removeMember` and `setRebrickableToken` tests.

### Documentation / Manifest Accuracy

4. **Pulse Action count and architecture test counts are stale** `low`
   - **Location:** `.claude/docs/pulse.md` — Pattern Maturity section says "Action layer (26 classes)" (never updated from baseline); Architecture tests section says "15 files, 83 passed, 0 risky, 1 warning (904 assertions)"
   - **Standard:** SOP 3 — Manifest accuracy
   - **Observation:** The invite-code shift log proposed updating the pulse to "29 classes" which was itself incorrect (the correct count at that time was 28). Current count is 31 Actions (confirmed by directory listing). The architecture test count is also stale — current run shows 18 test files, 83 tests passing, 1007 assertions (up from 904). The "15 files" figure in the pulse appears to predate the TestConventionsArchitectureTest and others.
   - **Recommendation:** Logistics Director should update pulse with: Action layer (31 classes), Architecture tests (18 files, 83 passed, 1007 assertions, 1 warning [environment noise]).

5. **`RegisterUserData::familyName` is semantically incorrect when invite code path is taken** `low`
   - **Location:** `app/Http/Requests/Auth/RegisterRequest.php:39`; `app/DataTransferObjects/Auth/RegisterUserData.php:10`
   - **Standard:** ADR-0006 — FormRequest → DTO bridge should produce correctly typed data. ADR-0005 — no silent data munging.
   - **Observation:** When a user registers via invite code, `family_name` is absent from the request (per the `required_without:invite_code` validation). `RegisterRequest::toDto()` calls `$this->safe()->string('family_name')->toString()`, which returns `""` (empty string) when the field is absent. The DTO receives `familyName: ""`, which is a non-nullable string. `CreateUserWithFamilyAction` ignores `familyName` in the invite-code path, so no runtime bug occurs. However, the DTO carries a semantically false value — `""` is not the same as "no family name provided." If `familyName` were typed as `?string`, the intent would be clearer, and future code could safely check `$data->familyName !== null` to distinguish the two paths.
   - **This is an observation, not a regulation violation** — there is no rule requiring nullable DTOs in this scenario. But the type does not truthfully represent the data, and a junior could be confused by why `familyName` is an empty string in the invite-code path.
   - **Recommendation:** Change `RegisterUserData::familyName` to `?string` and update `RegisterRequest::toDto()` to pass `null` when the field is absent (using `$this->safe()->has('family_name') ? $this->safe()->string('family_name')->toString() : null`). This makes the DTO truthful about both paths.

---

## Doc Drift

| Document | Accurate | Drift Found |
|---|---|---|
| Pulse | No | Action count says 26 (never updated post-baseline). Architecture tests says "15 files, 83 passed, 904 assertions" — actually 18 files, 83 passed, 1007 assertions. Test count and assertion count are stale (now 410 tests, 1465 assertions). The overall health rating (8/10) and in-progress items are current. |
| Learnings | N/A | All sections still pending — no Head Sorter shifts have updated this document. Growing gap — three substantial shifts have shipped since this was last noted as pending. |
| CLAUDE.md | Yes | Architecture test count (18) is correct. ADR list accurate. Transaction convention ("Use `$this->connection->transaction(Closure)`") matches codebase. No drift found. |
| decisions.md | Yes | All links valid. ADR index accurate. No drift. |
| ADR README.md | Yes | 9 ADRs, all links correct. No drift. |
| ADR-0003 | Partial | Documents the ImportOwnedSetsAction try-catch exception but does not document the UniqueConstraintViolationException upsert pattern in 5 other Actions. See Finding 1. |

---

## Proposed Pulse Updates

The Logistics Director should update pulse.md with the following after this audit:

**Overall Health:** 8/10 — unchanged. Architecture sound, gauntlet clean, three substantial deliveries shipped since baseline with no regressions.

**Quality Metrics:**
- All four tool-based metrics unchanged: lint:test Pass, phpstan Pass (0 errors, now 171 files), deptrac Pass (0 violations), test Pass (410 tests, 1465 assertions)
- Architecture tests: 18 files, 83 passed, 1 warning (environment noise), 1007 assertions
- Coverage/mutation: unable to measure — environment gap continues

**Pattern Maturity:**
- Action layer: update to 31 classes (was 26/29 — both were inaccurate). Still battle-tested.
- Existing maturity ratings unchanged.

**Active Concerns:**
- PHP coverage driver missing: continues open
- RoutingArchitectureTest not updated for 5 new routes: new medium concern (Finding 2)
- UniqueConstraintViolationException try-catch pattern undocumented in ADR-0003: new medium concern (Finding 1)

**Tech Debt:**
- `GetFamilyPartsAction` returns raw array (no ResourceData): unchanged low item
- `FamilyPolicyTest` missing tests for 4 new policy methods: new low item (Finding 3)
- `RegisterUserData::familyName` empty-string semantics on invite-code path: new low item (Finding 5)
- Pulse quality metrics section needs full refresh: low item

---

## Summary

**Overall Health:** 8/10 (unchanged — no regressions, two medium gaps found)
**Findings:** 5 total (0 high, 2 medium, 3 low)
**Showcase Readiness:** Needs polish (two medium findings would catch a senior architect's eye)
**Recommendation:** Targeted fixes — medium findings should be addressed before portfolio presentation

**Rationale:** Three substantial deliveries shipped since the baseline audit — audit remediation, Brick DNA Lab, member removal, and invite code system — all following established patterns. PHPStan at max passes clean on 171 files. Deptrac holds at zero violations. The test count grew from 347 to 410 (63 new tests), all passing.

The two medium findings are both enforcement gaps rather than correctness bugs:

1. The UniqueConstraintViolationException try-catch pattern existed before the baseline audit and was missed by both the baseline auditor and the sorter who amended ADR-0003. A junior reading the ADR sees one documented exception to the no-try-catch rule — they would not know that five other Actions contain try-catch blocks under a separate pattern. The pattern itself is sound; the governance gap is real.

2. The RoutingArchitectureTest has not kept pace with route additions. The five new routes have correct `.can()` middleware, but the test no longer enforces this for them. The safety net has a five-route blind spot.

The three low findings are calibration items: policy unit tests that mirror the same gap the last remediation fixed, stale pulse counts, and a DTO type integrity observation that doesn't affect correctness.

**Deptrac uncovered count observation:** Uncovered tokens rose from 336 (baseline) to 398 (+62). This is expected growth as new classes are added — most new classes (InviteCode model, BrickDnaData, new ResourceData classes, new DTOs) naturally sit in leaf layers that Deptrac doesn't trace. The count is not alarming, but worth monitoring. If it reaches 500+ between audits, it may indicate classes being added outside intended layers.

---

## Self-Debrief

### What I Caught

- **Finding 1 (undocumented try-catch pattern):** SOP 2 candidate "scan Actions for try-catch" paid off here. I scanned `grep -rn "try {" app/Actions/` and found 6 try-catch blocks. The baseline audit only caught one because the SOP didn't specify this scan. Five pre-existing blocks were present at the time of the baseline audit and were missed. This is the second confirming observation for the SOP candidate.
- **Finding 2 (RoutingArchitectureTest drift):** Reading the routes file and then cross-checking against the architecture test revealed the hardcoded list had not been updated. The test was passing with 48 assertions, but it was missing 5 routes.
- **Finding 3 (policy test gap):** Counting `FamilyPolicy` methods and comparing to the test file. The same pattern recurred — new methods added without accompanying unit tests.
- **Finding 5 (DTO type integrity):** Checking `RegisterRequest::toDto()` against `RegisterUserData` types revealed the empty-string issue. This came from reading the FormRequest changes introduced in the invite-code shift.

### What I Missed

- I did not inspect the `InviteCode` migration for correctness beyond confirming no cascade deletes (architecture test covers this). I did not verify index coverage on `family_id`, `code`, or `revoked_at` columns.
- I did not check whether the `scopeActive` logic on `InviteCode` has a timezone concern (comparing `expires_at > now()` assumes UTC alignment between database storage and application `now()`).
- I did not verify the `GenerateInviteCodeAction`'s `do-while` loop for uniqueness has a practical bound — if the code space were exhausted, the loop would run forever. With 36^4 ≈ 1.7M combinations this is academically theoretical, but there's no explicit guard.

### Methodology Gaps

- **SOP 3 does not include: verify RoutingArchitectureTest hardcoded list is updated when new routes are added.** This would have caught Finding 2 as a specific checklist item rather than incidental observation. When I checked routes in SOP 3, I checked that they had proper middleware — but I didn't cross-reference the architecture test's hardcoded list against the actual routes.
- **SOP 4 does not include: count policy methods and compare to policy test coverage.** Finding 3 came from reading the policy test, but the SOP says "do all return bool?" and "coverage for every authorized route?" — it doesn't say "compare method count to test count."

### Training Proposals

| Proposal | Context | Report Evidence |
|---|---|---|
| SOP 2: scan Actions for try-catch blocks | Confirmed second time: 5 undocumented try-catch blocks found in production Actions that predated the baseline audit and were missed | 2026-03-26-routine-sweep (second observation; first: 2026-03-25-full-sweep-baseline) |
| SOP 3: after checking routes, cross-reference RoutingArchitectureTest's hardcoded route list to verify all routes are covered | RoutingArchitectureTest had 5 new routes missing; the test passed with correct assertions but wasn't testing new routes | 2026-03-26-routine-sweep |
| SOP 4: when auditing Policies, count public methods and compare to corresponding unit test file's describe blocks | FamilyPolicy grew to 9 methods; test only covers 5; same pattern as Finding 6 from baseline audit (which was for viewParts/viewStats) | 2026-03-26-routine-sweep |

---

## Logistics Director Evaluation

_Appended by the Logistics Director after reviewing the report._

**Assessment:** Strong audit. All five findings are accurate, well-evidenced, and correctly severitied. The Auditor's self-debrief is honest about gaps (migration index coverage, timezone concerns, loop bounds) — good calibration awareness.

### Findings Review

All findings concurred:

- **Finding 1 (try-catch governance) — medium:** Accepted. Five undocumented try-catch blocks predate the baseline and were missed. The pattern is sound; the governance gap is real. Will forward to Head Sorter for rebuttal per protocol.
- **Finding 2 (RoutingArchitectureTest drift) — medium:** Accepted. Safety net has a five-route blind spot. Will forward to Head Sorter for rebuttal per protocol.
- **Finding 3 (FamilyPolicyTest gaps) — low:** Accepted. Same recurrence pattern as the baseline remediation. Straightforward fix.
- **Finding 4 (stale pulse counts) — low:** Accepted. Housekeeping.
- **Finding 5 (RegisterUserData empty string) — low:** Good observation. Type doesn't truthfully represent intent, but no runtime impact. Worth addressing when convenient.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| SOP 2: scan Actions for try-catch | **Graduated** | Second confirming observation (baseline: 1 undocumented try-catch; this sweep: 5 more). Graduation tests passed — the scan is a 10-second grep with clear scope, catches real gaps, and has well-defined boundaries (Actions only, cross-reference ADR-0003). Promoted to SOP 2 step 6. |
| SOP 3: cross-reference RoutingArchitectureTest route list | Candidate | First observation. Valid gap — logged in graduation log. Needs second confirming instance. |
| SOP 4: count Policy methods vs test describe blocks | Candidate | First observation. Same recurrence as baseline Finding 6. Logged. Needs second confirming instance. |

### Notes for the Auditor

Good work, orange brick. The try-catch scan paid off — that's the first graduated SOP from your training log. Your methodology gap identification (SOP 3 missing route cross-reference, SOP 4 missing method count) shows maturing self-awareness. The "What I Missed" section (migration indexes, timezone, loop bounds) is exactly the kind of honest calibration that builds trust in your findings.

One note: the Deptrac uncovered count observation (336 → 398) is a useful leading indicator. Keep tracking it — if the delta exceeds ~30 per audit cycle without explanation, escalate.
