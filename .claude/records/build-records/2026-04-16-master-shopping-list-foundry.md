# Shift Log: Master Shopping List (Brick Side)

**Log #:** 2026-04-16-master-shopping-list
**Filed:** 2026-04-16
**Shipping Order:** `.claude/records/permits/2026-04-16-master-shopping-list.md`
**Sorter:** Head Sorter

> **Filing note:** The Sorter's `Write` tool was refused on `.claude/records/journals/` in the shift environment. Per the graduated learning from the 2026-04-16-action-contract-hygiene shift, the Sorter flagged the block on the first refusal rather than retrying across alternative tools. The substance below is the Sorter's own report, transcribed verbatim by the Logistics Director.

---

## Work Summary

Built `GET /family-sets/missing-parts` — a bulk endpoint returning cross-set missing-parts shortfalls for all of an authenticated family's non-wishlist sets, aggregated in SQL and grouped by `(part_num, color_id)`. The Action runs five bounded queries regardless of set count: non-wishlist family_sets, aggregated NEEDED, aggregated STORED, distinct `needed_by_set_nums` triples, and the distinct-known-set-id set used to compute `unknownFamilySetIds`.

| Action | File | Notes |
|---|---|---|
| Created | `app/Actions/FamilySet/GetFamilyMissingPartsAction.php` | Five-query aggregation, returns `FamilyMissingPartsData` |
| Created | `app/Http/Resources/FamilyMissingPartsResourceData.php` | Envelope `ComputedResourceData` per ADR-0010 |
| Created | `tests/Feature/Controllers/FamilySetMissingPartsTest.php` | 15 feature tests covering all acceptance criteria |
| Created | `tests/Unit/Actions/FamilySet/GetFamilyMissingPartsActionTest.php` | 5 Mockery-based unit tests |
| Created | `tests/Unit/Resources/FamilyMissingPartsResourceDataTest.php` | 3 resource serialization tests |
| Modified | `app/Http/Controllers/FamilySetController.php` | Added `missingParts()` method, method injection per ADR-0009 |
| Modified | `app/Policies/FamilySetPolicy.php` | Added `viewMissingParts()` — returns true for authenticated members (ADR-0002 parity with `viewCompletion`) |
| Modified | `routes/api.php` | Added explicit route with `can:viewMissingParts,...` middleware + etag/cache headers, placed before the `{family_set}` wildcard |
| Modified | `tests/Architecture/RoutingArchitectureTest.php` | Drift-guard count 33 → 34 |
| Modified | `tests/Unit/Policies/FamilySetPolicyTest.php` | Coverage for new policy method |
| Pre-existing | `app/Data/FamilyMissingPartsData.php` | Envelope DTO implementing `ResourceDataSourceInterface` — present on branch before shift |

**Commit on `claude/add-shipping-log-pickup-3xFGU` (pushed):**

| SHA | Message |
|---|---|
| `879e87b` | `feat(inventory): add cross-set missing-parts shortfall endpoint` |

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| `GET /family-sets/missing-parts` returns shortfalls for all non-wishlist family sets in one response | Yes | Single controller invocation, five bounded queries in the Action |
| Each entry includes all required display fields | Yes | `part_num`, `color_id`, `part_name`, `color_name`, `color_hex`, `part_image_url` (nullable), `quantity_needed`, `quantity_stored`, `shortfall`, `needed_by_set_nums` |
| `shortfall = max(0, needed - stored)`; zero-shortfall rows excluded | Yes | Feature tests cover overstocked + fully-satisfied cases |
| `quantityNeeded` multiplies `set_parts.quantity` × `family_sets.quantity` | Yes | Done in SQL via `SUM(set_parts.quantity * family_sets.quantity)`; feature test with `quantity=2` verifies doubling |
| Top-level `unknownFamilySetIds: string[]` for sets with no `set_parts` rows | Yes | Empty array when knowable; populated with family_set IDs when unsynced |
| Cross-family isolation | Yes | Q1, Q3 both filter on `family_id`; covered by two feature tests (shortfalls + storage isolation) |
| `.can()` middleware per ADR-0002 | Yes | `->can('viewMissingParts', FamilySet::class)` |
| Wishlist sets excluded from both aggregation and unknowns | Yes | Q1, Q2, Q4 all filter `status != Wishlist` |
| SQL-side GROUP BY — not PHP summation | Yes | `->selectRaw(...SUM...)->groupBy(...)->toBase()->get()` for needed and stored |
| Unit tests for the Action | Yes | 5 tests: empty family, unknown sets, shortfall with storage, zero-shortfall exclusion, needed_by dedup |
| Feature tests for the endpoint | Yes | 15 tests covering auth, response shape, cross-family, multiplicity, spare exclusion, null image, etc. |
| `composer test` passes | Yes | 540 passed / 1914 assertions / no risky tests |
| `composer phpstan` level max | Yes | Clean across 297 files |
| `composer deptrac` 0 violations | Yes | |
| `composer test:arch` | Yes | Including the drift-guard count bump |
| Mutation testing ≥ 76% on the new Action | **Blocked** | See Quality Gauntlet — no coverage driver in environment; CI enforces on push |

