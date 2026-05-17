# Decision: Domain-driven vertical slices over technical layers

**Date**: 2026-03-08
**Feature**: Top-level code organization for a multi-domain Vue 3 application
**Status**: accepted
**Transferability**: universal

## Context

The Families app has seven domains (auth, home, sets, storage, parts, settings, about), with more expected as the application grows. The question is structural: how should the `src/apps/families/` directory organize its code?

Two common approaches exist in the Vue ecosystem:

1. **Technical layers** — `components/`, `stores/`, `services/`, `types/` at the top level, with all domains mixed within each layer
2. **Vertical slices** — each domain is a self-contained directory with its own pages, modals, types, and route definitions

### The Problem for AI Agents and Juniors

Without explicit documentation, both AI agents and junior developers default to the technical-layer approach because it's what tutorials and starter templates demonstrate. When asked to "add a new feature for wishlists," the natural move is to create `components/WishlistPanel.vue`, `types/wishlist.d.ts`, `stores/wishlists.ts` — scattering the feature across the codebase instead of creating a cohesive `domains/wishlists/` directory.

This is not a discipline problem. It's a structural problem: when the convention isn't declared, the default wins.

### Relationship to ADR-008

ADR-008 (Domain Isolation) governs how domains interact — specifically, that they cannot import from each other. This ADR governs how domains are _structured_. ADR-008 enforces boundaries between domains; this ADR defines what a domain _is_ and how it's laid out.

## Options Considered

| Option                                                       | Pros                                                                                                                                                                                                           | Cons                                                                                                                                                                                                   | Why eliminated / Why chosen                                                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Vertical slices by business domain**                       | Self-contained; adding a feature is additive (create one directory); removing is subtractive (delete one directory); AI agents can scaffold from any existing domain; architecture tests enforce the structure | Deep nesting (5+ levels for nested pages); cross-domain references require shared types at app level; unfamiliar to devs trained on flat tutorials                                                     | **Chosen** — the self-containment and predictability outweigh the nesting cost, especially for a team of 20+ juniors |
| **Technical layers** (`components/`, `stores/`, `services/`) | Familiar from Vue tutorials; flat directory structure; easy to find "all components"                                                                                                                           | With 7+ domains, each layer becomes a flat list of unrelated files; adding a feature touches 4+ directories; AI agents scatter code by default; no structural protection against cross-domain coupling | Eliminated — doesn't scale for the team size or the domain count                                                     |
| **Hybrid (technical layers + domain prefixes)**              | Familiar structure; some grouping by domain via naming                                                                                                                                                         | Naming conventions are not enforceable; `components/SetsList.vue` and `components/StorageList.vue` still live side by side; the grouping is cosmetic, not structural                                   | Eliminated — offers the appearance of organization without the structural guarantees                                 |

## Decision

The frontend uses **vertical slices organized by business domain**. Each domain is a self-contained directory under the app's `domains/` folder.

### Domain Structure

```
domains/[name]/
├── index.ts           # Route exports (the only public surface)
├── pages/             # Page components for this domain
├── modals/            # Domain-specific modal components (optional)
└── types/             # Domain-specific types (optional, for types not shared cross-domain)
```

Domain `index.ts` files export **only routes** — no components, no utilities, no types. This keeps the public surface area at zero, preventing domains from accidentally becoming import targets (enforced by ADR-008).

### Shared Code Lives Outside Domains

Code needed by multiple domains lives at the app level or in `@shared/`:

- **`@shared/components/`** — reusable UI components (forms, dialogs, layout)
- **`@shared/composables/`** — reusable composition functions
- **`@shared/helpers/`** — utility functions
- **`@shared/types/`** — universal type definitions
- **`@app/types/`** — app-level types referenced by multiple domains
- **`@app/services/`** — app-level service instances

The rule is mechanical: if two domains need it, it lives in `@shared/` or `@app/`. No domain is a dependency of another domain.

### Adding a New Domain

Creating a new domain is additive:

1. Create `domains/[name]/` with `index.ts`, `pages/`, and route definitions
2. Register the routes in the app's router
3. Architecture tests verify the structure automatically

No changes to existing domains required. No barrel exports to maintain. No import paths to update.

### Removing a Domain

Removing a domain is subtractive:

1. Delete `domains/[name]/`
2. Remove route registration
3. If the domain promoted types to `@app/types/`, check for orphans

No cross-domain imports to untangle — ADR-008 guarantees isolation.

## Consequences

- New domains follow a predictable, scaffoldable pattern — AI agents and juniors can generate from any existing domain
- Import paths are intuitive: `domains/sets/pages/SetsOverviewPage.vue` reads like what it is
- Tests and domain-specific code live together — no cross-directory hunting
- Deleting a domain is safe — ADR-008 guarantees no other domain imports from it
- Deep nesting is a real cost: `domains/sets/pages/SetsDetailPage.vue` is manageable, but nested domains (if ever needed) could go 5+ levels deep
- Unfamiliar to developers trained on flat Vue tutorials — the convention must be documented (this ADR) and enforced (architecture tests)

## Enforcement

| What                                             | Mechanism                                        | Scope                           |
| ------------------------------------------------ | ------------------------------------------------ | ------------------------------- |
| Domain directories follow the expected structure | Architecture test: `domain-structure.spec.ts`    | `src/apps/*/domains/`           |
| Domain index files export only routes            | Architecture test: `domain-structure.spec.ts`    | `src/apps/*/domains/*/index.ts` |
| Cross-domain imports prohibited                  | ADR-008 enforcement (oxlint + architecture test) | `src/apps/*/domains/`           |

## Resolved Questions

### Should domains contain their own store files?

**Resolved 2026-03-08.** App-level adapter stores (ADR-007) handle shared data fetching. Domains contain pages, modals, and route definitions — not stores. If a domain needs data, it uses the app-level store or fetches independently. This keeps domains thin and prevents store duplication.

### What about domains that share a visual component?

**Resolved 2026-03-08.** Promote it to `@shared/components/`. The slight overhead of promotion is preferable to allowing cross-domain imports. ADR-008's isolation rule is non-negotiable.

## Open Questions

- As domain count grows beyond 10, should domains be grouped into higher-level categories (e.g., `domains/inventory/sets/`, `domains/inventory/parts/`)? Current assessment: not yet needed with 7 domains, but worth revisiting if the domain count doubles.
