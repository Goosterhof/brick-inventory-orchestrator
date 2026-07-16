# Shift Ledger — The Brickworks

> State carried between autonomous shifts (`/enter`). The Steward updates this at every clock-out.
> Hand-edit only while `status: idle`. The cadence knobs are the CEO's cost dial.

```
shift: 1                  # current shift number (claimed at clock-in; monotonic across runs)
rotation: 1               # patrol dimension rotation counter
sweep_cadence: 5          # every Nth shift runs the full warden-cross-wing-sweep instead of the patrol
last_sweep_shift: 0
last_shift_date: 2026-07-16
shift_started_at: —       # ISO timestamp stamped at clock-in; liveness gate treats running shifts <60 min old as ALIVE (halt, don't barge in)
consecutive_dry: 0        # shifts in a row with nothing filed and nothing built (2 → doors close)
consecutive_failures: 0   # red builds in a row (3 → doors close; reset to 0 by /exit — a CEO pause is not a stuck loop)
status: idle              # idle (doors closed) | waiting (next shift scheduled) | running (a shift is mid-cycle right now)
```
