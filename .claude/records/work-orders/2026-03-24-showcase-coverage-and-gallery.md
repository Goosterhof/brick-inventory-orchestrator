# Building Permit: Showcase Coverage & Gallery Completion

**Permit #:** 2026-03-24-showcase-coverage-and-gallery
**Filed:** 2026-03-24
**Issued By:** CFO (on CEO directive)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Close the coverage and gallery gaps in the Showcase app identified by inspection report `2026-03-24-showcase-app`. Add tests for all 10 untested showcase components, remove the coverage exclusion, add the 6 missing shared components to the gallery, and fix the doc/format drift.

## Scope

### In the Box

- **Finding 1 — Coverage exclusion:** Remove `src/apps/showcase/**` from the `vitest.config.ts` coverage exclude array. All showcase components must be covered by the 100% threshold like everything else.
- **Finding 2 — 10 untested components:** Write tests for all 10 untested showcase components. Priority order per inspector:
    - High: ComponentHealth, ComponentGallery, SnapDemo
    - Medium: ColorPalette, BrickDimensions, ShowcaseHero
    - Low: SectionHeading, AntiPatterns, BrandVoice, TypographySpecimen
- **Finding 6 — Gallery gaps:** Add demo sections in ComponentGallery for: BarcodeScanner, CameraCapture, NavHeader, NavLink, NavMobileLink, LegoBrick. Mock hardware/routing dependencies as needed. If any component is genuinely impractical to demo, document the rationale in a code comment.
- **Finding 3 & 4 — Format fixes:** Run `npm run format` to fix `component-registry.json` and `.claude/` markdown files. Verify the pre-commit hook sequence doesn't regenerate the formatting issue.
- **Finding 7, 8, 9 — Doc drift:** Update domain-map.md (component counts: 12 showcase, 31 shared) and pulse.md (same counts, plus add SetsOverviewPage guard as an active concern).

### Not in This Set

- **Finding 5 — SetsOverviewPage test guard:** Out of scope. This is a families domain issue, not a showcase defect. Will be addressed under a separate permit.
- Any new shared components or refactoring of existing ones
- Changes to the showcase App.vue layout or routing
- ADR changes — the coverage exclusion removal doesn't need an ADR, it's restoring compliance with an existing standard

## Acceptance Criteria

- [ ] `vitest.config.ts` no longer excludes `src/apps/showcase/**` from coverage
- [ ] All 12 showcase components have corresponding test specs
- [ ] `npm run test:coverage` passes with 100% on lines, functions, branches, statements (showcase included)
- [ ] ComponentGallery imports and demos all 31 shared components (or documents exclusion rationale)
- [ ] `npm run format:check` passes
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm run knip` passes
- [ ] Domain map and Pulse reflect accurate component counts
- [ ] Full pre-push gauntlet passes (type-check → knip → test:coverage → build)

## References

- Inspection Report: `.claude/records/inspections/2026-03-24-showcase-app.md`
- Audit Permit: `.claude/records/permits/2026-03-24-audit-showcase-app.md`
- ADR-005: Zero ignore comments
- ADR-009: Showcase renders registry data alongside demos
- ADR-010: Test isolation via execution-time guard

## Notes from the Issuer

This is remediation work, not new feature development. The inspector's priority ordering for tests is sound — ComponentHealth, ComponentGallery, and SnapDemo have real logic; the static content components just need render assertions. Don't over-engineer the test specs for display-only components.

For the gallery additions: scanner components should demo in error/placeholder state with mock handlers. Nav components can render statically outside a router context. The goal is visual completeness, not functional demos of hardware-dependent features.

The format fixes are trivial but verify the pre-commit hook doesn't fight the formatter on `component-registry.json` — if the generator and formatter disagree, fix the generator output.

---

**Status:** Complete
**Journal:** _pending_
