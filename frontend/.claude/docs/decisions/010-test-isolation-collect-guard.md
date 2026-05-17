# Decision: Test isolation via execution-time guard, collect-duration guard, and per-file factory mocking

**Date**: 2026-03-20 (revised 2026-03-21)
**Feature**: Test suite performance and isolation infrastructure
**Status**: accepted
**Transferability**: universal

## Context

The test suite runs under a strict 100% coverage policy (ADR-005). Test execution time matters — it runs on every pre-push via Husky, so a slow suite directly blocks developer velocity.

Vitest measures two distinct phases per test file: **collect** (importing the test module and all transitive dependencies) and **execute** (running the actual test functions). In practice, collect duration dominates wall-clock time. A single unmocked barrel export — like `@phosphor-icons/vue`, which re-exports ~700 icon components — can add 500–1500ms to every component test that transitively imports it.

The problem compounds silently. Developer A adds a component that imports from the icon library. Developer B writes a test for a page that uses that component via `shallowMount`. The page test now transitively imports the entire icon library during collection, even though `shallowMount` stubs it out before any test runs. Neither developer sees the cost individually — it only shows up as the suite gradually slowing over a few weeks.

Parallelizing or sharding test runs masks the symptom but does not fix it — suite speed is bounded by the slowest file. Tree-shaking does not apply to test collection. The root cause is transitive import chains, and the fix must target that directly.

A global auto-mock approach (e.g., `vi.mock("@phosphor-icons/vue")` in setup.ts) was considered and rejected: without a factory function, `vi.mock()` still triggers the full module load to discover what needs mocking. With a factory, the mock becomes specific to a dependency — and at that point it belongs in the test file, not in global setup. Global auto-mocks also obscure what each test actually depends on, making tests harder to reason about.

The question: how do we prevent transitive import chains from degrading test performance, enforce explicit mocking, and give developers clear feedback when something slips through?

## Options Considered

| Option                                                                    | Pros                                                                                                                                                                     | Cons                                                                                                                                                                                 | Why eliminated / Why chosen                                                    |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **Do nothing — let developers mock per-file**                             | No infrastructure needed. Each test file controls its own mocks                                                                                                          | Relies on every developer knowing which packages are expensive. Forgotten mocks compound silently. No feedback loop — you don't know your test is slow until the whole suite is slow | Eliminated — doesn't scale for a junior team                                   |
| **Global auto-mock in setup.ts**                                          | One-time fix for known heavy packages                                                                                                                                    | Without a factory, still loads the full module. Obscures what each test depends on. Raises questions about where mocks belong (setup vs test file)                                   | Eliminated — broken in practice, implicit over explicit                        |
| **Collect-duration guard reporter only**                                  | Catches any slow import chain regardless of source. Fails the suite when a file exceeds the threshold                                                                    | Developers get a failure with no guidance on correct mocking technique. Does not enforce factory usage                                                                               | Eliminated — necessary but not sufficient alone                                |
| **Collect-duration guard + mandatory factory mocking (enforced by lint)** | Guard catches slow imports. Lint rule ensures mocks use factories (preventing the "still loads the module" problem). Every mock is explicit and co-located with its test | Requires maintaining a custom reporter and a custom lint rule. More `vi.mock()` boilerplate per test file                                                                            | **Chosen** — prevention via lint, detection via guard, explicitness throughout |

## Decision

Three mechanisms working together: an execution-time guard (blocking), a collect-duration guard (informational), and a lint rule (blocking).

### Execution-time guard reporter (primary enforcer)

A custom Vitest reporter (`test-guard-reporter.ts`) measures the execution duration of every test file using `diagnostic().duration` — the accumulated time of all tests and hooks in the module.

**Why execution time over collect duration:** Collect duration (`collectDuration`) measures how long Vitest spends importing a file's dependency tree. This metric is heavily polluted by thread pool contention, Vite transform caching, and coverage instrumentation — making it unreliable as an enforcement mechanism without complex baseline calculations. Execution time measures how long the tests themselves take to run. It is deterministic, does not vary with worker pool size or coverage mode, and directly captures the developer experience.

**What execution time catches:**

