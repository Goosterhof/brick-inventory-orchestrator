---
name: enter
description: Open the doors — The Brickworks starts running autonomously. Each shift the Steward clocks in, runs a roll-call, hunts bugs and inconsistencies (light patrol, full warden-sweep every Nth shift), files verified findings as board issues, picks up ready bug/feature issues, dispatches Brickwrights to build and open PRs, files a Shift Report, and schedules the next shift. Loops until the CEO says stop or the floor runs dry. Use when the CEO types /enter.
argument-hint: '[optional: "once" for a single shift, no loop | a focus area, e.g. "receiving"]'
---

# /enter — The Brickworks Runs Itself

The CEO opens the doors; the Steward runs the floor. One `/enter` starts a **continuous loop of shifts**. Each shift is one full cycle:

```
clock in → roll-call → hunt → file issues → pick up work → build → PR → shift report → schedule next shift
```

The CEO's decisions (locked 2026-07-16) that shape this skill:

1. **Autonomy endpoint: Branch + PR.** Brickwrights build, gauntlet, push, and open PRs carrying the `Agent Review Requested` label. **Nothing merges without the CEO.** Never merge, never close, never commit to `main`.
2. **Run mode: continuous loop.** After each Shift Report, schedule the next shift (~30 min) via `ScheduleWakeup` with prompt `/enter`. Stop conditions below.
3. **Hunt depth: patrol + periodic sweep.** Light `shift-patrol` workflow normally; every `sweep_cadence`-th shift escalates to the full `warden-cross-wing-sweep`.

State between shifts lives in `.claude/records/shifts/LEDGER.md`. The board (`kendo-goosterhof`, project 3, `BIO-xxxx`) is the work-tracking source of truth per the 2026-07-16 migration.

---

## Phase 0 — Clock In

1. `date +%F` for today's date.
2. Read `.claude/records/shifts/LEDGER.md`. **Liveness gate:** if `status: running`, another shift may be executing right now — compare `shift_started_at` against the current time. Fresher than 60 minutes (2x the shift interval) → **HALT**: report "a shift appears to already be active (started <time>)" to the CEO and end the turn — do not touch the ledger, do not schedule a wakeup. Staler than that → the prior shift died mid-cycle: note it in this shift's report and continue. A live shift and a dead shift must never be conflated on the `status` field alone.
   Then claim the shift: increment `shift`, stamp `shift_started_at` with the current timestamp (`date -Is`), set `status: running`, and write the ledger back **before** any other phase runs.
3. **Git safety gate.** `git status` + `git branch --show-current`. Requirements: on `main`, clean tree. Then restock parts: `git pull --ff-only`. If the tree is dirty or the pull conflicts → **do not loop**: report the state to the CEO and stop (`ScheduleWakeup stop: true` if a loop is active). Autonomous shifts never build on top of uncommitted work they didn't create.
4. Load board tools via `ToolSearch` (`select:` the kendo-goosterhof tools you need) and call `prepare-project-context` with `project_id: 3` — resolve lanes, active sprint, labels, current_user fresh (never cached).
5. Review-queue backpressure count: `gh pr list --state open --label "Agent Review Requested" --json number` — remember the count for Phase 4.

## Phase 1 — Roll-Call (standup-lite)

A condensed, board-aware sync — embedded in the Shift Report, **not** a separate Standup Note (a note every 30 minutes is noise; `/standup` remains the CEO-triggered full ritual).

- Board state: issues per lane, what's in progress, what's blocked, what's waiting on the CEO.
- Open agent PRs awaiting review (from Phase 0.5) — the CEO's review queue.
- Last Shift Report's leftovers: unfiled findings, failed builds, open action items.
- `.claude/docs/pulse.md` active concerns — flag high-severity ones only.

## Phase 2 — Hunt

