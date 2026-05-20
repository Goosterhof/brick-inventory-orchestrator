# Build Record: Pattern Master — Gallery Showcase Self-Direction Brief

**Build Record #:** 2026-05-20-pattern-master-gallery-showcase-brief
**Filed:** 2026-05-20
**Work Order:** [`.claude/records/work-orders/2026-05-20-pattern-master-gallery-showcase-brief.md`](../work-orders/2026-05-20-pattern-master-gallery-showcase-brief.md)
**Builder:** Pattern Master
**Wing:** Gallery (survey only — no code)

---

## Work Summary

No files created, modified, or deleted. This is a **survey + proposal** Build Record. The deliverable is the proposal set below; the build comes from a follow-up Work Order once the CEO picks a direction.

| Action | File | Notes |
|---|---|---|
| _(none)_ | _(none)_ | Exploration WO — read-only firm-state intake. |

## Work Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Build Record filed with the enumerated sections | Yes | This document. |
| At least 2 candidate creative directions, no more than 4 | Yes | Three candidates filed (Section: Proposals). |
| Each proposal has: name, type, parameter-range sketch, portfolio rationale, effort estimate | Yes | Per-proposal subsections below. |
| Self-ranked recommendation with one-sentence reasoning | Yes | Section: Self-Rank. |
| Standard self-debrief sections honored | Yes | Section: Self-Debrief, including blind spots and training proposals. |
| Quality Gauntlet section explicitly notes N/A — no code shipped | Yes | Section: Quality Gauntlet. |

---

## Survey: What I Read, What's Been Shipping Without Me

### What I read

- The Work Order, the 2026-05-20 standup, and the Pulse (flagged staleness disclosed below).
- My own agent file (`.claude/agents/pattern-master.md`) — including the graduation log section's four tracking entries at page-transition parameters (2 observations each, none at 3+).
- The Showcase home (`src/apps/showcase/pages/ShowcaseHome.vue`) and its 15 numbered sections — Color Palette, Typography, Snap, Component Gallery, Anti-Patterns, Brand Voice, Brick Dimensions, Component Health, Dialog Service, Toast Service, Form Validation, Resource Adapter, Middleware Pipeline, Brick Shapes, Page Transitions.
- Key showcase demos with motion content: `SnapDemo.vue`, `PageTransitionDemo.vue`, `ShowcaseHero.vue`.
- Shared components with existing motion: `PageTransition.vue` (brick-snap / brick-lift / brick-none), `LoadingState.vue` (3-dot bouncing brick animation), the `brick-transition` / `brick-shadow-hover` / `brick-shadow-active` shortcuts deployed across `PrimaryButton`, `DangerButton`, `BackButton`, `ListItemButton`, `NavLink`, `ModalDialog`, `ToastMessage`, `FilterChip`, `CollapsibleSection`, `ConfirmDialog`.
- Shared components with **no** motion: `EmptyState`, `StatCard`, `BadgeLabel`, `CardContainer`, `SetListItem` (and by extension, list/grid renders across SetsOverviewPage, StorageOverviewPage, PartsPage variants).
- The `SoundService` in `src/shared/services/sound.ts` — four synthesized sound primitives (`snap`, `pull`, `cascade`, `thud`) using Web Audio bandpass-filtered noise bursts, gated by user preference + `prefers-reduced-motion`. Currently wired into `ModalDialog` only (the open-modal `pull` cue).
- A spot-check of the Brickwright's deliveries since 2026-04-17 (43 Build Records in the date range, scoped to identify Gallery-side surface changes and where motion is absent).
- Recent Build Records I looked at in detail: `2026-05-17-dark-mode-contrast-violations` (added theme tokens — surface refactor without motion), `2026-05-09-parts-unsorted-view` (new page + CTAs, list-heavy, no list motion), `2026-04-17-playground-mobile-friendly` (my own last delivery — responsive sizing on PlaygroundPage).

### What's been shipping without me (43 days, 2026-04-17 → 2026-05-20)

The Brickwright has carried roughly 30+ Gallery-touching deliveries while I was silent. The motion-relevant headline pieces:

