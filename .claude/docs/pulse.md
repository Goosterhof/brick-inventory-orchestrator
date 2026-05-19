# Brickworks Pulse — _Where Things Stand_

A consolidated, current-state assessment of both wings. Updated by The Steward at end-of-session. Not chronological — this is the **living snapshot** the Brickwright reads before touching code.

**Rules:**

- Each section carries an `Assessed:` date — update it when you re-evaluate that section
- Sections not revisited keep their old date, making staleness visible
- Overwrite sections with current state — don't append history
- Keep entries factual and concise — one line per item
- **Do not hardcode counts that are available from canonical sources.** Test counts come from `npm run test:unit` (Gallery) or `composer test` (Foundry). Component counts come from `meta.componentCount` in `src/shared/generated/component-registry.json`. ADR counts come from `.claude/docs/decisions.md`. Domain counts come from the file system. Duplicating these numbers here guarantees drift.

---

## Overall Health

**Gallery Wing Rating:** 9/10
**Foundry Wing Rating:** 8.5/10
**Assessed:** 2026-05-05 (Foundry), 2026-04-11 (Gallery)

**Gallery (frontend):** Strong architectural foundation with full accountability pipeline operational. 100% test coverage enforced. Multi-app structure with strict isolation. Showcase app fully tested. Adapter-store and resource-adapter patterns battle-tested. Page integration test layer established (ADR-0024). Pattern Master agent operational. Router migration to `@script-development/fs-router` complete. Gauntlet fully green. Documentation drift remains the primary recurring concern.

