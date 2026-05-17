# Decision: #[Config] Attributes, Not Helpers or Facades

**Date**: 2026-03-22
**Feature**: Configuration access strategy in application code
**Status**: accepted
**Transferability**: universal

## Context

Laravel provides three ways to access configuration: the `config()` helper, the `Config` facade, and PHP 8's `#[Config]` attribute injection. This project also bans facades in application code (they hide dependencies and make classes harder to test).

The forces:
- Configuration values are dependencies — they should be visible in the constructor signature
- `config()` and facades hide dependencies, making it impossible to know what a class needs without reading its body
- `env()` in application code breaks Laravel's config caching and violates twelve-factor principles
- Providers are exempt — they wire things at boot time before the container is fully built

## Options Considered

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **`#[Config]` attribute injection** | Explicit in constructor; visible in IDE; testable by overriding in container | Requires PHP 8.1+; less familiar to Laravel developers | **Chosen** — makes config dependencies first-class constructor parameters |
| **`config()` helper** | Familiar; available everywhere | Hides dependencies; not visible in constructor; harder to test (must set config in test setup) | Eliminated — convenience at the cost of explicitness |
| **`Config` facade** | Familiar; IDE support via helper packages | Same issues as `config()` plus facade overhead; violates the no-facades rule | Eliminated — facades are banned project-wide |
| **`env()` in application code** | Direct access to environment | Breaks config caching; violates twelve-factor; makes testing harder (must set env vars) | Eliminated — fundamentally wrong in Laravel |

## Decision

Use `#[Config]` attributes for all configuration access in application code:

```php
public function __construct(
    #[Config('services.rebrickable.key', '')] private string $apiKey,
    #[Config('services.rebrickable.base_url', 'https://rebrickable.com/api/v3')] private string $baseUrl,
) {}
```

No `config()` helper, no `Config` facade, no `env()` outside config files. Providers are exempt — they operate at boot time and may need `config()` for wiring.

## Consequences

- All configuration dependencies are explicit in the constructor — you can read a class's config needs from its signature
- Easy to override in tests via the container — no need to manipulate global config state
- Providers are the one exception — they wire bindings before the container resolves attributes
- No facades anywhere in application code — `GeneralArchitectureTest` enforces this globally

## Enforcement

| What | Mechanism | Scope |
|------|-----------|-------|
| No `config()` helper in application code | `ConfigArchitectureTest` | `app/` (excluding Providers) |
| No `Config` facade in application code | `ConfigArchitectureTest` | `app/` (excluding Providers) |
| No `env()` in application code | `GeneralArchitectureTest` | `app/` |
| No facades in application code | `GeneralArchitectureTest` | `app/` |
| `declare(strict_types=1)` in all PHP files | `GeneralArchitectureTest` | `app/` |
