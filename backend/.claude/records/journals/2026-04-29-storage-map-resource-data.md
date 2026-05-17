# Shift Log: Wrap Storage Map Endpoint in ResourceData

**Log #:** 2026-04-29-storage-map-resource-data
**Filed:** 2026-04-29
**Shipping Order:** [`2026-04-29-storage-map-resource-data`](../permits/2026-04-29-storage-map-resource-data.md)
**Sorter:** Head Sorter

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Created | `app/DataTransferObjects/Result/Set/StorageMapEntryData.php` | Per-row entry DTO — five primitives mirroring the snake_case wire fields (`partId`, `colorId` nullable, `storageOptionId`, `storageOptionName`, `quantity`). Lives under `Result/` per ADR-0010. |
| Created | `app/DataTransferObjects/Result/Set/SetStorageMapData.php` | Envelope Result DTO carrying `list<StorageMapEntryData>`. Mirrors the `FamilyMissingPartsData` analog so the action returns a single envelope, matching every other ComputedResourceData precedent. See Decision #1 below. |
| Created | `app/Http/Resources/SetStorageMapResourceData.php` | `final readonly`, extends `ComputedResourceData<SetStorageMapData>`, static `from()` factory flattens the entry DTOs to snake_case arrays — same flattening pattern as `FamilyPartUsageResourceData`. |
| Modified | `app/Actions/GetSetStorageMapAction.php` | Return type changed from `array<int, array{...}>` to `SetStorageMapData`. Switched the join query from Eloquent `get()` + `getAttribute()` to `toBase()->get()` returning `stdClass` per the graduated training (no more `getAttribute()` + `@phpstan-ignore` lines, just `cast.int` / `cast.string` ignores on the stdClass property reads). Inline PHPDoc array shape removed — DTO is the type. |
| Modified | `app/Http/Controllers/SetController.php` | `storageMap()` now calls `SetStorageMapResourceData::from($setStorageMapData)->toResponse()`. The bare `new JsonResponse(...)` is gone. |
| Modified | `tests/Unit/Actions/GetSetStorageMapActionTest.php` | Three scenarios: empty result returns `SetStorageMapData(entries: [])`, populated result returns properly typed entry DTOs, null `color_id` is preserved on the entry DTO. Mocks updated for the `toBase()->get()` pattern using `BaseBuilder`, mirroring the existing `GetFamilyMissingPartsActionTest` shape. |
| Modified | `tests/Feature/Controllers/SetControllerTest.php` | Replaced the old "should return 200" test with two assertions — empty envelope (`assertExactJson(['entries' => []])`) and a populated envelope with a real `StorageOption` + `StorageOptionPart` row. Both lock the wire shape end-to-end. |

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| `GetSetStorageMapAction::execute()` declared return type is `list<StorageMapEntryData>` (or equivalent typed collection); no inline array-shape PHPDoc | Yes (with deviation) | Returns `SetStorageMapData` (envelope wrapping `list<StorageMapEntryData>`) instead of a bare `list<StorageMapEntryData>`. See Decision #1 — the envelope is required for the canonical `ComputedResourceData::from(object $resultData)` signature and matches every existing ComputedResourceData precedent. The permit's intent — typed Result DTO instead of raw array literal, no inline array-shape PHPDoc — is fully met. |
| `App\DataTransferObjects\Result\Set\StorageMapEntryData` exists, is `final readonly`, lives under `Result/` per ADR-0010 | Yes | Pure primitives, no Model deps, passes `DataTransferObjectPlacementTest`. |
| `App\Http\Resources\SetStorageMapResourceData` exists, is `final readonly`, extends `ComputedResourceData`, static `from()` factory | Yes | No sibling entry ResourceData created — followed the established pattern in `FamilyPartUsageResourceData` / `FamilyMissingPartsResourceData` of flattening entries to `list<array{...}>` inline. Added classes count: 3 (envelope DTO, entry DTO, resource data). The permit's "or sibling entry ResourceData" was an option, not a requirement. |
| `SetController::storageMap()` returns the new ResourceData via `->toResponse()` | Yes | `new JsonResponse(...)` removed. |
| `composer test:arch` passes — `DataTransferObjectPlacementTest` and `ResourceDataArchitectureTest` accept the new classes | Yes | 90 architecture tests pass (1678 assertions). |
| `composer phpstan` and `composer deptrac` pass at level max | Pass on my changes | Deptrac: 0 violations. PHPStan: 0 errors on any of my new/modified files. The 6 errors PHPStan reports (`ImportOwnedSetsJob.php`, `config/sanctum.php`, `ImportOwnedSetsJobTest.php`) are **pre-existing** — confirmed by running `git stash && composer phpstan` on a clean main: same 6 errors. They stem from missing `Illuminate\Queue\Attributes\Timeout` / `FailOnTimeout` / `PreventRequestForgery` symbols, which appear to be Laravel 13 API drift unrelated to this shipping order. Flagging this for the Logistics Director as out-of-scope tech debt. |
| Feature test for `/sets/{setNum}/storage-map` asserts the chosen response shape end-to-end | Yes | Two scenarios with `assertExactJson` — empty envelope and populated entry. Both lock the `entries` key and the snake_case row shape. |
| Unit test for `GetSetStorageMapAction` asserts the Result DTO return value, not the old array literal | Yes | Three scenarios assert `instanceof SetStorageMapData` and entry-level field access on `StorageMapEntryData` instances. |
| `composer test:coverage` and `composer test:feature-coverage` hold their thresholds (100% / 90%) | Cannot measure | Coverage driver missing in this environment — pulse documents this as Open tech debt under "PHP coverage driver missing from environment." Same constraint hits `composer mutation`. All three commands fail with `No code coverage driver is available.` This is environmental, not a regression caused by this shift. |
| Shift log records which option (A or B) was chosen and why, plus a one-line note on whether a Plate permit is required | Yes | This document. **Option A (wrapped envelope `{entries: [...]}`).** **Plate permit IS required** — the wire shape changed from a top-level array to a wrapped object. |

