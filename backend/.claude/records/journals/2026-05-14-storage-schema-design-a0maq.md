# Shift Log: Cabinet → Section → Drawer Grid Schema

**Log #:** 2026-05-14-storage-schema-design-a0maq
**Filed:** 2026-05-14
**Shipping Order:** `.claude/records/permits/2026-05-14-storage-schema-design-a0maq.md`
**Sorter:** Head Sorter (body transcribed by Logistics Director — see Director Note below)

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Created | `database/migrations/2026_05_14_000001_add_grid_dimensions_to_storage_options_table.php` | Two nullable `unsignedSmallInteger` columns (`grid_rows`, `grid_columns`) added after the existing `column` column. |
| Modified | `app/Models/StorageOption.php` | Two `@property int\|null` PHPDoc rows. No casts, no `$fillable` (ADR-0005). `cascadeRelations()` already returns `['children', 'storageOptionParts']` — seeded drawers tear down for free. |
| Modified | `app/DataTransferObjects/Input/StorageOption/StorageOptionData.php` | Two nullable promoted constructor args (`?int $gridRows = null`, `?int $gridColumns = null`). |
| Modified | `app/Http/Requests/StorageOption/StorageOptionRequest.php` | Both-or-neither `required_with` rule on the new dims (range `[1, 100]`), parent-grid-bounds closures on `row`/`column`, `resolveParent()` helper to avoid re-querying inside multiple closures, plumbed through `toDto()`. |
| Modified | `app/Actions/StorageOption/CreateStorageOptionAction.php` | Assigns new dims on the parent inside the existing `connection->transaction()`. New private `seedDrawerGrid()` method loops `r ∈ 1..gridRows`, `c ∈ 1..gridColumns`, builds each child via `$this->storageOption->newInstance()` with `family_id`, `parent_id`, `name = "R{r}C{c}"`, `row`, `column`, and `null`/`null` for the new dims, then `save()`. Defensive guard: returns immediately if only one dim is set. |
| Modified | `app/Actions/StorageOption/UpdateStorageOptionAction.php` | Class PHPDoc note documenting that `grid_rows`/`grid_columns` are immutable post-creation. Body unchanged — DTO fields are silently not assigned. |
| Modified | `app/Http/Resources/StorageOptionResourceData.php` | Two new constructor params (`public ?int $grid_rows`, `public ?int $grid_columns`); `from()` populates them from the model. |
| Modified | `database/factories/StorageOptionFactory.php` | `grid_rows => null`, `grid_columns => null` defaults so existing tests stay untouched. |
| Modified | `tests/Unit/Actions/StorageOption/CreateStorageOptionActionTest.php` | Four new cases (6×5 = 30 children, 3×3 = 9 children, both-null no-seed, single-dim defensive no-seed × 2) and a shared `makeStorageOptionMock` helper. |
| Modified | `tests/Unit/Actions/StorageOption/UpdateStorageOptionActionTest.php` | One new case — DTO carrying `gridRows`/`gridColumns` leaves persisted dims untouched. |
| Modified | `tests/Unit/Resources/StorageOptionResourceDataTest.php` | Three existing cases extended with `grid_rows`/`grid_columns` mock returns; one new case proving `toArray()` exposes both. |
| Modified | `tests/Feature/Controllers/StorageOptionControllerTest.php` | Eleven new cases — 30-drawer 6×5 with `assertDatabaseHas` on R1C1 / R5C6 / R2C1; 9-drawer 3×3 with R3C3 corner; four partial-dim 422s; two zero/over-cap 422s; two parent-grid-bounds 422s; PATCH-ignores-dims; full 42-row cascade DELETE. |

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Migration adds `grid_rows`/`grid_columns` (nullable `unsignedSmallInteger`) | Yes | Placed after `column` per the brief. |
| `POST` with both dims pre-seeds the full grid in one transaction; rollback leaves zero residue | Yes | Seeding happens inside the existing `connection->transaction()` in `CreateStorageOptionAction`. |
| Seeded drawers carry the parent's `family_id`, right `parent_id`, correct `row`/`column`, name `R{r}C{c}` | Yes | Verified in unit + feature tests including corner-drawer assertions (R5C6 for 6×5, R3C3 for 3×3). |
| FormRequest rejects `grid_rows` without `grid_columns` (and inverse) with 422 | Yes | Four partial-dim feature tests. |
| FormRequest rejects `row`/`column` outside parent's grid range with 422 | Yes | Two parent-grid-bounds feature tests. |
| `UpdateStorageOptionAction` ignores `grid_rows`/`grid_columns` in the DTO | Yes | One unit test + one PATCH feature test. |
| `StorageOptionResourceData` exposes both new fields | Yes | One new `toArray()` test. |
| `DELETE` on cabinet cascades through both sections and all 39 drawers | Yes | Feature test asserts 1 + 2 + 39 = 42 rows gone. |
| `composer test:coverage` — `CreateStorageOptionAction` at 100% | Blocked | `php8.5-pcov` install gated on sudo per pulse — same Blocked posture as 2026-05-10. Will run on CI. |
| `composer test:feature-coverage` — controller ≥ 90% | Blocked | Same. |
| `composer mutation` — Actions ≥ 76%, loop bounds covered | Blocked | Same. Loop bounds pinned by corner-drawer assertions, but MSI not measured locally. |
| `composer phpstan` passes at level max | Yes | 336 files / 0 errors. |
| `composer deptrac` passes | Yes | 0 violations / 742 allowed. |
| `composer test:arch` passes | Yes | 105 / 1,851. |
| `composer test` passes end-to-end | Yes | 697 / 2,842 / 18.63s. |

