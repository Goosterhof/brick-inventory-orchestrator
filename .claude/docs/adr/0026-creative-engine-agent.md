# Decision: Creative Engine agent — dedicated design & animation role

**Date**: 2026-04-09
**Feature**: Evolving the design system beyond static components into a playful, animated experience
**Status**: accepted
**Transferability**: universal

## Context

The design system is structurally solid — 46 shared components, a neo-brutalist LEGO aesthetic, the snap principle, SVG and HTML brick shapes, and a 16-section Showcase app. It works. It's professional.

But it doesn't _feel_ like a LEGO app. The experience is static — no falling bricks, no entrance animations, no micro-interactions, no page transitions beyond basic routing. The Brick Brutalism visual language makes it _look_ unique but not _feel_ unique. For a product where play and fun are central to the story, that's a real gap.

### The Portfolio Problem

This repo is Brick & Mortar Associates' portfolio piece. Prospective clients reviewing it should see demonstrated mastery of animation and interaction design — not just competent static layouts. The ability to show both creative range ("look how expressive we can go") and creative restraint ("look how we know when to stop") is a harder demonstration than either extreme alone, and more impressive for it.

### Why the Existing Agents Can't Cover This

The Lead Brick Architect is optimized for structural integrity — sturdy, correct, well-tested code. Creative exploration requires a fundamentally different mindset: experimentation over certainty, expressiveness over predictability. Housing both mindsets in a single agent creates internal conflict that produces mediocre results on both axes — structures that aren't quite sturdy and animations that don't quite feel right.

The Building Inspector audits quality but doesn't build. It can flag that something _looks flat_, but it can't fix it.

A dedicated creative role eliminates this tension. The Architect pushes for structural integrity, the Creative Engine pushes for expressiveness, and the friction between them produces better outcomes than either could alone — the same principle that drives the existing Rebuttal Protocol between Architect and Inspector.

## Options Considered

| Option                                       | Pros                                                                                                                                                                                           | Cons                                                                                                                                                                                          | Why eliminated / Why chosen                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Dedicated Creative Engine agent**          | Sustained memory via graduation log; discovers animation language through iteration; separation of concerns matches real team structure; healthy friction with Architect improves both outputs | Third agent adds operational overhead (graduation log, dispatch reports); shared component ownership creates merge friction; creative taste is harder to graduate than structural correctness | **Chosen** — the learning requirement and mindset separation justify the overhead                  |
| **Skill (invoked on demand)**                | Lightweight; no ongoing overhead; CEO controls when it runs; no territory conflicts                                                                                                            | Cannot learn — forgets rejected proposals and repeats mistakes; no continuity between sessions; output limited to prompt quality                                                              | Eliminated — a static prompt cannot discover and refine an animation language over time            |
| **Extend the Architect's training**          | Zero new infrastructure; leverages existing graduation pipeline                                                                                                                                | Creative exploration conflicts with structural-integrity optimization; scope creep on an agent with 41 candidate proposals; dilutes core competency                                           | Eliminated — asking the construction worker to also be the interior designer produces neither well |
| **Prescribe the animation language upfront** | Clear rules from day one; easy to enforce; no discovery phase needed                                                                                                                           | Premature — the right values (durations, easing curves, scales) need to emerge from experimentation, not guesswork; overly rigid rules kill the playfulness this decision exists to create    | Eliminated — the whole point is that the creative language is discovered, not prescribed           |

## Decision

Introduce a third agent — the **Creative Engine** — responsible for evolving the design system's visual and interactive layer. It both proposes and implements creative work.

### Dual Track

The Creative Engine operates on two tracks:

1. **Practical track** — Animation primitives, transitions, micro-interactions, and entrance/exit effects that integrate into the shared component library and get used across Families, Admin, and Showcase.
2. **Showcase track** — Impressive, over-the-top demonstrations that live in the Showcase app and potential landing pages. These exist to wow prospective clients and demonstrate creative range.

### Three Intake Channels

Work reaches the Creative Engine through three channels:

1. **Self-directed** — The agent reads the Showcase, component registry, and current state, then identifies gaps where the experience is flat or static.
2. **Architect-tagged** — The Lead Brick Architect builds a new component and flags it for creative attention.
3. **Inspector-flagged** — The Building Inspector audits and notes that a component or section feels visually flat compared to the rest of the system.

### One Hard Rule

**`prefers-reduced-motion` compliance is non-negotiable from day one.** Every animation must have a reduced-motion fallback. This is enforced by the Inspector from the first delivery.

