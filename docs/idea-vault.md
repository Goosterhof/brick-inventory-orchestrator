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

### The Dashboard Command Center
- **Date:** 2026-03-15
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Expanded dashboard quick-actions from 2 links to a 6-card responsive grid: My Sets, Storage, Parts, Scan Set, Identify Brick, Import Collection. Makes all features discoverable from the landing page.
- **Shipped:** 2026-03-15 (PR #84 Plate)

### The Storage Tree Display
- **Date:** 2026-03-15
- **Focus Area:** frontend
- **Status:** Ship It
- **Piece Count:** Medium
- **Summary:** Render storage options as a nested tree on the overview page, showing children indented under their parents instead of a flat list. Uses existing parentId/childIds data.
- **Key Concern:** Grouping logic + mobile responsiveness. Need to decide rendering approach (indentation vs. collapsible groups).

### The Collection Export Crate
- **Date:** 2026-03-15
- **Focus Area:** frontend
- **Status:** Ship It
- **Piece Count:** Medium
- **Summary:** Export sets or parts as CSV from the overview pages. Client-side generation from already-loaded data — no backend needed. Useful for sharing, insurance, or backup.
- **Key Concern:** CSV is simple for flat data but nested fields (set name inside family set) need flattening. No library needed.

### The Wishlist Wing
- **Date:** 2026-03-15
- **Focus Area:** fullstack
- **Status:** Prototype First
- **Piece Count:** Medium
- **Summary:** Track sets you want but don't own yet via a new "wishlist" FamilySet status or separate domain. Move to collection when acquired.
- **Key Concern:** Adding a status to the enum changes FamilySet semantics. Dashboard stats, overview filters, and build check all need to exclude wishlisted sets. Moderate blast radius.

### The Search & Sort Accessory Pack
- **Date:** 2026-03-15
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Medium
- **Summary:** Client-side search and filter on sets overview (search by name/set number, filter by status with toggle buttons) and storage overview (search by name/description). Shows "No results" empty state when filters match nothing.
- **Shipped:** 2026-03-15 (PR #81 Plate)

### The Parts Warehouse Inventory
- **Date:** 2026-03-15
- **Focus Area:** fullstack
- **Status:** Shipped
- **Piece Count:** Medium
- **Summary:** New "Parts" domain showing all stored parts across all storage locations, grouped by part+color with total quantity and per-location badges. New `GET /family/parts` backend endpoint joins storage_option_parts with parts, colors, and storage_options scoped to the family. Frontend groups client-side and shows in navigation.
- **Shipped:** 2026-03-15 (PR #107 Brick, PR #79 Plate)

### The Quick-Build Status Dial
- **Date:** 2026-03-15
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Clickable status buttons (Sealed, In Progress, Built, Incomplete) on the set detail page replacing static text. Current status highlighted in yellow, clicking another calls PATCH to update instantly. No edit form navigation needed.
- **Shipped:** 2026-03-15 (PR #80 Plate)

### The Instruction Booklet Update (E2E Realignment)
- **Date:** 2026-03-15
- **Focus Area:** testing
- **Status:** Ship It
- **Piece Count:** Small
- **Summary:** Unskip and realign family-sets E2E tests now that all UI pages (overview, add, detail, edit, scan) are shipped. Update selectors for *View → *Page renames and new features.
- **Key Concern:** Need to verify E2E selectors match the current UI after extensive page changes since tests were written.

### The Rebrickable Import Station
- **Date:** 2026-03-11
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Medium
- **Summary:** Settings page for Rebrickable API token + one-click "Import My Collection" button that syncs owned sets via existing backend endpoints (`PUT /family/rebrickable-token`, `POST /family-sets/import-from-rebrickable`). Handles 403 (not family head) and 422 (no token) errors gracefully. Shows import results summary with created/updated/skipped counts.
- **Shipped:** 2026-03-15 (PR #72 Plate)

### The Part Locator Map
- **Date:** 2026-03-11
- **Focus Area:** fullstack
- **Status:** Shipped
- **Piece Count:** Medium
- **Summary:** Cross-reference set parts against storage inventory — yellow "Drawer X (5x)" badges on the set detail parts list show where each part is stored. New `GET /sets/{setNum}/storage-map` backend endpoint joins storage_option_parts with storage_options scoped to the user's family. Frontend fetches the map after loading parts and renders badges via a new default slot on PartListItem.
- **Shipped:** 2026-03-15 (PR #106 Brick, PR #75 Plate)

### The Sorting Station
- **Date:** 2026-03-11
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Medium
- **Summary:** UI for assigning parts to storage locations — click any part on the set detail page to open an assignment modal with storage location dropdown and quantity input. Uses existing `POST /storage-options/{id}/parts` endpoint (upsert).
- **Shipped:** 2026-03-15 (PR #73 Plate)

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
- **Focus Area:** frontend
- **Status:** Ship It *(was: Return to Shelf)*
- **Revisited:** 2026-03-15 — Sorting Station is shipped, users actively assign parts. Scoped down from "AI suggestions" to "show where this part already lives" as a hint in the AssignPartModal.
- **Piece Count:** Small
- **Summary:** When assigning a part to storage, show a hint if the same part+color is already stored somewhere (e.g., "Already in Drawer A (3x)"). Uses existing storage map data. Simple, practical, no ML.
- **Key Concern:** Needs one extra API call or client-side lookup in the modal to find existing assignments for the selected part.

### The Family Circle Set
- **Date:** 2026-03-03
- **Focus Area:** general
- **Status:** Back to the Drawing Board
- **Piece Count:** Medium
- **Summary:** Invitation system for family members — head generates invite link/code, others join existing family. Enables shared household inventory.
- **Key Concern:** Touches the auth flow (critical path), requires email sending (not available), and the current flat authorization model (family_id check only) would need role-based permissions — a significant architectural change.

### The Set Barcode Scanner
- **Date:** 2026-03-15
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Scan a LEGO box EAN barcode with the phone camera to look up the set via Rebrickable, then add it to the collection with one click. Uses the shared BarcodeScanner component and the existing `GET /sets/ean/{ean}` + `POST /family-sets` endpoints.
- **Shipped:** 2026-03-15 (PR #71 Plate)

### The Brick Scanner Experience
- **Date:** 2026-03-03
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** New `/sets/identify` page using CameraCapture to photograph a LEGO brick, sends to `POST /identify-brick` (Brickognize API), and displays the identified part with name, number, and image. Includes loading state, error handling, and "Try again" button.
- **Shipped:** 2026-03-15 (PR #82 Plate)

### The Build Planner Set
- **Date:** 2026-03-03
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Medium
- **Summary:** "Can I build this set?" — Build Check summary card on the set detail page compares each part's needed quantity against stored quantity. Green/red status, unique parts and total pieces coverage stats, plus per-part availability badges. Uses existing storage map data from Part Locator Map.
- **Shipped:** 2026-03-15 (PR #76 Plate)

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