- **Dark mode contrast pass (2026-05-17)** — three new theme tokens (`--brick-danger-text`, `--brick-surface-highlight`, `--brick-highlight-text`), pure-white shadow color in dark mode. **Implication for motion:** any animation that draws attention with color (yellow flashes, red error pulses) now needs to behave in both themes. I should not assume the brand colors I worked against in April still render the same way on a dark page.
- **Two new Parts pages (2026-05-09)** — `PartsMissingPage.vue` and `PartsUnsortedPage.vue`. CSV exports, filter chips, empty states. List-heavy. **No list-level entrance motion** — items appear with the page, no stagger.
- **Storage schema redesign + parts placement (2026-05-09, 2026-05-10, 2026-05-14)** — significant new flows. Place-parts-from-unsorted is a state-transition workflow that today gives the user no animated feedback when a part moves from "unsorted" to "stored."
- **Set themes implementation (2026-05-09)** — themes are now first-class. Group-by-theme view exists on `SetsOverviewPage`. **Theme groups expand/collapse via `CollapsibleSection`** — that component has a `brick-transition` on the caret-rotate but **no height transition on the expanding panel**. Content snaps in.
- **Invite-code-by-email (2026-05-03)** — a new flow that ends with a confirmation. There's no celebratory feedback moment when the invite is sent successfully (today: a toast and done).
- **3D brick views + SVG slope/arch/wedge/round/tile/plate/technic-beam (2026-04-13 → 2026-04-16)** — a fleet of new LEGO-shape components. They are static specimens today; the showcase shows them in a side-by-side grid. **None of them rotate, none of them snap onto a baseplate.** This is the most under-leveraged surface in the Gallery for animation, in my view.
- **SoundService landed at some point in the window** — wired into ModalDialog open. Three other sound primitives (`snap`, `cascade`, `thud`) exist and are unused.

### Pulse staleness — disclosed

Per the Work Order, the Gallery Pulse sections are 51-55 days stale (Pattern Maturity 51d, Tech Debt 55d, Quality Metrics 51d, Overall Health 39d, Active Concerns 39d). I read the values for context but treat them as directional only. The Warden is dispatched separately to refresh; my proposals do not depend on stale numbers verbatim.

### One Brickwright-shaped observation, flagged not proposed

`CollapsibleSection.vue` currently animates the caret rotation (`brick-transition` on a CSS `transform` derived from the `expanded` prop) but uses a raw `v-show` for the panel — no height/opacity transition on expand/collapse. To animate the panel cleanly I would want either a Vue `<Transition>` wrapper or a small shape change (e.g., wrap the slot in a div the composable can target). That's a structural touch on a shared component the Brickwright owns. **I am not proposing Brickwright work** — flagging the dependency so The Steward can route if I'm picked for the proposal that needs it (Proposal C below).

---

## Proposals

Three candidate directions. Mix demonstrates the dual mandate: one Restraint (Proposal A), one Range (Proposal B), one in the middle (Proposal C). I deliberately did not propose a fourth — choice fatigue at four; three forces a real CEO call.

### Proposal A — List Cascade: staggered entrance for collection lists

**Type:** Practical (production component layer)
**Effort:** Small to Medium

**The brief.** When a user navigates to `SetsOverviewPage`, `StorageOverviewPage`, `PartsPage`, `PartsMissingPage`, or `PartsUnsortedPage`, the list items appear all at once after fetch resolves. Today: snap. Proposed: a staggered fade-in-and-rise where each item enters ~30-50ms after the prior one, capping at ~10 items so 100-set lists don't feel slow. The animation is so small the user doesn't consciously notice it — they just feel that the page settles into place instead of slamming into place.

**Where it lives.** A reusable `useListEntrance()` composable in `src/shared/composables/` plus a UnoCSS shortcut `brick-anim-list-enter`. Consumed by `SetListItem`, `PartListItem`, and the storage list. Hard-respects `prefers-reduced-motion` (no stagger, no transform).

**Parameter sketch.** All values are ranges I'd dial in during build, not commitments.

| Parameter | Sketched range |
|---|---|
| Per-item enter duration | 180-240ms |
| Stagger delay | 25-50ms |
| Cap at N items | 8-12 (stagger zeros out beyond cap) |
| Easing | `cubic-bezier(0.2, 0, 0, 1)` (matches existing page-transition language — graduation candidate range) |
| Translate distance | 6-10px (lower than page transitions — list items are smaller atoms) |
| Opacity | 0 → 1 |

**Portfolio rationale.** This is the "we know when to stop" demo. A senior reviewer scrolls SetsOverviewPage and notices the page feels *unusually settled* without being able to point at why. That's the highest form of motion design — invisible by the time it's noticed. Pairs well with the existing page-transition system (which is also restraint-shaped) to show I can carry a coherent vocabulary across two scales.

