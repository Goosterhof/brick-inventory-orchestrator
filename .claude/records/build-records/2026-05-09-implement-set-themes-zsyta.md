# Shift Log: Promote `theme` from opaque ID to first-class catalog model

**Log #:** 2026-05-09-implement-set-themes-zsyta
**Filed:** 2026-05-09
**Shipping Order:** [`.claude/records/permits/2026-05-09-implement-set-themes-zsyta.md`](../permits/2026-05-09-implement-set-themes-zsyta.md)
**Sorter:** Head Sorter

---

## Work Summary

19 files created, 18 modified. The `theme` opaque-string column on `sets` is gone; in its place is a real `themes` catalog with self-referencing parent FK, populated by a scheduled `themes:sync` Artisan command.

| Action | File | Notes |
|---|---|---|
| Created | `database/migrations/2026_05_09_000001_create_themes_table.php` | `id`, `rebrickable_id` (unique), `name`, `parent_id` self-FK with `nullOnDelete` |
| Created | `database/migrations/2026_05_09_000002_replace_sets_theme_string_with_theme_id_fk.php` | Drops `sets.theme` string and adds `sets.theme_id` FK in one shift |
| Created | `app/Models/Theme.php` | `parent()` BelongsTo, `children()` HasMany, `sets()` HasMany, `cascadeRelations()` |
| Created | `app/DataTransferObjects/Input/Lego/LegoThemeData.php` | Supplier-shape DTO for Rebrickable theme rows |
| Created | `app/DataTransferObjects/Result/Sync/ThemeSyncResultData.php` | `fetched`, `upserted`, `parentsLinked` counts (renamed from `ThemeSyncResult` per `DtoArchitectureTest` `Data` suffix rule) |
| Created | `app/Actions/Sync/UpsertThemeAction.php` | Mirrors `UpsertColorAction` exactly, including unique-violation race fallback |
| Created | `app/Actions/Sync/SyncThemesAction.php` | Two-pass orchestrator: first pass upserts, second pass resolves parent FKs |
| Created | `app/Console/Commands/SyncThemesCommand.php` | `themes:sync` — final, no facades, no try-catch, prints Result DTO counts |
| Created | `app/Http/Resources/ThemeResourceData.php` | `id`, `name`, `parentId` flat shape |
| Created | `database/factories/ThemeFactory.php` | Sequenced `rebrickable_id`, null `parent_id` by default |
| Created | `tests/Architecture/ConsoleArchitectureTest.php` | Final, no `Request`, no facades, no try-catch, must declare own `handle()` |
| Created | `tests/Unit/Actions/Sync/UpsertThemeActionTest.php` | Create + update + race-fallback paths |
| Created | `tests/Unit/Actions/Sync/SyncThemesActionTest.php` | Single page, multi-page, parent-before-child, parent-after-child, missing parent |
| Created | `tests/Unit/Resources/ThemeResourceDataTest.php` | Plain factory + null parent + with parent |
| Created | `tests/Feature/Console/SyncThemesCommandTest.php` | Boots the command via `$this->artisan(...)`, asserts populated themes table + exit code |
| Created | `tests/Unit/Services/Contracts/Fixtures/rebrickable-themes.json` | Two-page fixture for `Http::fake()` |
| Modified | `app/Models/Set.php` | Drop `$theme` string PHPDoc, add `$theme_id` + `theme()` BelongsTo |
| Modified | `app/Contracts/LegoDataServiceInterface.php` | Add `fetchThemes(): Generator<int, list<LegoThemeData>>` |
| Modified | `app/Services/RebrickableService.php` | `fetchThemes()` impl with pagination + cache + structural validation |
| Modified | `app/Actions/Sync/UpsertSetAction.php` | New `Theme` constructor dep + `resolveLocalThemeId()` lookup; assigns `theme_id` FK |
| Modified | `app/Http/Resources/SetSummaryResourceData.php` | Drop `?string $theme`, add `?ThemeResourceData $theme`, `EAGER_LOAD = ['theme']` |
| Modified | `app/Http/Resources/SetWithPartsResourceData.php` | Same nested theme treatment, eager-load list extended |
| Modified | `database/factories/SetFactory.php` | Drop literal theme string, default `theme_id` null, add `withTheme()` state |
| Modified | `database/seeders/SetSeeder.php` | Drop literal theme strings |
| Modified | `routes/console.php` | `Schedule::command('themes:sync')->weekly()->onOneServer()` |
| Modified | `deptrac.yaml` | New `Console` layer allowed to depend on `Action`, `ResultDTO` |
| Modified | `tests/Feature/Controllers/SetControllerTest.php` | Assertions updated to nested `theme: { id, name, parentId }` shape |
| Modified | `tests/Feature/Controllers/ResponseCachingTest.php` | Same |
| Modified | `tests/Unit/Resources/SetSummaryResourceDataTest.php` | Same |
| Modified | `tests/Unit/Resources/SetWithPartsResourceDataTest.php` | Same |
| Modified | `tests/Unit/Resources/FamilySetResourceDataTest.php` | Same |
| Modified | `tests/Unit/Actions/Sync/UpsertSetActionTest.php` | New theme-FK resolution scenarios + null-when-unknown path |
| Modified | `tests/Unit/Services/Contracts/RebrickableContractTest.php` | Contract conformance covers `fetchThemes` |
| Modified | `tests/Unit/Services/RebrickableServiceTest.php` | Pagination + 502 + cache hit/miss for `fetchThemes` |

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| `php artisan migrate:fresh` produces `themes` + `sets.theme_id` FK with no `theme` string column | Yes | Verified locally: both migrations DONE; schema columns confirmed |
| `Set::theme` returns `BelongsTo<Theme>`; `Theme::parent` and `Theme::children` work for 2-level tree | Yes | Covered by `SyncThemesActionTest`'s parent-linking scenarios |
| `LegoDataServiceInterface::fetchThemes()` yields paged `list<LegoThemeData>` and is implemented in `RebrickableService` with `Http::fake()` test coverage including a 502 path | Yes | `RebrickableServiceTest` (happy path, 2-page pagination, 502 → `RebrickableApiException`); `RebrickableContractTest` enforces conformance |
| `php artisan themes:sync` populates `themes` and resolves `parent_id` for parents that appear after their children | Yes | `SyncThemesActionTest::it_resolves_parent_when_parent_appears_after_child`; `SyncThemesCommandTest` exercises the end-to-end CLI path |
| `UpsertSetAction` assigns `theme_id` when rebrickable theme exists locally, null when not | Yes | `UpsertSetActionTest` adds two scenarios: `it_resolves_existing_theme_to_local_fk` and `it_leaves_theme_id_null_when_rebrickable_theme_unknown` |
| `GET /api/sets/{setNum}` returns `theme: { id, name, parentId }` or `theme: null` | **Partial — clarified** | The bare `GET /api/sets/{setNum}` route does not exist in this API. Closest endpoints (`GET /api/sets/{setNum}/parts` and `GET /api/sets/ean/{ean}`) both now embed the nested `theme` block. `SetControllerTest` and `ResponseCachingTest` assert the new shape. The intent (nested theme on set responses) is fulfilled — flagged in Decisions for the CEO in case a bare endpoint was meant to be added |
| `composer test` green | Yes | 662 tests, 2637 assertions, 0 failures, 14.68s |
| `composer phpstan` green at level max | Yes | 330 files, 0 errors |
| `composer deptrac` green | Yes | 0 violations, 705 allowed deps, 0 warnings |
| `composer test:arch` green | Yes | All 21 architecture suites pass; new `ConsoleArchitectureTest` enforces 5 rules |
| `composer mutation` ≥ 76% on `UpsertThemeAction` and `SyncThemesAction` | **Sandbox-blocked** | No coverage driver available in this environment (pre-existing pulse Active Concern row 1, dated 2026-05-05). PCOV install attempts blocked: PPA returned 403, PEAR not available. Test design is mutation-aware: every count increment, FK assignment, and conditional branch is asserted explicitly |

