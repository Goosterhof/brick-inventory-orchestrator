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

## 2026-07-16 — PR #277 Review Cycle, Merge, and PR #273 CI Repair

### Decisions

- **Review findings applied same-session**: General's Major (shift-reentry TOCTOU) fixed with a `shift_started_at` liveness gate (60-min staleness threshold, fresher = HALT), act-time re-verify before `start-work-on-issue`, and a distinct `waiting` ledger status; Minor fixed by `/exit` resetting `consecutive_dry`/`consecutive_failures` while keeping `shift`/`rotation` monotonic.
- **Lockfile conflict resolved by taking main wholesale**: the branch's `libc`-churn commit was netted out of PR #277 rather than shipping a half-churned merge — churn was never substantive.
- **PR #273 fixed on the Dependabot branch, not rebased**: oxfmt 0.58 reformats 5 showcase components (`</pre>` closing-`>` no longer wrapped); formatter re-run and committed onto the branch. `@dependabot rebase` explicitly ruled out — it would force-push away the fix.

### False Starts

- **General's branch-protection hypothesis inverted**: review suspected required check `"gate"` never matches `town-crier/gate`; live config showed `gate` (Actions, app 15368) exists, matches, and was green — the actual red check was `town-crier/gate` ("Held — 2 open findings"), which tracks finding threads, not code, so fix commits alone don't flip it.

### Friction Signals

- PR #277 gained merge conflicts mid-review-handling (PR #276 Kendo migration rewrote the Paper Trail table on main); resolved in one pass, CEO surfaced it mid-turn.
- PR #277 stayed `BLOCKED` after all fixes landed; unblocking required CEO thread resolution at merge time, consistent with the standing classifier constraint.

### Dynamics

- CEO drove the cadence with terse mid-turn directives ("commit and push and PR everything", "we got merge conflicts", "it's merged", "let's apply it"); Steward executed without further decision menus.
- For #273 the Steward reported diagnosis first and offered the fix; CEO approved before application.

### Process Meta

- `/minutes` fired twice this session (this entry appends to the first file).
- No subagents dispatched; review fixes, conflict resolution, and the #273 repair were all direct.
- Frontend pre-push gauntlet ran green three times (PR #277 initial push, review-fix push, #273 branch push); no ceremony bypasses.
- Memory updated: `feedback_classifier_external_writes` gained the `town-crier/gate` check-run mechanics (app `town-crier-announce`, fails with "Held — N open findings" until threads resolve).

### Notes

- PR #277 squash-merged as `f32e8e2`; `/enter`, `/exit`, `shift-patrol`, and the shift ledger are live on `main`. No shift has run yet.
- Paper Trail table conflict resolution seated the Shift Report row in the post-Kendo column format (`Artifact | Lives | Filed When | Filed By`).
- Formatter-bump failure mode recorded: Dependabot bumps a formatter but cannot re-run it, so any output drift fails `format:check`; fix is checkout → format → commit onto the bot branch.

### Action Items

- CEO: merge #273 once checks report green — without commenting `@dependabot rebase`.
- Steward: maiden `/enter once` run still pending from the first entry's action items.

---