- **Insufficient mocking** — real I/O, heavy dependencies not stubbed, expensive DOM operations
- **File too large** — too many tests in one file, cumulative runtime adds up
- **Expensive setup/teardown** — heavy `beforeEach`/`afterEach` hooks

**Two tiers:**

- **300–1000ms: warning** — test file getting slow, printed to console but does not fail the suite.
- **1000ms+: failure** — fails the suite with exit code 1. The file needs mocking, splitting, or setup optimization.

**Threshold calibration:** Pure helper/service tests execute in 2–10ms. Simple component tests in 10–50ms. Page component tests with proper mocking in 100–200ms. The heaviest well-structured file (SetsOverviewPage, 17 tests with search/filter interactions) runs in ~550ms. The 1000ms failure threshold provides headroom while catching genuinely problematic files. The 300ms warning threshold flags files trending toward trouble.

**Output format:** Each line shows `[project] durationMs | testCount tests | file`.

**Remediation when a test file exceeds the threshold:**

1. Check if heavy dependencies are unmocked — add `vi.mock()` with factory functions
2. If the file has many tests, consider splitting into focused test files
3. If setup/teardown is expensive, reduce per-test overhead (share setup where safe)

**Standard mock patterns:**

For Vue components that are dependencies (not the component under test):

```ts
vi.mock('@shared/components/forms/FormLabel.vue', () => ({
    default: {name: 'FormLabel', props: ['for', 'optional'], template: '<label><slot /></label>'},
}));
```

Then find mocked components by name instead of import reference:

```ts
const label = wrapper.findComponent({name: 'FormLabel'});
```

For third-party libraries (axios, string-ts):

```ts
vi.mock('axios', () => ({
    isAxiosError: (_e: unknown): boolean => false,
    AxiosError: Error,
    default: {create: vi.fn()},
}));

vi.mock('string-ts', () => ({deepCamelKeys: <T>(obj: T): T => obj, deepSnakeKeys: <T>(obj: T): T => obj}));
```

When mocking `string-ts` with a passthrough, fixture data must already be in camelCase since `deepCamelKeys` won't convert it.

### Collect-duration guard reporter (informational diagnostics)

A custom Vitest reporter (`collect-guard-reporter.ts`) measures the collect duration of every test file using **baseline-relative measurement**.

**The problem with absolute thresholds:** Vitest's `collectDuration` includes thread pool overhead (~800–1000ms) in multi-file runs. This overhead is environmental, not caused by import chains. Absolute thresholds either false-fail every file (too tight) or catch nothing (too loose). A file that collects in 200ms in isolation reports 1100ms in a full suite run — the difference is pure pool tax.

**Per-project baselines:** The test suite is split into three Vitest projects (unit, components, apps) with different environments and import chain characteristics. The reporter computes the **median** `collectDuration` within each project separately. The median is used rather than the minimum because pool overhead is not uniform — files scheduled later in the thread pool experience more contention. Each file's **delta** (`collectDuration - project median`) isolates the actual import chain cost relative to its peers. Files at or below the median get a zero or negative delta and are never flagged.

**Single-file exception:** When a project has only one file in the run, thresholds apply to the raw `collectDuration` directly — no subtraction. This is accurate because there is no pool contention within that project.

**Three tiers (informational — does not fail the suite):**

- **Delta 200–500ms: warning** — import chain getting heavy, consider mocking.
- **Delta 500ms+: violation** — import chain too slow, should be addressed.
- **Raw 5000ms+: hard cap violation** — catches silent baseline drift.

The guard is informational because some SFC compilation overhead (~700-900ms) is irreducible for component tests that must import their own `.vue` file. The guard surfaces the data so developers can identify and mock heavy transitive dependencies, but does not block the pipeline for costs that cannot be reduced.

**Coverage mode:** Istanbul instrumentation adds ~300-400ms overhead per file. When coverage is enabled (`--coverage`), all thresholds are doubled (400/1000/10000ms) to avoid false signals from instrumentation overhead. The output shows the effective thresholds with a `(coverage mode: 2x)` indicator.

