# Shift Log: Harden Job Layer Infrastructure

**Log #:** 2026-03-29-harden-job-layer
**Filed:** 2026-03-29
**Shipping Order:** `.claude/records/permits/2026-03-29-harden-job-layer.md`
**Sorter:** Head Sorter

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Created | `database/migrations/2026_03_29_103513_add_unique_active_import_per_family_index_to_import_jobs_table.php` | Partial unique index on `import_jobs(family_id) WHERE status IN ('pending', 'in_progress')` |
| Created | `tests/Architecture/JobArchitectureTest.php` | Enforces `final` and `ShouldQueue` on all Job classes |
| Modified | `app/Actions/FamilySet/StartImportAction.php` | Added `UniqueConstraintViolationException` catch as database-level race condition fallback |
| Modified | `app/Jobs/ImportOwnedSetsJob.php` | Refactored `handle()` to inject `ImportJob` and `Family` Models from container |
| Modified | `CLAUDE.md` | Added "Queued Jobs (Async Envelopes)" section to Warehouse Regulations |
| Modified | `tests/Unit/Actions/FamilySet/StartImportActionTest.php` | Added test for UniqueConstraintViolationException race condition path |
| Modified | `tests/Feature/Jobs/ImportOwnedSetsJobTest.php` | Updated `handle()` calls to pass injected Model instances |
| Modified | `tests/Feature/Controllers/FamilySetControllerTest.php` | Added feature test verifying partial unique index prevents duplicate pending imports |

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Concurrent requests cannot create duplicate pending ImportJobs | Yes | Partial unique index on `(family_id) WHERE status IN ('pending', 'in_progress')` prevents duplicates at DB level; `UniqueConstraintViolationException` catch converts to `ImportAlreadyInProgressException`; feature test verifies |
| Architecture test enforces `final` and `ShouldQueue` on Jobs | Yes | `tests/Architecture/JobArchitectureTest.php` with 2 assertions |
| `ImportOwnedSetsJob` injects Models into `handle()` | Yes | `handle()` now takes `ImportJob $importJobModel, Family $familyModel` and uses `$model->newQuery()->findOrFail()` |
| Job conventions documented in CLAUDE.md | Yes | "Queued Jobs (Async Envelopes)" section added between Shipping Labels and Security Checkpoints |
| `composer test` passes | Yes | 472 tests, 1702 assertions, 0 failures |
| `composer phpstan` passes | Yes | Level max, 0 errors |
| `composer deptrac` passes | Yes | 0 violations |
| `composer test:arch` passes | Yes | 88 passed, 2 warnings (routing -- pre-existing), including new Job tests |

## Decisions Made

1. **Partial unique index over `Cache::lock()`** -- Chose a database-level partial unique index (`WHERE status IN ('pending', 'in_progress')`) over `Cache::lock()`. The index is a hard constraint that cannot be bypassed regardless of application code path, race timing, or cache infrastructure availability. It follows the established pattern of database-level enforcement seen throughout the codebase (e.g., unique constraints on sets, parts). `Cache::lock()` would have added a dependency on cache infrastructure and could fail silently if the lock TTL expired.

2. **Keep application-level check + DB fallback** -- Kept the existing `whereIn` check as the primary guard (fast, gives clear error message) and added the `UniqueConstraintViolationException` catch as a fallback for the race condition window. This is consistent with the approved optimistic-locking upsert pattern documented in ADR-0003.

3. **Static queries in `failed()` are acceptable** -- The `failed()` callback on the Job is called directly by the queue worker, not resolved from the container. There is no way to inject dependencies into it. Static `ImportJob::query()` in `failed()` is a framework constraint, not a shortcut. Documented this distinction in the CLAUDE.md Job conventions.

4. **Raw SQL for partial unique index** -- Used `DB::statement()` with raw SQL for the migration because Laravel's schema builder does not support partial unique indexes natively. Both SQLite (tests) and PostgreSQL (production) support `CREATE UNIQUE INDEX ... WHERE ...` syntax.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | |
| phpstan | Pass | Level max, 0 errors |
| deptrac | Pass | 0 violations, 603 allowed |
| test | Pass | 472 tests, 1702 assertions |
| test:coverage | N/A | No coverage driver (pre-existing) |
| test:feature-coverage | N/A | No coverage driver (pre-existing) |
| mutation | N/A | No coverage driver (pre-existing) |

## Showcase Readiness

This implementation would hold up well under audit. The race condition fix uses the strongest possible guarantee -- a database constraint -- rather than application-level locking that could be circumvented. The dual-layer approach (application check + DB constraint) gives clean error messages for the common case while providing an atomic fallback for the race window.

The Job refactoring is consistent with the Action pattern and makes the dependency graph explicit. The architecture tests ensure new Jobs follow conventions automatically.

One gap worth noting: the `failed()` method on Jobs necessarily uses static queries, which creates a small inconsistency with the "no static queries" principle. This is documented as a framework constraint in CLAUDE.md, which is the right call -- documenting exceptions is better than pretending they don't exist.

## Proposed Knowledge Updates

- **Learnings:** When using partial unique indexes with `WHERE status IN (...)`, both SQLite and PostgreSQL support identical syntax -- no conditional migration logic needed.
- **Pulse:** Job layer hardened: race condition closed with partial unique index, architecture tests added (19 files now), conventions documented. Pattern maturity should be updated to include Job layer.
- **Decision Record:** No new ADR needed -- the `UniqueConstraintViolationException` pattern is already covered by ADR-0003's approved optimistic-locking upsert exception.

