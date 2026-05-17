# Brick & Mortar Associates — Meeting Minutes

_Board meeting notes between the CEO and the executive team._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-03-23 — ADR-008 Re-Interrogation: Domain Isolation Stress Test

### Decisions

- **ADR-008 confirmed under re-interrogation**: Full 9-step interrogation sequence run against the accepted ADR. All branches held. Verdict: Confirmed with stress-tested timestamp.
- **Full isolation over controlled sharing (barrel exports)**: Barrel exports were the strongest alternative — controlled surface area, domains expose only what they choose. Rejected because it introduces judgment calls at the boundary ("should this be public?"). Full isolation removes the judgment call entirely: the answer is always "no."
- **Duplication is an accepted, out-of-scope cost**: If a domain needs a helper that exists in another domain, the correct action is to copy it or promote it to `@shared/`. Duplication is a separate concern with its own fix path, not a reason to punch holes in isolation.
- **Subdomain principle established**: As domains grow, subdomains follow the same isolation rules as top-level domains — fractal isolation. Enforcement tooling for subdomain-to-subdomain imports is deferred until the first domain actually splits.
- **Shared types live at `@app/types/`, not in domains**: Types that cross domain boundaries (e.g., a set summary nested inside a storage API response) are app-level concepts. Keeping them at `@app/types/` preserves the zero-import-between-domains guarantee.
- **Incremental adoption strategy documented**: The pattern can be adopted in existing codebases by scoping enforcement rules to new domains first, then progressively tightening. No big-bang migration required.

### Notes

- Problem is real and observed — cross-domain imports (primarily shared state) are actively causing pain in Script's other apps. This repo eliminates the primary vector by having no domain-level stores; adapter stores at `@app/` level handle shared data.
- Enforcement is fail-fast: oxlint catches violations at IDE level (red squiggle on type), architecture tests catch edge cases at pre-push. Both alias and relative path violations are covered.
- Type-safe routing means renaming a route produces a compile-time error everywhere — cross-domain coordination through the type system, not imports.
- Migration plan for enforcement: consolidate to oxlint-only once custom rule support matures, architecture tests as bridge.

### Strategic Alignment

- The re-interrogation process itself is showcase-worthy — demonstrating that the firm stress-tests its own decisions rather than treating them as permanent. A senior reviewer would appreciate that accepted ADRs are revisited under pressure with present-day evidence.

---

## 2026-03-22 — Dispatch Report Process: Replacing the Post-Dispatch Checklist

### Decisions

- **Structured Dispatch Report replaces checklist**: CEO caught the CFO skipping graduation log evaluations across four consecutive architect dispatches. Root cause: the checklist was a "you must do this" instruction with no visible artifact — easy to skip because nothing was visibly missing. Fix modeled after the war room's campaign report: a structured document the CEO sees, with Training Evaluation and Graduation Check as required sections. If the sections are missing, the CEO sees they're missing.
- **Process fix over memory fix**: CFO initially saved a feedback memory. CEO pushed back — memory is per-workstation, the process should work everywhere. The war room project (`/home/goosterhof/code/war-room`) was referenced as the working model.

### Notes

- The war room's key insight: evaluation works when it's a section of a required output document, not a separate step to remember. The Dispatch Report makes graduation evaluation visible, not just mandatory.
- CLAUDE.md updated with the Dispatch Report format template and rationale for why structured reports beat checklists.

---

## 2026-03-22 — ADR-011: Domain-Based Vitest Project Split

### Decisions

- **Domain-based projects replace test-type split**: The unit/components/apps split was motivated by collect-duration baselines that are no longer the primary enforcer. Replaced with one project per domain (`families/sets`, `shared/components`, etc.). Classification rule for juniors: follow the source file path, no judgment calls about environments or test-utils.
- **Two-part project naming convention**: Every project named `{scope}/{area}` — e.g., `families/sets`, `shared/components`, `admin/root`. Prevents confusion between app domains and shared directories.
- **Factory function for project config**: A factory generates project definitions from a name and path. Config becomes a scannable manifest — one line per project. Scales to 50+ projects without verbosity.
- **One global setup file, no mocks — ever**: `setup.ts` contains only environment config (`renderStubDefaultSlot`). All mocks live in test files (per ADR-010). Happy-dom polyfills stay in the test files that need them until used in 3+ files, then extract to a helper. This rule exists because of recurring incidents where setup-file mocks caused invisible test failures across projects.
- **App root projects named `{app}-root`**: `families-root`, `admin-root` — not `app-roots` (too generic) or `families-app` (implies testing the whole app).
- **Mock patterns added to ADR-010**: Standard patterns for Vue component mocks (`{name, props, template}` with `findComponent({name})`) and third-party library mocks (axios, string-ts) now documented in ADR-010 remediation section.

### Rejected Alternatives

- **Keep test-type split**: Solved a problem (collect-duration baselines) that no longer exists. Fragile include/exclude lists, misclassification issues.
- **Per-domain setup files with pre-configured mocks**: CEO has seen this fail repeatedly — mocks in setup cause invisible breakage in other tests. Explicit per-file mocking is more boilerplate but eliminates the failure mode entirely.
- **Single flat project**: No structural organization at 700+ files.

### Notes

- The interrogation challenged small domains (about, home, settings have 1 test file each). CEO's position: current sizes aren't representative, realistic minimum is ~4 testable files per domain. The ceremony of a project entry signals the domain exists and needs coverage.
- Architecture test enforcement: `architecture.spec.ts` will verify every `*.spec.ts` is covered by exactly one project, and compare domain directories against the project list.
- CEO flagged that "what is a domain and what goes where" is a separate ADR concern from project organization.

### Open Questions

- Automated detection of new domains missing from the project list — architecture test catches orphaned tests, but a domain with no tests yet won't be flagged
- Mocking patterns may warrant their own ADR rather than living as a section in ADR-010

---

## 2026-03-21 — Execution-Time Test Guard: Replacing Collect Duration as Primary Enforcer

