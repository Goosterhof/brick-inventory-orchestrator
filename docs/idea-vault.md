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

### The Master Shopping List
- **Date:** 2026-04-16
- **Focus Area:** fullstack
- **Status:** Ship It
- **Piece Count:** Small-Medium
- **Summary:** Cross-set missing parts aggregator. New `GET /family-sets/missing-parts` backend endpoint returns shortfalls grouped by part+color (total needed, total stored, shortfall, list of family_set_ids needing each part). Frontend `/parts/missing` page renders the list with BrickLink wanted-list import and CSV export. Promotes the per-set Missing Brick Detector to a cross-collection view.
- **Key Concern:** Requires a new bulk endpoint — per-set storage-map fan-out would N+1. Follow the Set Completion Gauge pattern (parallel fetch, error-safe degradation). BrickLink wanted-list XML format needs a small helper.

### The Reverse Lookup Lens
- **Date:** 2026-04-16
- **Focus Area:** fullstack
- **Status:** Ship It
- **Piece Count:** Small
- **Summary:** Click a part row on the parts page → show the family sets that need this part+color, with build status and quantity needed per set. Answers "I found this brick on the floor, where does it belong?" Needs a lookup endpoint (`GET /family/parts/{partNum}/{colorId}/usage`) to avoid bulk-preloading all family-set parts.
- **Key Concern:** Real user frequency of this workflow is uncertain — may be 30-seconds-of-delight rather than everyday utility. But scope is small enough that it's worth shipping to find out.

### The Shelf Pressure Gauge
- **Date:** 2026-04-16
- **Focus Area:** frontend
- **Status:** Back to the Drawing Board
- **Piece Count:** Small-Medium
- **Summary:** Heat gradient on the storage tree showing which containers are densely packed vs lightly used. Relative density from summing `storage_option_parts.quantity` per container, no user-entered capacity needed.
- **Key Concern:** "Relative density" is lossy — a 50-piece drawer of large Technic panels looks "empty" vs a 500-piece drawer of 1x1 plates even when physically the Technic drawer is fuller. To be honest it needs piece-size-weighted volume (Rebrickable dimensions may or may not be available per part). A fullness signal that doesn't match reality erodes trust faster than not having one. Needs a sharper model before shipping.

### The Build Log
- **Date:** 2026-04-16
- **Focus Area:** fullstack
- **Status:** Prototype First
- **Piece Count:** Medium
- **Summary:** Capture `acquired_at`, `build_started_at`, `built_at` timestamps on FamilySet status transitions. Surface "built in X days" on set detail, "total hours built this year" on dashboard, and a chronological Build Log page. Migration + DTO + status-transition Action updates.
- **Key Concern:** Users rarely hit "start building" in real life — they typically mark sets "built" months after the fact, so the timestamps degrade to "when you marked it," which is noisy. Retroactive date entry would be needed. The data capture is cheap; the dashboard widget needs validation. Ship the capture without the widget first, then decide if the log page earns its place.

