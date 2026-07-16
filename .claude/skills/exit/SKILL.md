---
name: exit
description: Close the doors — stop the autonomous /enter loop. Cancels the scheduled next shift, sets the shift ledger to idle, and hands the CEO a closing summary of the run (issues filed, PRs awaiting review, anything mid-flight). Use when the CEO types /exit or says stop / clock out / close the doors.
---

# /exit — Close the Doors

The counterpart to `/enter`. The CEO wants the floor quiet.

1. **Cancel the loop.** `ScheduleWakeup` with `stop: true`. If no loop is active, say so — nothing to cancel is a fine outcome, not an error.
2. **Settle the ledger.** In `.claude/records/shifts/LEDGER.md`: set `status: idle`, and reset `consecutive_dry` and `consecutive_failures` to 0 — those are stuck-loop tripwires, and a CEO-initiated stop is not a stuck loop; carrying them over would let the next run auto-stop on stale history. Leave `shift` and `rotation` alone — they are monotonic identifiers, and the next `/enter` continues the numbering.
3. **Mid-flight work:** if a build agent or hunt workflow is still running, let it finish its current unit if it is close to landing a PR; otherwise stop it (`TaskStop`) and note on the board issue that the shift was ended by the CEO, moving the issue back to To Do so no work is silently stranded.
4. **Closing summary to the CEO** — the state of the run since the doors opened: shifts run, issues filed (keys), PRs opened and still awaiting review (numbers), anything returned to To Do, and the single most useful next action.

Never merge, close, or delete anything on the way out. `/exit` parks the firm; it doesn't tidy it.
