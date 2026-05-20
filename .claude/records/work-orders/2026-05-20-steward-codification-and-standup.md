# Work Order: Codify The Steward + Build the `/standup` Ritual

**Work Order #:** 2026-05-20-steward-codification-and-standup
**Filed:** 2026-05-20
**Issued By:** CEO
**Assigned To:** The Steward (executing as builder — Atrium governance scope; same precedent as [`2026-05-20-laravel-13-doc-sweep`](2026-05-20-laravel-13-doc-sweep.md))
**Wing:** Atrium
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `steward-codification-and-standup`

---

## The Job

The Brickworks has three codified agent roles (Brickwright, Quality Warden, Pattern Master) but the deputy — The Steward — exists only as "the main conversation agent" referenced across other files. This Work Order closes that asymmetry and adds the firm's first standing meeting ritual.

Two deliverables in one branch:

1. **`.claude/agents/steward.md`** — codify the Steward role with frontmatter so it is dispatchable as a subagent (fresh-context evaluations) and reusable as an Agent Teams lead role.
2. **`.claude/skills/standup/SKILL.md`** — a `/standup` skill that convenes the crew, reads firm state, and files a Standup Note at `.claude/records/standups/YYYY-MM-DD-standup.md`.

These two ship together because the Standup ritual *is* the Steward's primary recurring duty — defining the role without the ritual would be incomplete, and shipping the ritual without the role definition would leave the convener implicit.

## Scope

### In the Box

- New file: `.claude/agents/steward.md` with frontmatter (`name`, `description`, `model: opus`, `tools: Read, Edit, Write, Bash, Glob, Grep, Agent, NotebookEdit`) and body covering: identity, chain of command, responsibilities, arbitration verdicts (Rebuttal / Counter-Filing / Friction), training-proposal disposition protocol, when to escalate to the CEO, when to convene Agent Teams vs. dispatch a subagent, Standup convening duty, personality.
- New file: `.claude/skills/standup/SKILL.md` with frontmatter (`name: standup`, `description`, `argument-hint`, `allowed-tools`) and body covering: when to use, sources to read, roll-call structure per crew member, cross-wing concern surfacing, stale detection rules, action-item capture, output path, format template.
- New directory: `.claude/records/standups/` (created by writing a `.gitkeep` or the first standup record).
- Index update: pulse Seeds already updated in the same branch to preserve deferred governance moves (Tension Doctrine, Agent Teams trial, Retrospective ritual, Foundry creative counterpart, Brickwright log unification, Audit peer-review pass).

### Not in This Set

- Tension Doctrine document (deferred — seeded; trigger: 3+ standups run, or first arbitration escalation).
- Agent Teams trial for PR Review (deferred — seeded; trigger: next non-trivial PR review).
- Retrospective ritual / `.claude/records/retrospectives/` (deferred — seeded; trigger: next major delivery).
- Any Foundry creative counterpart (held back; seeded for transparency).
- Any unification of the Brickwright wing-split graduation logs (held back; seeded for transparency).
- Running the first standup itself — the CEO triggers `/standup` at their discretion once the skill is in place.

## Acceptance Criteria

- [ ] `.claude/agents/steward.md` exists with valid frontmatter and body covers all sections listed in Scope.
- [ ] `.claude/skills/standup/SKILL.md` exists with valid frontmatter and body documents the standup procedure end-to-end.
- [ ] `.claude/records/standups/` exists as a tracked directory (either via `.gitkeep` or the first standup record).
- [ ] `rg -n 'main conversation agent' .claude/agents/ CLAUDE.md backend/CLAUDE.md frontend/CLAUDE.md` shows that this phrase still appears (it's still accurate — Steward is *both* the main conversation agent and now a codified role) — no churn-edits to other agent files. The new `steward.md` is *additive*, not a refactor of references.
- [ ] Pulse Seeds section contains entries for the six deferred/held-back governance moves listed in Scope > Not in This Set.
- [ ] Build Record filed at `.claude/records/build-records/2026-05-20-steward-codification-and-standup.md` with full self-debrief and Steward Evaluation hook.
- [ ] No code files modified — Atrium doc/skill scope only. PrePushPermitGate gate skips (well under threshold).

## References

- Conversation that triggered this WO: post-merger team-structure review (CEO → Steward), 2026-05-20.
- Anthropic doc surveyed: [Create custom subagents](https://code.claude.com/docs/en/sub-agents) + [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams).
- Related precedent (Steward as builder): [`2026-05-20-laravel-13-doc-sweep`](2026-05-20-laravel-13-doc-sweep.md) — Atrium-doc scope, Steward executed the build.
- Related ADR: [ADR-0026](../../docs/adr/0026-creative-engine-agent.md) — Pattern Master agent creation, the pattern this Steward codification follows.

## Notes from the Issuer

The CEO's framing: "I want us to be more like a real company, where the team has a meeting. There should be something in our docs about the tension between members of the team that does lead to a better outcome."

This Work Order delivers the meeting (Standup). The tension doctrine is seeded for a later WO. The Steward role document anchors both — it's the convener of the meeting and the arbiter of the tension protocols.

The two pieces are designed to compose: when the CEO types `/standup`, the Steward (as defined in `steward.md`) executes the procedure (as defined in `SKILL.md`) and files the artifact (under `.claude/records/standups/`). The Steward's identity, the standup's procedure, and the artifact's filing rule all live in different files but click together like bricks.

---

**Status:** Completed (closed retroactively 2026-05-20 in paper-trail sweep)
**Build Record:** [`2026-05-20-steward-codification-and-standup`](../build-records/2026-05-20-steward-codification-and-standup.md) _(filed concurrently)_

---

_**Closed retroactively 2026-05-20** during paper-trail-drift sweep. Build Record (already filed): [`2026-05-20-steward-codification-and-standup`](../build-records/2026-05-20-steward-codification-and-standup.md). See sweep Build Record: [`2026-05-20-wo-closure-sweep`](../build-records/2026-05-20-wo-closure-sweep.md)._