## Decisions Made

1. **Option A (wrapped envelope `{entries: [...]}`) chosen over Option B (flat top-level array).** Three reasons:
   - **Canonical pattern.** The base `ComputedResourceData::toResponse()` walks `get_object_vars($this)` and emits a JSON object keyed by property names — there is no idiomatic way to make it emit a top-level JSON array. Option B would require either bypassing `toResponse()` entirely (back to a `new JsonResponse(...)` in the controller, which defeats the whole exercise) or a Controller-side `array_map(...->toArray())` step that spreads the shaping logic across two files.
   - **Architecture-test visibility.** With Option A, the entire wire shape lives inside a `final readonly` class with a `from()` factory that the `ResourceDataArchitectureTest` battery sees. Future drift gets caught by the suite.
   - **Existing precedent.** Every other ComputedResourceData in the codebase (`FamilyMissingPartsResourceData`, `FamilyPartUsageResourceData`, `BrickDnaResourceData`, `FamilyStatsResourceData`) is a wrapped envelope. Option B would have been an outlier.

2. **Added a `SetStorageMapData` envelope DTO instead of returning bare `list<StorageMapEntryData>` from the action.** The permit's literal text said "return `list<StorageMapEntryData>`" — but the cited reference implementation (`FamilyMissingPartsResourceData` paired with `FamilyMissingPartsData`) wraps the list in a Result DTO envelope, and the abstract `ComputedResourceData::from(object $resultData)` signature requires a single object input. Returning a bare list would have forced one of: a custom non-`from()` factory on the ResourceData (architecture test still passes since `from()` exists, but adds API surface), or a Controller-side `array_map`-then-construct (back to spreading shaping logic). The envelope is the minimum-surface, maximum-precedent path. The shape on the wire is identical either way — `{entries: [...]}` — because that's what the ResourceData property's name dictates.

3. **No sibling `StorageMapEntryResourceData` class.** The permit floated this as an option ("`{entries: StorageMapEntryResourceData[]}`"). The four existing ComputedResourceData examples all flatten nested DTOs to `list<array{...}>` inline via the parent's `from()` method. I followed that precedent — fewer classes, same wire shape, identical architecture-test coverage. If a sibling class were warranted (e.g., entries reused across multiple endpoints), that would be a separate refactor.

