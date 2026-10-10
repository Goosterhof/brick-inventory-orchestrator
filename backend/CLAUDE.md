# The Foundry Wing — Operational Manual

> The Foundry is The Brickworks' backend production wing. This file documents Laravel-specific conventions, machinery, and quality gauntlets for work inside `backend/`. Brickworks identity, the crew (Brickwright / Quality Warden / Pattern Master), and the paper-trail vocabulary (Work Order / Build Record / Audit) live in the root `CLAUDE.md` (The Atrium).

## The Foundry — A LEGO Storage Inventory API

A RESTful service where families catalog their sets, track individual parts, organize physical storage locations, and sync their collections from external suppliers. The structural backbone behind the Gallery Wing's showroom.

The departmental layout (Auth Bay, Storage Aisle, Inventory Desk, Receiving Dock, Family Office) is documented in detail at [`/.claude/docs/foundry-map.md`](../.claude/docs/foundry-map.md). Cross-wing decisions live in [`/.claude/docs/decisions.md`](../.claude/docs/decisions.md); Foundry-specific work tracks (graduation logs, pulse, learnings) live alongside it.

## Heavy Machinery & Suppliers

| Equipment | Make & Model |
|---|---|
| Framework | Laravel 13 |
| Language | PHP 8.5 (strict types — no loose screws) |
| Reactor | Laravel Octane with FrankenPHP |
| Auth | Laravel Sanctum (session-based — no loose tokens on the floor) |
| Database | PostgreSQL 16 (production) / SQLite (local sorting practice) |
| Static Analysis | PHPStan at level `max` with Larastan + 4 custom war-room rules |
| Architecture | Deptrac (boundary fences between aisles) |
| Testing | Pest (the quality inspection rig) |
| Linting | Rector + Pint |
| Mutation Testing | Infection (76% minimum survival) |
| Git Hooks | Root `.githooks/` (see root `CLAUDE.md` § Git Hooks) |
| Deployment | Railway (single multi-stage image) |

### External Suppliers

| Supplier | What They Ship | Service Class |
|---|---|---|
| **Rebrickable** | Set catalogs, part databases, color palettes, user collections | `RebrickableService` |
| **Brickognize** | Visual brick identification from photos | `BrickognizeService` |

## Floor Plan (Project Structure)

```
app/
├── Actions/                    # Business logic
│   ├── Auth/                   #   Crew onboarding & verification
│   ├── BrickIdentification/    #   Forensic brick analysis
│   ├── Family/                 #   Family office operations
│   ├── FamilySet/              #   Inventory desk procedures
│   ├── Feedback/               #   Customer feedback relay (kendo-report-tool)
│   ├── StorageOption/          #   Storage aisle management
│   └── Sync/                   #   Receiving dock operations
├── Services/                   # External API adapters only
│   ├── RebrickableService      #   Main supplier connection
│   └── BrickognizeService      #   Forensics lab connection
├── Models/                     # Eloquent models
│   ├── User, Family            #   Crew & tenant records
│   ├── Set, Part, Color, Theme #   Catalog data (from suppliers)
│   ├── FamilySet, SetPart      #   What families own & what's inside
│   ├── StorageOption           #   Physical locations (hierarchical)
│   ├── StorageOptionPart       #   What's stored where
│   └── ImportJob               #   Async Rebrickable import tracking
├── Http/
│   ├── Controllers/            # Thin request handlers
│   ├── Requests/               # Validated input DTOs (FormRequests)
│   ├── Resources/              # Structured output DTOs (ResourceData)
│   └── Middleware/             # Security checkpoints
├── DataTransferObjects/        # Typed DTOs
│   ├── Input/                  #   Actions RECEIVE these (FormRequest → Action, Service → Action)
│   └── Result/                 #   Actions RETURN these (may carry Collection<Model>)
├── Contracts/                  # Service interfaces
├── Exceptions/                 # Typed failure signals
├── Enums/                      # Status enums
├── Policies/                   # Authorization rules
└── Providers/                  # DI bindings

routes/
└── api.php                     # Every endpoint, explicitly declared

database/
├── migrations/                 # Schema evolution
└── factories/                  # Test fixtures

tests/
├── Architecture/               # Regulation enforcement
├── Feature/                    # Integration drills — controller-level tests
└── Unit/                       # Component inspections — action & service tests
```

