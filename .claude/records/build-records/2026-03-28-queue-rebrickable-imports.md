# Shift Log: Queue Rebrickable Imports

**Log #:** 2026-03-28-queue-rebrickable-imports
**Filed:** 2026-03-29
**Shipping Order:** `.claude/records/permits/2026-03-28-queue-rebrickable-imports.md`
**Sorter:** Head Sorter

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Created | `app/Actions/FamilySet/StartImportAction.php` | Concurrency guard + dispatch. Checks for pending/in-progress imports, creates ImportJob record, dispatches ImportOwnedSetsJob |
| Created | `app/Actions/FamilySet/GetImportStatusAction.php` | Returns latest ImportJob for a family, ordered by created_at desc |
| Created | `app/Jobs/ImportOwnedSetsJob.php` | Queued job wrapping ImportOwnedSetsAction. Updates ImportJob status/progress as it runs. Handles failed() for exception cases |
| Created | `app/Http/Resources/ImportJobResourceData.php` | ResourceData for ImportJob model -- status, progress counts, timestamps, failed details |
| Created | `tests/Unit/Actions/FamilySet/StartImportActionTest.php` | 3 tests: dispatch success, pending conflict, in-progress conflict |
| Created | `tests/Unit/Actions/FamilySet/GetImportStatusActionTest.php` | 2 tests: returns latest, returns null |
| Created | `tests/Feature/Jobs/ImportOwnedSetsJobTest.php` | 6 tests: completion, skipped sets, incomplete result, exception failure, graceful missing job, in-progress status during execution |
| Modified | `app/Http/Controllers/FamilySetController.php` | Replaced synchronous importFromRebrickable with async StartImportAction dispatch returning 202. Added importStatus method |
| Modified | `app/Models/Family.php` | Added importJobs() HasMany relationship. Added to cascadeRelations(). Fixed duplicate PHPDoc block |
| Modified | `app/Policies/FamilySetPolicy.php` | Added viewImportStatus() method |
| Modified | `bootstrap/app.php` | Registered ImportAlreadyInProgressException renderer (409) |
| Modified | `deptrac.yaml` | Added Job layer. Action depends on Job (to dispatch). Job depends on Action, Model, Enum |
| Modified | `routes/api.php` | Added GET /family-sets/import-status. Reordered routes to place static paths before {family_set} wildcard |
| Modified | `tests/Architecture/RoutingArchitectureTest.php` | Updated expected authenticated route count from 32 to 33 |
| Modified | `tests/Feature/Controllers/FamilySetControllerTest.php` | Rewrote importFromRebrickable tests for async behavior. Added importStatus test suite. 14 new tests replacing 9 old synchronous tests |

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| POST /family-sets/import-from-rebrickable returns 202 Accepted with status identifier | Yes | Returns ImportJobResourceData with pending status |
| Import runs asynchronously via Laravel's queue system | Yes | ImportOwnedSetsJob implements ShouldQueue, dispatched via bus |
| Status endpoint exists to check import progress | Yes | GET /family-sets/import-status returns latest ImportJob |
| Duplicate imports rejected with 409 | Yes | StartImportAction checks for pending/in-progress status |
| Individual set failures recorded without aborting batch | Yes | Job maps skippedSetNums to failed_set_details, records errors |
| composer test passes | Yes | 470 tests, 1694 assertions, 0 failures |
| composer phpstan passes at level max | Yes | 0 errors, 280 files |
| composer deptrac passes | Yes | 0 violations |
| Feature tests verify full lifecycle | Yes | Dispatch, status polling, completion, concurrent rejection |
| Unit tests verify job logic with Queue::fake() | Yes | Feature test dispatches job via Queue::fake(); unit tests mock Action |

## Decisions Made

1. **Job as Feature test, not Unit test** -- The ImportOwnedSetsJob test uses RefreshDatabase because it tests real database interactions (creating/updating ImportJob records). Architecture tests enforce that unit tests must not use RefreshDatabase. Placed in tests/Feature/Jobs/ instead of tests/Unit/Jobs/.

2. **Action dispatches Job (Action -> Job dependency)** -- StartImportAction dispatches ImportOwnedSetsJob directly. This creates an Action -> Job Deptrac dependency. Alternative was having the Controller dispatch, but that violates thin controller principles. The Action is the orchestrator; the Job is the async envelope.

3. **Route ordering: static before wildcard** -- Moved import-from-rebrickable and import-status routes before {family_set} wildcard. Otherwise import-status would match as a family_set ID. This reorders existing routes (completion was already before the wildcard, import was already after -- inconsistent).

4. **Status endpoint on FamilySet policy, not ImportJob policy** -- Added viewImportStatus to FamilySetPolicy rather than creating a separate ImportJobPolicy. The import status is conceptually part of the family-sets domain, and the endpoint uses the same authorization group. Creating a separate policy for a single read method would be over-engineering.

5. **Concurrency guard via status check, not unique constraint** -- Used a query checking for pending/in_progress status rather than a database unique constraint. A unique constraint on (family_id, status) would be too restrictive since families should be able to have completed/failed imports alongside new ones. The status check is explicit and readable.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | Rector renamed variables per type conventions |
| phpstan | Pass | 0 errors across 280 files |
| deptrac | Pass | 0 violations, Job layer properly wired |
| test | Pass | 470 tests, 1694 assertions |
| test:coverage | N/A | No coverage driver available |
| test:feature-coverage | N/A | No coverage driver available |
| mutation | N/A | No coverage driver available |

## Showcase Readiness

