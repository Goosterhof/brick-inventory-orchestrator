# Minutes — 2026-07-16 — Full migration of work tracking to Kendo

_Board meeting note between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-07-16 — Full migration of work tracking to Kendo

### Decisions

- **Work tracking moves to the Kendo board** (CEO, 2026-07-16): Work Orders become Kendo issues; Build Records become closing comments on the issue before it moves to Done. This is the CEO exercising the "separate, larger decision" explicitly deferred in the 2026-06-09 board-wiring WO — a recorded reversal of the "board is additive" scope, not drift.
- **Scope boundary:** Audits stay narrative files but every actionable finding is filed as a labeled board issue (no more finding→WO files). Minutes, Standups, and Retrospectives stay file-based — narrative records, not trackable work.
- **History freezes as archive:** only the 12 open Work Orders migrated. `.claude/records/work-orders/` and `build-records/` are frozen through 2026-07-16 (~150 completed records read-only), mirroring the MINUTES.md freeze pattern from the merger.
- **Kendo write tools allowlisted** in committed `.claude/settings.json` (create/update issue, comments, epics, labels, sprints, branch links). `delete-*` and `complete-sprint` deliberately excluded — destructive board ops still prompt. This closes the June write-path permission gap flagged in the board-wiring Build Record.

### The Migration Payload

- Epic #1 "Arch cleanup sweep" (from the 2026-05-28 umbrella WO) with slices BIO-0001…BIO-0006 — the umbrella-WO-as-epic mapping replaces the ADR-0028 slug-match workaround the umbrella existed for.
- Standalone issues BIO-0007 (coverage-gate scope honesty, Issuer decision carried onto the issue, `blocked` label), BIO-0008 (parts-list composables), BIO-0009 (integration flow assertions), BIO-0010 (doc drift reconciliation, annotated that PR #258 may have overtaken parts), BIO-0011 (permit-gate worktree blindness, typed Bug).
- Follow-ups born from the migration: BIO-0012 (amend ADR-0028 — permit source must move from WO files to the board; notes the re-interrogation trigger the Warden ruled fired 2026-05-29) and BIO-0013 (CEO-assigned: Railway tokens + report-tool feature gate + deferred smoke tests, stale since June).
- All 12 migrated WO files stamped `Migrated to Kendo — BIO-xxxx (2026-07-16)`.

### Notable

- **First successful board write.** Every Kendo write since June had been classifier-blocked; the June smoke-test acceptance criterion ("test issue created via create-issue") is retroactively satisfied by the migration itself — recorded on BIO-0013.
- **ADR-0028 is now doctrinally broken by design:** PrePushPermitGate slug-matches WO files that will no longer be filed. Interim rule recorded in the Atrium manual: above-threshold pushes use the sanctioned `--no-verify` hatch with an open board issue as the permit, until BIO-0012 amends the ADR. BIO-0011 (worktree blindness) was annotated to fold into that redesign.

### Action Items

_Tracked on the board, not here — that is the point of today's decision._

- CEO: BIO-0013 (tokens + feature gate + smoke tests).
- CEO: BIO-0007 decision (a)/(b) on the issue.
- Steward/crew: BIO-0012 ADR-0028 re-interrogation + amendment — highest-priority non-CEO item; the gate degrades with every above-threshold push until then.

### Open Questions

- Committed `.mcp.json` for the crew vs user-scope-only Kendo MCP — still open from June; unchanged by today's decision.
- Whether `/standup` and `/retro` skills should read the board alongside the remaining file-based records (they currently mine Build Records that will no longer accrue as files).

---
