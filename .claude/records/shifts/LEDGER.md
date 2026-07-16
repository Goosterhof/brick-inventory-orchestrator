# Shift Ledger — The Brickworks

> State carried between autonomous shifts (`/enter`). The Steward updates this at every clock-out.
> Hand-edit only while `status: idle`. The cadence knobs are the CEO's cost dial.

```
shift: 0                  # last completed shift number (monotonic across runs)
rotation: 0               # patrol dimension rotation counter
sweep_cadence: 5          # every Nth shift runs the full warden-cross-wing-sweep instead of the patrol
last_sweep_shift: 0
last_shift_date: —
consecutive_dry: 0        # shifts in a row with nothing filed and nothing built (2 → doors close)
consecutive_failures: 0   # red builds in a row (3 → doors close)
status: idle              # idle | running
```
