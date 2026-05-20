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

**Gallery Wing Rating:** 8/10
**Foundry Wing Rating:** 8.5/10
**Assessed:** 2026-05-05 (Foundry), 2026-05-20 (Gallery)

**Gallery (frontend):** Strong architectural foundation with 100% unit test coverage maintained. Multi-app structure with strict isolation. Showcase app fully tested. Adapter-store and resource-adapter patterns battle-tested. Page integration test layer established (ADR-0024) but currently has 5 unrepaired assertion failures and no CI gate (Permits A and B open). Router migration to `@script-development/fs-router` complete. Pattern Master agent operational; first creative dispatch since 2026-04-17 landed 2026-05-20 with three proposals — CEO picked Proposal C (Brick-DNA Snap-and-Pull) for next build. Unit gauntlet fully green. New collect guard violation in `PartsPage.spec.ts` (1713ms delta) emerged this cycle. Documentation drift previously the primary recurring concern; addressed by Pulse-refresh audit 2026-05-20 ([`2026-05-20-gallery-pulse-refresh`](../records/audits/2026-05-20-gallery-pulse-refresh.md)).

**Foundry (backend):** PHPStan at max with zero errors (Laravel 13.7 deprecation cascade closed via ADR-0027's PHP 8.5 tightening), Deptrac with zero violations, full architecture tests passing, governed by the consolidated `0001`–`0029` Brickworks ADR sequence. Recent deliveries since 2026-04-16: Laravel 13.7 deprecation cleanup + PHP 8.5 tightening, storage-map ResourceData, reverse-lookup-lens endpoint with `DB::listen` query-budget proof, PHPStan war-room rules adoption (four custom rules), ADR-0028 pre-push permit verification gate.

## Active Concerns

**Assessed:** 2026-05-05 (Foundry), 2026-05-20 (Gallery)

### Gallery Wing

| Concern | Severity | Status | Notes |
|---|---|---|---|
| `PartsPage.spec.ts` collect guard VIOLATION | Medium | New | 1713ms delta (threshold 1000ms in 2x coverage mode). Emerged since 2026-05-09 (was 679ms delta — warning zone). Root cause: heavy import chain (7 components at top-level). ADR-0012 breach. Surfaced by [`2026-05-20-gallery-pulse-refresh`](../records/audits/2026-05-20-gallery-pulse-refresh.md). |
| `SetsOverviewPage.spec.ts` TEST GUARD alarming | Medium | Monitoring | 2397ms execution (30 tests). 2.1× jump from 1143ms on 2026-05-09. xNOYG `in_storage` merge added 6 tests. Trend: 855ms → 1056ms → 1143ms → 2397ms. Casebook recommends split into `SetsOverviewPage.spec.ts` + `SetsOverviewFiltering.spec.ts`. |
| `ComponentGallery.spec.ts` TEST GUARD | Medium | Monitoring | 1050ms execution (worsened from 933ms on 2026-04-25). Collect delta 439ms (warning, not violation). Root cause: `mount` (not `shallowMount`) importing all shared components. Persists across 6+ inspections. |
| Integration suite: 5 failing tests (Permits A + B open) | Medium | Active | 4 spec files, 5 failing tests on main. Permit A (assertion fixes) and Permit B (CI wiring) both Open as of 2026-05-20 — 15 days unresolved. Root causes: hardcoded-copy drift + `AddSetPage` structural drift (expects 5 statuses, code has 6 after xNOYG `in_storage` merge). |
| `AboutPage.spec.ts` collect guard warning | Low | Monitoring | 520ms delta in 2x mode (threshold 1000ms). Improved from 1522ms on 2026-04-25 (Node 24 environment difference). Root cause unchanged: 16 named Lego shape component imports. |
| `Item` type constraint mismatch | Low | Aware | `FamilySet` has `id` but no `createdAt`/`updatedAt` — may surface in future domains |
| `format:check` failures on `.claude/` md | Low | Known | oxfmt reformats markdown — agent docs and journal files drift; not a code defect |

### Foundry Wing

| Concern | Severity | Status | Notes |
|---|---|---|---|
| Dockerfile build verification (`docker compose build backend`) | Low | Open — environmental | The 2026-04-29 PCOV install + PHP 8.5 alignment shifts both modified `docker/backend.Dockerfile`. Diff committed-ready; verification blocked in dev shell (no Docker daemon). |

_Closed 2026-05-20 during first-standup verification (CEO triggered `/standup`, Pulse refresh acted on findings):_

- ~~`php8.5-pcov` not installed on dev host~~ — **Closed 2026-05-20.** Standup-triggered `php -m` check confirmed `pcov` module loaded on canonical PHP 8.5.5 dev host. CEO had installed it on a workstation; Pulse concern was 21+ days stale-on-paper. Casebook Methodology Note candidate: *post-environmental-install, re-verify on next standup and close immediately.*
- ~~`covers()` mismatch in `CorsConfigTest` blocking feature-coverage~~ — **Cascade-closed 2026-05-20** (driver-install precondition satisfied). Next feature-coverage run will surface this as a standalone issue if it persists; will refile as standalone if so.
- ~~Deferred mutation drill from 2026-04-19 L13 upgrade~~ — **Cascade-closed 2026-05-20** (driver-install precondition satisfied). Mutation drill can now run on canonical 8.5; if it surfaces fresh issues, refile as a new Concern with current evidence.

### Atrium

| Concern | Severity | Status | Notes |
|---|---|---|---|
| **Work Order paper-trail drift — Status field not updated post-shipping** | Medium | Open — discovered at first standup | First `/standup` run (2026-05-20) surfaced 29 WOs marked Open/In-Progress; triage matrix found **24 of them already have matching Build Records filed** (work shipped, Status field never closed). The real outstanding backlog is ~5 WOs, not 29. Pattern: at delivery time, the Brickwright files the Build Record but the WO file itself doesn't get its `**Status:** Open` line flipped to `**Status:** Completed` with a back-link to the Build Record. The Casebook flagged a related pattern (`Persistent low-severity open items`, 2026-04-25) but not the full scale until the Standup forced a roll-call. Remediation: a sweep WO to close the 24 already-shipped WOs (mechanical), plus a Brickwright training proposal candidate: *when filing a Build Record, also edit the corresponding WO's Status field and Build Record link in the same commit.* Closes when (a) the sweep ships, and (b) two subsequent Build Records close their parent WO in the same commit without prompting. |
| No SOP for doc-sweep step after framework version upgrades | Low | Open — preventative | The Laravel 13 upgrade shipped 2026-04-19; four governance docs still claimed "Laravel 12" thirty-one days later, surfaced by [`2026-05-20-post-merger-baseline`](../records/audits/2026-05-20-post-merger-baseline.md) Finding 2. SOP shape: framework upgrade Build Records should include an acceptance criterion of the form `rg -n "<old-framework-name> <old-version>" backend/CLAUDE.md CLAUDE.md .claude/docs/ .claude/agents/` returning no hits in active (non-historical) docs. The 2026-05-20 laravel-13-doc-sweep WO carried this AC, but as same-day remediation rather than as an unprompted next-upgrade pattern. Closes out when either (a) the next framework upgrade Build Record carries this AC unprompted, or (b) the convention is codified into the Build Record template at `.claude/records/build-records/.build-record-template.md`. |
| ADR-0028 push-gate dual-mode behavior pending amendment | Low | Open — preventative | Both PR #77 and PR #78 reviewers independently flagged that the "WO stays In Progress through push" rule is currently size-dependent: under the 500-line / 20-file threshold the gate skips permit lookup (WO can be closed in the work commit); at/above threshold the gate requires Open or In Progress (closing in the work commit causes push rejection). Doctrine is documented nowhere. Work Order [`2026-05-20-adr-0028-dual-mode-amendment`](../records/work-orders/2026-05-20-adr-0028-dual-mode-amendment.md) filed to stress-test the dual-mode question via `adr-interrogator` and amend ADR-0028 with the decided rule. Closes when the amendment lands. |

## In-Progress Work

**Assessed:** 2026-05-19 (Atrium-level, post-merger residue cleanup)

_None in progress._ The Brickworks merger closed 2026-05-19 — see the closing Build Record at [`.claude/records/build-records/2026-05-19-form-the-brickworks.md`](../records/build-records/2026-05-19-form-the-brickworks.md) for the canonical record of the eight-phase consolidation. Post-merger war-room follow-up (Adjutant M4 + Cartographer M11 refresh + Engineer/Armorer/Engineer dispatches PR #72/#73/#74) completed 2026-05-19.

## Pattern Maturity

**Assessed:** 2026-05-05 (Foundry), 2026-05-20 (Gallery)

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
| Page integration tests (ADR-0024) | Established | Layer exists with 19 test files covering all domain pages. 5 failing assertions on main (Permit A Open). No CI gate (Permit B Open, blocked by A). Cannot be rated Battle-tested until both permits ship and CI confirms green. Surfaced by [`2026-05-20-gallery-pulse-refresh`](../records/audits/2026-05-20-gallery-pulse-refresh.md). |
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

**Assessed:** 2026-03-31 (Foundry), 2026-05-20 (Gallery)

### Gallery Wing

| Item | Severity | Notes |
|---|---|---|
| SetDetailPage ancillary HTTP calls outside adapter | Low | `loadParts` + `loadStorageMap` (storage map ref) are read-only projections, not CRUD — correctly direct. Both named explicitly. |
| Button/nav components lack keyboard tests | Low | Noted in learnings — add when touching next |
| Oxlint JS plugins not yet available for custom Vue checks | Low | Monitoring oxc milestone 3 — will replace `lint-vue-conventions.mjs` |
| `prevCursor` field in part types unused by UI | Low | API returns prevCursor but pagination is forward-only; retained for type accuracy. Third inspection cycle unresolved as of 2026-05-20 (escalated from Casebook Recurring Patterns). |
| Domain pages excluded from unit-coverage 100% gate | Low | `src/apps/**/domains/**` excluded from thresholds — catch-branch gaps require manual inspection or integration-test coverage. No automated detection. Surfaced by [`2026-05-20-gallery-pulse-refresh`](../records/audits/2026-05-20-gallery-pulse-refresh.md). |

### Foundry Wing

| Item | Severity | Notes |
|---|---|---|
| `GetFamilyPartsAction` returns raw array (no ResourceData) | Low | Only endpoint bypassing the pattern without documentation |
| `RegisterUserData::familyName` empty-string on invite-code path | Low | Now nullable — passes null when family_name absent |

## Seeds

**Assessed:** 2026-05-20 (governance seeds added post-merger)

Ideas planted but deferred — revisit when the trigger condition is met. Seeds are not tech debt (known problems) or active concerns (things needing attention now). They're **future improvements** that aren't worth the cost today but will be when the codebase grows.

| Seed | Trigger | What It Means |
|---|---|---|
| Territory briefing for Brickwright | When 3+ Gallery domains use adapter-store (currently 1: sets) | Consolidated intel doc so the Brickwright doesn't read 5 docs before starting |
| Third agent type (domain specialist) | When Gallery domain count exceeds 10, or when cross-domain patterns need dedicated attention | A domain-scoped agent that understands one vertical slice deeply |
| Inspector memory file (now Quality Warden memory) | Crossed — Quality Warden Casebook is operational | Persistent assessment file replaced by the Casebook |
| Coverage infrastructure (Foundry) | Install pcov or xdebug | Unblocks coverage measurement, mutation testing, full quality metrics — see Active Concerns |
| **Tension Doctrine document** (`.claude/docs/tension-doctrine.md`) | After the `/standup` ritual has run 3+ times, or when a Rebuttal/Counter-Filing/Friction case escalates to the CEO | Consolidate the three existing protocols (Rebuttal, Counter-Filing, Friction) into one philosophy document. Today they're scattered across three agent files. A single doctrine doc makes the firm's "productive tension" philosophy showcase-visible and gives the Steward a single reference for arbitration decisions. |
| **Agent Teams trial for PR Review** | Next non-trivial PR review, or first cross-cutting refactor touching ≥3 domains/wings | Pilot Claude Code's experimental Agent Teams feature (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, v2.1.32+) with three teammates: security lens, performance lens, test-coverage lens. Measure: did parallel review catch what solo review would have missed? Cost: ~3-4× tokens; only worth it for non-trivial work. |
| **Retrospective ritual** | After the next major delivery (next framework upgrade, next merger-scale event, or first delivery that completes ≥5 Work Orders bundled) | Add `.claude/records/retrospectives/YYYY-MM-DD-{slug}.md` as a third paper-trail artifact alongside Work Orders, Build Records, and Audits. Format: goal / what got done / what surprised us / what would we do differently / what graduates. Not a Build Record (which is per-WO). Not an Audit (which is read-only). A Retrospective is reflection. The merger itself closed without one. |
| **Foundry creative counterpart** | When a real-time dashboard, performance-tuning sprint, or other Foundry-creative work surfaces a concrete need — NOT for showcase symmetry alone | The Gallery has a Pattern Master (ADR-0026). The Foundry has no equivalent specialist. Candidates: Data Architect, Performance Engineer, Query Optimizer. Held back deliberately — adding specialists prophylactically dilutes the crew. Wait for a real trigger. |
| **Brickwright graduation log unification** | When 3+ Foundry learnings echo independently in Gallery (or vice versa) within a 90-day window | Today the Brickwright carries two split graduation logs (`brickwright-foundry-graduation.md`, `brickwright-gallery-graduation.md`). The split preserved provenance during the merger. Evaluate whether wing-split still earns its separation once cross-wing echoes accumulate. Risk of premature unification: relevance dilution. Held back. |
| **Audit peer-review pass** | Any Audit that surfaces fewer findings than scope expected, OR after any post-merger-style event | Introduce a step where the Brickwright reviews the Warden's draft Audit before it's filed. Catches sampling gaps like the missed `brickwright.md` doc-drift in [`2026-05-20-post-merger-baseline`](../records/audits/2026-05-20-post-merger-baseline.md) (found later by the AC `rg` sweep in [`2026-05-20-laravel-13-doc-sweep`](../records/build-records/2026-05-20-laravel-13-doc-sweep.md) — Decisions #2). Trade-off: adds latency and dilutes the Warden's independence. Defer until a second confirming gap surfaces. |
| **ADR: soft enforcement vs. path-sandboxed agent scope** | Within 60 days OR when the second agent gets its tool scope expanded beyond Read-only | The PR #83 lab review surfaced the deeper question: the firm currently uses **written-prose binding boundaries** to constrain agent write authority (Warden's "Write Scope" table, Steward's "Write Scope — Firm-Wide, Brake by Doctrine Only" section). This is honor-system enforcement, not sandboxed. A future `PreToolUse` hook could reject writes from `quality-warden` (and any future agent) to non-allowlisted paths at the runtime layer. The question for an ADR: is doctrine-only enforcement the canonical Brickworks pattern (and the firm accepts the honor-system risk because every write lands in `git log`), or is it a transitional state pending path-level infrastructure? Route via `/adr-interrogator`; the answer shapes how every future agent gets scoped. Filed from PR #83 war-room + lab reviews. |
| **Agent Teams trial — expiration check** | 2026-07-20 (60 days from seed filing 2026-05-20) | The Agent Teams trial Seed has an open trigger ("next non-trivial PR review, or first cross-cutting refactor"). Lab review on PR #83 flagged that indefinite seeds become the next staleness vector. If no trial has been initiated by 2026-07-20, the next standup must decide explicitly: re-defer with refreshed trigger, or drop with reason. This expiration check graduates the Seed pattern from "trigger-only" to "trigger + expiration." |

## Quality Metrics

**Assessed:** 2026-05-05 (Foundry), 2026-05-20 (Gallery)

### Gallery Wing

_Coverage figures below reflect the unit test gauntlet only. Integration tests (`npm run test:integration:run`) are not included in these thresholds — see Active Concerns for integration suite status (Permits A and B Open as of 2026-05-20)._

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
