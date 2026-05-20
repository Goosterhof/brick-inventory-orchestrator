# Work Order: Pattern Master — Build Proposal C (Brick-DNA Snap-and-Pull)

**Work Order #:** 2026-05-20-pattern-master-proposal-c-build
**Filed:** 2026-05-20
**Issued By:** CEO (pick decision in the first-standup follow-up session, ordered C → A → B)
**Assigned To:** Pattern Master
**Wing:** Gallery
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `pattern-master-proposal-c-build`

---

## The Job

Build **Proposal C — Brick-DNA Snap-and-Pull**: tactile pickup/press/release micro-interactions for LEGO-shape components, deployed across the Showcase `BrickShapes.vue` section, the playground page's Brick Dimensions area, and the `HomePage.vue` logged-out hero's stacked LEGO bricks.

This Work Order builds the proposal authored by the Pattern Master in [`2026-05-20-pattern-master-gallery-showcase-brief`](../build-records/2026-05-20-pattern-master-gallery-showcase-brief.md), in the CEO's confirmed priority order: **C first, A second, B last.** Proposals A and B are *not* part of this WO; they get their own follow-up Work Orders after C ships and earns trust.

## Scope

### In the Box

Per the proposal Build Record's "Proposal C" section, deliver:

- **`useBrickPickup()` composable** in `src/shared/composables/` — reusable across all consuming surfaces. Exposes the hover/press/release/spring-settle behavior with parameter inputs and a strict `prefers-reduced-motion` short-circuit.
- **`brick-anim-pickup` UnoCSS shortcut** in `uno.config.ts` — discoverable, attributify-compatible, named per the `brick-anim-*` convention.
- **Showcase section redesign — `BrickShapes.vue`** — interactive parameter playground showing live duration/easing/distance values + a comparison grid (matches the `PageTransitionDemo` precedent for visible parameters).
- **Playground page — Brick Dimensions section** — apply the pickup interaction to the dimension demonstration bricks.
- **`HomePage.vue` logged-out hero** — apply the pickup interaction to the stacked LegoBrick decorations.
- **`SoundService.play('snap')` and `SoundService.play('thud')` wired in** — currently unused primitives. The snap on press, the thud on release-into-place after drag. Sounds respect existing user-preference + `prefers-reduced-motion` gating.
- **Parameter Record** in the Build Record — verbatim final values for every dialed parameter, per the Pattern Master's standard. This is the first delivery in 33 days, and the page-transition graduation candidates in your log are at 2 observations each — Proposal C's parameter values, if landed cleanly, may tick the easing/distance entries to 3+ and earn graduation candidate test scenarios.
- **`prefers-reduced-motion` fallback** in every animated surface — duration 0, no translate, color-or-border-only cues. Non-negotiable per Pattern Master agent definition. Tested.
- **100% test coverage** on the composable, the UnoCSS shortcut consumers, and the rewired Showcase section, per Gallery's coverage mandate.

### Not in This Set

- **Proposal A (List Cascade)** — deferred per CEO order. Files a separate WO after Proposal C ships and earns trust. The list cascade should echo C's tuned easing/distance vocabulary, so building it before C exists would inverse the dependency.
- **Proposal B (Tumbling Bricks)** — deferred to third per CEO order. Filed after A.
- **`CollapsibleSection.vue` `<Transition>` wrapper** — flagged by the Pattern Master as a structural Brickwright dependency in the proposal Build Record. *If* the build encounters a real need for the wrapper (e.g., for the parameter-playground UI), file a Friction Protocol via Build Record and let the Steward route to the Brickwright. Don't restructure shared components in this WO without Steward routing.
- **Drag-and-drop on the HomePage hero bricks** — drag is mentioned as optional in the proposal. The press-and-release lift + sound is in scope; full drag-to-arbitrary-position is out of scope for this first delivery. If the showcase section warrants drag (because it teaches the parameter), keep it scoped to the BrickShapes showcase section and gate it behind a hint label.

## Acceptance Criteria