## Decisions Made

1. **Separate `needed_by_set_nums` query instead of GROUP_CONCAT / STRING_AGG** — Chose a fifth `DISTINCT (part_num, color_id, set_num)` query with PHP-side dedup over a database-specific aggregate. Rejected GROUP_CONCAT because SQLite and Postgres diverge (`GROUP_CONCAT` vs `STRING_AGG`), and branching driver logic in an Action violates the "database portability" discipline. The extra query is bounded (one query, deduplicated via SQL `DISTINCT`), not per-set.

2. **Split NEEDED and needed-by-set into two queries instead of one joined `GROUP_CONCAT`** — Same reasoning; keeps the aggregation query focused and portable. Both queries share the same `family_sets` join pattern.

3. **Filter out NULL `storage_option_parts.color_id` rows** — Matches the strict part+color equality used by `GetFamilySetCompletionAction`. A null-color stored row cannot satisfy a colored need without a color-agnostic matching strategy that would change the contract.

4. **Inject each Model separately and call `newQuery()` per query** — Per the graduated learning from `2026-03-25-brick-dna-lab`, avoids the `clone $builder` Mockery-incompatibility trap. Five model dependencies (`FamilySet`, `SetPart`, `StorageOption`, `StorageOptionPart`) resolved from the container.

5. **Raw `toBase()->get()` returning `stdClass`** — Per graduated learning from the same log; PHPStan handles stdClass property access cleanly with targeted `cast.int`/`cast.string` ignores, rather than the `mixed`-returning `getAttribute()` approach.

6. **Envelope resource (`shortfalls` + `unknown_family_set_ids`) rather than raw array** — Needed the top-level `unknownFamilySetIds` field, and `ComputedResourceData` (ADR-0010) is the right envelope for DTO-sourced responses without per-entry Resource overhead. Per-entry shortfall rows are plain arrays with stable keys from the SQL aliases, matching the precedent completion endpoint.

7. **Policy method returns `true` for all authenticated users** — Mirror of `viewCompletion`. Family scoping is enforced by the Action's `family_id` filters, not the policy. Any authenticated family member can see their own family's shortfalls.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | Clean on dry-run after Rector+Pint iterations |
| phpstan | Pass | Level max, 0 errors across 297 files |
| deptrac | Pass | 0 violations |
| test:arch | Pass | Drift-guard count updated (33 → 34) |
| test | Pass | 540 passed, 1914 assertions, no risky |
| test:coverage | **Blocked** | `No code coverage driver is available` — PCOV/Xdebug not installed in this environment |
| test:feature-coverage | **Blocked** | Same driver blocker |
| mutation | **Blocked** | Pest: "Mutation testing requires code coverage to be enabled" — same driver blocker |

**Per the shipping order's explicit escape clause** (citing 2026-04-16-action-contract-hygiene precedent): "If your environment cannot run coverage/mutation (PCOV/Xdebug driver), follow the precedent ... document it honestly in the shift log, note CI enforces on push, and move on. Do NOT skip the other gates." CI will enforce unit-coverage 100%, feature-coverage 90%, and mutation MSI ≥ 76% on push. Locally all non-driver gates are green.

## Showcase Readiness

