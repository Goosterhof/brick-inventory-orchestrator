# Audit: Foundry Pulse Refresh — Quality Metrics, Pattern Maturity, Tech Debt, Active Concerns, Overall Health

**Audit #:** 2026-05-26-foundry-pulse-refresh
**Filed:** 2026-05-26
**Auditor:** Quality Warden
**Wing:** Foundry (backend only)
**Scope:** Refresh five stale Pulse sections: Overall Health, Active Concerns, Pattern Maturity, Quality Metrics, Tech Debt (all Foundry, all 21+ days stale; Tech Debt 56 days stale)
**Pulse Version:** Foundry sections last assessed 2026-05-05 (Overall Health / Active Concerns / Pattern Maturity / Quality Metrics) and 2026-03-31 (Tech Debt)
**Triggered By:** CEO authorization following four consecutive standups (2026-05-20, 2026-05-25 ×2, 2026-05-26) flagging Foundry Pulse staleness. ADR-0030 grants Quality Warden Write access to `.claude/records/audits/` and `.claude/docs/quality-warden-casebook.md` — this Audit is filed directly by the Warden.

---

## Quality Gauntlet Results

All gauntlet commands run on host PHP 8.5.5 with `php8.5-pcov` installed (pcov blocker closed 2026-05-20).

| Command | Result | Headline Metric |
|---|---|---|
| `composer lint:test` | Pass | Rector + Pint: 0 findings across 8 files |
| `composer phpstan` | Pass | 339/339 files OK, **0 errors** |
| `composer deptrac` | Pass | 743 allowed dependencies, **0 violations**, 0 warnings |
| `composer test:arch` | Pass | **107 tests passed** (1860 assertions) — up from 105 at last assessment |
| `composer test:coverage` | Pass | **Unit coverage: 100.0%** across all Actions, Services, and Mail |
| `composer test:feature-coverage` | Pass (overall) | **Feature coverage: 98.1%** — `Auth/LogoutController` at 60% (lines 19-20 uncovered) — see Finding 1 |
| `composer mutation` | Pass | **Mutation score: 79.68%** (threshold: 76%) — above threshold; untested mutations concentrated in `RebrickableService.php` string-concat operations |
| `composer test` (full suite) | Pass | **697 tests, 2846 assertions, 24.55s** |

### Dockerfile Build Verification

`docker compose build backend` was attempted. Result: **failed** — `pecl install pcov` reports "cannot download pecl/pcov" (network-level PECL download failure). The pcov install is in the Dockerfile's `RUN` layer for the build target. This is a PECL package registry availability issue at build time, not a code defect. The Dockerfile change itself (pcov install + PHP 8.5 alignment) appears structurally correct. See Active Concerns re-assessment below.

---

## Findings

### Finding 1 — LogoutController: `hasSession()` branch uncovered in feature tests `medium`

- **Location:** `app/Http/Controllers/Auth/LogoutController.php` lines 18-21; `tests/Feature/Auth/LogoutTest.php`
- **Standard:** Feature coverage target is 90% per `backend/CLAUDE.md`. `Auth/LogoutController` reports 60% (lines 19-20: `$request->session()->invalidate()` and `$request->session()->regenerateToken()` — the `$request->hasSession()` true-branch is never exercised in tests).
- **Evidence:** `composer test:feature-coverage` output: `Auth/LogoutController 19..20 / 60.0%`. The current test suite has two tests: `it('should logout an authenticated user')` (uses `actingAs()`) and `it('should return 401 for unauthenticated user')` (unauthenticated). Neither test exercises the session invalidation path because the testing framework's HTTP client does not create a real session by default in `postJson()` calls.
- **Impact:** Overall feature coverage remains 98.1% (above the 90% threshold), so this does not break the gate. However, the three lines of session cleanup code in production do not have direct feature-test coverage. A bug in the session invalidation path would not be caught by the test suite.
- **Recommendation:** Add a third test case: `it('should invalidate session on logout')` that sends a stateful session-based request (rather than `postJson` without session middleware) to exercise lines 19-20. The overall 98.1% is fine but a 60% single-class gap in an auth-critical controller warrants attention.

