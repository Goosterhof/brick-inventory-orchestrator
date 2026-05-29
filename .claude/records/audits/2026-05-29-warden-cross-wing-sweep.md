# Audit — Cross-Wing Freshness Sweep

**Filed:** 2026-05-29
**Auditor:** Quality Warden
**Wing:** Atrium (cross-wing)
**Type:** Freshness sweep (not a bug hunt)
**Scope:** Both wings — architecture, doc accuracy, tech debt, test quality, and cross-wing ADR pressure. No Work Order: Steward-dispatched sweep, machine-fanned-out across seven dimensions with adversarial verification of every candidate finding before filing.

---

## Executive Summary

Both wings are structurally sound and the full assigned gauntlet is green. The sweep surfaced **no high-severity findings and no code-correctness defects** — every confirmed finding is either documentation drift, an unenforced governance/architecture gap, or maintenance debt. The Foundry's architecture and test discipline came through clean (zero medium+ findings in arch/test dimensions). The medium-severity surface concentrates in **doc-vs-code drift** (an ADR threshold, a manual's service section, a retired-obligation gate message) and **showcase-readiness gaps** (a raw-Vue-Router app, duplicated list scaffold, an overstated coverage metric, assertion-free flow tests).

| Dimension | Verdict |
|---|---|
| Foundry — Architecture (SOP F-2) | **Clean** — Actions/Services/Controllers fully comply; ADR-0015 try-catch roster reconciled |
| Foundry — Doc Accuracy (SOP F-3) | **Drifted** — gate message instructs a retired obligation (medium); two manifest count gaps (low) |
| Foundry — Tech Debt (SOP F-4) | **Drifted** — N+1 on family-sets index from incomplete EAGER_LOAD (medium) |
| Foundry — Test Quality (SOP F-5) | **Clean** — policy/test parity holds; two low hardening notes |
| Gallery — Architecture (SOP G-2) | **Drifted** — showcase bypasses RouterService ADR (medium); config rot (low) |
| Gallery — Doc Accuracy (SOP G-3) | **Drifted** — manual describes extracted fs-* services as local; dead storage exemption (medium ×2) |
| Gallery — Tech Debt (SOP G-5) | **Drifted** — duplicated Parts-page scaffold; coverage gate narrower than advertised (medium ×2) |
| Gallery — Test Quality (SOP G-6) | **Drifted** — 13 assertion-free integration flow tests (medium) |
| Atrium — Cross-ADR Pressure | **Pressure detected** — ADR-0012 doc/code threshold drift (medium); ADR-0014 / ADR-0028 signals |
| Cross-Wing — Showcase Readiness | **Needs polish** — solid foundation, several due-diligence-visible rough edges |

---

## Quality Gauntlet Results

All 10 assigned gates passed across both wings. A dedicated gauntlet pass owned these runs; the heaviest gates (coverage, mutation, size, lint:vue, integration) were deliberately out of the assigned command set and are marked skipped honestly — no silent caps.

| Wing | Command | Status | Detail |
|---|---|---|---|
| Foundry | `composer lint:test` | **pass** | Rector OK across 340 files; Pint passed. Exit 0. |
| Foundry | `composer phpstan` | **pass** | Level max + Larastan + war-room rules across 339 files. 0 errors. |
| Foundry | `composer deptrac` | **pass** | 0 violations, 744 allowed, 581 uncovered (informational). |
| Foundry | `composer test:arch` | **pass** | 107 tests / 1860 assertions in 8.50s. |
| Foundry | `composer test` | **pass** | 700 tests / 2872 assertions in 30.14s. |
| Gallery | `npm run format:check` | **pass** | oxfmt --check: all 333 files formatted. |
| Gallery | `npm run lint` | **pass** | oxlint 0 errors / 47 non-failing warnings (46× `toBeTruthy`→`toBe(true)` strict-boolean matcher; 1× import-style; 1× consistent-function-scoping). |
| Gallery | `npm run type-check` | **pass** | vue-tsc --build clean. |
| Gallery | `npm run knip` | **pass** | No unused files/exports/deps. |
| Gallery | `npm run test:unit` | **pass** | 115 files / 1413 tests in 52.82s. Collect/test guards fired in **warn** mode only (1 file 531ms vs 500ms soft collect threshold, under the 5000ms hard cap; ComponentGallery 1149ms + several SetsOverview ~800ms test-guard warns). Per ADR-0012 these warn but do not fail. |

| Command | Wing | Skipped because |
|---|---|---|
| `composer test:coverage` | Foundry | Not in assigned command set; 100% unit gate owned by a separate pass |
| `composer test:feature-coverage` | Foundry | Not in assigned set |
| `composer mutation` | Foundry | Heaviest gate; deliberately out of scope |
| `npm run test:coverage` | Gallery | Assigned command was `test:unit`; 100% variant not requested |
| `npm run size` | Gallery | size-limit not in assigned set |
| `npm run lint:vue` | Gallery | Custom Vue-conventions linter not in assigned set |
| `npm run test:integration:run` | Gallery | Page-composition integration suite not in assigned set |

