# Territory Pulse — _Where Things Stand_

A consolidated, current-state assessment of the frontend codebase. Updated by the CFO at end-of-session. Not chronological — this is the **living snapshot** the architect reads before touching code.

**Rules:**

- Each section carries an `Assessed:` date — update it when you re-evaluate that section
- Sections not revisited keep their old date, making staleness visible
- Overwrite sections with current state — don't append history
- Keep entries factual and concise — one line per item
- **Do not hardcode counts that are available from canonical sources.** Test counts come from `npm run test:unit`. Component counts come from `meta.componentCount` in `src/shared/generated/component-registry.json`. ADR counts come from `.claude/docs/decisions.md`. Domain counts come from the file system (`src/apps/*/domains/`). Duplicating these numbers here guarantees drift.

---

## Overall Health

**Rating:** 9/10
**Assessed:** 2026-04-11

Strong architectural foundation with full accountability pipeline operational. 100% test coverage enforced. Multi-app structure with strict isolation. Showcase app fully tested with dedicated demo components for form validation, resource adapters, middleware pipelines, and page transitions. Adapter-store and resource-adapter patterns battle-tested — sets domain consumes all CRUD operations. Page integration test layer established (ADR-013) with coverage across all domain pages. Creative Engine agent (ADR-015) operational — three deliveries completed (page transitions, refactor, defineExpose cleanup). Router migration to `@script-development/fs-router` complete — BioRouterService wrapper deleted, thin app-level wrappers remain. LEGO shape component library added (7 HTML + 7 SVG). Gauntlet fully green. Documentation drift remains the primary recurring concern.

## Active Concerns

**Assessed:** 2026-04-11

| Concern                                         | Severity | Status     | Notes                                                                                                                                                            |
| ----------------------------------------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AboutPage.spec.ts` collect guard breach        | Medium   | Active     | 618ms delta in coverage mode (threshold 400ms). Root cause: AboutPage imports 16 shape components; test mocks all 16 but coverage instrumentation adds overhead. |
| `ComponentGallery.spec.ts` collect guard breach | Medium   | Monitoring | 808ms execution time — persists across 5 inspections. Root cause: `mount` (not `shallowMount`) importing all shared components.                                  |
| `Item` type constraint mismatch                 | Low      | Aware      | `FamilySet` has `id` but no `createdAt`/`updatedAt` — may surface in future domains                                                                              |
| `format:check` failures on `.claude/` md        | Low      | Known      | oxfmt reformats markdown — agent docs and journal files drift; not a code defect                                                                                 |

## In-Progress Work

**Assessed:** 2026-03-29

| Work Item | Status | Next Step |
| --------- | ------ | --------- |
| (none)    |        |           |

## Pattern Maturity

**Assessed:** 2026-03-29

| Pattern                                       | Maturity      | Evidence                                                                       |
| --------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| Multi-app architecture (`@shared/` + `@app/`) | Battle-tested | 3 apps, architecture tests enforce boundaries                                  |
| RouterService wrapper                         | Battle-tested | All routed apps use it, type-safe route names proven                           |
| Factory services (no singletons)              | Battle-tested | Shared service factories, arch test enforces                                   |
| Domain isolation (lint + arch tests)          | Battle-tested | 4-layer enforcement, 0 violations                                              |
| Case conversion at HTTP boundary              | Battle-tested | All API communication flows through it                                         |
| Resource adapter (frozen + mutable)           | Battle-tested | Sets domain: all 4 CRUD pages consume (create, patch, delete, list)            |
| Adapter-store module                          | Battle-tested | Sets domain: getAll, getOrFailById, generateNew, retrieveAll in production use |
| Brick Brutalism design system                 | Battle-tested | Showcase app fully tested, brand guide; see registry for component count       |
| Accountability pipeline                       | Battle-tested | Permits, journals, inspection reports filed across multiple sessions           |
| Page integration tests (ADR-013)              | Battle-tested | Separate vitest config, all domain pages covered                               |
| Mutation testing (Stryker)                    | Configured    | Dry-run confirmed, 80% break threshold set; not yet run in anger               |
| Form submit loading guard                     | Battle-tested | `useFormSubmit` returns `submitting` ref, prevents double-submission           |

## Tech Debt

**Assessed:** 2026-03-25

| Item                                                      | Severity | Notes                                                                                 |
| --------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| SetDetailPage ancillary HTTP calls outside adapter        | Low      | `loadParts` + `loadStorageMap` are read-only projections, not CRUD — correctly direct |
| Button/nav components lack keyboard tests                 | Low      | Noted in learnings — add when touching next                                           |
| Oxlint JS plugins not yet available for custom Vue checks | Low      | Monitoring oxc milestone 3 — will replace `lint-vue-conventions.mjs`                  |

## Seeds

**Assessed:** 2026-03-25

Ideas planted but deferred — revisit when the trigger condition is met. Seeds are not tech debt (known problems) or active concerns (things needing attention now). They're **future improvements** that aren't worth the cost today but will be when the codebase grows.

| Seed                                 | Trigger                                                                              | What It Means                                                                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Territory briefing for architect     | When 3+ domains use adapter-store (currently 1: sets)                                | Consolidated intel doc so the architect doesn't read 5 docs before starting. The pulse partially fills this role, but a briefing would include directory structure, key conventions, and known deviations in one place |
| Third agent type (domain specialist) | When domain count exceeds 10, or when cross-domain patterns need dedicated attention | A domain-scoped agent that understands one vertical slice deeply. Currently unnecessary — domains are manageable for a generalist architect                                                                            |
| Inspector memory file                | After 3+ inspector missions (currently at 2)                                         | Persistent assessment file (like spy memory) so the inspector tracks quality trends across missions instead of starting fresh each time. Trigger approaching — one more mission.                                       |

## Quality Metrics

**Assessed:** 2026-03-29

| Metric                   | Value                                       | Source                                         |
| ------------------------ | ------------------------------------------- | ---------------------------------------------- |
| Test coverage (lines)    | 100%                                        | `npm run test:coverage`                        |
| Test coverage (branches) | 100%                                        | `npm run test:coverage`                        |
| Test count               | _run `npm run test:unit` for current count_ | gauntlet output                                |
| Test files               | _run `npm run test:unit` for current count_ | gauntlet output                                |
| Shared components        | _see `meta.componentCount`_                 | `src/shared/generated/component-registry.json` |
| ADRs documented          | _see decision log index_                    | `.claude/docs/decisions.md`                    |
| Domains (Families)       | _list `src/apps/families/domains/`_         | file system                                    |
| knip violations          | 0                                           | `npm run knip`                                 |
