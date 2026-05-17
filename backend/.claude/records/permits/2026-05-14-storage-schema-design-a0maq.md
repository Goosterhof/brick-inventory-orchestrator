# Shipping Order: Cabinet → Section → Drawer Grid Schema

**Order #:** 2026-05-14-storage-schema-design-a0maq
**Filed:** 2026-05-14
**Issued By:** CEO
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

The CEO owns a piece of furniture with two drawer grids (one 6×5, one 3×3) and wants to register it as a single coherent physical unit, not two unrelated top-level `StorageOption` trees. Extend the existing `parent_id` hierarchy with two new columns — `grid_rows` and `grid_columns` — so a *section* can declare its grid dimensions and the `CreateStorageOptionAction` pre-seeds every drawer slot in the same transaction. Parts continue to attach to the leaf drawer nodes via the unchanged `storage_option_parts` pivot. Cascade deletion via the existing `cascadeRelations()` chain tears the whole subtree down when the cabinet is deleted.

## Scope

### In the Crate

1. **Migration** — `2026_05_14_000001_add_grid_dimensions_to_storage_options_table.php` adds two nullable `unsignedSmallInteger` columns to `storage_options`:
   - `grid_rows` (the node's own internal row count — distinct from `row`, which positions the node inside its parent's grid)
   - `grid_columns` (same semantics, for columns)
   - Placed after the existing `column` column for readability.
2. **`StorageOption` model** — `@property int|null $grid_rows` and `@property int|null $grid_columns` PHPDoc additions. No `$fillable`, no cast (ADR-0005). `cascadeRelations()` already covers `children` and `storageOptionParts`, so seeded drawers tear down for free.
3. **Input DTO** — append `?int $gridRows = null` and `?int $gridColumns = null` constructor-promoted properties on `App\DataTransferObjects\Input\StorageOption\StorageOptionData`.
4. **FormRequest rules** — `App\Http\Requests\StorageOption\StorageOptionRequest`:
   - `grid_rows`: `['nullable','integer','min:1','max:100','required_with:grid_columns']`
   - `grid_columns`: `['nullable','integer','min:1','max:100','required_with:grid_rows']`
   - Extend the existing `parent_id` closure (or add a sibling rule) so that when the parent has grid dimensions set, the child's `row` ∈ `[1, parent.grid_rows]` and `column` ∈ `[1, parent.grid_columns]`.
   - Pass new fields through `toDto()`.
