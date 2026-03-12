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

### The Rebrickable Import Station
- **Date:** 2026-03-11
- **Focus Area:** frontend
- **Status:** Ship It
- **Piece Count:** Medium
- **Summary:** Settings page for Rebrickable API token + one-click "Import My Collection" button that syncs owned sets via existing backend endpoints (`PUT /family/rebrickable-token`, `POST /family-sets/import-from-rebrickable`).
- **Key Concern:** No progress feedback mechanism for large imports — users with 500+ sets see a spinner with no indication of progress. ProfileResourceData doesn't expose `isHead` flag needed for the family-head-only import policy.

### The Part Locator Map
- **Date:** 2026-03-11
- **Focus Area:** fullstack
- **Status:** Prototype First
- **Piece Count:** Medium
- **Summary:** Cross-reference set parts against storage inventory — show "stored in: Drawer X" badges on set detail parts list, and "needed by: Set Y" on storage detail parts list.
- **Key Concern:** Requires a new backend join endpoint. Only useful after users have assigned parts to storage (depends on The Sorting Station). Overlaps with The Build Planner Set concept.

### The Sorting Station
- **Date:** 2026-03-11
- **Focus Area:** frontend
- **Status:** Ship It
- **Piece Count:** Medium
- **Summary:** UI for assigning parts to storage locations — from set detail page, click a part → pick storage location → assign with quantity. Uses existing `POST /storage-options/{id}/parts` endpoint.
- **Key Concern:** UX design is the hard part — part picker modal needs to feel natural. Users work with part_id/color_id internally but see names and images. Starting from set parts list avoids needing a free-text search endpoint.

### The Collection Dashboard
- **Date:** 2026-03-11
- **Focus Area:** fullstack
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Replace static home page with a logged-in dashboard showing collection stats (total sets, parts count, storage locations, sets by status). New `GET /family/stats` backend endpoint with `GetFamilyStatsAction`. Frontend conditionally renders dashboard for logged-in users, landing page for guests.
- **Shipped:** 2026-03-12 (PR #92 Brick, PR #56 Plate, PR #8 Baseplate)

### The Instruction Booklet (E2E Unskip)
- **Date:** 2026-03-11
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Unskipped and aligned `family-sets.spec.ts` E2E tests with current UI. Some tests remain skipped because their corresponding UI pages (edit, delete) aren't built yet.
- **Shipped:** 2026-03-12

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
- **Status:** Shipped
- **Piece Count:** Large
- **Summary:** Three new frontend domains (sets, storage, parts) consuming existing backend CRUD APIs. The core product UI that turns the headless API into a usable application.
- **Progress:**
  - Slice 1 — Sets domain: **Shipped** (PR #88 Brick, PR #41 Plate, PR #5 Baseplate). Backend enriched with nested `SetSummaryResourceData` in family-set responses. Plate has overview, add, detail, and edit pages with full test coverage. Profile type updated with `familyId`/`emailVerifiedAt`.
  - Slice 2 — Storage domain: **Shipped** (PR #50 Plate). Overview, add, detail, and edit pages consuming existing `storage-options` API. Full unit test coverage (39 tests). Nav integration (desktop + mobile) and EN/NL translations.
  - Slice 3 — Parts display: **Shipped** (PR #94 Brick, PR #51 Plate). Backend enriched `SetPart` and `StorageOptionPart` resources with nested Part and Color data. Plate displays parts inline within SetDetailView and StorageDetailView. Shared part types in `types/part.ts`.
- **Key Concern:** AdapterStore has never been used in production and may surface design issues — slice 1 used direct HTTP calls instead. Remaining slices (storage, parts) may benefit from revisiting this decision.