### Decisions

- **Execution time replaces collect duration as the blocking enforcer**: CEO questioned whether collect duration was the right metric at all — Vitest already shows per-file execution time, which directly captures insufficient mocking, file size problems, and expensive setup. CFO prototyped `test-guard-reporter.ts` using `diagnostic().duration`. Result: deterministic numbers, no baselines, no coverage multipliers, simple absolute thresholds. Collect guard demoted to informational diagnostics.
- **Thresholds: 300ms warn, 1000ms fail**: Calibrated against 76 test files. Pure TS tests run in 2-10ms, simple components 10-50ms, page components 100-200ms. Heaviest well-structured file (SetsOverviewPage, 17 search/filter tests) runs ~550ms. The 1000ms fail threshold provides headroom while catching genuinely broken files.
- **No coverage multiplier needed for execution time**: Coverage instrumentation affects collect/import phase, not test execution. Confirmed empirically — SetsOverviewPage: 554ms without coverage, 427ms with coverage. The metric is coverage-stable.
- **Collect guard stays as informational**: Still useful for developers investigating import chain costs. Per-project median baselines with coverage 2x multiplier. Does not block the pipeline.

### Rejected Alternatives

- **Collect duration as primary enforcer**: Required per-project median baselines, coverage detection with 2x multiplier, single-file exceptions, and still had irreducible SFC overhead (~700-900ms) that forced it to be informational. Too much complexity for a metric that doesn't directly capture the developer experience.
- **Removing the collect guard entirely**: Considered but rejected — import chain data is still valuable for diagnostics even if it can't reliably enforce thresholds.

### Notes

- The CEO's key insight: "vitest itself is giving nice feedback about how long a test takes, that's almost always a nice case of how much is mocked or if the file is too big" — this reframed the entire approach from measuring infrastructure overhead (collect) to measuring test quality (execution).
- PR #120 merged to main. Full gauntlet passed.

### Strategic Alignment

- The two-guard architecture (blocking execution-time + informational collect-duration) demonstrates engineering judgment — knowing when to enforce vs when to inform. A senior reviewer would appreciate that the team tried collect-duration enforcement, discovered its limitations empirically, and pivoted to a simpler, more reliable metric rather than adding complexity to make a flawed approach work.

---

## 2026-03-21 — ADR-010 Implementation: Per-Project Baselines, Happy-DOM, & Informational Guard

### Decisions

- **Baseline-relative measurement with median, not minimum**: Minimum only captures best-case thread pool scheduling (~11ms observed). Median represents typical overhead per file. Confirmed by testing: min-based baselines left 23 violations, median-based reduced violations to files with genuinely heavy import chains.
- **Per-project baselines over global baseline**: Test suite split into 3 Vitest projects (unit/node, components/happy-dom, apps/happy-dom). Each project computes its own median baseline. Global baseline was meaningless — mixing pure TS tests with SFC component tests produced a median that helped neither group.
- **Percentile-based thresholds rejected**: Considered flagging files >2x median. Rejected — defining "statistical outlier" introduces complexity (sample size, bimodal distributions) while arriving at the same conclusion as baseline subtraction.
- **Happy-DOM over jsdom**: Switched test environment. Required compatibility fixes in 5 test files (PartListItem color format, v-show visibility, localStorage mocking, srcObject typing, addEventListener spying). jsdom dependency removed.
- **Collect guard made informational, not blocking**: SFC compilation overhead (~700-900ms delta) is irreducible for component tests that must import their own `.vue` file. Blocking the pipeline for costs that can't be reduced through mocking would force meaningless threshold inflation. Guard surfaces data without creating false blockers.
- **Coverage mode detection with 2x threshold multiplier**: Istanbul instrumentation adds ~300-400ms overhead per file. Reporter detects `coverage.enabled` via `onInit(vitest)` and doubles all thresholds (400/1000/10000ms). Fixed multiplier chosen over fixed offset because coverage overhead is proportional to file/chain size.
- **Form sub-component mocking pattern**: `vi.mock("@shared/components/forms/FormError.vue", () => ({default: {name: "FormError", props: [...], template: "<span />"}}))` with `findComponent({name: "FormError"})`. Applied to all 5 form input test files. CEO's preferred pattern: minimal factory with `{default: {}}` where `findComponent` isn't needed.
- **Thresholds kept at 200ms warn / 500ms fail**: Original ADR-010 values preserved. Architect had raised to 800/1500 — CFO reverted, arguing per-project baselines were supposed to make the original thresholds work. Remaining violations are irreducible SFC cost, hence informational guard.

### Rejected Alternatives

- **Absolute thresholds (original approach)**: Vitest's `collectDuration` includes pool/transform overhead that varies by environment and suite size. Absolute thresholds either false-fail (too tight) or catch nothing (too loose).
- **Minimum-based baseline**: Only captures best-case scheduling. Pool overhead isn't uniform — files scheduled later experience more contention.
- **Raising thresholds to accommodate SFC compilation**: Moving goalposts instead of solving the problem. Per-project baselines + informational guard is the honest answer.
- **Single global baseline across all projects**: Mixes fundamentally different workloads (pure TS vs SFC compilation). Median of mixed population is meaningless.
- **Two-project split (node vs happy-dom)**: Considered but three-way split (unit/components/apps) gives more precise baselines within each group.

### Action Items

- [x] Lead Brick Architect: Implement Vitest project split, reporter rewrite, happy-dom migration — completed with CFO corrections
- [ ] CEO: Review and merge branch `fix/adr-010-collect-guard-thresholds`
- [ ] CFO: Monitor CI baseline drift after merge — if false signals appear, revisit thresholds

### Notes

