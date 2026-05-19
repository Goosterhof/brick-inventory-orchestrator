# Building Permit: Families App Audit

**Permit #:** 2026-03-26-families-app-audit
**Filed:** 2026-03-26
**Issued By:** CFO
**Assigned To:** Building Inspector
**Priority:** Standard

---

## The Job

Full-sweep inspection of the Families app (`src/apps/families/`). We've shipped a significant amount of work across multiple domains (auth, home, sets, storage, parts, settings, about) and need a quality audit before the next wave of feature builds.

## Scope

### In the Box

- All domains under `src/apps/families/domains/`
- App-level files: `App.vue`, `main.ts`, router, services, types
- Quality gauntlet (format, lint, lint:vue, type-check, test:coverage, knip, size)
- Architecture compliance with ADRs (especially 0009 ResourceData, 0014 Domain-Driven)
- Pattern consistency across domains
- Doc drift check (domain map, pulse, component registry)
- Test quality assessment (not just coverage numbers)

### Not in This Set

- `src/shared/` (already audited — permit 2026-03-25)
- `src/apps/admin/` (separate audit)
- `src/apps/showcase/` (already audited — permit 2026-03-24)

## Acceptance Criteria

- [ ] Quality gauntlet results documented
- [ ] Findings catalogued with severity, location, standard, and recommendation
- [ ] Doc drift assessed for all tracked documents
- [ ] Self-debrief with methodology assessment and training proposals
- [ ] Overall health rating with portfolio-readiness assessment

## References

- Prior Inspection: `2026-03-24-showcase-app.md` (Showcase audit)
- Prior Inspection: `2026-03-25-shared-directory-audit.md` (Shared audit)
- ADR-0009: ResourceData Pattern
- ADR-0014: Domain-Driven Frontend Structure

## Notes from the Issuer

This is the main structure — the tower. If the Families app isn't tight, nothing else matters for the portfolio. Pay particular attention to cross-domain consistency (are all domains following the same patterns?) and whether the settings domain work we shipped recently (family roster, decade dial, theme atlas, brick census) holds up structurally. The inspector should compare patterns across domains to find outliers, not just check each domain in isolation.

---

**Status:** Complete
**Inspection Report:** `.claude/records/inspections/2026-03-26-families-app-audit.md`