This holds up to a senior audit. The Action's discipline — five bounded queries, SQL-side aggregation with multiplicity handled in the join, separate query for needed-by-set lookup to avoid DB-specific aggregates, and an explicit `unknownFamilySetIds` honesty contract — directly demonstrates the "database aggregation beats PHP summation" principle on a realistic feature. The controller stays a three-line loading dock per ADR-0009. The envelope resource is ADR-0010 textbook. The feature test matrix covers every acceptance bullet plus the tricky cases (cross-family storage isolation, null color_id stored rows, spare exclusion, null image URL).

One area to flag for the Director: in Q3, NULL-color stored rows are silently dropped. This is the right call for colored-need satisfaction, but if the business later decides "bulk gray bricks should satisfy light-gray needs," we'd need a color-agnostic fallback tier. Not a showcase weakness — a documented contract boundary that matches the precedent completion Action.

## Proposed Knowledge Updates

- **Learnings:** None new. This shift reused the two graduated learnings (`toBase()->get()` + `stdClass`; separate `newQuery()` per Model) without new friction — they worked as designed.
- **Pulse:** Consider updating the "Inventory Desk" row to reflect that both the set-completion gauge (per-set) and cross-set missing-parts are now live bulk endpoints with matching architecture.
- **Decision Record:** No new ADR warranted. This shipment is a faithful application of ADRs 0002/0003/0006/0008/0009/0010 to a new endpoint. If the Plate side later introduces caching or pagination for this endpoint, that would warrant an ADR.

## Self-Debrief

### What Went Well

- The precedent (`GetFamilySetCompletionAction` + `/family-sets/completion`) made the architecture decision space tiny. I didn't re-derive patterns; I mirrored them.
- Writing the feature tests first (route + request shape + auth) caught the `{family_set}` wildcard ordering before I ever ran the unit tests — the static `/missing-parts` segment had to be registered above the wildcard, and that was visible on the first 404 assertion.
- The two graduated learnings (`toBase()->get()` + separate `newQuery()`) mean zero friction on PHPStan and Mockery this shift. That's two full cycles saved compared to the original brick-dna-lab sort.
- The `unknownFamilySetIds` contract was clear in the permit and I built against it directly — Q5 is the smallest dedicated query in the Action and earns its keep.

### What Went Poorly

- First attempt at the `storedByKey` lambda used an arrow-function style that Rector auto-rewrote, misplacing a `@phpstan-ignore` comment between argument lines and breaking PHPStan. Fix: switched to multi-statement `function(...) { ... }` with named locals. Would have saved a cycle by defaulting to the verbose form when `cast.int`/`cast.string` ignores are in play.
- Feature test quantity assertions were off on the first pass because `FamilySetFactory` randomizes `quantity` between 1-3. Had to pin `'quantity' => 1` in affected tests. The lesson is sharper than "factories are random" — it's "when a feature test asserts exact arithmetic, every numeric factory default in the scenario must be pinned, not just the one you're actively manipulating."
- Initial draft of the PHPStan ignores included `property.nonObject` and `argument.type` identifiers that weren't matched — removed them; only `cast.int`/`cast.string` are needed against `stdClass` in this pattern. Precedent Action already showed this but I re-derived it.

### Blind Spots

- I didn't verify the `parts.image_url` column exists in the schema before coding against it — I assumed based on the permit's "if present, return null otherwise" language. It does exist, but I should have checked the migration/Model properties first. Cost: zero this time, could have cost a cycle.
- I didn't check whether any `spare` column handling was needed on `storage_option_parts` — it isn't (no `is_spare` column there), but confirming that explicitly would have been faster than inferring from the Model. Verified after writing the query.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| When a feature test asserts an exact aggregate result, pin every factory-randomized numeric column that feeds the arithmetic — not just the ones under test | Fixed after `quantity_needed` came out 12 instead of 6 because `FamilySetFactory::quantity` defaults randomized | 2026-04-16-master-shopping-list |
| When writing a lambda that contains a `@phpstan-ignore` comment, default to a multi-statement `function(...) { ... }` body instead of arrow-ish single-statement style — Rector can reshuffle arguments and misplace the suppression | Rector rewrote the `storedByKey` keyBy lambda, breaking the ignore placement | 2026-04-16-master-shopping-list |
| Before adding a `@phpstan-ignore` with a new identifier, only use identifiers that PHPStan has emitted in the current run — speculative identifiers (`property.nonObject`, `argument.type`) fail the "unmatched" check | First PHPStan pass rejected speculative ignores | 2026-04-16-master-shopping-list |

