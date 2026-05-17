# Architecture Decision Records

Decisions that shaped the build. Each records what was chosen, what was rejected, and what enforces it.

| ADR | Decision | Enforced By |
|-----|----------|-------------|
| [0001](0001-session-auth-not-tokens.md) | Session-based SPA auth, not tokens | Sanctum config, bootstrap/app.php |
| [0002](0002-single-tier-authorization.md) | Single-tier authorization with three-layer defense (incl. family-scoped multi-tenancy) | PolicyArchitectureTest, RoutingArchitectureTest, EnsureFamilyOwnership |
| [0003](0003-actions-and-services-separation.md) | Actions for business logic, Services for HTTP only (incl. final readonly, instance queries, API resilience) | ActionArchitectureTest, ServiceArchitectureTest, Deptrac |
| [0004](0004-explicit-cascade-deletion.md) | Explicit cascade deletion with cascadeRelations() contract | MigrationArchitectureTest, CascadeRelationArchitectureTest |
| [0005](0005-no-mass-assignment.md) | Model conventions: no mass assignment, casts-only transformations | ModelArchitectureTest |
| [0006](0006-dto-form-requests-and-resource-data.md) | DTOFormRequest with toDto() bridge + custom ResourceData | RequestArchitectureTest, ResourceDataArchitectureTest, ActionArchitectureTest |
| [0007](0007-config-attributes-not-helpers.md) | #[Config] attributes, not helpers/facades | ConfigArchitectureTest, GeneralArchitectureTest |
| [0008](0008-explicit-routes-not-api-resource.md) | Explicit routes, not apiResource | RoutingArchitectureTest |
| [0009](0009-thin-controllers-method-injection.md) | Thin controllers with method injection only | ControllerArchitectureTest |
| [0010](0010-computed-resource-data.md) | ComputedResourceData for DTO-sourced responses (sibling to ResourceData, shared ResourceResponse interface) | ResourceDataArchitectureTest, PHPStan, Deptrac |
| [0011](0011-import-atomicity.md) | Save-what-you-can import atomicity with honest reporting | Unit tests (three-scenario coverage), ADR-0003 try-catch constraints |
| [0012](0012-tighten-runtime-to-php-85.md) | Tighten runtime to PHP 8.5+ and remove PHP 8.4 fallback | composer.json platform pin, CI matrix, Dockerfile base image |
| [0013](0013-pre-push-permit-verification.md) | Pre-push permit verification gate (CaptainHook structural enforcement of Operations Protocol) | CaptainHook pre-push action, threshold-gated permit lookup, fail-not-prompt on miss |

## Adding a New ADR

1. Copy the format from any existing ADR
2. Number sequentially: `NNNN-short-title.md`
3. Include: Status, Context, Decision, Alternatives Considered, Consequences, Enforced By
4. Update this index
