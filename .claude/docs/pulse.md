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
**Assessed:** 2026-05-26 (Foundry), 2026-05-25 (Gallery)

**Gallery (frontend):** Strong architectural foundation with 100% unit test coverage maintained. Multi-app structure with strict isolation. Showcase app fully tested. Adapter-store and resource-adapter patterns battle-tested. **Page integration test layer (ADR-0024) promoted Battle-tested 2026-05-25 — 19 specs / 143 tests green on `main`, suite wired as a required gating step in `frontend-ci.yml`; closes the 2026-05-05 integration-test cluster (Permits A + B both shipped in PR #100).** Router migration to `@script-development/fs-router` complete. Pattern Master agent operational; first creative dispatch since 2026-04-17 landed 2026-05-20 with three proposals — CEO picked Proposal C (Brick-DNA Snap-and-Pull) for next build. Unit gauntlet fully green. `PartsPage.spec.ts` collect guard violation (1713ms delta) emerged 2026-05-20 and remains the loudest active medium. Documentation drift previously the primary recurring concern; addressed by Pulse-refresh audit 2026-05-20 ([`2026-05-20-gallery-pulse-refresh`](../records/audits/2026-05-20-gallery-pulse-refresh.md)).

**Foundry (backend):** PHPStan at max with zero errors (339 files), Deptrac with zero violations (743 allowed), 107 architecture tests passing (up from 105). Full quality gauntlet operational on canonical PHP 8.5.5 host with `php8.5-pcov` — coverage and mutation drills unblocked as of 2026-05-20; first full re-measure landed 2026-05-26 with 100% unit / 98.1% feature coverage and 79.68% mutation score (above all thresholds). Governed by the consolidated `0001`–`0029` Brickworks ADR sequence. Recent deliveries since 2026-04-16: Laravel 13.7 deprecation cleanup + PHP 8.5 tightening, storage-map ResourceData, reverse-lookup-lens endpoint with `DB::listen` query-budget proof, PHPStan war-room rules adoption (four custom rules), ADR-0028 pre-push permit verification gate, `ImportJob` model + `ImportOwnedSetsJob` (Rebrickable import flow — Job layer now 2 classes, both convention-compliant).

## Active Concerns

**Assessed:** 2026-05-27 (Gallery), 2026-05-26 (Foundry)

### Gallery Wing

| Concern | Severity | Status | Notes |
|---|---|---|---|
| `AboutPage.spec.ts` collect guard warning | Low | Monitoring | 520ms delta in 2x mode (threshold 1000ms). Improved from 1522ms on 2026-04-25 (Node 24 environment difference). Root cause unchanged: 16 named Lego shape component imports. |
| `Item` type constraint mismatch | Low | Aware | `FamilySet` has `id` but no `createdAt`/`updatedAt` — may surface in future domains |
| `format:check` failures on `.claude/` md | Low | Known | oxfmt reformats markdown — agent docs and journal files drift; not a code defect |

_Closed 2026-05-27 (parallel-dispatch batch — five-WO burndown):_

- ~~`PartsPage.spec.ts` collect guard VIOLATION~~ — **Closed 2026-05-27.** Baseline had degraded from 1713ms (2026-05-20 measurement) to 3316ms by the time of dispatch. Fix shipped in PR #119 (`71166b3`): stub-by-name (drop 7 top-level component imports; use `findComponent({name})`) + targeted `vi.mock` on `PartUsageModal` to short-circuit the `ModalDialog → @phosphor-icons/vue` traversal. Post-fix collect-delta <400ms, three runs. CEO directed the structural enforcement of this finding via the SUT-only top-level Vue-imports arch test ([`2026-05-27-enforce-sut-only-vue-imports-in-unit-specs`](../records/work-orders/2026-05-27-enforce-sut-only-vue-imports-in-unit-specs.md), in-flight at filing time).
- ~~`SetsOverviewPage.spec.ts` TEST GUARD alarming~~ — **Closed 2026-05-27.** The spec degraded past 4000ms during the parallel-dispatch session (was 2397ms at last audit), triggering the test-guard reporter's throw and blocking the entire suite on `main`. Fix shipped in PR #120 (`9f6b8b4`): split into `SetsOverviewPage.spec.ts` (1260ms / 16 tests) + `SetsOverviewFiltering.spec.ts` (2228ms / 14 tests). Both children clear the 4000ms FAIL threshold; test count preserved (30 → 16+14, 42 expects → 19+23). Honest AC misses recorded in BR: Filtering exceeds the 1500ms target by 728ms (warning-tier, not failure-tier); combined runtime +45% over the monolith vs the ≤10% AC. Primary win — suite unblocking — achieved.
- ~~`ComponentGallery.spec.ts` TEST GUARD~~ — **Closed 2026-05-27.** Fix shipped in PR #121 (`b689da2`): switched `mount` to `shallowMount` with 9 components unstubbed by name via `vi.mock` (ModalDialog, ConfirmDialog, ToastMessage, PrimaryButton, DangerButton, BackButton, FilterChip, SectionHeading, NavHeader — NavHeader added after gauntlet caught a 5% coverage regression). 2960ms → 486–682ms steady state, three consecutive runs under the 800ms WO target. Variance under thread contention can spike ~2400ms — recorded as Partial on the warn-zone-exit AC.

_Closed 2026-05-25:_

- ~~Integration suite: 5 failing tests (Permits A + B open)~~ — **Closed 2026-05-25.** Permit A (assertion repairs — 4 hardcoded-copy fixes + `AddSetPage` 5→6 statuses structural fix) and Permit B (CI wiring — `npm run test:integration:run` inserted as required gating step in `frontend-ci.yml` between `Test with coverage` and `Build`) both shipped and merged in PR #100. 143/143 green on `main`. First PR-run CI verification landed green. ADR-0024 promoted Established → Battle-tested in Pattern Maturity. 20 days from triage filing to cluster closure.

### Foundry Wing

| Concern | Severity | Status | Notes |
|---|---|---|---|
| Dockerfile build verification (`docker compose build backend`) | Low | Open — network-environmental | Docker daemon accessible as of 2026-05-26 (`docker info` returns client v29.4.3). Build attempt 2026-05-26 fails on `pecl install pcov` with PECL network error ("cannot download pecl/pcov"); not a code defect. The Dockerfile's pcov install is structurally correct. Re-verify during a session with reliable outbound network access. Surfaced/refreshed by [`2026-05-26-foundry-pulse-refresh`](../records/audits/2026-05-26-foundry-pulse-refresh.md). |

_Closed 2026-05-20 during first-standup verification (CEO triggered `/standup`, Pulse refresh acted on findings):_

- ~~`php8.5-pcov` not installed on dev host~~ — **Closed 2026-05-20.** Standup-triggered `php -m` check confirmed `pcov` module loaded on canonical PHP 8.5.5 dev host. CEO had installed it on a workstation; Pulse concern was 21+ days stale-on-paper. Casebook Methodology Note candidate: *post-environmental-install, re-verify on next standup and close immediately.*
- ~~`covers()` mismatch in `CorsConfigTest` blocking feature-coverage~~ — **Cascade-closed 2026-05-20** (driver-install precondition satisfied). Next feature-coverage run will surface this as a standalone issue if it persists; will refile as standalone if so.
- ~~Deferred mutation drill from 2026-04-19 L13 upgrade~~ — **Cascade-closed 2026-05-20** (driver-install precondition satisfied). Mutation drill can now run on canonical 8.5; if it surfaces fresh issues, refile as a new Concern with current evidence.

### Atrium

| Concern | Severity | Status | Notes |
|---|---|---|---|
| **Work Order paper-trail drift — Status field not updated post-shipping** | Medium | Open — discovered at first standup | First `/standup` run (2026-05-20) surfaced 29 WOs marked Open/In-Progress; triage matrix found **24 of them already have matching Build Records filed** (work shipped, Status field never closed). The real outstanding backlog is ~5 WOs, not 29. Pattern: at delivery time, the Brickwright files the Build Record but the WO file itself doesn't get its `**Status:** Open` line flipped to `**Status:** Completed` with a back-link to the Build Record. The Casebook flagged a related pattern (`Persistent low-severity open items`, 2026-04-25) but not the full scale until the Standup forced a roll-call. Remediation: a sweep WO to close the 24 already-shipped WOs (mechanical), plus a Brickwright training proposal candidate: *when filing a Build Record, also edit the corresponding WO's Status field and Build Record link in the same commit.* Closes when (a) the sweep ships, and (b) two subsequent Build Records close their parent WO in the same commit without prompting. |
| No SOP for doc-sweep step after framework version upgrades | Low | Open — preventative | The Laravel 13 upgrade shipped 2026-04-19; four governance docs still claimed "Laravel 12" thirty-one days later, surfaced by [`2026-05-20-post-merger-baseline`](../records/audits/2026-05-20-post-merger-baseline.md) Finding 2. SOP shape: framework upgrade Build Records should include an acceptance criterion of the form `rg -n "<old-framework-name> <old-version>" backend/CLAUDE.md CLAUDE.md .claude/docs/ .claude/agents/` returning no hits in active (non-historical) docs. The 2026-05-20 laravel-13-doc-sweep WO carried this AC, but as same-day remediation rather than as an unprompted next-upgrade pattern. Closes out when either (a) the next framework upgrade Build Record carries this AC unprompted, or (b) the convention is codified into the Build Record template at `.claude/records/build-records/.build-record-template.md`. |

_Closed 2026-05-27:_

- ~~ADR-0028 push-gate dual-mode behavior pending amendment~~ — **Closed 2026-05-27.** Amendment landed in PR #116 (`docs(arch): amend ADR-0028 with uniform-rule WO close convention`). Chosen rule: WOs close post-merge on `main` always, regardless of wing or diff size; recorded as **trial doctrine** with three Devil's Court re-interrogation triggers (20 closed WOs / next Warden audit citing ADR-0028 / calendar 2026-08-27). Basis named as CEO taste preference in the ADR itself, not architectural necessity. See [ADR-0028 § Amendment 2026-05-27](../docs/adr/0028-pre-push-permit-verification.md) and Build Record [`2026-05-27-adr-0028-uniform-rule-amendment`](../records/build-records/2026-05-27-adr-0028-uniform-rule-amendment.md).

## In-Progress Work

**Assessed:** 2026-05-19 (Atrium-level, post-merger residue cleanup)

_None in progress._ The Brickworks merger closed 2026-05-19 — see the closing Build Record at [`.claude/records/build-records/2026-05-19-form-the-brickworks.md`](../records/build-records/2026-05-19-form-the-brickworks.md) for the canonical record of the eight-phase consolidation. Post-merger war-room follow-up (Adjutant M4 + Cartographer M11 refresh + Engineer/Armorer/Engineer dispatches PR #72/#73/#74) completed 2026-05-19.

## Pattern Maturity

**Assessed:** 2026-05-26 (Foundry), 2026-05-25 (Gallery)

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
| Page integration tests (ADR-0024) | Battle-tested | 19 test files covering all domain pages; 143/143 green on `main`. Permit A (assertion repairs) and Permit B (CI wiring) both shipped and merged 2026-05-25 in PR #100. Suite now runs as a required, gating step in `frontend-ci.yml` between `Test with coverage` and `Build` — first PR-run verification landed green (job `ci` succeeded in 1m 46s on commit `53194aa`). Promoted Established → Battle-tested 2026-05-25 per CEO authorization, closing the 2026-05-05 integration-test cluster. |
| Form submit loading guard | Battle-tested | `useFormSubmit` returns `submitting` ref, prevents double-submission |

### Foundry Wing

| Pattern | Maturity | Evidence |
|---|---|---|
| Action layer | Battle-tested | Architecture tests guard it; all pass. Three approved try-catch exceptions documented in ADR-0015 (formerly BE-0003): partial-failure, UniqueConstraintViolationException upsert, race-condition guard. Custom PHPStan rules (`forbidDatabaseManager.inAction`, `forbidStaticCallToFacade.inAction`, `requireExplicitTransactionContract`) adopted 2026-05-01 with 0 findings. |
| Service layer (2 classes) | Battle-tested | Contract interfaces, Deptrac boundaries hold, no facade or model leakage |
| ResourceData pattern | Battle-tested | All have `from()` factories, EAGER_LOAD where needed. ComputedResourceData (ADR-0025) handles DTO-sourced responses |
| Explicit cascade deletion (ADR-0016) | Battle-tested | MigrationArchitectureTest + CascadeRelationArchitectureTest confirm compliance |
| Thin controllers (ADR-0021) | Battle-tested | No constructors, no try-catch, method injection only |
| Job layer (2 classes) | Established | JobArchitectureTest guards conventions; `SyncSetPartsJob` (existing) + `ImportOwnedSetsJob` (new since 2026-05-05 assessment). Both thin-wrapper pattern, both `final`, both `ShouldQueue`, both primitive-only constructors, both tested. Pattern adoption without prompting confirmed on the new Job. |
| Bulk aggregation endpoints (3 endpoints) | Battle-tested | `/family-sets/completion`, `/family-sets/missing-parts`, reverse-lookup-lens. Query budgets proven via `DB::listen` runtime tests |
| Operations Protocol enforcement (ADR-0028) | Established | CaptainHook pre-push verification gate; threshold-gated permit lookup, fail not prompt |

### Atrium

| Pattern | Maturity | Evidence |
|---|---|---|
| Accountability pipeline (Work Order → Build Record → Audit) | Battle-tested | 200+ records filed across both wings before the merger; pipeline survived four Brickworks-merger phases without disruption |

## Tech Debt

**Assessed:** 2026-05-27 (Foundry — ADR-0015 list drift resolved), 2026-05-20 (Gallery)

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
| `GetFamilyPartsAction` returns raw array (no ResourceData) | Low | Only endpoint bypassing the pattern. Re-confirmed 2026-05-26 by [`2026-05-26-foundry-pulse-refresh`](../records/audits/2026-05-26-foundry-pulse-refresh.md). |
| `LogoutController` session-invalidation branch uncovered in feature tests | Low | `Auth/LogoutController` lines 19-20 (`$request->session()->invalidate()` + `regenerateToken()`) reach only 60% feature coverage; overall feature coverage 98.1% still clears the 90% gate. WO candidate: third test exercising the stateful session path. Surfaced 2026-05-26 (Finding 1, medium severity in the audit; carried here as Low Tech Debt because it doesn't break the gate). |
| `FamilySetController::importStatus()` returns inline 404 JSON instead of typed exception | Low | Style inconsistency with the global-exception-handler pattern. Either document the empty-state divergence or introduce `ImportJobNotFoundException`. Surfaced 2026-05-26 (Finding 3 in audit). |

_Resolved 2026-05-27:_

- ~~ADR-0015 "Current Actions" list drift~~ — **Closed 2026-05-27.** Shipped in PR #123 (`2836eca`). Full reconcile against `grep -rln "try {" backend/app/Actions/` (7 files): `UpsertThemeAction` added to optimistic-locking upsert list; stranded `StoreSetPartsAction` entry removed (refactored to bulk `Eloquent::upsert()` in an earlier campaign, no try-catch in current code); `ImportOwnedSetsAction` classified as partial-failure resilience (already covered by ADR-0015's prose narrative). Zero unclassifiable try-catch patterns — all 7 fit cleanly into the three approved-exception categories. See Build Record [`2026-05-27-adr-0015-current-actions-list-reconcile`](../records/build-records/2026-05-27-adr-0015-current-actions-list-reconcile.md).

_Resolved 2026-05-26:_

- ~~`RegisterUserData::familyName` empty-string on invite-code path~~ — **Closed 2026-05-26.** Confirmed `?string` (nullable) in `app/DataTransferObjects/Input/Auth/RegisterUserData.php`. Fix in production.

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
| **Promote collect-guard from informational to failing** | After the SUT-only top-level `.vue` import arch test ([`2026-05-27-enforce-sut-only-vue-imports-in-unit-specs`](../records/work-orders/2026-05-27-enforce-sut-only-vue-imports-in-unit-specs.md)) has been in production for 60 days AND either a test-perf regression slips past it OR the firm grows confident the arch test alone is sufficient | Reverse ADR-0012 line 173's demotion of `collect-guard-reporter.ts` to informational; make it a build failure at the 1000ms threshold (2x coverage mode). Requires ADR-0012 amendment. Strengths: catches the broader class of test-perf regressions beyond the import-pattern (e.g., transitive Vite re-resolution, lazy-module reordering). Costs: timing-based fails can flake across environments (Node 24 vs CI vs dev variance). CEO 2026-05-27: "heavier beast, would be nice to eventually get to" — paired with the SUT-only arch test, which addresses the most common case first. |

## Quality Metrics

**Assessed:** 2026-05-26 (Foundry), 2026-05-25 (Gallery)

### Gallery Wing

_Coverage figures below reflect the unit test gauntlet only. The integration suite (`npm run test:integration:run`) is a separate, independently-gated layer per ADR-0024 — 19 specs / 143 tests, green on `main`, executed as a required step in `frontend-ci.yml` between `Test with coverage` and `Build` (PR #100, merged 2026-05-25)._

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
| Unit coverage | **100.0%** (measured 2026-05-26) | 100% |
| Feature coverage | **98.1%** (measured 2026-05-26) — `Auth/LogoutController` at 60% (lines 19-20 uncovered; see Tech Debt) | 90% |
| Mutation score | **79.68%** (measured 2026-05-26, improved from 76.97%) | 76% |
| Architecture tests | **107 passing** (measured 2026-05-26, up from 105) | All passing |
| PHPStan | Level max, **0 errors** across 339 files (measured 2026-05-26) | Level max, zero errors |
| Deptrac | **0 violations**, 743 allowed (measured 2026-05-26) | Zero violations |
| Full test suite | 697 tests, 2846 assertions, 24.55s (measured 2026-05-26) | — |

### Atrium

| Metric | Value | Source |
|---|---|---|
| ADRs documented | 29 (0001–0029, consolidated) | `.claude/docs/decisions.md` |
| Work Orders / Build Records / Audits | _count `.claude/records/{work-orders,build-records,audits}/`_ | file system |
