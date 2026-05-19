# The Foundry Wing — Operational Manual

> The Foundry is The Brickworks' backend production wing. This file documents Laravel-specific conventions, machinery, and quality gauntlets for work inside `backend/`. Brickworks identity, the crew (Brickwright / Quality Warden / Pattern Master), and the paper-trail vocabulary (Work Order / Build Record / Audit) live in the root `CLAUDE.md` (The Atrium).

## The Foundry — A LEGO Storage Inventory API

A RESTful service where families catalog their sets, track individual parts, organize physical storage locations, and sync their collections from external suppliers. The structural backbone behind the Gallery Wing's showroom.

The departmental layout (Auth Bay, Storage Aisle, Inventory Desk, Receiving Dock, Family Office) is documented in detail at [`/.claude/docs/foundry-map.md`](../.claude/docs/foundry-map.md). Cross-wing decisions live in [`/.claude/docs/decisions.md`](../.claude/docs/decisions.md); Foundry-specific work tracks (graduation logs, pulse, learnings) live alongside it.

## Heavy Machinery & Suppliers

| Equipment | Make & Model |
|---|---|
| Framework | Laravel 12 |
| Language | PHP 8.5 (strict types — no loose screws) |
| Reactor | Laravel Octane with FrankenPHP |
| Auth | Laravel Sanctum (session-based — no loose tokens on the floor) |
| Database | PostgreSQL 16 (production) / SQLite (local sorting practice) |
| Static Analysis | PHPStan at level `max` with Larastan + 4 custom war-room rules |
| Architecture | Deptrac (boundary fences between aisles) |
| Testing | Pest (the quality inspection rig) |
| Linting | Rector + Pint |
| Mutation Testing | Infection (76% minimum survival) |
| Git Hooks | CaptainHook |
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
│   ├── StorageOption/          #   Storage aisle management
│   └── Sync/                   #   Receiving dock operations
├── Services/                   # External API adapters only
│   ├── RebrickableService      #   Main supplier connection
│   └── BrickognizeService      #   Forensics lab connection
├── Models/                     # Eloquent models
│   ├── User, Family            #   Crew & tenant records
│   ├── Set, Part, Color        #   Catalog data (from suppliers)
│   ├── FamilySet, SetPart      #   What families own & what's inside
│   ├── StorageOption           #   Physical locations (hierarchical)
│   └── StorageOptionPart       #   What's stored where
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
├── Mail/                       # Outbound notifications (primitive-only Mailables)
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
- No `ResourceData` construction — Actions return the shaped data
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

### Mail

Mailables in `app/Mail/` are App-layer leaves. They render a view and that's it.

- `final` classes extending `Illuminate\Mail\Mailable` and implementing `ShouldQueue`
- Constructor accepts **primitives only** (`string`, `int`, `bool`, `?string`, `?CarbonImmutable`) — no Models, no DTOs, no other App imports
- Public surface is the Mailable contract only — `__construct`, `envelope`, `content`, `attachments`, `headers`. `MailArchitectureTest` enforces all of it
- Subject lives in `envelope()`. View lives in `content()` as a Markdown view path (`mail.<name>`). View payload bound via `with: [...]` — pass primitives only
- From-address comes from `config('mail.from')` (`MAIL_FROM_ADDRESS`/`MAIL_FROM_NAME`)
- The Action sends via the `Illuminate\Contracts\Mail\Mailer` contract: `$this->mailer->to($recipient)->send($mailable)`
- Deptrac: the `Mail` layer has **no allowed dependencies**; only the `Action` layer may depend on `Mail`

### Queue Worker

The Foundry writes async work; a `queue:work` worker reads it. **Production needs both, period.** A `ShouldQueue` mailable hitting an absent worker is a silent failure.

- **Production (Railway):** a dedicated `worker` service runs against the same image and env as the web service:
  ```
  php artisan queue:work --queue=default --tries=3 --backoff=10 --timeout=60 --max-time=3600
  ```
  `--max-time=3600` recycles the process hourly to bound memory leaks.
- **Local dev:** orchestrator-side `make queue` runs the same command inside the backend container. Run it in a second terminal alongside `make up`.
- **Tests:** unit/feature tests use `Mail::fake()` / `Bus::fake()`. E2E uses fakes by the same default.
- **Verifying alive:** `php artisan queue:monitor default --max=100` or query the `failed_jobs` table.

### Middleware

- `EnsureFamilyOwnership` — verifies the shipment belongs to the requesting tenant
- Every authorized route declares `->can()` middleware explicitly (ADR-0020)
- No Gate injection in Controllers — authorization is a checkpoint, not a desk job

### Exceptions

Typed failures with global handling. No silent swallowing.

```
SetNotFoundException              → 404
MissingRebrickableTokenException  → 400
NotFamilyHeadException            → 403
RebrickableApiException           → 502 or 404
BrickognizeApiException           → 502
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

### Pre-Commit Gauntlet

CaptainHook enforces on every commit (PHP files only): **lint:test → phpstan → phpstan:types → deptrac → test:arch**. Dispatched from the orchestrator's `.githooks/pre-commit` only when the staged changeset touches `backend/**`.

### Pre-Push Gauntlet

**PrePushPermitGate → composer test**, dispatched from `.githooks/pre-push` only when the pushed range touches `backend/**`.

- **PrePushPermitGate** (ADR-0028) — verifies that any non-trivial branch has a corresponding open Work Order on file. Threshold: more than 20 files OR more than 500 lines changed against `origin/main`. Slug match: strict equality between the branch slug (portion after the last `/`, lowercased) and the Work Order slug (filename minus the `YYYY-MM-DD-` prefix and `.md` suffix, lowercased). Branches under the threshold and pushes from `main` skip the check entirely. Documented `--no-verify` escape: every bypass must be recorded in the corresponding Build Record's Decisions Made section with explicit Steward sign-off.
- **composer test** — full quality inspection rig.

### Coverage Policy

- **Unit tests (Actions, Services, Mail):** 100% — every Action, every Service, every Mailable
- **Feature tests (Controllers):** 90% — integration drills cover the main paths
- **Mutation testing:** 76% minimum — sabotage drill ensures tests catch defects, not just touch lines

### Boundary Fences (Deptrac)

Functional rows with strict one-way dependencies. Wing aisles do not cross.

```
Leaf Layers (no App deps):          Model, InputDTO, Enum, Exception, Mail
Result-DTO Layer:                   ResultDTO → Enum, Model
Interface Layer:                    Contract → InputDTO, Enum, Exception
Supply Lines:                       Service → Contract, InputDTO, Exception
Input Processing:                   FormRequest → InputDTO, Enum, Model
Output Shaping:                     ResourceData → Model, Enum, ResultDTO, Exception, Contract
Authorization:                      Policy → Model
Security:                           Middleware → Model, Contract
Orchestration:                      Action → Action, Job, Mail, Contract, Model, InputDTO, ResultDTO, Enum, Exception
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

All commits follow Conventional Commits. CaptainHook keeps the log clean.

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
