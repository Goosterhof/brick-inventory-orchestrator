# Shipping Order: Promote `theme` from opaque ID to first-class catalog model

**Order #:** 2026-05-09-implement-set-themes-zsyta
**Filed:** 2026-05-09
**Issued By:** CEO
**Assigned To:** Logistics Director (executing)
**Priority:** Standard

---

## The Shipment

`sets.theme` currently stores the Rebrickable theme id as a `?string` — an opaque
number with no name, no parent, no relationship. Promote it to a real `themes`
catalog (sourced from Rebrickable's `/api/v3/lego/themes/` endpoint) with a
self-referencing `parent_id`, replace `sets.theme` with a real FK, expose theme
name and parent on Set resources, and sync the catalog via a scheduled Artisan
command.

## Scope

### In the Crate

**Schema & Models**
- `themes` migration: `id`, `rebrickable_id` (unique int), `name`, `parent_id`
  (self-FK to `themes.id`, nullable, `nullOnDelete`), timestamps
- `Theme` model with `parent()` BelongsTo, `children()` HasMany, `sets()` HasMany,
  `cascadeRelations()` returning `['sets']` (or empty — see decision in shift log)
- `sets` migration: drop `theme` string column, add `theme_id` (nullable FK to
  `themes`, `nullOnDelete`)
- `Set` model: drop `$theme` PHPDoc property, add `$theme_id` and `$theme`
  (relation), add `theme()` BelongsTo

**Receiving Dock (Rebrickable supply line)**
- New `LegoThemeData` Input DTO (`id: int`, `name: string`, `parentId: ?int`)
- `LegoDataServiceInterface::fetchThemes(): Generator<int, list<LegoThemeData>>`
  — yields one page at a time, mirroring `fetchUserSets` shape
- `RebrickableService::fetchThemes()` implementation with pagination,
  cache (`rebrickable:themes:page:N`), and structural validation

**Sorting Procedures (Actions)**
- `App\Actions\Sync\UpsertThemeAction` — mirrors `UpsertColorAction`; accepts
  `LegoThemeData`, upserts on `rebrickable_id`. Parent FK NOT set in this pass.
- `App\Actions\Sync\SyncThemesAction` — orchestrator: pulls all pages from
  service, calls `UpsertThemeAction` for each row, then runs a second pass to
  resolve `parent_id` (lookup parent by `rebrickable_id`, persist FK). Returns
  a small Result DTO with counts (`fetched`, `upserted`, `parentsLinked`).
- `App\DataTransferObjects\Result\Sync\ThemeSyncResult` — the receipt
- `UpsertSetAction` updated: when `LegoSetData->themeId` is non-null, look up
  `themes.id` by `rebrickable_id` and assign `theme_id` FK; null otherwise.
  Unknown theme ids → `theme_id = null` (do NOT auto-create — that's the sync
  command's job; logging the orphan is acceptable but not required for v1).

**Console / Scheduling**
- `App\Console\Commands\SyncThemesCommand` (`themes:sync`) — invokes
  `SyncThemesAction`, prints the Result DTO counts
- New deptrac layer `Console` allowed to depend on `Action`, `ResultDTO`
- New `tests/Architecture/ConsoleArchitectureTest.php` enforcing:
  command classes are `final`, extend `Illuminate\Console\Command`, no
  `Request`, no facades except `Schedule` (registered in `routes/console.php`),
  no business logic in `handle()` beyond delegation
- Schedule registration in `routes/console.php`:
  `Schedule::command('themes:sync')->weekly()->onOneServer()`

**Output Shaping**
- `App\Http\Resources\ThemeResourceData` — `id: int`, `name: string`,
  `parentId: ?int`, with `from(Theme $theme)` factory
- `SetSummaryResourceData`: drop `?string $theme`, add `?ThemeResourceData
  $theme`, declare `EAGER_LOAD = ['theme']`
- `SetWithPartsResourceData`: same change

**Tests**
- Factory: `ThemeFactory` (rebrickable_id sequence, `name`, `parent_id` null)
- Update `SetFactory`: drop `theme` literal, add nullable `theme_id` (no auto
  factory creation by default — keep tests fast)
- Unit tests:
  - `UpsertThemeActionTest` — create + update paths, unique-violation race
    fallback (mirror `UpsertColorActionTest`)
  - `SyncThemesActionTest` — single page, multi-page, parent linking
    (parent before child, parent after child, missing parent left null)
  - `SyncThemesCommandTest` (Feature/Console) — runs command, asserts counts
- Service tests:
  - `RebrickableServiceTest` — add `fetchThemes` happy path + pagination + 502
  - `RebrickableContractTest` — extend contract conformance to cover
    `fetchThemes`
- Architecture: `ConsoleArchitectureTest` (new), `MigrationArchitectureTest`
  expectations updated if needed
- Update existing tests that asserted on `theme` string → expect nested
  `theme.id/name/parentId` (or `theme: null`):
  - `SetSummaryResourceDataTest`
  - `SetWithPartsResourceDataTest`
  - `FamilySetResourceDataTest` (if it surfaces theme)
  - `SetControllerTest`, `FamilySetControllerTest`,
    `ResponseCachingTest` (if theme appears in fixtures)

**Seeders**
- `SetSeeder` — drop literal theme strings; backfill via factory states or
  leave `theme_id` null
- Optional: `ThemeSeeder` — small fixture set so `db:seed` produces something
  useful for local. Hard-code 5–10 well-known themes; mark explicitly that
  production runs `themes:sync` instead.

### Not on This Pallet

- HTTP endpoint to list/tree themes (decided: Artisan-only sync, no list API
  surface for v1; frontend reads themes via the embedded `theme` block on
  set resources)
- Theme-based filtering / search on sets (no `?theme=` param)
- Backfilling existing `sets.theme` string values into FKs — single migration
  drops the column; data resyncs on next set sync (theme strings were never
  user-editable, only catalog data from Rebrickable)
- Auto-creating Theme rows when an unknown `theme_id` is seen during set
  upsert — `theme_id` stays null; the next `themes:sync` repopulates the
  catalog
- Production cron / `schedule:work` worker provisioning — flagged in the
  shift log for the CEO's deployment side
- Brickognize integration (themes are Rebrickable-only)
- ADR (this follows the existing Color catalog pattern; no new architectural
  decision is being introduced)

## Acceptance Criteria

- [ ] `php artisan migrate:fresh` produces a `themes` table and a `sets`
      table with `theme_id` FK and no `theme` string column
- [ ] `Set::theme` returns a `BelongsTo<Theme>` relation; `Theme::parent` and
      `Theme::children` work correctly for a 2-level tree
- [ ] `LegoDataServiceInterface::fetchThemes()` yields paged
      `list<LegoThemeData>` and is implemented in `RebrickableService` with
      `Http::fake()` test coverage including a 502 path
- [ ] `php artisan themes:sync` (with `Http::fake()` in test, real call in
      manual smoke) populates the `themes` table and resolves `parent_id`
      for parent themes that appear after their children
- [ ] `UpsertSetAction` assigns `theme_id` when the rebrickable theme exists
      locally, null when it does not — proven by unit tests
- [ ] `GET /api/sets/{setNum}` returns `theme: { id, name, parentId }` (or
      `theme: null`) — proven by feature test
- [ ] `composer test` green
- [ ] `composer phpstan` green at level max
- [ ] `composer deptrac` green (Console layer added; no boundary violations)
- [ ] `composer test:arch` green (ConsoleArchitectureTest enforces command
      hygiene)
- [ ] `composer mutation` ≥ 76% on `UpsertThemeAction` and `SyncThemesAction`
      (matches the warehouse standard for Actions)

## References

- Feature Brief: CEO directive 2026-05-09 — "set themes is just a number right
  now, let's promote it"
- Decision: ADR-0003 (Actions for business logic, Services for HTTP),
  ADR-0005 (Model conventions: no mass assignment), ADR-0013 (Pre-push permit
  gate)
- Pattern Precedent: `colors` table + `UpsertColorAction` is the catalog
  template this order mirrors
- Related Order: none (greenfield catalog)

## Notes from the Issuer

**Three CEO calls captured up front:**
1. Sync via scheduled Artisan command — no HTTP endpoint
2. Single migration drops the old `sets.theme` string column (no two-phase
   backfill)
3. No HTTP authorization to consider — sync is operator-only

**Engineering notes for the executor:**
- The two-pass parent resolution in `SyncThemesAction` is the only mildly
  tricky bit. Document the rationale in the shift log: Rebrickable returns
  themes in id order, so a child *can* arrive before its parent if the parent
  was added later. A second pass over the same in-memory mapping is O(N) and
  cheap on ~600 rows.
- `UpsertSetAction` previously cast `themeId` to a string. Replace that with
  a `Theme::query()->where('rebrickable_id', $themeId)->value('id')` lookup
  (returns null cleanly if absent). Don't auto-create — that's a separate
  responsibility owned by `themes:sync`.
- `Theme::cascadeRelations()` — leaning toward `[]` (themes are catalog data;
  deleting a theme should not cascade-delete sets). The migration already
  uses `nullOnDelete` for `sets.theme_id`. Confirm this in the shift log.
- Console layer in deptrac is new — verify other future commands won't be
  starved by overly tight rules. Allowed deps: `Action`, `ResultDTO`. That's
  the bare minimum to delegate work and report a receipt.
- Production scheduling: a `schedule:run` cron (or `php artisan schedule:work`
  long-running process) is required for the weekly sync to actually fire.
  Flag this in the shift log under "operational follow-up" — it parallels the
  queue worker provisioning note already in CLAUDE.md.

**Permit slug discipline:** filename is `2026-05-09-implement-set-themes-zsyta.md`
to match the branch `claude/implement-set-themes-zSyTa` (slug-after-last-slash,
lowercased). PrePushPermitGate enforces this on push.

---

**Status:** Completed
**Shift Log:** [`.claude/records/journals/2026-05-09-implement-set-themes-zsyta.md`](../journals/2026-05-09-implement-set-themes-zsyta.md)
**Merged:** PR #179 → `main` at `feed543`
