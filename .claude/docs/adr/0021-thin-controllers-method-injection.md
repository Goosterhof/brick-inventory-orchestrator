# Decision: Thin Controllers with Method Injection Only

**Date**: 2026-03-22
**Feature**: Controller design pattern for the API layer
**Status**: accepted
**Transferability**: universal

## Context

Controllers can receive dependencies via constructor injection or method injection. With the Action pattern (ADR-0015), controllers are thin dispatchers — they receive a request, hand it to an Action, and return the response. Each controller method may need different Actions, but a constructor-injected controller front-loads all dependencies even for unused methods.

The forces:
- Controllers should be thin — 3-5 lines per method, not business logic
- Each method needs different dependencies (different Actions, different FormRequests)
- Exception handling must be consistent across all endpoints — not scattered in try-catch blocks
- Authorization is handled in the routing layer (ADR-0014) — controllers must not duplicate it

## Options Considered

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **Method injection only, no constructors** | Each method declares exactly what it needs; no wasted resolution; controller stays thin | Slightly longer method signatures | **Chosen** — aligns with the Action pattern and keeps controllers honest |
| **Constructor injection** | Familiar; shorter method signatures | Front-loads all dependencies even for single-method calls; encourages fat controllers with shared state | Eliminated — encourages the wrong patterns |
| **Single-action controllers (`__invoke`)** | One class per endpoint; pure SRP | Explosion of controller files; harder to see related endpoints together | Eliminated — too many files for debatable benefit (though `__invoke` is used for auth controllers where it makes sense) |
| **Trait-based shared behavior** | Reuse common patterns | Hides dependencies; hard to trace; violates explicitness principle | Eliminated — traits are implicit inheritance |

## Decision

Controllers must **not have constructors**. All dependencies are injected per method:

```php
public function store(
    StoreFamilySetRequest $storeFamilySetRequest,
    #[CurrentUser] User $user,
    CreateFamilySetAction $createFamilySetAction,
): JsonResponse {
    $familySet = $createFamilySetAction->execute($user->family, $storeFamilySetRequest->toDto());

    return FamilySetResourceData::from($familySet)->toResponseWithStatus(201);
}
```

Additional rules:
- **No try-catch blocks** — exceptions handled globally in `bootstrap/app.php`
- **Return `JsonResponse` or `array`** — never ResourceData directly (controllers call `->toResponse()`)
- **No `Gate` injection, no `->authorize()` calls** — authorization is a routing concern (ADR-0014)
- **No query builders** — controllers don't browse the shelves directly

## Consequences

- Each method declares exactly what it needs — no wasted dependency resolution
- Controllers stay thin — typically 3-5 lines per method
- Exception handling is consistent across all endpoints — the global handler maps typed exceptions to HTTP responses
- Adding a new endpoint means adding a method with its dependencies — the controller has no shared state to manage
- Auth controllers use `__invoke` (single-action) where appropriate — this is compatible since `__invoke` is still method injection

## Enforcement

| What | Mechanism | Scope |
|------|-----------|-------|
| No constructors in controllers | `ControllerArchitectureTest` | `app/Http/Controllers/` |
| Return types: `JsonResponse` or `array` only | `ControllerArchitectureTest` | `app/Http/Controllers/` |
| No direct ResourceData returns | `ControllerArchitectureTest` | `app/Http/Controllers/` |
| No try-catch blocks | `ControllerArchitectureTest` | `app/Http/Controllers/` |
| No `Gate` injection | `PolicyArchitectureTest` | `app/Http/Controllers/` |
| No `->authorize()` calls | `PolicyArchitectureTest` | `app/Http/Controllers/` |
