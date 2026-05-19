# Building Permit: The Brick Catalog Blueprint

**Permit #:** 2026-03-26-brick-catalog-blueprint
**Filed:** 2026-03-26
**Issued By:** CEO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Create the missing `brick-catalog.md` — component documentation for all 32 shared components covering props, slots, emits, and composition patterns. Three consecutive inspections (2026-03-24 showcase, 2026-03-25 shared directory, 2026-03-26 families app) have flagged this as a gap. The domain-map links to it, `npm run lint:catalog` crashes without it, and for the portfolio it's the component reference a technical reviewer would expect.

## Scope

### In the Box

- Create `.claude/docs/brick-catalog.md` documenting all 32 shared components
- For each component: props (name, type, required, default), slots, emits, and a usage example
- Composition patterns section (which components are commonly used together)
- Verify `npm run lint:catalog` passes after creation
- Fix or update `scripts/validate-brick-catalog.mjs` if the validation format needs adjustment
- Update domain-map if the link path needs correction

### Not in This Set

- Changes to the shared components themselves
- Showcase app updates (that provides visual demos, this provides contract docs)
- Auto-generation tooling (manual authorship is fine for 32 components)

## Acceptance Criteria

- [ ] `.claude/docs/brick-catalog.md` exists with documentation for all 32 shared components
- [ ] Each component entry includes: props with types, slots, emits, and a brief usage example
- [ ] Composition patterns section documents common component combinations
- [ ] `npm run lint:catalog` passes without errors
- [ ] Domain-map link to brick-catalog resolves correctly
- [ ] Component count matches the component registry (currently 32)
- [ ] All quality gates pass

## References

- Inspection Findings: `frontend/.claude/records/inspections/2026-03-24-showcase-app.md` (Finding 1)
- Inspection Findings: `frontend/.claude/records/inspections/2026-03-25-shared-directory-audit.md` (Finding 1, Finding 4)
- Inspection Findings: `frontend/.claude/records/inspections/2026-03-26-families-app-audit.md` (referenced in doc drift)
- Existing: `scripts/validate-brick-catalog.mjs`, `src/shared/generated/component-registry.json`

## Notes from the Issuer

Three inspections running. This is operational debt, not a feature. The Showcase app is the visual gallery — the Brick Catalog is the developer reference. Both exist in well-run component libraries. The registry JSON (`component-registry.json`) can be used as a starting point to ensure no components are missed, but the documentation itself needs to be authored by someone who understands the component contracts. Partial auto-generation from the registry is acceptable for the skeleton, but composition patterns and usage guidance need manual thought.

---

**Status:** Voided
**Voided:** 2026-03-27
**Reason:** CEO previously deleted brick-catalog.md (superseded by ADR-009 component health registry). All codebase references (domain-map link, lint:catalog script, validate-brick-catalog.mjs) were cleaned in PR #133. Permit was filed based on stale inspector findings that hadn't caught up to the cleanup. No work required.
