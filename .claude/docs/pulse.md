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

**Gallery Wing Rating:** 7.5/10
**Foundry Wing Rating:** 8/10
**Assessed:** 2026-07-09 (both wings — [`2026-07-09-warden-cross-wing-sweep`](../records/audits/2026-07-09-warden-cross-wing-sweep.md))

**Gallery (frontend):** Strong unit layer — factory mocks, exact-navigation assertions, 100% coverage gauntlet maintained; full assigned gauntlet green in the 2026-07-09 sweep (format / lint / type-check / knip / unit suite, 116 files / 1431 tests). Multi-app structure with strict isolation; import boundaries and ADR-0029 middleware verified clean. Page integration test layer (ADR-0024) Battle-tested and CI-gated (spec list from the filesystem, counts from `npm run test:integration:run`). Mutation Testing v2 CI-gated with per-file 90% floor (96.27% aggregate at last measure, 2026-06-01). fs-form adoption complete (PR #245) — local form composables retired. Rating held back (8 → 7.5) by due-diligence-visible drift: the wing manual misdescribes its own service layer post-fs-*-extraction and claims JSDOM (happy-dom is actual), the Parts copy-paste cluster and 13 assertion-free flow tests recurred at occurrence 2 with their 2026-05-29 WOs unexecuted. Doc-fix WO dispatched 2026-07-09; one high `form-data` npm advisory open (WO filed).

**Foundry (backend):** Code architecture clean on independent re-verification — 40 Actions / 12 Controllers / 2 Services fully comply, ADR-0015 try-catch roster still reconciled, policy/factory parity holds. 2026-07-09 sweep measures: PHPStan max 0 errors (348 files), Deptrac 0 violations (753 allowed), 109 architecture tests passing, full `composer test` green (2976 assertions). Coverage/mutation last measured 2026-05-26/29: 100% unit, 100% feature, 79.68% mutation. Rating trimmed (8.5 → 8) on two findings: the transaction-boundary test gap (~14/21 transactional Actions stub `transaction()` permissively — atomicity regressions would ship green; elevated WO dispatched) and the manual-vs-ADR-0021 contradiction plus an exception map documenting 5 of 12 rendered mappings (doc-fix WO dispatched). **Anomaly resolved 2026-07-09 (same day):** the 728 suite-wide warnings were NOT a PHP 8.5 deprecation — the host lacked `backend/.env`, and phpdotenv's suppressed `@file_get_contents` probe surfaced as an unsuppressed `fopen` warning through the `BypassFinals` stream wrapper (PHP's `@` does not extend into userland stream-wrapper internals), once per test boot. Fixed by provisioning `backend/.env` from `.env.example` and syncing the stale host vendor (`composer install` — vendor had drifted behind the 2026-07-08 lockfile bumps). Suite now reports 728 passed / 2976 assertions, zero warnings. Environmental, not a code defect. The root cause (`make init` never provisioned `backend/.env` — it only copies the root env file) was fixed same-day: `make init` now also copies `backend/.env.example → backend/.env`.

## Active Concerns

**Assessed:** 2026-07-09 (all wings)

### Gallery Wing