All other constraints — performance thresholds, maximum durations, complexity limits — are discovered through the inspection cycle rather than prescribed upfront. The Inspector flags performance issues, the Creative Engine learns from those findings via its graduation log, and concrete thresholds emerge from real evidence.

### Modified Graduation Protocol

The standard graduation protocol requires objectively verifiable assertions. Creative taste starts as subjective — but it can be decomposed into measurable parameters: duration, easing curve, scale, distance, delay, frame rate impact.

The Creative Engine's graduation protocol works differently from the Architect's and Inspector's:

1. **Record quantifiable parameters** — When an animation is approved or rejected, the agent documents the concrete values: duration in ms, easing function, translation distance, scale factor, performance impact.
2. **Accumulate a dataset** — Over time, patterns emerge from the approved/rejected data: "entrance animations that feel right tend to be 200-350ms with ease-out" or "scale effects above 1.5x consistently feel too aggressive."
3. **Graduate the pattern, not the taste** — Once a pattern has enough data points, it becomes a concrete, testable rule — the same kind the other agents follow.

This means the Creative Engine's graduation log serves double duty: it's both a training record and an evolving animation style guide, built from evidence rather than upfront specification.

### Shared Component Ownership

Both the Architect and the Creative Engine write to `src/shared/components/`. This is friction by design. When they disagree — the Architect wants a component kept simple, the Creative Engine wants to animate it — the existing arbitration pipeline resolves it: Inspector audits, CFO arbitrates, CEO decides.

### The Showcase as Documentation

No separate living style guide for animations. The Showcase app _is_ the documentation. If an animation primitive exists, it's demonstrated in the Showcase. This avoids the stale-documentation problem — a living document that falls out of sync is worse than no document at all.

## Consequences

- **Three-way arbitration.** The CFO now mediates disputes between three agents instead of two. Resolution is more complex and slower — but the outcomes are better-tested.
- **Merge friction on shared components.** Both Architect and Creative Engine modify the same directory. This requires clear communication in permits and journals about which components are being touched.
- **Novel graduation model.** The parameter-tracking approach is untested. It may take several cycles before the dataset produces genuinely useful patterns. Early graduation proposals will be rough.
- **Operational overhead.** Third graduation log, third dispatch report cycle, third set of journals for the CFO to evaluate. Real cost in review time.
- **The Showcase becomes richer.** The dual-track approach means the Showcase evolves from a static reference into an interactive experience that demonstrates creative range — a direct portfolio improvement.
- **Transferability is high.** The pattern — a creative agent that discovers a project's visual language through iteration — transfers to any product. A banking app's creative agent discovers subtle, functional animations. A gaming app's discovers expressive ones. Same framework, different taste profile.

## Enforcement

| What                                           | Mechanism                               | Scope                                      |
| ---------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| `prefers-reduced-motion` compliance            | Inspector SOP + accessibility.css audit | All animation-related components and demos |
| Bundle size impact                             | Existing `size-limit` check             | All apps                                   |
| Parameter documentation on creative deliveries | CFO review of construction journals     | Creative Engine journals                   |

## Resolved Questions

### Should the Creative Engine propose or also implement?

**Resolved 2026-04-09.** Both. A propose-only role creates a handoff problem where creative vision is lost in translation between agents. The Creative Engine owns the full cycle: identify gap, design solution, implement, test. The Architect and Inspector provide friction, not gatekeeping.

### Who owns `src/shared/components/`?

**Resolved 2026-04-09.** Both the Architect and Creative Engine. Shared ownership is intentional — it creates productive friction. Territory conflicts are resolved through the existing arbitration pipeline (Inspector audit → CFO ruling → CEO decision). This mirrors how real teams with overlapping responsibilities operate.

### Can creative taste be objectively graduated?

**Resolved 2026-04-09.** Not directly — but its quantifiable components can. Taste is decomposed into measurable parameters (duration, easing, scale, distance). When enough data points accumulate around a parameter range, the pattern graduates as a concrete rule. The graduation protocol tracks parameters, not vibes.

## Open Questions

- How does the Creative Engine interact with the Architect's existing permits? Does it get its own permits, or does it operate within permits issued to the Architect? Initial assumption: own permits for self-directed work, shared permits when responding to Architect-tagged or Inspector-flagged items. Revisit after the first 3-5 creative deliveries.
- At what point does the parameter dataset become large enough to produce reliable graduation candidates? Unknown — this is genuinely novel. The CFO should monitor after the first 10 approved/rejected animations and assess whether patterns are emerging.
- Should the Creative Engine have access to the Inspector's tools (read-only audit capabilities) or only builder tools? Initial assumption: builder tools only — the Inspector's independence should be preserved. Revisit if the creative agent needs to self-audit performance.
