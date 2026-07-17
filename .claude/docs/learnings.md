# Brickworks Learnings — _Getting Sharper_

Corrections and discoveries captured during work, across both wings of The Brickworks. Not philosophy — operational rules with teeth.

**When to add an entry**: After any mistake, non-obvious discovery, or user correction. If you'd tell your past self "watch out for this" — write it down.

**Ownership**: Three-tier review process:

1. The **Brickwright** flags candidate learnings in the Build Record — stated as observations, not settled rules
2. **The Steward** (main conversation agent) critically evaluates: Is this actually a pattern or a one-off? Is the rule correctly scoped? Does it contradict existing learnings? Presents recommendations to the CEO with commentary
3. The **CEO** (human) decides what gets committed

No learning lands here without this review. The Steward's job is to prevent low-quality entries and challenge sloppy generalizations.

**Format**: Each entry is a rule, not a story. Present tense, imperative mood. Include the _why_ only if it's not obvious. Tag wing-specific entries `[Foundry]` or `[Gallery]`; leave cross-wing entries untagged.

**Graduation**: When a learning proves itself across multiple sessions, promote it:

- **Operational rules** → root `CLAUDE.md`, the relevant wing manual (`backend/CLAUDE.md` or `frontend/CLAUDE.md`), or the relevant skill file
- **Architectural patterns** → [Decision Log](./decisions.md) as a formal ADR
- **Component-specific rules** → the relevant agent's main training body or wing-graduation log

Then delete it from here — this file stays lean.

**Relationship to Decision Log**: Learnings are discoveries — things that surprised you. Decisions are choices — things you weighed and picked. A learning might become a decision ("we learned X, so from now on we do Y"), but most learnings stand alone.

---

## Codebase Gotchas

_Things that bite you if you don't know them._

- **[Gallery]** FormLabel's `for` prop is optional — it was documented with `—` (ambiguous) instead of `undefined`. Use explicit defaults in catalog tables to avoid confusion.
- **[Gallery]** Button component tests (PrimaryButton, DangerButton, BackButton, ListItemButton) lack keyboard interaction tests (Enter/Space). Same for NavLink and NavMobileLink. Add these when touching these components next.
- Pre-commit and pre-push hooks route by staged/pushed path (`backend/**` triggers the PHP gauntlet, `frontend/**` triggers the Vue gauntlet), not by file extension. Markdown edits under `backend/` still fire the full backend gauntlet (lint:test → phpstan → phpstan:types → deptrac → test:arch on pre-commit; composer test on pre-push). Don't claim "hook is a no-op for this commit" in a Build Record without checking the staged path against the routing rules in root `CLAUDE.md` ("Git Hooks (Root Dispatcher)").
- `composer audit` exits non-zero on first findings, masking additional advisories from the same upstream batch. After patching the first batch, rerun the audit — a single "no findings" output does not prove a clean lock; an iterated "no findings" does. See Casebook Methodology Note (2026-05-20) and the symfony-805-cve-bump Build Record (Decision #1).
- `gh pr merge --squash --delete-branch` tries to fast-forward local `main` to the squash-merge after deleting the branch. If local `main` has unpushed commits whose content is included in the squash (e.g. session-minute auto-commits cut into the feature branch), the fast-forward aborts with `fatal: Not possible to fast-forward`. The remote merge succeeds anyway. Sync local main with `git reset --hard origin/main` (destructive but safe — the content is preserved in the squash) once the CEO authorizes.

## User Preferences

_How this project's owner likes things done._

- **[Gallery]** Lego studs must be round (`rounded-full`) — this is an intentional exception to the no-border-radius rule. Documented in `brand.md`.

## Patterns That Work

_Approaches that proved effective in this codebase._

- **[Gallery]** When adding a new domain: create routes first (`index.ts`), then pages, then tests — catches naming mismatches early before wiring.
- **[Gallery]** For form pages: wire up the happy path end-to-end before handling error states. Get the `loadingService.start()` → API call → `loadingService.stop()` loop working, then layer in `catch` blocks.
- When filing a scope-narrow Work Order whose Acceptance Criteria include a programmatic check (`rg` sweep, file-resolution check, count verification), run that check against the pre-edit baseline **before** writing the In-Scope / Not-in-Scope sections. The post-merger baseline audit (2026-05-20) enumerated 4 framework-drift hits but the AC's broader `rg` sweep would have surfaced a 5th in `brickwright.md` upfront. Gaps between WO Scope and AC reveal audit blind spots before execution rather than during it.

## Future Improvements

_Things to revisit when external tooling catches up._

- **[Gallery] Oxlint JS plugins can replace `scripts/lint-vue-conventions.mjs`** — once Vue SFC support lands in the beta (Milestone 3: https://github.com/oxc-project/oxc/issues/19918). The three custom checks (multi-word PascalCase names, block order, define-macros order) can become native oxlint rules via a `jsPlugins` entry in `.oxlintrc.json`. This removes the separate `lint:vue` script, the extra `*.vue` lint-staged entry, and gives IDE integration for free. Alpha announced 2026-03-11: https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha

## Mistakes Not to Repeat

_Specific errors and their fixes._

- **[Gallery]** Never use `RouterLink` in shared components — the families app uses a custom RouterService and never installs Vue Router. `RouterLink` causes a blank page crash on mount. Use plain `<a>` tags that emit click events.
- **[Gallery]** Don't set bundle budgets based on a single entry chunk — size-limit globs match all JS chunks (entry + lazy-loaded routes). Budget must account for the sum, not the biggest file.
- **[Gallery]** Don't forget `meta: {authOnly: true}` on protected routes — the router guard silently passes without it, giving unauthenticated users a broken page instead of a redirect.

## Foundry Wing — Pending First Build

The Foundry Wing's pre-merger `learnings.md` carried placeholder text ("Pending first Head Sorter shift") rather than substantive entries. Foundry learnings will accumulate here as Build Records file them and The Steward dispositions them. Until then, Foundry operational rules live in `backend/CLAUDE.md` and in the Brickwright's Foundry graduation log (`.claude/agents/brickwright-foundry-graduation.md`).