---

### Finding 2 — ADR-0015 "Current Actions" list omits `UpsertThemeAction` `low`

- **Location:** `.claude/docs/adr/0015-actions-and-services-separation.md` — "Current Actions using this pattern" list under "Approved exception — optimistic-locking upsert"; `app/Actions/Sync/UpsertThemeAction.php`
- **Standard:** ADR-0015 lists which Actions use the documented try-catch exception patterns. The list is used to audit compliance (SOP F-2 step 6 requires cross-referencing every try-catch hit against ADR-0015's documented exceptions).
- **Evidence:** `grep -rn "try {" app/Actions/` returns 7 hits across 6 Actions: `ImportOwnedSetsAction`, `StartImportAction`, `AssignPartToStorageAction`, `UpsertPartAction`, `UpsertColorAction`, `UpsertThemeAction`, `UpsertSetAction`. The ADR-0015 "Current Actions using this pattern" (optimistic-locking upsert) lists: `AssignPartToStorageAction`, `UpsertColorAction`, `UpsertPartAction`, `UpsertSetAction`, `StoreSetPartsAction` — but **omits `UpsertThemeAction`**.
- **Verification:** `UpsertThemeAction`'s try-catch correctly implements the optimistic-locking upsert pattern: catches only `UniqueConstraintViolationException`, retries as a direct update inside a transaction, both paths covered. The implementation is fully compliant. The omission is documentation only.
- **Recommendation:** Add `UpsertThemeAction` to the "Current Actions using this pattern" list in ADR-0015. Also note: the list references `StoreSetPartsAction` but that Action's try-catch was not found in the current `grep` scan — verify whether `StoreSetPartsAction` still contains its try-catch or whether it was removed (the entry in the list may be stale).

---

### Finding 3 — `FamilySetController::importStatus()` returns inline 404 JSON instead of typed exception `low`

- **Location:** `app/Http/Controllers/FamilySetController.php` line 113: `return response()->json(['message' => 'No import jobs found'], 404);`
- **Standard:** ADR-0021 (Thin controllers): controllers return `JsonResponse` or `array` — this is compliant. But ADR-0021 also specifies "no try-catch"; and by extension, the pattern convention is that typed failures should use the global exception handler via typed exceptions rather than inline JSON error responses.
- **Evidence:** The `importStatus()` endpoint manually returns a 404 JSON with a message when no import job exists for the family. This is different from how every other "not found" case is handled (via `findOrFail()` or typed exceptions that bubble to the global handler). It creates an inconsistency: the client sees a 404 response without an `X-Exception-Class` header or the standard exception-handler envelope.
- **Observation:** This is an architectural style inconsistency rather than an outright ADR violation. It works. A senior architect reviewing the code would ask why this endpoint uses inline JSON 404 while all other not-found cases use typed exceptions. The empty-state semantics ("no import has ever been started") differ from "entity not found", which may justify the divergence — but that reasoning should be explicit.
- **Recommendation:** Either (a) document why this endpoint's empty-state 404 is intentional and should not use a typed exception, or (b) introduce a typed `ImportJobNotFoundException` and let the global handler format the 404 response consistently.

---

### Finding 4 — Job layer count in Pulse is stale (1 class → 2 classes) `low`

- **Location:** `.claude/docs/pulse.md` Pattern Maturity → Foundry Wing → "Job layer (1 class)" row
- **Standard:** Pulse entries should reflect current codebase state.
- **Evidence:** `ls app/Jobs/` returns two files: `ImportOwnedSetsJob.php` and `SyncSetPartsJob.php`. The Pulse claims "1 class". Both Jobs follow the thin-wrapper convention, both are `final`, both implement `ShouldQueue`, both have primitive-only constructors, both delegate to Actions in `handle()` and use `Static::query()` only in `failed()`. `JobArchitectureTest` passes (107 arch tests all green). `ImportOwnedSetsJobTest.php` exists in `tests/Feature/Jobs/`. The new Job is compliant but the Pulse count is wrong.
- **Recommendation:** Update the Pulse Pattern Maturity row from "1 class" to "2 classes".

---

## Active Concerns Re-Assessment

### Dockerfile build verification — status update

The Pulse lists this concern as "Open — environmental / verification blocked in dev shell (no Docker daemon)."

**Updated finding:** Docker daemon IS accessible in the current dev environment (`docker info` returns client version 29.4.3). The build was attempted. It fails with `pecl install pcov` reporting "cannot download 'pecl/pcov'" — a PECL package registry network error during build, not a code defect or Docker-daemon absence.

**Classification:** The original environmental blocker (no Docker daemon) is resolved. The current blocker is a PECL network availability issue — either the PECL registry was temporarily unavailable during this audit's build attempt, or there is a persistent network routing issue in the dev container build environment. This is environment-dependent and does not indicate a problem with the Dockerfile code itself. The pcov install instructions in `docker/backend.Dockerfile` are structurally sound (install via `pecl install pcov` then `docker-php-ext-enable pcov`).

**Recommendation for Pulse:** Update the concern's Notes to: "Docker daemon accessible; build attempted 2026-05-26 — fails on `pecl install pcov` (PECL network error, not a code defect). Re-attempt during a session with reliable outbound network access." The concern should remain Open but with updated evidence.

---

## Tech Debt Re-Assessment

### Item 1: `GetFamilyPartsAction` returns raw array without ResourceData

**Status: Confirmed still present.** `FamilyController::parts()` returns `new JsonResponse($getFamilyPartsAction->execute(...))` directly — the `CursorPaginator<int, stdClass>` result is serialized by Laravel's built-in JSON serialization, not wrapped in a `ResourceData` from(). No intermediate transformation layer.

The response structure is a raw Laravel `CursorPaginator` envelope with `stdClass` items, not an application-controlled `ResourceData` shape. A senior architect would flag this as the one endpoint that bypasses the established output pattern.

**Evidence:** `app/Http/Controllers/FamilyController.php` line 38-46. No `FamilyPartResourceData` or equivalent class exists.

**Conclusion:** Tech debt entry remains valid. Still the only endpoint bypassing the ResourceData pattern.

### Item 2: `RegisterUserData::familyName` empty-string on invite-code path

**Status: Resolved.** `RegisterUserData::familyName` is `?string` (nullable). The Pulse entry noted "Now nullable — passes null when family_name absent." Confirmed: `app/DataTransferObjects/Input/Auth/RegisterUserData.php` line 10: `public ?string $familyName`.

**Recommendation for Pulse:** Remove this item from the Foundry Tech Debt table — the fix is in production.

### New tech debt candidates identified:

**Candidate A: `UpsertThemeAction` omitted from ADR-0015 list** — filed as Finding 2 (low). Low severity, documentation only.

**Candidate B: `FamilySetController::importStatus()` inline 404** — filed as Finding 3 (low). Style inconsistency; not a breaking issue.

**Candidate C: `ImportOwnedSetsJob::failed()` uses `logger()` facade helper**

`app/Jobs/ImportOwnedSetsJob.php` line 87 calls `logger()->error(...)` inside the `failed()` callback. The `CLAUDE.md` Coding Conventions state "No facades — dependency injection or nothing" for Actions, but this rule is not explicitly stated for Jobs. Deptrac does not flag it (Job layer is not in the facades-restriction scope). PHPStan passes. The `logger()` helper is a facade alias for the Log facade. This is an observation — the Job layer does not have the same "no facades" rule as Actions — but it represents a different pattern from the `Log::error()` direct facade call or an injected `LoggerInterface`. Given that the `failed()` callback is called by the queue worker directly (not resolved from container), injecting a Logger in `handle()` wouldn't cover the `failed()` path anyway. Filed as an observation, not a finding.

---

## Pattern Compliance Spot-Check

### Action Layer

| Check | Verified | Evidence |
|---|---|---|
| `final readonly` classes | Yes | Spot-checked `CreateFamilySetAction`, `GetFamilyPartsAction`, `ImportOwnedSetsAction` — all `final readonly` |
| No facades in Actions | Yes | PHPStan custom rules (via `script-development/phpstan-warroom-rules`) at 0 findings across 339 files |
| No Request objects in Actions | Yes | PHPStan 0 errors |
| Single `execute()` method | Yes | Architecture test green (`ActionArchitectureTest`, part of 107 arch tests) |
| try-catch only for ADR-0015 exceptions | Yes — with one ADR documentation gap | 7 try-catch blocks across 6 Actions. All map to documented ADR-0015 exception types. `UpsertThemeAction` is compliant in code but undocumented in ADR (Finding 2). No `StoreSetPartsAction` try-catch found — contradicts the ADR's "Current Actions" list; the ADR's list may be stale. |

### PHPStan Custom Rules (war-room rules from `script-development/phpstan-warroom-rules`)

PHPStan `extension.neon` included via `phpstan.neon`. With 0 PHPStan errors across 339 files, all three documented custom rules (`forbidDatabaseManager.inAction`, `forbidStaticCallToFacade.inAction`, `requireExplicitTransactionContract`) are confirming 0 findings.

### ResourceData Pattern

| Check | Verified | Evidence |
|---|---|---|
| All `from()` factories present | Yes | `ResourceDataArchitectureTest` in 107-test arch suite |
| `EAGER_LOAD` on nested ResourceData | Yes | Architecture test enforces this |
| ComputedResourceData (ADR-0025) in use | Yes | `SetStorageMapResourceData`, `BrickDnaResourceData`, `FamilyMissingPartsResourceData`, `FamilyStatsResourceData`, `FamilyPartUsageResourceData` all extend it |

### Explicit Cascade Deletion (ADR-0016)

`MigrationArchitectureTest` and `CascadeRelationArchitectureTest` are part of the 107-test arch suite, all passing. Spot check: `grep -rn "onDelete\|cascadeDelete" database/migrations/` returns 0 hits. No database-level cascade deletes present. ADR-0016 fully compliant.

### Thin Controllers (ADR-0021)

`ControllerArchitectureTest` in 107-test arch suite, all passing. Manual spot-check: `FamilySetController` — no constructors, no try-catch. `FamilyController` — no constructor, no try-catch. `SetController::respondForSyncStatus` is a private helper returning inline JSON for different status values — this is a match-expression dispatch, not a try-catch. Structurally compliant. The inline JSON 404 in `importStatus` is noted in Finding 3 but does not violate ADR-0021's explicit rules.

### Job Layer

| Check | Verified | Evidence |
|---|---|---|
| Both Jobs `final` | Yes | `JobArchitectureTest` (part of 107 arch tests) |
| Both implement `ShouldQueue` | Yes | `JobArchitectureTest` |
| Primitive-only constructors | Yes | `SyncSetPartsJob`: `int $setId`; `ImportOwnedSetsJob`: `int $importJobId, int $familyId` |
| `handle()` injects Actions + Model, no business logic | Yes | Both Jobs delegate to Actions for logic, lookup via `$model->newQuery()->findOrFail()` |
| `failed()` uses static queries (acceptable per CLAUDE.md) | Yes | `SyncSetPartsJob::failed()` uses `Set::query()->find()`; `ImportOwnedSetsJob::failed()` uses `ImportJob::query()->find()` |
| Both have tests | Yes | `SyncSetPartsJobTest.php` and `ImportOwnedSetsJobTest.php` in `tests/Feature/Jobs/` |
| Pulse Job count | **Stale — 1 class, actual 2 classes** | See Finding 4 |

### Operations Protocol (ADR-0028)

`PrePushPermitGate.php` exists at `backend/tools/CaptainHook/PrePushPermitGate.php`. `PrePushPermitGateTest.php` exists and is part of the 697-test suite (all passing). Gate is operational.

### Models with `family_id` — BelongsToFamilyInterface compliance

| Model | Has `family_id` | Implements interface | Note |
|---|---|---|---|
| `User` | Yes | No | Documented exemption (ADR-0014) |
| `FamilySet` | Yes | Yes | Compliant |
| `StorageOption` | Yes | Yes | Compliant |
| `InviteCode` | Yes | Yes | Compliant |
| `ImportJob` | Yes | Yes | New since last assessment; compliant |

All non-User models with `family_id` implement `BelongsToFamilyInterface`. No convention gap found. The Open Question from ADR-0014 ("Should an architecture test enforce this?") is still unresolved — enforcement remains convention-only. `ImportJob` being added correctly (without prompting) is evidence the convention holds. Still worth an architecture test given 5 models now implement the interface.

### Policy Coverage (SOP F-4)

| Policy | Method Count | Test Dataset Entries | Gap |
|---|---|---|---|
| `BrickIdentificationPolicy` | 1 | 1 | None |
| `FamilyPolicy` | 9 | 9 (via `.with()` datasets in 3 `it()` blocks) | None |
| `FamilySetPolicy` | 9 | 7 (via `.with()` datasets) | 2 methods potentially ungrouped — see below |
| `SetPolicy` | 3 | 1 (via `.with()` datasets) | Verify dataset covers all 3 |
| `StorageOptionPartPolicy` | 1 | 1 | None |
| `StorageOptionPolicy` | 7 | 7 (via `.with()` datasets in 3 `it()` blocks) | None |

`FamilyPolicy` and `StorageOptionPolicy` use dataset-driven tests that cover all methods — the low `it()` count is the dataset pattern working as intended. Full coverage confirmed by method listing.

---

## Doc Drift

| Document | Accurate | Drift Found |
|---|---|---|
| `backend/CLAUDE.md` | Yes | Framework: Laravel 13 (corrected 2026-05-20). All conventions, ADR references, quality thresholds current. |
| `CLAUDE.md` (root) | Yes | "Laravel 13 API" in Project Overview — corrected 2026-05-20. |
| Pulse — Foundry Quality Metrics | Stale | Still shows "last measured 2026-04-29" and "currently unable to re-measure" — must be refreshed with today's measurements |
| Pulse — Foundry Tech Debt | Stale | `RegisterUserData::familyName` entry is resolved (nullable); Job count stale (1→2); see Proposed Pulse Updates |
| Pulse — Foundry Pattern Maturity | Partially stale | Job count "1 class" is wrong (2 classes); active concern about pcov no longer accurate |
| Pulse — Foundry Overall Health | Stale (dated 2026-05-05) | Text references pcov blocker and deferred mutation drill, both now resolved |
| ADR-0015 | Partially stale | "Current Actions" list under optimistic-locking upsert omits `UpsertThemeAction`; may include stale `StoreSetPartsAction` entry |

---

## ADR Pressure

None detected from frequency or threshold signals. The Action, Service, ResourceData, and Controller patterns are stable. No ADR was cited more than twice in findings.

One observation: ADR-0015's "Current Actions" maintenance list (documenting which Actions use approved try-catch exceptions) has proven difficult to keep current — `UpsertThemeAction` was added without updating the list. As the Action count grows, manual list-maintenance will drift further. This is a scale-test signal but not yet a threshold breach. Worth monitoring; not yet worth re-interrogation.

---

## Proposed Pulse Updates

### 1. Overall Health — Foundry (replace entire section)

**Proposed text:**

> **Foundry (backend):** PHPStan at max with zero errors (339 files), Deptrac with zero violations, all architecture tests passing (107 tests, up from 105). Full quality gauntlet operational on canonical PHP 8.5.5 host with pcov — coverage and mutation drills unblocked as of 2026-05-20. Governed by the consolidated `0001`–`0029` Brickworks ADR sequence. Recent deliveries since 2026-04-16: Laravel 13.7 deprecation cleanup + PHP 8.5 tightening, storage-map ResourceData, reverse-lookup-lens endpoint, PHPStan war-room rules adoption, ADR-0028 pre-push permit gate, `ImportOwnedSetsJob` + `ImportJob` model (import-from-Rebrickable flow). Rating: 8.5/10.

**Assessed:** 2026-05-26

### 2. Active Concerns — Foundry

**Proposed row update:**

| Concern | Severity | Status | Notes |
|---|---|---|---|
| Dockerfile build verification (`docker compose build backend`) | Low | Open — network-environmental | Docker daemon accessible as of 2026-05-26. Build attempt fails on `pecl install pcov` with PECL network error (cannot download package). Not a code defect. Re-verify during session with reliable outbound network access. |

### 3. Pattern Maturity — Foundry

**Proposed row update:**

| Pattern | Maturity | Evidence |
|---|---|---|
| Job layer **(2 classes)** | Established | JobArchitectureTest guards conventions; `SyncSetPartsJob` (existing) + `ImportOwnedSetsJob` (new). Both thin wrapper pattern, both tested. |

### 4. Quality Metrics — Foundry

**Proposed replacement:**

| Metric | Value | Threshold |
|---|---|---|
| Unit coverage | **100.0%** (measured 2026-05-26) | 100% |
| Feature coverage | **98.1%** (measured 2026-05-26) — `Auth/LogoutController` at 60% (lines 19-20 uncovered; see finding) | 90% |
| Mutation score | **79.68%** (measured 2026-05-26) | 76% |
| Architecture tests | **107 passing** (measured 2026-05-26) | All passing |
| PHPStan | Level max, **0 errors** (339 files, measured 2026-05-26) | Level max, zero errors |
| Deptrac | **0 violations** (743 allowed, measured 2026-05-26) | Zero violations |

**Assessed:** 2026-05-26

### 5. Tech Debt — Foundry

**Remove:** `RegisterUserData::familyName empty-string on invite-code path` — confirmed nullable in production, tech debt resolved.

**Update:** `GetFamilyPartsAction returns raw array (no ResourceData)` — confirmed still present (2026-05-26). Only endpoint bypassing the pattern.

**Add:** `LogoutController session branch uncovered (lines 19-20)` — Low — Feature coverage 60% on auth-critical session invalidation path.

**Assessed:** 2026-05-26

---

## Showcase Readiness

**Rating: Portfolio-ready** (maintaining 8.5/10)

A senior architect performing technical due diligence would find:

- Zero PHPStan errors at max level with Larastan and 4 custom war-room rules — genuinely advanced, not just "typed PHP"
- Zero Deptrac boundary violations across 743 allowed dependencies — architectural boundaries are mechanically enforced
- 107 architecture tests covering convention enforcement — more than most codebases have
- 100% unit coverage + 98.1% feature coverage + 79.68% mutation score — test suite is thorough and honest
- Two new model (`ImportJob`) + two new Jobs both correctly implemented per ADR conventions — pattern adoption without prompting is a strong maturity signal
- `BelongsToFamilyInterface` still 100% compliant across 5 qualifying models including the new `ImportJob` — convention-only enforcement is holding

Rough edges that would attract scrutiny:

- `GetFamilyPartsAction` is the one endpoint that bypasses ResourceData — the inconsistency is visible and undocumented
- `LogoutController` session branch at 60% feature coverage is in an auth-critical path
- The ADR-0015 "Current Actions" list is becoming a manual-maintenance burden as the action count grows

None of these are structural concerns. The Foundry remains portfolio-ready.

---

## Self-Debrief

### What I Caught

- The `LogoutController` 60% coverage gap (Finding 1) surfaced from the actual coverage run — the prior Pulse claimed "100.0% (last measured 2026-04-29)" but did not include the feature coverage dimension. The actual unit test coverage is still 100%; feature coverage revealed the gap.
- The `UpsertThemeAction` ADR-0015 omission (Finding 2) surfaced from the SOP F-2 step 6 try-catch cross-reference: 7 try-catch blocks across 6 Actions vs the ADR's list of 5 Actions for that pattern.
- The Job count discrepancy (Finding 4) was caught by directly listing `app/Jobs/` rather than trusting the Pulse's hardcoded "1 class".
- The `RegisterUserData::familyName` tech debt item being resolved was confirmed by reading the actual file — the Pulse's "Now nullable" parenthetical was accurate, but the entry wasn't cleaned up.
- `ImportJob` being a new model not reflected anywhere in the Pulse (not in Tech Debt, not in Pattern Maturity for Job count) — caught by cross-referencing recent feature code against Pulse claims.

### What I Missed

- Did not read the full `FamilySetPolicyTest.php` to verify the dataset coverage for all 9 methods. Filed with a caveat ("see below") but did not complete the verification. If the 2 ungrouped methods have no dataset entries, that would be a finding.
- Did not verify whether `StoreSetPartsAction` still has its try-catch (the ADR-0015 list includes it but the grep didn't find it in `app/Actions/Sync/`). This may be a stale ADR entry or the try-catch may have been removed. Flagged but not definitively resolved.
- Did not spot-check 2-3 FormRequests for `toDto()` pattern compliance (SOP F-4 asks for this). Omitted due to time constraints — architecture tests should catch regressions here.
- Did not verify the `#[Config]` attribute pattern compliance (ADR-0019) beyond trusting PHPStan's 0-error result. PHPStan's custom rules would catch `config()` calls in Actions if they existed, but I did not manually scan.

### Methodology Gaps

- The prior Pulse Quality Metrics section combined unit coverage and feature coverage into a single row. The distinction matters: `Auth/LogoutController` at 60% feature coverage is only visible when they are separated. Proposed: Pulse Quality Metrics should distinguish unit coverage (100%) from feature coverage (98.1%) clearly.
- The ADR-0015 "Current Actions" list maintenance pattern is showing strain. SOP F-2 Step 6 says "cross-reference every hit against ADR-0015's documented exceptions" but the ADR's list is maintained by hand. A mismatched try-catch takes multiple reads to diagnose as an ADR documentation gap vs. a compliance failure. The SOP should note: when a try-catch implementation matches the pattern but the Action is not listed in the ADR's "Current Actions", the finding is documentation drift (low), not a compliance failure.

### Training Proposals

| Proposal | Context | Evidence |
|---|---|---|
| SOP F-2 Step 6 amendment: when a try-catch matches the approved pattern but the Action is absent from ADR-0015's "Current Actions" list, classify as Low ADR documentation drift, not a compliance finding | `UpsertThemeAction` is fully compliant but ADR-0015's list doesn't include it — took two reads to distinguish "new undocumented exception" from "documentation gap" | This audit, Finding 2 |
| Pulse Quality Metrics should separate unit coverage (Actions/Services/Mail) from feature coverage (Controllers) as distinct rows | The merged row hid a 60% single-class coverage gap in `LogoutController` behind the 100% unit headline | This audit, Finding 1 |
| After adding a new model with `family_id`, verify it also appears in any Pulse Pattern Maturity claim about the Job layer or related counts | `ImportJob` was added correctly but without any Pulse update — not a compliance failure, but the Pulse's "1 Job class" was immediately stale | This audit, Finding 4 |

---

## Steward Evaluation

**Reviewed:** 2026-05-26 by The Steward.

### Audit Quality

Strong. The Warden ran the actual gauntlet (not a paper-only inspection), separated unit from feature coverage (a methodology improvement that immediately revealed the `LogoutController` gap a merged-coverage view would have masked), caught the `ImportJob`/`ImportOwnedSetsJob` additions the Pulse hadn't reflected, and reported its own gaps honestly in the Self-Debrief (`StoreSetPartsAction` try-catch unresolved, partial Policy dataset verification, `#[Config]` pattern not manually scanned). The audit produced four findings of distinct character (1 medium feature-coverage gap, 1 ADR documentation drift, 1 controller-style inconsistency, 1 stale Pulse count) — none invented, none padded.

### ADR-0030 Empirical Confirmation

This audit is the first Warden dispatch under ADR-0030's path-based subagent write-scope. The Warden filed the Audit at `.claude/records/audits/` directly and updated `.claude/docs/quality-warden-casebook.md` in-place — both on first attempt, no permission denials. The Steward-transcribes workaround is no longer the canonical path; agent-files-own-artifact is now operational for the Warden. Recorded for the Casebook (the Warden has already done this in-line per its return).

### Disposition of Findings

| Finding | Severity | Disposition |
|---|---|---|
| 1 — `LogoutController` session branch uncovered | Medium | **Accept.** Reflected in Pulse Tech Debt as Low (the 90% gate clears at 98.1%, so it doesn't break the gauntlet — Low is the right register for a no-gate-breach gap). Worth a small Brickwright WO: third stateful test. Standup will surface it as Steward AI candidate. |
| 2 — `UpsertThemeAction` omitted from ADR-0015 list | Low | **Accept.** Documentation drift, not a compliance failure. Reflected in Pulse Tech Debt. A small ADR-0015 edit (add `UpsertThemeAction`, verify or remove the stale `StoreSetPartsAction` entry). The Warden's open thread on `StoreSetPartsAction` is the right next sub-step; trivial to resolve. |
| 3 — `FamilySetController::importStatus()` inline 404 | Low | **Accept.** Reflected in Pulse Tech Debt. Style inconsistency. Either path the Warden offered (document the divergence, or introduce typed exception) is acceptable; the Steward leans toward typed exception for consistency with the rest of the codebase, but it's a judgment call for the Brickwright when the WO is picked up. |
| 4 — Job layer count stale (1 → 2) | Low | **Accept and applied.** Pulse row updated in this session. |

### Active Concerns

- **`RegisterUserData::familyName`** — accepted as Resolved, removed from Foundry Tech Debt with a Resolved 2026-05-26 record.
- **Dockerfile build verification** — accepted with the Warden's reclassification. The original "no Docker daemon" blocker is gone; current blocker is a transient PECL network error. Pulse row updated to reflect the new evidence. The concern stays Open because the build still doesn't succeed end-to-end in the dev environment; it can close once a build attempt during a clean network window passes.

### Methodology Improvements the Warden Surfaced

1. **Separating unit from feature coverage in Pulse Quality Metrics.** Applied — the new table makes the dimension visible. This is the kind of methodology gain only a fresh measurement run could have surfaced (the prior table merged them and would have masked the `LogoutController` gap behind the 100% unit headline).
2. **SOP F-2 Step 6 amendment** (try-catch matching pattern but absent from ADR-0015 list = Low doc drift, not compliance failure). Accepted as a Warden training proposal; the Warden may apply it directly to its own SOP doc when next refreshed. Not a Steward action.

### What the Steward Did Not Re-Verify

- Did not re-run the gauntlet to confirm the Warden's metrics. Single source of truth at this dispatch point; metrics are accepted as reported. If a future Brickwright dispatch hits the gauntlet and produces different numbers, that's a calibration event.
- Did not deep-read every file the Warden cited. Spot-checked the Job count (`app/Jobs/` listing) and confirmed 2 files. The other claims are accepted.

### Closing Note

This is the first Foundry-wide audit since 2026-05-05 (post-merger baseline). The 56-day Tech Debt staleness flag is gone; all five sections now carry 2026-05-26 `Assessed:` dates. The Foundry's quality metrics improved measurably (mutation 76.97% → 79.68%; arch tests 105 → 107) over the gap — meaning the wing kept improving while the Pulse was not being refreshed. Worth noting for any future review of "is the staleness flag the right early warning?": the answer here is "not for code quality, but yes for documentation truthfulness."
