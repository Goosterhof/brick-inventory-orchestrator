# Decision: Path-Based Permission Allow for Paper-Trail Subagent Writes

**Date**: 2026-05-25
**Feature**: Agent governance; Claude Code subagent permission model
**Status**: accepted
**Transferability**: universal

## Context

The Brickworks dispatches three production agents as subagents from the main conversation: Quality Warden, Brickwright, and Pattern Master. Each owns a primary paper-trail artifact that it is expected to file at the end of its dispatch — the Warden files Audits at `.claude/records/audits/`, the Brickwright files Build Records at `.claude/records/build-records/`, the Pattern Master files Build Records carrying a Parameter Record.

Two incidents in five days surfaced what was initially reported as an "agent lacks Write access" gap:

- 2026-05-20 — Quality Warden's Gallery Pulse-refresh audit returned the audit text in its message; the Steward transcribed and filed it.
- 2026-05-25 — Brickwright's Permit A (integration-test assertion repairs) returned its Build Record text after two `.claude/records/` Write/Edit attempts were denied; the Steward transcribed.

Both incidents were folded into Casebook Methodology Notes and were the primary motivating force for the 2026-05-25 morning standup's CEO action item #1 ("Decide on Quality Warden `Write` access — firm-wide agent write-scope decision"). The Pulse carried a related Seed ("ADR: soft enforcement vs. path-sandboxed agent scope") with a 60-day or second-agent trigger; the second-agent trigger fired on 2026-05-25.

**The misdiagnosis caught at interrogation time.** The third standup of 2026-05-25 (post-cluster-closure) routed the decision through `/adr-interrogator`. Before the nine-step interrogation began, the Interrogator verified ground truth against the actual `.claude/agents/*.md` frontmatter and `.claude/settings.json`:

| Source of truth | What it actually says |
|---|---|
| `quality-warden.md` `tools:` | `Read, Write, Bash, Glob, Grep` — **Write present** |
| `brickwright.md` `tools:` | `Read, Edit, Write, Bash, Glob, Grep, Agent, NotebookEdit` — **Write present** |
| `pattern-master.md` `tools:` | `Read, Edit, Write, Bash, Glob, Grep, Agent, NotebookEdit` — **Write present** |
| `settings.json` `permissions` block | Did not exist — no allow rules, no deny rules |
| `settings.json` `PreToolUse` hook on Edit\|Write | Only `guard-generated-files.sh`, blocking `*/shared/generated/*`. Does not touch `.claude/records/`. |

An empirical probe was then run in the same web session: a brickwright subagent was dispatched to Write a probe file to `/tmp/` (baseline) and to `.claude/records/build-records/PROBE-DELETE-ME-brickwright-2026-05-25.md` (contested path). **Both writes succeeded.** The standup's framing — "agent tool-set lacks Write access" — was empirically false.

**The actual mechanism behind the prior denials:** in cloud / web Claude Code sessions, subagents cannot surface in-the-moment permission prompts to the user. When a tool call's target path is not pre-allowlisted in `settings.json`, the prompt that the main-agent flow would surface is unreachable, and the subagent receives a hard denial. Because no `permissions.allow` block existed, every paper-trail Write from a subagent was at the mercy of the runtime's default policy. The two prior incidents are therefore both explained by the same root cause: a missing `settings.json` allow rule, not an agent-tool gap.

The decision is which permission model the firm formalizes now that the actual mechanism is understood.

The forces:

