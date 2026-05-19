# Decision Log — _Why We Built It That Way_

Architecture decisions that shaped The Brickworks. Each entry records what was chosen, what was rejected, and what enforces it. Full records live in [`adr/`](./adr/).

**Start here:** [ADR-000](./ADR-000.md) explains why this project exists, who the audience is, and how decisions should be evaluated.

Every significant decision goes through a **Steward-mediated review**: the Brickwright proposes, The Steward challenges, the CEO approves. New ADRs use the [decision record template](./.decision-record-template.md) (Phase 6: file not yet present; carried over in a future delivery).

## Decision Index

29 ADRs, consolidated chronologically from the pre-merger BIO sovereign sequences (13 Foundry + 16 Gallery) into a single `0001`–`0029` numbering during Phase 5 of the Brickworks merger. Older `**Date**` values reflect the original adoption date in the source wing, preserved verbatim.

| # | Decision | Date | Wing | Status |
|---|---|---|---|---|
| [0001](./adr/0001-import-atomicity.md) | Save-what-you-can import atomicity with honest reporting | 2026-02-11 | Foundry | Accepted |
| [0002](./adr/0002-domain-driven-vertical-slices.md) | Domain-driven vertical slices over technical layers | 2026-03-08 | Gallery | Accepted |
| [0003](./adr/0003-custom-routerservice.md) | Custom RouterService over Vue Router plugin | 2026-03-17 | Gallery | Accepted |
| [0004](./adr/0004-factory-services.md) | Factory pattern for services, no singletons | 2026-03-17 | Gallery | Accepted |
| [0005](./adr/0005-unocss-attributify.md) | UnoCSS with attributify mode, no freeform CSS | 2026-03-17 | Gallery | Accepted |
| [0006](./adr/0006-case-conversion-boundary.md) | Explicit snake/camel case conversion at service boundaries | 2026-03-17 | Gallery | Superseded by [0029](./adr/0029-case-conversion-via-http-middleware.md) |
| [0007](./adr/0007-istanbul-coverage-no-ignores.md) | Istanbul coverage with zero ignore comments | 2026-03-17 | Gallery | Accepted |
| [0008](./adr/0008-resource-adapter-frozen-mutable.md) | Resource adapter with frozen base and mutable ref | 2026-03-18 | Gallery | Accepted |
| [0009](./adr/0009-adapter-store-no-pinia.md) | Adapter store module over Pinia/Vuex | 2026-03-18 | Gallery | Accepted |
| [0010](./adr/0010-domain-isolation.md) | Domain isolation via lint rules and architecture tests | 2026-03-18 | Gallery | Accepted |
| [0011](./adr/0011-brick-catalog-health-metrics.md) | Component health registry — five metrics for the Showcase app | 2026-03-19 | Gallery | Accepted |
| [0012](./adr/0012-test-isolation-collect-guard.md) | Test isolation via execution-time guard, collect-duration guard, and per-file factory mocking | 2026-03-20 | Gallery | Accepted |
| [0013](./adr/0013-session-auth-not-tokens.md) | Session-based SPA auth, not tokens | 2026-03-22 | Foundry | Accepted |
| [0014](./adr/0014-single-tier-authorization.md) | Single-tier authorization with three-layer defense (incl. family-scoped multi-tenancy) | 2026-03-22 | Foundry | Accepted |
| [0015](./adr/0015-actions-and-services-separation.md) | Actions for business logic, Services for HTTP only | 2026-03-22 | Foundry | Accepted |
| [0016](./adr/0016-explicit-cascade-deletion.md) | Explicit cascade deletion with `cascadeRelations()` contract | 2026-03-22 | Foundry | Accepted |
| [0017](./adr/0017-no-mass-assignment.md) | Model conventions — no mass assignment, casts-only transformations | 2026-03-22 | Foundry | Accepted |
| [0018](./adr/0018-dto-form-requests-and-resource-data.md) | DTOFormRequest with `toDto()` bridge + custom ResourceData | 2026-03-22 | Foundry | Accepted |
| [0019](./adr/0019-config-attributes-not-helpers.md) | `#[Config]` attributes, not helpers/facades | 2026-03-22 | Foundry | Accepted |
| [0020](./adr/0020-explicit-routes-not-api-resource.md) | Explicit routes, not `apiResource` | 2026-03-22 | Foundry | Accepted |
| [0021](./adr/0021-thin-controllers-method-injection.md) | Thin controllers with method injection only | 2026-03-22 | Foundry | Accepted |
| [0022](./adr/0022-domain-based-vitest-projects.md) | Domain-based Vitest project split with factory configuration | 2026-03-22 | Gallery | Accepted |
| [0023](./adr/0023-typed-mock-helpers.md) | Typed mock helpers with `MockedService<T>` mapped type | 2026-03-22 | Gallery | Accepted |
| [0024](./adr/0024-page-integration-tests.md) | Page integration tests with real component composition | 2026-03-27 | Gallery | Accepted |
| [0025](./adr/0025-computed-resource-data.md) | ComputedResourceData for DTO-sourced API responses | 2026-03-28 | Foundry | Accepted |
| [0026](./adr/0026-creative-engine-agent.md) | Pattern Master agent (originally "Creative Engine") — dedicated design & animation role | 2026-04-09 | Gallery | Accepted |
| [0027](./adr/0027-tighten-runtime-to-php-85.md) | Tighten supported PHP runtime to 8.5+ | 2026-04-30 | Foundry | Accepted |
| [0028](./adr/0028-pre-push-permit-verification.md) | Pre-push permit verification gate (CaptainHook structural enforcement of Operations Protocol) | 2026-05-05 | Foundry | Accepted |
| [0029](./adr/0029-case-conversion-via-http-middleware.md) | Case conversion via HTTP middleware (supersedes [0006](./adr/0006-case-conversion-boundary.md)) | 2026-05-05 | Gallery | Accepted |

## Adding a New ADR

1. Open the ADR Interrogator skill (`/adr-interrogator`) to stress-test the proposed decision
2. Once the reasoning survives interrogation, draft the ADR following the established structure (Context, Options Considered, Decision, Consequences, Enforcement, Open Questions)
3. Number sequentially: the next free ID after `0029`
4. Filename pattern: `NNNN-short-title.md` under `./adr/`
5. Update this index in the same commit
6. The Brickwright proposes the ADR via Build Record; The Steward reviews; the CEO approves

## Renumbering History

The 29-ADR consolidated sequence was assembled on 2026-05-19 during Phase 5 of the Brickworks merger from two pre-merger sovereign sequences:

- **Foundry** (pre-merger `backend/docs/adr/`): 13 ADRs numbered `0001`–`0013`
- **Gallery** (pre-merger `frontend/.claude/docs/decisions/`): 16 ADRs numbered `001`–`016` (3-digit format)

Ordering: chronological by `**Date**` field; ties broken Foundry-first then by original source number. Full mapping table archived at [`.claude/records/work-orders/2026-05-19-phase-5-adr-renumbering.md`](../records/work-orders/2026-05-19-phase-5-adr-renumbering.md).
