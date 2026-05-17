# Decision: Explicit Routes, Not apiResource

**Date**: 2026-03-22
**Feature**: Route declaration strategy for the API
**Status**: accepted
**Transferability**: project-specific

## Context

Laravel provides `Route::apiResource()` to register standard CRUD routes in one call. This project uses per-route authorization via `->can()` middleware (ADR-0002), which requires each route to declare its policy method individually. `apiResource()` makes this awkward — you have to chain `->middleware()` with an array mapping actions to middleware, which is harder to read and audit than explicit route declarations.

The forces:
- Every route must have explicit `->can()` authorization — omitting it is a security gap
- The API surface must be visible at a glance in one file
- Route naming follows conventions (kebab-case plural paths, snake_case singular parameters)
- Not every resource needs all CRUD operations — `apiResource()` registers routes you may not want

## Options Considered

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **Explicit route declarations** | Each route visible with its authorization; easy to audit; no phantom routes | More lines in `routes/api.php`; repetitive for standard CRUD | **Chosen** — visibility and per-route authorization outweigh brevity |
| **`Route::apiResource()`** | Concise; standard Laravel | Hides the actual API surface; applying per-route `->can()` is awkward; registers routes you might not need; doesn't support custom method names | Eliminated — convenience conflicts with auditability |
| **`Route::apiResource()` with `->only()`/`->except()`** | More selective than full apiResource | Still hides routes; `->can()` middleware mapping is an indirection layer | Eliminated — still too implicit |
| **Custom macro wrapping explicit routes** | Could encapsulate the pattern | Adds abstraction for debatable benefit; the explicit version is already readable | Eliminated — premature abstraction |

## Decision

Define every route explicitly in `routes/api.php`:

```php
Route::get('storage-options', [StorageOptionController::class, 'index'])
    ->can('viewAny', StorageOption::class);
Route::post('storage-options', [StorageOptionController::class, 'store'])
    ->can('create', StorageOption::class);
Route::get('storage-options/{storageOption}', [StorageOptionController::class, 'show'])
    ->can('view', 'storageOption');
Route::put('storage-options/{storageOption}', [StorageOptionController::class, 'update'])
    ->can('update', 'storageOption');
Route::delete('storage-options/{storageOption}', [StorageOptionController::class, 'destroy'])
    ->can('delete', 'storageOption');
```

Naming conventions:
- Paths: kebab-case plural (`storage-options`, `family-sets`)
- Parameters: snake_case singular (`{storageOption}`, `{familySet}`)
- Authorization: `->can()` on every protected route, referencing the policy method and model

## Consequences

- Every endpoint is visible at a glance in `routes/api.php` — the file is the API surface documentation
- Authorization middleware is explicit per route — an architecture test catches any route missing `can:`
- Slightly more lines than `apiResource()`, but each line carries complete information
- Adding a new endpoint means adding one line with its authorization — no hidden magic

## Enforcement

| What | Mechanism | Scope |
|------|-----------|-------|
| Every authorized route has `can:` middleware | `RoutingArchitectureTest` | `routes/api.php` |
| Route structure matches expected patterns | `RoutingArchitectureTest` | `routes/api.php` |