The implementation is clean and follows established warehouse patterns. The async architecture is straightforward: controller -> action (guard + dispatch) -> job (wraps existing action). The existing ImportOwnedSetsAction remains unchanged and independently testable. The status polling endpoint is simple but sufficient for the frontend to show progress.

One area that could be stronger: the Job currently updates the ImportJob model in one shot at the end rather than incrementally as pages are processed. For a true progress indicator, the Job would need to update processed_sets after each page. This would require modifying ImportOwnedSetsAction to accept a progress callback, which is out of scope for this order.

## Proposed Knowledge Updates

- **Learnings:** When adding new GET routes under a path that has wildcard route parameters (e.g., /family-sets/{family_set}), place static paths before the wildcard route to prevent the wildcard from consuming the static segment.
- **Pulse:** In-progress work: Queue infrastructure for Rebrickable imports (complete). Deptrac now has a Job layer. Route count is 33 authenticated routes.
- **Decision Record:** No new ADR needed. The Job layer addition to Deptrac is a natural extension of the existing architecture. If more jobs are added, a formal ADR on job placement may be warranted.

## Self-Debrief

### What Went Well

- Existing ImportJob model, enum, migration, and factory were already in place from a prior commit, which saved significant setup time
- ImportAlreadyInProgressException also pre-existed, just needed the exception handler registration
- Clean separation: the ImportOwnedSetsAction itself was not modified at all -- the Job wraps it without changes
- Route ordering bug was caught and fixed in the same session

### What Went Poorly

- Initially placed Job test in tests/Unit/Jobs/ with RefreshDatabase, caught by architecture test in pre-commit hook. Should have checked the test conventions architecture test before placing a test with database dependencies.
- First attempt at Family.php edit created a duplicate PHPDoc block. Switched to full file rewrite to fix.

### Blind Spots

- Did not initially consider route ordering -- import-status was placed after {family_set} and would have been consumed by the wildcard. Caught during test execution, not during route definition.
- Did not check TestConventionsArchitectureTest before deciding where to place the Job test. The architecture tests caught it, but I should have known.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| Before placing a test file, check TestConventionsArchitectureTest for placement constraints (e.g., unit tests must not use RefreshDatabase) | Placed Job test in Unit/ with RefreshDatabase; pre-commit hook caught it | 2026-03-28-queue-rebrickable-imports |
| When adding routes under a path with wildcard parameters, always verify static routes come before the wildcard in the route file | import-status was placed after {family_set} and matched as a wildcard parameter | 2026-03-28-queue-rebrickable-imports |

---

## Logistics Director Evaluation

_Appended by the Logistics Director after reviewing the log. The sorter's sections above are not edited — they stand as written._

### Overall Assessment

**Solid delivery.** All 10 acceptance criteria met. The architecture is clean: controller → action (guard + dispatch) → job (wraps existing action). The existing `ImportOwnedSetsAction` was untouched — the job is a pure async envelope around it. That's exactly the right call.

Quality gauntlet: 470 tests, 0 PHPStan errors, 0 Deptrac violations. Coverage and mutation checks unavailable (no coverage driver) — noted but not the Sorter's fault.

### Decision Review

1. **Job as Feature test, not Unit** — Correct. The architecture tests enforce RefreshDatabase exclusion in Unit/. The Sorter was caught by pre-commit and corrected. The right outcome, though ideally the Sorter checks test conventions before placement, not after the hook rejects it.

2. **Action dispatches Job (Action → Job dependency)** — Sound. The alternative (Controller dispatches) would violate thin-controller principles. The Action is the orchestrator; the Job is the async mechanism. The Deptrac layer addition (Action → Job, Job → Action/Model/Enum) is minimal and well-scoped.

3. **Route ordering: static before wildcard** — Necessary fix. This would have been a runtime bug if not caught. The Sorter caught it during test execution, which is acceptable — but ideally route ordering is verified at definition time, not after a failing test.

4. **Status on FamilySetPolicy, not ImportJobPolicy** — Pragmatic. A single-method policy for a read-only status check is over-engineering. If ImportJob gains more endpoints later, revisit.

5. **Concurrency guard via status check, not unique constraint** — Correct. A unique constraint on (family_id, status) would block legitimate scenarios (completed import + new import). The status check is explicit and readable.

### Showcase Readiness

The implementation demonstrates clean async job architecture in Laravel. The separation is textbook: synchronous Action for logic, queued Job for async envelope, thin Controller for HTTP. A senior reviewer would note approvingly that the existing Action was not modified.

The Sorter correctly identified the progress-tracking limitation: the Job updates counts in one shot at completion rather than incrementally. This is an honest assessment — and the right scoping decision for this order.

### Concerns

1. **`StartImportAction` does not use a transaction.** The concurrency check and ImportJob creation are not atomic. Under concurrent requests, two threads could both pass the `whereIn` check before either saves. The window is narrow but real. A `Cache::lock()` or `INSERT ... WHERE NOT EXISTS` would close it. Not critical for showcase, but worth noting for production-readiness.

2. **`ImportOwnedSetsJob::handle()` uses static `ImportJob::query()` and `Family::query()`.** This is a departure from the injected-model pattern used in Actions (e.g., `$this->importJob->newQuery()`). Jobs use method injection via `handle()`, so the pattern is different — but it means the Job cannot be unit-tested with mocked models. The Feature test approach works, but this is a pattern to watch as more Jobs are added.

3. **No architecture test for the Job layer.** Deptrac covers boundary enforcement, but there's no Pest architecture test verifying Job conventions (e.g., `final class`, implements `ShouldQueue`). If more Jobs are added, an architecture test should be created.