## Decisions Made

1. **Two-pass parent linking in `SyncThemesAction`** — Chose a "upsert all with `parent_id = null`, then walk the in-memory map and update FKs" approach over a single pass that recursively resolves parents. Rebrickable's themes endpoint can return a child before its parent (themes can be added upstream out of order), so a single pass would either need to defer + queue children or perform unbounded retries. Two passes over ~600 rows is O(N) and trivially correct. Documented in the action's class-level docblock.

2. **`Theme::cascadeRelations()` returns `['children', 'sets']` (deviation from permit)** — Permit leaned `[]` ("themes are catalog data, deletion shouldn't cascade"). The `CascadeRelationArchitectureTest` enforces that every `HasMany`/`HasOne` is listed in `cascadeRelations()` regardless of whether the relation is a likely deletion path. The architecture rule won; the production-safe semantics live in the migration's `nullOnDelete` on both `themes.parent_id` and `sets.theme_id`. There is no `DeleteThemeAction` and no live code path that triggers Eloquent-level cascade on themes, so the listing is defensive bookkeeping rather than a real delete vector. Inline comment in `Theme::cascadeRelations()` documents the rationale; flagged for the Director in case the architecture rule should be relaxed for catalog models specifically (would be a separate ADR).

3. **Renamed `ThemeSyncResult` → `ThemeSyncResultData`** — `DtoArchitectureTest` enforces a `Data` suffix on Result DTOs. Permit text used the bare name; followed the architecture rule. No semantic impact.