**Threshold calibration:** Pure helper/service tests have near-zero delta. Component tests with proper factory mocking stay under 200ms delta. Component tests that must import their own SFC show 500-900ms delta due to compilation overhead. The thresholds are calibrated to flag genuinely problematic import chains while accepting irreducible SFC cost.

**Output format:** Each line shows `[project] delta | raw | baseline | file` so developers can see the project grouping and distinguish import chain cost from pool overhead.

**Violation output:** Lists all flagged files sorted by delta with a pointer to this ADR for remediation guidance.

**Remediation when a test file exceeds the threshold:**

1. Identify the heavy transitive dependency (usually a barrel export or a large library)
2. Add a `vi.mock("dependency", () => ({...}))` call **with a factory function** in the test file
3. Mock only the specific exports the test needs

### Mandatory factory in `vi.mock()` calls (lint-enforced)

A custom lint rule in `scripts/lint-vue-conventions.mjs` scans all `.spec.ts` files and enforces that every `vi.mock()` call includes a factory function as its second argument.

**Why:** `vi.mock("module")` without a factory still triggers a full module load during collection — Vitest needs to read the module to know what to auto-mock. Only `vi.mock("module", () => ({...}))` with a factory avoids the import entirely. This is the critical technical detail that makes the pattern work.

### Per-file, explicit mocking

Every `vi.mock()` call lives in the test file that needs it. No global mocks in setup files. This ensures:

- Each test file declares its dependencies explicitly
- A developer reading a test file sees exactly what is mocked and what is real
- No hidden behavior from global setup that affects test outcomes

### What this does NOT cover

- **Total suite duration** — no aggregate time budget. Per-file enforcement reduces overall suite time as a side effect, but there is no explicit total time budget
- **Mock correctness** — factory-based mocks are handwritten fakes that don't reference the real module. If an upstream dependency changes its export shape, mocks won't break. This false safety gap is accepted and will be mitigated by integration/e2e tests and potentially by factory helpers or `__mocks__` directories in the future

## Consequences

- **Predictable test performance** — import chains are bounded. Adding a new component doesn't silently slow the entire suite
- **Self-documenting failures** — when a test file exceeds the threshold, the error message explains what happened and how to fix it. Juniors don't need to debug Vitest internals
- **More boilerplate per test file** — each test file that renders components with heavy dependencies needs its own `vi.mock()` with a factory. This is the accepted cost of explicitness over implicit global behavior
- **False safety from factory mocks** — handwritten factory mocks won't catch upstream export shape changes. Mitigated by integration/e2e tests. Future mitigation: factory helpers or `__mocks__` directories
- **Fixed thresholds, not configurable** — intentionally hardcoded. A configurable threshold is an invitation to raise it instead of fixing the root cause. The hard cap (5000ms) is the one exception — it may need tuning per project based on CI environment characteristics
- **Baseline varies across machines** — the pool overhead differs between local dev machines and CI runners, so the same file may produce different deltas. Accepted because the thresholds have enough margin, but worth monitoring if false failures appear in CI

## Enforcement

| What                             | Mechanism                                                              | Scope                                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Test execution time limit        | `test-guard-reporter.ts` custom Vitest reporter                        | Every `.spec.ts` file — warn at 300ms, **fail at 1000ms** (blocks pipeline)                                                 |
| Import chain duration (delta)    | `collect-guard-reporter.ts` custom Vitest reporter                     | Every `.spec.ts` file — warn at 200ms delta, violation at 500ms delta (informational, does not block)                       |
| Import chain duration (hard cap) | `collect-guard-reporter.ts` custom Vitest reporter                     | Every `.spec.ts` file — violation at 5000ms raw regardless of delta (informational, does not block)                         |
| Coverage mode threshold scaling  | `collect-guard-reporter.ts` detects `coverage.enabled` via `onInit`    | Collect guard thresholds doubled when running with `--coverage` (test guard unaffected — execution time is coverage-stable) |
| Factory required on `vi.mock()`  | Custom lint rule in `scripts/lint-vue-conventions.mjs`                 | Every `.spec.ts` file                                                                                                       |
| Reporters registered in config   | `vitest.config.ts` reporters array                                     | Suite-wide (both reporters)                                                                                                 |
| Lint runs on commit              | lint-staged in Husky pre-commit hook                                   | All staged `.spec.ts` files                                                                                                 |
| Pre-push gate                    | Husky pre-push hook runs `test:coverage` which includes both reporters | All pushes                                                                                                                  |

