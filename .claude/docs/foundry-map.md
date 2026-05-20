# Foundry Map

Every department of the Foundry Wing, mapped. Sibling document to `domain-map.md` (Gallery Wing). Update this when adding or modifying Foundry departments. Distilled from `backend/CLAUDE.md` (the Foundry Wing manual) during Phase 6 of the Brickworks merger.

## The Foundry Wing — A LEGO Storage Inventory API

A RESTful service where families catalog their sets, track individual parts, organize physical storage locations, and sync their collections from external suppliers. Behind-the-scenes infrastructure for what the Gallery Wing surfaces.

## Departments

| Department | Purpose | Handles |
|---|---|---|
| **Auth Bay** | Crew credentials and family registration | Login, registration, session management |
| **Storage Aisle** | Physical storage organization | Drawers, bins, containers — hierarchical locations |
| **Inventory Desk** | Set and part tracking | Family sets, build status, wishlist management |
| **Receiving Dock** | External supplier integration | Rebrickable imports, EAN lookups, brick identification |
| **Family Office** | Multi-tenant coordination | Members, stats, shared inventory, Rebrickable tokens |

## Department Details

### Auth Bay

- **Actions**: `LoginAction`, `RegisterAction`, `LogoutAction`, `GenerateInviteCodeAction`, `RevokeInviteCodeAction`
- **Models**: `User`, `InviteCode`
- **Routes**: `POST /login`, `POST /register`, `POST /logout`, `POST /invite-codes`, `DELETE /invite-codes/:code`
- **Notes**: Session-based via Laravel Sanctum (ADR-0013). User is the explicit exemption to the no-`$guarded` rule (ADR-0017).

### Storage Aisle

- **Actions**: `CreateStorageOptionAction`, `UpdateStorageOptionAction`, `DeleteStorageOptionAction`, `PlacePartAction`, `RemovePartAction`
- **Models**: `StorageOption` (hierarchical), `StorageOptionPart`
- **Routes**: `GET /storage-options`, `POST /storage-options`, `GET /storage-options/:id`, `PUT /storage-options/:id`, `DELETE /storage-options/:id`
- **Notes**: Hierarchical containers (drawers-in-bins). Explicit cascade deletion via `cascadeRelations()` (ADR-0016).

### Inventory Desk

- **Actions**: `AddFamilySetAction`, `UpdateFamilySetAction`, `DeleteFamilySetAction`, `GetFamilySetCompletionAction`, `GetMissingPartsAction`, `GetReverseLookupAction`
- **Models**: `FamilySet`, `SetPart`, `Set`, `Part`, `Color`
- **Routes**: `GET /family-sets`, `POST /family-sets`, `GET /family-sets/:id`, `PUT /family-sets/:id`, `PATCH /family-sets/:id`, `DELETE /family-sets/:id`, `GET /family-sets/completion`, `GET /family-sets/missing-parts`, `GET /family/parts`, `GET /family/brick-dna`
- **Notes**: Three bulk aggregation endpoints share the SQL-side aggregation discipline — query budgets proven via `DB::listen` runtime tests.

### Receiving Dock

- **Actions**: `StartImportAction`, `ImportOwnedSetsAction`, `IdentifyBrickAction`
- **Services**: `RebrickableService` (catalog + user-collection sync), `BrickognizeService` (forensic brick identification)
- **Jobs**: `ImportOwnedSetsJob` (async via `database` queue)
- **Routes**: `POST /sync/start`, `GET /sync/status`, `POST /brick-identification`
- **Notes**: Save-what-you-can import atomicity (ADR-0001). Try-catch on `UniqueConstraintViolationException` is the documented exception in ADR-0015's no-try-catch rule.

### Family Office

- **Actions**: `CreateFamilyAction`, `JoinFamilyAction`, `LeaveFamilyAction`, `RemoveMemberAction`, `UpdateRebrickableTokenAction`
- **Models**: `Family`, `FamilyMember`
- **Routes**: `POST /families`, `POST /families/join`, `POST /families/leave`, `DELETE /families/members/:id`, `PUT /families/rebrickable-token`
- **Notes**: Multi-tenant boundary. `EnsureFamilyOwnership` middleware enforces per-route (ADR-0014). Family-scoped models implement `BelongsToFamilyInterface`.

## Heavy Machinery & Suppliers

| Equipment | Make & Model |
|---|---|
| Framework | Laravel 13 |
| Language | PHP 8.5 (strict types) |
| Reactor | Laravel Octane with FrankenPHP |
| Auth | Laravel Sanctum (session-based) |
| Database | PostgreSQL 16 (production) / SQLite (local) |
| Static Analysis | PHPStan level `max` with Larastan + 4 custom war-room rules |
| Architecture | Deptrac (boundary fences) |
| Testing | Pest (`describe()` blocks + `it('should ...')` syntax) |
| Linting | Rector + Pint |
| Mutation Testing | Infection (76% minimum survival) |
| Git Hooks | CaptainHook (pre-commit + pre-push gauntlet) |
| Deployment | Railway (single multi-stage image) |

### External Suppliers

| Supplier | What They Ship | Service Class |
|---|---|---|
| **Rebrickable** | Set catalogs, part databases, color palettes, user collections | `RebrickableService` |
| **Brickognize** | Visual brick identification from photos | `BrickognizeService` |

## Adding a New Department

When adding a department, update this map and follow the Foundry CLAUDE.md "Floor Plan" structure:

1. Add the department to the table above with its purpose and the kind of work it handles
2. Fill in the department details (Actions, Models, Services if any, Jobs if any, Routes)
3. Note any non-default conventions (cascade rules, try-catch exceptions, etc.)
4. Register the new routes in `routes/api.php` per ADR-0020 (explicit, never `apiResource()`)