## Decisions Made

1. **Extracted seeding into private `seedDrawerGrid()` method on `CreateStorageOptionAction`.** Inline loop would have made `execute()` read as a wall of brick-construction. Private method keeps the public surface honest (a single sorting procedure) and lets the unit tests target the loop bounds without ceremony. Method stays inside the Action — does not become a separate Action because it has no independent business meaning.

2. **`resolveParent()` helper on the FormRequest.** The new parent-grid-bounds check on `row` and `column` needs the parent record alongside the existing `parent_id` ownership closure. Inlining three Eloquent lookups would have hit the DB three times for one request. The helper memoises the parent inside the request lifetime.

3. **Shared `makeStorageOptionMock` helper across `CreateStorageOptionActionTest`.** Six of the eight cases construct nearly-identical Mockery doubles. First helper iteration registered `allows('save')` at the helper level — broke seven tests that pin `shouldReceive('save')->once()`. Removed the helper-level `allows('save')`; callers register `save` expectations themselves. Surfaced as Training Proposal 2.

4. **Fresh-checkout `.env` was missing on first `composer test`.** Test output came back as 697 "warnings" instead of "passed" because every framework boot hit `fopen(.env): No such file`. Copied `.env.example` to `.env` and ran `php artisan key:generate`; suite went green immediately. Surfaced as Training Proposal 3.

5. **Documented `--no-verify` exception:** None used. All four pre-commit hook runs ran clean; pre-push gauntlet matched the open permit and the full test suite ran green pre-push.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | Rector + Pint clean. |
| phpstan | Pass | Level max, 0 errors / 336 files. |
| deptrac | Pass | 0 violations / 742 allowed. |
| test:arch | Pass | 105 / 1,851. |
| test | Pass | 697 / 2,842 assertions / 18.63s. |
| test:coverage | Blocked | `php8.5-pcov` sudo-gated install — same as 2026-05-10. |
| test:feature-coverage | Blocked | Same. |
| mutation | Blocked | Same. |

## Showcase Readiness

The grid pattern is portfolio-grade. Two new nullable columns let a `StorageOption` node declare *its own internal grid*, distinct from `row`/`column` which position the node *inside its parent's grid* — a clean dimensional separation that a senior reviewer would recognise as careful schema design. Cascade tears down through the existing `children` relationship without a new connector. Immutability of grid dims after creation is a defensible scoping choice with a documented future path (resize Action with explicit orphan semantics). The seeding loop's bounds are pinned by corner-drawer assertions on both sample sizes, so off-by-one mutants would die when mutation testing eventually runs on CI.

## Proposed Knowledge Updates

- **Learnings:**
  - _Self-referential grid pattern with pre-seeded children._ When a parent node declares grid dimensions, the creating Action seeds every child slot in the same transaction. Pattern reusable for any hierarchical layout where the parent's shape determines the children's existence (e.g., shelves with slot counts).
- **Pulse:** None. The `.env` and `php8.5-pcov` sudo-gated items in Active Concerns are unchanged from 2026-05-05.
- **Decision Record:** None proposed. The grid-dim columns extend an existing pattern; no new architectural shape.

## Self-Debrief

### What Went Well

- The dimensional separation between `grid_rows`/`grid_columns` (own grid) and `row`/`column` (position in parent) clicked on first design — no second iteration needed.
- `cascadeRelations()` already covers `children`, so the 39-row cascade test came for free without touching the cascade chain.
- Conventional-commit grouping (migration → behaviour → presentation → tests) read cleanly.

### What Went Poorly

- The shared `makeStorageOptionMock` helper's first iteration registered `allows('save')`, conflicting with seven callers' `shouldReceive('save')->once()` — `InvalidCountException` only surfaced at verify-time. Three minutes of debugging.
- Adding `grid_rows`/`grid_columns` to `StorageOptionResourceData` broke three existing `StorageOptionResourceDataTest` cases that mocked `getAttribute('row')` / `getAttribute('column')` but did not yet mock the new fields. Same root cause — runtime-only signal that PHPStan cannot see.

### Blind Spots

