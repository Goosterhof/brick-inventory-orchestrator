# Decision: UnoCSS with attributify mode, no freeform CSS

**Date**: 2026-03-17 (revised 2026-03-18)
**Feature**: Styling approach and design system enforcement
**Status**: accepted
**Transferability**: universal

## Context

Every frontend project needs a styling strategy. The critical question isn't "which CSS tool" — it's whether the design system is enforced by the tooling or only by convention. If a developer can write arbitrary CSS anywhere, design system compliance depends entirely on discipline and code review. With a team of 20+ juniors, that's not a reliable enforcement mechanism.

A second concern: dead CSS. Traditional `<style>` blocks accumulate unused rules silently. In a multi-app platform with shared components, styles written for one context can ship unused in another. Any approach that lets CSS exist independently of the elements using it creates a maintenance burden that grows with the team and the codebase.

## Options Considered

| Option                                           | Pros                                                                                                    | Cons                                                                                                                                                                   | Why eliminated / Why chosen                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Scoped CSS / SCSS in `<style>` blocks**        | Familiar, full CSS power, component-scoped                                                              | Dead CSS accumulates silently. Design system compliance is convention-only — nothing stops arbitrary values. Two places to read per component (template + style block) | Eliminated — doesn't enforce the design system, creates maintenance debt     |
| **CSS Modules**                                  | Scoped by default, composable                                                                           | Same dead CSS problem. More indirection (class name imports). Still doesn't enforce design constraints                                                                 | Eliminated — solves scoping but not the core problem                         |
| **UnoCSS class-based** (standard Tailwind-style) | Atomic, tree-shaken, co-located                                                                         | Class strings get very long and hard to read                                                                                                                           | Eliminated in favor of attributify, but could have worked                    |
| **UnoCSS attributify + design system shortcuts** | Atomic + readable attributes (`p="x-4 y-2"`). Shortcuts encode design system constraints. Zero dead CSS | Learning curve. IDE support less mature than class-based. Some HTML attributes look unusual                                                                            | **Chosen** — shortcuts turn the design system into an enforceable vocabulary |

## Decision

Three rules:

1. **UnoCSS attributify is the primary styling mechanism.** All styling lives in the template via attributes and shortcut classes. Attributify makes templates readable: `p="x-4 y-2" bg="white hover:yellow" font="bold"` reads like a specification, not a class string.

2. **Design system constraints are encoded as named shortcuts.** Shortcuts aren't aliases for convenience — they define what the design system _means_. A shortcut for "standard border" enforces consistency: if someone needs a different border, they have to explicitly break from the system rather than accidentally diverging. Each project defines its own shortcuts in the UnoCSS config.

3. **`<style scoped>` is allowed only for third-party CSS overrides and CSS edge cases.** Unscoped `<style>` blocks are banned. The vast majority of components should have zero `<style>` blocks. When overriding third-party components (date pickers, rich text editors, etc.) or handling genuine CSS edge cases that UnoCSS can't express, `<style scoped>` is the intentional escape hatch. The `scoped` requirement signals to reviewers: "this is a deliberate override, not casual CSS."

### When to create a new shortcut

A new shortcut must meet all three criteria:

1. **Used in 3+ components** — one or two usages don't justify abstraction
2. **Encodes a design system concept** — it defines what "bordered" or "elevated" means in the system, not just a convenience alias
3. **Combines 3+ utilities** — a shortcut for a single utility adds indirection for zero readability gain

If any criterion is not met, use inline utilities.

### When to extract dynamic styling to a computed

1 ternary per attribute is fine inline (e.g., `:bg="active ? 'yellow' : 'white'"`). Extract to a computed property when: 2+ ternaries appear on the same element, a ternary is nested, or a dynamic class object has 3+ conditions. A single ternary reads like a specification — multiple ternaries read like business logic, which belongs in `<script setup>`.

## Consequences

- **Zero dead CSS**: UnoCSS generates only what's used in templates. No unused styles ship
- **Design system as code**: Shortcuts are the design system. Changing a shortcut changes it everywhere
- **Readability**: Templates are self-describing. No context-switching to a `<style>` block for most components
- **Trade-off**: Complex conditional styling requires ternaries or computed properties, which can add verbosity. Accepted because it keeps styling co-located
- **IDE support**: Attributify has less autocomplete support than class-based Tailwind. Developers need to know the utility names
- **Escape hatch**: `<style scoped>` exists for the cases where UnoCSS can't reach (third-party component internals, CSS features not expressible as utilities)

## Enforcement

| What                             | Mechanism                                                                                 | Scope            |
| -------------------------------- | ----------------------------------------------------------------------------------------- | ---------------- |
| Unscoped `<style>` blocks banned | Custom linter (`scripts/lint-vue-conventions.mjs`, check 4) — `<style scoped>` is allowed | All `.vue` files |

The shortcut criteria and ternary threshold are judgment-call guidelines documented here, not lint-enforceable rules.