4. **`UpsertSetAction` looks up theme by `rebrickable_id`, never auto-creates** — The action takes an injected `Theme` model via the constructor, then `value('id')` queries against `rebrickable_id`. Unknown ids → `theme_id = null`. Auto-creation would let the set sync get ahead of the theme sync and create stub themes with no name; far simpler to let `themes:sync` own the catalog completely and accept that `theme_id` is occasionally `null` for a set fetched between theme sync windows. Self-heals next run.

5. **No new ADR** — This shift implements a catalog model that mirrors the existing `colors` pattern. No new architectural decision was introduced; the only new layer (`Console`) extends an established convention (entry-point layers depend on `Action` + their respective DTOs). If we ever exempt catalog models from the `cascadeRelations` rule (Decision 2), that would warrant an ADR — flagged but not opened.

6. **`Console` deptrac layer placed adjacent to `Controller`** — Both are entry points. Console's allowed deps are intentionally tighter than Controller's (`Action`, `ResultDTO` only — no `FormRequest`, `ResourceData`, or `Model`) because commands print primitives and never shape HTTP responses. If a future command needs to query state without delegating, that's a smell: it should be an Action.

7. **No `--no-verify` was used.** Pre-commit gauntlet (lint:test → phpstan → deptrac → test:arch) and pre-push gauntlet (PrePushPermitGate → composer test) both pass cleanly. No documented bypass needed for this shift.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | Rector OK, Pint passed |
| phpstan | Pass | Level max, 0 errors over 330 files |
| deptrac | Pass | 0 violations, 0 warnings, 705 allowed deps, 565 uncovered (in line with baseline) |
| test:arch | Pass | All 21 architecture suites; new `ConsoleArchitectureTest` adds 5 rules (suffix, final, extends Command, no Request/facades, no try-catch, owns `handle()`) |
| test | Pass | 662 tests, 2637 assertions, 0 failures, 14.68s |
| test:coverage | **Sandbox-blocked** | No coverage driver. Pre-existing pulse Active Concern (2026-05-05); not a regression |
| test:feature-coverage | **Sandbox-blocked** | Same root cause |
| mutation | **Sandbox-blocked** | Same root cause. Test design covers mutation surface: every count increment in `SyncThemesAction`, every FK assignment in `UpsertSetAction`, both transaction paths in `UpsertThemeAction`. Final MSI verification needs a host with PCOV/Xdebug |

