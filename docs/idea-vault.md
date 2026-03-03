# Idea Vault

The Brick Apprentice's archive of all expansion ideas — proposed, evaluated, and tracked.

## Legend

| Status | Meaning |
|--------|---------|
| Ship It | Approved for implementation |
| Prototype First | Needs proof-of-concept |
| Back to the Drawing Board | Concept needs rethinking |
| Return to Shelf | Not pursuing now |
| Shipped | Implemented and merged |
| In Progress | Currently being built |

---

## Ideas

### The Smart Sorter Accessory Pack
- **Date:** 2026-03-03
- **Focus Area:** general
- **Status:** Return to Shelf
- **Piece Count:** Medium
- **Summary:** Sorting assistant that suggests which drawer to store each part in based on existing inventory patterns (same part, color, category).
- **Key Concern:** Three layers removed from current state — needs storage UI, actual user data, and observed sorting patterns before suggestions become useful. The "right" sorting logic depends on user behavior not yet observed.

### The Family Circle Set
- **Date:** 2026-03-03
- **Focus Area:** general
- **Status:** Back to the Drawing Board
- **Piece Count:** Medium
- **Summary:** Invitation system for family members — head generates invite link/code, others join existing family. Enables shared household inventory.
- **Key Concern:** Touches the auth flow (critical path), requires email sending (not available), and the current flat authorization model (family_id check only) would need role-based permissions — a significant architectural change.

### The Brick Scanner Experience
- **Date:** 2026-03-03
- **Focus Area:** general
- **Status:** Prototype First
- **Piece Count:** Small
- **Summary:** Wire existing CameraCapture component to the identify-brick API in a new scanner domain — point phone at brick, get identification, optionally assign to storage.
- **Key Concern:** Brickognize accuracy is unvalidated in real use. Current action returns only top prediction with no confidence threshold or "did you mean?" flow. Shipping a scanner that's wrong 30% of the time is worse than no scanner.

### The Build Planner Set
- **Date:** 2026-03-03
- **Focus Area:** general
- **Status:** Prototype First
- **Piece Count:** Medium
- **Summary:** "Can I build this set?" — cross-reference set parts against storage inventory to show what's available, what's missing, and where each part lives.
- **Key Concern:** Partially unblocked — sets domain shipped, but still needs storage domain (no storage data to cross-reference yet). Performance of multi-table join across large collections is unknown. "Reserved parts" concept (parts committed to in-progress builds) doesn't exist in schema.

### The Inventory Dashboard Expansion Pack
- **Date:** 2026-03-03
- **Focus Area:** general
- **Status:** In Progress
- **Piece Count:** Large
- **Summary:** Three new frontend domains (sets, storage, parts) consuming existing backend CRUD APIs. The core product UI that turns the headless API into a usable application.
- **Progress:**
  - Slice 1 — Sets domain: **Shipped** (PR #88 Brick, PR #41 Plate, PR #5 Baseplate). Backend enriched with nested `SetSummaryResourceData` in family-set responses. Plate has overview, add, detail, and edit pages with full test coverage. Profile type updated with `familyId`/`emailVerifiedAt`.
  - Slice 2 — Storage domain: Not started
  - Slice 3 — Parts domain: Not started
- **Key Concern:** AdapterStore has never been used in production and may surface design issues — slice 1 used direct HTTP calls instead. Remaining slices (storage, parts) may benefit from revisiting this decision.
