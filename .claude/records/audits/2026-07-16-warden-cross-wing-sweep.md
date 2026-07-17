# Audit — Cross-Wing Freshness Sweep

**Filed:** 2026-07-16
**Auditor:** Quality Warden
**Wing:** Atrium (cross-wing)
**Type:** Freshness sweep (not a bug hunt)
**Scope:** Full — both wings across architecture, doc accuracy, tech debt, and test quality (SOP F-2..F-5 / G-2..G-6), plus cross-wing ADR pressure. No Work Order: Steward-dispatched sweep, machine-fanned-out across nine dimensions (gallery/foundry × arch/doc/debt/test + cross-adr) with adversarial per-candidate verification before filing. Heavy suites owned by a dedicated gauntlet pass; finders did not duplicate slow runs.

---

## Executive Summary

Both wings are structurally sound and the assigned gauntlet is green save for one dev-only formatting gate. The sweep surfaced **no high-severity findings and no code-correctness defects** — every confirmed medium is documentation drift or maintenance debt, not a broken brick. The most important signals: the canonical **decision ledger still stamps a retired ADR as Accepted**, the **Pulse's Overall Health narrative contradicts both the current wing manual and its own Active Concerns section**, and the **Parts-page duplication cluster remains unremediated for a third cycle**. Two standing Casebook suspicions (ADR-0014 interface enforcement, ADR-0018 EAGER_LOAD coverage) are now **resolved in code** by shipped architecture tests.