- [ ] `src/shared/composables/useBrickPickup.ts` exists, exposed, tested 100%.
- [ ] `brick-anim-pickup` UnoCSS shortcut defined in `uno.config.ts`.
- [ ] `BrickShapes.vue` Showcase section renders all 7 shapes with the pickup interaction wired; visible parameter values and (where appropriate) interactive controls.
- [ ] Playground page Brick Dimensions section applies the pickup interaction.
- [ ] `HomePage.vue` logged-out hero stacked bricks apply the pickup interaction.
- [ ] `SoundService.play('snap')` fires on press; `SoundService.play('thud')` fires on release-into-place. Existing user-preference and `prefers-reduced-motion` gating respected.
- [ ] `prefers-reduced-motion` fallback test: with the OS preference set, no translate is applied, no sound plays, only color/border cue (verify in a unit test).
- [ ] Gallery gauntlet green: `format:check`, `lint`, `lint:vue`, `type-check`, `test:coverage` (100% lines/branches/functions/statements), `knip`, `size`, `build`.
- [ ] Parameter Record section in the Build Record completed with verbatim final values for every dialed parameter (per Pattern Master's mandatory section).
- [ ] Self-debrief in the Build Record covers What Went Well / What Went Poorly / Blind Spots / Training Proposals.
- [ ] **This WO's Status flips to Completed and Build Record back-linked in the same commit as the Build Record's filing** — honoring the training rule from [`2026-05-20-wo-closure-sweep`](2026-05-20-wo-closure-sweep.md). Pattern Master's agent training will need a graduation log entry to make this convention native to the role; flag it in the Build Record's Training Proposals.

## References

- The proposal: [`2026-05-20-pattern-master-gallery-showcase-brief`](../build-records/2026-05-20-pattern-master-gallery-showcase-brief.md), Proposal C section
- Pattern Master agent definition: [`.claude/agents/pattern-master.md`](../../agents/pattern-master.md) — including graduation log section with the four page-transition parameters at 2 observations each
- ADR-0026 (Pattern Master role creation): [`.claude/docs/adr/0026-creative-engine-agent.md`](../../docs/adr/0026-creative-engine-agent.md)
- WO closure sweep training rule: [`2026-05-20-wo-closure-sweep`](../build-records/2026-05-20-wo-closure-sweep.md)
- Pulse Pattern Maturity (updated 2026-05-20): [`pulse.md`](../../docs/pulse.md) — note that "Page integration tests (ADR-0024)" is now "Established" not "Battle-tested"; consult the current Pulse for accurate Gallery state
- Relevant Active Concerns: any animation on lists or showcase that intersects with `PartsPage.spec.ts` (collect-guard VIOLATION — heavy import chain) should account for not making the violation worse

## Notes from the Issuer

The CEO ordered the three proposals C → A → B, matching the Pattern Master's self-rank. The Pattern Master proposed C as "highest portfolio-value-per-effort, exercises dual mandate in one deliverable" — the Steward agrees. C touches the logged-out homepage (first-impression surface), retires unused `SoundService` primitives, and produces the most graduation-log data points of the three.

Two specific things to watch during the build:

1. **The home page is the highest-stakes surface.** A subtle pickup interaction on three stacked bricks should make the page feel responsive without being noisy. Test the reduced-motion fallback first, before touching the active animation — same discipline as your `prefers-reduced-motion` first-principle.

2. **Parameter graduation is in reach.** Your graduation log has four parameters at 2 observations each (page-transition values). If Proposal C's chosen easing matches `cubic-bezier(0.2, 0, 0, 1)` and the translate distance lands in the 6-10px range you sketched, those entries tick to 3+ and become eligible for graduation candidate test scenarios. Report the alignment (or deliberate divergence) explicitly in the Parameter Record.

After this Work Order ships and earns the CEO's approval, Proposal A's follow-up WO can be filed. A's parameter vocabulary should echo C's where appropriate (the list-cascade entrance easing should probably match the pickup hover easing for visual coherence). Don't pre-decide that in C — let it emerge in C's actual dial-in, then carry it to A.

---

**Status:** Open
**Build Record:** _to be filed by the Pattern Master at delivery_
