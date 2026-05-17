# Decision: Explicit snake/camel case conversion at service boundaries

**Date**: 2026-03-17
**Feature**: API communication layer
**Status**: superseded by [ADR-016](./016-case-conversion-via-http-middleware.md) (2026-05-05)
**Transferability**: universal

> **Superseded 2026-05-05.** The `fs-adapter-store` package migration on 2026-04-01 removed the centralized conversion choke point this ADR's reasoning depended on. The "explicit at every boundary" approach silently broke when the adapter no longer participated in conversion. ADR-016 adopts HTTP request/response middleware (matching a sibling territory's pattern) and accepts that the original middleware-rejection argument no longer holds in the post-migration world. The historical reasoning below is preserved for context.

## Context

Backend API returns snake_case (`first_name`, `created_at`). Frontend TypeScript uses camelCase (`firstName`, `createdAt`). Every API interaction crosses this boundary. The question was where and how to handle the conversion.

**Important correction**: The initial assumption was that this conversion happens as HTTP middleware. It does not. Conversion is explicit — called at specific points in service methods, not applied automatically to all requests/responses.

## Options Considered

| Option                                                                | Pros                                                                                                                     | Cons                                                                                                                                                                                      | Why eliminated / Why chosen                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Use snake_case in frontend**                                        | No conversion needed                                                                                                     | Violates TypeScript naming conventions. Every component that touches API data uses non-standard names. IDE refactoring breaks                                                             | Eliminated — the cognitive cost is constant and pervasive   |
| **HTTP interceptor/middleware** (automatic on all requests/responses) | Zero manual work, consistent                                                                                             | Converts everything — including requests/responses that shouldn't be converted (e.g., external APIs, headers). Hard to debug when conversion causes issues. Silent failures on edge cases | Considered but not chosen — too broad, too invisible        |
| **Explicit conversion at service boundaries**                         | Visible where it happens. Only converts what should be converted. Type-safe — `DeepSnakeKeys<T>` on input, `T` on output | Requires remembering to call it. Repeated at every API boundary                                                                                                                           | **Chosen** — visibility and control outweigh the repetition |

## Decision

Explicit conversion using `toCamelCaseTyped<T>()` (API response → app) and `deepSnakeKeys()` (app → API request), called in service methods — auth service registration/login, resource adapter CRUD operations. Both functions come from the `string-ts` package with thin typed wrappers in `@shared/helpers/string.ts`.

Type safety enforced by typing API responses as `DeepSnakeKeys<T>` and immediately converting to `T`. TypeScript catches missing conversions at compile time.

## Consequences

- **Visibility**: You can grep for `toCamelCaseTyped` and `deepSnakeKeys` to find every API boundary. No hidden transformations
- **Type safety**: `DeepSnakeKeys<T>` type ensures the compiler knows when data is in snake_case form. You can't accidentally use unconverted data
- **Repetition**: Every service that talks to the API has conversion calls. The resource adapter centralizes most of this, but auth has its own
- **Correctness**: Unlike automatic middleware, this never converts something that shouldn't be converted

## Resolved Questions

### Should conversion move into a shared base service pattern as more services need API access?

**Resolved 2026-03-17.** No — stay explicit. The resource adapter already centralizes conversion for standard CRUD. Auth is the only non-CRUD service with its own conversion, and its endpoints (login, register, refresh) are inherently non-standard. A shared base service to deduplicate 2 call sites is premature abstraction, and it hides conversion points that are currently greppable (`toCamelCaseTyped`, `deepSnakeKeys`). This aligns with the visibility-over-magic principle from ADR-002. Revisit if a third non-CRUD service needs API access with conversion — that's a real pattern worth extracting.

### Are there string-ts edge cases that could break silently?

**Resolved 2026-03-17.** Non-issue for our stack. The backend is Laravel with standard Eloquent conventions — all API responses use clean snake_case. `string-ts` handles this correctly and `DeepSnakeKeys<T>` enforces it at compile time. If we ever integrate an external API with non-standard casing (acronyms, mixed-case keys), that's handled with a manual mapping at that specific service boundary — the explicit conversion approach already provides this escape hatch.