| Dimension | Verdict |
|---|---|
| Foundry — Architecture (SOP F-2) | **Clean** — Actions/Services/Controllers fully comply; ADR-0015 try-catch roster reconciled (7 sites / 7 Actions) |
| Foundry — Doc Accuracy (SOP F-3) | **Drifted** — retired ADR-0028 still "Accepted" in decision index (medium); two manifest count gaps (low) |
| Foundry — Tech Debt (SOP F-4) | **Clean** — one oversized `execute()` outlier (low); no TODO/FIXME; ADR-0017 clean |
| Foundry — Test Quality (SOP F-5) | **Clean** — policy/test parity holds; transaction-boundary suspicion resolved; two low hardening notes |
| Gallery — Architecture (SOP G-2) | **Clean** — import/domain/router/factory boundaries hold; three low forward-looking observations |
| Gallery — Doc Accuracy (SOP G-3) | **Drifted** — Pulse Overall Health stale on two counts (medium ×2); manual factory list lags tree (low) |
| Gallery — Tech Debt (SOP G-5) | **Drifted** — Parts-page duplication cluster, third cycle unremediated (medium ×2); carry-forward lows |
| Gallery — Test Quality (SOP G-6) | **Clean** — G-test-1 flow-assertion suspicion resolved (PR #280); edit-flow coverage tail remains (low) |
| Atrium — Cross-ADR Pressure | **Pressure detected** — ADR-0012 calibration stale + frequency signal (medium); ADR-0014 / ADR-0018 resolved-in-code |
| Cross-Wing — Showcase Readiness | **Needs polish** — strong foundation; due-diligence-visible rough edges concentrated in docs + Parts duplication |

---

## Quality Gauntlet Results

Ten real gates run by the dedicated gauntlet pass. Foundry fully green. Gallery green on every dispatched gate except `format:check`. Heavy gates (coverage, mutation, size, lint:vue, integration) were outside the dispatched set and are marked skipped honestly — no silent caps.

| Wing | Command | Status | Detail |
|---|---|---|---|
| Foundry | `composer lint:test` | **pass** | Rector "done" no diffs; Pint passed. Exit 0. |
| Foundry | `composer phpstan` | **pass** | Level max + Larastan + war-room rules. 0 errors. |
| Foundry | `composer deptrac` | **pass** | 0 violations, 753 allowed, 598 uncovered (informational). Exit 0. |
| Foundry | `composer test:arch` | **pass** | 114 passed / 2005 assertions in 3.92s. |
| Foundry | `composer test` | **pass** | 687 passed / 3045 assertions in 21.55s (after `config:clear`). |
| Gallery | `npm run format:check` | **FAIL** | 5 committed dev-only showcase `.vue` files unformatted (exit 1); working tree clean → committed drift. See G-gauntlet-1. |
| Gallery | `npm run lint` | **pass** | Exit 0. ~16 non-blocking warnings (function-scoping/import-style in specs). Zero errors. |
| Gallery | `npm run type-check` | **pass** | vue-tsc --build clean. Exit 0. |
| Gallery | `npm run knip` | **pass** | No unused files/exports/deps. |
| Gallery | `npm run test:unit` | **pass** | 117 files / 1435 tests in 24.70s. TEST GUARD warned (non-failing per ADR-0012) on 9 files >300ms (SetsOverviewTheme 447ms … SetDetailPage 305ms). |

| Command | Wing | Skipped because |
|---|---|---|
| `composer test:coverage` | Foundry | Not in dispatched set; 100% unit gate owned by a heavier pass (host needs pcov). |
| `composer test:feature-coverage` | Foundry | Not in dispatched set. |
| `composer mutation` | Foundry | Heaviest gate; deliberately out of scope. |
| `npm run lint:vue` | Gallery | Custom Vue-conventions linter not in dispatched set. |
| `npm run size` | Gallery | size-limit not in dispatched set. |
| `npm run test:coverage` / `test:integration` | Gallery | `test:unit` run as the representative test pass. |

**Scope attribution:** the single gate failure (`format:check`) is **pre-existing committed drift**, not caused by any audited scope — the working tree is clean, so the malformed files were committed earlier and slipped CI because `format:check` is absent from the pre-push gauntlet (`type-check → knip → test:coverage → test:integration → build`). Filed as G-gauntlet-1 (low). All other gates green.

---

## Findings

Medium-severity findings are rebuttal candidates. Every candidate was adversarially verified against source before filing; verification notes summarized inline. Low findings are observations, not accusations.

### Foundry Wing

#### F-doc-1 — Retired ADR-0028 still stamped "Accepted" in the canonical decision index

- **Severity:** Medium
- **Location:** `.claude/docs/decisions.md:42` (vs `.claude/docs/adr/0028-pre-push-permit-verification.md:6`)
- **Standard:** decisions.md self-documented protocol ("Update this index in the same commit"); ADR-0028 file Status field
- **Observation:** The decision-index row reads `| 0028 | Pre-push permit verification gate … | Accepted |`, but ADR-0028 was retired 2026-07-16 (PR #281, `dd5b867`, Devil's Court "Cracked at root"). The ADR file header (line 6) now reads `Status: retired (gate removed 2026-07-16 …)`, matching both wing manuals, root CLAUDE.md, and the Pulse Pattern Maturity table (`pulse.md:119` → "Retired"). `git log -- .claude/docs/decisions.md` confirms the retirement commit touched the ADR file, ADR-000, learnings, skills, workflows, and both CLAUDE.md manuals — but **not** decisions.md. The index already proves it can carry a non-Accepted lifecycle status (ADR-0006 row reads "Superseded by 0029"), so this is un-propagated drift, not a formatting limitation. **Surfaced independently by two finder dimensions** (foundry-doc and cross-adr) — strong signal.
- **Impact:** The decision ledger is the showcase-facing source of truth for what is binding. A due-diligence architect cross-reading decisions.md against the ADR body finds them contradicting each other on the exact question ADRs exist to answer — is this decision live? It also risks a future Brickwright re-implementing a permit gate the firm deliberately killed. This is the discipline gap ADR-0028 itself was created to close.
- **Recommendation:** Update decisions.md:42 Status column to `Retired 2026-07-16` (mirroring the "Superseded by" convention on the ADR-0006 row). Steward dispatches as a doc-fix Work Order — knowledge-base edit outside Warden write scope.

#### F-doc-2 — Pulse "at a glance" table hardcodes 29 ADRs against a documented 30

- **Severity:** Low
- **Location:** `.claude/docs/pulse.md:217`
- **Standard:** decisions.md Decision Index ("30 ADRs", rows 0001–0030); pulse.md:11 anti-hardcoding directive ("ADR counts come from decisions.md … Duplicating these numbers here guarantees drift")
- **Observation:** The Foundry metrics row states `| ADRs documented | 29 (0001–0029, consolidated) |` while its own cited source (decisions.md) opens with "30 ADRs" and carries ADR-0030 (subagent-write path permission, Atrium, 2026-05-25). The Pulse's own methodology note explicitly forbids hardcoding ADR counts for precisely this reason.
- **Impact:** Minor off-by-one drift, but it violates the anti-hardcoding rule the Pulse states about itself — the exact class of drift the directive exists to prevent.
- **Recommendation:** Replace the hardcoded figure with a pointer to decisions.md, or bump to 30. Steward-owned Pulse edit.

#### F-doc-3 — "4 custom war-room rules" understates a package registering ~14

- **Severity:** Low
- **Location:** `backend/CLAUDE.md` — "Heavy Machinery & Suppliers" table, Static Analysis row
- **Standard:** `vendor/script-development/phpstan-warroom-rules/extension.neon` (registered rule set); `backend/phpstan.neon` includes
- **Observation:** The table advertises "PHPStan at level `max` with Larastan + 4 custom war-room rules." The vendored package registers ~14 distinct Rule classes (EnforceActionTransactionsRule, ForbidDatabaseManagerInActionsRule, ForbidHttpExceptionInActionsRule, EnforceFormRequestToDtoRule, ForbidEloquentMutationInControllersRule, ForbidResourceWrappedInJsonResponseRule, LogBuilderTruncateRule, …). The Pulse (line 112) separately names only 3. Three different numbers (4 / 3 / ~14) describe one rule set.
- **Impact:** The count *understates* the wing's static-analysis sophistication — a reviewer counting registered rules finds 14, undercutting rather than overselling. Also a maintenance smell: a hardcoded count of a growing vendored package will keep drifting.
- **Recommendation:** Replace the fixed count with a qualitative description or derive it from extension.neon. Steward-owned wing-manual edit.

#### F-debt-1 — `GetFamilyMissingPartsAction::execute()` is a ~160-line method, the Actions-layer outlier

- **Severity:** Low
- **Location:** `backend/app/Actions/FamilySet/GetFamilyMissingPartsAction.php:28-189`
- **Standard:** `backend/CLAUDE.md` Actions convention ("Single `execute()` method — one procedure, one job") + Showcase Readiness (pattern consistency). No hard method-length gate exists in the Foundry, so this is a smell, not a violation.
- **Observation:** `execute()` runs five raw SQL aggregate queries (Q1–Q5) plus three inline transformation loops in a single body; the class has exactly one two-line private helper (`key()`). Peer Actions of comparable size decompose: ImportOwnedSetsAction (212 lines) → 7 helpers; GetBrickDnaAction (205 lines) → 4 compute* helpers. This is the most logic-dense method in the layer, sitting entirely inline.
- **Impact:** Maintainability + showcase readiness — a reviewer sees uniform decomposition everywhere except this one method, which reads as "got lazy here." The shortfall business logic is harder to unit-test in isolation while inline.
- **Recommendation:** Extract the Q4 needed-by-set map, the shortfall reconciliation loop, and Q5 unknown-set detection into private helpers to match peer Actions. Refactor Work Order for the Brickwright; not blocking.

#### F-test-1 — Recursive cascade test asserts child *is* deleted but not child-*before*-parent ordering

- **Severity:** Low
- **Location:** `backend/tests/Unit/Actions/StorageOption/DeleteStorageOptionActionTest.php:57-87` (`it('should recursively delete children')`)
- **Standard:** SOP F-5 (assertion depth L2/L3) + ADR-0016 explicit cascade deletion. `DeleteStorageOptionAction::deleteRecursive()` deletes children depth-first specifically so a parent row is never removed before its `parent_id`-referencing children.
- **Observation:** The test proves child and parent `->delete()` each fire `->once()`, but uses no `->ordered()` and no `$events` array — it does NOT assert children are deleted BEFORE the parent. A regression reordering `deleteRecursive()` to delete the parent first (an FK-integrity bug) would still satisfy every `->once()` expectation. This is the single most order-sensitive path in the file, yet the only test that omits the `$events`-ordering idiom the three sibling tests already use.
- **Impact:** An FK-order regression on the hierarchical storage-delete path would ship undetected by this unit test; on real Postgres it surfaces as an FK violation or orphaned rows during a family's storage cleanup. Low because current code is correct.
- **Recommendation:** Add child-before-parent ordering assertions using the same `$events` idiom (`expect($events)->toBe(['child:delete','parent:delete'])`) or Mockery `->ordered()`. Harden the test; do not touch the code.

#### F-test-2 — `TestConventions` "it should" check verifies only one compliant block per file

- **Severity:** Low
- **Location:** `backend/tests/Architecture/TestConventionsArchitectureTest.php:15-26`
- **Standard:** SOP F-5 (describe() + it('should …') consistently). The check is intended to guarantee the convention suite-wide.
- **Observation:** The naming check uses `preg_match` (first-match) and asserts `->toBe(1)` — it passes any file containing at least ONE `it('should …')` block, regardless of how many sibling `it()` blocks deviate. It also scans only Feature/Unit, exempting Architecture tests. Actual Feature/Unit state is currently 100% compliant (independent grep found zero non-'should' descriptors), so the weakness is latent.
- **Impact:** The arch test advertises a suite-wide naming guarantee it does not deliver; non-compliant descriptors could accrue silently as long as one block stays compliant. Low because current state is clean.
- **Recommendation:** Tighten to `preg_match_all` every `it()` opener and assert each starts with "should"; decide whether Architecture-test descriptors are held to the convention or explicitly exempted. Enforcement-robustness improvement, not active drift.

### Gallery Wing

#### G-doc-1 — Pulse Overall Health cites a JSDOM manual defect the manual no longer contains

- **Severity:** Medium
- **Location:** `.claude/docs/pulse.md:21` (Overall Health, Gallery, Assessed 2026-07-09) — contradicted by `frontend/CLAUDE.md:28` and `vitest.config.ts:9,19,29` / `vitest.integration.config.ts:21`
- **Standard:** Pulse rule "Keep entries factual and concise"; SOP G-3 (CLAUDE.md conventions match code/docs)
- **Observation:** The Gallery Overall Health paragraph holds back the rating partly because the wing manual "claims JSDOM (happy-dom is actual)." A `grep -i jsdom` over the manual and all vitest configs returns zero hits; `frontend/CLAUDE.md:28` reads "Vitest + @vue/test-utils (happy-dom)" and all four environment declarations resolve to happy-dom. The doc-fix the same paragraph says was "dispatched 2026-07-09" demonstrably landed (commit `cb62c6e`, PR #252). The rating rationale was never refreshed.
- **Impact:** The Pulse is docking the Gallery rating on a manual defect that no longer exists. A due-diligence reader cross-referencing Pulse against the manual finds the criticism contradicted, undermining trust in the living snapshot Brickwrights read first.
- **Recommendation:** Remove the JSDOM clause from the Overall Health Gallery paragraph and re-assess whether the hold-back still applies; bump the Assessed date. Steward commits.

#### G-doc-2 — Pulse internally contradicts itself on the form-data advisory (open vs closed)

- **Severity:** Medium
- **Location:** `.claude/docs/pulse.md:21` (Overall Health, Assessed 2026-07-09) vs `.claude/docs/pulse.md:39` (Active Concerns, Closed 2026-07-16)
- **Standard:** Pulse rule "Overwrite sections with current state"; SOP G-3 doc accuracy
- **Observation:** The Overall Health paragraph ends "one high `form-data` npm advisory open (WO filed)." The Active Concerns section (line 39) records the same advisory (GHSA-hmw2-7cc7-3qxx) "Closed 2026-07-16" because the lockfile resolves form-data 4.0.6, outside the advisory range. The 2026-07-16 edit updated the fact in Active Concerns but left the Overall Health narrative asserting the opposite — an intra-file contradiction.
- **Impact:** Two sections of the same living doc report opposite states for the same security advisory. A reader relying on the Overall Health summary (read first) believes a high-severity advisory is open when it was closed and verified during shift-001 roll-call.
- **Recommendation:** Refresh the Overall Health Gallery paragraph — drop the open-advisory clause and bump its Assessed date, or add a closure note pointing to line 39. Steward commits.

#### G-debt-1 — Sort-chip machinery triplicated across the three Parts pages with no shared composable

- **Severity:** Medium
- **Location:** `frontend/src/apps/families/domains/parts/pages/PartsPage.vue`, `PartsMissingPage.vue`, `PartsUnsortedPage.vue`; no shared home in `frontend/src/shared/composables/` (only `useBrickPickup.ts`)
- **Standard:** SOP G-5 (duplicated patterns that should be in shared); Showcase Readiness (copy-paste is a due-diligence red flag); Casebook G-debt-1 cluster + unexecuted 2026-05-29 Parts-composable WO
- **Observation:** All three Parts pages independently declare the same apparatus: a `SortField` union, `activeSortField` ref, `setSortField` mutator, `sortLabelKey` Record, `allSortFields` array, a compare/sort computed, and an identical `v-for="field in allSortFields"` FilterChip block. Missing and Unsorted share the exact `'shortfall'|'name'|'color'` triple with byte-identical compare logic. `shared/composables/` contains only `useBrickPickup.ts`. The 2026-05-29 extraction WO remains unexecuted; the duplication is confirmed present this cycle. (Verifier nit: "fetch machinery triplicated" is slightly overstated — PartsPage's cursor-paginated fetch differs; fetch is duplicated only between Missing/Unsorted. The sort-chip triplication claim is unambiguous.)
- **Impact:** Every sort-behavior change must be made in three places and can silently diverge. knip cannot detect structural duplication. For a portfolio piece this reads as "got lazy in places," undercutting the otherwise-strong shared-warehouse story.
- **Recommendation:** Extract a `useSortChips<Field>()` composable into `shared/composables/` owning activeSortField/setSortField/allSortFields/sortLabelKey and the compare wiring, consumed by all three pages. Treat the unexecuted 2026-05-29 WO as the vehicle. Fix is the Brickwright's job.

#### G-debt-2 — `PartsMissingPage` and `PartsUnsortedPage` are near-duplicate pages hitting the same endpoint

- **Severity:** Medium
- **Location:** `frontend/src/apps/families/domains/parts/pages/PartsMissingPage.vue` vs `PartsUnsortedPage.vue` — both call `familyHttpService.getRequest<MasterShoppingListResponse>('/family-sets/missing-parts')` (Missing:30, Unsorted:45)
- **Standard:** SOP G-5 (duplicated patterns / high-duplication files); Showcase Readiness (copy-paste divergence)
- **Observation:** The two pages share the same data source, the same `MasterShoppingListEntry` shape, the same fetch/loading/error scaffolding, sort machinery, filtering, and totals reducer (`totalShortfall` vs `totalToPlace`, identical reduce over `entry.shortfall`). The Unsorted docstring even admits reusing the endpoint that powers PartsMissingPage. The only substantive divergences are the action path: Missing emits a BrickLink wanted-list XML; Unsorted wires a PlacePartModal + toast + refetch. ~70% identical scaffolding.
- **Impact:** Two pages double the maintenance and test surface; the shared endpoint semantics ("missing" vs "to place") are encoded only in page-local naming — a backend contract change touches both. A parallel-page divergence a due-diligence reviewer flags as unscaled structure.
- **Recommendation:** Consider a shared shopping-list page composable (or a single parameterized page) owning fetch + sort + filter + totals, with the two action variants injected. At minimum document the intentional split. Report-only.

#### G-gauntlet-1 — `format:check` fails on 5 committed showcase files that bypassed CI

- **Severity:** Low
- **Location:** `frontend/src/apps/showcase/components/` — DialogServiceDemo.vue, FormValidationWorkbench.vue, MiddlewarePipelineVisualizer.vue, ResourceAdapterPlayground.vue, ToastServiceDemo.vue
- **Standard:** `frontend/CLAUDE.md` Formatting Standards ("Non-compliance is a code violation"); oxfmt config `.oxfmtrc.json`
- **Observation:** `npm run format:check` exits 1 on 5 committed dev-only showcase `.vue` files; the working tree is clean, so this is committed drift, not WIP. It slipped CI because `format:check` is absent from the pre-push gauntlet (`type-check → knip → test:coverage → test:integration → build`), and pre-commit only formats *staged* files. Fixable with a plain `oxfmt` run.
- **Impact:** Showcase is dev-only and never ships, so no production exposure — but a documented gate failing on committed code demonstrates a real CI blind spot: formatting drift can enter `main` undetected. A reviewer running `format:check` during due diligence sees a red gate.
- **Recommendation:** Brickwright runs `oxfmt` on the five files. Separately, the Steward may consider whether `format:check` belongs in the pre-push gauntlet to close the CI blind spot (that is a decision, not a finding).

#### G-doc-3 — Manual platform-factory list omits fs-dialog and fs-theme

- **Severity:** Low
- **Location:** `frontend/CLAUDE.md:58` and `frontend/CLAUDE.md:108`; vs package.json deps + `src/apps/families/services/dialog.ts`, `theme.ts`
- **Standard:** SOP G-3 doc accuracy; recurring "enumerations lag the tree" pattern (Casebook Recurring Patterns, ~6th occurrence)
- **Observation:** Both manual enumerations of the `@script-development/fs-*` platform factories omit fs-dialog and fs-theme, which are declared dependencies and actively instantiated in families services (dialog.ts → `createDialogService`, theme.ts → `createThemeService`). The manual is internally inconsistent — its own families-instantiation list (line 106) names both "dialog" and "theme" but the factory breakdown does not attribute their fs-* origin.
- **Impact:** A reviewer sees two fs-* packages in package.json and the services directory the manual's factory catalog does not account for. Low functional risk; feeds the recurring enumeration-drift pattern the Casebook tracks toward escalation.
- **Recommendation:** Add fs-dialog and fs-theme to both the Blueprint Room comment (line 58) and the Platform factories bullet (line 108). Steward commits.

#### G-arch-1 — ADR-0029 both-sides middleware wiring is convention-only — no arch test enforces it per API-consuming app

- **Severity:** Low
- **Location:** `frontend/src/apps/families/services/http.ts:12-18`; `frontend/src/tests/unit/architecture.spec.ts` (984 lines, 18+ arch rules, none for ADR-0029)
- **Standard:** ADR-0029 (case conversion via HTTP middleware) + SOP G-2 ("Missing either side is a regression") + ADR-000 automation lens
- **Observation:** families/services/http.ts correctly registers both sides (request `deepSnakeKeys` FormData-skipped line 13; response `deepCamelKeys` non-object-skipped line 17) and is the only app with an http.ts today. architecture.spec.ts enforces 18+ conventions but has no rule verifying each app instantiating an http service registers both middleware sides. Enforcement rests on a developer copying the pattern.
- **Impact:** Zero live risk — the single consumer is correct. But when admin (today a stub) grows API calls or a fourth app is added, one middleware side could be silently omitted and every gate would pass, while SOP G-2 classifies that as a regression. A senior architect would ask how case-conversion is guaranteed at app #4.
- **Recommendation:** Consider an architecture-test rule asserting that every `apps/*/services/http.ts` registering an http service wires both a `deepSnakeKeys` request and `deepCamelKeys` response middleware. Framed for the Steward as ADR-0029 automation-lens pressure, not a current violation. See ADR Pressure.

#### G-arch-2 — Showcase carries retired pre-merger brand strings ("Brick & Mortar", "Brick Brutalism")

- **Severity:** Low
- **Location:** `frontend/src/apps/showcase/App.vue` — nav "Brick & Mortar" and footer "Brick Brutalism"
- **Standard:** Brickworks vocabulary lock (`docs/vocabulary-lock.md`) + Casebook standing entry [Atrium] Pre-merger vocabulary leak (occurrence 3)
- **Observation:** The showcase nav and footer still hardcode the retired pre-merger frontend brand (Brick & Mortar Associates), not the post-merger Brickworks identity. This is the exact instance the Casebook logged in the 2026-05-29 sweep as occurrence 3 of the pre-merger vocabulary leak; it remains unfixed.
- **Impact:** Showcase is dev-only and never ships, so no customer exposure. Still a portfolio blemish — the design-system showroom, the surface most likely shown to a prospective client, displays a dead brand. Reinforces a recurring pattern already at the structural-problem threshold.
- **Recommendation:** Replace the two strings with current Brickworks / Gallery branding. Steward may fold into the already-recommended vocabulary-leak sweep. Out of core G-2 scope; reported for completeness.

#### G-arch-3 — Admin app omits the documented per-app `services/` directory

- **Severity:** Low
- **Location:** `frontend/src/apps/admin/` (no services/ dir; only App.vue, domains/home, index.html, main.ts, router)
- **Standard:** `frontend/CLAUDE.md` Blueprint Room structure (each app carries a services/ directory)
- **Observation:** Admin is a genuine stub (HomePage.vue is a single h1; App.vue uses only the shared NavLink component and its own RouterService). No API calls, auth, or services are needed yet, so the omission is intentional and harmless. Families fully matches the documented structure.
- **Impact:** No functional or boundary risk today. Noted only because a reviewer comparing the Blueprint Room diagram against the tree would see the deviation; it is the same growth point as G-arch-1.
- **Recommendation:** No action now. Track alongside G-arch-1 — whenever admin gains its first API call it should acquire `services/http.ts` registering both ADR-0029 middleware sides plus a barrel `index.ts`.

#### G-debt-3 — Dead `prevCursor` type field, sixth consecutive cycle unresolved

- **Severity:** Low
- **Location:** `frontend/src/apps/families/types/part.ts:80` — `prevCursor: string | null;`
- **Standard:** SOP G-5 (dead fields knip cannot see); Pulse Tech Debt register (Gallery); Casebook "Persistent low-severity open items"
- **Observation:** `prevCursor` remains declared with the standing comment "API returns prevCursor but pagination is forward-only; retained for type accuracy." A repo-wide grep confirms it is read nowhere in production (declaration site only). knip does not flag it — it is a used-type member, not an unused export. Sixth consecutive inspection carrying it.
- **Impact:** Negligible functional risk, but a carry-forward item surviving six cycles erodes trust in the paper trail.
- **Recommendation:** Resolve one way — remove the field, or convert the inline comment into an explicit "wire-shape parity, intentionally UI-unused" decision so it stops resurfacing. Already in the Pulse register — no new WO needed, just closure.

#### G-debt-4 — `SetDetailPage.loadParts` sits near nesting-depth and function-length ceilings with duplicated multi-exit cleanup

- **Severity:** Low
- **Location:** `frontend/src/apps/families/domains/sets/pages/SetDetailPage.vue:118-184` (`loadParts`)
- **Standard:** SOP G-5 (high-complexity files, deep nesting); `frontend/CLAUDE.md` Complexity Limits (nesting 4, lines/function 80)
- **Observation:** `loadParts` is a ~66-line async function with a polling `for` loop containing a nested `try` and two `if` levels (for→try→if→if reaches the depth-4 ceiling) plus a second trailing try/catch. Three status refs (`partsSyncing`, `partsLoading`, `partsError`) are reset manually across three separate exit paths. It passes lint, so this is a smell, not a violation.
- **Impact:** One refactor from breaching two ceilings; the manually-duplicated state-reset across three exits is a bug seam — a future added exit path can forget to clear a ref, leaving a stuck spinner or stale error with no compiler help.
- **Recommendation:** Consider a `finally`-based cleanup or a small state-reset helper so the three exit paths cannot diverge, and/or extract the poll loop. Maintainability watch-item for when this file is next touched.

#### G-test-1 — Edit-flow integration tests bypass the transport boundary and assert a bare, argument-less mutation call

- **Severity:** Low
- **Location:** `frontend/src/tests/integration/apps/families/domains/sets/pages/EditSetPage.spec.ts:22-40,94-107`; `.../storage/pages/EditStoragePage.spec.ts:92-105`
- **Standard:** SOP G-6 (behavior over implementation, mock minimalism); ADR-0029 (request-side snake_case conversion); ADR-0024 (page integration tests, mocked services at the boundary)
- **Observation:** PR #280 gave create/add flows full outbound coverage (AddSetPage asserts `callsTo('POST','family-sets')` with a snake_case `toMatchObject` and `not.toHaveProperty('setNum')`). The two edit flows did not get the same treatment: they stub the adapter-store's internal `patch()` method directly and assert only `expect(mockPatch).toHaveBeenCalled()` — a bare call check with no argument matcher — plus navigation. Because the store method is stubbed, the PATCH never reaches mock-server, so the outbound wire shape (snake_case conversion, correct fields, correct id) for update flows is never exercised.
- **Impact:** The residual tail of the resolved G-test-1/G-test-2 suspicions: update flows have zero detection power on the outbound payload — a broken edit-submit (dropped field, wrong id, un-converted camelCase key) navigates successfully and passes green. Inconsistent remediation depth (create flows L3, edit flows L1/L2) and a mock-minimalism smell. Not a documented-standard violation, hence low.
- **Recommendation:** Route the edit flows through mock-server like the add flows (register onPatch/onPut, let the real `patch()` run, assert `callsTo('PATCH', …)` with a snake_case `toMatchObject` and a `not.toHaveProperty` camelCase check). If the store stub must stay for the Adapted-ref reactivity workaround, at minimum tighten to `toHaveBeenCalledWith(<expected payload>)`.

---

## Doc Drift

| Doc | Location | Claim | Reality | Finding |
|---|---|---|---|---|
| decisions.md | :42 | ADR-0028 Status "Accepted" | ADR file + Pulse + both manuals say "Retired 2026-07-16" (PR #281) | F-doc-1 (medium) |
| pulse.md | :21 | Gallery rating held back by manual "claims JSDOM" | Manual + all vitest configs read happy-dom; doc-fix landed PR #252 | G-doc-1 (medium) |
| pulse.md | :21 vs :39 | form-data advisory "open (WO filed)" | Same advisory "Closed 2026-07-16" one section down | G-doc-2 (medium) |
| pulse.md | :217 | "29 ADRs (0001–0029)" | decisions.md documents 30 (through ADR-0030) | F-doc-2 (low) |
| backend/CLAUDE.md | Static Analysis row | "4 custom war-room rules" | extension.neon registers ~14 | F-doc-3 (low) |
| frontend/CLAUDE.md | :58, :108 | fs-* factory list (6 named) | fs-dialog + fs-theme also present and instantiated | G-doc-3 (low) |

---

## ADR Pressure

#### X-adr-0012-1 — ADR-0012 calibration exemplar is stale; guard is a standing frequency signal as the suite scales past its baseline

- **Severity:** Medium
- **Signal:** Frequency (recurs in nearly every Gallery cycle) + Threshold (file count crossed the ADR's baseline)
- **Location:** `.claude/docs/adr/0012-test-isolation-collect-guard.md:52`; `frontend/src/tests/unit/test-guard-reporter.ts:28-29`
- **Observation:** ADR-0012's Enforcement narrative (line 52) still cites `SetsOverviewPage, 17 tests … ~550ms` as "the heaviest well-structured file." Per the Casebook, that exact file degraded past 4000ms and was split into PageSpec + FilteringSpec in PR #120 — the ADR's cited "healthy heavy file" exemplar has been contradicted and split away. Meanwhile the suite grew from the ~76 `.spec.ts` files the guard was tuned against to **139 today** (`find frontend/src -name '*.spec.ts' | wc -l`), while the absolute per-file thresholds (WARN 300 / FAIL 2000 ms, ×2 in coverage mode) are unchanged. ADR-0012 is the single most frequent ADR in the Casebook (ComponentGallery, AboutPage, SetsOverviewPage, PartsPage, SettingsPage collect/test-guard entries all cite it), and the prior sweep already filed X-adr-0012-1 (76→138 shift) as low.
- **Impact:** An ADR whose stated calibration exemplar was split away and whose file-count baseline nearly doubled is drifting from the reality it governs. Under the ADR-000 scale-lens, the thresholds may now be too loose (masking WARN-tier regressions that never escalate) or mis-anchored (developers can no longer point at SetsOverviewPage to understand "healthy heavy"). This cycle's gauntlet again warned on 9 files >300ms.
- **Recommendation:** Route ADR-0012 back to the ADR Interrogator for a calibration refresh — re-measure the current 139-file distribution, replace the split-away exemplar with a current heaviest well-structured file, and decide whether the absolute thresholds should be re-based or made distribution-relative. Frame per ADR-000 scale-lens.

#### ADR-0029 automation-lens (low pressure)

Per G-arch-1: ADR-0029's both-sides middleware guarantee is convention-only with no architecture-test backstop, and a second API-consuming app does not yet exist. Under the ADR-000 automation lens this is a decision whose enforcement has drifted to "developer copies the pattern." Not urgent (single correct consumer today) — flagged as a monitoring item to convert into mechanical enforcement before app #4.

#### Resolved in code (two standing suspicions close)

| ADR | Open Question / suspicion | Resolution shipped | Action |
|---|---|---|---|
| ADR-0014 | Should an arch test enforce `BelongsToFamilyInterface` on every model with `family_id`? (4-cycle Casebook suspicion) | `backend/tests/Architecture/ModelArchitectureTest.php:104` — `it('should implement BelongsToFamilyInterface in models with family_id')`, User allowlisted. Canonical grep: 4 implementers (FamilySet, StorageOption, InviteCode, ImportJob) + exempt User | Steward to move F-adr-0014-1 to Casebook Crossed-Out and mark the ADR-0014 Open Question resolved |
| ADR-0018 | EAGER_LOAD coverage-vs-existence blind spot (self-healing loadMissing N+1) | `backend/tests/Architecture/ResourceDataArchitectureTest.php:205-266` + helper `discoverNestedResourceRelations()` (:158) asserts every nested resource's required relations are relation-prefixed in the parent's EAGER_LOAD | Steward to move the F-debt-1 (EAGER_LOAD) open item to Crossed-Out; retain the SOP F-4 manual cross-verify at lower urgency |

Note: the foundry-debt finder reported the ADR-0014 enforcement as still-open (reading ModelArchitectureTest.php:82-98 only); the cross-adr finder read line 104 and found the shipped test. The direct file read at line 104 governs — enforcement has shipped. Recorded in Self-Debrief.

---

## Summary

**Overall Health**

- **Foundry Wing: 8.5 / 10** — full gauntlet green (lint, phpstan 0 errors, deptrac 0 violations, 114 arch + 687 suite tests), architecture and test discipline clean, ADR-0015 try-catch roster reconciled, two standing suspicions resolved in code. The only medium is a documentation-ledger drift (retired ADR still "Accepted"); remaining items are low count/prose gaps and test-hardening notes.
- **Gallery Wing: 7.5 / 10** — green on lint, type-check, knip, and 1435 unit tests, with strong architecture boundaries (import/domain/router/factory all hold) and the G-test flow-assertion suspicion resolved by PR #280. Held back by two medium Pulse self-contradictions, an unremediated third-cycle Parts-page duplication cluster, and a dev-only `format:check` gate failure that exposed a CI blind spot.

**Finding counts (reconciled against enumerated IDs)**

- **High: 0**
- **Medium: 6** — F-doc-1, G-doc-1, G-doc-2, G-debt-1, G-debt-2, X-adr-0012-1
- **Low: 14** — F-doc-2, F-doc-3, F-debt-1, F-test-1, F-test-2, G-gauntlet-1, G-doc-3, G-arch-1, G-arch-2, G-arch-3, G-debt-3, G-debt-4, G-test-1 (+ ADR-0029 automation note surfaced under G-arch-1)

**Recommendation:** Ship a small documentation-fix batch first — the three medium doc findings (F-doc-1, G-doc-1, G-doc-2) are the highest-leverage, lowest-cost fixes and all touch showcase-facing canonical docs. Then dispatch (or finally execute) the standing Parts-composable WO to close G-debt-1/G-debt-2, and route ADR-0012 to the Interrogator for calibration. Move the two resolved-in-code suspicions (ADR-0014, ADR-0018) to Casebook Crossed-Out and mark the corresponding ADR Open Questions resolved. No high-severity or correctness defects — the firm is portfolio-adjacent; the rough edges are docs and duplication, not broken bricks.

---

## Self-Debrief

_This sweep was machine-fanned-out across nine SOP dimensions with adversarial per-candidate verification before filing. **0 findings were refuted** in the verification pass; the verifier adjusted severity/scope on several candidates (dropping candidate mediums to low, correcting duplication-scope overstatements) without killing substance._

**What I caught**
- The canonical decision ledger drift (F-doc-1) surfaced independently in two dimensions (foundry-doc + cross-adr) — the strongest confirmed finding, on the exact governance artifact ADR-0028 existed to protect.
- Two Pulse self-contradictions (G-doc-1 JSDOM, G-doc-2 form-data) — both artifacts of a 2026-07-16 partial refresh that updated Active Concerns but left the Overall Health narrative stale.
- The Parts-page duplication cluster confirmed present for a third cycle against an unexecuted 2026-05-29 WO — WO non-execution across a full cycle is itself the escalation signal.
- The `format:check` gate failure and, more importantly, the CI blind spot behind it (format:check absent from pre-push).

**What I missed / discrepancies**
- Two finder dimensions disagreed on ADR-0014 enforcement: foundry-debt read `ModelArchitectureTest.php:82-98` and reported the interface enforcement still open (F-debt-2); cross-adr read line 104 and found the shipped `it('should implement BelongsToFamilyInterface …')` test. The line-104 read governs — enforcement has shipped, so F-debt-2 was NOT filed as an open finding. Lesson: a finder scoped to a helper block can miss a sibling test lower in the same file; when two finders disagree, the more-specific direct read wins and both should read to end-of-file.
- I did not confirm the arch suites currently pass green from the finder role (I read `architecture.spec.ts` and `ModelArchitectureTest.php` structurally). The gauntlet pass independently confirmed test:arch 114 passed and Gallery test:unit green, closing that gap after the fact.

**Methodology gaps**
- SOP G-2's ADR-0029 both-sides check (graduated 2026-05-05) catches a *missing* side on an existing http.ts but has no hook for "a future app adds an http.ts with only one side" — the automation-lens gap G-arch-1 names. The check is correct for today's single consumer; the gap is forward-looking enforcement.

**Training proposals**
1. **SOP F-3 / F-4:** When two finder dimensions touch the same enforcement file (e.g., ModelArchitectureTest, ResourceDataArchitectureTest), require each to read to end-of-file before reporting an enforcement "gap" — a shipped test can sit below the block a finder anchored on. Evidence: the ADR-0014 F-debt-2 vs X-adr-0014-1 disagreement this cycle.
2. **SOP G-1:** When `format:check` (or any gate) fails on *committed* code with a clean working tree, always check whether that gate is in the pre-push gauntlet and report the CI blind spot, not just the failing files. Evidence: G-gauntlet-1 — the failure mattered less than the missing pre-push wiring behind it.

---

## Steward Evaluation

_[Appended by The Steward after filing]_
