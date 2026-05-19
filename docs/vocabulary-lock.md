# Vocabulary Lock — The Brickworks

**Filed:** 2026-05-19
**Status:** Locked
**Signed off by:** CEO (Gerard)
**Authority:** Phase 0 Work Order `2026-05-18-form-the-brickworks` (`.claude/records/permits/2026-05-18-form-the-brickworks.md`)
**Plan reference:** `MERGER_PLAN.md` rev 4, Phase 0.5

---

## Purpose

This file is **documentary, not deliberative**. The CEO chose the names below during the merger-plan deliberation session (recorded in the `MERGER_PLAN.md` Context section). This artifact records the decision, the date, and the alternative that was declined — so future readers (and the AI personas operating under these names) can trace why the company is called what it's called.

The names are **locked** as of the filing date. Subsequent phases (1 through 8) build on this vocabulary. The CEO retains the right to swap a name at any time, but until that happens the table below is the binding reference.

## Chosen Vocabulary

### Role Names

| Old (backend: Stud & Sort Logistics) | Old (frontend: Brick & Mortar Associates) | **Locked (The Brickworks)** |
|---|---|---|
| Logistics Director | CFO | **The Steward** |
| Head Sorter | Lead Brick Architect | **Brickwright** |
| Inventory Auditor | Building Inspector | **Quality Warden** |
| — | Creative Engine | **Pattern Master** |

### Artifact Names

| Old (backend) | Old (frontend) | **Locked (The Brickworks)** |
|---|---|---|
| Shipping Order | Building Permit | **Work Order** |
| Shift Log | Construction Journal | **Build Record** |
| Audit Report | Inspection Report | **Audit** |

### Place Names

| Old | **Locked (The Brickworks)** |
|---|---|
| Warehouse / Firm | **Brickworks** (the company as a whole) |
| Backend domain (`backend/`) | **The Foundry Wing** |
| Frontend domain (`frontend/`) | **The Gallery Wing** |
| Orchestrator root | **The Atrium** |

### Operational Terms

| Old (backend) | **Locked (The Brickworks)** |
|---|---|
| Sorting Procedure | **Build Operation** |

## Declined Alternative

The lab review of the merger plan (`MERGER_PLAN_REVIEW.md`) proposed an alternative trades-vocabulary set:

- Artifact names: **Commission** / **Workshop Log** / **Inspection**
- Role names: **The Foreman** / **Brickwright** / **Inspector** / **Pattern Master**

The CEO **declined** in favor of the manufacturing-firm vocabulary above. Rationale recorded in the merger-plan deliberation session: the chosen names lean into the "old-world manufacturing firm with named wings" metaphor more cleanly, and "Work Order" carries clearer authorization weight than "Commission" for the role permits play in the pre-push gate.

## Folder & Path Implications

Phase 4 of the merger plan will rename the records directories to match the locked artifact names:

- `.claude/records/permits/` → `.claude/records/work-orders/`
- `.claude/records/journals/` → `.claude/records/build-records/`
- `.claude/records/inspections/` → `.claude/records/audits/`

Template filenames rename in lockstep:

- `.shipping-order-template.md` / `.building-permit-template.md` → `.work-order-template.md`
- `.shift-log-template.md` / `.construction-journal-template.md` → `.build-record-template.md`
- `.audit-report-template.md` / `.inspection-report-template.md` → `.audit-template.md`

The `PrePushPermitGate.php` directory constant and `captainhook.json` template-filename constant update atomically with the move in Phase 4.

## Disposition of This File

Per Phase 6 / Phase 8 of the merger plan, this file moves from repo root to `/docs/` at Phase 8 as a historical decision artifact alongside `MERGER_PLAN.md`. The folder move does not change the contents; the lock stands.

---

*Filed by The Steward (acting on CEO direction) on 2026-05-19.*
