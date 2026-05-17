# Decision Ledger — _Why We Built It This Way_

Architecture decisions that shaped the warehouse. Each records what was chosen, what was rejected, and what enforces it. Full records live in `docs/adr/`.

**Start here:** [ADR-000](ADR-000.md) explains why this project exists, who the audience is, and how decisions should be evaluated.

Every significant decision goes through a **Logistics Director-mediated review**: the Head Sorter proposes, the Director challenges, the CEO approves. New ADRs use the [decision record template](.decision-record-template.md).

## Decision Index

| # | Decision | Date | Status |
|---|---|---|---|
| [000](ADR-000.md) | Why this warehouse exists and how decisions are made | 2026-03-21 | Accepted |
| 0001 | Session-based SPA auth, not tokens | 2026-03-22 | Accepted |
| 0002 | Single-tier authorization with three-layer defense (incl. family-scoped multi-tenancy) | 2026-03-22 | Accepted |
| 0003 | Actions for business logic, Services for HTTP only (incl. final readonly, instance queries, API resilience) | 2026-03-22 | Accepted |
| 0004 | Explicit cascade deletion with cascadeRelations() contract | 2026-03-22 | Accepted |
| 0005 | Model conventions: no mass assignment, casts-only transformations | 2026-03-22 | Accepted |
| 0006 | DTOFormRequest with toDto() bridge + custom ResourceData | 2026-03-22 | Accepted |
| 0007 | #[Config] attributes, not helpers/facades | 2026-03-22 | Accepted |
| 0008 | Explicit routes, not apiResource | 2026-03-22 | Accepted |
| 0009 | Thin controllers with method injection only | 2026-03-22 | Accepted |
| 0010 | ComputedResourceData for DTO-sourced responses (sibling to ResourceData, shared ResourceResponse interface) | 2026-03-28 | Accepted |
| 0011 | Save-what-you-can import atomicity with honest reporting | 2026-02-11 | Accepted |
| 0012 | Tighten runtime to PHP 8.5+ and remove PHP 8.4 fallback | 2026-04-30 | Accepted |
| 0013 | Pre-push permit verification gate (CaptainHook structural enforcement of Operations Protocol) | 2026-05-05 | Accepted |

_Note: The original ADRs 0010–0016 were consolidated into their parent ADRs on 2026-03-22. The sub-decisions (cascadeRelations contract, final readonly, instance query builders, family-scoped multi-tenancy, API resilience, attribute casting, FormRequest-to-DTO bridge) now live within ADRs 0002–0006. ADR-0010 and ADR-0011 were subsequently assigned to new decisions._
