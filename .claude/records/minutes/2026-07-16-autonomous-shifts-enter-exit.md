# Minutes — 2026-07-16 — Autonomous Shifts (/enter, /exit)

_Board meeting note between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-07-16 — Autonomous Shifts (/enter, /exit)

### Decisions

- **Autonomous operation exists**: CEO requested a self-running firm — `/enter` starts a shift loop (standup → hunt bugs/inconsistencies → file board issues → pick up bug and fleshed-out feature issues → build), `/exit` stops it.
- **Autonomy endpoint — Branch + PR**: shifts push branches and open PRs with `Agent Review Requested`; the CEO remains sole merge authority. Locked via decision menu.
- **Run mode — continuous loop**: shifts repeat on ~30-min ScheduleWakeup until CEO stop, 2 consecutive dry shifts, or 3 consecutive red builds. CEO chose continuous over the Steward-recommended one-shift mode.
- **Hunt depth — patrol + periodic sweep**: light `shift-patrol` workflow per shift; full `warden-cross-wing-sweep` every `sweep_cadence`-th shift (default 5, dial in the ledger). CEO chose the hybrid over the Steward-recommended patrol-only.
- **Backpressure gate**: no new builds while ≥6 agent PRs await CEO review; max 2 builds per shift, 2 attempts per issue. Steward-set parameters, unchallenged.
- **Shift Report is a new paper-trail artifact**: filed per shift at `.claude/records/shifts/`, with state carried in `LEDGER.md`; charter table updated.

### Dynamics

- Steward posed three scoped questions (autonomy endpoint, run mode, hunt depth) with recommendations; CEO accepted the first recommendation and overrode the other two toward more autonomy and more depth.
- Consistent with the CEO's standing pattern: terse direction, decision-menu selection, execution delegated whole.

### Process Meta

- AskUserQuestion fired once (three questions, one round).
- No subagents dispatched; build was direct by the Steward.
- Artifacts created: `.claude/skills/enter/SKILL.md`, `.claude/skills/exit/SKILL.md`, `.claude/workflows/shift-patrol.js`, `.claude/records/shifts/LEDGER.md`; `CLAUDE.md` charter edited (Shift Report row + Autonomous Operation section). Memory file `project_autonomous_shifts.md` saved.
- All files left uncommitted for CEO review; no shift has been run yet.

### Notes

- `shift-patrol` mirrors `warden-cross-wing-sweep`'s finder→adversarial-verify shape but hunts defects/inconsistencies (not convention freshness), writes nothing, and returns a corpus; the Steward files board issues from the main loop because workflow agents may lack Kendo MCP access headless.
- Rotation pools: 4 Gallery + 4 Foundry dimensions indexed by a ledger counter; diff-hotspots and cross-wing stud-connection drift run every patrol.
- Known constraint acknowledged in-skill: Kendo issue creation may be permission-gated ([[classifier-blocks-external-writes]]); blocked filings degrade to an "Unfiled Findings" section in the Shift Report.
- Vague feature issues are not picked up — they get a "needs fleshing" comment; only issues with concrete acceptance criteria are buildable.
- ADR-0028 interim rule wired in: above-threshold pushes use sanctioned `--no-verify` citing the open BIO issue as permit.

### Action Items

- CEO: review and commit the five new/edited files.
- CEO: maiden run — `/enter once` suggested before opening the continuous loop.
- Steward: on first sweep-cadence shift, confirm `warden-cross-wing-sweep` harvest into Phase 3 works as specified.

### Open Questions

- Should `/standup` and `/retro` learn to read Shift Reports and the board (they still mine frozen build-records)? Carried over from the Kendo migration session.
- Autonomous-session permissions: does the CEO pre-allow Kendo creates / `gh pr create` for unattended shifts, or accept degraded "Unfiled Findings" mode?

---