## Showcase Readiness

A senior architect auditing this delivery would see a textbook catalog promotion: clean migration sequence, established Action/Service/DTO pattern reuse, a self-referencing FK with sane null-on-delete semantics, and a new entry-point layer (`Console`) wired into deptrac with a corresponding architecture test. The two-pass parent-linking strategy is documented with rationale at the action class level. The frontend gets a flat `theme: { id, name, parentId }` block — easy to consume, easy to extend later with parent-name denormalization or a tree endpoint if the showroom needs it. The one weak spot is the `cascadeRelations` deviation from the permit (Decision 2), but the rationale is sound and the production-level safety is in the migration.

The single non-shippable item is the mutation-bar verification, which is a sandbox-environment limitation rather than a code-quality gap.

## Proposed Knowledge Updates

- **Learnings:** When introducing a new entry-point layer (Console / Job / Controller), the deptrac config and a corresponding ArchitectureTest must land in the same shift — otherwise the first command lands without enforcement and the next one will quietly drift.
- **Pulse:** Confirm Active Concern row 1 (coverage driver missing) is still tracked; if it's been open since 2026-05-05, escalate to a follow-up shipping order. Mutation-bar verification is now blocked for the third shift in a row.
- **Decision Record:** None proposed. The `cascadeRelations` deviation (Decision 2) is a candidate for a future ADR if the rule should be relaxed for catalog models — but one occurrence is not enough evidence; let it accrue across two more catalog additions before formalizing.

## Self-Debrief

### What Went Well

- Mirroring `UpsertColorAction` for `UpsertThemeAction` was almost mechanical — the unique-violation race fallback transferred verbatim and the test structure carried over.
- The `Console` deptrac layer + `ConsoleArchitectureTest` landed in the same commit; nothing slipped through unenforced.
- Resource-shape changes were caught comprehensively because the search for `'theme'` references in the test directory turned up every assertion that needed updating in one pass.

### What Went Poorly

- I drafted the shift log against `Write` and got refused on that path. Wasted a tool call before realizing it was a tool-permission issue rather than a path issue. Should have probed with a `touch` first when a `Write` refusal looks unexpected.
- Spent a few minutes re-confirming the `cascadeRelations` rule against the architecture test before deviating from the permit. Should have read `CascadeRelationArchitectureTest.php` *before* writing the model the first time.

### Blind Spots

- Did not read `RoutingArchitectureTest` first to confirm the `GET /api/sets/{setNum}` route in the permit actually exists. Would have caught the partial-fulfillment case earlier and could have pinged the Director rather than discovering it post-hoc.
- Did not run `php artisan schedule:list` until the very end as a sanity check; it should have been the first verification after wiring `routes/console.php`.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| Before extending an architecture-enforced surface (cascadeRelations, Resource, Action), grep `tests/Architecture/` for the corresponding `*ArchitectureTest.php` and read it first | Decision 2 deviation cost re-work | This log |
| When adding a scheduled command, run `php artisan schedule:list` immediately after wiring `routes/console.php` to confirm registration | The schedule check happened post-hoc | This log |
| When permit acceptance criteria reference an HTTP route, verify the route exists with `php artisan route:list` before committing test assertions | Discovered the missing `GET /api/sets/{setNum}` route after writing the test | This log |
| When `Write` is refused on a path that should be writable, probe with `touch` via the shell tool before retrying or escalating | Lost a tool call to a permission diagnosis | This log |
| For supplier-response Generators, write the multi-page test before the single-page test — the multi-page test catches both pagination and termination | Single-page pass-through almost always works on first try; pagination breaks subtly | This log |

---

## Logistics Director Evaluation