4. **Switched the join query from `get()` + `getAttribute()` to `toBase()->get()` returning `stdClass`.** The graduated training in the head-sorter agent file (Actions section: "When using raw SQL joins or aggregates, use `->toBase()->get()` returning `stdClass`") applies here. The original code used `getAttribute('storage_option_name')` with `mixed` returns and a `@var string` annotation — the new shape uses `stdClass` property access and explicit casts, which PHPStan handles cleanly with `cast.*` ignores instead of opaque `mixed` ignores. Net `@phpstan-ignore` lines: 5 (one per cast on the stdClass property), versus the original's `mixed` workaround. This isn't a regression — it's the documented way to write join queries here.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | After one round of Rector auto-fixes (param renames in the `array_map` lambda and import ordering in the feature test). Final run: clean. |
| phpstan | Pass on this shift's files | 6 pre-existing errors in `ImportOwnedSetsJob.php`, `config/sanctum.php`, `ImportOwnedSetsJobTest.php` — verified pre-existing via `git stash && composer phpstan` on a clean main. Out of scope for this order; flagged here for the Logistics Director. None of my files contribute errors. |
| deptrac | Pass | 0 violations, 651 allowed dependencies. The `ResourceData → ResultDTO` edge already exists in `deptrac.yaml`, so the new `SetStorageMapResourceData` slots in cleanly. |
| test | Pass on this shift's files | 568 of 569 tests pass. The one failure (`ImportOwnedSetsJobTest > 'should declare a 600 second timeout via the …'`) is the same pre-existing Laravel 13 attribute-class drift caught by PHPStan. Confirmed pre-existing on clean main. |
| test:coverage | Cannot measure | `No code coverage driver is available.` — environmental, documented as Open in `pulse.md` under "PHP coverage driver missing from environment." |
| test:feature-coverage | Cannot measure | Same root cause. |
| mutation | Cannot measure | Same root cause — Pest aborts with "Mutation testing requires code coverage to be enabled." |

Filtered run for this shift's surface area (`php artisan test --filter "GetSetStorageMapAction|storageMap|SetStorageMapResourceData|StorageMapEntryData|SetStorageMapData"`): **7 passed, 44 assertions, 0 failures.**

## Showcase Readiness

Strong. The endpoint now follows the same pattern as the other 33 — a senior architect auditing the warehouse will see one consistent response-shaping mechanism, no special cases. The architecture-test net (`ResourceDataArchitectureTest`, `DataTransferObjectPlacementTest`) now covers this endpoint; if anyone later changes the action's return type to bypass the ResourceData layer, the tests fail before the commit lands. The `toBase()->get()` migration is a quiet bonus — it brings this action's query style in line with the other join-aggregate Actions (`GetFamilyMissingPartsAction`, `GetFamilySetCompletionAction`, `GetFamilyPartUsageAction`).

Two soft spots an auditor might call out:

- The `@phpstan-ignore cast.int` / `cast.string` lines on the `stdClass` property reads. These are the documented pattern for raw join queries here, but a future cleanup could use a typed-array accessor helper. Out of scope for this compliance fix.
- The wire shape change is a breaking contract change for the Plate. Mitigated by the paired Plate permit the Logistics Director will dispatch.

## Proposed Knowledge Updates

- **Learnings:** No new learnings — the relevant gotcha (`toBase()->get()` for join queries) is already a graduated training rule. The "envelope DTO required for ComputedResourceData::from()" pattern was already implicit in the four existing analogs.
- **Pulse:** Suggest the Logistics Director update the "Pattern Maturity" row for ResourceData (currently 18 classes) to 19, and the "ComputedResourceData (ADR-0010) handles DTO-sourced responses" line to mention `SetStorageMapResourceData` as the latest application. Also: the "`GetFamilyPartsAction` returns raw array (no ResourceData)" entry under Tech Debt — verify whether this gap still exists; if so, it's now the only remaining endpoint without ResourceData wrapping.
- **Decision Record:** No new ADR needed. ADR-0006 and ADR-0010 already mandate this pattern — this shift is enforcement, not new architecture.

**Out-of-scope tech debt surfaced during this shift (Logistics Director should consider a separate shipping order):**

1. **Laravel 13 attribute drift in `ImportOwnedSetsJob`.** `Illuminate\Queue\Attributes\Timeout` and `FailOnTimeout` no longer exist as classes in the current Laravel install. PHPStan flags this as `attribute.notFound` (lines 17, 18 of `ImportOwnedSetsJob.php` and lines 192/197/206 of `ImportOwnedSetsJobTest.php`). Same root cause: one feature test fails. The Pulse health rating of 8.5/10 was assessed 2026-04-16; the Laravel 13 upgrade journals (`2026-04-19-laravel-13-upgrade.md`, `2026-04-19-laravel-13-mutation-drill.md`) are dated after that. This may already be a tracked item under the Laravel 13 upgrade — the Logistics Director should verify.
2. **`config/sanctum.php` references missing class** `Illuminate\Foundation\Http\Middleware\PreventRequestForgery` (line 85). Same Laravel 13 API drift category.

## Self-Debrief

### What Went Well

