# Minutes — 2026-07-17 — First Continuous Autonomous Run (shifts 002–011)

_Board meeting note between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-07-17 — First Continuous Autonomous Run (shifts 002–011, 2026-07-16 ~16:55 → 2026-07-17 ~01:40)

### Decisions

- **Backpressure self-cap below the gate** (shift 004): with 5 open agent PRs, the Steward built 1 instead of the allowed 2 — reading the 6-PR gate as a ceiling not to overshoot, landing the queue exactly at 6. Not specified by the skill; decided from the throttle's intent.
- **Cost-honesty hunt skips** (shifts 006, 009): patrol skipped when `main` was byte-identical to a tree already covered by a fresh patrol/sweep — reasoning documented in each Shift Report; the dry-counter left as the off-switch.
- **Sweep deferral over cadence** (shift 010): the 10th-shift full sweep was deferred because the tree was materially the one the shift-005 sweep audited (~5h earlier); `last_sweep_shift` kept at 5; CEO pre-briefed one shift earlier, dial left theirs to overrule.
- **Loop-owned dirty-tree convention** (shift 003 onward): shift reports + LEDGER (later the sweep Audit + Casebook) stay uncommitted in the working tree during a run — `main` untouchable, PR-per-30-min unsustainable; the Phase 0 clean-tree gate reads "dirty limited to loop-owned state files = proceed." Bundled docs PR deferred to doors-reopen.
- **Shared branch for file-overlapping issues** (shift 008): BIO-0026 + BIO-0027 both touch `auth/index.ts` — built on one branch/PR (#292) to avoid a guaranteed cross-PR conflict; both issues linked to the same branch on the board.
- **Destructive-scope split for autonomous builds** (shifts 003, 007): BIO-0019 and BIO-0025 scoped to non-destructive fixes only; prod-data decisions (unique-constraint dedupe strategy, stranded-row recovery) explicitly deferred to the CEO. BIO-0025's migration codified the **fail-loudly pattern**: pre-check aborts listing offenders, never auto-deletes/merges.
- **Steward-direct verification as verifier fallback** (shift 007): after the workflow verifier died twice on API 529, the Steward verified finding F-tx-1 directly against source and recorded the reasoning on the issue (BIO-0025) rather than hammering a third workflow run.

### False Starts

- **Named-workflow `args` never reach the scripts**: shifts 001–002 patrols silently executed rotation-0 defaults (`date: 0000-00-00`) despite correct-looking `args`; discovered shift 003 via the script's default-fallback lines. Standing workaround: copy the script to scratchpad with `TODAY`/`ROTATION` pinned, invoke via `scriptPath`. Applied to the sweep too. Recurrence 2 of needing it — one more earns a board issue.

### Friction Signals

- Two transient Anthropic API 529s in shift 007: the patrol's verify agent died twice (workflow resume replayed finders from cache but the verifier failed again); the BIO-0025 Brickwright was killed mid-mutation-drill and resumed via SendMessage — completed with zero rework; `consecutive_failures` never incremented (infra, not build failures).
- The review gate closed twice: shifts 005–006 (reopened by the CEO's evening merge batch) and shifts 009–011 (unresolved; ended the run via `consecutive_dry = 2`).
- Shift 004's patrol found 2 of 3 confirmations converging on already-in-review work — the first hunt-saturation signal; the light patrol's yield tracked territory freshness for the rest of the run (rotation 5 auth territory: 2 fresh mediums; wrap-around rotations: skipped).

### Dynamics

- CEO interaction was a single batch: 5 PRs (#285–#289) merged between shifts 006 and 007, no mid-loop instructions issued all run. The Steward closed the paper trail (Build Records + Done moves) at the next clock-in.
- External PR #284 (`WR-0431`, ui-inputs / ADR-0043 pilot) appeared on the review queue from outside the loop — flagged in roll-call as CEO-queue context, never acted on.
- Steward escalations onto CEO-decision issues: fresh incident evidence on BIO-0007 (BIO-0016 slipped through the coverage exclusions), third-cycle escalation comment on BIO-0008 (later built, shift 009).

### Process Meta

- `/enter` loop ran 10 shifts (002–011) via ScheduleWakeup self-scheduling; liveness/claim protocol on LEDGER.md held throughout (no duplicate-wakeup incidents).
- Workflows: `shift-patrol` ×5 (rotations 0-defaulted, 0-defaulted [prior session], 2, 3, 4, 5 — all via pinned scratchpad copies from shift 003), `warden-cross-wing-sweep` ×1 (18 agents, ~1.39M tokens, Audit + Casebook filed by the sweep), 1 workflow resume (cache replay), 1 agent resume via SendMessage.
- Brickwrights: 9 worktree dispatches covering 10 issues (BIO-0015/0016/0019/0020/0021/0023/0025/0026+0027/0008/0022) — **all green on first full gauntlet pass**; `consecutive_failures` ended 0.
- Board: 14 issues filed (BIO-0015…0028), `inconsistency` label created, 7 issues closed to Done with Build Record closing comments post-merge; recurrence rule (3 sightings → issue) fired twice (BIO-0022, BIO-0028); branch-linking via `start-work-on-issue` worked all run (repo link restored before shift 002).
- Run totals: 13 findings adversarially confirmed, **0 refuted**; 8 agent PRs opened (#285–#294 minus #284); doors closed by `consecutive_dry = 2` at shift 011.

### Notes

- First pass over auth territory (rotation 5) yielded the run's most user-visible bugs — the 401 middleware that both the manual and the showcase visualizer described did not exist in code (GA-1/BIO-0026), and boot was a single point of total failure (GA-2/BIO-0027). Doc-described-but-unimplemented behavior is a finding class worth a future patrol dimension.
- The sweep's headline: no correctness defects in either wing; the firm's rough edges are docs drift and duplication. Foundry re-rated 8.5, Gallery held 7.5.
- Test-masking pattern recurred across three separate bugs (BIO-0016 fabricated mock shape, BIO-0025 SQLite NULL semantics, BIO-0026 pre-hydrated integration store): tests asserting against shapes/states production never produces.

### Action Items

- CEO: review queue in suggested order #292 → #291 → #294 → #293 → #290 → #284.
- CEO: decisions parked — BIO-0007 (a)/(b), BIO-0017 pagination scope, BIO-0024 ADR-0012 Interrogator session, BIO-0018/BIO-0028 storage product calls, BIO-0019 follow-ups (Railway `DB_QUEUE_RETRY_AFTER` check + unique-constraint dedupe strategy), BIO-0013 (CEO-assigned since 2026-06-12).
- Steward (next session): open the docs PR bundling shift reports 002–011, LEDGER, the 2026-07-16 sweep Audit, Casebook update, and these minutes.
- Steward (next run): file the workflow-args plumbing issue if the pinned-copy workaround is needed a third time; consider codifying the unchanged-tree sweep-skip into the `/enter` skill (see Open Questions).

### Open Questions

- Should the `/enter` skill formally encode the cost-honesty precedents (hunt skip + sweep deferral on an unchanged tree), or stay judgment-per-shift? Shift 006/009/010 reports are the precedent trail.
- #284's overlap with the merged/queued Gallery PRs (form-input surfaces) — merge-order risk not assessed by the shifts; CEO's call.
- Stale worktree `agent-a62e1a1ceffde46d8` (pre-ADR-0028-retirement) pollutes greps — cleanup needs a hand-run session (outside shift write surface).

---