**Foundry (backend):** PHPStan at max with zero errors (Laravel 13.7 deprecation cascade closed via ADR-0027's PHP 8.5 tightening), Deptrac with zero violations, full architecture tests passing, 13 coherent BIO sovereign ADRs (now consolidated into 0001–0029 by Phase 5). Recent deliveries since 2026-04-16: Laravel 13.7 deprecation cleanup + PHP 8.5 tightening, storage-map ResourceData, reverse-lookup-lens endpoint with `DB::listen` query-budget proof, PHPStan war-room rules adoption (four custom rules), ADR-0028 pre-push permit verification gate.

## Active Concerns

**Assessed:** 2026-05-05 (Foundry), 2026-04-11 (Gallery)

### Gallery Wing

| Concern | Severity | Status | Notes |
|---|---|---|---|
| `AboutPage.spec.ts` collect guard breach | Medium | Active | 618ms delta in coverage mode (threshold 400ms). Root cause: AboutPage imports 16 shape components; test mocks all 16 but coverage instrumentation adds overhead. |
| `ComponentGallery.spec.ts` collect guard breach | Medium | Monitoring | 808ms execution time — persists across 5 inspections. Root cause: `mount` (not `shallowMount`) importing all shared components. |
| `Item` type constraint mismatch | Low | Aware | `FamilySet` has `id` but no `createdAt`/`updatedAt` — may surface in future domains |
| `format:check` failures on `.claude/` md | Low | Known | oxfmt reformats markdown — agent docs and journal files drift; not a code defect |

### Foundry Wing

| Concern | Severity | Status | Notes |
|---|---|---|---|
| `php8.5-pcov` not installed on dev host | Medium | Open — sudo-gated | One-line `sudo apt install php8.5-pcov` (deb.sury.org PPA). Dockerfile already commits the install for the Docker path. Until installed, `composer test:coverage` / `mutation` / `test:feature-coverage` bail on canonical PHP 8.5. |
| `covers()` mismatch in `CorsConfigTest` blocking feature-coverage | Low | Open — depends on `php8.5-pcov` for upstream visibility | `covers(HandleCors::class)` targets a vendor/ class outside `phpunit.feature-coverage.xml`'s `<source>`. Driver bail fires first today; surfaces as next blocker once driver lands. |
| Deferred mutation drill from 2026-04-19 L13 upgrade | Low | Open — depends on `php8.5-pcov` install | The L13 upgrade journal deferred mutation across three timed-out shifts. PHPStan-green precondition is now satisfied (ADR-0027); only the driver install remains. |
| Dockerfile build verification (`docker compose build backend`) | Low | Open — environmental | The 2026-04-29 PCOV install + PHP 8.5 alignment shifts both modified `docker/backend.Dockerfile`. Diff committed-ready; verification blocked in dev shell (no Docker daemon). |

## In-Progress Work

**Assessed:** 2026-05-19 (Atrium-level, merger execution)

| Work Item | Status | Next Step |
|---|---|---|
| Brickworks merger (umbrella) | In Progress | Phases 0–6 completed; Phase 7 (wing shrink) and Phase 8 (closing Build Record + war-room follow-up) remain |

## Pattern Maturity

**Assessed:** 2026-05-05 (Foundry), 2026-03-29 (Gallery)

### Gallery Wing

| Pattern | Maturity | Evidence |
|---|---|---|
| Multi-app architecture (`@shared/` + `@app/`) | Battle-tested | 3 apps, architecture tests enforce boundaries |
| RouterService wrapper | Battle-tested | All routed apps use it, type-safe route names proven |
| Factory services (no singletons) | Battle-tested | Shared service factories, arch test enforces |
| Domain isolation (lint + arch tests) | Battle-tested | 4-layer enforcement, 0 violations |
| Case conversion at HTTP boundary (ADR-0029) | Battle-tested | All API communication flows through middleware |
| Resource adapter (frozen + mutable) | Battle-tested | Sets domain: all 4 CRUD pages consume |
| Adapter-store module | Battle-tested | Sets domain: getAll, getOrFailById, generateNew, retrieveAll in production use |
| Brick Brutalism design system | Battle-tested | Showcase app fully tested, brand guide |
| Page integration tests (ADR-0024) | Battle-tested | Separate vitest config, all domain pages covered |
| Mutation testing (Stryker) | Configured | Dry-run confirmed, 80% break threshold set; not yet run in anger |
| Form submit loading guard | Battle-tested | `useFormSubmit` returns `submitting` ref, prevents double-submission |

### Foundry Wing

| Pattern | Maturity | Evidence |
|---|---|---|
| Action layer | Battle-tested | Architecture tests guard it; all pass. Three approved try-catch exceptions documented in ADR-0015 (formerly BE-0003): partial-failure, UniqueConstraintViolationException upsert, race-condition guard. Custom PHPStan rules (`forbidDatabaseManager.inAction`, `forbidStaticCallToFacade.inAction`, `requireExplicitTransactionContract`) adopted 2026-05-01 with 0 findings. |
| Service layer (2 classes) | Battle-tested | Contract interfaces, Deptrac boundaries hold, no facade or model leakage |
| ResourceData pattern | Battle-tested | All have `from()` factories, EAGER_LOAD where needed. ComputedResourceData (ADR-0025) handles DTO-sourced responses |
| Explicit cascade deletion (ADR-0016) | Battle-tested | MigrationArchitectureTest + CascadeRelationArchitectureTest confirm compliance |
| Thin controllers (ADR-0021) | Battle-tested | No constructors, no try-catch, method injection only |
| Job layer (1 class) | Established | JobArchitectureTest guards conventions; thin wrapper pattern documented in `backend/CLAUDE.md` |
| Bulk aggregation endpoints (3 endpoints) | Battle-tested | `/family-sets/completion`, `/family-sets/missing-parts`, reverse-lookup-lens. Query budgets proven via `DB::listen` runtime tests |
| Operations Protocol enforcement (ADR-0028) | Established | CaptainHook pre-push verification gate; threshold-gated permit lookup, fail not prompt |

### Atrium

| Pattern | Maturity | Evidence |
|---|---|---|
| Accountability pipeline (Work Order → Build Record → Audit) | Battle-tested | 200+ records filed across both wings before the merger; pipeline survived four Brickworks-merger phases without disruption |

## Tech Debt

**Assessed:** 2026-03-31 (Foundry), 2026-03-25 (Gallery)

### Gallery Wing

| Item | Severity | Notes |
|---|---|---|
| SetDetailPage ancillary HTTP calls outside adapter | Low | `loadParts` + `loadStorageMap` are read-only projections, not CRUD — correctly direct |
| Button/nav components lack keyboard tests | Low | Noted in learnings — add when touching next |
| Oxlint JS plugins not yet available for custom Vue checks | Low | Monitoring oxc milestone 3 — will replace `lint-vue-conventions.mjs` |

### Foundry Wing

| Item | Severity | Notes |
|---|---|---|
| `GetFamilyPartsAction` returns raw array (no ResourceData) | Low | Only endpoint bypassing the pattern without documentation |
| `RegisterUserData::familyName` empty-string on invite-code path | Low | Now nullable — passes null when family_name absent |

## Seeds

**Assessed:** 2026-03-25 (both wings combined)

Ideas planted but deferred — revisit when the trigger condition is met. Seeds are not tech debt (known problems) or active concerns (things needing attention now). They're **future improvements** that aren't worth the cost today but will be when the codebase grows.

| Seed | Trigger | What It Means |
|---|---|---|
| Territory briefing for Brickwright | When 3+ Gallery domains use adapter-store (currently 1: sets) | Consolidated intel doc so the Brickwright doesn't read 5 docs before starting |
| Third agent type (domain specialist) | When Gallery domain count exceeds 10, or when cross-domain patterns need dedicated attention | A domain-scoped agent that understands one vertical slice deeply |
| Inspector memory file (now Quality Warden memory) | Crossed — Quality Warden Casebook is operational | Persistent assessment file replaced by the Casebook |
| Coverage infrastructure (Foundry) | Install pcov or xdebug | Unblocks coverage measurement, mutation testing, full quality metrics — see Active Concerns |

## Quality Metrics

**Assessed:** 2026-05-05 (Foundry), 2026-03-29 (Gallery)

### Gallery Wing

| Metric | Value | Source |
|---|---|---|
| Test coverage (lines) | 100% | `npm run test:coverage` |
| Test coverage (branches) | 100% | `npm run test:coverage` |
| Test count | _run `npm run test:unit` for current count_ | gauntlet output |
| Shared components | _see `meta.componentCount`_ | `src/shared/generated/component-registry.json` |
| Domains (Families) | _list `src/apps/families/domains/`_ | file system |
| knip violations | 0 | `npm run knip` |

### Foundry Wing

| Metric | Value | Threshold |
|---|---|---|
| Unit coverage | 100.0% (last measured 2026-04-29) — currently unable to re-measure on canonical 8.5 (sudo-gated `php8.5-pcov` install) | 100% |
| Feature coverage | Unable to measure (`covers()` mismatch + `php8.5-pcov` not installed) | 90% |
| Mutation score | 76.97% (last measured 2026-04-29) — currently unable to re-measure on canonical 8.5 | 76% |
| Architecture tests | 105 passing (last full run on Phase 5 verification) | All passing |
| PHPStan | Level max, **0 errors** | Level max, zero errors |
| Deptrac | 0 violations | Zero violations |

### Atrium

| Metric | Value | Source |
|---|---|---|
| ADRs documented | 29 (0001–0029, consolidated) | `.claude/docs/decisions.md` |
| Work Orders / Build Records / Audits | _count `.claude/records/{work-orders,build-records,audits}/`_ | file system |