| Concern | Severity | Status | Notes |
|---|---|---|---|
| `AboutPage.spec.ts` collect guard warning | Low | Monitoring | Baseline-order-sensitive in 2x coverage mode: re-measured 2026-05-29 between below-the-400ms-warning-floor and 932ms delta (932ms raw, 0ms cold baseline); execution 811–1165ms / 35 tests. Under the 1000ms FAIL cap. Root cause unchanged: 16 named Lego shape imports (lines 2–17), now enumerated on the SUT-only arch-test legacy allowlist (`architecture.spec.ts`, PR #127). Paydown = `findComponent({name})` + `vi.mock`. |
| `Item` type constraint mismatch | Low | Aware | `FamilySet` has `id` but no `createdAt`/`updatedAt` — may surface in future domains |
| `format:check` failures on `.claude/` md | Low | Known | oxfmt reformats markdown — agent docs and journal files drift; not a code defect |

_Closed 2026-07-16 (shift-001 roll-call verification):_

- ~~`form-data` 4.0.0–4.0.5 high advisory (GHSA-hmw2-7cc7-3qxx, CRLF injection)~~ — **Closed 2026-07-16.** Lockfile resolves `form-data` 4.0.6, outside the advisory range — patched by a dependency bump after the 2026-07-09 WO was filed. Verified during shift 001's roll-call (Shift Report [`2026-07-16-shift-001`](../records/shifts/2026-07-16-shift-001.md), observation 6).

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

_Closed 2026-07-09 (same-day, within the sweep-follow-up session):_

- ~~`php8.5-pcov` missing again on dev host~~ — **Closed 2026-07-09.** Regression of the 2026-05-20 closure, surfaced by the family-id-archtest dispatch (PR #251): host PHP had moved to 8.5.4 with only `php8.4-pcov` installed. CEO installed `php8.5-pcov` same-session; verified with `php --ri pcov` (1.0.12 enabled) + full `composer test:coverage` (100.0%) and `composer test:feature-coverage` (100.0%) runs. Lesson recorded in the 2026-07-09 audit's Steward Evaluation: environmental closures can silently regress — re-verify before citing them in dispatches.

_Closed 2026-05-20 during first-standup verification (CEO triggered `/standup`, Pulse refresh acted on findings):_

- ~~`php8.5-pcov` not installed on dev host~~ — **Closed 2026-05-20.** Standup-triggered `php -m` check confirmed `pcov` module loaded on canonical PHP 8.5.5 dev host. CEO had installed it on a workstation; Pulse concern was 21+ days stale-on-paper. Casebook Methodology Note candidate: *post-environmental-install, re-verify on next standup and close immediately.*
- ~~`covers()` mismatch in `CorsConfigTest` blocking feature-coverage~~ — **Cascade-closed 2026-05-20** (driver-install precondition satisfied). Next feature-coverage run will surface this as a standalone issue if it persists; will refile as standalone if so.
- ~~Deferred mutation drill from 2026-04-19 L13 upgrade~~ — **Cascade-closed 2026-05-20** (driver-install precondition satisfied). Mutation drill can now run on canonical 8.5; if it surfaces fresh issues, refile as a new Concern with current evidence.

### Atrium

| Concern | Severity | Status | Notes |
|---|---|---|---|
| **Work Order paper-trail drift — Status field not updated post-shipping** | Medium | Open — discovered at first standup | First `/standup` run (2026-05-20) surfaced 29 WOs marked Open/In-Progress; triage matrix found **24 of them already have matching Build Records filed** (work shipped, Status field never closed). The real outstanding backlog is ~5 WOs, not 29. Pattern: at delivery time, the Brickwright files the Build Record but the WO file itself doesn't get its `**Status:** Open` line flipped to `**Status:** Completed` with a back-link to the Build Record. The Casebook flagged a related pattern (`Persistent low-severity open items`, 2026-04-25) but not the full scale until the Standup forced a roll-call. Remediation: a sweep WO to close the 24 already-shipped WOs (mechanical), plus a Brickwright training proposal candidate: *when filing a Build Record, also edit the corresponding WO's Status field and Build Record link in the same commit.* Closes when (a) the sweep ships, and (b) two subsequent Build Records close their parent WO in the same commit without prompting. |
| No SOP for doc-sweep step after framework version upgrades | Low | Open — preventative | The Laravel 13 upgrade shipped 2026-04-19; four governance docs still claimed "Laravel 12" thirty-one days later, surfaced by [`2026-05-20-post-merger-baseline`](../records/audits/2026-05-20-post-merger-baseline.md) Finding 2. SOP shape: framework upgrade Build Records should include an acceptance criterion of the form `rg -n "<old-framework-name> <old-version>" backend/CLAUDE.md CLAUDE.md .claude/docs/ .claude/agents/` returning no hits in active (non-historical) docs. The 2026-05-20 laravel-13-doc-sweep WO carried this AC, but as same-day remediation rather than as an unprompted next-upgrade pattern. Closes out when either (a) the next framework upgrade Build Record carries this AC unprompted, or (b) the convention is codified into the Build Record template at `.claude/records/build-records/.build-record-template.md`. |

_Closed 2026-07-16:_

- ~~ADR-0028 Devil's Court re-interrogation overdue~~ — **Closed 2026-07-16.** The nine-step re-interrogation ran with the CEO (48 days after the 2026-05-29 trigger ruling). Outcome: **Cracked at the root** — the PrePushPermitGate is retired entirely (PR #281, ADR-0028 § Amendment 2026-07-16). The permit-before-work guarantee lives on the Kendo board (issue before dispatch, `link-branch`, review label before merge); named accepted risk on file: large hand-run work has no mechanical permit check, audit cycle is the backstop. Closes BIO-0012; dissolves BIO-0011.

_Closed 2026-05-27:_

- ~~ADR-0028 push-gate dual-mode behavior pending amendment~~ — **Closed 2026-05-27.** Amendment landed in PR #116 (`docs(arch): amend ADR-0028 with uniform-rule WO close convention`). Chosen rule: WOs close post-merge on `main` always, regardless of wing or diff size; recorded as **trial doctrine** with three Devil's Court re-interrogation triggers (20 closed WOs / next Warden audit citing ADR-0028 / calendar 2026-08-27). Basis named as CEO taste preference in the ADR itself, not architectural necessity. See [ADR-0028 § Amendment 2026-05-27](../docs/adr/0028-pre-push-permit-verification.md) and Build Record [`2026-05-27-adr-0028-uniform-rule-amendment`](../records/build-records/2026-05-27-adr-0028-uniform-rule-amendment.md).

## In-Progress Work

**Assessed:** 2026-05-19 (Atrium-level, post-merger residue cleanup)

_None in progress._ The Brickworks merger closed 2026-05-19 — see the closing Build Record at [`.claude/records/build-records/2026-05-19-form-the-brickworks.md`](../records/build-records/2026-05-19-form-the-brickworks.md) for the canonical record of the eight-phase consolidation. Post-merger war-room follow-up (Adjutant M4 + Cartographer M11 refresh + Engineer/Armorer/Engineer dispatches PR #72/#73/#74) completed 2026-05-19.

## Pattern Maturity

**Assessed:** 2026-05-26 (Foundry), 2026-05-29 (Gallery)

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
| Page integration tests (ADR-0024) | Battle-tested | All domain pages covered (spec/test counts from `npm run test:integration:run`); green on `main`. Permit A (assertion repairs) and Permit B (CI wiring) both shipped and merged 2026-05-25 in PR #100. Suite now runs as a required, gating step in `frontend-ci.yml` between `Test with coverage` and `Build` — first PR-run verification landed green (job `ci` succeeded in 1m 46s on commit `53194aa`). Promoted Established → Battle-tested 2026-05-25 per CEO authorization, closing the 2026-05-05 integration-test cluster. |
| Form submit loading guard | Battle-tested | `useFormSubmit` returns `submitting` ref, prevents double-submission |
| Mutation testing (Stryker) v2 | Established | Shipped 2026-05-28 in PR #135 (commit `f8887e3`) after v1 was retired as VESTIGIAL in PR #133. Stryker 9 + Vitest runner, config mirrored from `script-development/fs-packages` template. Scope: `src/shared/{helpers,composables,middleware,services/auth}/**/*.ts` (9 files, 242 mutants). 91.70% mutation score against a `break: 90` threshold (fs-packages parity). **CI-gated from day one** in `frontend-ci.yml` between `Test with coverage` and `Integration tests` — this addresses the v1 failure mode (no consumer = vestigial). Transitive `qs` advisory chain (the one that motivated PR #133) closed via `overrides: {qs: "^6.15.2"}` in `package.json` — `npm audit` reports 0 vulnerabilities. **Per-file floor added 2026-06-01 (`mutation-per-file-floor` WO):** the aggregate-only `break` let weak files hide behind strong siblings (General review of PR #135). The two sub-floor laggards were triaged — `bricklinkWantedList.ts` 88.64 → 100% and `guards.ts` 89.47 → 100% — lifting the aggregate to **96.27%**, and a `posttest:mutation` script (`scripts/check-mutation-per-file-floor.mjs`) now parses Stryker's JSON report and fails the build if any single file drops below 90% (Stryker has no native per-file `break`). **Promotion Established → Battle-tested remains pending: condition is one sprint of green CI runs; the new per-file gate also needs to ride CI green before promotion. Gate green on `main` since landing (the one failing CI run since was a commit-lint failure, not the mutation step).** |

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
| Operations Protocol enforcement (ADR-0028) | Retired | Gate removed 2026-07-16 (Devil's Court: Cracked at root, PR #281) — permit-before-work moved to the Kendo board workflow; ADR-0028 retained as the lifecycle record |

### Atrium

| Pattern | Maturity | Evidence |
|---|---|---|
| Accountability pipeline (Work Order → Build Record → Audit) | Battle-tested | 200+ records filed across both wings before the merger; pipeline survived four Brickworks-merger phases without disruption |

## Tech Debt

**Assessed:** 2026-05-27 (Foundry — ADR-0015 list drift resolved), 2026-05-29 (Gallery)

### Gallery Wing

| Item | Severity | Notes |
|---|---|---|
| SUT-only top-level `.vue` import legacy allowlist | Low | The SUT-only arch test (PR #127) carries a `LEGACY_CROSS_COMPONENT_IMPORTS` allowlist of ~7 specs that import cross-component `.vue` files at top level (incl. `AboutPage.spec.ts`'s 16 Lego shapes, `App.spec.ts`, `HomePage`, `BrickDnaPage`, the auth pages). Each entry is declared one-line legacy debt; paydown converts to `findComponent({name})` + `vi.mock` and shrinks the Vite collect phase. Root of the residual collect-guard warnings; paydown target for the "promote collect-guard to failing" Seed. |
| SetDetailPage ancillary HTTP calls outside adapter | Low | `loadParts` + `loadStorageMap` (storage map ref) are read-only projections, not CRUD — correctly direct. Both named explicitly. |
| Button/nav components lack keyboard tests | Low | Noted in learnings — add when touching next |
| Oxlint JS plugins not yet available for custom Vue checks | Low | Monitoring oxc milestone 3 — will replace `lint-vue-conventions.mjs` |
| `prevCursor` field in part types unused by UI | Low | API returns prevCursor but pagination is forward-only; retained for type accuracy. Third inspection cycle unresolved as of 2026-05-20 (escalated from Casebook Recurring Patterns). |
| Domain pages excluded from unit-coverage 100% gate | Low | `src/apps/**/domains/**` excluded from thresholds — catch-branch gaps require manual inspection or integration-test coverage. No automated detection. Surfaced by [`2026-05-20-gallery-pulse-refresh`](../records/audits/2026-05-20-gallery-pulse-refresh.md). |

### Foundry Wing

| Item | Severity | Notes |
|---|---|---|
| `GetFamilyPartsAction` returns raw array (no ResourceData) | Low | Only endpoint bypassing the pattern. Re-confirmed 2026-05-26 by [`2026-05-26-foundry-pulse-refresh`](../records/audits/2026-05-26-foundry-pulse-refresh.md). |
| `FamilySetController::importStatus()` returns inline 404 JSON instead of typed exception | Low | Style inconsistency with the global-exception-handler pattern. Either document the empty-state divergence or introduce `ImportJobNotFoundException`. Surfaced 2026-05-26 (Finding 3 in audit). |

_Resolved 2026-05-29:_

- ~~`LogoutController` session-invalidation branch uncovered in feature tests~~ — **Closed 2026-05-29.** The stateful-session test shipped via PR #122 (`67186d6`); re-verified this date by re-running `composer test:feature-coverage` on the canonical PHP 8.5 host — `Auth/LogoutController` now reports **100.0%** and total feature coverage is **100.0%** (was 98.1% / LogoutController 60% on 2026-05-26). Confirmed during the [`2026-05-29-gallery-pulse-refresh`](../records/audits/2026-05-29-gallery-pulse-refresh.md) Casebook closure + Steward Foundry-carry-forward verify.

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

**Assessed:** 2026-07-09 (static/arch/suite rows via warden sweep gauntlet; coverage & mutation rows retain their 2026-05-26/29 and 2026-06-01 measure dates — those gates were outside the sweep's assigned set)

### Gallery Wing

_Coverage figures below reflect the unit test gauntlet only. The integration suite (`npm run test:integration:run`) is a separate, independently-gated layer per ADR-0024 — spec/test counts come from the runner, green on `main`, executed as a required step in `frontend-ci.yml` between `Test with coverage` and `Build` (PR #100, merged 2026-05-25)._

| Metric | Value | Source |
|---|---|---|
| Test coverage (lines) | 100% | `npm run test:coverage` |
| Test coverage (branches) | 100% | `npm run test:coverage` |
| Test count | _run `npm run test:unit` for current count_ | gauntlet output |
| Shared components | _see `meta.componentCount`_ | `src/shared/generated/component-registry.json` |
| Domains (Families) | _list `src/apps/families/domains/`_ | file system |
| knip violations | 0 | `npm run knip` |
| Mutation score (Stryker v2) | _run `npm run test:mutation` for current_ — 96.27% aggregate against `break: 90` (242 mutants, `stryker.config.mjs`); all per-file scores ≥ 90% enforced by `posttest:mutation` (`scripts/check-mutation-per-file-floor.mjs`) as of 2026-06-01 | `frontend-ci.yml` Stryker step |

### Foundry Wing

| Metric | Value | Threshold |
|---|---|---|
| Unit coverage | **100.0%** (measured 2026-05-26) | 100% |
| Feature coverage | **100.0%** (re-measured 2026-05-29 — `Auth/LogoutController` now 100% after PR #122; was 98.1% on 2026-05-26) | 90% |
| Mutation score | **79.68%** (measured 2026-05-26, improved from 76.97%) | 76% |
| Architecture tests | **109 passing** (measured 2026-07-09, up from 107) | All passing |
| PHPStan | Level max, **0 errors** across 348 files (measured 2026-07-09) | Level max, zero errors |
| Deptrac | **0 violations**, 753 allowed (measured 2026-07-09) | Zero violations |
| Full test suite | **687 passed**, 3045 assertions, ~23s (measured 2026-07-16 — baseline shifted from 728 when the retired PrePushPermitGate's 330-line test suite was deleted with the gate, PR #281) | — |

### Atrium

| Metric | Value | Source |
|---|---|---|
| ADRs documented | 29 (0001–0029, consolidated) | `.claude/docs/decisions.md` |
| Work Orders / Build Records / Audits | _count `.claude/records/{work-orders,build-records,audits}/`_ | file system |
