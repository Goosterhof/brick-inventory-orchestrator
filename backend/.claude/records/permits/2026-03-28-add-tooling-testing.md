# Shipping Order: Add Portfolio-Grade Tooling & Testing

**Order #:** 2026-03-28-add-tooling-testing
**Filed:** 2026-03-28
**Issued By:** Logistics Director (approved by CEO)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Add four tooling and testing improvements that fill visible gaps in the warehouse's quality infrastructure: automated API documentation, dependency update automation, static application security testing, and contract tests for external supplier integrations.

## Scope

### In the Crate

1. **OpenAPI with Scramble** — Install and configure `dedoc/scramble` to auto-generate OpenAPI documentation from existing routes. Verify the generated spec covers all public API endpoints.
2. **Dependabot configuration** — Add `.github/dependabot.yml` for automated Composer dependency update PRs.
3. **Semgrep SAST in CI** — Add a GitHub Actions job that runs Semgrep with PHP/Laravel rulesets to scan application code for security vulnerabilities.
4. **Contract tests for Rebrickable & Brickognize** — Add tests that validate our assumptions about external API response shapes match recorded snapshots/contracts. These tests verify our DTOs and service parsing logic against realistic response fixtures, catching integration drift before production.

### Not on This Pallet

- OpenAPI UI hosting or custom theming
- Renovate (Dependabot is simpler for this use case)
- Runtime security monitoring or WAF configuration
- Integration tests that hit real external APIs
- Changes to existing business logic or endpoints

## Acceptance Criteria

- [ ] Scramble is installed and `php artisan scramble:export` produces a valid OpenAPI spec
- [ ] Scramble route is accessible and documents all API endpoints
- [ ] `.github/dependabot.yml` exists with Composer ecosystem configured
- [ ] CI workflow includes a Semgrep job that runs on PRs to main
- [ ] Contract tests exist for Rebrickable service (fetchSet, fetchSetParts, fetchSetByEan, fetchUserSets)
- [ ] Contract tests exist for Brickognize service (identifyBrick)
- [ ] Contract tests use realistic fixture data matching actual API response shapes
- [ ] All existing tests continue to pass
- [ ] PHPStan passes at level max
- [ ] Deptrac boundaries remain clean

## References

- Decision: No new ADR needed — these are additive tooling, not architectural changes
- Related: Existing CI in `.github/workflows/ci.yml`

## Notes from the Issuer

Scramble should respect our existing route structure and middleware. Contract tests should live alongside existing service unit tests but be clearly identifiable as contract/integration shape tests. Semgrep should not block CI on informational findings — only error-level rules should fail the build.

---

**Status:** Complete
**Shift Log:** `.claude/records/journals/2026-03-28-add-tooling-testing.md`