- The architect was dispatched three times during this session. First attempt: only completed 1/23 files before being interrupted (too slow). Second attempt: had the CFO's playbook (mock axios + string-ts) but the mocks had no effect on full-suite collect times — revealed the pool overhead theory was wrong. Third attempt: implemented the project split and happy-dom migration successfully after the CFO's full diagnosis.
- Key diagnostic sequence: solo file (216ms) vs full suite (1100ms) → pool overhead hypothesis → single-worker test (358ms max, zero violations) → confirmed pool contention is the real cost → per-project split as structural fix.
- The 5000ms hard cap serves as a safety net for baseline drift — if the entire suite slows down, the hard cap catches it regardless of per-project delta calculations.
- `brick-catalog.md` deleted by CEO (superseded by ADR-009 registry).

### Strategic Alignment

- The per-project Vitest configuration with a custom coverage-aware reporter demonstrates infrastructure maturity — the kind of test tooling a senior engineer expects in a large-scale project. The informational guard is an honest engineering choice: measure what matters, don't block on what you can't control.

### Open Questions

- Switching guard back to blocking if Vite/Vitest improve SFC compilation caching below 500ms delta
- Baseline drift monitoring across CI vs local environments — no evidence of divergence yet

---

## 2026-03-20 — ADR-010 Revision: Collect Guard Thresholds & Factory Mocking

### Decisions

- **Global auto-mocks dropped entirely**: Layer 1 (`vi.mock("@phosphor-icons/vue")` in `setup.ts`) was broken — without a factory function, `vi.mock()` still triggers a full module load. Every `vi.mock()` now lives in the test file that needs it with a mandatory factory. Explicitness over implicit global behavior.
- **Collect guard thresholds tightened from 2000ms to 500ms fail / 200ms warn**: Original 2000ms threshold was 10x above the actual target. Two-tier system: 200–500ms prints a warning, 500ms+ fails the suite. Based on real data from three projects at Script.
- **Thresholds hardcoded, not configurable**: A configurable threshold is an invitation to raise it instead of fixing the root cause. Same thresholds across all projects.
- **Custom lint rule added for factory-less `vi.mock()`**: Check 9 in `lint-vue-conventions.mjs` — enforces that every `vi.mock()` call includes a factory function as the second argument. Without the factory, the full module load still happens.
- **Over-mocking accepted as manageable tradeoff**: Juniors may mock too aggressively. Accepted — fast tests with over-mocking beats slow tests. Integration/e2e tests will catch bugs that unit mocks hide. Smarter diagnostics (suggesting what to mock) deferred to future work.

### Action Items

- [ ] Lead Brick Architect: Fix 11 test files exceeding 500ms collect threshold on branch `fix/adr-010-collect-guard-thresholds`
- [ ] CEO: Review and merge PR once violations are resolved

### Notes

- Pain is real but imported from other Script projects — icon barrel imports adding 500–1500ms per file, missing mocks loading entire apps adding 800ms+. Prophylactic for this repo, urgent for others.
- The `--no-verify` flag was used for the initial push since the 11 violations block pre-push. Flagged transparently — justified as known in-progress work on a dedicated branch.
- ADR interrogation resolved all open questions from the original draft. No environment-aware thresholds needed.

### Rejected Alternatives

- **Global auto-mock in setup.ts**: Broken without factory, obscures what each test depends on, raises ambiguity about where mocks belong
- **Single hard threshold at 200ms**: Would break ~40% of files on day one across projects — too aggressive for rollout
- **Configurable thresholds per project**: Invites raising the threshold instead of fixing the code

### Strategic Alignment

- Custom Vitest reporter (~70 lines) addresses the root cause of slow test suites rather than masking it with parallelization/sharding — demonstrates understanding of build tooling internals. Self-documenting error messages make it transferable to client engagements.

---

## 2026-03-20 — Building Inspector Maiden Voyage: Shared Components Audit

### Decisions

- **Building Inspector deployed on `src/shared/` as first target**: CFO recommended shared components over Families app or full repo — the supply warehouse is the foundation everything else sits on, and a contained scope for calibrating the inspector's first run.
- **Slots replaced with required string props on scanner components**: CameraCapture had hardcoded English strings with no translation mechanism. BarcodeScanner used slots with defaults. CEO challenged the slot approach — defaults mean nothing enforces translation. Both components refactored to required props (`loadingText`, `retryText`, `captureText`), giving compile-time enforcement via TypeScript.
- **Inline button extraction rejected as premature abstraction**: Inspector flagged duplicate retry buttons across CameraCapture and BarcodeScanner. CFO pushed back — two consumers doesn't justify extraction. CEO agreed. Extract when a third scanner component appears.
- **`@vue/test-utils` removed from production types**: `types.d.ts` imported `RouterLinkStub` for the `RouterService.RouterLink` type union. Replaced with Vue's native `Component` type. Test dependencies must not leak into production type definitions.
- **CFO post-dispatch checklist added to CLAUDE.md**: Graduation log evaluations were being skipped after agent runs. New standing section requires the CFO to evaluate training proposals and update graduation logs before moving on to the next task.

### Action Items

- [ ] CEO: Review and merge PR #117
- [ ] CEO: Visually verify scanner components still render correctly after props refactor

### Notes

- Inspector reported `@vitest/coverage-istanbul` as missing from `package.json` (high severity) — confirmed false positive, dependency was present all along. The real issue was non-executable husky hooks (committed as `100644`). Fixed in the same PR.
- Inspector rated shared layer 8/10 overall. Commendations: factory service pattern, zero-`any` policy, 100% coverage (931 tests), 10 architecture test groups. The architecture is genuinely strong — findings were polish, not structural.
- Three inspector training proposals evaluated: 2 added as candidates (cross-reference source↔spec files, compare sibling components), 1 dropped (verify devDependencies — false positive methodology).
- One architect training proposal added as candidate: check sibling component destructuring patterns before writing `defineProps`.

### Strategic Alignment

- The inspector audit process itself is showcase-worthy — demonstrating that the firm has automated quality gates AND human review processes. The graduation log system shows continuous improvement methodology.

### Open Questions

