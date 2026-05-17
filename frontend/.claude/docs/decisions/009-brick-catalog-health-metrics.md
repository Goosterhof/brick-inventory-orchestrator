# Decision: Component health registry — five metrics powering the Showcase app

**Date**: 2026-03-19
**Feature**: Brick Catalog enhancement — automated health analytics for shared components
**Status**: accepted
**Transferability**: Vue 3 monorepos with shared component libraries

## Context

We have 31 shared components today, but an incoming large-scale project will grow that number significantly. The manual brick catalog documents what exists, but it can't answer five questions that every component library faces at scale:

1. **"Who breaks if I touch this?"** — No visibility into which apps and domains consume a component. Refactoring is guesswork.
2. **"Is this truly shared or just misplaced?"** — Components in `shared/` that only one app uses are organizational debt. We can't identify them without manual searching.
3. **"Is this component getting bloated?"** — API surface (props, emits, slots) grows silently. A component that started with 2 props and now has 12 is a design smell that nobody notices until it's painful.
4. **"Is this component being thrashed?"** — A component with high churn when it should be stable signals upstream problems: unclear requirements, indecisiveness, or design issues that need revisiting.
5. **"Is this nesting justified?"** — Deep dependency chains combined with low consumer counts may indicate a component that shouldn't exist, or that's been split incorrectly. Coupled with future duplication detection, depth reveals components that serve the same purpose at different nesting levels.

These aren't LEGO-specific problems. They're universal to any Vue 3 monorepo with a shared component library, whether it has 20 components or 2000.

## Options Considered

| Option                                                                                                                               | Pros                                                                                                                                                                                          | Cons                                                                                                                                                                                                                                                                                                                   | Why eliminated / Why chosen                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Full observability suite (consumer map, adoption, API surface, churn, dependency depth, duplication detection, bundle size, age)** | Comprehensive. Answers every possible question about component health                                                                                                                         | Duplication detection is three separate analysis problems (props similarity, template similarity, function extraction) — each requiring different tooling. Bundle size is redundant with size-limit. Component age is a trivial `git log` query. Bundling everything delays delivery of the metrics that are ready now | Eliminated — duplication detection alone is complex enough to warrant its own ADR. Bundle size and age don't justify registry inclusion                                                    |
| **Five-metric registry: consumer map + adoption breadth + API surface + churn + dependency depth**                                   | Answers all five actionable questions. All achievable through static analysis + shallow git queries. Single generated JSON registry. Script can run under 3 seconds for brute-force full scan | Doesn't detect duplicate patterns. Some future questions remain unanswered                                                                                                                                                                                                                                             | **Chosen** — five metrics that each answer a distinct question, deliverable as a single script with a single output artifact. Duplication detection is explicitly deferred to a future ADR |
| **Tier 1 only: consumer map + adoption breadth + API surface**                                                                       | Cheapest to build. Answers the three most basic questions                                                                                                                                     | Misses churn and dependency depth, which answer qualitatively different questions (process health and structural soundness). Artificial tier system implies the other metrics are less important rather than acknowledging they answer different questions                                                             | Eliminated — the tier framing was wrong. Churn and dependency depth aren't "nice-to-haves," they provide signals the other three metrics cannot                                            |
| **Third-party tool (Storybook analytics, Chromatic, custom Webpack plugin)**                                                         | Someone else maintains it. Possibly more features out of the box                                                                                                                              | Storybook analytics requires Storybook (we use a custom Showcase app). Chromatic is visual regression, not structural analysis. Webpack plugins don't apply (we use Vite). None of these answer the adoption/consumer questions for a monorepo with multiple apps                                                      | Eliminated — no existing tool solves this specific problem for our stack                                                                                                                   |
| **Manual tracking in the brick catalog doc**                                                                                         | Zero tooling cost. Already have the doc                                                                                                                                                       | Becomes stale immediately. Nobody updates a markdown table when they add a prop. We already know manual docs drift — the brick catalog itself will drift without automation                                                                                                                                            | Eliminated — we've seen this movie before                                                                                                                                                  |

## Decision

Build five metrics in a single generated JSON registry, consumed by the Showcase app.

**The five metrics:**

- **Consumer map**: For each shared component, which files import it, grouped by app and domain. Answers "who breaks if I touch this?"
- **Adoption breadth**: How many apps and domains use the component. Answers "is this truly shared?"
- **API surface**: Props, emits, and slots extracted from each component's `defineProps`, `defineEmits`, and `<slot>` usage. Answers "is this getting bloated?"
- **Churn**: Number of commits and lines changed within a fixed 30-day rolling window. Answers "is this being thrashed?" Two dimensions — commit frequency (indecisiveness signal) and line magnitude (redesign signal) — require different responses.
- **Dependency depth**: How deep in the shared component tree a component sits. Combined with consumer count, answers "is this nesting justified?"

**Primary consumer:**

The Showcase app renders the registry data alongside component demos. Components are grouped by app with collapsible detail views. This makes health data visible to the entire team (20+ developers) without requiring them to read raw JSON. Design details are deferred to the designer.

**Enforcement:**

- **CI check**: Fails if the registry is stale. Developers are responsible for regenerating. CI does not auto-regenerate.
- **Pre-commit hook**: Regenerates the registry as a convenience. Catches staleness before the developer even commits.
- **Performance constraint**: The generation script must complete in under 3 seconds for a brute-force full scan. No incremental analysis — if performance becomes a problem at scale, that's a concrete signal to add it, not a reason to build it now.

**Merge conflicts:**

The registry is a generated file. When conflicts occur, developers regenerate it — same workflow as `package-lock.json`. Non-issue at any team size.

**Explicitly out of scope:**

- **Duplication detection** — Three distinct analysis problems (props similarity, template similarity, function extraction candidates) that each require different comparison strategies. Deferred to a dedicated future ADR.
- **Bundle size per component** — Redundant with the existing `size-limit` check.
- **Component age** — A trivial `git log --diff-filter=A` query. Not worth baking into a registry.
- **Automated warnings/thresholds** — No automated "consider relocating" warnings. No soft conventions. If it's not enforced, it doesn't exist. Warnings are future scope once the registry proves its value.
- **Test coverage per component** — Redundant with Istanbul/Vitest coverage.

## Consequences

- **Refactoring becomes informed** — before touching a component, check its consumer map. High consumer count = high blast radius = more careful review
- **Misplaced components get surfaced** — a component with low adoption breadth is visible to the team, even without automated warnings
- **API bloat becomes visible** — tracking prop/emit/slot counts shows which components are accumulating complexity
- **Process problems surface through churn** — high commit frequency on a supposedly stable component triggers investigation into upstream causes
- **Structural soundness is checkable** — deep dependency chains with low consumer counts are visible for routine review
- **One more generated file to maintain** — same workflow as `package-lock.json`, enforced by CI and pre-commit
- **The registry schema is extensible** — duplication detection and other future metrics can be added without restructuring
- **Showcase app gains a new section** — adds a UI deliverable to the scope, but directly serves the team's daily workflow
- **The ADR itself is part of the showcase** — the reasoning behind metric selection (what's in, what's out, and why) demonstrates architectural thinking to reviewers. The value isn't just the tool — it's the decision-making process behind it
