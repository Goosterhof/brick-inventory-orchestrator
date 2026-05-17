# Building Permit: Audit Showcase App

**Permit #:** 2026-03-24-audit-showcase-app
**Filed:** 2026-03-24
**Issued By:** CFO (on CEO request)
**Assigned To:** Building Inspector
**Priority:** Standard

---

## The Job

Full audit of the Showcase app (`src/apps/showcase/`). The showroom floor is our portfolio's front door — if it's not tight, nothing else matters.

## Scope

### In the Box

- Quality gauntlet results (all 7 checks)
- Architecture compliance: import paths, naming conventions, component patterns
- Test coverage gaps (12 components, only 2 test files observed)
- Style guide compliance: neo-brutalist conventions, UnoCSS usage
- Component gallery completeness: are all shared components represented?
- Code quality: complexity limits, TypeScript strictness, dead code
- Doc drift: does CLAUDE.md accurately describe the Showcase app?

### Not in This Set

- Changes to the Showcase app (audit only — inspect, don't build)
- Families or Admin app review
- Shared component internals (only their Showcase representation)

## Acceptance Criteria

- [ ] Quality gauntlet run with all 7 checks documented
- [ ] All 12 Showcase components inspected for convention compliance
- [ ] Test coverage gaps identified with specific files listed
- [ ] Findings categorized by severity (high/medium/low)
- [ ] Inspection report filed using standard template

## References

- Related Permit: 2026-03-24-dialog-toast-showcase (recent Showcase work)

## Notes from the Issuer

The CEO requested this directly. The Showcase app is the showroom floor — the thing clients see first. If we have untested components, convention violations, or stale demos, that's a credibility problem. Inspector should be thorough.

---

**Status:** Complete
**Inspection Report:** `.claude/records/inspections/2026-03-24-showcase-app.md`