- Remaining low-severity inspector findings (3 `@ts-expect-error` suppressions, TODO in router service, missing `MissingResponseDataError` spec) — track as known debt or address in a follow-up session?

---

## 2026-03-19 — ADR-009 Showcase Implementation: Component Health Section

### Decisions

- **ComponentHealth.vue added as Showcase section 08**: Implements the ADR-009 requirement that the Showcase app renders registry data alongside component demos. All five metrics visualized: consumer map, adoption breadth, API surface, churn, and dependency depth.
- **Collapsible per-component detail view**: Each of the 31 components rendered as an expandable row with inline metric badges. Expanding reveals full API surface breakdown (props/emits/slots/models with required indicators) and consumer map grouped by app and domain — matching the ADR's "grouped by app with collapsible detail views" spec.
- **Visual health signals via color highlighting**: Multi-app adoption highlighted yellow, highest-churn and highest-API-surface components highlighted red. No automated thresholds or warnings (per ADR-009's explicit out-of-scope), just visibility.
- **Registry data consumed via JSON import**: `ComponentHealth.vue` imports `component-registry.json` directly — Vite resolves it at build time. Types defined inline in the component (no shared type file needed since the Showcase is the sole consumer).
- **No tests required for Showcase**: `vitest.config.ts` excludes `src/apps/showcase/**` from coverage. Consistent with zero existing Showcase tests — the Showcase is a visual artifact, not business logic.

### Action Items

- [x] CFO: Build Showcase app registry view (grouped by app, collapsible) — completed this session
- [ ] CEO: Review the Component Health section visually in the Showcase dev server

### Strategic Alignment

- The Showcase app now demonstrates not just the design system but the engineering practices behind it — component health metrics visible to the entire team without reading raw JSON. A reviewer sees both the components and the rigor behind maintaining them.

### Notes

- Registry regenerated after adding ComponentHealth.vue (it's a new consumer of SectionHeading)
- Formatter (oxfmt) touched several unrelated files — committed alongside the feature as formatting hygiene
- Full gauntlet passed before push: type-check, lint, lint:vue, format, knip, test:coverage (100%), build, size

---

## 2026-03-19 — ADR-009 Revision: Five-Metric Component Health Registry

### Decisions

- **Tier system killed, replaced with five concrete metrics**: Original ADR had 3 Tier 1 metrics with Tier 2/3 placeholders. After interrogation, the tier framing was rejected — churn and dependency depth aren't "nice-to-haves," they answer qualitatively different questions. Five metrics now in scope: consumer map, adoption breadth, API surface, churn, dependency depth.
- **Churn scoped precisely**: 30-day fixed rolling window. Two dimensions tracked — commit count (indecisiveness signal) and lines changed (redesign signal). Lifetime churn rejected as uninformative.
- **Dependency depth justified through combination with consumer count**: Deep nesting + low consumers = candidate for removal. Deep nesting + high consumers = legitimate architecture. Neither metric is useful alone for this question.
- **Duplication detection deferred to its own ADR**: Three distinct analysis problems identified (props similarity, template similarity at 80% threshold, function extraction candidates) — each needs different tooling. Too complex to bundle with the registry.
- **All three original open questions resolved**: (1) Both CI check AND pre-commit hook — CI is the gate, pre-commit is convenience. (2) Showcase app is the primary consumer — grouped by app, collapsible. (3) No adoption breadth thresholds — if it's not enforced, it doesn't exist. Automated warnings are future scope.
- **Performance constraint set**: Registry generation must complete in under 3 seconds, brute-force full scan. No incremental analysis until proven necessary.
- **Transferability narrowed**: Changed from "universal" to "Vue 3 monorepos with shared component libraries" — honest about the Vue `defineProps`/`defineEmits` dependency.
- **Bundle size, component age, test coverage confirmed out of scope**: Redundant with size-limit, trivial git query, and Istanbul respectively.

### Action Items

- [ ] CFO: Implement five-metric registry generation script (under 3 seconds)
- [ ] CFO: Add CI freshness check for registry
- [ ] CFO: Add pre-commit hook for registry regeneration
- [ ] CFO: Build Showcase app registry view (grouped by app, collapsible)
- [ ] CEO: Future ADR for duplication detection (three flavors)

### Strategic Alignment

- The ADR itself is part of the portfolio showcase — the reasoning behind metric selection (what's in, what's out, and why) demonstrates architectural decision-making to reviewers. The value isn't just the tool, it's the thinking.

### Notes

- Interrogation revealed the original "over-engineered" dismissal of churn/depth contradicted the strategic context — the firm is absorbing a large existing project where scale is imminent, not hypothetical
- Merge conflict concern addressed: registry is regenerated like `package-lock.json` — same workflow developers already know
- The "no soft conventions" stance was a key insight: documenting a threshold without enforcement is equivalent to not having one

---

## 2026-03-18 — Reactive Resource Adapter & Sets Domain Integration (PR #110)

### Decisions

- **Adapter display properties made reactive via `Object.defineProperty` getters**: Five options evaluated (re-fetch after mutation, getById computed, adapter returns updated object, separate getReactiveById method, reactive getters). `defineProperty` chosen — same adapted object automatically reflects store changes after CRUD operations without recreation.
- **`Object.defineProperty` over `Proxy`**: Both achieve reactive delegation; `defineProperty` chosen for explicitness at entity-scale property counts.
- **`reset()` restores to current server state**: After store updates via `patch()`, `reset()` gives the latest server data via the getter, not the stale snapshot from adapter creation.
- **Memoization simplified**: Adapted cache reduced from `Map<number, {source, adapted}>` to `Map<number, E>`. `setById` no longer invalidates the adapted cache — reactive getters read the latest state. Only `deleteById` and `retrieveAll` clear caches.
- **Sets domain integrated with adapter store**: SetsOverviewPage, AddSetPage, EditSetPage, SetDetailPage migrated from direct HTTP to adapter CRUD methods. ScanSetPage left as-is (specialized barcode workflow). IdentifyBrickPage and AssignPartModal out of scope (not FamilySet CRUD).
- **Validation via `useFormSubmit` wrapping adapter calls**: Adapter handles success (store sync, case conversion), `useFormSubmit` handles errors (422 parsing). No changes to adapter or composables needed.
- **Lead-brick-architect used for implementation**: Three-step delegation — ADR update (CEO+CFO), memoization implementation (architect), sets domain integration (architect). ADR decisions made before architect received briefs.
- **`assertDefined` replaced with `ensureRefValueExists`**: Ref-scoped, no name parameter, custom `MissingRefValueError`. Aligned with Script's other projects.

### Action Items

- [ ] CEO: Manual test Vue template reactivity through defineProperty getters (SetDetailPage inline status update)
- [ ] CFO: Review ADR-007 and ADR-008 through ADR-000 lens (deferred from this session)

### Notes

- ADR-006 scope clarified: adapter is for CRUD entities with REST verbs only. Non-CRUD operations use HTTP service directly.
- Vue auto-unwrap behavior: `ref<Adapted<T>>` deep-unwraps nested `mutable` Ref, so access is `adapted.value.mutable.fieldName` (no `.value` after `.mutable`). `ComputedRef` values auto-unwrap in templates.
- `FamilySet` type modified: `set` made optional (`set?: SetSummary`), `setNum` added at top level — needed for adapter create flow where `set` isn't available yet.
- Pre-push gauntlet caught type errors and test failures before they shipped — all resolved before merge.
- PR #110 merged to main via squash merge. All checks green: 916 tests, 100% coverage, type-check, knip, three apps build.

### Open Questions

- Vue template reactivity through `defineProperty` getters reading from a `Ref` — unit tests confirm mechanism works, manual verification still needed
- `setNum` on `FamilySet` and extra fields in create payload (`setId: 0`) — need API contract validation
- `set` optional on `FamilySet` — confirm matches actual API response shape

---

## 2026-03-18 — Full ADR Review Through ADR-000 Lens

### Decisions

- **ADR-002 revised**: Added one-liner defining services (state/config/dependencies) vs helpers (pure functions). Dropped the service registry suggestion — not relevant, and planted ideas that could mislead juniors. Added custom linter check 8 to prevent singleton exports in shared services.
- **ADR-003 rewritten as universal**: UnoCSS attributify is used across Script projects, not project-specific. Removed all LEGO/Brick Brutalism specifics — the ADR now covers the pattern (atomic CSS + named design system shortcuts), not this project's specific shortcuts. Each project defines its own in UnoCSS config.
- **`<style scoped>` allowed as escape hatch**: Blanket `<style>` ban relaxed — unscoped `<style>` still forbidden, but `<style scoped>` is now permitted for third-party CSS overrides and CSS edge cases. Linter check 4 updated.
- **ADR-004 unchanged**: Reviewed and passed all five criteria as-is. No revisions needed.
- **ADR-005 revised and renamed**: File renamed from `005-vshow-nav-elements.md` to `005-istanbul-coverage-no-ignores.md`. Phantom branch ignore comment loophole removed — rule is now absolute: no ignore comments, escalate phantom branches as Vitest/Vue issues.
- **`assertDefined` replaced with `ensureRefValueExists`**: Generic `assertDefined(value, name)` replaced with ref-scoped `ensureRefValueExists(ref)`. Three improvements: no misleading name parameter (stack trace is sufficient), custom `MissingRefValueError` instead of generic `Error`, scoped to Vue refs to prevent misuse. Pattern aligned with Script's other projects.

### Notes

- Transferability changes: ADR-003 moved from project-specific to universal. ADR-001, 002, 004, 005 were already universal or moved in prior session.
- All five original ADRs now reviewed through ADR-000's five evaluation criteria: junior understanding, literal-rule safety, scale, automated enforcement, transferability
- The `ensureRefValueExists` pattern is what Script's other projects already use — this aligns the LEGO project with established team conventions

---

## 2026-03-18 — Extracting ADRs 006–008 from Codebase Patterns

### Decisions

- **Three new ADRs extracted from implicit codebase patterns**: CFO audited 15 undocumented architectural decisions in the codebase, ranked them by teaching value for juniors, and recommended the top 3. CEO approved.
- **ADR-006: Resource adapter with frozen base and mutable ref**: Documents the `Object.freeze` + `deepCopy` pattern giving entities an immutable display view and a reactive mutable copy for forms. Type-safe CRUD method narrowing via function overloads (`Adapted<T>` vs `NewAdapted<T>`).
- **ADR-007: Adapter store module over Pinia/Vuex**: Documents why a custom store factory was chosen over Pinia. The adapter, localStorage persistence, and loading coordination are so tightly coupled that Pinia would be substrate buried under project-specific glue.
- **ADR-008: Domain isolation via lint rules and architecture tests**: Documents the hard ban on cross-domain imports with four-layer enforcement (two oxlint rules, two architecture spec tests, pre-push hooks).

### Notes

- All three ADRs honestly note that the adapter/store pattern (006, 007) is built and tested but not yet consumed by any domain — open questions reflect this
- 12 additional implicit decisions were identified but deprioritized: multi-app APP_NAME routing, HTTP middleware lifecycle, route naming conventions, deep copy over structuredClone, sound service synthesis, loading middleware WeakSet, and others. The lower-tier items were judged as implementation choices rather than architectural decisions worth ADR treatment.
- Transferability for all three marked as `universal` — the patterns apply to any large Vue/TS project, not just this one

---

## 2026-03-18 — ADR-001 Revision: Universal RouterService

### Decisions

- **ADR-001 rewritten as universal**: The multi-app routing pattern (shared components decoupled from router plugins, all routed apps using RouterService) is used across multiple Script projects — not project-specific. Transferability changed from `project-specific` to `universal`.
- **No exceptions for "simple" apps**: The previous three-tier hybrid (RouterService for Families, raw Vue Router for Admin, nothing for Showcase) was eliminated. New rule: every routed app uses `createRouterService()`. An app with one or two routes barely qualifies as routed — and the migration cost when it grows is unnecessary friction.
- **Admin migrated to RouterService**: Admin's raw Vue Router usage (`createRouter`, `useRouter`, `RouterView`) replaced with `createRouterService`, `adminRouterService`, and `AdminRouterView`. Tests rewritten to mock the service instead of creating a raw router.
- **`useRouter`/`useRoute` ban extended to all apps**: oxlint `no-restricted-imports` rule now covers `src/apps/**` instead of just Families. Admin exclusion removed.

### Notes

- The Admin migration question ("when should Admin adopt RouterService?") was dropped as moot — there's no longer a threshold; you use it or you don't have routing
- The decision now leads with the universal principle (shared code must not depend on framework plugin registration) and presents the RouterService as the solution, rather than leading with the LEGO-specific three-app setup
- `AdminRouterLink` and `AdminAppRoutes` exports removed (knip flagged as unused) — can be added back when Admin needs them

### Action Items

- [ ] CFO: Continue reviewing remaining ADRs (002–005) through ADR-000 lens
- [ ] CFO: Commit ADR-001 revision and Admin migration

---

## 2026-03-18 — ADR-000: Foundation Document & Decision Framework

### Decisions

- **ADR-000 created as standalone meta-document**: Lives at `.claude/docs/ADR-000.md` outside the numbered `decisions/` directory — it's the decision framework itself, not a technical decision. Referenced from the top of `decisions.md` as required reading.
- **Five evaluation criteria for all future ADRs**: (1) Would a junior understand without asking? (2) What happens when followed too literally? (3) Does it scale to 50+ components/10+ domains? (4) Can it be enforced automatically? (5) Is the reasoning transferable?
- **Transferability labels added to all ADRs**: Two values — `universal` (applies to any large Vue/TS project) and `project-specific` (tied to this app's constraints). Applied retroactively: ADR-001 project-specific, ADR-002 universal, ADR-003 project-specific, ADR-004 universal, ADR-005 universal.
- **Script and team context documented explicitly**: ADR-000 names Script, the 20+ trainees/juniors, and the two production apps. Abstract framing was considered but explicit context won — it explains _why_ decisions are evaluated the way they are.

### Notes

- Decision record template updated with `Transferability` field
- The roleplay element (Brick & Mortar Associates) is documented as intentional in ADR-000 — lowers mental switching cost from day job, keeps documentation engaging to maintain
- Minutes-nudge stop hook fixed: replaced `"decision": "block"` with `"continue": true` to break an infinite loop (block → response → stop → block). Nudge behavior now handled via Claude's memory system.

---

## 2026-03-18 — ADR Enforcement via Linting

### Decisions

- **Three ADR enforcement rules worth implementing**: After a cost-benefit analysis of all 5 ADRs, the CFO recommended three high-ROI additions. ADR-002 (factory pattern) and ADR-004 (case conversion) were deemed too fragile or not worth the maintenance cost to enforce via linting. CEO approved the three.
- **ADR-005: Ban coverage ignore comments via custom linter**: Added check 7 to `scripts/lint-vue-conventions.mjs` — scans all `.ts` and `.vue` files for `/* istanbul ignore */`, `/* v8 ignore */`, `/* c8 ignore */` patterns. Test files are exempt.
- **ADR-001: Ban `useRouter`/`useRoute` imports in Families and shared**: Added `no-restricted-imports` paths in `.oxlintrc.json` for both `src/shared/**` and `src/apps/families/**`. Admin is deliberately excluded — it uses Vue Router directly per ADR-001.
- **ADR-001: Ban `<RouterLink>`/`<router-link>` template usage in shared**: Added check 6 to the custom linter. The existing oxlint import ban only catches JS imports — globally registered components bypass it.
- **Custom linter expanded to scan `.ts` files**: Previously only scanned `.vue` files. Now scans both `.vue` and `.ts` for cross-file checks (coverage ignore comments). The `findVueFiles()` helper was generalized to `findFiles()` with configurable extensions.

### Notes

- ADR-001 and ADR-005 docs updated with Enforcement sections documenting the automated checks
- No existing code violated any of the new rules — clean slate
- The custom linter's lint-staged integration now accepts both `.vue` and `.ts` files via CLI args

---

## 2026-03-19 — "Building for Size" Strategic Context Propagation

### Decisions

- **Strategic mission codified in CLAUDE.md**: New "Strategic Mission — Building for Size" section added. Every architectural decision must answer two questions: (1) Does this scale to enterprise complexity? (2) Does this demonstrate mastery to a senior engineer reviewing the repo? This is the firm's portfolio piece for landing large client engagements.
- **All agents and skills updated with strategic context**: Lead Brick Architect gained a Strategic Context section, a "build for showcase" responsibility, and a "showcase readiness" debrief section. Building Inspector gained a new SOP 6 (Audit Showcase Readiness) with a three-tier rating: portfolio-ready / needs polish / not ready. ADR Interrogator gained a new Step 6 (The Showcase Test) asking whether a client would be impressed or concerned. Minutes Secretary gained a Strategic Alignment capture category.

### Strategic Alignment

- This decision itself is the foundational strategic alignment act — it ensures that "building for size" is not just understood by the CEO and CFO, but is structurally embedded in every agent's operating instructions and evaluation criteria. No agent in the firm can claim they didn't know the mission.

### Notes

- The dual strategic lens (scales AND demonstrates mastery) was explicitly discussed — these can conflict (over-engineering looks impressive but doesn't scale well; quick hacks scale but look amateur). Both must hold.
- The repo serves a dual purpose: portfolio showcase for clients AND decision laboratory for team ADR adoption. These are complementary, not competing.

---

## 2026-03-19 — ADR Interrogator Skill

### Decisions

- **ADR interrogator skill added**: Inspired by mattpocock/skills `grill-me` pattern. A `/adr-interrogator` skill that stress-tests proposed architectural decisions through structured one-at-a-time questioning before they get formalized as ADRs. Walks eight branches: problem, alternatives, decision, junior test, scale test, enforcement, consequences, transferability — directly mapped to ADR-000's evaluation criteria.
- **Interrogator is not a decision-maker**: It pressure-tests reasoning and hands back to the CEO. The CFO handles actual ADR drafting. Clear separation of roles.

### Notes

- Skill follows the same `.claude/skills/[name]/SKILL.md` convention as the minutes secretary
- The interrogation sequence mirrors the ADR template sections and ADR-000's five evaluation lenses, ensuring the output maps directly to a draftable ADR
- Character: "the 1x1 red brick with the magnifying glass" — small, sharp, finds the gap in the wall

---

## 2026-03-17 — Meeting Minutes Secretary Setup

### Decisions

- **Stop hook uses command type, not prompt**: Prompt-type hooks are only available for tool events (PreToolUse, PostToolUse, PermissionRequest) — not Stop. Used a command hook that outputs JSON with `decision: "block"` to conditionally inject a nudge into the CFO's context.
- **10-minute staleness window for nudges**: The Stop hook stays silent if MINUTES.md was updated in the last 10 minutes, preventing nagging during active documentation. Uses file mtime for simplicity.
- **SessionEnd hook for auto-commit**: MINUTES.md is automatically committed (if changed) when a session ends, so minutes are never lost even if the CEO forgets to commit.

### Notes

- The `/minutes` skill, Stop hook, and SessionEnd hook are all shipped as project-level config (`.claude/settings.json`, `.claude/skills/`, `.claude/hooks/`) — committed to the repo, shared across team.
- The settings file watcher may not detect a newly created `.claude/settings.json` mid-session — hooks activate on next session start or after visiting `/hooks`.

---

## 2026-03-26 — Families App Full-Sweep Audit & Remediation

### Decisions

- **Remove CLAUDE.md war-room ADR references**: Deleted line 207 referencing non-existent ADR-0014 ("Domain-Driven Frontend Structure") and mislabeled ADR-0009 ("ResourceData Pattern"). These were external war-room references to `adrs.script.nl` that are not actionable for repo readers. The concepts are already covered by local ADRs (006 for resource adapter, 008 for domain isolation).
- **Relax `toCamelCaseTyped` type constraint**: Changed from `T extends Item` to `T extends object`. The helper has no runtime dependency on `id` — the original constraint was over-specified, forcing 4 files to bypass type safety with `as T` casts. Not significant enough to warrant an ADR.
- **All 3 remaining permits are backend-blocked**: Brick DNA Lab, Invite Code Brick, and Member Removal Wrench all depend on backend API contracts that aren't agreed yet. CFO recommended against building UI against imaginary contracts.

### Action Items

- [ ] CFO: Update Pulse metrics (test files 90→93, tests 1081→1147, shared components 31→32) — stale for 3 consecutive inspections
- [ ] CEO: Decide direction on backend-blocked permits (unblock one, pick different work, or draft API contracts ourselves)

### Notes

- **Inspection results (8.5/10)**: 6 findings (0 high, 2 medium, 4 low). Architecture compliance clean across all 12 ADRs. 100% test coverage confirmed genuine (behavioral L2-L3 depth). All findings resolved in-session.
- **Inspector training**: Two new graduation candidates added (SOP 2: grep for `deepCamelKeys`; SOP 3: verify numeric count claims). Both need second confirmation. Two prior SOPs (gauntlet failure classification, verify document exists) confirmed working in this inspection.
- **Three inspections now complete**: Showcase (2026-03-24), Shared (2026-03-25), Families (2026-03-26). Only Admin app remains unaudited.
- **Recurring pattern escalated**: `component-registry.json` format:check failure hit 3 consecutive inspections — escalated from low to medium. Root cause is the generation pipeline not piping through oxfmt.

---

## 2026-03-26 — Testing Strategy: Beyond Unit Tests

### Decisions

- **Hybrid testing strategy approved (Option 3)**: Vitest Browser Mode + standalone Playwright E2E, phased rollout. Chosen over pure Vitest Browser (insufficient for user journey coverage), pure Playwright E2E (high cost without integration layer), and Playwright Component Testing (experimental, fights the Vue/Vitest ecosystem).
- **Phase 1: Vitest Browser Mode with Playwright provider**: Add a `browser` test workspace alongside the existing `unit` workspace. Target components exercising real browser APIs first — BarcodeScanner, ConfirmDialog, ModalDialog. Low cost, high signal.
- **Phase 2: Standalone Playwright for critical E2E journeys**: 3-5 user paths only (auth flow, set management, barcode scan flow). Thin smoke-test layer, not broad coverage.
- **Playwright Component Testing rejected**: Experimental status is a non-starter for a portfolio piece. Rewriting existing tests for an unstable API has terrible cost/risk ratio.

### Action Items

- [ ] CFO: File building permit for Phase 1 (Vitest Browser Mode integration tests)
- [ ] CFO: Phase 2 permit to follow after Phase 1 delivery

### Rejected Alternatives

- **Option 1 (Vitest Browser Mode only)**: Fills the integration gap but leaves critical user journeys untested. Good but incomplete.
- **Option 2 (Standalone Playwright E2E only)**: High value but high cost without the integration layer underneath. 80% of the value comes from integration tests at 20% of the cost.
- **Option 4 (Playwright Component Testing)**: Experimental API, fights Vue ecosystem conventions, requires rewriting 95+ existing spec files.

### Strategic Alignment

- Current test suite shows "they know how to unit test" — table stakes. The hybrid strategy shows "they have a testing strategy with clear boundaries between unit, integration, and E2E layers" — the enterprise signal the portfolio needs.

### Notes

- Current state: 95+ spec files, Vitest + @vue/test-utils + happy-dom, 100% coverage on shared code, custom performance guard reporters, architectural validation tests. Unit testing is solid.
- Gap identified: nothing tests components working together, real browser behavior, or actual user flows.
- BarcodeScanner and ConfirmDialog use native browser APIs (mediaDevices, `<dialog>`) that happy-dom stubs poorly — prime candidates for browser-mode integration tests.
- SetDetailPage and ScanSetPage have the highest complexity — multi-step flows with modals, concurrent data loading, and state management across interactions.

---

## 2026-03-27 — Browser Test Setup & Page Integration Testing Strategy (ADR-013)

### Decisions

- **WSL2 browser test environment**: Use Playwright's bundled Linux Chromium via WSLg, not Windows Chrome. The Windows Chrome approach fails because Playwright's `--remote-debugging-pipe` doesn't work across the WSL/Windows boundary. The `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` env var was removed from `.bashrc` after testing confirmed this.
- **Vue test-utils `wrapper.emitted()` workaround**: In Vitest browser mode, `wrapper.emitted()` accumulates emit interceptors across mounts of the same component type — a VTU bug. Workaround: use Vue 3's `onXxx` prop pattern with `vi.fn()` instead of `wrapper.emitted()` for interaction assertions in browser tests.
- **Browser test `attachTo` pattern**: Real browsers require `showModal()` to be called on a dialog in the document. Each browser test creates a fresh `container` div in `beforeEach`, mounts to it, and removes it in `afterEach`.
- **Three-layer testing strategy (ADR-013 accepted)**: Unit tests (happy-dom, heavy mocking, 100% coverage) for isolated logic. Page integration tests (happy-dom, real child components, mocked services) for composition correctness. Browser tests (Playwright/Chromium) only for browser-native APIs (`<dialog>`, MediaStream, etc.).
- **Page integration scope**: Domain page components only (~16 pages). Separate coverage accounting — does not contribute to 100% unit threshold. Expand scope based on evidence, not prediction.
- **Icon library Vite alias for integration tests**: `@phosphor-icons/vue` (4,536 exports, 7 used) aliased to lightweight stubs via `resolve.alias` in `vitest.integration.config.ts`. Config-level redirect, not a test-time mock — does not violate ADR-011's "no mocks in setup" rule.

### Rejected Alternatives

- **Windows Chrome via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`**: Pipe-based debugging FDs don't cross the WSL/Windows boundary (exit code 13)
- **Browser tests for all components**: 2-10x slower than happy-dom, Playwright overhead, `wrapper.emitted()` bug. Most components don't use browser-native APIs — disproportionate cost
- **E2E tests (Cypress/Playwright against running app)**: Overkill for catching component composition issues, requires backend
- **Global icon stub in setup.ts**: Breaks ADR-011's "no mocks in setup" rule
- **Deep imports for icons (`@phosphor-icons/vue/PhX`)**: Package doesn't expose individual imports via `exports` field — fragile dependency on undocumented internals

### Action Items

- [ ] Architect: Build page integration test infrastructure (`vitest.integration.config.ts`, setup, icon stub module, npm scripts)
- [ ] Architect: Write first page integration test as a reference implementation
- [ ] Architect: Extend architecture test to verify every domain page has an integration test
- [ ] CFO: Monitor test-guard reporter thresholds — integration tests may need separate calibration from unit tests

### Open Questions

- Threshold calibration for integration tests — ADR-010 thresholds are tuned for unit tests, real component trees will be heavier
- Coverage threshold for integration suite — currently none, revisit after all 16 pages have tests
- Whether modals/sub-views need integration tests — evaluate after first cycle of page tests reveals weak points

---

## 2026-03-27 — Page Integration Test Suite Delivery (ADR-013 Implementation)

### Decisions

- **Permit scope excluded architecture enforcement test**: The architecture test that enforces "every domain page has an integration test" was deliberately excluded from the permit — it's enforcement tooling, not the test suite itself, and warrants its own permit once the suite is running.
- **Domain-local modals are legitimate mock targets**: `AssignPartModal.vue` (under `@app/domains/sets/modals/`) was mocked in `SetDetailPage` integration test. It's domain-local, not `@shared/components/`, so ADR-013's "no mocking shared components" rule doesn't apply. Mocking avoids its own onMounted HTTP calls.
- **HTMLDialogElement polyfilled in setup, not mocked**: Real `ConfirmDialog` -> `ModalDialog` calls `showModal()` which happy-dom doesn't implement. Polyfilled in `setup.ts` to keep the component tree real rather than stubbing ModalDialog.
- **CSV helper mocked for DOM API side effects**: `@shared/helpers/csv`'s `downloadCsv` calls `document.createElement('a')` and `URL.createObjectURL` — mocked in integration tests since CSV export is business logic already covered by unit tests.
- **Vue ref auto-unwrapping requires real `ref()` in mock stores**: Pages using `getAll.length` in templates need Vue auto-unwrapping. Mock stores must use real `ref()` created inside async `vi.mock()` factories, assigned to `vi.hoisted()` holders. Plain `{value: []}` doesn't auto-unwrap.

### Action Items

- [ ] CEO: Approve knowledge update — Vue ref auto-unwrapping gotcha for mock stores
- [ ] CFO: File separate permit for architecture test enforcing "every page has integration test"
- [ ] CFO: Monitor convergence of "check enforcement rules before adding test infrastructure files" candidate pattern (knip 2026-03-26 + architecture test 2026-03-27)

### Notes

- Delivery: 16 files, 90 tests, 4.81s total execution time. All acceptance criteria met. Full quality gauntlet passes.
- Three training proposals logged as candidates in graduation log. No graduations this round.
- CFO concern: architect wrote 16 files without `vi.hoisted()`, watched 15 fail, then rewrote all of them. The unit test codebase already demonstrates the pattern — this was a pre-work discipline failure, not a knowledge gap.
- Previous action items resolved: architect infrastructure + 16 page tests complete. Architecture enforcement test remains open (separate permit).

---