- **If `shift % sweep_cadence == 0`:** run the full sweep — `Workflow({name: 'warden-cross-wing-sweep', args: {date, scope: 'full'}})`. It files its own Audit; harvest its confirmed medium+ findings for Phase 3. Update `last_sweep_shift` in the ledger.
- **Otherwise:** run the light patrol — `Workflow({name: 'shift-patrol', args: {date, rotation}})` where `rotation` comes from the ledger. It writes nothing; it returns a verified corpus of bugs and inconsistencies. Increment `rotation` in the ledger afterward.
- If `$ARGUMENTS` named a focus area, mention it in the patrol invocation by appending it to args (the finders read it as a steer) and weight issue pickup toward it.
- While the workflow runs in the background, proceed to Phase 1 reading if not done; otherwise wait for the notification — do not poll.

## Phase 3 — File Issues

For each **confirmed** finding from the hunt:

1. **Dedupe first.** `search-issues` on the board (title keywords + location). Already filed and open → skip; add a comment with new evidence only if the finding materially advances it. Also dedupe against findings listed as "unfiled" in recent Shift Reports.
2. **File.** `create-issue` in the To Do lane: title from the finding's one-liner; description carries severity, wing, `file:line` location, observation (evidence), impact (failure scenario), recommendation, and `Found by: shift patrol NNN` / `warden sweep`. Label `bug` or `inconsistency` (create the label once if missing).
3. **Permission-gated writes degrade gracefully.** Board creates may be blocked by the external-write classifier. If blocked: list the finding in full under **Unfiled Findings** in the Shift Report and move on — never retry a denied call verbatim, never let a blocked write stall the shift.

Low-severity observations are *not* filed as issues — batch them into the Shift Report's observations section; three recurrences across shifts earns an issue.

## Phase 4 — Pick Up Work

**Backpressure gate first:** if open `Agent Review Requested` PRs ≥ 6, build **nothing** this shift — the CEO's review bandwidth is the throttle. Hunt-and-file only, and say so in the report.

**Selection** — from the To Do lane, at most **2 issues per shift**, in priority order:

1. `bug`-labeled issues, highest severity first.
2. **Fleshed-out** feature issues — the description contains concrete acceptance criteria or a spec detailed enough to build without inventing scope. A title-only or vision-level feature is **not** buildable: leave it, and (if board writes are permitted) comment `Needs fleshing before an autonomous shift can pick this up — missing: <what>`.

**Never pick up:** issues assigned to the CEO, issues labeled for CEO decision, issues with a linked branch or open PR, issues a prior shift failed twice (comment trail shows it), or anything an in-progress lane already holds.

**Execution** — for each selected issue:

1. **Re-verify at act time.** Selection above was a read; another Steward (a concurrently-fired wakeup, a parallel session) may have claimed the issue since. Immediately before acting, re-fetch the issue and confirm it is still in To Do, unassigned, and branch-free — if anything changed, skip it silently and take the next candidate.
2. `start-work-on-issue` — assigns, moves the lane, links branch `<type>/BIO-xxxx-<slug>` (type = `fix` for bugs, `feat` for features).
3. Dispatch a **brickwright** agent with `isolation: 'worktree'` on that branch. The dispatch prompt must include: the issue key + full description, the relevant wing manual pointer, the order to run the wing's real gauntlet (Foundry: `composer lint:test && composer phpstan && composer deptrac && composer test:arch && composer test`; Gallery: `npm run type-check && npm run lint && npm run test:coverage && npm run build`), Conventional Commits with the right scope, and the rule **never touch `main`, never merge**.
4. **On green:** push the branch and open the PR — `gh pr create` targeting `main`, body references `BIO-xxxx`, explains what/why/how-verified, ends with the standard Claude Code footer. The `agent-review-label.yml` workflow applies `Agent Review Requested` on open — verify it landed (`gh pr view --json labels`), add it manually if not. Comment the PR link on the board issue and move it to the review-ish lane if one exists. **ADR-0028 interim rule:** if the push trips the PrePushPermitGate threshold (>20 files or >500 lines), use the sanctioned `--no-verify` with the open `BIO-xxxx` issue as the permit — cite it in the Shift Report.
5. **On red:** do not push. Comment the failure diagnosis on the issue, move it back to To Do, record in the Shift Report, increment `consecutive_failures` in the ledger. Two failures on the same issue = hands off; it needs the CEO or a hand-run session.