- The Brickworks' paper trail is high-value, high-frequency. Every Work Order spawns a Build Record; every Audit produces a Casebook update; standups, Pulse refreshes, and the agents' graduation logs all generate writes to a small, well-known set of directories.
- The firm's enforcement of *which agent writes which artifact* is **doctrine-only** — each agent's `<agent>.md` defines its scope, and the only runtime enforcement is the agent's own discipline + `git log` review. No agent has ever filed an artifact in the wrong folder; the doctrine has held for the full life of the paper trail.
- The web environment is the deployment surface this firm actually uses (cloud-based Claude Code sessions, ephemeral containers per the orchestrator's CLAUDE.md). Any decision that doesn't account for the web's permission-routing constraints is a decision that breaks in the actual operating environment.
- The Pattern Master's Graduation Log is currently embedded inside `.claude/agents/pattern-master.md` rather than living in a sibling file like the Brickwright's (`brickwright-foundry-graduation.md`, `brickwright-gallery-graduation.md`) and the Warden's (`quality-warden-foundry-graduation.md`, `quality-warden-gallery-graduation.md`). Any allow rule covering the other graduation logs must either include `pattern-master.md` (breaching the agent-definition-file fence) or accept a gap.
- The standup's morning roll-call captured the "close parent WO in same commit as Build Record" training rule as stuck at 1.5/2 confirmations — both half-confirmations because the Steward had to transcribe the closing artifacts, splitting agent ownership.

## Options Considered

| Option | Pros | Cons | Why eliminated / Why chosen |
|---|---|---|---|
| **A. Pre-allowlist paper-trail paths in `settings.json`** | Matches the actual root cause (missing allow rules). Restores single-agent atomicity for build close-outs. Glob-bounded — `**` patterns auto-cover new artifacts of existing types. Preserves doctrine-only enforcement of agent-target alignment, which has never been violated. Reversible (single file edit). | Path-based, not agent-based — a Brickwright subagent that decided to file an Audit would not be runtime-blocked. Naming convention for graduation log files becomes load-bearing. | **Chosen** — addresses the diagnosed mechanism with the smallest viable change, preserves the doctrine model that has held for 200+ records, leaves agent-identity-based scoping as a future seed rather than a default. |
| **B. Canonicalize "Steward-transcribes-on-behalf" as the firm's flow** | Solves the symptom (the prior two denials) by institutionalizing it. Strongest possible enforcement of agent-target alignment — the Steward gatekeeps every paper-trail write. | Mistakes the symptom for the disease. Breaks single-agent atomicity for every dispatch in cloud sessions, not just the rare ones. Adds dispatch-brief preamble overhead to every Warden/Brickwright/Pattern Master dispatch. Solves a problem (agent mistargets folder) that has never occurred. | Eliminated — solves a non-problem at the cost of every-dispatch overhead. |
| **C. `PreToolUse` hook checking subagent identity (true runtime-sandboxed scope)** | Closes the doctrine-only gap. Brickwright cannot write to `audits/`, etc. Demonstrates a runtime enforcement layer at the showcase tier. | Substantially more implementation (per-agent identity check, hook script, test suite). Couples agent definition to hook implementation — any new agent requires a hook change AND a doctrine change. Solves a class of incident that has never happened. | Eliminated for now; preserved as a Seed — if doctrine-only enforcement ever fails (an agent files in the wrong folder), this becomes the canonical upgrade path. |

Within Option A, three sub-sizes were considered:

| Sub-option | Coverage | Trade-off | Disposition |
|---|---|---|---|
| **A1** | Enumerate each `.claude/records/` subfolder explicitly | Breaks the next time a new artifact type lands; maintenance debt exceeds value of explicitness | Rejected — too small |
| **A2** | `.claude/records/**` + `.claude/docs/**` + `.claude/agents/*-graduation.md` | Glob-bounded; auto-covers new artifacts in existing folders; agent definition files stay foreground-edit-only; naming convention for graduation logs is load-bearing | **Chosen** |
| **A3** | Blanket `Edit(.claude/**)` | Two-line rule; covers everything; but expands the trust boundary to agent definition files themselves — Brickwright could (technically) rewrite the Warden's doctrine | Rejected — extends honor-system surface to the agent contracts |

## Decision

### The Allow Block

`.claude/settings.json` gains a `permissions.allow` block:

```jsonc
{
  "permissions": {
    "allow": [
      "Write(.claude/records/**)",
      "Edit(.claude/records/**)",
      "Write(.claude/docs/**)",
      "Edit(.claude/docs/**)",
      "Edit(.claude/agents/*-graduation.md)"
    ]
  }
}
```

Five rules. Covers:

- All current and future paper-trail subdirectories under `.claude/records/` (audits, build-records, work-orders, standups, and any future folder added under the same parent — e.g., the Retrospectives Seed)
- All governance docs under `.claude/docs/` (Pulse, decisions index, learnings, casebook, vocabulary lock, domain map, foundry map, brand guide, and any future doc)
- The graduation log files for the Brickwright and Quality Warden, plus the Pattern Master graduation log once extracted (see below)

Explicitly **excluded** from the allow list:

- `.claude/agents/<agent>.md` — the agent doctrine files themselves
- `.claude/hooks/**` — runtime safety code
- `.claude/skills/**` — skill definitions
- `.claude/settings.json` itself — meta; agents do not edit their own permission file

### Coupled Refactor: Pattern Master Graduation Log Extraction

The Pattern Master's Graduation Log (Discovered Parameters, Candidates, Graduated, Dropped sections) is currently embedded inside `.claude/agents/pattern-master.md` starting at the `## Graduation Log` heading. To bring it into the same shape as the Brickwright and Warden graduation logs — and so that `Edit(.claude/agents/*-graduation.md)` covers it cleanly — the log is extracted into a new file `.claude/agents/pattern-master-graduation.md`. The agent file retains a one-line back-reference link.

This extraction is filed as a dedicated Work Order (`2026-05-25-pattern-master-graduation-log-extraction`) and shipped before the allow rule is leaned on for Pattern Master parameter-log updates from subagent context.

### Naming Convention (codified)

All agent-adjacent files intended for subagent-writable status MUST use the `-graduation.md` suffix. Future agents added to the firm inherit this convention. Files in `.claude/agents/` that do not end in `-graduation.md` are treated as agent doctrine and are NOT covered by the allow rule.

### Enforcement Model

This ADR consciously chooses **doctrine-only enforcement** of agent-target alignment (i.e., the Warden writes Audits, the Brickwright writes Build Records, etc.). The path-based allow rules do not distinguish between callers — any subagent could, in principle, write to any allowed path. The constraint that the right agent writes the right artifact lives entirely in:

1. Each agent's `<agent>.md` doctrine
2. The `git log` audit trail (every write lands in a commit; every commit is reviewable)
3. The standup roll-call (cross-wing surface for catching pattern drift)

The decision to leave runtime agent-identity enforcement out of this ADR is deliberate, not lazy: the doctrine model has held across 200+ records spanning both pre-merger sovereign sequences. Runtime sandboxing (Option C) is preserved as a future Seed if doctrine ever fails.

## Consequences

### Positive

- **All three production subagents file their primary paper-trail artifact directly** in any execution environment (local, cloud, web). The web-environment limitation that produced the prior two incidents is closed.
- **Single-agent atomicity restored for build close-outs.** The "close parent WO in same commit as Build Record" training rule (currently at 1.5/2 unprompted confirmations, both half-counted due to Steward transcription) is now eligible to graduate on the next two clean deliveries.
- **The 2026-05-25 morning standup's CEO action item #1 closes.** The firm-wide agent write-scope question has a recorded decision.
- **The Pulse Seed "ADR: soft enforcement vs. path-sandboxed agent scope" closes.** The soft-vs-sandboxed question is answered: soft, today, with the sandboxed path preserved as an upgrade option.
- **The ADR itself is a showcase artifact.** Most projects have no permission model at all; ours has one that is path-bounded, doctrine-coupled, and explicitly documents the trade-off.

### Negative

- **Naming convention `-graduation.md` is now load-bearing** for agent-adjacent allow rules. A future graduation log named without this suffix is silently uncovered.
- **One-time refactor required:** Pattern Master graduation log extraction. Scoped as a dedicated Work Order.
- **Doctrine-only enforcement for agent-mistarget cases.** A Brickwright subagent could file an Audit. Caught only by `git log`, agent doctrine, and standup observation. CEO confirmed this has never happened; risk accepted.
- **Settings.json maintenance:** if a NEW top-level folder is added under `.claude/` for paper-trail purposes (e.g., `.claude/journals/` or `.claude/inspections/`), a new allow rule is required. The Steward holds this discipline. The `**` glob handles all SUBFOLDER growth automatically.

### Enforcement

| What | Mechanism | Scope |
|---|---|---|
| Allow paper-trail writes from subagents | `permissions.allow` in `.claude/settings.json` | `.claude/records/**`, `.claude/docs/**`, `.claude/agents/*-graduation.md` |
| Doctrine-only constraint on agent-target alignment | Each agent's `<agent>.md` + `git log` review + standup roll-call | All paper-trail writes |
| Naming convention for agent-adjacent writable files | This ADR + agent doctrine docs | `.claude/agents/*-graduation.md` |
| Generated-file protection (unaffected, pre-existing) | `guard-generated-files.sh` PreToolUse hook | `*/shared/generated/*` |

## Resolved Questions

### Why path-based, not agent-identity-based?

**Resolved 2026-05-25.** Agent-identity-based runtime enforcement (a `PreToolUse` hook reading the subagent name and rejecting writes outside its allowlist) solves a class of failure that has not occurred in 200+ records of paper-trail history. Doctrine + `git log` + standup roll-call has held. The runtime hook is preserved as a future Seed if doctrine ever fails; the default starting position is path-based.

### Why A2 (extract Pattern Master log) over A3 (blanket `.claude/**`)?

**Resolved 2026-05-25.** A3 extends the trust boundary to the agent definition files themselves — i.e., the Brickwright could (technically) rewrite the Warden's doctrine. The Brickworks' agent contracts are sovereign documents; extending automatic write-permission to them weakens the firm's doctrine fence to save a 30-line refactor. The CEO's decision was that doctrine fences for agent contracts are worth more than the refactor cost.

### Why `Edit(.claude/agents/*-graduation.md)` instead of expanding to include `pattern-master.md` directly?

**Resolved 2026-05-25.** Adding individual agent definition files to the allow list creates a precedent — once one is added, the doctrine "agent definition files are sacred" gains a footnote that erodes over time. Extracting the graduation log into a sibling file matches the existing Brickwright and Warden pattern, applies a consistent convention, and keeps the allow rule pattern-bounded rather than enumeration-bounded.

### Why was the original two-incident framing wrong?

**Resolved 2026-05-25.** The two prior incidents (Warden 2026-05-20, Brickwright 2026-05-25 Permit A) reported "agent lacks Write access" without verifying the underlying mechanism. The agents' `tools:` frontmatter explicitly grants Write. The settings.json had no permissions block. The actual cause was the cloud/web subagent permission-prompt routing: subagents cannot surface prompts to the user, so any tool call against an un-allowlisted path returns a hard denial. The incidents propagated the wrong diagnosis into the Casebook and the standup; the ADR Interrogator caught it on the third standup. **Methodology note for the Quality Warden Casebook:** when an audit attributes a failure to a tool allowlist gap, verify against the `tools:` frontmatter and `settings.json` before recording the finding.

## Open Questions

### When should runtime agent-identity enforcement be revisited?

The Seed trigger: any single incident in which an agent files (or attempts to file) an artifact in the wrong folder. At that point, doctrine has failed once, and the architectural question reopens with empirical evidence in hand. Until then, the Seed stays in the Pulse but does not become a Work Order.

### Should an architecture test verify settings.json coverage matches actual paper-trail layout?

Deferred. A test that classifies every top-level `.claude/` folder (allowed / agent-doctrine / runtime / config) and asserts settings coverage would catch drift mechanically. Cost: ~50 lines of bash or Pest test. Benefit: catches the Steward forgetting to update settings.json when a new artifact type is introduced. Current judgment: not worth the moving part at this scale. Reconsider if the Steward forgets to update settings.json once.

### Does this pattern extend to git operations (commit/push) from subagents?

Out of scope for this ADR. Agents have `Bash` in their tool allowlists; the question of whether subagents should commit and push (vs. returning the diff for the main agent to commit) is a separate decision. Not coupled here.