_Appended after reviewing the log. The sorter's sections above are not edited — they stand as written._

**Overall Assessment:** Solid

### Order Fulfillment Review

The shipment matches the permit on every concrete deliverable: schema, model, service contract, two actions, command, scheduled wiring, deptrac layer, architecture test, resource shaping, factory updates, and 10 test files. The full test suite is green (662 tests, 0 failures), phpstan is clean at level max, deptrac reports 0 violations, and lint:test passes. I re-ran all four checks independently after the Sorter reported back; the numbers reproduce exactly.

Two over-deliveries worth noting: (a) the `Console` layer was added with a tighter ruleset than I would have permitted by default (`Action` + `ResultDTO` only — no `Model`, no `Contract`), which is a defensible choice because pure-delegation commands are the warehouse standard; (b) the `ConsoleArchitectureTest` was written with five rules instead of the bare minimum, mirroring `ControllerArchitectureTest` discipline.

The only partial criterion is the `GET /api/sets/{setNum}` route reference in the permit. The route does not exist; the closest endpoints both correctly embed the new theme block, so the **intent** of the criterion is met. This was a permit-authoring miss on my end, not a delivery gap. I will note it on my own training log under "verify route names with `route:list` before listing them as criteria."

### Decision Review

All seven decisions were sound, including the deviation from the permit on `cascadeRelations`. The Sorter chose architecture-test compliance over my permit's leaning, documented the rationale inline, and flagged the underlying tension for a possible future ADR. That is exactly the right shape: follow the rule that's enforced, deviate only when documented, surface the question for later — do not silently absorb it.

The `ThemeSyncResult` → `ThemeSyncResultData` rename is similarly correct: the architecture rule is the authority. Permit text was sloppy on the suffix; the Sorter held the line.

Decision 4 (no auto-create of themes from `UpsertSetAction`) is the most consequential; it cleanly draws the line of responsibility between `themes:sync` (catalog ownership) and `UpsertSetAction` (FK lookup only). This is the right boundary and the migration's `nullOnDelete` makes it production-safe.

No decision should have been escalated. The deviation on Decision 2 is the kind of judgment call I expect the Sorter to make in shift; flagging it in the log was the right escalation channel.

### Showcase Assessment