## Self-Debrief

### What Went Well

- Read the existing patterns (UniqueConstraintViolationException, ADR-0003 approved exceptions) before writing code. The solution followed established conventions without inventing new ones.
- The partial unique index approach was identified on first pass -- no wasted cycles exploring `Cache::lock()` or advisory locks.
- All 8 files changed were correct on first attempt. No rework after lint/phpstan/deptrac/tests.

### What Went Poorly

- Nothing significant. The task was well-scoped and the existing codebase patterns made the path clear.

### Blind Spots

- Did not verify whether the partial unique index syntax works identically on PostgreSQL 16 (production) vs SQLite (tests). Assumed compatibility based on both databases supporting partial indexes. Should have verified with a quick reference check.
- Did not check if `failed()` could theoretically accept container-resolved parameters via some Laravel mechanism I'm not aware of. Accepted the "framework constraint" explanation at face value.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| When fixing race conditions, always prefer database-level constraints over application-level locks -- they survive code path changes and cache failures | Race condition in StartImportAction was closed with a partial unique index rather than Cache::lock() | This log |
| When a Job's `failed()` method needs Model access, accept static queries as a framework constraint and document the exception in conventions | `failed()` cannot receive injected dependencies; static queries are the only option | This log |

---

## Logistics Director Evaluation

_Appended by the Logistics Director after reviewing the log. The sorter's sections above are not edited -- they stand as written._

**Overall Assessment:** Clean, efficient delivery. All 8 acceptance criteria met. The Sorter chose the strongest possible solution for each item — database constraint over application locks, architecture tests over documentation promises, injected Models over static calls. No rework cycles. 472 tests, 0 PHPStan errors, 0 Deptrac violations.

### Order Fulfillment Review

All four deliverables shipped correctly:

1. **Race condition** — Partial unique index is the right call. It's the hardest guarantee available — survives code path changes, cache failures, and concurrent workers. The dual-layer approach (application check for clean error messages, DB constraint for atomicity) is textbook.

2. **Architecture test** — Two assertions, clean file. The `final` check uses reflection + file content scanning (consistent with other architecture tests in the codebase). The `ShouldQueue` check uses Pest's `arch()` API. Both approaches are fine.

3. **Job refactor** — `handle()` now injects `ImportJob` and `Family` Models and uses `$model->newQuery()->findOrFail()`. Clean, consistent with Action pattern. The `failed()` callback correctly retains static queries — documented as framework constraint.

4. **CLAUDE.md documentation** — The "Queued Jobs (Async Envelopes)" section is well-placed (between Shipping Labels and Security Checkpoints) and covers all four conventions: constructor serialization, `handle()` injection, thin envelope pattern, and the `failed()` exception.

### Decision Review

1. **Partial unique index over `Cache::lock()`** — Excellent choice. Database constraints are the strongest concurrency guarantee. The Sorter correctly identified that `Cache::lock()` adds infrastructure dependency and can fail silently on TTL expiry. The raw SQL for the migration is necessary (Laravel's schema builder doesn't support partial indexes) and the syntax works identically on SQLite and PostgreSQL.

2. **Application check + DB fallback** — Smart. The `whereIn` check catches the common case with a clear error message. The `UniqueConstraintViolationException` catch handles the race window. The Sorter also correctly identified that this pattern is already approved in ADR-0003.

3. **Static queries in `failed()`** — The Sorter was honest about not verifying this independently (logged as a blind spot). The assessment is correct — `failed()` is called by the queue worker with only the Throwable, not resolved from the container. Documenting the exception in CLAUDE.md is the right approach.

4. **Raw SQL for partial unique index** — Necessary and correct. Both SQLite and PostgreSQL support `CREATE UNIQUE INDEX ... WHERE ...`. The Sorter flagged cross-database compatibility as a blind spot, which is honest — but the syntax is standard SQL and works in both.

### Showcase Assessment

This hardening pass would satisfy a senior reviewer. The race condition fix demonstrates understanding of concurrent system design — not just "add a lock" but "use the strongest guarantee available at the right layer." The documentation in CLAUDE.md establishes conventions that will prevent drift as more Jobs are added. The architecture tests provide machine enforcement.

No concerns with this delivery.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| When fixing race conditions, prefer database-level constraints over application-level locks | **Candidate** | Sound principle, well-demonstrated here. First observation — needs a second confirming session. The nuance matters: this applies when the constraint is expressible as an index. Not all concurrency problems can be solved with indexes. |
| When a Job's `failed()` method needs Model access, accept static queries as a framework constraint | **Dropped** | This is already documented in CLAUDE.md's Job conventions section as of this delivery. The convention is now part of the warehouse regulations — no need to track it as a training candidate separately. The Sorter did the right thing by documenting it in CLAUDE.md rather than relying on memory. |

### Notes for the Sorter

Good shift. Zero rework, correct pattern choices on first pass, honest blind spots. The "nothing went poorly" self-assessment is accurate for once — the task was well-scoped and you executed cleanly. The partial unique index approach shows you're reading the existing codebase patterns (ADR-0003, UniqueConstraintViolationException) before inventing new ones. Keep doing that.
