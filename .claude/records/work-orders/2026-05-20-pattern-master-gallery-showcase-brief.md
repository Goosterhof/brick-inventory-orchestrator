# Work Order: Pattern Master — Gallery Showcase Self-Direction Brief

**Work Order #:** 2026-05-20-pattern-master-gallery-showcase-brief
**Filed:** 2026-05-20
**Issued By:** CEO (via first-standup action item #1)
**Assigned To:** Pattern Master
**Wing:** Gallery
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `pattern-master-gallery-showcase-brief`

---

## The Job

The Pattern Master has filed no Build Record since 2026-04-17 — 33 days of silence. The first `/standup` (2026-05-20) flagged this and the CEO authorized a re-engagement via self-directed creative exploration rather than a prescribed task.

This is **not** a Build Record-producing Work Order in the usual sense. The deliverable is a **proposal** — a single Build Record that surveys the Gallery's current state and proposes 2-4 candidate creative directions the Pattern Master sees, ranked by impact and effort, for the CEO to pick from.

The Pattern Master's own intake channel #1 (per `.claude/agents/pattern-master.md`) authorizes exactly this self-directed mode: *"You read the Showcase, the component registry, and the current state of the apps. You identify where the experience is flat, static, or missing the LEGO personality. You propose work to The Steward."*

## Scope

### In the Box

- **Survey** — read the Showcase (`frontend/src/apps/showcase/`), the Component Registry (`frontend/src/shared/generated/component-registry.json`), recent Build Records (since 2026-04-17 to see what the Brickwright has shipped without you), and the relevant Pulse sections (Pattern Maturity, Tech Debt — Gallery).
- **Identify** — at least three places where motion is missing, flat, or where the Gallery could demonstrate either creative range (over-the-top showcase demo) or creative restraint (a 200ms transition that elevates a static interaction).
- **Propose** — file ONE Build Record at `.claude/records/build-records/2026-05-20-pattern-master-gallery-showcase-brief.md` that contains:
  - A short survey section: "what I read, what's been shipping without me"
  - 2-4 candidate creative direction proposals, each with: name, type (Practical / Showcase per your dual-track model), rough parameter sketch (entrance type / duration range / easing range — *no firm numbers yet, just ranges*), why this matters for the portfolio piece, rough effort estimate (S/M/L per your usual heuristic)
  - A self-rank: which proposal **you'd** pursue first, with one sentence of reasoning
  - A Parameter Record section — empty/blank is fine if no concrete animation was built, but acknowledge in the body that this build is exploratory and parameter data starts with the chosen proposal's WO
- **Do NOT build any actual animations in this WO.** The deliverable is the proposal, not the work itself. Once the CEO picks a proposal, the Pattern Master will file a separate WO for the build.

### Not in This Set

- Implementing any animation. This is exploration + proposal.
- Updating the Pulse, Domain Map, or Component Registry. Pure read-only firm-state intake.
- Reviewing or challenging the Brickwright's recent work. Stay in your lane (motion / creative).
- Proposing a Foundry creative counterpart role. Out of scope — that's a CEO call seeded in Pulse.

## Acceptance Criteria

- [ ] Build Record filed at `.claude/records/build-records/2026-05-20-pattern-master-gallery-showcase-brief.md` with the sections enumerated above.
- [ ] At least 2 candidate creative directions proposed, no more than 4.
- [ ] Each proposal has: name, type, parameter-range sketch, portfolio rationale, effort estimate.
- [ ] Self-ranked recommendation with one-sentence reasoning.
- [ ] Build Record honors the standard self-debrief sections (What Went Well, What Went Poorly, Blind Spots, Training Proposals) — even an exploratory build produces honest debrief.
- [ ] Build Record's "Quality Gauntlet" section explicitly notes: N/A — no code shipped.

## References

- First standup that surfaced the 33-day silence: [`2026-05-20-standup`](../standups/2026-05-20-standup.md)
- Pattern Master agent definition: [`.claude/agents/pattern-master.md`](../../agents/pattern-master.md)
- ADR-0026 (Pattern Master role creation): [`.claude/docs/adr/0026-creative-engine-agent.md`](../../docs/adr/0026-creative-engine-agent.md)
- Gallery Pulse sections (currently 51-55 days stale — note the staleness in your survey, do not rely on the numbers verbatim): [`pulse.md`](../../docs/pulse.md)

## Notes from the Issuer

The Pattern Master's silence is not a failure — the firm hasn't dispatched creative work for 33 days. But the role exists, and the standup made the inactivity visible. Re-engagement starts with the Pattern Master telling the firm where motion is most valuable next, rather than the firm prescribing what to build.

Take the survey at the pace it deserves. This is the kind of work where reading thoroughly and proposing thoughtfully is better than producing fast.

A "small, well-chosen" proposal (e.g., entrance animation for the new Standup Notes folder index — meta-level firm self-awareness) is at least as valuable as a "large, ambitious" one (e.g., interactive falling-bricks landing page demo). Show the dual mandate (range + restraint) in your proposal mix.

---

**Status:** Completed (proposal delivered; awaiting CEO pick of A/B/C for the follow-up build WO)
**Build Record:** [`2026-05-20-pattern-master-gallery-showcase-brief`](../build-records/2026-05-20-pattern-master-gallery-showcase-brief.md)
**Note:** The Pattern Master did not close this WO in the same commit as filing the Build Record — they ran as a subagent before the WO-closure training rule was proposed in [`2026-05-20-wo-closure-sweep`](2026-05-20-wo-closure-sweep.md). The Steward closed it on their behalf. The training rule will need to propagate to Pattern Master agent training before the convention holds across the crew, not just the Brickwright.