## Resolved Questions

### Why execution time as the primary enforcer instead of collect duration?

**Resolved 2026-03-21.** Collect duration (`collectDuration`) measures import chain resolution time, but this metric is heavily polluted by Vitest internals: thread pool contention adds ~800-1000ms in multi-worker runs, Vite transform caching varies between runs, and coverage instrumentation inflates numbers by ~300-400ms. Making collect duration reliable required per-project median baselines, coverage detection with 2x multipliers, and single-file exceptions — and even then, irreducible SFC compilation overhead (~700-900ms) forced the guard to be informational only.

Execution time (`diagnostic().duration`) measures how long tests and hooks actually run. It is deterministic — the same numbers whether you run 1 file or 76, with or without coverage, single-worker or multi-worker. It directly captures what developers experience and maps cleanly to actionable fixes (mock more, split files, reduce setup). No baselines, no multipliers, no exceptions needed. Simple absolute thresholds work.

The collect guard remains as informational diagnostics for developers who want to investigate import chain costs. The test guard is the blocking enforcer.

### Why not percentile-based thresholds (flag statistical outliers)?

**Resolved 2026-03-21.** Considered flagging files >2x the median collect time. Rejected because defining "statistical outlier" introduces unnecessary complexity (what percentile? how to handle small sample sizes? bimodal distributions?) while arriving at roughly the same conclusion as baseline subtraction. The delta approach is simpler and produces equivalent results.

### Why median instead of minimum for the baseline?

**Resolved 2026-03-21.** Initially designed with minimum. Testing revealed that pool overhead is not uniform across files — files scheduled early in the thread pool experience minimal overhead while later files get significantly more contention. The minimum only captures best-case scheduling (~11ms observed) while actual overhead per file ranged up to ~1000ms. The median represents what a typical file experiences, so files significantly above it are genuinely heavy. Files at or below the median are never flagged, which is correct — they're the lighter half of the suite. The 5000ms hard cap still catches the case where the entire suite drifts upward.

### Why not enforce per-file via a separate CI step running files individually?

**Resolved 2026-03-21.** Running each file individually would give accurate absolute measurements but would multiply suite runtime by the number of test files. The baseline-relative approach gives equivalent per-file enforcement in a single run.

### Why informational instead of blocking?

**Resolved 2026-03-21.** Some SFC compilation overhead (~700-900ms delta) is irreducible for component tests that must import their own `.vue` file. Blocking the pipeline for costs that cannot be reduced through mocking would force either raising thresholds to meaninglessness or maintaining per-file exceptions. An informational guard surfaces the data for developers to act on without creating false blockers. If SFC compilation costs are reduced in the future (e.g., through Vite caching improvements), the guard can be switched back to blocking.

### Why double thresholds in coverage mode instead of a fixed offset?

**Resolved 2026-03-21.** Istanbul instrumentation adds overhead proportional to file size and import chain depth — heavier files see more absolute overhead than lighter ones. A 2x multiplier approximates this proportional relationship better than a fixed offset would. Observed coverage overhead: ~300-400ms on baselines, ~400-500ms on the heaviest deltas.

### Why per-project baselines instead of one global baseline?

**Resolved 2026-03-21.** The test suite is split into three Vitest projects (unit/node, components/happy-dom, apps/happy-dom). Each project has fundamentally different import chain characteristics — unit tests have near-zero SFC overhead while component tests pay for Vue SFC compilation. A global baseline would mix these populations, making the median meaningless. Per-project baselines ensure each file is compared against its peers.

## Open Questions

- **Collect guard baseline drift** — if false signals appear in CI but not locally (or vice versa), we may need to revisit whether a single set of collect-duration thresholds works across all environments. No evidence of this yet. Less critical now that the collect guard is informational only.
- **Test guard threshold calibration at scale** — the 300ms/1000ms thresholds are calibrated against 76 test files. At 700+ files, the distribution may shift. Monitor and adjust if needed.