**Scope attribution:** no gate failures, therefore no scope-classification subsection required. Two non-blocking observations carried to the Steward: (1) the 46 repeated `toBeTruthy`→`toBe(true)` warnings are a cheap mechanical cleanup that would zero the warning count; (2) the ADR-0012 guards fired in warn mode on the Gallery suite — by design non-blocking, but signal import-chain weight worth tracking (and reinforcing finding G-test/G-debt items below).

---

## Findings

All medium-severity findings below are rebuttal candidates. Every finding was adversarially verified against source before filing; verification notes are summarized inline.

### Foundry Wing

#### F-doc-1 — PrePushPermitGate failure message instructs a bypass-log obligation that ADR-0028 retired

- **Severity:** Medium
- **Location:** `backend/tools/CaptainHook/PrePushPermitGate.php:193-194`
- **Standard:** ADR-0028 § Amendment 2026-05-28 (II) — Bypass-Log Retirement; `backend/CLAUDE.md` Pre-Push Gauntlet ("the bypass-log clause was retired … with no logging obligation")
- **Observation:** The gate's failure message — the text a developer sees when a non-trivial push lacks a permit — still reads: "To bypass for a documented exception, push with `--no-verify` and record the bypass in the corresponding shift log's Decisions Made section with explicit Director sign-off." ADR-0028 § Amendment 2026-05-28 (II) retired that obligation entirely ("Using `--no-verify` is no longer a paper-trail obligation in any category"; the logging requirement is "withdrawn"; "Nothing is owed"). The wing manual was updated; the code string was not. The message also carries pre-merger Stud & Sort vocabulary — "shift log" (now Build Record / minutes) and "Director" (now CEO / Steward) — neither of which survived into Brickworks vocabulary. The amendment's "What Does NOT Change" carve-out preserves only the mechanical gate behaviour and `--no-verify` availability, not this message text, so the stale string is drift, not a retained artifact.
- **Impact:** The single most authoritative place a developer encounters the bypass rule — live gate output at the moment of a blocked push — instructs an obligation that no longer exists, in vocabulary the firm abandoned. A senior architect running the gate during due diligence sees governance text that contradicts both the governing ADR and the wing manual, manufacturing the exact "pretense of enforcement" the CEO explicitly retired in Amendment (II).
- **Recommendation:** Update lines 193-194 to match the retired state — drop the logging/sign-off instruction or reduce it to a neutral note that `--no-verify` is the documented escape hatch with no logging obligation. Replace any remaining "shift log" / "Director" tokens with current vocabulary. Dispatch as a Brickwright fix; `PrePushPermitGateTest.php` should assert the message no longer references a logging obligation.

#### F-debt-1 — FamilySetResourceData EAGER_LOAD omits nested `set.theme` — N+1 in the family-sets index

- **Severity:** Medium
- **Location:** `backend/app/Http/Resources/FamilySetResourceData.php:16` (EAGER_LOAD), nested at line 43 (`SetSummaryResourceData::from($model->set)`); consumed via `collection()` at `backend/app/Http/Controllers/FamilySetController.php:36`
- **Standard:** ADR-0018 / `backend/CLAUDE.md` ResourceData convention — "`EAGER_LOAD` constant when nesting related data — prevent N+1 loading." Correct dot-notation composition is demonstrated in `SetWithPartsResourceData.php:15` (`['theme','setParts.part','setParts.color']`).
- **Observation:** `FamilySetResourceData` nests `SetSummaryResourceData::from($model->set)`. `SetSummaryResourceData` requires its own `theme` relation (`EAGER_LOAD = ['theme']`), but the parent declares `EAGER_LOAD = ['set']` — not `['set','set.theme']`. In the collection path the base `loadMissing(['set'])` loads `set` in one query; then each nested `SetSummaryResourceData::from()` runs its own per-item `loadMissing(['theme'])`, firing one theme query per family set. `GetFamilySetsAction` does not pre-load upstream, so nothing pre-empts the N+1. The self-healing `loadMissing` masks the bug functionally (output is correct) but reintroduces exactly the N+1 the convention exists to prevent. Root cause is broader: the arch test (`ResourceDataArchitectureTest.php:94`) verifies only that an `EAGER_LOAD` constant *exists* on nesting classes — never that it *covers* the nested resource's required relations — so this passes the gauntlet silently.
- **Impact:** A family viewing its sets list triggers 1 query for sets + 1 for `set` + N theme queries (one per owned set) — linear query blow-up on a hot list endpoint, the first thing a due-diligence reviewer profiles. It also reveals a gap in EAGER_LOAD arch enforcement that future nested resources can fall into.
- **Recommendation:** Change `FamilySetResourceData::EAGER_LOAD` to `['set','set.theme']` (mirror `SetWithPartsResourceData`). Separately, strengthen `ResourceDataArchitectureTest.php` so the check composes nested resources' EAGER_LOAD requirements (parent must declare the relation + relation-prefixed nested requirements), which addresses the real root cause and catches the next occurrence. Dispatch to the Brickwright; do not fix in-audit.

### Gallery Wing

#### G-arch-1 — Showcase app uses raw Vue Router, violating ADR-0003's no-exceptions rule