This delivery strengthens the portfolio. The `Console` layer + architecture test is the kind of "small structural addition that arrives with its own enforcement" that distinguishes a deliberate codebase from one that grows by accretion. The two-pass parent-linking strategy is documented at the right level (the action's class docblock, not the migration), so a reviewer will encounter the rationale exactly when they ask the question.

The mutation-bar gap is environmental, not architectural; the pulse already tracks it. Until the coverage driver lands, the test design's explicit assertion on every mutation surface is the right compensating control.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| Before extending an architecture-enforced surface, grep `tests/Architecture/` and read the relevant test first | **Candidate** | First-shift evidence. The `cascadeRelations` deviation on this shift is the trigger; let's see if a second shift hits a similar friction. If so, this should graduate quickly — the cost is one `rg` invocation and the savings are real |
| When adding a scheduled command, run `php artisan schedule:list` immediately after wiring `routes/console.php` | **Dropped** | Too narrow. We rarely add scheduled commands. Subsume into a broader "verify wiring with the framework's introspection commands" rule if it ever recurs |
| When permit acceptance criteria reference an HTTP route, verify with `php artisan route:list` before committing test assertions | **Candidate** | The route reference was actually a permit-authoring miss (mine), not a Sorter failure. But the Sorter's verification step is still cheap and right. Hold for a second occurrence |
| When `Write` is refused on a path that should be writable, probe with `touch` via the shell tool before retrying or escalating | **Dropped** | This is a tool-environment idiosyncrasy, not a recurring engineering concern. Documented here is enough |
| For supplier-response Generators, write the multi-page test before the single-page test | **Candidate** | Strong proposal. The "multi-page first" discipline catches pagination + termination simultaneously and the cost is zero (single-page is a degenerate case of multi-page). Hold for a second supplier-Generator addition to confirm the pattern |

Three Candidates added to the Sorter's Graduation Log. None graduated this shift — first-time evidence on each.

### Notes for the Sorter

Repeat: the deviation-with-documented-rationale on `cascadeRelations`. That was the right call and the right escalation channel. Repeat: the willingness to rename `ThemeSyncResult` to match the architecture rule rather than to match the permit text. The permit is a brief, not a contract; the architecture tests are the contract.

Do differently: front-load the architecture-test reading. The `cascadeRelations` rework was avoidable by spending 30 seconds in `tests/Architecture/CascadeRelationArchitectureTest.php` before writing the first model.

The "GET /api/sets/{setNum}" criterion in the permit was on me, not on you. Good catch in the report.

---

## Post-Push CI Triage Addendum

_Appended after the initial push surfaced two CI failures. Recorded for the audit trail and the graduation logs._

### What Failed

The first push (commit `f099f6d`) cleared the local pre-push gauntlet but two CI jobs failed on PR #179:

1. **`lint`** — Rector flagged `RenameVariableToMatchMethodCallReturnTypeRector` on `app/Console/Commands/SyncThemesCommand.php`: `$themeSyncResult` should be `$themeSyncResultData` (matching the renamed Result DTO class). The local rector cache had cached the file under the old DTO name `ThemeSyncResult` and never invalidated when the class was renamed mid-shift, so the pre-push gauntlet never saw the issue. CI runs from a fresh cache and caught it on first attempt.
2. **`feature-coverage`** — `--min=90` failed. Coverage dropped because `tests/Feature/Console/SyncThemesCommandTest.php` was included in the feature-coverage suite but covers a class (`SyncThemesCommand` in `app/Console/Commands`) that lives outside the suite's `<source><include>app/Http/Controllers</include></source>` declaration. The convention in this codebase — visible from the existing excludes (`Models`, `Jobs`, `Configuration`, `ExceptionHandlerTest`, `ResponseCachingTest`) — is that any feature test which doesn't cover a Controller is excluded from feature-coverage. The new Console suite was a new test category that should have been excluded from day one.

### What Was Done

| Commit | Fix |
|---|---|
| `eb771b4` (squashed into the PR) | Renamed `$themeSyncResult` → `$themeSyncResultData` per Rector. Cleared local rector cache to confirm the green state |
| Rebase onto `origin/main` | The branch was based on `4151023`, predating `0b83b00` (part_id work). Rebasing brought the merge tree closer to the actual HEAD CI was running against and removed a confusing diff in `FamilyMissingPartsResourceData.php` |
| `c2ce7a5` (squashed into the PR) | Added `<exclude>tests/Feature/Console</exclude>` to `phpunit.feature-coverage.xml`, completing the established convention |

The Director re-ran phpstan / deptrac / lint:test / composer test independently after each commit. After the second push CI returned all 8 jobs green and the PR merged as `feed543`.

### Decisions Made (Director-level)

1. **Rebase rather than merge** — The branch had diverged by one main commit (`0b83b00`). Rebase keeps the history linear and makes the eventual squash-merge cleaner. There were no conflicts. Force-push with `--force-with-lease` was used per git safety convention.
2. **Exclude rather than relocate the Console test** — Moving `SyncThemesCommandTest` to `tests/Unit/` was the alternative. It was rejected: the test boots the framework via `Artisan::call`, exercises the DB via `RefreshDatabase`, and asserts side-effects in the `themes` table. That is unambiguously a Feature test by this codebase's category definitions. The suite was wrong, not the test.
3. **Single-line addition vs. broader CI restructure** — The `feature-coverage` config could have been restructured to use an opt-in pattern (only include `tests/Feature/Controllers/`) instead of opt-out excludes. Rejected: out of scope for a CI fix, would touch every controller test path implicitly, and would require a separate ADR. The exclude pattern matches what's already there.
4. **No `--no-verify` was used.** Both fix-up commits passed pre-commit and pre-push gauntlets cleanly.

### Updated Self-Debrief — What This Surfaced

| Observation | Implication |
|---|---|
| The local pre-push gauntlet ran composer test but not against a fresh rector cache. The Sorter renamed the DTO class mid-shift; rector's per-file hash cache kept the old result for `SyncThemesCommand.php`. | Existing training proposal #1 (read the relevant `*ArchitectureTest.php` before extending) needs a sibling: when **renaming a class**, clear linter caches before the gauntlet. The signal here is "renamed something a linter has cached opinions about" — not just "extending architecture-enforced surface". |
| The Sorter created `tests/Feature/Console/` as a new test category but did not check `phpunit.feature-coverage.xml` for category exclusions. A 30-second read of that file would have shown the established opt-out pattern and the need to add `tests/Feature/Console` to it. | New training proposal: when introducing a **new test directory** under `tests/Feature/`, audit all PHPUnit configs (`phpunit.xml`, `phpunit.coverage.xml`, `phpunit.feature-coverage.xml`) for `<exclude>` patterns and decide explicitly whether the new directory belongs included or excluded. |
| The pre-push gauntlet only runs `composer test`. It does NOT run `composer test:feature-coverage` (no coverage driver in the dev container). The CI failures were not preventable by the local gauntlet alone — they needed a coverage driver locally. The Auditor's pulse already tracks the missing driver as an Active Concern (2026-05-05); this triage is the third shift in a row to hit the gap. | Director-level concern: this Active Concern should escalate from "tracked" to "scheduled for resolution" — file a separate shipping order for getting PCOV/Xdebug into the dev container, or for a CI-only safety net (e.g., a "draft PR open" hook that runs feature-coverage before push). Logged as a follow-up. |

### Updated Logistics Director Disposition (Addendum to the Original)

| Proposal | New Disposition | Rationale |
|---|---|---|
| Existing #1 — Read architecture tests before extending enforced surface | **Candidate (still)** | First-shift evidence stands. The rector-cache miss is a separate failure mode, not a confirmation of this rule. |
| **NEW** — When renaming a class that linters cache opinions about (Rector, PHPStan, Pint, Deptrac), clear the relevant linter cache before re-running the gauntlet | **Candidate** | First-shift evidence: this shift's Rector cache miss caused a CI surprise. Hold for a second occurrence to confirm, but the cost is one `rm -rf storage/rector` and the savings are real. |
| **NEW** — When introducing a new test directory under `tests/Feature/`, audit all PHPUnit configs for `<exclude>` patterns and decide explicitly whether the new directory belongs included or excluded | **Candidate** | First-shift evidence: this shift's `tests/Feature/Console/` was added without that audit. Strong proposal — the convention exists, the audit is mechanical, and the cost of missing it is a CI failure on the first PR. |
| Existing — Verify route names with `route:list` before committing test assertions | **Candidate (still)** | First-shift evidence stands. |
| Existing — Multi-page test before single-page test for supplier Generators | **Candidate (still)** | First-shift evidence stands. |

Five candidates total in the Sorter's graduation log after this shift. None graduated yet (all first-evidence). If any of them recurs in the next two shifts, that's the second confirming session — formal Graduation Tests at that point.

### Director's Note to the Sorter (Addendum)

Two real misses that the local gauntlet didn't catch but CI did. Both are now Candidates in your graduation log. The takeaway is not "the local gauntlet is insufficient" (it is, for the missing coverage driver — that's an Active Concern, not a Sorter failure) — the takeaway is "stale linter caches and unaudited new test categories are predictable failure modes; both have a 30-second prevention check." We caught both within two CI cycles and the PR merged on the second push. That's a healthy fast-feedback loop. The post-merge close-out (this addendum + the permit Status flip) follows the protocol.