### The Set Completion Gauge
- **Date:** 2026-03-26
- **Focus Area:** fullstack
- **Status:** Shipped
- **Piece Count:** Medium
- **Summary:** Visual build completion percentage on each set card in the overview — surfacing "can I build this?" without clicking into detail. Needs a bulk backend endpoint (`GET /family-sets/completion`) returning per-set completion stats in one query, since fetching individual storage maps per set would be N+1.
- **Shipped:** Backend 2026-03-26 (commit 34c4877 — bulk `GET /family-sets/completion` endpoint). Frontend 2026-04-16 (PR #185 Plate — per-set completion gauge on sets overview with unknown/empty/partial/complete states, wishlist exclusion, error-safe degradation).

### The Quick-Scan Conveyor
- **Date:** 2026-03-26
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Keep the barcode scanner camera open after successfully adding a set. Scan → confirm → toast "Added!" → camera ready for the next box. Currently the scanner navigates away after each add, requiring a round-trip through the UI for each set in a haul.
- **Shipped:** 2026-03-27 (commit d13d1f0 — quick-scan conveyor flow with tests).

### The Duplicate Detector
- **Date:** 2026-03-26
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Warning when manually adding a set you already own. Check the local familySetStoreModule for matching setNum before submission and show "You already own this set (quantity: X, status: Y). Add another copy?" Pure frontend guard — no backend changes.
- **Shipped:** 2026-03-26 (commit 3057406 — duplicate set detection with warning on AddSetPage and ScanSetPage).

### The Sorting Assembly Line
- **Date:** 2026-03-26
- **Focus Area:** frontend
- **Status:** Back to the Drawing Board
- **Piece Count:** Medium
- **Summary:** Batch assign multiple parts to storage locations from the set detail page, including "assign all parts that already have a known location" in one click.
- **Key Concern:** Overlaps significantly with The Disassembly Guide (Muse Ledger #09, mutated). That idea was already scoped as a guided workflow after the "magic button" pitch was attacked. Promote the Disassembly Guide instead of creating a parallel concept.

### The Brick Catalog Blueprint
- **Date:** 2026-03-26
- **Focus Area:** frontend
- **Status:** Return to Shelf
- **Piece Count:** Medium
- **Summary:** Component documentation for all 32 shared components — props, slots, emits, and composition patterns. Three consecutive inspections have flagged the missing `brick-catalog.md` (dead link in domain-map, broken `lint:catalog` script). The Showcase app provides visual demos but not contract docs. For the portfolio, this is the product manual a technical reviewer would expect.
- **Key Concern:** Superseded 2026-03-27 by ADR-009 component health registry. The `brick-catalog.md` was previously deleted; all codebase references (domain-map link, lint:catalog script, `validate-brick-catalog.mjs`) were cleaned up in PR #133. Permit voided. The component registry JSON + Showcase app now serve this role.

### The Family Roster Display
- **Date:** 2026-03-16
- **Focus Area:** fullstack
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** "Family members" section on settings page listing name and email of each member with head badge. New `GET /family/members` endpoint returning user profiles. Prerequisite for invite and member management.
- **Shipped:** 2026-03-17 — New `GetFamilyMembersAction`, `FamilyMemberResourceData` with `is_head` flag, settings page members section with BadgeLabel (PR #110 Brick, PR #96 Plate).

### The Invite Code Brick
- **Date:** 2026-03-16
- **Focus Area:** fullstack
- **Status:** Shipped
- **Piece Count:** Medium
- **Summary:** Family head generates a short invite code (e.g., `BRICK-7X3K`) from settings. New users enter the code during registration to join that family instead of creating a new one. No email infrastructure needed.
- **Shipped:** Backend 2026-03-25 (`InviteCode` model, `GenerateInviteCodeAction`, `RevokeInviteCodeAction`, `GetActiveInviteCodeAction`, controller, policy, 25 tests). Frontend 2026-03-26 (commit 08d7f17 — invite code system for family member onboarding).

### The Member Removal Wrench
- **Date:** 2026-03-16
- **Focus Area:** fullstack
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Family head can remove a member, which creates a new empty family for the removed user (preserving their account). Remove button on settings page next to each non-head member.
- **Shipped:** Backend 2026-03-25 (`RemoveFamilyMemberAction` with exception handlers, 19 tests). Frontend 2026-03-27 (commit cfe1815 — member removal for family head on settings page).

### The Magic Link Drawbridge
- **Date:** 2026-03-16
- **Focus Area:** fullstack
- **Status:** Return to Shelf
- **Piece Count:** Large
- **Summary:** Shareable invite URL (`/join/abc123`) that auto-fills registration. Signed URLs with expiry.
- **Key Concern:** Marginal UX gain over invite codes for significant complexity. Invite codes work fine for household sharing via direct message.

### The Role Assignment Station
- **Date:** 2026-03-16
- **Focus Area:** fullstack
- **Status:** Return to Shelf
- **Piece Count:** Large
- **Summary:** Role-based access (Head/Member/Viewer) with role column on users and policy checks throughout.
- **Key Concern:** Over-engineering for a household app. Current head/member split is sufficient. No real use case for a "Viewer" role.

### The Quality Gate Reinforcement Pack
- **Date:** 2026-03-16
- **Focus Area:** devops
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Add `type-check`, `build`, and `size` (bundle budget) steps to the frontend CI job in `quality.yml`. Pre-push hooks catch these locally but CI is the safety net.
- **Shipped:** 2026-03-16 — Added `type-check`, `build`, and `size` steps to Plate Clutch Power job in `quality.yml`.

### The Missing Brick Detector
- **Date:** 2026-03-16
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Collapsible "Missing bricks" section on set detail page showing parts needed but not in storage, with quantities and BrickLink buy links. Computed client-side from existing storage map data — no backend changes.
- **Shipped:** 2026-03-16 — Collapsible missing parts list inside build check card with part details, quantity shortfall, and BrickLink links (PR #94 Plate).

### The Notification Bell Tower
- **Date:** 2026-03-16
- **Focus Area:** fullstack
- **Status:** Back to the Drawing Board
- **Piece Count:** Medium
- **Summary:** In-app notification feed for collection events (import results, build readiness, new parts). Bell icon + dropdown in nav.
- **Key Concern:** No viable triggers exist — price data isn't tracked, build check is already visible, and most events are user-initiated. Infrastructure without a use case.

### The Pagination Press
- **Date:** 2026-03-16
- **Focus Area:** fullstack
- **Status:** Return to Shelf
- **Piece Count:** Medium
- **Summary:** Server-side pagination on list endpoints to handle large collections (500+ sets). Requires backend cursor pagination + frontend infinite scroll or page controls.
- **Key Concern:** No users with large collections yet. Breaks client-side search/filter and CSV export patterns. Premature optimization.

### The Collection Showroom
- **Date:** 2026-03-16
- **Focus Area:** fullstack
- **Status:** Return to Shelf
- **Piece Count:** Large
- **Summary:** Public, shareable collection page at `/family/{slug}` — read-only view of sets, stats, and storage layout for showing off to other LEGO fans.
- **Key Concern:** Large surface area (slug migration, public routes, privacy controls, read-only pages) for a social feature in an inventory app. No community or discovery mechanism to drive value.

### The Quality Gate Drawbridge
- **Date:** 2026-03-16
- **Focus Area:** devops
- **Status:** Shipped
- **Piece Count:** Medium
- **Summary:** Add a CI workflow for backend unit tests, PHPStan, frontend unit tests, and ESLint on every PR. Currently only E2E runs in CI — broken unit tests and lint violations can slip into main undetected.
- **Shipped:** 2026-03-16 — `.github/workflows/quality.yml` with two parallel jobs: Brick Quality Control (backend tests + lint with Postgres service) and Plate Clutch Power (frontend tests + lint).

### The Preflight Checklist
- **Date:** 2026-03-16
- **Focus Area:** devops
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** `make doctor` target that validates local environment: Docker running, containers healthy, API responding, frontend serving, database connectable, submodules initialized, .env present, required vars set. Traffic-light diagnostic report.
- **Shipped:** 2026-03-16 — `scripts/doctor.sh` with 15 checks across 6 categories, `make doctor` Makefile target.

### The Modular Building Inspector
- **Date:** 2026-03-16
- **Focus Area:** testing
- **Status:** Shipped
- **Piece Count:** Medium
- **Summary:** Expand E2E coverage: unskip/realign family-sets tests, add storage CRUD specs, add feature specs for CSV export, search/filter, and build planner. Subsumes the existing "Instruction Booklet Update" idea.
- **Shipped:** 2026-03-16 — Unskipped and realigned `family-sets.spec.ts` (8 tests: CRUD + status buttons + search + filter + CSV export). New `storage.spec.ts` (7 tests: CRUD + search + tree structure). All selectors updated from Dutch to English to match default locale.

### The Submodule Sync Conveyor
- **Date:** 2026-03-16
- **Focus Area:** devops
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** `make submodule-check` to report local submodule drift. Future: scheduled GitHub Actions workflow to auto-PR submodule updates weekly.
- **Shipped:** 2026-03-16 — `scripts/submodule-check.sh` with per-submodule drift detection (behind/ahead/in-sync), missing commit list, and `make submodule-check` Makefile target.

### The Hot-Swap Development Kit
- **Date:** 2026-03-16
- **Focus Area:** devops
- **Status:** Return to Shelf
- **Piece Count:** Medium
- **Summary:** Alternative native (non-Docker) development mode with `docker-compose.dev.yml` running only Postgres and services running locally.
- **Key Concern:** Maintaining two dev modes doubles "works on my machine" surface area. Docker with live code mounting already provides good DX.

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
- **Status:** Shipped
- **Piece Count:** Medium
- **Summary:** Storage overview renders a tree: parents at root with children indented underneath (margin-left). Falls back to flat list when searching so results aren't hidden. Uses existing parentId/childIds data.
- **Shipped:** 2026-03-15 (PR #86 Plate)

### The Collection Export Crate
- **Date:** 2026-03-15
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Medium
- **Summary:** CSV export buttons on sets overview and parts page. Shared toCsv + downloadCsv utility generates files client-side from loaded data. Sets export includes all metadata; parts export includes storage locations. Exports respect active filters.
- **Shipped:** 2026-03-15 (PR #87 Plate)

### The Wishlist Wing
- **Date:** 2026-03-15
- **Focus Area:** fullstack
- **Status:** Shipped *(was: Prototype First)*
- **Piece Count:** Medium
- **Summary:** Track sets you want but don't own yet via a new "wishlist" FamilySet status or separate domain. Move to collection when acquired.
- **Shipped:** 2026-03-16 — Backend enum + frontend UI (PR #108/#91), then exclusions: stats exclude wishlist from totals, muted badge on overview, "Add to collection" button on detail, hidden build check + load parts (PR #109/#92).

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
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Unskip and realign family-sets E2E tests now that all UI pages (overview, add, detail, edit, scan) are shipped. Update selectors for *View → *Page renames and new features.
- **Shipped:** 2026-03-16 — Subsumed by The Modular Building Inspector. All family-sets tests unskipped and realigned.

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
- **Status:** Shipped *(was: Return to Shelf)*
- **Revisited:** 2026-03-15 — Scoped down from "AI suggestions" to "show where this part already lives." Uses existing storage map data passed from SetDetailPage — zero extra API calls.
- **Piece Count:** Small
- **Summary:** Yellow "Already stored in: Drawer A (8x)" hint in the AssignPartModal when the same part+color exists in storage. Helps users keep same parts together.
- **Shipped:** 2026-03-15 (PR #85 Plate)

### The Family Circle Set
- **Date:** 2026-03-03
- **Focus Area:** general
- **Status:** Back to the Drawing Board
- **Piece Count:** Medium
- **Summary:** Invitation system for family members — head generates invite link/code, others join existing family. Enables shared household inventory.
- **Key Concern:** Touches the auth flow (critical path), requires email sending (not available), and the current flat authorization model (family_id check only) would need role-based permissions — a significant architectural change.
- **Revisited:** 2026-03-16 — Decomposed into 3 scoped ideas: Family Roster Display, Invite Code Brick, Member Removal Wrench. No email or role system needed — invite codes + existing head/member model is sufficient.

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

### The Brick Census
- **Date:** 2026-03-25
- **Origin:** Muse's Ideas Ledger #01
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Search/filter/sort on the Parts page — the last major view without it. Search by name/number, color filter chips, sort by name/quantity/color, and orphan part detection (parts in storage not belonging to any owned set).
- **Shipped:** 2026-03-25 — TextInput search, FilterChip color/sort/orphan controls, empty state. 29 tests, 100% coverage.

### The Theme Atlas
- **Date:** 2026-03-25
- **Origin:** Muse's Ideas Ledger #03
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Group the sets overview by LEGO theme — collapsible sections with filter chips at the top. Data already exists in `Set.theme`, just never surfaced. Reveals collection identity.
- **Shipped:** 2026-03-25 — Collapsible theme sections with count badges, multi-select filter chips, new shared `CollapsibleSection` component. Composes with existing search and status filters. 32 tests, 100% coverage.

### The Decade Dial
- **Date:** 2026-03-25
- **Origin:** Muse's Ideas Ledger #04
- **Focus Area:** frontend
- **Status:** Shipped
- **Piece Count:** Small
- **Summary:** Release-year distribution visualization on the dashboard — horizontal bar chart from `Set.year`. Zero backend work, no chart library — pure CSS width percentages.
- **Shipped:** 2026-03-25 — `YearDistributionChart` component on dashboard between stats and quick links. Handles empty/single/wide-range years. Neo-brutalist styling. 14 tests, 100% coverage.

### The Brick DNA Lab
- **Date:** 2026-03-25
- **Origin:** Muse's Ideas Ledger #06
- **Focus Area:** fullstack
- **Status:** Shipped
- **Piece Count:** Medium
- **Summary:** Collection analytics dashboard computing "Brick DNA": top 10 most-owned colors, top 10 most-owned part types, rarest parts, and a collection diversity score (Shannon Diversity Index). All from existing storage data.
- **Shipped:** Backend 2026-03-25 (`GetBrickDnaAction`, `BrickDnaData` DTO, `BrickDnaResourceData`, `GET /family/brick-dna` endpoint, 9 tests). Frontend 2026-03-27 (commit 41c933f — Brick DNA analytics page with collection insights).