- Did not check `tests/Architecture/DataTransferObjectPlacementTest.php` against the changed `StorageOptionData` shape — `test:arch` passed, but a manual scan would have caught a mismatch sooner if one existed.
- Did not verify cascade behaviour under concurrent deletes — the test asserts cascade on a single delete request; concurrent deletes are not in scope here, but the gap should be acknowledged.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| When adding a property to a Model, grep `getAttribute.*'<existing_field>'` mocks in `tests/` for that model before running the full suite — every such mock site must add a `getAttribute('new_field')` line, otherwise the test raises `NoMatchingExpectationException` only at runtime, escaping PHPStan. | `StorageOptionResourceDataTest` had three test cases mocking `row`/`column`/`parent_id` reads. Adding `grid_rows`/`grid_columns` to the ResourceData constructor broke all three at runtime; PHPStan saw nothing. | This log |
| When constructing a shared Mockery helper, do not register `allows()` for a method that any caller later pins with `shouldReceive(...)->once()` — the two declarations conflict and produce `InvalidCountException` at verify time, not at registration time. | `makeStorageOptionMock` first iteration registered `allows('save')`; seven tests using `shouldReceive('save')->once()` failed with `InvalidCountException`. Helper-level `allows('save')` had to be removed. | This log |
| Before running the first `composer test` on a fresh checkout, confirm `.env` exists and is keyed — copy `.env.example` and run `key:generate` immediately if missing. Every `fopen(...env)` warning in the test run is the same root cause. | Initial `composer test` reported 697 "warnings" instead of "passed" because every test that booted the framework hit `fopen(.env): No such file`; one-line fix surfaced 697 green tests. | This log |

---

## Logistics Director Evaluation

**Overall Assessment:** Solid

### Director Note on Transcription

The Sorter's `Write` to this journal path and `Edit` to flip the permit `Status` were both blocked by tool-permission refusals — same posture documented in the 2026-05-10 shift log's Director close-out. The Director (this evaluation's author) transcribed the body above from the Sorter's structured close-out report (commit chain, file list, gauntlet results, decisions, training proposals with verbatim context lines). No content was invented; gaps were left explicit rather than padded. The Director also performed the permit `Status` flip directly. Per the established protocol, the Sorter handled refusal correctly: noted, did not retry across alternative tool classes (Bash heredoc, etc.).

### Order Fulfillment Review

Every acceptance criterion that can be measured locally is met. The three `Blocked` rows (`test:coverage`, `test:feature-coverage`, `mutation`) carry the same sudo-gated `php8.5-pcov` blocker that has been on the pulse since 2026-05-05; CI will run them. Loop bounds are pinned by corner-drawer assertions on both grid sizes (R5C6 for the 6×5, R3C3 for the 3×3), so the most mutation-vulnerable line in the change is already covered structurally — Infection should clear 76% comfortably when it runs.

The dimensional separation between `grid_rows`/`grid_columns` (own internal grid) and `row`/`column` (position inside parent) is the line of design that lifts this from competent to portfolio-grade. It's the kind of schema decision a senior reviewer would notice and would want to ask about; the answer ("a section sits at a coordinate in its cabinet and has its own internal grid; the same column-set serves both roles") is clean.

### Decision Review

All five in-flight decisions are defensible without escalation. The `seedDrawerGrid()` extraction (Decision 1) and the `resolveParent()` helper (Decision 2) are local-scope refactors well inside the Sorter's authority. The shared Mockery helper bump (Decision 3) and the `.env` bootstrap (Decision 4) are pure ergonomics — the lessons are the training proposals, not the decisions themselves. No `--no-verify` use (Decision 5) is the expected baseline.

### Showcase Assessment

Strong addition to the portfolio. The change is small (~5 production files, ~150 lines), the design idea is non-obvious (dimensional separation), the cascade pattern requires zero new schema connectors, and the immutability scoping decision shows the kind of restraint that distinguishes a finished feature from an over-built one. The `R{r}C{c}` naming convention is user-facing and reads as the user would speak about it. The 1-indexed coordinate choice is the right call for this domain.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| Grep `getAttribute.*'<existing_field>'` mocks before adding a Model property | Candidate | First observation. Specific, checkable, addresses a real runtime-only failure mode that escapes PHPStan. Promote on second confirmation. |
| Don't register `allows()` in a shared Mockery helper for a method callers will pin with `shouldReceive(...)->once()` | Candidate | First observation. Specific, checkable, Mockery gotcha that surfaces only at verify-time. Promote on second confirmation. |
| Verify `.env` exists and is keyed before first `composer test` on a fresh checkout | Candidate | First observation. Specific signature (the "697 warnings instead of passed" pattern). The frequency of "fresh checkouts" for a sorter is low — graduation depends on whether the pattern recurs at all. Promote on second confirmation; drop if not seen again in the next four shifts. |

No graduation this round — all three proposals are first observations.

### Notes for the Sorter

Strong shift. The grid pattern's dimensional separation is exactly the kind of design choice that strengthens the showcase. Three training proposals from one shift is on the high end — be selective about what you propose in future shifts so the candidate list stays signal-rich. Continued correct handling of permission-refused close-out steps per the 2026-04-16 graduated training: noted in the report, did not improvise across tool classes, handed the close-out content to the Director cleanly.
