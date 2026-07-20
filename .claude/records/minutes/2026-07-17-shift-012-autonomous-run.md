# Minutes — 2026-07-17 — Shift 012 autonomous run

_Board meeting note between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-07-17 — Shift 012 autonomous run

### Decisions

- **Settings-tightening committed onto PR #297**: uncommitted `.claude/settings.json` change (records/docs `Write`→`Edit`-only) was committed to the open minutes PR #297 on CEO instruction, rather than discarded.
- **BIO-0029 fix approach — staleness reclamation**: chose the minimal non-destructive path (flip a stale active `ImportJob` to `Failed` inside the insert transaction, config-driven 1200s threshold) over a user-facing cancel/reset endpoint or a scheduled reaper — those deferred to the CEO as product calls.
- **BIO-0001 not autonomously rescoped**: returned to To Do + `blocked` rather than expanding the shift's scope into the 7-file `vi.mock` refactor the Work Order forbade.

### False Starts

- **Arch-cleanup BIO-0001 premise**: the migrated Work Order asserted the 7 showcase specs `vi.mock`+`findComponent` `SectionHeading` (import = dead weight). Brickwright's trial removal proved the opposite — the specs pass the *real* component via `shallowMount` `stubs`, so the import is load-bearing (`TS18004` + `ReferenceError` on removal). Reverted; no mechanical path exists.

### Friction Signals

- Clock-in git gate tripped on the pre-existing dirty `settings.json`; Steward halted the shift and escalated to the CEO before claiming shift 12.
- CEO re-opened the doors for shift 12 despite the ledger sitting at `consecutive_dry: 2` (the prior run's auto-stop point).
- One of two builds landed red (BIO-0001), but as a correct premise-refusal, not a gauntlet failure.

### Dynamics

- CEO overrode the Steward's halt by directing the settings change onto PR #297; Steward complied and returned `main` clean before clocking in.
- Steward flagged, but did not act on, a series-wide risk (BIO-0002…0006 may share BIO-0001's false premise) — left as a CEO decision.

### Process Meta

- Skills fired: `/enter` (shift 012), `/minutes`, `/exit`.
- Workflow: `shift-patrol` (8 agents, rotation 6 — gallery-inventory + foundry-receiving + hotspots + stud-connections); run from a scratchpad copy with `TODAY`/`ROTATION` pinned per the standing args-don't-reach workaround. 4 confirmed / 0 refuted.
- Subagents: 2 Brickwrights dispatched concurrently under `isolation: worktree` — Foundry (BIO-0029, green→PR #298) and Gallery (BIO-0001, red→returned).
- Board reconciliation: 6 already-merged issues (BIO-0008/0022/0023/0025/0026/0027) closed In Review → Done with Build-Record comments.
- `/exit` cancelled the scheduled shift 13 and set the ledger idle.

### Notes

- Patrol lows batched (not filed; policy = 3 recurrences): P-recv-2 (GetSetPartsAction re-dispatches only on Failed), P-recv-3 (duplicate SyncSetPartsJob dispatch), P-recv-4 (Rebrickable empty-list cached 24h), SC-import-1 (dead 422 branch → token-less import fails silently), GI-place-1 (unclamped PlacePartModal quantity).
- BIO-0029 config placed in `config/app.php` (following `invite_code_ttl_days` precedent) rather than a new `config/import.php`.

### Action Items

- CEO: review/merge PR #298 (BIO-0029 import-lockout fix).
- CEO: decide BIO-0001 rescope (real `vi.mock` refactor vs drop the arch-cleanup series); re-verify BIO-0002…0006 premises before pickup.
- CEO: if merging PR #297, re-add `Write(.claude/records/shifts/**)` to keep unattended Shift-Report filing from prompting.

### Open Questions

- SC-import-1: which wing moves — surface the failed ImportJob's reason to the UI, or add a synchronous pre-flight token check in `StartImportAction`?

---