---

## Logistics Director Evaluation

**Overall Assessment:** Portfolio-grade.

### Order Fulfillment Review

All fourteen acceptance criteria mapped to verified implementation points. The three blocked gates (`test:coverage`, `test:feature-coverage`, `mutation`) are the same environmental driver gap the permit explicitly authorized the Sorter to document-and-move-past, citing the 2026-04-16-action-contract-hygiene precedent. CI enforces them on push. Commit `879e87b` delivers 11 files / 1071 lines as a single cohesive shipment; route placement before the `{family_set}` wildcard verified directly (lines 81 vs. 91 in `routes/api.php`). Pre-commit and pre-push gauntlets green.

### Decision Review

1. **Separate `needed_by_set_nums` query instead of GROUP_CONCAT/STRING_AGG** — correct. Database portability (Postgres prod / SQLite local) is a hidden contract of this codebase; driver-branching in an Action would violate ADR-0003's spirit. The fifth query is bounded and earns its keep.
2. **Applying the two graduated learnings from `brick-dna-lab` (separate `newQuery()` per Model + `toBase()->get()` + stdClass ignores)** — exactly what the training pipeline exists to produce. Both held up under fresh application without new friction.
3. **Envelope `ComputedResourceData` vs. per-entry Resource** — correct. Flat DTO rows with stable SQL aliases don't need per-row resource wrapping; ADR-0010 fits this shape precisely.
4. **Policy method returns `true` for authenticated members, mirroring `viewCompletion`** — correct. Family scoping is an Action concern (explicit `family_id` filters), not a policy concern; that separation is already the codebase's convention.
5. **NULL `storage_option_parts.color_id` rows silently dropped in Q3** — correct for the colored-need contract, and the Sorter flagged it honestly as a contract boundary rather than a bug. If the business later wants color-agnostic fallback satisfaction, that's an ADR-worthy conversation, not an inline fix.

### Showcase Assessment

The `unknownFamilySetIds` contract is the showcase centerpiece. It's the kind of small, honest design choice that distinguishes a generic implementation from one that shows the engineer thought about partial-sync reality — the Plate gets to say "3 sets have unknown shortfalls, sync to include them" instead of pretending the list is comprehensive. Pair that with the SQL-side multiplicity handling (`SUM(set_parts.quantity * family_sets.quantity)`) and the test matrix covering spare exclusion, null color_id, cross-family isolation, and null image URLs, and this is the kind of commit a senior auditor reads as "they've got the discipline baked in."

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| Pin every factory-randomized numeric column when asserting exact aggregates | Candidate | Specific, testable, directly observed (`quantity_needed` came out 12 instead of 6). General enough to apply broadly across feature tests that assert arithmetic. Needs a second confirming session before graduation. |
| Default to multi-statement `function(...) { ... }` bodies when a lambda contains a `@phpstan-ignore` | Candidate | Narrow but concrete — Rector reshuffled arguments and broke ignore placement, costing a cycle. The fix is mechanical and transferable. Needs a second confirming session before graduation. |
| Only use PHPStan ignore identifiers emitted in the current run | Dropped | PHPStan already rejects unmatched ignores as a built-in feature ("unmatched ignored error"). The proposal restates what the tool enforces, not a learning the Sorter can internalize as behavior. |

### Notes for the Sorter

The two graduated learnings held. That's what graduation is for — friction that used to cost cycles now costs nothing, and you applied both without prompting. Keep the discipline of mirroring a precedent Action when one exists rather than re-deriving; the completion endpoint gave you the architecture for free and you recognized that. On the `{family_set}` wildcard ordering catch: writing the feature tests first is the right instinct — route registration order is invisible until you exercise it, and a test makes it visible.

One flag already on the CEO's radar from the prior shift (commit `63e8e8b` pre-existing lint/PHPStan blocker) remains open; this shift didn't touch it.

---

**Status:** Complete
