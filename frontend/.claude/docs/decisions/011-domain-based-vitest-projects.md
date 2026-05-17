# Decision: Domain-based Vitest project split with factory configuration

**Date**: 2026-03-22
**Feature**: Test suite organization and developer clarity
**Status**: accepted
**Transferability**: universal

## Context

The test suite was split into three Vitest projects by test type (unit/components/apps) to create homogeneous worker pools for a collect-duration guard. That guard was subsequently demoted to informational — the execution-time guard (ADR-010) replaced it as the primary enforcer and doesn't need project-level baselines.

The test-type split remained, but caused ongoing friction:

- **Fragile classification rules**: Hand-curated include/exclude file lists in `vitest.config.ts`, with comments explaining misclassifications (`csv.spec.ts` uses `document.createElement` so it's a "component" despite being a helper). Every new test file requires evaluating "does this use DOM globals? `@vue/test-utils`? Both?"
- **Unclear for juniors**: "My new service test — does it go in `unit` or `components`?" requires understanding Vitest environment implications, not just where the source code lives. Juniors shouldn't need to know about happy-dom vs node to place a test file.
- **Doesn't match the architecture**: The codebase is organized by domain (sets, storage, auth), but tests are organized by type. A developer working on the sets domain has their tests scattered across the `components` and `apps` projects.

The question: how should test projects be organized so that a junior can mechanically determine where a test belongs without understanding test infrastructure internals?

## Options Considered

| Option                                                                 | Pros                                                                                                   | Cons                                                                                                                                     | Why eliminated / Why chosen                                                           |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Keep test-type split (unit/components/apps)**                        | Already implemented. Different environments per type                                                   | Fragile classification, doesn't match architecture, juniors can't self-serve. Motivated by a guard that's no longer the primary enforcer | Eliminated — solving a problem that no longer exists                                  |
| **Single flat project (no split)**                                     | Zero configuration, all tests in one pool                                                              | No per-domain isolation, setup file would accumulate domain-specific config. At 700+ files, no structural organization                   | Eliminated — doesn't scale                                                            |
| **Domain-based projects with per-domain setup files**                  | Matches architecture, clear ownership per domain                                                       | Setup files accumulate mocks, leading to "someone mocked X in setup and broke my test" — a known recurring problem across projects       | Eliminated — setup-file mocking is a maintenance trap                                 |
| **Domain-based projects with one global setup file, per-file mocking** | Matches architecture, clear ownership, no mock confusion. Factory function eliminates config verbosity | More projects in config (15+ now, 50+ at scale). Slight CI overhead (~1-2 minutes). New domains require a config line                    | **Chosen** — clarity for juniors outweighs config volume, factory makes it manageable |

## Decision

### One project per domain/directory

Every testable domain or shared directory gets its own Vitest project. Projects are named with a two-part prefix that mirrors the source architecture:

| Pattern              | Example             | Maps to                                                   |
| -------------------- | ------------------- | --------------------------------------------------------- |
| `{app}/{domain}`     | `families/sets`     | `src/tests/unit/apps/families/domains/sets/`              |
| `{app}/root`         | `families/root`     | `src/tests/unit/apps/families/App.spec.ts` (and siblings) |
| `shared/{directory}` | `shared/components` | `src/tests/unit/shared/components/`                       |
| `architecture`       | `architecture`      | `src/tests/unit/architecture.spec.ts`                     |

The two-part name immediately tells a developer where in the codebase a project lives. No ambiguity between app domains and shared directories.

### Factory function for project configuration

A factory function generates project config from a name and include path:

```ts
const project = (name: string, include: string) => ({
    extends: true,
    test: {
        name,
        environment: 'happy-dom',
        setupFiles: ['./src/tests/unit/setup.ts'],
        include: [`src/tests/unit/${include}/**/*.spec.ts`],
    },
});
```

The projects array becomes a scannable manifest — one line per project. At 50+ projects, adding a domain means adding one line, not a config block.

Projects that need `node` instead of `happy-dom` (pure TS with no DOM globals) can override via a factory parameter.

### One global setup file, no mocks

A single `setup.ts` shared by all projects. It contains only environment configuration:

- `config.global.renderStubDefaultSlot = true` (Vue Test Utils)
- Happy-dom polyfills for missing browser APIs (e.g., HTMLMediaElement constants)

**No mocks in setup — ever.** All mocks live in the test file that needs them (per ADR-010). Happy-dom polyfills and browser API workarounds live in the test file until they appear in 3+ files, then they get extracted to a shared test helper.

This rule exists because of a recurring problem across projects: mocks in setup files cause invisible test failures. A developer adds a mock to setup, another developer's test silently changes behavior, and the failure surfaces far from the cause.

### Classification rule for juniors

Where does my test go? Follow the source file:

- Source is in `src/apps/families/domains/sets/` → project is `families/sets`
- Source is in `src/shared/components/` → project is `shared/components`
- Source is in `src/apps/admin/App.vue` → project is `admin/root`

No judgment calls about environments, DOM globals, or test-utils usage. The source file's location determines the project. The factory handles environment defaults.

## Consequences

- **Mechanical classification** — juniors never ask "which project?" — they follow the source path
- **Config is a manifest** — `vitest.config.ts` reads as a list of all testable areas in the codebase, one line each
- **CI overhead** — more projects means more Vitest infrastructure per run. ~1-2 minutes at scale (50+ projects). Accepted for clarity
- **New domain requires config change** — risk of forgetting mitigated by architecture test, but not eliminated
- **Global setup stays minimal** — no per-project setup files to maintain, no mock confusion

## Enforcement

| What                                                   | Mechanism                                                          | Scope                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Every test file covered by exactly one project         | Architecture test in `architecture.spec.ts`                        | All `*.spec.ts` files — catches missing domains and orphaned tests |
| No mocks in setup files                                | ADR-010 lint rule (factory required on `vi.mock()`) + code review  | `setup.ts` and any future setup files                              |
| Project naming convention (`app/domain`, `shared/dir`) | Factory function signature — name is a required parameter          | `vitest.config.ts`                                                 |
| Missing domain detection                               | Architecture test compares domain directories against project list | All `src/apps/*/domains/*/` directories                            |

## Resolved Questions

### What about domains with only 1 test file?

**Resolved 2026-03-22.** Every domain gets its own project regardless of size. A domain with 1 test file is likely undertested, not a reason to skip the project. The ceremony of having a project entry signals that the domain exists and needs coverage. The factory makes the cost of a single-file project negligible (one line in config).

### What about the node vs happy-dom environment distinction?

**Resolved 2026-03-22.** The factory defaults to `happy-dom`. Pure TS projects (`shared/errors`, `shared/helpers`) can override to `node` via a factory parameter. This is a performance optimization, not a classification concern — the developer doesn't need to think about it. If a test fails because it needs DOM globals, the fix is to use the default environment, not to reclassify the test.

### Won't 50+ projects slow down CI significantly?

**Resolved 2026-03-22.** Measured at ~1-2 minutes additional overhead at scale. Accepted trade-off — clarity for a team of 20+ developers is worth more than 2 minutes of CI time. Locally, developers rarely run the full suite; they run their domain's project with `--project=families/sets`.

## Open Questions

- **Automated detection of missing domain projects** — the architecture test catches orphaned test files, but a new domain with no tests yet won't be flagged. Consider a lint rule or CI check that compares domain directories against the project list.
