# Decision: Session-Based SPA Auth, Not Tokens

**Date**: 2026-03-22
**Feature**: Authentication strategy for a single-page application frontend
**Status**: accepted
**Transferability**: project-specific

## Context

Laravel Sanctum supports two authentication modes: stateless bearer tokens and stateful session-based auth. The frontend is a single SPA on a known domain communicating exclusively with this API.

The forces:
- The SPA is the only consumer — no mobile apps, no third-party integrations
- Token management (storage, rotation, revocation) adds complexity with no benefit for a single-domain SPA
- Session-based auth integrates naturally with Laravel's middleware and guard system
- CSRF protection is typically required for session auth, but the SPA doesn't fetch CSRF cookies

## Options Considered

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **Session-based SPA auth via Sanctum stateful middleware** | No token management; native Laravel session handling; simple guard integration | Requires stateful domain config; CSRF handling needs explicit exclusion | **Chosen** — simplest path for a single-SPA consumer |
| **Bearer tokens via Sanctum** | Stateless; works for mobile/third-party | Token storage on client, rotation logic, revocation endpoints — all unnecessary complexity for one SPA | Eliminated — solving problems we don't have |
| **JWT via third-party package** | Industry-standard stateless auth | Same token management overhead plus package dependency; no advantage over Sanctum tokens | Eliminated — adds dependency without benefit |
| **Laravel Passport (OAuth2)** | Full OAuth2 flow with scopes | Massive overkill for a single first-party SPA; complex setup | Eliminated — wrong tool for the scale |

## Decision

Use **session-based SPA authentication** via Sanctum's stateful middleware. No tokens are created or stored.

- `Auth::login($user)` creates a session on login/register
- `Auth::guard('web')->logout()` with session invalidation on logout
- `SANCTUM_STATEFUL_DOMAINS` includes the frontend's `host:port`
- CSRF excluded for `api/*` routes (frontend doesn't fetch CSRF cookies)
- Guard configured to `['web']` in `config/sanctum.php`

```php
// LoginController — session login via StatefulGuard
public function __invoke(
    LoginRequest $loginRequest,
    LoginUserAction $loginUserAction,
    StatefulGuard $statefulGuard,
): JsonResponse {
    $user = $loginUserAction->execute($loginRequest->toDto());
    $statefulGuard->login($user);
    // ...
}
```

## Consequences

- Feature tests use `$this->actingAs($user)`, not `Sanctum::actingAs()`
- Controllers return `ProfileResourceData` directly (no `{user, token}` wrapper)
- `$request->session()` throws without session middleware — guard with `$request->hasSession()`
- Adding a mobile client in the future would require revisiting this decision (token-based auth for non-browser clients)

## Enforcement

| What | Mechanism | Scope |
|------|-----------|-------|
| Guard set to `['web']` | `config/sanctum.php` | Auth configuration |
| CSRF excluded for API routes | `bootstrap/app.php` | Middleware configuration |
| Stateful API middleware enabled | `bootstrap/app.php` (`$middleware->statefulApi()`) | Middleware stack |

## Open Questions

- If a mobile app is added, should we support both session (SPA) and token (mobile) auth simultaneously, or migrate entirely to tokens? Current architecture assumes single-SPA only.
