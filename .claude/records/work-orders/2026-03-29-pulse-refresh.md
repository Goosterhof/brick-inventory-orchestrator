# Building Permit: Pulse Refresh & Structural Guards

**Permit #:** 2026-03-29-pulse-refresh
**Filed:** 2026-03-29
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** Urgent

---

## The Job

The Pulse is 4 days stale and has been flagged in 4 consecutive inspections. The domain map is missing an entire domain. Both are symptoms of the same root cause: these documents drift because nothing enforces them. This permit does two things: bring the docs current, and add structural guards so they can't drift again.

## Scope

### In the Box

**Part 1 — The Refresh (immediate fix)**

- Full Pulse refresh of qualitative sections:
    - Update Pattern Maturity: add page integration tests (ADR-013), mutation testing (Stryker), form submit loading guard
    - Update Active Concerns: add SettingsPage.spec.ts collect guard breach, update ComponentGallery entry (persists 4 inspections)
    - Clear any stale In-Progress Work entries
    - Re-assess Overall Health rating
    - Update assessed date to 2026-03-29
- Remove hardcoded numeric counts from the Pulse (test count, test files, component count, ADR count, domain count) — these are already verifiable from gauntlet output and `component-registry.json`. Numbers that exist in two places will always drift. Replace with pointers to the canonical sources (e.g., "see `meta.componentCount` in registry", "run `npm run test:unit` for current count").
- Add `brick-dna` domain to domain map: table entry + domain details section (pages, routes, auth, API endpoints)
- Remove any hardcoded numeric counts from domain map that duplicate the registry (component counts)

**Part 2 — The Guard (prevention)**

- Add architecture test: every directory under `src/apps/*/domains/` must have a corresponding entry in `domain-map.md`. Follow the existing architecture test patterns in `architecture.spec.ts`. This makes a missing domain map entry fail the gauntlet — impossible to skip.

### Not in This Set

- Fixing code findings (Vue Router deprecation, ADR-004 drift, etc.) — that's the cleanup permit (`2026-03-29-inspection-cleanup`)
- Pulse automation scripts — we are not building a second counting system alongside the component registry. The fix is to stop duplicating numbers, not to automate the duplication.
- Rewriting the Pulse format beyond removing duplicate metrics

## Acceptance Criteria

- [ ] Pulse qualitative sections are current (Pattern Maturity, Active Concerns, Overall Health)
- [ ] Pulse contains no hardcoded numeric counts that duplicate gauntlet output or the registry
- [ ] Pulse assessed date is 2026-03-29
- [ ] Domain map lists 8 Families domains (brick-dna added with full details)
- [ ] Domain map contains no hardcoded counts that duplicate the registry
- [ ] Architecture test enforces: every domain directory has a domain map entry
- [ ] Architecture test fails when a domain directory exists without a domain map entry
- [ ] All quality gates pass

## References

- Inspection: `.claude/records/inspections/2026-03-29-post-delivery-audit.md` (Findings 5, 6)
- Casebook: Pulse quality metrics staleness — recurring pattern (4 occurrences)
- Current Pulse: `.claude/docs/pulse.md`
- Current Domain Map: `.claude/docs/domain-map.md`
- Existing pattern: `component-registry.json` already provides component count as canonical source
- Architecture tests: `src/tests/unit/architecture.spec.ts`

## Notes from the Issuer

The principle here is simple: **numbers should exist in one place.** The component registry already counts components. The gauntlet already counts tests. The file system already counts domains. The Pulse was duplicating all of these, poorly, and falling behind every time. Stop duplicating; start pointing.

The domain map architecture test follows the same philosophy — the file system is the source of truth for what domains exist. The architecture test enforces that the domain map stays in sync. No manual discipline required, no scripts to remember to run.

The brick-dna domain map entry is bundled here because it's the same class of work (documentation catching up to reality) and will be required for the architecture test to pass.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-03-29-pulse-refresh.md`