5. **`CreateStorageOptionAction`** — inside the existing `$this->connection->transaction(...)`:
   - Assign `grid_rows` / `grid_columns` on the parent node before `save()`.
   - If both dims are non-null, loop `r ∈ 1..gridRows`, `c ∈ 1..gridColumns`, build each child via `$this->storageOption->newInstance()` with `family_id`, `parent_id`, `name = "R{$r}C{$c}"`, `row = $r`, `column = $c`, `grid_rows = null`, `grid_columns = null`, then `save()` (preserves model events + timestamps; honors ADR-0005's explicit-assignment rule).
   - Defensive guard: if only one dim is set (despite the FormRequest blocking it), seed nothing rather than half-seeding.
6. **`UpdateStorageOptionAction`** — explicitly does **not** assign `grid_rows` / `grid_columns` from the DTO. Shrinking a grid would orphan drawers and their attached parts; resizing is a future operation that deserves its own permit. Drop a short PHPDoc note on the Action so the constraint is visible at the call site.
7. **`StorageOptionResourceData`** — add `public ?int $grid_rows` and `public ?int $grid_columns` to the constructor; populate from the model in `from()`.
8. **Factory** — `database/factories/StorageOptionFactory.php` gets `grid_rows => null, grid_columns => null` defaults so existing tests stay untouched.
9. **Tests:**
   - **Unit — `CreateStorageOptionActionTest`** (must keep the 100% Action coverage):
     - 6×5 seeds 30 drawers with correct `parent_id`, `family_id`, `row`, `column`, `name = "R{r}C{c}"`
     - 3×3 seeds 9 drawers
     - both dims null → seeds nothing
     - only one dim set → seeds nothing (defensive)
   - **Unit — `UpdateStorageOptionActionTest`** — DTO carrying `gridRows` / `gridColumns` leaves persisted dims unchanged.
   - **Feature — `StorageOptionControllerTest`** (90% target):
     - `POST` with `grid_rows: 5, grid_columns: 6, parent_id: cabinet.id` returns 201; DB has 30 child rows with correct coordinates and inherited `family_id`
     - `POST` with 3×3 returns 9 children
     - `POST` with `grid_rows` but no `grid_columns` → 422 (and inverse)
     - `POST` of a drawer with `row=6` under a 5-row parent → 422
     - `POST` with `grid_rows=0` or `grid_rows=101` → 422
     - `PATCH` an existing section with new `grid_rows` → 200, but persisted dims unchanged
   - Mutation drill (`composer mutation`) — watch off-by-one mutants on the `<= gridRows` / `<= gridColumns` loop bounds.
10. **Manual smoke** (Octane local, authenticated session, inside a family) — verify the end-to-end CEO flow:
    - `POST /api/storage-options` `{"name":"CEO Cabinet"}` → capture cabinet id
    - `POST /api/storage-options` `{"name":"6×5 Section","parent_id":<cab>,"grid_rows":5,"grid_columns":6}` → 30 children
    - `POST /api/storage-options` `{"name":"3×3 Section","parent_id":<cab>,"grid_rows":3,"grid_columns":3}` → 9 children
    - `GET /api/storage-options/<cab>` → 2 children, each carrying its `grid_rows`/`grid_columns`
    - `DELETE /api/storage-options/<cab>` → all 1 + 2 + 39 = 42 rows gone

### Not on This Pallet

- **Resizing a section after creation.** Grid dims are immutable post-create. Orphan/preservation semantics on resize are a separate problem that deserves its own permit.
- **Uniqueness constraint on `(parent_id, row, column)`.** Seeding cannot produce collisions; the FormRequest range check bounds manual creation. Adding a partial unique index is Postgres-specific and not worth the portability cost today. File a follow-up if duplicate coordinates become a real issue.
- **Sparse / non-rectangular grids.** Every section is a full m × n grid.
- **Drawer renaming UX.** Seeded names are `R{r}C{c}`; existing `PUT /api/storage-options/{id}` handles renames.
- **A dedicated "Cabinet" / "Section" / "Drawer" type column.** The hierarchy + grid dims already encode the role; adding an enum is premature without a second consumer.
- **Bulk insert in place of `save()` per row.** 6×5 + 3×3 = 39 rows is trivial; the 100-cap × 100-cap upper bound is 10 000 inserts in the absolute worst case, which is still tolerable. `save()` keeps model events and ADR-0005 explicit assignment honest.

## Acceptance Criteria

- [ ] Migration adds `grid_rows` and `grid_columns` (nullable `unsignedSmallInteger`) to `storage_options`
- [ ] A `POST` that includes both grid dims pre-seeds the full grid of drawer children in one transaction; rollback on any failure leaves zero residue
- [ ] Pre-seeded drawers carry the parent's `family_id`, the right `parent_id`, correct `row`/`column`, and `name = "R{r}C{c}"`
- [ ] FormRequest rejects `grid_rows` without `grid_columns` (and inverse) with 422
- [ ] FormRequest rejects `row`/`column` outside the parent's grid range with 422
- [ ] `UpdateStorageOptionAction` ignores `grid_rows`/`grid_columns` in the DTO — persisted dims are immutable after creation
- [ ] `StorageOptionResourceData` exposes `grid_rows` and `grid_columns` on responses
- [ ] `DELETE` on the cabinet cascades cleanly through both sections and all 39 drawers
- [ ] `composer test:coverage` — `CreateStorageOptionAction` stays at 100%
- [ ] `composer test:feature-coverage` — controller stays ≥ 90%
- [ ] `composer mutation` — Actions stay ≥ 76% (loop bounds covered)
- [ ] `composer phpstan` passes at level max
- [ ] `composer deptrac` passes — no new boundary violations
- [ ] `composer test:arch` passes — DTO placement and existing regulations hold
- [ ] `composer test` passes end-to-end

## References

- ADR-0003 — Actions own business logic; transactions via injected `ConnectionInterface`
- ADR-0004 — Explicit cascade via `cascadeRelations()` (`children` already covers seeded drawers)
- ADR-0005 — No mass assignment; explicit property assignment per row
- ADR-0006 — `DTOFormRequest` bridges HTTP input to Actions via Input DTOs
- ADR-0008 — Explicit route declarations (no `apiResource`)
- ADR-0010 — Input/Result DTO namespace split
- Plan: `/root/.claude/plans/for-the-storage-i-scalable-giraffe.md` (Logistics Director's pre-permit design pass)
- Existing entry points:
  - `app/Actions/StorageOption/CreateStorageOptionAction.php`
  - `app/Actions/StorageOption/UpdateStorageOptionAction.php`
  - `app/Http/Requests/StorageOption/StorageOptionRequest.php`
  - `app/DataTransferObjects/Input/StorageOption/StorageOptionData.php`
  - `app/Http/Resources/StorageOptionResourceData.php`
  - `app/Models/StorageOption.php`

## Notes from the Issuer

The two new columns describe **the node's own internal grid** — they are not the node's position in its parent. A section that sits at `row=2, column=1` inside a cabinet and has its own 5×6 internal grid will carry all four fields. That separation is what makes the same column-set work for cabinet, section, and (in theory) deeper nestings without a type discriminator.

**Coordinate convention is 1-indexed.** Reads naturally in drawer labels ("R1C1" through "R5C6"), matches the CEO's mental model ("6 columns, 5 rows"), and aligns with the existing factory defaults. Validation bounds are `[1, grid_rows]` / `[1, grid_columns]`.

`grid_rows` and `grid_columns` are immutable after the section is created. The Update Action must silently ignore them in the DTO — do not error, do not assign. A future "resize section" Action will need orphan-handling semantics (truncate? archive? refuse if non-empty?) and that conversation is out of scope here.

The seeding loop is the riskiest line of code in this ticket — off-by-one bugs will mutate cleanly through the Infection drill if the tests don't pin both ends of the range. Make sure at least one test asserts the corner drawer (`R<gridRows>C<gridColumns>`) exists.

This branch (`claude/storage-schema-design-A0MAq`) is well under the pre-push gate threshold (~5–7 files, ~150 lines). The permit slug matches the branch slug, so a clean close-out push will pass the gate without `--no-verify`.

---

**Status:** Completed
**Shift Log:** [.claude/records/journals/2026-05-14-storage-schema-design-a0maq.md](../journals/2026-05-14-storage-schema-design-a0maq.md)
