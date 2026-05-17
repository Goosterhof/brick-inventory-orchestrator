# Learnings — _Getting Sharper_

Corrections and discoveries captured during work. Not philosophy — operational rules with teeth.

**When to add an entry**: After any mistake, non-obvious discovery, or user correction. If you'd tell your past self "watch out for this" — write it down.

**Ownership**: Three-tier review process:

1. The **architect** flags candidate learnings in the report-back — stated as observations, not settled rules
2. The **CFO** (main conversation agent) critically evaluates: Is this actually a pattern or a one-off? Is the rule correctly scoped? Does it contradict existing learnings? Presents recommendations to the CEO with commentary
3. The **CEO** (human) decides what gets committed

No learning lands here without this review. The CFO's job is to prevent low-quality entries and challenge sloppy generalizations.

**Format**: Each entry is a rule, not a story. Present tense, imperative mood. Include the _why_ only if it's not obvious.

**Graduation**: When a learning proves itself across multiple sessions, promote it:

- **Operational rules** → CLAUDE.md or the relevant skill file
- **Architectural patterns** → [Decision Log](./decisions.md) as a formal decision record
- **Component-specific rules** → the agent definition's "Key Patterns to Remember" section

Then delete it from here — this file stays lean.

**Relationship to Decision Log**: Learnings are discoveries — things that surprised you. Decisions are choices — things you weighed and picked. A learning might become a decision ("we learned X, so from now on we do Y"), but most learnings stand alone.

---

## Codebase Gotchas

_Things that bite you if you don't know them._

- FormLabel's `for` prop is optional — it was documented with `—` (ambiguous) instead of `undefined`. Use explicit defaults in catalog tables to avoid confusion.
- Button component tests (PrimaryButton, DangerButton, BackButton, ListItemButton) lack keyboard interaction tests (Enter/Space). Same for NavLink and NavMobileLink. Add these when touching these components next.

## User Preferences

_How this project's owner likes things done._

- Lego studs must be round (`rounded-full`) — this is an intentional exception to the no-border-radius rule. Documented in brand.md.

## Patterns That Work

_Approaches that proved effective in this codebase._

- When adding a new domain: create routes first (`index.ts`), then pages, then tests — catches naming mismatches early before wiring.
- For form pages: wire up the happy path end-to-end before handling error states. Get the `loadingService.start()` → API call → `loadingService.stop()` loop working, then layer in `catch` blocks.

## Future Improvements

_Things to revisit when external tooling catches up._

- **Oxlint JS plugins can replace `scripts/lint-vue-conventions.mjs`** — once Vue SFC support lands in the beta (Milestone 3: https://github.com/oxc-project/oxc/issues/19918). The three custom checks (multi-word PascalCase names, block order, define-macros order) can become native oxlint rules via a `jsPlugins` entry in `.oxlintrc.json`. This removes the separate `lint:vue` script, the extra `*.vue` lint-staged entry, and gives IDE integration for free. Alpha announced 2026-03-11: https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha

## Mistakes Not to Repeat

_Specific errors and their fixes._

- Never use `RouterLink` in shared components — the families app uses a custom RouterService and never installs Vue Router. `RouterLink` causes a blank page crash on mount. Use plain `<a>` tags that emit click events.
- Don't set bundle budgets based on a single entry chunk — size-limit globs match all JS chunks (entry + lazy-loaded routes). Budget must account for the sum, not the biggest file.
- Don't forget `meta: {authOnly: true}` on protected routes — the router guard silently passes without it, giving unauthenticated users a broken page instead of a redirect.