- **Severity:** Medium
- **Location:** `frontend/src/apps/showcase/router/index.ts:3,10`; `frontend/src/apps/showcase/App.vue:2,9,21,35`; `frontend/src/apps/showcase/main.ts` (`app.use(showcaseRouter)`)
- **Standard:** ADR-0003 (Custom RouterService) — "Every routed app uses `createRouterService()`. No direct Vue Router usage. No exceptions for 'simple' apps."
- **Observation:** The showcase bypasses the RouterService wrapper entirely: `router/index.ts` calls `createRouter`/`createWebHistory` from `vue-router` directly, `main.ts` registers the plugin via `app.use(showcaseRouter)`, and `App.vue` imports and uses raw `RouterLink`/`RouterView`. Families and admin both correctly use `createRouterService()`. The showcase has exactly 2 routes — squarely the "barely qualifies as a routed app" case ADR-0003 explicitly forecloses — and no showcase exemption exists in any ADR or in `decisions.md`. The violation survives every automated gate: oxlint's `no-restricted-imports` bans only `useRouter`/`useRoute` (not `createRouter`, `createWebHistory`, `RouterView`, or `RouterLink`-import), and `lint-vue-conventions.mjs` check 6 (RouterLink template ban) is scoped to `src/shared/` only, so an app-level `App.vue` is never checked.
- **Impact:** The single largest architecture inconsistency in the wing. Although showcase is dev-only and never ships, it is the design-system showroom — the exact artifact a prospective client opens to judge pattern discipline. An app demonstrating the firm's components while ignoring the firm's own routing ADR is a credibility hit during due diligence, and it means the wing carries two routing dialects, undermining the "team learns one routing API" consequence ADR-0003 exists to guarantee.
- **Recommendation:** Either (a) migrate showcase to `createRouterService()` to match families/admin, or (b) if showcase is a deliberate exception, file an ADR-0003 amendment documenting the dev-only carve-out with rationale. Separately, close the enforcement gap: extend `lint-vue-conventions.mjs` check 6 (or oxlint) to flag `createRouter`/`RouterView`/`RouterLink` usage in `src/apps/**` so a future raw-Vue-Router regression cannot pass silently.

#### G-doc-1 — Manual's shared/services list and Services convention describe locally-built factories that are now fs-* packages

- **Severity:** Medium
- **Location:** `frontend/CLAUDE.md` Blueprint Room structure tree (~line 58, `services/ # Service factories (http, auth, router, loading, toast, translation)`) and Coding Conventions › Services (~lines 104-112)
- **Standard:** SOP G-3 (CLAUDE.md conventions must match what code actually does); Pulse note "Router migration to `@script-development/fs-router` complete"
- **Observation:** The manual states `src/shared/services/` holds factories for http, auth, router, loading, toast, translation, and presents `createHttpService()`/`createRouterService()`/`createAuthService()` as local factories ("Services live in each app's `services/` directory"). In reality `src/shared/services/` contains only `auth/` and `sound.ts`. Five of the six factories are now imported from third-party packages (`@script-development/fs-http|fs-router|fs-loading|fs-toast|fs-translation`, verified in the families service files); only `createAuthService` remains local.
- **Impact:** A senior architect reading the manual for onboarding would hunt for local factory implementations that do not exist, and would not learn that the service layer was extracted into the `@script-development/fs-*` package family — the single largest architectural shift in the wing since the router migration. Misrepresents the actual dependency surface in a showcase doc and would actively misdirect a builder.
- **Recommendation:** Update the Materials table and the Services convention section to name the `@script-development/fs-*` package family as the factory source, and correct the structure-tree `services/` annotation to reflect that `shared/services` now holds only `auth/` and `sound.ts`. Doc edit is the Steward's territory; report only.

#### G-doc-2 — Linting Standards documents a singleton exemption for `src/shared/services/storage.ts` — a file that no longer exists

