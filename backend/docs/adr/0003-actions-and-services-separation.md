# Decision: Actions for Business Logic, Services for HTTP Only

**Date**: 2026-03-22
**Feature**: Separation of business logic from external API communication
**Status**: accepted
**Transferability**: universal

## Context

Business logic, external API calls, and database operations need clear ownership. Laravel doesn't prescribe where orchestration lives — logic often ends up in controllers, models, or ambiguous "service" classes that do everything.

A previous iteration of this codebase put business logic and HTTP calls in the same service classes. This caused circular dependencies (Service A needed Service B's data, but Service B called an Action that needed Service A) and made testing painful — you couldn't test business logic without faking HTTP calls.

## Options Considered

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **Actions (business logic) + Services (HTTP only)** | Clear boundary; Actions testable without HTTP fakes; Services testable without database; composable via delegation | Two class types to learn; more files | **Chosen** — the boundary paid for itself immediately in test clarity |
| **Fat controllers** | Familiar; quick to write | Untestable; violates SRP; logic duplicated across endpoints | Eliminated — doesn't survive the first refactor |
| **Services doing everything** | One abstraction to learn | Blurs external communication and business logic; tested in previous iteration and caused circular dependencies | Eliminated — empirically failed |
| **Repository pattern** | Abstracts database access | Adds indirection over Eloquent with little benefit at this scale; doesn't address the HTTP boundary | Eliminated — solves a different problem |

## Decision

Split into two layers with strict boundaries enforced by Deptrac and architecture tests:

**Actions** — business logic and orchestration:
- Database operations (via injected models with `newQuery()`/`newInstance()`)
- Calling Services for external data
- Calling other Actions for sub-operations
- Single `execute()` method, `final readonly`
- No facades, no Request objects, no try-catch

**Services** — external HTTP only:
- HTTP requests/responses via injected `Http\Client\Factory`
- Response parsing and validation
- Custom exception handling for API errors
- No business logic, no database access, no Model dependencies, no Action dependencies

```
Controller
  └─ GetSetPartsAction (orchestration)
       ├─ RebrickableService.fetchSet() → HTTP only
       ├─ UpsertSetAction → DB operation
       └─ StoreSetPartsAction → DB operation
```

### Class Immutability: `final readonly`

All Action and Service classes must be declared `final readonly`. This is enforced by architecture tests that scan for the literal string `final readonly class` in every file under `app/Actions/` and `app/Services/`.

- No Action or Service can be subclassed — behavior changes require modifying the original or creating a new class
- All injected dependencies are immutable after construction — no mid-request state changes
- Developers must think in composition, not inheritance

For testing, `BypassFinals` is enabled in `tests/Pest.php` with a whitelist limited to `app/Actions/*`, allowing Mockery to mock Action dependencies in unit tests while the production constraint remains enforced.

### Instance Query Builders in Actions

Actions must use `$this->model->newQuery()` for queries and `$this->model->newInstance()` for creating new records. Direct static calls (`Model::where()`) and static-through-instance calls (`$this->model::where()`) are both prohibited.

Static-through-instance looks like DI but isn't — PHP resolves the class statically, bypassing the injected instance entirely. This defeats the purpose of injection.

```php
// Correct — through the injected instance
$set = $this->set->newQuery()->where('set_num', $setNum)->first();
$storageOption = $this->storageOption->newInstance();
$storageOption->name = $data->name;
$storageOption->save();
```

The architecture test uses a regex (`/\$this->\w+::\w+\(/`) to detect static-through-instance violations.

### External API Resilience Pattern

Every Service builds its HTTP client through a private `httpClient()` method with standardized resilience settings:

```php
private function httpClient(): PendingRequest
{
    return $this->httpFactory->baseUrl($this->baseUrl)
        ->withHeaders([...])
        ->acceptJson()
        ->timeout(30)
        ->retry(3, 100, throw: false);
}
```

**The standard settings:**
- **30-second timeout** — long enough for slow API responses, short enough to not hang requests
- **3 retries with 100ms delay** — handles transient failures without hammering the API
- **`throw: false`** — responses are handled explicitly, not via exception-on-failure

**Error handling follows a typed exception hierarchy:**

```
ExternalApiException (abstract base)
├── RebrickableApiException
│   └── SetNotFoundException (404 specialization)
├── BrickognizeApiException
└── InvalidApiResponseException (malformed response)
```

Each exception captures the HTTP status code and response body. The global exception handler maps these to appropriate HTTP responses (502 for upstream failures, 404 for not-found resources).

**Response validation** is explicit — Services check for required fields and valid structure before returning data, throwing `InvalidApiResponseException` for malformed responses.

## Consequences

- Actions can depend on other Actions (delegation over duplication)
- Services are independently testable with `Http::fake()` — no database needed
- Actions are testable with mocked Services — no HTTP fakes needed
- Deptrac enforces: Services cannot depend on Actions, Models, or other Services
- Each Service must implement a Contract interface — enabling test doubles
- Every external API call has identical resilience behavior — no service is more fragile than another
- Typed exceptions allow the global handler to return meaningful HTTP status codes to clients
- `throw: false` means every Service must explicitly check `$response->failed()` — cannot accidentally ignore failures

## Enforcement

| What | Mechanism | Scope |
|------|-----------|-------|
| Actions are `final readonly` with single `execute()` | `ActionArchitectureTest` | `app/Actions/` |
| Actions: no facades, no Request dependencies | `ActionArchitectureTest` | `app/Actions/` |
| Actions: explicit transactions (no arrow functions) | `ActionArchitectureTest` | `app/Actions/` |
| No static-through-instance calls in Actions | `ActionArchitectureTest` (regex scan) | `app/Actions/` |
| Services are `final readonly` implementing a Contract | `ServiceArchitectureTest` | `app/Services/` |
| Services: no Models, no Actions, no other Services | `ServiceArchitectureTest` | `app/Services/` |
| Services use `Http::fake()` in tests | `ServiceArchitectureTest` (no real HTTP calls) | `tests/Unit/Services/` |
| Layer dependency rules | `deptrac.yaml` | All application layers |
| BypassFinals configured for test mocking | `tests/Pest.php` | Test suite |
| Exception hierarchy with status codes | Global exception handler in `bootstrap/app.php` | `app/Exceptions/` |

## Resolved Questions

### Can an Action call another Action?

**Resolved 2026-03-22.** Yes — Actions can depend on other Actions for sub-operations. This enables delegation over duplication. Deptrac explicitly allows `Action → Action` dependencies. The constraint is that this doesn't create circular dependencies (which Deptrac would catch at the layer level, though not at the class level).

### Why no try-catch in Actions?

**Resolved 2026-03-22.** Exceptions bubble to the global handler in `bootstrap/app.php`, which maps typed exceptions to HTTP responses. This keeps error handling consistent and prevents Actions from silently swallowing failures.

**Approved exception — partial-failure resilience (amended 2026-03-25).** Actions that process paginated external data may use try-catch when implementing a partial-failure resilience pattern, provided all of the following hold:

1. The catch block only handles typed external API exceptions (e.g., `RebrickableApiException`, `InvalidApiResponseException`) — never generic `\Exception` or `\Throwable`
2. If no data was successfully processed before the failure, the exception is re-thrown — the pattern does not suppress total failures
3. The partial result is explicitly marked as incomplete in the return value (e.g., `complete: false` with an error message)
4. The behavior is fully covered by unit tests for both the partial-success and total-failure paths

This pattern exists in `ImportOwnedSetsAction`, which processes paginated Rebrickable collection imports. When a page fails after at least one successful page, the import returns what it has rather than discarding all progress. This is a deliberate trade-off: partial data with a clear incompleteness signal is more useful than no data at all.

**Approved exception — optimistic-locking upsert (amended 2026-03-26).** Actions implementing race-condition-safe upsert may use try-catch on `UniqueConstraintViolationException`, provided all of the following hold:

1. The catch block only handles `Illuminate\Database\UniqueConstraintViolationException` — never generic `\Exception` or `\Throwable`
2. The catch block retries the operation as a direct update (not swallows the error or returns a default)
3. Both the initial insert-or-update path and the retry-on-conflict path are wrapped in transactions
4. The behavior is covered by unit tests

This pattern handles the race condition where two concurrent requests attempt to insert the same unique record. The first request wins the insert; the second catches the constraint violation and falls back to an update. Without this, the second request would fail with an unhandled database exception.

**Current Actions using this pattern:**
- `AssignPartToStorageAction` — upsert storage-option-part assignment by unique (storage_option_id, part_id, color_id) constraint
- `UpsertColorAction` — upsert color by unique rebrickable_color_id
- `UpsertPartAction` — upsert part by unique part_num
- `UpsertSetAction` — upsert set by unique set_num
- `StoreSetPartsAction` — upsert set-part relationship by unique (set_num, part_id, color_id) constraint

**Approved exception — race-condition guard (amended 2026-04-11).** Actions that guard against concurrent duplicate creation may use try-catch on `UniqueConstraintViolationException` to detect that a concurrent insert won the race, re-throwing as a typed domain exception. This pattern does NOT retry — it signals the conflict to the caller via a domain exception.

This differs from the optimistic-locking upsert pattern above: upsert catches the violation and retries as an update (the operation succeeds either way). The race-condition guard catches the violation and re-throws as a domain exception (the caller decides how to handle the conflict — e.g., returning a 409).

Conditions:

1. The catch block only handles `Illuminate\Database\UniqueConstraintViolationException` — never generic `\Exception` or `\Throwable`
2. The catch block re-throws as a typed domain exception — it does not swallow the error, does not retry, and does not return a default value
3. The behavior is covered by unit tests

**Current Actions using this pattern:**
- `StartImportAction` — race-condition guard against duplicate in-flight import jobs (catches `UniqueConstraintViolationException`, re-throws as `ImportAlreadyInProgressException`)

## Open Questions

- Should retry count and delay be configurable via `#[Config]` attributes instead of hardcoded? Current values work for both APIs, but a third integration with different rate limits might need flexibility.
- Should `InvalidApiResponseException` log the malformed response body for debugging? Currently it captures the message but not the raw response.
