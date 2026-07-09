# Audit — Cross-Wing Freshness Sweep

**Filed:** 2026-07-09 _(filename and this field corrected by The Steward — the workflow's date argument did not reach the script and the audit initially landed as `0000-00-00-…`)_
**Auditor:** Quality Warden
**Wing:** Atrium (cross-wing)
**Type:** Freshness sweep (not a bug hunt)
**Scope:** Full cross-wing sweep — both wings across architecture (SOP F-2/G-2), doc accuracy (SOP F-3/G-3), tech debt (SOP F-4/G-5), test quality (SOP F-5/G-6), plus Atrium cross-ADR pressure and showcase readiness. No Work Order: Steward-dispatched sweep, machine-fanned-out across nine SOP dimensions with adversarial verification of every candidate finding before filing.

---

## Executive Summary

Both wings are structurally sound and every assigned quality gate is green — including the full `composer test` rig and the Gallery unit suite. The sweep surfaced **no high-severity findings and no code-correctness defects**. Every confirmed finding is documentation drift, an unenforced governance/architecture gap, test-rigor debt, or maintenance debt. The Foundry's Action/Service/Controller architecture and its policy/test parity came through clean on the code side; its medium surface is entirely doc-vs-code drift plus one long-method debt item and one atomicity-test gap. The Gallery's unit layer is genuinely strong (factory mocks, exact-navigation assertions); its medium surface concentrates in doc drift and two carry-forward showcase gaps. The most significant governance signal is that an ADR-0028 Devil's Court re-interrogation trigger fired **41 days ago** and the mandated re-run was never dispatched.

| Dimension | Verdict |
|---|---|
| Foundry — Architecture (SOP F-2) | **Clean (code)** — 40 Actions / 12 Controllers / 2 Services fully comply; ADR-0015 try-catch roster reconciled. One doc contradiction filed (F-arch-1, medium) |
| Foundry — Doc Accuracy (SOP F-3) | **Drifted** — Exceptions map documents 5 of 12 rendered mappings (medium); Floor Plan omits Feedback + 3 models (low) |
| Foundry — Tech Debt (SOP F-4-adjacent) | **Drifted** — 162-line `GetFamilyMissingPartsAction::execute()` (medium); analytics-Action length cluster + convention-only interface (low) |
| Foundry — Test Quality (SOP F-5) | **Drifted** — transaction boundary permissively stubbed in ~14/21 transactional Actions (medium); policy/factory parity clean |
| Gallery — Architecture (SOP G-2) | **Clean (code)** — import boundaries, RouterService, ADR-0029 middleware all verified clean. Stale lint-config ADR numbers recur (low) |
| Gallery — Doc Accuracy (SOP G-3) | **Drifted** — JSDOM claim vs happy-dom (medium); shared/services list names extracted fs-* packages (medium); helper/storage/count drift (low) |
| Gallery — Tech Debt (SOP G-5) | **Drifted** — Parts pages copy-paste cluster carried forward (medium); prevCursor/dupe-mapper/eslint-disable (low) |
| Gallery — Test Quality (SOP G-6) | **Drifted** — 13 assertion-free integration flow tests, occurrence 2 (medium); outbound ADR-0029 assertion gap (low) |
| Atrium — Cross-ADR Pressure | **Pressure detected** — ADR-0028 re-interrogation overdue (medium); ADR-0012 / 0014 / 0029 signals (low) |
| Cross-Wing — Showcase Readiness | **Needs polish** — advanced architecture, several due-diligence-visible carry-forwards |

---

## Quality Gauntlet Results

All requested gates passed (exit 0) across both wings. A dedicated gauntlet pass owned these runs; the heaviest gates (coverage, mutation, feature-coverage, size, lint:vue, integration) were deliberately outside the assigned command set and are marked skipped honestly — no silent caps.

| Wing | Command | Status | Detail |
|---|---|---|---|
| Foundry | `composer lint:test` | **pass** | Rector: no changes across 349 files; Pint passed. Exit 0. |
| Foundry | `composer phpstan` | **pass** | Level max + Larastan + 4 war-room rules: 0 errors across 348 files. |
| Foundry | `composer deptrac` | **pass** | 0 violations, 753 allowed, 598 uncovered (informational). |
| Foundry | `composer test:arch` | **pass** | 109 passed / 2 warnings / 1920 assertions in 2.48s. |
| Foundry | `composer test` | **pass** | Exit 0, 2976 assertions, ~19.9s. **Anomaly:** summary reads "728 warnings" with no "passed" count — every test flagged with a warning, likely a suite-wide PHP 8.5 deprecation. Gate passes; flagged for Steward attention. |
| Gallery | `npm run format:check` | **pass** | oxfmt --check: all 345 files formatted. Exit 0. |
| Gallery | `npm run lint` | **pass** | oxlint --type-aware: 0 errors; ~16 non-failing unicorn warnings (consistent-function-scoping helpers + node:path import-style). |
| Gallery | `npm run type-check` | **pass** | vue-tsc --build clean. |
| Gallery | `npm run knip` | **pass** | No unused files/exports/deps. |
| Gallery | `npm run test:unit` | **pass** | 116 files / 1431 tests in 6.97s. ADR-0012 guards fired in **warn** mode only: collect guard flagged 9 files (worst SettingsPageMembers 504ms delta / 1882ms raw); test guard flagged 13 files over 300ms (worst SetsOverviewFiltering 616ms). Guards warn, do not fail. |

| Command | Wing | Skipped because |
|---|---|---|
| `composer test:coverage` (100% unit) | Foundry | Not in assigned command set; owned by a separate pass |
| `composer test:feature-coverage` (90%) | Foundry | Not in assigned set |
| `composer mutation` (Infection, 76% min) | Foundry | Heaviest gate; deliberately out of scope |
| `npm run test:coverage` (100%) | Gallery | Assigned command was `test:unit`; 100% variant not requested |
| `npm run size` | Gallery | size-limit not in assigned set |
| `npm run lint:vue` / `test:integration:run` | Gallery | Custom Vue linter + integration suite not in assigned set |

**Scope attribution:** no gate failures, therefore no scope-classification subsection required. Two non-blocking items carried to the Steward: (1) Foundry's full `composer test` reports all-warnings with no passed count — anomalous versus `test:arch`'s clean passed/warning split, likely a global PHP 8.5 deprecation; (2) the Gallery ADR-0012 guards are warning (not failing) on 9 collect-duration files and 13 slow test files — by design non-blocking, reinforcing G-test/X-adr-0012 items below and the standing Casebook guard suspicions.

---

## Findings

All medium-severity findings below are rebuttal candidates. Every candidate was adversarially verified against source before filing; verification notes are summarized inline. **0 findings were refuted before filing.**

### Foundry Wing

#### F-arch-1 — Foundry wing manual forbids controller ResourceData construction, contradicting ADR-0021 and all controllers

- **Severity:** Medium
- **Location:** `backend/CLAUDE.md` — Coding Conventions › Controllers, bullet "No `ResourceData` construction — Actions return the shaped data"; vs `.claude/docs/adr/0021-thin-controllers-method-injection.md:39,45` and 25 `::from()`/`::fromResult()` sites across 9 controllers
- **Standard:** ADR-0021 (thin controllers, method injection) — line 39 shows `FamilySetResourceData::from($familySet)->toResponseWithStatus(201)` **inside a controller** as canonical; line 45 states controllers "call `->toResponse()`"
- **Observation:** The wing manual's Controllers convention asserts controllers must not construct ResourceData and that "Actions return the shaped data." This is the exact opposite of ADR-0021, which mandates controllers build ResourceData via `::from()` and call `->toResponse()`. Every controller follows the ADR pattern; no Action returns a ResourceData — and none could, since the manual's own Deptrac table places ResourceData above Action (Action → Model/ResultDTO/…, not → ResourceData). The bullet therefore describes an architecture Deptrac would actively forbid.
- **Impact:** A Brickwright onboarding via the manual would try to push ResourceData construction into Actions and be blocked by Deptrac/ControllerArchitectureTest, wasting a build cycle. For a portfolio piece, a due-diligence reviewer reading the canonical manual then the code sees a self-contradicting governance doc, undercutting the otherwise-clean architectural story.
- **Recommendation:** Correct the Controllers bullet to match ADR-0021 — e.g. "Construct ResourceData in the controller via `::from()` and return `->toResponse()`/`->toResponseWithStatus()` (or an `array` of ResourceData); Actions return Models or Result DTOs, never ResourceData." Steward-owned wing-manual edit; ADR-0021 is the higher authority and the code already conforms.

#### F-doc-1 — Exception rendering map in the Foundry manual documents only 5 of 12 rendered exceptions

- **Severity:** Medium
- **Location:** `backend/CLAUDE.md` — "### Exceptions" code block (5 mappings); vs `backend/bootstrap/app.php:66-99` (12 render closures)
- **Standard:** SOP F-3 item 5 (Exception rendering — all custom exceptions handled?); the manual's own self-claim "Typed failures with global handling. No silent swallowing."
- **Observation:** The manual documents exactly 5 exception→status mappings (SetNotFound→404, MissingRebrickableToken→400, NotFamilyHead→403, RebrickableApi→502/404, BrickognizeApi→502). The global handler registers 12. Seven rendered mappings are absent from the manual: CannotRemoveSelf→422, UserNotInFamily→404, InviteCodeNotFound→404, InvalidInviteCode→422, ImportAlreadyInProgress→409, InvalidApiResponse→502, and vendor ReportSubmission→502. (`app/Exceptions/` holds 13 classes; ExternalApiException — abstract base — and MissingRelationException — internal RuntimeException guard — are correctly unrendered.) The documented map is a strict subset less than half the size of reality, omitting every 409/422 domain-conflict mapping — the exact ones that showcase the error model's sophistication.
- **Impact:** A senior architect reading the manual for due diligence would conclude the API has 5 typed exceptions and no 409/422 conflict handling, materially understating the design. An onboarding Brickwright has no accurate template of the rendered set to extend. This is SOP F-3 item 5 failing.
- **Recommendation:** Enumerate all 12 rendered mappings in the Exceptions block, or explicitly label it a representative subset pointing at `bootstrap/app.php` as source of truth. Prefer full enumeration for showcase value — the 409/422/404 mappings are worth showing. Dispatch as a Brickwright doc fix.

#### F-debt-1 — `GetFamilyMissingPartsAction`: 162-line `execute()` with six queries and stacked loops

- **Severity:** Medium
- **Location:** `backend/app/Actions/FamilySet/GetFamilyMissingPartsAction.php:28-189` (execute); only helper `key()` at :191
- **Standard:** `backend/CLAUDE.md` Actions convention "Single execute() method — one procedure, one job"; SOP F-4.1 (same structure consistently?); Showcase Readiness (code sophistication / scalability)
- **Observation:** `execute()` spans 162 lines orchestrating six independent queries (:34/:54/:70/:80/:101/:168) plus three foreach reduction loops (:115/:128/:178) and inline keyBy closures. All ADR-0015 mechanics are followed correctly (per-query `$model->newQuery()`, `->toBase()->get()` returning stdClass, no facades), so this is not an architecture violation. But the method has outgrown "one procedure, one job," and it is a consistency outlier: the two comparably-large Actions (GetBrickDnaAction 205 lines, ImportOwnedSetsAction 201 lines) both decompose into private stage helpers keeping `execute()` at ~48/~58 lines. This is the only large Action without stage decomposition.
- **Impact:** A due-diligence reviewer flags a 162-line method as the hardest-to-maintain unit in the Actions layer — high cognitive load, hard to unit-test intermediate aggregation stages, the largest mutation surface. Erodes the otherwise-clean showcase impression of the Actions pattern.
- **Recommendation:** Extract the discrete stages (owned-set collection, needed-parts rollup, stored-parts lookup, missing-parts diff) into private helpers or sub-Actions so `execute()` reads as a pipeline. No standard is violated — treat as debt paydown, not a blocking fix. Verify via rebuttal whether the Brickwright considers the shape intentional given the `toBase()` performance path.

#### F-test-1 — Transaction boundary unverified across Action unit tests — a dropped transaction wrapper would survive the suite

- **Severity:** Medium
- **Location:** `backend/tests/Unit/Actions/**/*Test.php` (~42 transaction-stub sites; exemplar `DeleteFamilySetActionTest.php:14`). Counted transaction expectations exist in only 7 of 21 transactional Actions.
- **Standard:** ADR-0015 ("Use `$this->connection->transaction(Closure)` via injected `ConnectionInterface`"); ADR-0016 (atomicity of explicit cascade deletion); SOP F-5 (meaningful, mutation-resistant assertions)
- **Observation:** Most Action tests stub the injected `ConnectionInterface::transaction` with a permissive passthrough — `allows('transaction')->andReturnUsing(fn($cb)=>$cb())` or `shouldReceive('transaction')->andReturnUsing(...)` with no `->once()`/`times()` count. Under Mockery both forms are zero-or-more-times: the call is never *required*, and the stub runs the closure inline. A regression that unwraps the transaction (e.g. `$familySet->delete()` directly instead of inside `connection->transaction(...)`) produces identical inner behavior, so the inner-interaction expectations still pass and the permissive transaction stub is satisfied by zero calls. Verification corrected the finder's original scope claim: counted transaction expectations DO exist in 7 files (StartImportActionTest, ImportOwnedSetsActionTest, and five upsert tests, plus `shouldNotReceive` pins in two more), so the true gap is **~14 of 21 transactional Actions**, not "~19 of 20." The unverified set still includes the ADR-0016 explicit-cascade deletes (DeleteFamilySetAction; DeleteStorageOptionActionTest pins load/delete but never the transaction call) and CreateUserWithFamilyAction.
- **Impact:** Atomicity is a data-integrity guarantee — dropping the transaction wrapper on a cascade-delete or multi-write Action risks orphaned rows on partial failure while the unit suite stays green. Infection has no mutator that reliably unwraps a `transaction()` call, so the 76% mutation floor does not backstop this class. The inconsistency (7 Actions pin the boundary, 14 do not) reads as uneven test rigor to a reviewer.
- **Recommendation:** Standardize the transaction stub to `shouldReceive('transaction')->once()->andReturnUsing(fn($cb)=>$cb())` for every transactional Action, making the boundary a required interaction. Consider a convention/arch check: any Action injecting `ConnectionInterface` must have a test asserting `transaction()` is invoked. Cross-check the mutation report (gauntlet agent owns the run) for surviving mutants on delete/upsert Actions.

### Gallery Wing

#### G-doc-1 — CLAUDE.md Materials table names JSDOM but every Vitest config uses happy-dom

- **Severity:** Medium
- **Location:** `frontend/CLAUDE.md` Materials & Suppliers table, "Testing" row; vs `vitest.config.ts:9,19,29` and `vitest.integration.config.ts:21`
- **Standard:** SOP G-3 (CLAUDE.md stated conventions must match what code actually does)
- **Observation:** The Materials table states `Testing | Vitest + @vue/test-utils (JSDOM)`. All three project blocks in `vitest.config.ts` and the integration config set `environment: 'happy-dom'`. There is no `jsdom` dependency in `package.json`; `happy-dom ^20.10.6` is present (jsdom appears only as vitest's optional peer declaration in the lockfile). `vitest.browser.config.ts` uses Playwright chromium — also not JSDOM. The stated test environment is factually wrong.
- **Impact:** The onboarding/portfolio doc misdescribes the runtime test environment. A new contributor or prospective architect would assume JSDOM, and any behavioral difference (happy-dom vs jsdom DOM quirks) would be debugged against the wrong assumption. Code is canonical; the doc is stale.
- **Recommendation:** Update the "Testing" row to `Vitest + @vue/test-utils (happy-dom)`. Dispatch to the Brickwright; Warden does not edit wing manuals.

#### G-doc-2 — Blueprint Room shared/services list is stale — most listed services migrated to @script-development packages; sound.ts undocumented

- **Severity:** Medium
- **Location:** `frontend/CLAUDE.md` — Blueprint Room `shared/services/` comment "(http, auth, router, loading, toast, translation)" and Services convention section; vs `src/shared/services/` (only `auth/` and `sound.ts`)
- **Standard:** SOP G-3 (CLAUDE.md conventions match reality); ADR-0004 factory-service documentation coherence
- **Observation:** Blueprint Room documents `services/` as factories for http/auth/router/loading/toast/translation and the Services section names `createHttpService()`/`createRouterService()` as if shared-hosted. Actual `src/shared/services/` contains only `auth/` and `sound.ts`. http/router/loading/toast/translation now come from `@script-development/fs-http|fs-router|fs-loading|fs-toast|fs-translation` (confirmed in `package.json` and `apps/families/services/http.ts:1`). `sound.ts` — a live shared service used by ModalDialog/PrimaryButton/ConfirmDialog with a spec — is undocumented anywhere in the manual. (Corroborating drift: CLAUDE.md still cites `src/shared/services/storage.ts`, which no longer exists — see G-doc-3 observation.)
- **Impact:** The documented supply-warehouse layout no longer matches the tree. A reader hunting for the http/router/toast factories in `shared/services/` will not find them, and the undocumented `sound.ts` has no paper trail. For a portfolio piece this reads as documentation that drifted after the fs-packages extraction was never reflected back into the manual.
- **Recommendation:** Reconcile the Blueprint Room `services/` comment and the Services convention section against the current tree: note the fs-* package migration and add `sound.ts`. Dispatch to the Brickwright.

#### G-debt-1 — Parts pages are a copy-paste cluster — Missing/Unsorted are near-clones over the same endpoint (carry-forward)

- **Severity:** Medium
- **Location:** `frontend/src/apps/families/domains/parts/pages/PartsMissingPage.vue` and `PartsUnsortedPage.vue` (near-identical); scaffold echoed in `PartsPage.vue`
- **Standard:** SOP G-5 (duplicated patterns that should be shared); root CLAUDE.md ("patterns that work but don't scale / look amateur are findings"); carry-forward from audit `2026-05-29-warden-cross-wing-sweep` G-debt-1
- **Observation:** `PartsMissingPage.vue` and `PartsUnsortedPage.vue` are near-clones. Both fetch the SAME endpoint (`/family-sets/missing-parts`), both type entries as `MasterShoppingListEntry`, and carry byte-identical bodies for the fetch fn, `affectedSetCount` (Missing:54-62 / Unsorted:103-111), `compareEntries` (:68-76 / :117-125), `filteredEntries` (:78-89 / :127-138), `setSortField`, the `SortField` type, `activeSortField`, and `allSortFields`. `PartsUnsortedPage` even carries a doc comment (lines 36-40) admitting the reuse. They diverge only in PlacePartModal wiring, translation-key prefixes, and CSV headers. `PartsPage.vue` reuses the same sort-chip scaffold over a different type. WO `2026-05-29-extract-parts-list-composables` was filed for this exact cluster but was never executed (no build record; grep for `usePartShortfall`/`usePartsList` returns nothing) — a legitimate carry-forward.
- **Impact:** Three near-duplicate page bodies drift independently — a bug or a11y fix to sort/filter/compare logic must be applied 2-3 times and is easy to miss (the Casebook already tracks copy-drift here). A senior architect doing due diligence sees copy-paste across a whole domain's pages: "works but doesn't scale." The parts domain will keep this shape as more list variants are added.
- **Recommendation:** Extract the shared list scaffold into a parts-domain composable (fetch + affectedSetCount + compareEntries + filteredEntries + sort-chip state), parameterized by endpoint/labels/CSV columns; collapse the two pages onto it and adopt the generic sort-chip half in `PartsPage`. Dispatch to the Brickwright.

#### G-test-1 — Integration flow tests remain assertion-free — recurring house convention (occurrence 2)

- **Severity:** Medium
- **Location:** 13 integration specs, e.g. `src/tests/integration/apps/families/domains/sets/pages/AddSetPage.spec.ts:67-76` and `.../auth/pages/LoginPage.spec.ts:57-74`; mechanical enabler at `src/tests/integration/helpers/mock-server.ts` (no call log)
- **Standard:** SOP G-6 Gallery candidate (2026-05-05 — integration assertions that only check existence provide no detection advantage over unit tests with stubs); ADR-0024; Casebook standing suspicion "Integration flow tests assertion-free by house convention" (first filed 2026-05-29)
- **Observation:** Each of the 13 form-bearing families integration specs contains exactly one flow test that mounts, fills, submits, flushes, and asserts NOTHING — closed with the boilerplate `// No assertion on navigation — integration tests verify composition, not side effects.` (grep confirms exactly 13 files). `mock-server.ts` (read in full) records no call history — `resolveRoute` never stores/returns the config — so the service POST and resulting navigation cannot be asserted through the mock. This is occurrence 2 against the same convention; remediation WO `2026-05-29-integration-flow-test-assertions` still reads Status: Open. Notably the highest-value behavior — submit→service→navigate — is already covered with detection power at the UNIT layer: `AddSetPage.spec.ts:128` asserts `mockGoToRoute('sets-detail', 42)` plus 422/404/500 branches. The integration flow test adds real-composition wiring but zero detection advantage over the unit test.
- **Impact:** The single most valuable per-page behavior test is an L0 smoke test that cannot fail on a regression in the create/navigate path. A reviewer sees 13 named flow tests that green regardless of whether the form actually submits. Two occurrences of the same structural gap erode confidence in the integration layer's claimed purpose.
- **Recommendation:** Two viable paths for the Steward to route: (a) add a `calls` log to `mock-server` (record method+endpoint+data on each `resolveRoute`) so each flow test asserts the POST body shape and resolved navigation, upgrading L0→L2; or (b) drop the redundant assertion-free flow tests since the unit layer already covers submit→navigate, keeping integration specs focused on composition assertions unit stubs cannot make. Per the Casebook, this is now an escalation candidate.

### Low-Severity Confirmed Findings

#### G-arch-1 — Lint enforcement config still cites pre-merger ADR numbers (recurrence of 2026-05-29 G-arch-2)

- **Severity:** Low (adjusted from candidate medium — impact unchanged, tracked-but-unexecuted recurrence)
- **Location:** `frontend/scripts/lint-vue-conventions.mjs:71,99,191,220,225,246`; `frontend/.oxlintrc.json:277,282,317,352`
- **Standard:** ADR consolidation Phase 5 (decisions.md renumbered pre-merger 001/002/003/005/010 → 0003/0004/0005/0007/0012); Casebook Methodology Note "ADR renumbering / config-string surfaces"
- **Observation:** Two enforcement config surfaces still emit pre-merger ADR numbers in violation messages: lint-vue-conventions checks 4 ("ADR-003"), 6 ("ADR-001"), 7 ("ADR-005"), 8 ("ADR-002"), 9 ("ADR-010"); `.oxlintrc.json` four no-restricted-imports messages cite "ADR-001" for the RouterService ban. The same lint file self-contradicts: checks 6b/6c correctly emit "ADR-0003" for the identical RouterService rule that check 6 labels "ADR-001." Filed as G-arch-2 in the 2026-05-29 sweep; the tracking WO `2026-05-29-warden-sweep-doc-reconciliation` still reads Status: Open with no Build Record — occurrence 2, unfixed.
- **Impact:** When a real violation fires, the developer is pointed at a non-existent ADR number, and the ADR-0003-vs-ADR-001 self-contradiction inside one file undermines trust in the enforcement tooling. For a portfolio piece, stale/contradictory ADR references inside the very code that enforces the ADRs is a visible coherence blemish.
- **Recommendation:** Remap all five stale numbers in both files (001→0003, 002→0004, 003→0005, 005→0007, 010→0012). Occurrence 2 against the same surface — recommend the Steward escalate the Casebook "config-string renumbering" methodology note toward Pulse-tracked closure so the sweep is done once and asserted.

#### G-test-2 — Outbound ADR-0029 conversion has no integration assertion path; mock-server docstring overstates the safety net

- **Severity:** Low (adjusted from candidate medium — capture path exists via `registerRequestMiddleware`; gap is a narrow integration-suite nicety)
- **Location:** `src/tests/integration/helpers/mock-server.ts:11-14` (docstring), `:56-60` (`applyRequestMiddleware` discards mutated config); no integration test observes it
- **Standard:** ADR-0029 (case conversion via HTTP middleware); SOP G-2 ADR-0029 middleware check; SOP G-6 (honest coverage)
- **Observation:** `applyRequestMiddleware` runs registered request middleware then discards the mutated config, and no integration test asserts an outbound payload shape (only inbound snake_case fixtures at SetsOverviewPage.spec.ts:23, StorageOverviewPage.spec.ts:18). The docstring advertises itself as "the regression safety net for ADR-0029." Verification tempered the finding: `mockHttpService.registerRequestMiddleware` (:102-105) DOES let a test append a capture middleware — middleware share one config object and production `deepSnakeKeys` reassigns `config.data`, so a later middleware observes the converted shape — and `deepSnakeKeys` has unit coverage (string.spec.ts:83-111). The docstring is explicitly future-tense ("a future test that asserts… will see faithful conversion"), so it is aspirational, not dishonest. What survives is a narrow gap: integration POSTs are exercised without wire-shape assertions, so a wiring-level regression (http.ts dropping the registration) would slip the integration suite.
- **Impact:** A wiring-level ADR-0029 regression on the outbound side would ship green through the integration gate, though unit coverage and inbound integration fixtures limit the blast radius. Small robustness/coverage gap on a data-critical path.
- **Recommendation:** When the G-test-1 `calls` log is added, store the post-middleware `config.data` and add one integration test submitting a camelCase payload and asserting the captured wire payload is snake_case — closing the outbound assertion gap and making the docstring's claim true. Bundle with G-test-1.

### Low-Severity Observations

Filed for the early-warning system; no rebuttal triggered.

| ID | Wing | Observation |
|---|---|---|
| G-arch-2 | Gallery | `.oxlintrc.json:227` exempts `src/shared/services/storage.ts` from no-console/no-restricted-globals — that file no longer exists (extracted to `@script-development/fs-storage`); dead override protecting a path that cannot match. |
| G-arch-3 | Gallery | Two store modules (`familySetStore.ts`, `storageOptionStore.ts`) bypass the `@app/services` barrel with deep imports (`@app/services/http|loading|storage`) while ~30 domain files use the barrel; also `stores/` dir absent from the CLAUDE.md Blueprint Room. |
| G-arch-4 | Gallery | Seven showcase page components (`ShowcaseHome.vue`, six `*BrickPrototype.vue` in brick-lab) lack the `Page` suffix; the Vue-conventions linter only enforces multi-word PascalCase, so the convention is doc-only and already broken in the one non-shipping app. |
| G-doc-3 | Gallery | CLAUDE.md Linting Standards still lists a "Singleton exemption: `src/shared/services/storage.ts`" for a deleted file; recurrence of 2026-05-29 G-doc-2/G-arch-3, still open. |
| G-doc-4 | Gallery | Blueprint Room `helpers/` comment lists "(string, csv, copy, type-check)" but the directory is `bricklinkWantedList.ts, csv.ts, string.ts, type-check.ts` — phantom `copy` entry, missing `bricklinkWantedList`. |
| G-doc-5 | Gallery | Pulse Overall Health cites 91.70% mutation score while Quality Metrics + Pattern Maturity cite 96.27% after the 2026-06-01 per-file-floor work — one stale copy of a churning figure across three sections. |
| G-doc-6 | Gallery | Pulse hardcodes "19 specs / 143 tests" in three Gallery sections; spec count (19) verified from filesystem, but the 143 test count is duplicated prose that will drift — replace with a runner pointer. |
| G-debt-2 | Gallery | `prevCursor: string \| null` (`types/part.ts:80`) remains a dead field — fourth-plus consecutive carry-forward, already on the Pulse Tech Debt register. |
| G-debt-3 | Gallery | `toPartIdentity` mapper duplicated across `SetDetailPage.vue:223` and `PartsUnsortedPage.vue:59` — same 7-field PartIdentity target, no compile-time link; latent drift on the PlacePartModal contract. |
| G-debt-4 | Gallery | `eslint-disable-next-line` directive in `SettingsPageMembers.spec.ts:186` inside an oxlint codebase — likely dead suppression or a non-canonical disable dialect; the only lint-suppression comment in src. |
| F-doc-2 | Foundry | Floor Plan tree omits the `Feedback/` Actions subdirectory (live routed endpoint) and three real models (ImportJob, InviteCode, Theme); enumeration-style tree reads as drift behind those additions. |
| F-debt-2 | Foundry | Cluster of 95-100 line helper-free `execute()` methods (GetFamilyPartUsageAction, StoreSetPartsAction, GetFamilySetCompletionAction) — aggregation-heavy Actions are the wing's length outliers; consider a documented soft ceiling. |
| F-debt-3 | Foundry | `BelongsToFamilyInterface` remains convention-only despite a fourth consecutive clean check (4/4 non-User family_id models implement it); no arch test asserts the invariant — see ADR Pressure. |
| F-test-2 | Foundry | Three delete-Action tests carry zero `expect()`, relying wholly on permissive-transaction-stub Mockery interactions — thinnest specs in the Foundry; concrete instance of F-test-1. |
| F-test-3 | Foundry | Cross-family denial is exercised end-to-end only as 404 (existence-hiding); policy family-mismatch 403 branches are unit-only, so ADR-0014's defense-in-depth is tested as two independent halves, never layered on the mismatch path. |
| X-adr-0012-1 | Gallery | ADR-0012 thresholds calibrated against 76 test files; suite now at 138 (.spec.ts) — the distribution-shift the Open Question deferred to 700 files is appearing early (baseline-order-sensitive test-guard WARNs). Re-measure before promoting collect-guard to blocking. |
| X-adr-0014-1 | Foundry | ADR-0014 Open Question is ready to close cheaply — `ModelArchitectureTest.php:82-98` already parses `@property $family_id` and asserts a `family()` method; extend it to assert `implements BelongsToFamilyInterface` (User allowlisted). |
| X-adr-0029-1 | Gallery | ADR-0029/SOP G-2 verify middleware *presence* but not *robustness* — a throwing transform on a malformed 200 rejects an already-resolved success. Open WO `2026-07-08-guard-http-transform-middleware` (no Build Record yet) tracks the guard; consider stating in ADR-0029 Enforcement that registered transforms must be guarded. |

---

## Doc Drift

| Document | Claim | Reality | Finding |
|---|---|---|---|
| `backend/CLAUDE.md` (Controllers convention) | "No ResourceData construction — Actions return the shaped data" | ADR-0021 mandates controllers build ResourceData; all controllers + Deptrac conform to the opposite | F-arch-1 (medium) |
| `backend/CLAUDE.md` (Exceptions) | 5 exception→status mappings | `bootstrap/app.php` renders 12 | F-doc-1 (medium) |
| `frontend/CLAUDE.md` (Materials table) | Testing environment is JSDOM | Every Vitest config uses happy-dom; no jsdom dependency | G-doc-1 (medium) |
| `frontend/CLAUDE.md` (Blueprint Room + Services) | shared/services holds http/auth/router/loading/toast/translation factories | Only `auth/` + `sound.ts` remain; five are `@script-development/fs-*` packages; `sound.ts` undocumented | G-doc-2 (medium) |
| `frontend/scripts/lint-vue-conventions.mjs` + `.oxlintrc.json` (messages) | ADR-001/002/003/005/010 citations | Consolidated sequence is 0003/0004/0005/0007/0012 | G-arch-1 (low, recurrence) |
| `frontend/CLAUDE.md` (Linting Standards) + `.oxlintrc.json:227` | Singleton exemption for `src/shared/services/storage.ts` | File deleted; override matches nothing | G-doc-3 / G-arch-2 (low) |
| `frontend/CLAUDE.md` (Blueprint Room helpers) | helpers = string, csv, copy, type-check | actual: string, csv, type-check, bricklinkWantedList | G-doc-4 (low) |
| `backend/CLAUDE.md` (Floor Plan) | Actions/Models enumeration | omits Feedback/ + ImportJob/InviteCode/Theme | F-doc-2 (low) |
| `.claude/docs/pulse.md` (Overall Health vs Quality Metrics) | mutation 91.70% vs 96.27% | one stale copy of a churning figure | G-doc-5 (low) |
| `.claude/docs/pulse.md` (three Gallery sections) | "19 specs / 143 tests" | test count hardcoded in triplicate | G-doc-6 (low) |
| `src/tests/integration/helpers/mock-server.ts:11-14` | "the regression safety net for ADR-0029" | outbound conversion has no integration assertion (aspirational docstring) | G-test-2 (low) |

---

## ADR Pressure

Four ADR-pressure signals surfaced this cycle. The Steward routes for re-interrogation.

### ADR-0028 — Uniform-rule trial doctrine, re-interrogation overdue (GOVERNANCE — medium, X-adr-0028-1)

The 2026-05-27 uniform-rule amendment to ADR-0028 was recorded as **trial** doctrine with three Devil's Court re-interrogation triggers: (1) twenty WOs closed under the uniform rule, (2) the next Warden audit citing ADR-0028 by name, (3) calendar 2026-08-27. **Trigger 2 already fired on 2026-05-29** — the Steward's ruling in `audits/2026-05-29-warden-cross-wing-sweep.md:263` explicitly recorded that the F-doc-1 by-name citation "does fire the re-interrogation trigger — an `/adr-interrogator` re-run is queued," and the 2026-05-29 minutes show it queued then "still pending." No record after 2026-05-29 (standups, minutes, retros, build-records, the ADR itself) shows the re-run executed; ADR-0028 line 6 still reads "remains trial doctrine with a Devil's Court trigger scheduled," and the 2026-07-09 standup affirmatively mis-reports the triggers as not tripped, contradicting the on-file ruling. (The finder's trigger-1 WO-count arithmetic was corrected in verification — ~18-19 uniform-rule closes, under the 20 threshold — but trigger 2 firing is dispositive.) This audit is itself a second by-name citation.

- **Impact:** The firm committed to stress-testing a taste-based doctrine before promoting it to settled. A Devil's Court trigger ruled fired 41 days ago with the mandated re-run never dispatched and its disposition subsequently lost from tracking means the governance ritual advertised as the amendment's safety mechanism is de-facto non-binding — a credibility gap a due-diligence reviewer would notice.
- **Recommendation:** The Steward dispatches the `/adr-interrogator` nine-step re-run on ADR-0028's uniform-rule amendment now, and records the outcome on the ADR per its taxonomy (Confirmed / Strained / Cracked) with a Stress-Tested date.

### ADR-0012 — Test-guard threshold calibration baseline (THRESHOLD — low, X-adr-0012-1)

ADR-0012's Open Question calibrated the 300ms/2000ms thresholds against 76 test files and named 700+ as the re-evaluation horizon. The suite is now at 138 .spec.ts files (~82% growth), and the predicted symptom is already appearing well below 700: the gauntlet flagged 9 collect-duration files and 13 slow test files in warn mode this cycle, all baseline-order-sensitive. Applying the ADR-000 Scale-test lens, the numeric calibration was written for a suite roughly half the current size. The separate 1000-vs-2000ms fail-threshold doc drift was correctly reconciled by the 2026-05-29 amendment — this is about the calibration *baseline*, not that drift. Recommend a lightweight re-measure of the 138-file distribution before the "promote collect-guard to failing" Seed is actioned, rather than a full interrogation.

### ADR-0014 — `BelongsToFamilyInterface` convention-only enforcement (FREQUENCY — low, X-adr-0014-1 / F-debt-3)

Fourth consecutive clean manual check. The enforcement hook the Open Question asks for is already 90% built (`ModelArchitectureTest.php:82-98` parses `@property $family_id` and asserts `family()` exists) — it just stops short of asserting `implements BelongsToFamilyInterface`. This is the cheap moment to close the Open Question and convert a Medium-risk tenant-isolation gap into mechanical enforcement. Recommend the Steward dispatch the small arch-test extension.

### ADR-0029 — registered-but-unguarded transform middleware (LITERAL-COMPLIANCE — low, X-adr-0029-1)

ADR-0029 (and SOP G-2) verify that both transform middleware are *registered*, not that they are *guarded*. Following the ADR literally produces an error-masking seam (a throwing transform on a 200 rejects a resolved success). Open WO `2026-07-08-guard-http-transform-middleware` tracks the fix; consider whether ADR-0029's Enforcement section should require guarded transforms so the SOP G-2 check verifies guarding, not just presence.

---

## Summary

| Wing | Overall Health |
|---|---|
| Foundry | **8 / 10** — Action/Service/Controller architecture, ADR-0015 try-catch roster, and policy/factory parity all clean on independent re-verification. The medium surface is two doc-vs-code drifts (F-arch-1 manual contradicts ADR-0021, F-doc-1 exception map <50% complete), one long-method debt (F-debt-1), and one real test-rigor gap (F-test-1 atomicity boundary unverified in ~14/21 transactional Actions). Down slightly from 8.5 on the atomicity-test gap and the manual-vs-ADR contradiction. |
| Gallery | **7.5 / 10** — strong unit layer (factory mocks, exact-navigation assertions, no weak matchers), full gauntlet green, clean import boundaries and ADR-0029 middleware. Held back by concentrated, due-diligence-visible carry-forwards: JSDOM/happy-dom doc lie, a manual that misdescribes its own service layer, the unresolved Parts copy-paste cluster, and 13 assertion-free flow tests now at occurrence 2. Steady with 2026-05-29 — several of that cycle's WOs remain unexecuted. |

**Finding counts by severity** (reconciled against enumerated IDs before writing):

- **High:** 0
- **Medium:** 9 confirmed — Foundry 4 (F-arch-1, F-doc-1, F-debt-1, F-test-1) · Gallery 4 (G-doc-1, G-doc-2, G-debt-1, G-test-1) · cross-ADR 1 (X-adr-0028-1)
- **Low:** 20 — 2 confirmed findings adjusted to low (G-arch-1, G-test-2) + 18 observations (G-arch-2/3/4, G-doc-3/4/5/6, G-debt-2/3/4, F-doc-2, F-debt-2/3, F-test-2/3, X-adr-0012-1, X-adr-0014-1, X-adr-0029-1)
- **Refuted before filing:** 0

**Showcase readiness:** **Needs polish.** The architectural story (deptrac boundaries, war-room PHPStan rules, typed DTO split, optimistic-locking-with-retry and partial-failure-resilience Actions, domain isolation, factory services, integration tier) is genuinely advanced and would impress. The rough edges are all addressable without structural change: the doc-vs-code divergences a reviewer greps for (F-arch-1, F-doc-1, G-doc-1/2), the carry-forward copy-paste Parts scaffold (G-debt-1), the assertion-free flow tests (G-test-1), the unverified transaction boundaries (F-test-1), and — most visibly for governance — the overdue ADR-0028 re-interrogation (X-adr-0028-1).

**Recommendation:** Dispatch the nine medium findings through the Rebuttal Protocol. Prioritize the two cheapest credibility wins — F-arch-1 (manual-vs-ADR contradiction) and G-doc-1 (JSDOM→happy-dom) — alongside F-test-1 (standardize the transaction stub) which is the one finding touching a real data-integrity guarantee. Execute the three carried-forward 2026-05-29 WOs (G-arch-1 config renumber, G-debt-1 Parts composable, G-test-1 flow-test assertions) rather than re-filing them a third cycle. Route ADR-0028 for the overdue `/adr-interrogator` re-run and close ADR-0014's Open Question via the near-free arch-test extension.

---

## Self-Debrief

**What I caught:**
- Two doc-vs-code contradictions in the wing manuals that would actively misdirect an onboarding Brickwright: `backend/CLAUDE.md` telling controllers *not* to build ResourceData (the exact opposite of ADR-0021 and every controller, and a pattern Deptrac would forbid), and the Materials table naming JSDOM when every config uses happy-dom. Both are load-bearing-vs-narrative drift.
- A genuine test-rigor gap (F-test-1): atomicity boundaries permissively stubbed in ~14 of 21 transactional Actions, a class Infection does not backstop. Verification corrected the finder's overstated scope ("~19 of 20" → 14/21) without defeating the substance — the finding is stronger for being precise.
- The governance miss that matters most: an ADR-0028 Devil's Court trigger the Steward *ruled fired* on 2026-05-29, with the mandated re-run never executed and its disposition lost from tracking, while the current standup mis-reports the triggers as untripped.
- Recorded the Foundry code side as clean (arch/policy/factory parity) rather than padding the count, and confirmed the F-debt-1 EAGER_LOAD suspicion from 2026-05-29 is now *resolved* in code.

**What I missed / did not verify (finder constraints):**
- No heavy gauntlets were run by the finder dimensions (coverage %, mutation score, feature-coverage, integration suite, size, lint:vue) — owned by the dedicated gauntlet pass, listed honestly as skipped. F-test-1's real backstop question (do surviving mutants exist on delete/upsert Actions?) needs the mutation report.
- The Pulse "143 tests" / "242 mutants" / live 96.27% figures (G-doc-6, G-doc-5) were flagged as hardcoded-count risk rather than re-derived — the integration/mutation runs were out of finder scope.
- Live collect/test-guard per-file deltas were captured only at warn level by the gauntlet pass; the standing AboutPage/ComponentGallery/SetsOverview Casebook entries remain the items to re-measure.

**Methodology gaps:**
- The wing-manual coding-convention *bullets* (not just tables/counts) are a doc-drift surface: F-arch-1 was a convention bullet directly contradicting an ADR, which SOP F-3's manifest-accuracy checks (counts, routes, cascades) do not explicitly target. A "convention bullets vs ADRs" cross-check would have surfaced it deterministically.
- Three 2026-05-29 medium findings recurred this cycle with open, unexecuted WOs (G-arch-1, G-debt-1, G-test-1). Re-filing is correct but the recurrence itself is the signal — the Casebook, not just the audit, should drive escalation when a tracked WO goes unexecuted across a full cycle.

**Training proposals (candidates, evidence = this audit):**
1. *SOP F-3 should add a convention-bullet-vs-ADR cross-check:* for each Coding-Convention bullet in `backend/CLAUDE.md` that touches an ADR's territory, confirm it agrees with the ADR's canonical example. Evidence: F-arch-1 (a convention bullet contradicting ADR-0021 that manifest-count checks would never catch).
2. *SOP F-5 should assert the transaction boundary is a required interaction:* when auditing Action unit tests, flag any transactional Action whose test stubs `ConnectionInterface::transaction` without a counted expectation. Evidence: F-test-1 (14/21 Actions leave atomicity untested behind a passthrough stub).
3. *Cross-wing: when a medium finding recurs against an open, unexecuted WO, escalate the WO's non-execution as its own finding* rather than only re-filing the technical finding. Evidence: G-arch-1, G-debt-1, G-test-1 all carried forward from 2026-05-29 with WOs still Status: Open.

**Methodology note — adversarial-verification fan-out:** this sweep was machine-fanned-out across nine SOP dimensions; every candidate finding was independently re-verified against source before filing, and **0 findings were refuted** in that pass. Two candidate mediums were *adjusted down* to low (G-arch-1 recurrence, G-test-2 outbound gap) and one (F-test-1) had its scope corrected while holding at medium — the verifier calibrated severity and precision without killing substance. Consistent with the 2026-05-29 signal, the zero-refutation-but-adjustments pattern indicates tightly-scoped, evidence-backed candidates. The verifier still has not *refuted* a candidate outright across two sweeps — the Steward's standing calibration caveat (it is not proven until it kills something) remains open and worth watching.

---

## Steward Evaluation

**Evaluated:** 2026-07-09, fresh review against source after the sweep landed.

### Verification

Spot-checked every headline finding against source; all held:

- **F-arch-1 confirmed** — ADR-0021:39 shows `FamilySetResourceData::from($familySet)->toResponseWithStatus(201)` inside a controller as the canonical example; the `backend/CLAUDE.md` Controllers bullet asserts the exact opposite. The ADR and all controllers agree with each other; the manual is the outlier.
- **G-doc-1 confirmed** — `environment: 'happy-dom'` in all three `vitest.config.ts` project blocks and `vitest.integration.config.ts:21`.
- **F-test-1 confirmed** — `DeleteFamilySetActionTest.php:14` carries the permissive `allows('transaction')->andReturnUsing(...)` passthrough exactly as filed.
- **X-adr-0028-1 confirmed** — the 2026-05-29 audit's Dispositions section explicitly rules the trigger fired ("does fire the re-interrogation trigger — an `/adr-interrogator` re-run is queued"). The 2026-07-09 standup's "not yet tripped" line was wrong; a correction is appended to that standup.
- **Counts reconciled** — 9 medium and 20 low both match the enumerated IDs exactly. No self-counting slip this cycle.
- **0-refutation calibration caveat stands** — but the verifier downgraded two mediums and corrected F-test-1's scope (~19/20 → 14/21), so the skeptic layer demonstrably exercised judgment. It still has not killed a candidate outright across two sweeps; the caveat remains open.

### Standup-priority coverage check

The four priorities carried in from the 2026-07-09 standup, plus one supplement:

1. **Pulse refresh** — evidence delivered; Steward folded ratings (Foundry 8, Gallery 7.5), Assessed dates, and the G-doc-5/G-doc-6 Pulse-internal fixes into `pulse.md` this same follow-up.
2. **fs-form / fs-* extraction drift** — covered by G-doc-2/G-doc-3/G-arch-2: the manual still describes the pre-extraction service layout and a dead `storage.ts` lint exemption survives. Dispatched.
3. **Pre-merger vocabulary leak (occurrence 3)** — **verified remediated, not re-filed.** `PrePushPermitGate.php` "shift log"/"Director" strings were removed in PR #145; "Brick & Mortar" is gone from showcase `App.vue`; the remaining "Brick Brutalism" string is the sanctioned design-system name (Pulse Pattern Maturity), not a leak. The Casebook Recurring Pattern can be crossed out with this evidence.
4. **ADR-0012 threshold drift** — covered as X-adr-0012-1 with a sharper framing (calibration baseline vs suite growth). Re-measure before actioning the collect-guard Seed.
5. **Supplement (Steward-added, outside sweep scope):** `npm audit` reports **form-data 4.0.0–4.0.5, high, CRLF injection (GHSA-hmw2-7cc7-3qxx)** — surfaced during the 2026-07-09 environment sync; npm-audit was not in the sweep's gauntlet set. Filed as WO `2026-07-09-form-data-advisory-patch`.

### Dispositions

- **Dispatched now (new WOs):**
  - [`2026-07-09-warden-sweep-doc-fixes`](../work-orders/2026-07-09-warden-sweep-doc-fixes.md) — F-arch-1, F-doc-1, G-doc-1, G-doc-2 (all four medium doc drifts) + lows F-doc-2, G-doc-3/G-arch-2, G-doc-4.
  - [`2026-07-09-transaction-boundary-test-rigor`](../work-orders/2026-07-09-transaction-boundary-test-rigor.md) — F-test-1, the one finding touching a real data-integrity guarantee. Includes F-test-2 (the three expect-free delete tests).
  - [`2026-07-09-form-data-advisory-patch`](../work-orders/2026-07-09-form-data-advisory-patch.md) — the Steward-supplemented npm advisory.
- **Carried forward, not re-filed** (per the audit's own recommendation — these feed the CEO backlog triage already on the standup slate): G-arch-1 → `2026-05-29-warden-sweep-doc-reconciliation`; G-debt-1 → `2026-05-29-extract-parts-list-composables`; G-test-1 → `2026-05-29-integration-flow-test-assertions`; X-adr-0014-1 → `2026-05-29-family-id-belongs-archtest`. Third-cycle recurrence of the first three is itself the signal — execution, not re-filing.
- **Rebuttal invited:** F-debt-1 — the audit itself asks whether the 162-line `execute()` shape is intentional given the `toBase()` performance path. Brickwright rebuttal before a paydown WO is filed.
- **CEO decision required:** X-adr-0028-1 — the `/adr-interrogator` re-run interrogates the CEO and cannot be dispatched without them. Escalated to the top of the action-item slate; this audit is itself a second by-name citation, so the trigger has now fired twice.
- **Steward-fixed directly (own territory):** Pulse G-doc-5 (stale 91.70% mutation figure) and G-doc-6 (hardcoded test counts) corrected in the same Pulse pass; audit filename/date defect corrected (workflow `args.date` did not reach the script — skill maintenance note).

### Post-evaluation resolution — the `composer test` all-warnings anomaly (same day)

Diagnosed and resolved 2026-07-09 on CEO direction. **Not** a PHP 8.5 deprecation: the host lacked `backend/.env` (never provisioned by `make init`, which only copies the root env file), and phpdotenv's error-suppressed `.env` probe (`@file_get_contents`, `Reader.php:73`, via `LoadEnvironmentVariables → safeLoad()`) surfaced as an unsuppressed `fopen` warning through Pest's `BypassFinals` stream wrapper — PHP's `@` suppression does not extend into userland stream-wrapper internals — once per test boot, hence exactly 728. Two environmental fixes applied: `composer install` (host vendor had silently drifted behind the 2026-07-08 lockfile bumps — bypass-finals 1.10.1 installed vs 1.10.2 locked) and `cp .env.example .env` in `backend/`. Suite now: **728 passed / 2976 assertions, zero warnings.** The `make init` provisioning gap is filed as a low Active Concern in the Pulse. The Warden's "likely a suite-wide PHP 8.5 deprecation" hypothesis was reasonable but wrong — worth a Casebook note that an all-tests-warn signature with a green exit code points at per-test *bootstrap* (env, wrapper, handler), not at code under test.

### Training proposals

The Warden's three proposals (convention-bullet-vs-ADR cross-check; transaction boundary as required interaction; WO non-execution as its own finding) are all accepted into the Casebook's methodology candidates — the third one is effectively already proven by this cycle's triple carry-forward.