- **Severity:** Medium
- **Location:** `frontend/CLAUDE.md` Linting Standards › "Singleton exemption" bullet (line 231); dead override in `frontend/.oxlintrc.json:227`
- **Standard:** SOP G-3 dead-reference rule (a stale reference is worse than a missing one)
- **Observation:** The manual lists a singleton exemption for `src/shared/services/storage.ts` (no-console + no-restricted-globals, "the storage service IS the canonical localStorage wrapper"). That file does not exist — storage migrated to `@script-development/fs-storage` (confirmed in `package.json`). The `.oxlintrc.json` still carries the per-file override at line 227 pointing at the same non-existent literal path (not a glob — it matches nothing). The only same-named survivor (`apps/families/services/storage.ts`) is a 3-line factory call needing no exemption.
- **Impact:** Both the onboarding manual (which AI assistants treat as authoritative) and an inert config override describe a hand-rolled localStorage wrapper in shared that does not exist. Doubly stale; exactly the doc/config claim that fails the "treat every doc claim as a hypothesis" test during due diligence.
- **Recommendation:** Remove or rewrite the storage.ts singleton-exemption bullet in the manual. Flag the dead `.oxlintrc.json:227` override to the Steward for the Brickwright to remove (config edit is the Brickwright's territory).

#### G-debt-1 — Sort/filter/export scaffold duplicated verbatim across all three Parts pages

- **Severity:** Medium
- **Location:** `frontend/src/apps/families/domains/parts/pages/PartsPage.vue:16,115-168`; `PartsUnsortedPage.vue:24,113-151`; `PartsMissingPage.vue:16,64-130`
- **Standard:** Atrium charter Kragle/Rebuilding anti-duplication; SOP G-5 ("duplicated patterns across domains that should be in shared"); Showcase Readiness ("copy-paste patterns" red flag)
- **Observation:** All three Parts pages independently re-implement the same client-side list scaffold: a local `type SortField`, an identical `setSortField`, a `compareX(a,b)` switch over `activeSortField`, a `searchQuery` ref with the same `.toLowerCase().trim()` filter idiom inside a `filteredX` computed, a `sortLabelKey` Record, an `allSortFields` array, and an `exportCsv` building headers+rows then calling `downloadCsv(toCsv(...))`. The CSV-export half also recurs in `SetsOverviewPage.vue`. Bodies differ only in the column set and sort keys — the control structure is copy-paste.
- **Impact:** A change to filtering/sorting/export behaviour must be made in 3-4 places and can silently diverge (the Casebook already tracks a `PartsMissingPage` sort-chip carry-forward in this exact cluster). It is the most visible "got lazy" pattern in the Gallery for a due-diligence reviewer, sitting directly opposite the firm's well-abstracted `useFormSubmit`/`useValidationErrors` composables — the inconsistency undercuts the showcase story.
- **Recommendation:** Extract a `useSortableFilteredList` composable (parameterized by sort comparators + a text-match selector) and a `useCsvExport` helper into `src/shared/composables/`, then have the three Parts pages consume them. Dispatch as a Brickwright refactor WO; the divergent data shapes (`GroupedFamilyPart` vs `MasterShoppingListEntry`) make extraction non-trivial but not blocking.

#### G-debt-2 — "100% coverage" gate excludes app domains, pages, services, stores, and types — only shared/ is truly gated

- **Severity:** Medium
- **Location:** `frontend/vitest.config.ts:46-62` (coverage.exclude block + `thresholds:100`)
- **Standard:** `frontend/CLAUDE.md` Coverage Policy ("100% coverage on lines, functions, branches, and statements. If you build it, you test it."); Pulse Quality Metrics ("Test coverage (lines) 100%"); Showcase Readiness (metric honesty)
- **Observation:** The 100/100/100/100 thresholds are enforced, but the exclude list removes `src/apps/**/{domains,pages,services,stores,types,router}/**`, `main.ts`, and `App.vue`. The headline 100% therefore measures `src/shared/**` plus app-root files only — none of the families/admin app services or stores (e.g. `familySetStore.ts`, the 31KB `translation.ts`) are under the unit gate, and the unit test tree carries no specs for those dirs. The only other coverage-relevant config (`vitest.integration.config.ts`) has no coverage block, so there is no separate gate. The Pulse Tech Debt register records only "Domain pages excluded"; the actual exclusion is broader (app services + stores + types + router).
- **Impact:** The "100% coverage" headline a prospective client reads overstates what is gated. Catch-branch and error-path gaps in app services/stores are invisible to the unit gate and rely on the separately-gated integration suite for any signal. A reviewer who greps `vitest.config.ts` finds the gap and discounts the metric.
- **Recommendation:** Either (a) narrow the exclude list and bring app `services/`/`stores/` under the unit gate, or (b) qualify the Pulse Quality Metrics line and CLAUDE.md Coverage Policy to state the gate's true scope (shared + app-root) and name the integration suite as the coverage path for excluded app code. Steward decides which; this finding flags the metric-vs-scope mismatch, not the gate change.

#### G-test-1 — 13 integration page specs each contain one assertion-free "flow" test — the highest-value behaviour is an L0 smoke test

- **Severity:** Medium
- **Location:** `frontend/src/tests/integration/apps/families/domains/**/pages/*.spec.ts` — LoginPage, RegisterPage, HomePage, AddSetPage, EditSetPage, IdentifyBrickPage, ScanSetPage, SetDetailPage, SetsOverviewPage, AddStoragePage, EditStoragePage, StorageDetailPage, StorageOverviewPage
- **Standard:** SOP G-6 (Gallery candidate, 2026-05-05) — "for integration tests, assertions that only check component existence (L0) without rendered content provide no detection advantage over unit tests with stubs. Flag as methodology gap." ADR-0024 (page integration tests with real component composition)
- **Observation:** Each of the 13 families integration page specs contains exactly one `it` block performing a full user flow (mount → fill inputs → trigger submit/click → flushPromises) that asserts **nothing**, closed with the boilerplate comment `// No assertion on navigation — integration tests verify composition, not side effects.` The clearest case, `LoginPage.spec.ts:57-74`, types email+password, submits, flushes, and has zero `expect()` — its own comment admits it "fires `login()` … then `goToRoute('home')`" yet verifies neither. The other `it` blocks in each file *do* carry assertions, so the finding precisely targets the single highest-value behaviour test per file. The `vitest/expect-expect` rule is deliberately disabled (manual Linting Standards) so the suite stays green. The mechanical reason assertions are omitted: `mock-server.ts` runs the real router and exposes no call history.
- **Impact:** These are the behaviourally-richest tests in each page (submit → service → navigate is the actual user journey) yet they have zero detection power. A regression removing the submit handler, breaking the login service call, or dropping post-submit navigation would pass green across all 13 pages. For a portfolio piece, an L0 "flow" test that exercises a full path and asserts nothing reads as test-theatre — it inflates the integration count without buying coverage of the side effects it names in its own comment.
- **Recommendation:** Make each flow test assert its named side effect — either spy the auth/router service and assert `goToRoute` was called with the expected route, or extend `mock-server.ts` to record request calls and assert the converted snake_case POST fired (which also exercises the ADR-0029 boundary the helper docstring claims to protect). Either lifts these from L0 to L1/L2. Dispatch as a Brickwright follow-up; do not leave the boilerplate-comment pattern as the house standard. (Note: the finding's claim that a router spy is "trivially reachable" is slightly optimistic — none of the sampled flow tests currently import the router service, so a spy needs new wiring; the substance holds.)

### Low-Severity Observations

Filed for the early-warning system; no rebuttal triggered.

| ID | Wing | Observation |
|---|---|---|
| G-arch-2 | Gallery | Lint configs (`lint-vue-conventions.mjs`, `.oxlintrc.json` messages) cite stale pre-merger ADR numbers (RouterService as ADR-001, factory services ADR-002, UnoCSS ADR-003, coverage-no-ignore ADR-005, test-isolation ADR-010) — Phase 5 renumbering missed these config-string surfaces. A dev hitting one of these lint errors looks up the wrong/nonexistent decision. |
| G-arch-3 | Gallery | Same stale storage-singleton override as G-doc-2, viewed from the arch lens — `.oxlintrc.json:227` exempts a moved file; config rot. |
| G-arch-4 | Gallery | Pre-merger "Brick & Mortar" / "Brick Brutalism" vocabulary leaked into shipped showcase nav (`App.vue:11,41`) — first instance of the tracked Atrium "pre-merger vocabulary leak" pattern surfacing in **rendered source** rather than a WO body. |
| G-doc-3 | Gallery | Materials table lists Husky as the git-hooks supplier, but `husky` is not a declared dependency (only `@commitlint/*` + `lint-staged`); the `.husky/*` scripts are fired by the orchestrator-root dispatcher, not husky's autoinstall. |
| G-doc-4 | Gallery | Structure tree's `shared/helpers` list is stale — lists removed `copy`, omits `bricklinkWantedList`. |
| G-doc-5 | Gallery | Undocumented `src/shared/services/sound.ts` (and `useBrickPickup.ts` composable) absent from manual and domain-map — reverse-verification gap. |
| G-debt-3 | Gallery | `prevCursor: string \| null` (`types/part.ts:80`) remains a dead type member — fourth consecutive inspection unresolved; already on the Pulse Tech Debt register. |
| G-test-2 | Gallery | `mock-server.ts` runs request middleware but discards the result — no `calls` log — so the outbound (request → snake_case) half of ADR-0029 has no integration-level assertion path, despite the helper's docstring naming itself "the regression safety net for ADR-0029." Half-finished safety net. |
| G-test-3 | Gallery | Guard reporters are sound and self-consistent (test-guard warn 300 / fail 2000, collect-guard advisory-only); measurement-hygiene note that historical Casebook deltas are only comparable within the same coverage multiplier. |
| F-arch-1 | Foundry | **Clean pass recorded as positive anchor** — 7 try-catch sites across 7 Actions exactly match the ADR-0015 roster after the 2026-05-27 reconcile (PR #123); each implementation verified against its documented pattern (partial-failure resilience / optimistic-locking upsert / race-condition guard); zero generic `\Exception`/`\Throwable` catches. |
| F-arch-2 | Foundry | **Clean pass** — all 39 Actions `final readonly` with single `execute()`; both Services `final readonly` implementing Contracts with no Model/Action imports; Controllers constructor-free, try-catch-free, query-builder-free. The Controller `ResourceData::from()->toResponse()` usage is explicitly **not** a violation per ADR-0021 — do not flag on future audits. |
| F-doc-2 | Foundry | `backend/CLAUDE.md` Heavy Machinery says "4 custom war-room rules" but the package registers 5 (`LogRule` + `EnforceAuditSnapshotOnRetryRule` target an `AuditLog` model not present here, so they are inert). Off-by-one a due-diligence reviewer spot-checks; Steward to confirm with the package owner whether the dormant rules are intentional. |
| F-doc-3 | Foundry | Exceptions section documents 5 of 11 rendered mappings; the 6 omitted carry the least-guessable codes (409 duplicate import, 422 self-removal, 422 invalid invite, 404 user-not-in-family, 404 invite-not-found, 502 invalid-API-response). `ExternalApiException` (abstract base) and `MissingRelationException` (dev-facing 500) are correctly unrendered. Reads as a doc that stopped being maintained post-0022. |
| F-debt-2 | Foundry | `BelongsToFamilyInterface` convention-only enforcement — third consecutive clean check; 4 family-owned models implement it, User is the documented exemption. Holding, but enforcement still depends on the next builder knowing the rule. Escalation candidate (see ADR Pressure). |
| F-test-1 | Foundry | Six factory state methods defined but never exercised by any test (`atPosition`, `withParent`, `noExpiry`, `spare`, `unverified`, `withTheme`) — dead fixtures that can drift out of sync with the model and suggest untested model states behind a 100% line-coverage figure. |
| F-test-2 | Foundry | `TestConventionsArchitectureTest` it-should check uses single `preg_match` (validates only the *first* `it()` per file) and the describe check uses `str_contains` (passes if any `describe(` token exists). 625/625 it-blocks currently honour the convention, so latent gap, not active defect — but the enforcement test undercuts the "conventions enforced by tests, not review" story if read by an architect. |

---

## Doc Drift

| Document | Claim | Reality | Finding |
|---|---|---|---|
| `frontend/CLAUDE.md` (structure tree + Services convention) | `shared/services` holds local http/router/loading/toast/translation factories | Five are now `@script-development/fs-*` package imports; only `auth/` + `sound.ts` remain local | G-doc-1 (medium) |
| `frontend/CLAUDE.md` (Linting Standards) + `frontend/.oxlintrc.json:227` | Singleton exemption for `src/shared/services/storage.ts` | File deleted; storage migrated to `@script-development/fs-storage`; override matches nothing | G-doc-2 (medium) |
| `.claude/docs/adr/0012-…md:49-52,156,202` | Execution-time guard fails at 1000ms | `test-guard-reporter.ts:29` fails at 2000ms (4000 under coverage) — wrong by 2× in every place | G-adr-0012-1 (medium) |
| `backend/tools/CaptainHook/PrePushPermitGate.php:193-194` | Bypass requires recording in shift log with Director sign-off | ADR-0028 Amendment (II) retired the obligation; vocabulary abandoned | F-doc-1 (medium) |
| `frontend/scripts/lint-vue-conventions.mjs`, `frontend/.oxlintrc.json` (messages) | ADR-001/002/003/005/010 citations | Consolidated sequence is ADR-0003/0004/0005/0007/0012 | G-arch-2 (low) |
| `frontend/CLAUDE.md` (Materials) | Husky is the git-hooks supplier | `husky` not a declared dependency; root dispatcher fires `.husky/*` | G-doc-3 (low) |
| `frontend/CLAUDE.md` (structure tree) | helpers = string, csv, copy, type-check | actual: string, csv, type-check, bricklinkWantedList | G-doc-4 (low) |
| `backend/CLAUDE.md` (Heavy Machinery) | "4 custom war-room rules" | 5 registered (2 inert) | F-doc-2 (low) |
| `backend/CLAUDE.md` (Exceptions) | 5 mappings | 11 rendered in `bootstrap/app.php` | F-doc-3 (low) |
| `.claude/docs/quality-warden-casebook.md:24` | "5 models implement `BelongsToFamilyInterface`" | 4 implement (User exempt) | F-adr-0014-1 (low) — corrected this audit |

---

## ADR Pressure

Three ADR-pressure signals surfaced this cycle. The Steward routes for re-interrogation.

### ADR-0012 — Test-isolation guard thresholds (FREQUENCY + THRESHOLD)

- **FREQUENCY (medium, G-adr-0012-1):** The ADR body states the execution-time guard — its own named "blocking enforcer" — fails at 1000ms in four places (lines 50, 52, 156, 202); the reporter actually fails at 2000ms (4000 under coverage). The doc is wrong by 2× on its authoritative blocking number. The Casebook already logged this exact drift ("ADR docs not updated after implementation changes", 2026-04-25) and it remains unamended through every Gallery cycle since; ADR-0012 also recurs in nearly every Gallery Casebook entry (ComponentGallery, AboutPage, PartsPage, SetsOverviewPage guards). A junior calibrating new specs against a 1000ms fail line that does not exist (the ADR-000 junior-test audience) would be confused when a 1500ms spec passes. **Immediate fix is a doc amendment, not a rethink** — reconcile the four locations to warn 300 / fail 2000 (600 / 4000 under coverage) with an Amendment block recording the 1000→2000 change and date. Recommend escalating the "ADR docs not updated after implementation changes" recurring pattern (now 2+ occurrences against the same ADR) to a Pulse Active Concern.
- **THRESHOLD (low, G-adr-0012-2):** The ADR named 76 spec files as its calibration baseline and 700+ as the re-evaluation horizon. The suite is now at **137 specs** (canonical `find` count) — 1.8× the baseline, well short of 700, but the firm has spent the last two cycles splitting specs (PRs #119/#120/#121) specifically to stay under the guard. This is the "works but generates recurring toil" smell, not a failure. No re-interrogation needed yet; the SUT-only top-level `.vue` import arch test (`architecture.spec.ts:757`, self-healing legacy allowlist) is the structural answer and is already shipping. Track whether spec-split toil drops once the allowlist is paid down.

### ADR-0014 — `BelongsToFamilyInterface` convention-only enforcement (FREQUENCY)

- **(low, F-adr-0014-1):** Code reality verified this audit — **5 models reference `family_id`** (FamilySet, User, StorageOption, InviteCode, ImportJob); **4 implement the interface** (User is the documented exemption). The Medium-risk ADR-0014 Open Question ("should an architecture test enforce this?") has now surfaced across three Foundry cycles with consistent "convention held, zero violations" evidence. This is the cheap moment to resolve it: dispatch the arch test (assert every model with a `family_id` column implements the interface, User allowlisted), converting a convention-only gap into mechanical enforcement and closing the Open Question. **Casebook hygiene:** line 24 records "5 models implement" — wrong against current code (it is 4); corrected this audit (see Self-Debrief). Frame as resolving the Open Question, not as a violation.

### ADR-0028 — Uniform-rule trial doctrine, audit-citation trigger (governance)

- **(low, X-adr-0028-1):** ADR-0028 § Amendment 2026-05-27 recorded itself as trial doctrine with three Devil's Court re-interrogation triggers, one being "the next Quality Warden audit that cites ADR-0028 by name." The 2026-05-29 Gallery Pulse-refresh audit referenced ADR-0028 (as a standing watch, not a finding); **this sweep cites it by name as a finding (F-doc-1) and in this section**, which plausibly fires the trigger. The WO-volume trigger (20 closed WOs) and calendar trigger (2026-08-27) are not yet met. **Steward decision:** determine whether the citation satisfies the trigger; if yes, schedule the nine-step `/adr-interrogator` re-run; if the reference is judged too incidental, record that ruling explicitly so the trigger has a documented disposition rather than drifting silently into de-facto settled doctrine.

---

## Summary

| Wing | Overall Health |
|---|---|
| Foundry | **8.5 / 10** — architecture and test discipline clean on independent re-verification; all medium findings are doc drift (F-doc-1) or a single masked N+1 (F-debt-1). Mechanically enforced, portfolio-ready core. |
| Gallery | **7.5 / 10** — strong foundation (100% shared coverage, multi-app isolation, gauntlet green) but the medium surface is concentrated and due-diligence-visible: a raw-Vue-Router showcase, a manual that misdescribes its own service layer, an overstated coverage metric, duplicated Parts scaffold, and 13 assertion-free flow tests. |

**Finding counts by severity:**

- **High:** 0
- **Medium:** 9 confirmed (Foundry 2: F-doc-1, F-debt-1 · Gallery 6: G-arch-1, G-doc-1, G-doc-2, G-debt-1, G-debt-2, G-test-1 · cross-ADR 1: G-adr-0012-1). *Total medium = 9 across the corpus.* (Corrected by The Steward 2026-05-29: the as-filed table read "7" against 9 enumerated IDs — see Steward Evaluation.)
- **Low:** 17 observations (incl. 2 Foundry clean-pass anchors).
- **Refuted before filing:** 0.

**Showcase readiness:** **Needs polish.** The architectural story (deptrac boundaries, war-room rules, domain isolation, typed DTOs, factory services, integration tier) is genuinely advanced and would impress. The rough edges that would concern a senior architect during due diligence are all addressable without structural change: the showcase routing inconsistency (G-arch-1), the doc-vs-code divergences a reviewer greps for (G-doc-1/2, G-adr-0012-1, F-doc-1), the overstated coverage headline (G-debt-2), and the copy-paste Parts scaffold (G-debt-1).

**Recommendation:** Dispatch the nine medium findings to the Brickwright through the Rebuttal Protocol. Prioritize the two cheapest credibility wins — F-doc-1 (gate-message correction) and G-adr-0012-1 (ADR threshold amendment) — alongside the F-debt-1 N+1 fix (with the EAGER_LOAD arch-test hardening that is its real root cause). Route ADR-0012 (frequency + threshold) and ADR-0014 (resolve the Open Question via arch test) for re-interrogation, and rule explicitly on the ADR-0028 trigger disposition.

---

## Self-Debrief

**What I caught:**
- The two cheapest, highest-credibility doc/code divergences a due-diligence reviewer greps for: a gate message instructing a *retired* obligation (F-doc-1) and an ADR documenting its own primary enforcement threshold wrong by 2× in four places (G-adr-0012-1). Both are narrative-vs-load-bearing drift, the exact thing that erodes trust in a paper trail.
- A masked N+1 (F-debt-1) where the self-healing `loadMissing` keeps output correct, so the only way to find it was static tracing of the load path — and the arch test that should catch it only checks the *existence* of `EAGER_LOAD`, not its *coverage*. The root-cause fix is the arch-test hardening, not just the one-line constant change.
- The Foundry came through genuinely clean on architecture and test quality, and I recorded that as positive anchors (F-arch-1/2) rather than padding the finding count — the firm earns credit when it earns it.
- A Casebook count error in my own notebook (line 24: "5 models implement" → actually 4 + User exempt), surfaced and corrected this cycle.

**What I missed / did not verify (finder constraints):**
- No heavy gauntlets were run by the finder dimensions (coverage %, mutation score, integration suite, size, lint:vue) — owned by the dedicated gauntlet pass and listed honestly as skipped. F-debt-1's N+1 is established by static reading, not a query-count assertion; a query-count test is the definitive confirmation and is part of the recommended fix verification.
- G-debt-2's reliance on the integration suite as the coverage path for excluded app code was *not* confirmed by running `test:integration:run` — flagged as the open question in that finding.
- Live collect/test-guard per-file deltas this cycle were captured only at the warn level by the gauntlet pass; the standing AboutPage/PartsPage Casebook entries remain the items to re-measure next Gallery cycle.

**Methodology gaps:**
- The recurring "ADR docs not updated after implementation changes" pattern is now firmly multi-occurrence against ADR-0012 specifically — it should graduate from a Casebook recurring-pattern row to a Pulse Active Concern, because the Casebook alone has not driven the fix across cycles.
- Code-embedded governance strings (gate failure messages, hook output) are a doc-drift surface that CLAUDE.md/ADR sweeps miss entirely — F-doc-1 is the first instance. Worth a standing check on hook scripts and artisan command output.

**Training proposals (candidates, evidence = this audit):**
1. *SOP F-3 should add a code-embedded-governance-string check:* after any ADR amendment that retires/changes an obligation, grep tool/hook/command output strings (`backend/tools/`, `.githooks/`, artisan command descriptions) for the retired language — not just CLAUDE.md and docs. Evidence: F-doc-1 (the gate message contradicted both the ADR and the wing manual the docs sweep *did* update).
2. *SOP F-4 (ResourceData maturity) should verify EAGER_LOAD coverage, not just existence:* when a nesting ResourceData is checked, confirm its `EAGER_LOAD` includes relation-prefixed entries for every relation its nested resources require. Evidence: F-debt-1 (the existing arch test passes a real N+1 because it only asserts the constant exists).
3. *Cross-wing: when a finding cites a doc count, derive both sides from canonical sources and reconcile the Casebook's own tally:* the Casebook's "5 models implement" was stale and would have skewed the three-occurrence escalation math. Evidence: F-adr-0014-1.

**Methodology note — adversarial verification fan-out:** this sweep was machine-fanned-out across seven dimensions; every candidate finding was independently re-verified against source before filing, and **0 findings were refuted** in that pass. The zero-refutation rate is itself a calibration signal — the finder dimensions filed tightly-scoped, evidence-backed candidates rather than speculative smells. Logged in the Casebook.

---

## Steward Evaluation

_Reviewed fresh against the filed corpus, 2026-05-29 — The Steward._

**On the sweep as a method.** This is the firm's first machine-fanned-out Warden sweep — nine SOP dimensions, adversarial verification per medium+ candidate, a dedicated gauntlet pass, one house-style filing. The deliverable is genuine: every medium finding I spot-checked traces to real source. F-debt-1 (the masked N+1) and the F-doc-1 / G-adr-0012-1 doc-vs-code pair are exactly the load-bearing-vs-narrative drift a Warden exists to catch, and the Foundry clean-pass anchors (F-arch-1/2) show the finder recorded credit where earned rather than padding the count.

**Verified before acting.** I confirmed G-adr-0012-1 independently: `frontend/src/tests/unit/test-guard-reporter.ts:29` is `FAIL_THRESHOLD_MS = 2000` (4000 under coverage); ADR-0012 documents a 1000ms fail line in four places (lines 50, 52, 156, 202). Finding holds. F-doc-1's stale gate string (`PrePushPermitGate.php:193-194`) verified against ADR-0028 § Amendment 2026-05-28 (II). Both dispatched — see WO `2026-05-29-warden-sweep-quick-wins`.

**One defect, corrected.** The Summary undercounted its own medium findings — "7 confirmed" against 9 enumerated IDs (matching the workflow's own `confirmedCount=9`). Corrected in this filing (Foundry 2 + Gallery 6 + cross-ADR 1 = 9). A self-counting slip in the closing table is precisely what a fresh-context Steward read exists to catch; it does not impugn the findings. Warden training note: add a "reconcile the closing tally against the enumerated finding IDs before filing" step.

**Calibration caveat — the 0/9 refutation rate.** Zero refutations on a first run reads two ways: tight, evidence-backed candidates (the optimistic read, and my spot-checks support it) — or a skeptic layer that was never genuinely exercised. I will not treat the adversarial verifier as proven until it kills something. Next sweep keeps the pass and watches the rate.

**Dispositions:**
- **Dispatched now:** F-doc-1 + G-adr-0012-1 → WO `2026-05-29-warden-sweep-quick-wins` (Brickwright). The two cheapest credibility wins.
- **Queued for next dispatch:** F-debt-1 (the N+1 fix *and* the EAGER_LOAD arch-test hardening that is its real root cause), G-arch-1 (showcase RouterService migration + the linter coverage gap), G-debt-1/2, G-test-1.
- **ADR pressure:** ADR-0014 Open Question is ripe to resolve via the `family_id` arch test (three clean cycles of evidence) — queued. The ADR-0012 frequency pattern ("ADR docs not updated after implementation changes") escalates to a Pulse Active Concern in the next Steward Pulse pass. ADR-0028 trigger: I rule the F-doc-1 by-name citation **does** fire the re-interrogation trigger — an `/adr-interrogator` re-run is queued, recorded here so the trigger has an explicit disposition rather than drifting into de-facto settled doctrine.
- **Pulse / manuals:** the doc-drift corrections (G-doc-1..5, F-doc-2/3) fold into the next Steward Pulse and wing-manual pass — Steward territory, not dispatched to the Brickwright.

**Method verdict:** keep it. Promoted to a reusable `/warden-sweep` skill this session. Calibration cost for a full cross-wing run: ~1.43M tokens / ~30 min wall-clock / 20 agents.