- **Reading the analogs first paid off.** Spending five minutes on `FamilyMissingPartsResourceData` + `FamilyMissingPartsData` + `FamilyPartUsageResourceData` clarified the canonical envelope-with-flattened-entries pattern before I wrote a line of new code. The decisions about Option A vs B, sibling-vs-flatten, and envelope-vs-bare-list all fell out naturally.
- **Test file structure mirrors the unit-test analog.** The new `(object) [...]` stdClass row mocks in `GetSetStorageMapActionTest` matched the shape used in the existing join-action test files exactly. No invention required.
- **Permit deviations were intentional and documentable.** I noticed the literal "return `list<StorageMapEntryData>`" wording in the permit conflicted with the abstract `ComputedResourceData::from(object $resultData)` signature, paused, evaluated, and chose the deviation that preserved both the permit's intent and the four existing precedents. Documented inline in Decision #2 rather than rebuilding silently.

### What Went Poorly

- **First Action draft returned `list<StorageMapEntryData>` directly.** Caught this within seconds of reading the ComputedResourceData abstract base — but I had already typed the file. One round of self-correction. Cheap, but reads as "didn't think it through end-to-end before typing."
- **Did not run the gauntlet on a clean main first to baseline pre-existing PHPStan/test errors.** When the first PHPStan run reported 6 errors, I had to do an extra `git stash` round-trip to confirm they were pre-existing. Half a minute, but the prudent move would have been to baseline before touching anything when the pulse health rating predates the Laravel 13 work.

### Blind Spots

- I almost didn't think to test the **`null color_id` path** (third unit test). Storage option parts can have null colors — the permit and the original code both supported this — but the second test only exercised a non-null `color_id`. Adding the null case was a deliberate "before I close this, walk through the column nullabilities" pass.
- I did **not** examine ETag/Cache-Control behavior on the new wire shape. The permit says "Caching middleware on the route ... already correct, leave it" — but a wire-shape change *will* change the ETag because the response body bytes change. The cache header test in `ResponseCachingTest.php` only asserts `assertHeader('ETag')` (presence, not value) and `assertHeader('Cache-Control', 'max-age=3600, private')` (a fixed value), so the test still passes. But the **client's existing ETag tokens are now stale** — every cached client will get a 200 + new body on first request after deploy, and the new ETag from there. Worth noting for the Plate permit dispatch.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| Before drafting an Action that will be paired with a `ComputedResourceData`, check the abstract base's `from()` signature first — if it takes a single `object`, the Action's return type must be a single envelope DTO, not a `list<...>` | I drafted the action with `list<StorageMapEntryData>` as the return type, then immediately had to backtrack when the ResourceData couldn't consume it. The base class signature is the authoritative constraint, not the permit wording. | 2026-04-29-storage-map-resource-data |
| Before running the gauntlet, baseline pre-existing failures by running it on the clean main first whenever the pulse health rating predates recent journal entries | I ran PHPStan and saw 6 errors, had to stash to confirm they were pre-existing. The Pulse "0 PHPStan errors" was assessed 2026-04-16, but Laravel 13 upgrade journals are dated 2026-04-19 — that drift gap is exactly when pre-existing baseline noise accumulates. | 2026-04-29-storage-map-resource-data |
| When changing a wire shape on a route that has response caching, explicitly call out client ETag staleness in the shift log even if the cache-header test still passes | Cache headers (`ETag`, `Cache-Control: max-age=3600, private`) survive the change because their tests assert presence, not value. But the body changed, so every existing client cache token is now stale on first post-deploy request. The permit told me to leave caching alone — correct — but the staleness consequence still belongs in the dispatch back. | 2026-04-29-storage-map-resource-data |

---

## Logistics Director Evaluation

**Overall Assessment:** Excellent

### Order Fulfillment Review