The two builds may run concurrently (separate worktrees, one message, two Agent calls). Build Records: per the 2026-07-16 migration, the Brickwright's closing comment on the issue *is* the Build Record — filed when the PR merges, which is the CEO's moment, so the shift comments the PR link and stops there.

## Phase 5 — Clock Out

1. **File the Shift Report** at `.claude/records/shifts/YYYY-MM-DD-shift-NNN.md` (format below).
2. **Update the ledger:** `rotation`, `last_sweep_shift`, `last_shift_date`, `consecutive_dry` (increment if this shift filed nothing *and* built nothing, else reset to 0), `consecutive_failures` (reset on any green build), and `status` — `waiting` when a next shift is scheduled, `idle` when the doors close. `status: running` belongs exclusively to a shift that is mid-cycle (set at clock-in, cleared here).
3. **Brief the CEO in chat** — 3–6 sentences: what was hunted, what was filed (issue keys), what PRs opened (numbers), what needs their eyes. This is the message they read on their phone; make it self-contained.
4. **Loop or stop.**

**Stop conditions** (any one → `ScheduleWakeup stop: true` if looping, set ledger `status: idle`, tell the CEO the doors are closed and why):

- The CEO said stop, in any words (`/exit`, "stop", "clock out", "close the doors") — honor it immediately, even mid-shift.
- `consecutive_dry ≥ 2` — two shifts with nothing to file and nothing to build. The floor is clean; don't burn tokens patrolling an empty factory.
- `consecutive_failures ≥ 3` — the crew is stuck; a human needs to look.
- Git or board access is broken (Phase 0 gate failed, or every board write was denied two shifts running).
- `$ARGUMENTS` contained `once` — single shift, no loop, report and end.

**Otherwise:** `ScheduleWakeup` with `delaySeconds: 1800`, `prompt: "/enter"`, `reason: "next Brickworks shift (NNN+1)"`, set ledger `status: waiting`, and end the turn. (If a stray second timer ever fires while a shift is mid-cycle, the Phase 0 liveness gate halts it — the gate is what keeps duplicate wakeups from doubling the cadence.)

---

## Shift Report Format

```markdown
# Shift NNN — YYYY-MM-DD

**Steward on duty** · Hunt: patrol rotation N | full sweep · Loop: shift M of run started YYYY-MM-DD

## Roll-Call
- Board: [N in To Do, N in progress, N awaiting CEO] · Review queue: [N open agent PRs]
- Carried from last shift: [leftovers, or "clean handoff"]

## Hunt
- [Confirmed: N, refuted: N, dimensions: ...] — or sweep audit path

## Issues Filed
- BIO-xxxx — [title] (severity, wing)

## Unfiled Findings
[Full finding detail for anything a permission gate blocked — this section is the fallback paper trail. Omit if empty.]

## Builds
- BIO-xxxx → PR #NNN [green: pushed + labeled] / [red: diagnosis, returned to To Do]

## Observations (low severity, not filed)
- [batched; 3 recurrences → issue]

## For the CEO
[The one thing to look at first. PRs awaiting review by number.]
```

---

## Guardrails (load-bearing)

- **`main` is untouchable.** No commits, no merges, no force-pushes, no branch deletions. The shift's write surface: worktree branches, PRs (open only), board issues/comments/labels, `.claude/records/shifts/`, and nothing else outside what a dispatched workflow's own charter allows.
- **The CEO is the merge authority and the review throttle.** Backpressure gate at 6 open agent PRs.
- **Max 2 builds per shift; max 2 attempts per issue across all shifts.**
- **Cost honesty.** Patrol ≈ 8–12 agents; sweep shift is billing-real (~1.4M tokens) — the cadence in the ledger is the CEO's dial. If the CEO questions cost, surface the ledger's cadence knobs rather than silently thinning the hunt.
- **Denied ≠ retry.** A permission-blocked call is a user decision; degrade to the report, don't hammer.
- **Every claim in the Shift Report traces to an artifact** — an issue key, a PR number, a finding's file:line. No synthesized activity.
- **Mid-loop CEO messages win.** Any instruction arriving between shifts overrides this ritual — the loop is the default, the CEO is the exception handler.