## Coding Conventions

### Actions

The heart of the wing. Every business operation is an Action.

- `final readonly` classes — no subclassing, no mutation
- Single `execute()` method — one procedure, one job
- No facades — dependency injection or nothing
- No `Request` objects — accept DTOs or typed parameters
- No try-catch — exceptions bubble to the global handler (three approved exceptions documented in ADR-0015: partial-failure resilience, UniqueConstraintViolationException upsert, race-condition guard)
- Use `$this->connection->transaction(Closure)` via injected `ConnectionInterface` — no `DB` facade, no manual begin/commit/rollback
- When using raw SQL joins or aggregates, use `->toBase()->get()` returning `stdClass` — not Eloquent `get()` with `getAttribute()`
- When an Action needs multiple independent queries, inject each Model separately and call `$model->newQuery()` per query — never `clone $builder` (breaks Mockery)

### Services

External connections only. Services do NOT contain business logic — they deliver.

- `final readonly` classes implementing a Contract
- HTTP communication only — no database, no models, no actions
- Cannot call other Services — each supply line is independent
- Tested with `Http::fake()` — never hit real suppliers in tests

### Controllers

Thin. Receive the request, hand it to the right Action, send back the result.

- No constructors — method injection only
- Return `JsonResponse` or `array` — nothing else
- Construct `ResourceData` in the controller via `::from()` and return `->toResponse()` / `->toResponseWithStatus()` — never return `ResourceData` directly; Actions return Models or Result DTOs, never `ResourceData` (ADR-0021)
- No try-catch — the global exception handler catches typed failures
- No query builders — controllers don't browse the shelves directly

### Models

Protected from careless overwrites.

- No `$fillable` or `$guarded` — explicit property assignment only (ADR-0017)
- No database-level cascade deletes — explicit cascade in Actions (ADR-0016)
- Must have `@property` PHPDoc annotations for all columns
- Models with `family_id` must define a `family()` relationship and implement `BelongsToFamilyInterface`

### FormRequests

The intake form a shipment must fill out before entering the wing.

- `final` classes extending `FormRequest`
- Produce a DTO via typed method — bridge between HTTP and the wing interior
- `toDto()` must declare an explicit return type, and that return type must live in `App\DataTransferObjects\Input\*`
- No public constants — keep the form clean

### DTOs — Input vs Result

Split by **usage direction at the Action boundary**:

- **Input** (`App\DataTransferObjects\Input\<Domain>\`) — shapes the Action **receives**. Pure leaves — may depend on `Enums` only, never on Models.
- **Result** (`App\DataTransferObjects\Result\<Domain>\`) — shapes the Action **returns**. May carry `Collection<Model>`, single `Model`, `Enum`, or plain scalars/arrays.

Enforced from three angles in `tests/Architecture/DataTransferObjectPlacementTest.php`: Action return types, Action `execute()` parameter types, and `FormRequest::toDto()` return types.

### ResourceData

What the outside world sees when they pick up a shipment.

- `final readonly` classes (or `abstract` for base labels)
- Static `from()` factory method — construct from Model data
- `EAGER_LOAD` constant when nesting related data — prevent N+1 loading

### Queued Jobs

Thin wrappers that move actions onto the async conveyor belt.

- `final` classes implementing `ShouldQueue` — sealed, queueable
- Constructor: primitive IDs only (int, string) — must survive serialization/deserialization
- `handle()`: inject Actions for business logic, inject Models for lookups — resolved from the container
- Job body: look up records via `$model->newQuery()->findOrFail()`, delegate to Action, update status. No business logic in the Job itself
- `failed()` callback: static Model queries are acceptable here — this method is called by the queue worker directly, not resolved from the container
- `failed()` leak discipline: persist an **opaque** user-facing failure message; raw exception detail (`getMessage()`, `getTraceAsString()`) goes to the server-side log sink (`logger()` / `Log::`) **only** — never into a persisted column or response body (it can carry DSN credentials, SQL, or API keys). Canonical shape: `ImportOwnedSetsJob::failed()`. Enforced by `tests/Architecture/JobFailedHandlerLeakArchitectureTest.php` (war-room enforcement queue #140/#134)

### Personal App — No Admission, No Mail (WR-2118)

BIO admits nobody but its owner (Commander ruling 2026-10-08). There is no registration route, no invite flow, and no mail capability. An account is created only from a shell on the host:

```
php artisan account:create <email> <password> --name="..." --family="..."
```

`tests/Architecture/PersonalAppArchitectureTest.php` enforces it: the set of routes without `auth:sanctum` equals a literal allowlist; no `App\` class uses Laravel's mail or notification classes; no file in `app/` creates a `User` or `Family` outside `CreateAccountAction` (console-only) and `RemoveFamilyMemberAction`. A new public route or a mail import is a change to that test, reviewed as such.

### Queue Worker

The Foundry writes async work; a `queue:work` worker reads it. **Production needs both, period.** A queued job hitting an absent worker is a silent failure.

- **Production (Railway):** a dedicated `worker` service runs against the same image and env as the web service:
  ```
  php artisan queue:work --queue=default --tries=3 --backoff=10 --timeout=60 --max-time=3600
  ```
  `--max-time=3600` recycles the process hourly to bound memory leaks.
- **Timeout precedence:** a per-job `#[Timeout]` attribute overrides the worker's `--timeout` flag (`Worker::timeoutForJob()` prefers the job's value). Both real jobs — `ImportOwnedSetsJob` and `SyncSetPartsJob` — declare `#[Timeout(600)]` + `#[FailOnTimeout]` and may run up to 10 minutes; `--timeout=60` effectively governs only attribute-less jobs (there are none today).
- **Reservation invariant:** the database queue's `retry_after` must strictly exceed the largest per-job `#[Timeout]` in `app/Jobs` — otherwise a long job's reservation expires mid-run and the worker re-dispatches it while the first attempt is still on the conveyor belt.
- **Local dev:** orchestrator-side `make queue` runs the same command inside the backend container. Run it in a second terminal alongside `make up`.
- **Tests:** unit/feature tests use `Bus::fake()` / `Queue::fake()`.
- **Verifying alive:** `php artisan queue:monitor default --max=100` or query the `failed_jobs` table.

### Middleware

- `EnsureFamilyOwnership` — verifies the shipment belongs to the requesting tenant
- Every authorized route declares `->can()` middleware explicitly (ADR-0020)
- No Gate injection in Controllers — authorization is a checkpoint, not a desk job

### Exceptions

Typed failures with global handling. No silent swallowing. All 10 rendered mappings (source of truth: `bootstrap/app.php`):

```
SetNotFoundException              → 404
MissingRebrickableTokenException  → 400
NotFamilyHeadException            → 403
RebrickableApiException           → 502 (404 when the upstream 404s)
BrickognizeApiException           → 502
InvalidApiResponseException       → 502
CannotRemoveSelfException         → 422
UserNotInFamilyException          → 404
ImportAlreadyInProgressException  → 409
ReportSubmissionException         → 502 (vendor — kendo-report-tool)
```

## Quality Gauntlet

| Command | What It Inspects |
|---|---|
| `composer dev` | Start the wing (Octane hot-reload) |
| `composer test` | Run all quality inspections |
| `composer test:arch` | Architecture regulation enforcement only |
| `composer test:coverage` | Unit inspections with 100% coverage requirement |
| `composer test:feature-coverage` | Integration drills with 90% coverage requirement |
| `composer lint` | Rector + Pint |
| `composer lint:test` | Dry-run lint (check without fixing) |
| `composer phpstan` | Static analysis at level max |
| `composer deptrac` | Boundary fence inspection |
| `composer mutation` | Sabotage drill — 76% minimum survival on Actions & Services |

### Hooks and CI

Hooks are light (ADR-0028 Amendment 2); the full gauntlet runs in CI (`.github/workflows/backend-ci.yml`) behind the required `gate` check. Root `CLAUDE.md` § Git Hooks has the table.

- **Pre-commit:** Pint writes the staged PHP files and re-stages them; a file that also has unstaged edits gets `pint --test` only.
- **Pre-push**, when the range touches `backend/**`: `composer phpstan`, `composer phpstan:types`, `composer audit`.
- **CI only:** `rector:test`, whole-tree `pint:test`, `deptrac`, `test:arch`, `composer test`, both coverage suites, mutation, Semgrep, seed. `phpstan:types` is the one gate CI does not run — the pre-push hook is its only runner.

Tool caches live in `storage/` and are git-ignored: `storage/pint.cache` (`pint.json` `cache-file`), `storage/phpstan` and `storage/phpstan-types` (each config's `tmpDir`), `storage/rector` (`rector.php` `withCache`). A cache directory per checkout keeps worktrees from evicting each other's caches through `/tmp`.

The PrePushPermitGate that used to precede the pre-push gauntlet was retired 2026-07-16 (ADR-0028 § Amendment 2026-07-16 — Devil's Court ruling: Cracked at root). The permit-before-work guarantee lives upstream on the Kendo board: an open `BIO-xxxx` issue precedes work, `link-branch` binds the branch to it, and the `Agent Review Requested` label precedes merge.

### Coverage Policy

- **Unit tests (Actions, Services):** 100% — every Action, every Service
- **Feature tests (Controllers):** 90% — integration drills cover the main paths
- **Mutation testing:** 76% minimum — sabotage drill ensures tests catch defects, not just touch lines

### Boundary Fences (Deptrac)

Functional rows with strict one-way dependencies. Wing aisles do not cross.

```
Leaf Layers (no App deps):          Model, InputDTO, Enum, Exception
Result-DTO Layer:                   ResultDTO → Enum, Model
Interface Layer:                    Contract → InputDTO, Enum, Exception
Supply Lines:                       Service → Contract, InputDTO, Exception
Input Processing:                   FormRequest → InputDTO, Enum, Model
Output Shaping:                     ResourceData → Model, Enum, ResultDTO, Exception, Contract
Authorization:                      Policy → Model
Security:                           Middleware → Model, Contract
Orchestration:                      Action → Action, Job, Contract, Model, InputDTO, ResultDTO, Enum, Exception
Async Execution:                    Job → Action, Contract, Model, Enum
Entry Point:                        Controller → Action, FormRequest, ResourceData, Model, ResultDTO, Enum
Wiring:                             Provider → Contract, Service, Policy
```

## Host PHP Requirements

The host's PHP must satisfy the project's platform pin:

- **PHP 8.5** (matches `composer.json` `platform.php = "8.5"` and `docker/backend.Dockerfile` `FROM php:8.5-cli`).
- **`php8.5-pcov` extension** — required for `composer test:coverage` and `composer mutation`. On Debian/Ubuntu via the `deb.sury.org` PPA: `sudo apt install php8.5 php8.5-pcov php8.5-cli php8.5-mbstring php8.5-xml php8.5-curl php8.5-sqlite3 ...`.
- **`update-alternatives --display php`** must show `link currently points to /usr/bin/php8.5`. Dual-install drift is a common silent root cause of "no coverage driver" failures.

## Commit Messages

All commits follow Conventional Commits. The root `.githooks/commit-msg` (commitlint) keeps the log clean.

**Format:** `<type>(<scope>): <headline>`

**Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

**Scopes:**

| Scope | Department |
|---|---|
| `auth` | Auth Bay |
| `storage` | Storage Aisle |
| `inventory` | Inventory Desk (family sets) |
| `receiving` | Receiving Dock (sync, imports, external) |
| `family` | Family Office |
| `arch` | Architecture / regulations |
| `ci` | CI pipeline |

```
feat(storage): add hierarchical container nesting for drawer-in-bin layouts
fix(receiving): handle Rebrickable 429 during bulk collection import
refactor(inventory): extract status transition logic into dedicated action
test(arch): enforce thin controllers reject try-catch blocks
```

The one rule: **`chore: update stuff`** is forbidden. Every commit tells the story of what moved through the wing and why.