Every acceptance criterion is met within the bounds the environment allowed. The one literal-text deviation (envelope DTO instead of bare `list<StorageMapEntryData>`) is **legitimate and well-handled** — the Sorter caught a real conflict between the permit's wording and the framework's `ComputedResourceData::from(object $resultData)` contract, paused, surfaced four existing precedents, chose the path of minimum API surface, and documented inline (Decision #2). The permit's *intent* — typed Result DTO replacing an array literal, no inline array-shape PHPDoc, response shaped by a class the architecture tests can see — is fully delivered. Wire shape on the wire is identical to what Option A specified.

The two unmeasurable acceptance criteria (`test:coverage`, `test:feature-coverage`, plus mutation by extension) are blocked by an environmental gap that is already documented in `pulse.md` and pre-dates this shift. The Sorter ran a filtered test suite over the shift's surface area (7 passed, 44 assertions) which gives us substitute confidence on the new code, but the coverage threshold itself cannot be enforced this shift. Recording this constraint, not penalizing it.

The 6 pre-existing PHPStan errors and 1 pre-existing test failure were verified-pre-existing via `git stash` round-trip — exactly the right move. None of them are this shift's responsibility.

### Decision Review

Four decisions, all sound:

1. **Option A (wrapped envelope)** — three-pillar reasoning (canonical pattern, arch-test visibility, existing precedent). The argument that `ComputedResourceData::toResponse()` walks `get_object_vars($this)` and emits a JSON object — meaning Option B would require bypassing the base class entirely — is the load-bearing point. Approved.

2. **Envelope DTO over bare list** — the right call. The four existing analogs (`FamilyMissingPartsData`, `FamilyPartUsageData`, `BrickDnaData`, `FamilyStatsData`) all wrap their lists, and the `ComputedResourceData::from(object $resultData)` signature requires it. Permit authoring lesson on my side: I should have written "typed Result DTO replacing the array literal" rather than literally `list<StorageMapEntryData>` — the Sorter was forced to read between the lines. Approved.

3. **No sibling entry ResourceData** — followed the four existing precedents (flatten inline). Approved without commentary.

4. **`toBase()->get()` + `stdClass` migration** — applies a graduated training rule from this agent's own training. The Sorter recognized that the existing code's `getAttribute() + @phpstan-ignore mixed` pattern was the older, less-clean style, and migrated to the documented one as part of the touch. Not scope creep — this is the line in the regulation manual the agent was trained to follow. Approved.

None of these warranted CEO escalation. The Sorter's judgment held.

### Showcase Assessment

Strong. The delivery materially improves the warehouse — one less special case, one more endpoint inside the architecture-test net. A senior architect auditing the codebase will see `SetStorageMapResourceData` slot into the same row as `FamilyMissingPartsResourceData` / `FamilyPartUsageResourceData` and find no special-casing. The `toBase()->get()` cleanup is a quiet portfolio win in the same file.

The one polish item the Sorter named honestly — the `@phpstan-ignore cast.*` lines on the stdClass property reads — is the documented pattern, not a regression. Out of scope, correctly identified.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| Before drafting an Action paired with `ComputedResourceData`, check the abstract base's `from()` signature first — if it takes a single `object`, the Action's return type must be a single envelope DTO, not a `list<...>` | Candidate | Concrete trigger condition (Action paired with ComputedResourceData), specific check (abstract `from()` signature), prevents a real backtrack observed this shift. Will graduate on a second confirming observation. |
| Before running the gauntlet, baseline pre-existing failures on the clean main first whenever the pulse health rating predates recent journal entries | Candidate | Specific trigger (pulse rating older than recent journals), specific action (clean-main baseline before any work), evidence-backed (the `git stash` round-trip cost half a minute this shift). Will graduate on a second confirming observation. |
| When changing a wire shape on a route with response caching, explicitly call out client ETag staleness in the shift log even if the cache-header test still passes | Candidate | Strong specificity (wire shape change + cached route → staleness note), addresses a real dispatch-time hazard (the Plate architect needs to know about post-deploy first-request behavior). Will graduate on a second confirming observation. |

No graduations this round — all three are first observations.

### Notes for the Sorter

Three things to keep doing:

1. **Reading the analogs first.** The five-minute upfront read of `FamilyMissingPartsResourceData` and friends paid the entire shift. Don't shortcut this when the reference is named in the permit.
2. **Pausing on permit-literal vs framework-contract conflicts.** The envelope decision was the test case. You paused, surfaced the conflict, documented both sides, chose the path that preserved intent. That is exactly the protocol — keep doing it.
3. **The Blind Spot self-catch on `null color_id`.** "Before I close this, walk through the column nullabilities" recovered a missing test. That's the kind of pre-close pass that separates a Sorter from a senior Sorter.

One thing to do differently next time: the first PHPStan run reporting 6 errors should have triggered a clean-main baseline check immediately, not after the second look. Your own training proposal #2 covers this — once it graduates, this becomes muscle memory.

The pulse-update suggestion (ResourceData class count 18 → 19) and the Tech Debt entry verification on `GetFamilyPartsAction` are both reasonable. I'll handle the pulse update separately so it doesn't blur this shift's record.

**Out-of-scope tech debt accepted into the queue:**

- Laravel 13 attribute-class drift (`Illuminate\Queue\Attributes\Timeout`, `FailOnTimeout`, `PreventRequestForgery`). I'll cross-check against the Laravel 13 upgrade journals (2026-04-19) before deciding whether a fresh shipping order is needed or whether this is already captured.
- Coverage driver missing in this environment. This blocks ADR-0003's mutation/coverage thresholds across every shift in this environment — it's no longer "open tech debt," it's a regulation enforcement gap. Candidate for its own urgent shipping order.

Permit `2026-04-29-storage-map-resource-data` is closed. Plate dispatch follows.