**Dependencies / risks.** Touches `SetListItem.vue` and the list parents — shared components the Brickwright owns. Friction-Protocol-shaped, but light: the composable layer adds on top, no structural change.

---

### Proposal B — The Falling-Bricks Showcase: a tumbling-brick landing demo

**Type:** Showcase (impression layer)
**Effort:** Large

**The brief.** A new showcase section (Section #16, after Page Transitions) titled "Tumbling Bricks." On scroll-into-view, ~25-40 LEGO bricks (using the existing `LegoBrick` / `LegoSlope` / `LegoWedge` / `LegoRound` / `LegoTechnicBeam` / `LegoPlate` / `LegoTile` family — finally giving the Brickwright's recent shape-component fleet a stage) tumble down from off-screen-top with realistic-feeling physics (per-brick rotation, mass-tuned bounce, gravity, restitution-on-floor-contact, settling-into-stacks). Interactive controls below the demo: a "Drop more bricks" button (triggers `cascade` sound), a "Clear" button (sweeps them off with a translate-x exit), a gravity slider (0.5×-2×), an easing function selector.

Why this is the showcase demo someone tells a colleague about: it physically demonstrates the brand. The Gallery is a LEGO inventory app — *bricks fall in real LEGO sets*. A landing demo where bricks actually fall and stack proves the firm understands its own metaphor. It also exercises the existing `SoundService.play('cascade')` and `'thud'` primitives — which today exist unused.

**Where it lives.** A new `TumblingBricksDemo.vue` in `src/apps/showcase/components/`, wired into `ShowcaseHome.vue`. A `useTumblingBricks()` composable in the showcase (not shared — this is a showcase one-off; if a second consumer appears, move it up per my own dropped lesson). 100% test coverage with deterministic mocks of the physics tick.

**Parameter sketch.**

| Parameter | Sketched range |
|---|---|
| Brick count | 25-40 |
| Initial drop velocity | 0 (gravity-only) |
| Gravity | 980-1200 px/s² (tunable via slider) |
| Restitution (bounce) | 0.3-0.5 (LEGO doesn't bounce like a rubber ball) |
| Rotation rate per brick | 60-180°/s, randomized |
| Settle threshold | <2px movement / frame for 200ms |
| Frame budget | 16.7ms (60fps target) |
| Total run from drop to settle | 2.5-4s |
| Sound trigger | `cascade` on drop initiation, `thud` per ~5th brick floor-contact (rate-limited) |
| Reduced motion | bricks fade in pre-stacked, no animation, no sound |

**Portfolio rationale.** The Range counterpart to Proposal A. If the firm wants a *single* demo to point at when pitching the repo, this is a strong candidate. It demonstrates: physics intuition, 60fps performance discipline, sound design integration, parameter interactivity (live controls), accessibility (the reduced-motion fallback is a designed state, not an afterthought), and that motion can be load-bearing brand expression — not decoration. The risk is "tech demo, not design system" — mitigated by making the controls themselves use brick-shadow + brick-transition (the demo *is* shipped using the design system, not bolted on next to it).

**Dependencies / risks.** Larger surface area; longer build; harder coverage story (deterministic tests on a physics loop need explicit tick-mocking). No Brickwright structural dependency — purely additive to showcase. The reduced-motion fallback design needs to look intentional, not like a fallback (this is where Range demos tend to fail).

---

### Proposal C — Brick-DNA Snap-and-Pull: pickup and placement micro-interactions on the LEGO shape gallery

**Type:** Showcase (impression layer with Practical bones)
**Effort:** Medium

**The brief.** Today the `BrickShapes.vue` showcase section renders 7 LEGO shapes (slope/arch/wedge/round/plate/tile/technic-beam) statically side-by-side as HTML/CSS-vs-SVG specimens. They are exactly the kind of thing that *cries out* to be tactile. The proposal: each shape responds to pointer interaction with a snap-pickup-place micro-interaction:

- **Hover** — shape lifts ~6-8px translateY with `brick-shadow-hover` (already in vocabulary).
- **Press (mousedown)** — shape "snaps" up another ~4px with a sharp ease, plays `SoundService.play('snap')`.
- **Drag** (optional, gated behind a hint label) — shape follows pointer with smoothing; on release it spring-settles back to its grid cell with a `thud`.
- **`prefers-reduced-motion`** — translate disabled; only color/border-color cues remain.

Same treatment can ship to the playground page (Section: Brick Dimensions) and — crucially — to the LegoBrick decorations on the `HomePage.vue` logged-out hero. The logged-out home page is the first thing a prospective client sees and today the three stacked bricks just sit there.

**Where it lives.** A `useBrickPickup()` composable in `src/shared/composables/` (because the home page also consumes it), a `brick-anim-pickup` UnoCSS shortcut, and a redesigned `BrickShapes.vue` section in the showcase that shows live parameter values + a comparison grid (matches the `PageTransitionDemo` precedent — visible parameter values, interactive controls).

**Parameter sketch.**

| Parameter | Sketched range |
|---|---|
| Hover lift duration | 120-180ms |
| Hover lift translateY | 6-10px |
| Press snap duration | 80-120ms (sharper than hover) |
| Press snap translateY | additional 3-5px |
| Spring-settle duration on release | 280-380ms |
| Spring overshoot | 5-12% |
| Easing (hover) | `cubic-bezier(0.2, 0, 0, 1)` — graduation candidate |
| Easing (snap) | tighter — `cubic-bezier(0.4, 0, 0.2, 1)` ballpark |
| Sound | `snap` on press, `thud` on release-into-place |
| Reduced motion | duration 0, no translate, color-only cue |

**Portfolio rationale.** This is the *bridge* between the dual mandates. It's restrained at the per-element scale (a senior reviewer would not call it ostentatious) but the cumulative effect across seven shapes + the home-page hero + the playground is unmistakable — the firm's design system has tactile vocabulary. It also retires existing latent debt: the `SoundService` has three of four primitives unused; this puts `snap` and `thud` to work on a motivated surface. And it generates real graduation data — by the time this ships I will have ~15-20 parameter observations across hover/press/release primitives, enough to potentially graduate one or two range rules.

**Dependencies / risks.** Touches one shared composable (new), the `BrickShapes.vue` showcase section (rebuild), and the `HomePage.vue` hero (additive — wrap existing bricks). `CollapsibleSection.vue` is *not* required for this proposal. The main risk is that a "snappy" interaction without dial-in feels twitchy on press — needs careful press-duration tuning, hence the parameter range.

---

## Self-Rank

| Rank | Proposal | One-sentence rationale |
|---|---|---|
| **1st** | **Proposal C — Brick-DNA Snap-and-Pull** | Highest density of portfolio value per unit effort: it touches the home-page first-impression surface, retires unused SoundService capability, generates the most graduation-log data points, and demonstrates the dual mandate inside a single deliverable rather than between deliverables. |
| 2nd | Proposal A — List Cascade | Pure restraint, ships fast, very safe; the right *second* delivery once C establishes the tactile language because the cascade can then echo the same easing/distance vocabulary already trained on C. |
| 3rd | Proposal B — Tumbling Bricks | Highest individual ceiling but highest risk and longest build; better as a follow-up after the firm has seen me deliver C and trusts the parameter-driven approach on a smaller surface first. |

---

## Quality Gauntlet

**N/A — no code shipped, exploration WO.**

This Build Record produces no Vue, TypeScript, or CSS changes. The full gauntlet (`format:check`, `lint`, `lint:vue`, `type-check`, `test:coverage`, `knip`, `size`, `build`) will run on the follow-up implementation WO once the CEO picks a direction.

## Parameter Record

**Empty by design.** This is an exploratory survey + proposal Build Record. No animations were authored, no concrete parameter values were committed to code. The Parameter Record begins on the implementation WO that follows the CEO's pick.

The ranges sketched per-proposal above are *intent ranges* — the space inside which I would dial during the build — not entries in this log. They become entries when shipped values land and earn approval or rejection.

## Showcase Readiness

This Build Record is itself part of the showcase: a portfolio reviewer scrolling the records will see that the firm has a creative agent who, after a 33-day silence, returned with a deliberate three-option survey rather than a frantic deliverable. The dual-mandate language (Range / Restraint) is exercised explicitly. The self-rank prefers the *middle* option over the *flashy* one — that itself is showcase-worthy restraint.

If the CEO picks Proposal C and the build lands within its sketched ranges, the page-transition graduation candidates (already at 2 observations each) may pick up enough confirming data to promote to graduation candidates with test scenarios. That's the firm-state advance this brief enables, not just the surface change.

## Proposed Knowledge Updates

- **Learnings:** None this WO. The follow-up build WO will have learnings to propose.
- **Pulse:** None directly — but I note for The Steward that my graduation log section in `.claude/agents/pattern-master.md` still shows four parameter patterns at 2 observations each. If Proposal C ships, those numbers tick to 3+ and graduation becomes possible. Worth a Steward note when refreshing Pulse: the Pattern Master's tracking shelf is one delivery away from its first graduation.
- **Domain Map:** Unchanged.
- **Component Registry:** N/A (no new components).
- **Decision Record:** No ADR. None of the three proposals introduces a new architectural pattern; each builds on existing Vue `<Transition>` + composable + UnoCSS shortcut conventions.

## Self-Debrief

### What Went Well

- **Survey before proposal.** Reading the recent Brickwright deliveries in chronological order before sketching anything kept me from proposing motion in places that have already moved on (e.g., I almost proposed something dark-mode-shaped before noticing the 2026-05-17 token pass already addressed the contrast layer; that proposal would have been stale).
- **Spotted the `SoundService` underuse.** Four sound primitives exist; three are unused. Two of my three proposals naturally re-engage them. This kind of latent-asset spotting is exactly what the role's intake channel #1 is for.
- **Honest dual-mandate distribution.** I forced myself to make the *middle* option my top pick, not the flashiest one. That's a calibration win — old me would have ranked Tumbling Bricks first because it sounds the most impressive.
- **Disclosed Pulse staleness up-front** rather than burying it. The 2026-04-17 graduation-log candidate codified this as a habit; first time I'm exercising it.

### What Went Poorly

- **33 days of silence is a real cost.** I had to spend disproportionate intake time getting back up to speed on what the Brickwright shipped without me. If the firm had dispatched even one small creative WO inside that window I'd have stayed warm; instead the catch-up tax is borne entirely by this deliverable. Not a self-improvement — a structural observation: the role's value is partly continuity, and continuity needs at least sub-monthly engagement.
- **I almost proposed a fourth.** A "modal entrance choreography" pitch was in my drafts (because ModalDialog opens with a `pull` sound but no visual choreography). I cut it because the WO bounds 2-4 and three is a cleaner CEO call. Worth noting that there's a *fourth* proposal latent here for next time.
- **No live verification.** I cannot actually run the showcase in a browser from this environment, so my survey is structural (file reads) rather than experiential. This is the same verification gap I flagged on 2026-04-17 — codifying it again below.

### Blind Spots

- I did not read the Admin app at all during this survey. The Work Order frames the focus as Gallery-wide but Admin is the corner office building. If Admin is also static and flat, none of my proposals address it. Worth a Steward note.
- I did not audit `prefers-reduced-motion` compliance on already-shipped surfaces — I assumed the global `accessibility.css` override handles it. If it doesn't, every proposal here inherits an unrendered bug. A Warden audit on motion-accessibility would de-risk all three proposals before any of them ships.
- I did not check whether any of the existing motion (e.g., the `LoadingState` bouncing dots) has ever recorded a frame-rate measurement. I'm assuming 60fps; I have no data point.

### Training Proposals

| Proposal | Context | Build Record Evidence |
|---|---|---|
| Before composing creative proposals, audit which existing motion primitives (sounds, transitions, animations) are wired vs. dormant — dormant primitives are highest-leverage targets | Spotting `SoundService`'s three unused sound primitives reframed Proposals B and C; without that pass I'd have proposed adding sound from scratch on top of an asset that already exists | 2026-05-20-pattern-master-gallery-showcase-brief |
| When a Work Order asks for ranges and bounds, deliver exactly that — do not commit to specific values in the proposal phase | Forced myself to use range sketches per proposal rather than firm numbers; this preserves dial-in space and keeps the proposal honest about what is not yet known | 2026-05-20-pattern-master-gallery-showcase-brief |
| Disclose verification-environment gaps in the relevant section, not in a closing caveat | Reused my own 2026-04-17 graduation candidate about flagging verification gaps up-front; this time the gap is "no live browser" and it lives in Blind Spots where The Steward can see it | 2026-05-20-pattern-master-gallery-showcase-brief |
| When silent for >30 days, the next deliverable should be a survey + proposal, not an unprompted build — earn the engagement back deliberately | The CEO authorized re-engagement via survey rather than handing me a task; this is the correct shape for a long-silent agent's return | 2026-05-20-pattern-master-gallery-showcase-brief |

---

## Steward Evaluation

_To be appended by The Steward after review._
