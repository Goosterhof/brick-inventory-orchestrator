# Decision: Domain isolation via lint rules and architecture tests

**Date**: 2026-03-18
**Feature**: Code organization and dependency boundaries
**Status**: accepted
**Stress-Tested**: 2026-03-23
**Transferability**: universal

## Context

The Families app has seven domains: auth, home, sets, storage, parts, settings, about. Each domain is a vertical slice — its own pages, modals, and route definitions. The question is: can domains import from each other?

The temptation is obvious. The `sets` domain needs to display storage options in an assignment modal. The `storage` domain already fetches storage options. Why not import the storage domain's fetching logic into the sets domain?

Because once you allow one cross-domain import, you get a dependency graph that grows silently until domains are so entangled that changing `storage` breaks `sets` breaks `parts`. In a team of 20+ juniors, "just be disciplined about it" is not a strategy. The constraint must be structural, not cultural.

## Options Considered

| Option                                                            | Pros                                                                                                                                                                                                     | Cons                                                                                                                                                                                                                                               | Why eliminated / Why chosen                                                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Allow selective cross-domain imports with review guidelines**   | Flexible. Teams can share code when it makes sense. Less duplication                                                                                                                                     | Guidelines erode under deadline pressure. Dependency graph becomes implicit. No tooling catches violations — only human reviewers. With 20+ juniors, review quality varies                                                                         | Eliminated — doesn't scale for the team size                                                             |
| **Barrel exports from domains (public API per domain)**           | Controlled surface area. Domains expose only what they choose to. Developers never need to decide what to export — the boundary is absolute                                                              | Still creates inter-domain dependencies, just through a narrower interface. Barrel becomes a dumping ground. Doesn't prevent circular dependencies without additional tooling. Introduces judgment calls at the boundary: "should this be public?" | Eliminated — reduces the problem but doesn't solve it. Full isolation removes the judgment call entirely |
| **Event bus / pub-sub for cross-domain communication**            | Full decoupling. Domains communicate through events, not imports                                                                                                                                         | Indirection makes control flow hard to follow. Event contracts are untyped (or require a shared event registry). Debugging "who emitted what" is painful. Overkill for the coordination patterns this app actually needs                           | Eliminated — adds complexity for coordination that rarely happens                                        |
| **Hard isolation: domains cannot import from each other, period** | Zero inter-domain coupling. Each domain is independently understandable. Refactoring one domain cannot break another. Enforced by tooling, not discipline. No judgment calls — the answer is always "no" | Some code duplication (e.g., both `sets` and `storage` domains fetch storage options independently). Navigation between domains uses string-based route names instead of imported constants                                                        | **Chosen** — the duplication cost is low and the coupling prevention is high-value for a junior team     |

## Decision

Domains are fully isolated. A domain can import from:

- **`@shared/`** — shared components, composables, helpers, services, types
- **`@app/services`** — app-level service instances (through the barrel export only)
- **`@app/types/`** — app-level type definitions
- **Relative paths within the same domain** — sibling pages, modals

A domain **cannot** import from:

- **`@app/domains/`** — any domain, including itself via the alias (use relative imports instead)
- **Other apps** — `../admin/`, `../families/`, etc.

Cross-domain coordination happens through three mechanisms, none of which require imports:

1. **Navigation**: `routerService.goToRoute("storage-detail", {id})` — route names are strings, not imported symbols
2. **Shared types**: `StorageOption`, `FamilySet` live at `@app/types/`, accessible to all domains without coupling
3. **Independent data fetching**: if `sets` needs storage options, it fetches them from the API. It does not reach into the `storage` domain

Domain `index.ts` files export **only routes** — no components, no utilities, no types. This prevents domains from accidentally becoming import targets.

## Enforcement

Four independent layers, defense in depth:

| Layer           | Mechanism                                                                                                                                                                | What it catches                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Lint-time**   | oxlint `no-restricted-imports` with regex `^@app/domains/` on `src/apps/*/domains/**`                                                                                    | Alias-based cross-domain imports                                                        |
| **Lint-time**   | oxlint `no-restricted-imports` with regex for relative `../apps/` and `../shared/` paths                                                                                 | Relative path escapes                                                                   |
| **Test-time**   | Architecture spec: `domain isolation — domains must not import from other domains` — resolves relative paths to absolute and checks against all other domain directories | Both alias and relative cross-domain imports, including edge cases the regex might miss |
| **Test-time**   | Architecture spec: `domain index files must only export routes` — scans domain index files for non-route exports                                                         | Domains exposing importable surface area                                                |
| **Commit-time** | Pre-push hook runs lint and test suite                                                                                                                                   | Violations cannot reach the remote                                                      |

The architecture test is the most thorough: it resolves relative imports to absolute paths and checks them against every other domain directory, catching tricks that the regex-based lint rule might miss.

## Consequences

- **Each domain is independently understandable** — you can read the `sets` domain without knowing anything about `storage`, `parts`, or `auth`
- **Refactoring is local** — changing the internal structure of one domain cannot break another. This is critical for a team of juniors who may not understand the ripple effects of changes
- **Some data fetching is duplicated** — `sets` and `storage` may both fetch storage options from the API. This is intentional: the HTTP cost is negligible, and the coupling cost of sharing would be permanent. In practice, most shared data is fetched once by app-level adapter stores (ADR-007); only domain-specific queries for fast-changing data (e.g., paginated lists) are fetched independently
- **Duplication of small utilities is accepted** — if a domain needs a helper that already exists in another domain, the correct action is to copy it or promote it to `@shared/`. Duplication is a separate concern with its own fix path (promotion to `@shared/` when spotted), not a reason to punch holes in isolation
- **Navigation uses string-based route names** — a typo in a route name is caught by the RouterService's type system (ADR-001), not by an import. This is the deliberate tradeoff: slightly less discoverable than imported constants, but zero coupling
- **Domain index files are minimal** — they export only routes. No barrel of utilities, no shared components. This keeps the surface area at zero

## Subdomain Principle

As domains grow in complexity, they may split into internal subdomains (e.g., `sets/wishlists/`, `sets/scanning/`). **Subdomains follow the same isolation rules as top-level domains** — a subdomain cannot import from another subdomain within the same parent domain, and the same coordination mechanisms apply.

This makes the rule fractal: a developer who learns the isolation pattern once applies it at every level of nesting.

**Deferred**: Enforcement tooling for subdomain-to-subdomain imports is not yet implemented. The current lint regex (`^@app/domains/`) catches top-level cross-domain imports but does not enforce isolation between subdomains within the same domain. This enforcement will be added when the first domain actually splits into subdomains.

## Open Questions

- As domains grow, will the "fetch independently" pattern lead to noticeable duplicate API calls on pages that span multiple domains? Current assessment: unlikely, since pages live within a single domain. App-level adapter stores (ADR-007) handle shared data; only domain-specific queries are fetched independently. But if a future design requires a dashboard pulling from multiple domains simultaneously, a shared data layer above the domain level might be needed.
- Should domain-level types (e.g., a type used only within the `sets` domain) live at `@app/types/` or within the domain directory? Current decision: types that any domain might reference live at `@app/types/`, keeping domain index files minimal and avoiding any reason to import cross-domain. As domains grow, domain-local types may make sense for types that are truly internal.

## Adoption Strategy

This pattern can be adopted incrementally in existing codebases. Rather than requiring a big-bang migration away from shared state, teams can scope the enforcement rules (lint regex and architecture tests) to new domains first, then progressively tighten the boundary as existing domains migrate their cross-domain dependencies to app-level stores or independent fetching.
