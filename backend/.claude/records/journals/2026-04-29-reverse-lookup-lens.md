# Shift Log: The Reverse Lookup Lens (Brick Side)

**Log #:** 2026-04-29-reverse-lookup-lens
**Filed:** 2026-04-29
**Shipping Order:** `.claude/records/permits/2026-04-29-reverse-lookup-lens.md`
**Sorter:** Head Sorter

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Created | `app/Actions/Family/GetFamilyPartUsageAction.php` | Three-query action: parts ⨝ colors metadata, per-set demand aggregate, family-wide stored aggregate. Returns `FamilyPartUsageData` with a `Collection<FamilyPartUsageEntryData>`. |
| Created | `app/DataTransferObjects/Result/FamilyPart/FamilyPartUsageData.php` | Envelope DTO carrying part metadata + `Collection<FamilyPartUsageEntryData>`. Same-layer ResultDTO → ResultDTO dependency mirrors precedent (`RebrickableUserSetData` → `LegoSetData` in the Input layer). |
| Created | `app/DataTransferObjects/Result/FamilyPart/FamilyPartUsageEntryData.php` | Per-set entry: `familySetId`, `setNum`, `setName`, `status` (`FamilySetStatus`), `quantityNeeded`, `quantityStored`, `shortfall`. Renamed from `FamilyPartUsageEntry` after `DtoArchitectureTest` flagged the missing `Data` suffix. |
| Created | `app/Http/Resources/FamilyPartUsageResourceData.php` | `ComputedResourceData<FamilyPartUsageData>` — flattens the entry collection into snake_case array shapes for the JSON envelope. |
| Modified | `app/Http/Controllers/FamilyController.php` | Added `partUsage()` method — method-injected per ADR-0009, no try-catch, returns `FamilyPartUsageResourceData::from(...)->toResponse()`. |
| Modified | `routes/api.php` | New route `GET /family/parts/{partNum}/{colorId}/usage` inside the `auth:sanctum + family.ownership` group, with `etag` + `cache.headers:private;max_age=60` middleware mirroring sibling family endpoints, `viewParts` policy on `Family`, and `colorId` constrained to digits. |
| Modified | `tests/Architecture/RoutingArchitectureTest.php` | Bumped `$expectedAuthenticatedRouteCount` from 34 → 35 to absorb the new authenticated route. |
| Created | `tests/Unit/Actions/Family/GetFamilyPartUsageActionTest.php` | 5 scenarios, 100% line + 100% mutation coverage on the Action: empty result, unknown part, multi-set with shortfall + stored, null SUM coercion, and known-part-no-sets path. Strict mock matchers lock the SQL shape per query. |
| Created | `tests/Feature/Controllers/FamilyControllerPartUsageTest.php` | 15 integration drills: 401 unauthenticated, 200-with-empty-usages, unknown-part null metadata, single-set, multiplicity, shortfall computation, zero shortfall, wishlist exclusion, spare exclusion, cross-family non-leak (sets), cross-family non-leak (storage), wrong-colour non-match, etag + cache-control headers, multi-set entry distinctness, **bounded-query proof** (`DB::listen` asserts the action issues exactly three queries against `parts`/`set_parts`/`storage_option_parts` regardless of how many sets need the part — 5 sets × 1 query each is the failure mode this kills). |

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| `GET /family/parts/{partNum}/{colorId}/usage` returns 200 with the documented envelope for an authenticated family head or member | Yes | Feature tests confirm — happy path returns the envelope with `part_num`, `color_id`, metadata, and `usages` list. |
| Wishlist `family_sets` are excluded from `usages` | Yes | Action's Q2 filters `family_sets.status != 'wishlist'`; covered by `it should exclude wishlist sets from usages` in the feature suite. |
| Action runs at most three queries regardless of how many sets need the part | Yes | Q1 (parts ⨝ colors), Q2 (SetPart aggregate), Q3 (StorageOptionPart aggregate). The Q2 `selectRaw('SUM(...)') ... groupBy(family_sets.id, ...)` produces one row per family_set in a single round-trip — adding more owned sets does not add queries. |
| Unknown `(partNum, colorId)` returns 200 with metadata if present (or null fields if part is unknown) and an empty `usages` collection | Yes | Two feature tests — `it should return 200 with empty usages when no sets need the part` (catalog has the part) and `it should return 200 with null metadata when part is unknown to the catalog`. |
| Unauthenticated → 401. Authenticated user with a different `family_id` cannot see another family's usage data | Yes | Route is inside the `auth:sanctum` + `viewParts` policy group. Cross-family non-leak proven by `it should not leak usages from other families` and `it should not subtract another family's storage from this family's need`. |
| All gauntlet stages green | Yes | See Quality Gauntlet section. The pre-existing main-branch failures (Pint on `public/frankenphp-worker.php`, six PHPStan errors keyed to `Illuminate\Queue\Attributes\Timeout`/`FailOnTimeout`/`PreventRequestForgery`, one feature test on `ImportOwnedSetsJobTest`) are explicitly verified as pre-existing on main and not introduced by this shift. |

## Decisions Made

1. **200-with-empty-usages, not 404, for an unknown part** — Chose 200 over 404 for the "the part exists in the catalog (or doesn't), but no family_sets need it" path. Rationale below in its own section because the Director asked for the judgment captured here.

2. **Per-entry shortfall under "is this one set covered?" semantics, repeating `quantityStored` on every entry** — Chose this over (a) per-set proportional distribution of stored, (b) cross-set summed need vs. total stored. The Reverse Lookup Lens answers "I found this brick on the floor — where does it belong?" The honest answer per row is *"this set needs N; you have S in storage"*. Distributing stored proportionally invents a policy the user didn't ask for; cross-set summing duplicates `GetFamilyMissingPartsAction`'s job. Documented the no-summing constraint on `FamilyPartUsageEntryData`'s docblock so a future consumer can't misread the shape. Mutation testing surfaces zero unkilled mutants on the shortfall line — the semantics are pinned by the tests.

3. **Same-layer ResultDTO → ResultDTO reference** — `FamilyPartUsageData` references `FamilyPartUsageEntryData` directly. Verified deptrac allows same-layer dependencies (existing precedent in `App\DataTransferObjects\Input\Lego\RebrickableUserSetData` → `LegoSetData`). The alternative — flattening the entries to array shapes inside the envelope (the precedent set by `FamilyMissingPartsData`) — was rejected because the permit explicitly specified `Collection<FamilyPartUsageEntry>` and the typed entry sharpens the Action's contract: `(string)`/`(int)` casts on stdClass rows are pinned by the entry's typed properties.

4. **Parameterised `whereRaw` on the colors leftJoin instead of a separate Color query** — Combining part + color metadata in a single SQL round-trip keeps the action at the documented three-query budget. Considered a separate `Color::where('id', $colorId)->first()` query (cleaner code, +1 query) and `DB::raw((string) $colorId)` (facade, ADR-0007 violation). The leftJoin closure with `whereRaw('colors.id = ?', [$colorId])` is the cleanest in-budget option. Mutation tests cover the closure body.

5. **Naming the entry DTO `FamilyPartUsageEntryData` (not `FamilyPartUsageEntry`)** — Required after `DtoArchitectureTest` failed on the missing `Data` suffix. Caught by the architecture gauntlet, not by review — small reminder that the suffix rule is universal across `App\DataTransferObjects`. Renamed file + class + every reference (Action, envelope DTO, ResourceData, type aliases). Single Edit/replace_all per file kept the rename clean.

### The 200-vs-404 Judgment Call

**Verdict: 200 with empty `usages` (matches the permit's recommendation).**

The Director asked me to surface evidence either way. Here is mine:

- **Frontend flow guarantees the part is known in the family's context.** The Reverse Lookup Lens is opened from a row in the Plate's existing `/family/parts` table — every part shown there was sourced from a `storage_option_parts` row, which means the part *is* in the catalog and the family does have at least one of them. A 404 would be unreachable through the documented UX path.

- **Manually-typed URLs are a rounding-error case.** A user pasting `/family/parts/9999/4/usage` for a non-catalog part is asking "what sets of mine need this?" — and "none" is the honest answer. Returning 404 ("we don't even know this part exists") is correct in a strict sense, but the difference between "we don't know this part" and "we know it but no set needs it" is invisible to the human and adds a branch the frontend has to handle. The frontend's empty-state copy ("No sets need this brick — must be a leftover or extra") works the same for both cases.

- **The endpoint is shaped as a query, not a fetch.** Compare `/sets/{setNum}/parts` (404 if the set doesn't exist — "we cannot fulfil this fetch"). That endpoint hands back a representation of the named entity. *This* endpoint hands back a *result of a question* asked over the family's data. An empty result set is a valid answer to a question; a missing entity is a fetch failure. Different semantics, different status codes.

- **Consistency with sibling endpoints.** `GET /family-sets/missing-parts` returns 200 with empty `shortfalls` for a family with no sets. Same shape ("question over family data with possibly-empty answer") = same status code.

- **Counter-argument considered and rejected.** A 404 would let the frontend distinguish "no such part" from "no such usage" without inspecting fields. But the frontend has the part_num + color_id from the row that opened the modal — it doesn't *need* that distinction at this layer. And we'd be paying a status-code branch in every consumer for a case (manually-typed URL of a fictional part) the documented UX never produces.

I went with the permit's recommendation. The envelope payload still includes nullable `part_name` / `color_name` / etc., so a debugging consumer can tell "we looked but found no part" from "we looked and found the part, but no sets need it" — without forcing a status code branch.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass (mine) / Fail (pre-existing) | Rector clean. Pint reports the same `public/frankenphp-worker.php` `declare_equal_normalize` failure that exists on main — verified by `git stash -u && composer lint:test` on the unmodified main commit. Documented learning in project memory. |
| phpstan | Pass (mine) / Fail (pre-existing) | 6 errors, all on files I did not touch (`app/Jobs/ImportOwnedSetsJob.php`, `config/sanctum.php`, `tests/Feature/Jobs/ImportOwnedSetsJobTest.php`). Verified pre-existing on main. My new files contribute zero new PHPStan errors. |
| deptrac | Pass | 0 violations. Same-layer ResultDTO → ResultDTO dependency is allowed. |
| test:arch | Pass | 90 passed (1664 assertions). Bumped route count to 35; passes the drift guard. DTO suffix, ResourceData shape, controller method-injection, route policy presence — all green. |
| test | Pass (mine) / Fail (pre-existing) | 565 passed. The single failure is `ImportOwnedSetsJobTest > 'ImportOwnedSetsJob → it should declare Timeout...'` — pre-existing, same root cause as the PHPStan errors (Laravel queue attributes class missing in the installed version). |
| test:coverage | Pass | Unit: 100% line coverage on the new Action (38/38). Aggregate unit coverage across all Actions + Services: 100%. |
| test:feature-coverage | Pass | Feature: `FamilyController.php` 100% (18/18 statements, 7/7 methods). Aggregate controller coverage 97.4% — above the 90% floor. |
| mutation | Pass | New action MSI: **100%** (41 mutations tested, 0 escaped). Aggregate MSI across `app/Actions` + `app/Services`: 77.73% — above the 76% floor. |

## Showcase Readiness

This implementation reflects what an auditing engineer expects to find:

- **Bounded SQL.** Three queries, one round-trip each. The query budget does not grow with the number of owned sets. Documented inline as Q1 / Q2 / Q3 with the rationale for each.
- **Honest semantics.** The Result DTO docblock spells out exactly what `quantityStored` means (family-wide, repeated per entry) and warns consumers not to sum shortfalls. The Action's "is this one set covered?" question is the simple one; the aggregate question already has its own action.
- **Strict-mock unit tests.** Every mock asserts the exact SQL clause shape — column lists, join order, where-arg order, aggregate selectRaw string. A future refactor that changes the SQL has to update the mocks, which is the point: the tests are a checklist for the next sorter who touches this code.
- **Mutation-pinned.** 100% MSI on the action means every cast, every `max(0, ...)`, every `!= 'wishlist'` clause, every `(int) ($x ?? 0)` is checked by at least one assertion. No mutants escape.
- **Architecture compliance.** Final readonly Action, single execute(), DI for Models, no facades, no try-catch, ResourceData via ComputedResourceData per ADR-0010, route declared explicitly per ADR-0008, controller method-injected per ADR-0009.

What I would polish given another shift: the `castNullableString` private helper could go (its body is two lines and used four times — inlining wouldn't hurt). I kept it because the four callsites read more cleanly as one-liners with the helper, and PHPStan's narrowing got cleaner. A future stylistic pass could collapse it.

## Proposed Knowledge Updates

- **Learnings:** No new learning required — the patterns I leaned on (parameterised whereRaw inside a join closure, `(int) ($x ?? 0)` for nullable SUM, `array_values(...->all())` to satisfy `list<>`) are unsurprising. If anything graduates, it's the "Result DTO carrying a typed Collection of sibling Result DTOs is allowed and useful" observation, but that's covered by ADR-0010 already.
- **Pulse:** No active concerns surfaced. The pre-existing PHPStan/Pint/test failures on main are already known infrastructure debt unrelated to this shift.
- **Decision Record:** No ADR required — every architectural choice followed an existing ADR (0002 family scoping, 0003 Action shape, 0008 explicit routes, 0009 thin controllers, 0010 ComputedResourceData). The 200-vs-404 decision is a per-endpoint judgment, not a cross-cutting pattern.

## Self-Debrief

### What Went Well

- **Reading order paid off.** The permit said "mirror `GetFamilyMissingPartsAction`" and I read that file (action + tests) first. The result is a sibling action that the next sorter will read in five minutes because it follows the same shape.
- **Architecture tests caught the DTO suffix mistake before commit.** I named the entry class `FamilyPartUsageEntry`. `DtoArchitectureTest` failed loud and obvious. Renamed everything in three Edits with `replace_all`. No churn.
- **Mutation testing pinned the cast/max semantics.** The first test pass had 100% line coverage but I ran mutation anyway. Score was already 100% — the strict-typed `(string)`/`(int)` casts on intentionally mismatched mock rows in the multi-set test exercise the cast mutants directly. This was inherited from `GetFamilyMissingPartsActionTest`'s pattern.
- **The leftJoin-closure trick was the right call.** Avoided an extra query and an ADR-0007 facade violation. Mock infrastructure invokes the closure with a JoinClause mock so the inner `whereRaw` is covered.

### What Went Poorly

- **First draft of the leftJoin used `\Illuminate\Support\Facades\DB::raw`.** That's a facade — Action regulation forbids it. Caught by my own re-read before running anything. Cost zero cycles in practice but it's exactly the kind of slip that would have been caught by Deptrac if not by re-read.
- **First draft used `array<int, ...>` not `list<...>` in the ResourceData usages.** PHPStan flagged it on first run. Fixed with `array_values(...->all())`. The lesson — when a ResourceData declares `list<array{...}>` and is constructed from `Collection::map()->all()`, always wrap in `array_values()` because `all()` preserves keys. PHPStan is right to complain.
- **Did not consider the ResourceData constructor's `list` constraint when designing the from() factory.** I would have caught this earlier by drafting the from() shape against the constructor type signature first, then implementing.

### Blind Spots

- **I almost did not write a test that asserts exactly three queries are issued.** Acceptance criterion 3 says "at most three queries regardless of how many sets need the part." The unit test mocks each query exactly once, which proves the Action calls each builder once per call. But a feature-level `DB::listen` query-count assertion on a 5-set fixture proves it under SQLite's real query plan. After the first test pass I retrofitted exactly that — see `it should issue at most three queries regardless of how many sets need the part` in the feature suite. Lesson: when the acceptance criterion is "at most N queries," ALWAYS add a `DB::listen` assertion. Mock-once is necessary but not sufficient.
- **I did not add a test for the `cache.headers` directive being applied to the response.** The etag test is in there. The cache-control assertion is in the same test (`assertHeader('cache-control', 'max-age=60, private')`), so this is actually covered — flagging only because I almost missed it.
- **The frontend contract.** The permit says the Plate side is shipping in parallel. My response shape uses snake_case on the wire (`part_num`, `color_id`, `set_num`, `family_set_id`, `quantity_needed`, `quantity_stored`, `shortfall`, `set_name`, `status`). The `status` field is the enum's string value (`'built'`, `'in_progress'`, `'sealed'`, `'incomplete'`) — `'wishlist'` is excluded by Q2. If the Plate expects a different shape, the Director should sync. I have NOT changed the envelope unilaterally — flagging here for visibility per the deployment instructions.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| Before constructing a ResourceData via `Collection::map()->all()`, wrap the result in `array_values()` when the parameter type is `list<...>` — `->all()` preserves keys and PHPStan rejects `array<int, T>` for `list<T>` even when the keys are 0-indexed. | First PHPStan run failed on `array<int, array{...}>` vs `list<array{...}>` for the `usages` parameter; `array_values()` round-trip resolved it. | 2026-04-29-reverse-lookup-lens |
| When designing a Result DTO that an existing Action precedent stores as array shapes (e.g., `FamilyMissingPartsData` shortfalls), re-read the permit before defaulting to that pattern — the permit may explicitly require nested typed DTOs, in which case verify the same-layer dependency is allowed by deptrac and check existing Input-layer precedent. | I almost defaulted to flat array shapes (the cheap path) before re-reading "Result DTO carrying ... `Collection<FamilyPartUsageEntry>`" in the permit. The same-layer dependency is allowed but not previously used in the Result layer; verifying it on the Input side first (`RebrickableUserSetData` → `LegoSetData`) saved a deptrac round-trip. | 2026-04-29-reverse-lookup-lens |
| When writing a unit test mock for an action that uses a `leftJoin('table', Closure)`, use `\Mockery::on(static fn(\Closure $closure): bool => $closure($joinClauseMock) ?: true)` to invoke the closure body — otherwise the closure body is uncovered (line coverage shows the gap, mutation testing also does). | First coverage run hit 98.7% on the action because the leftJoin closure body (the `whereRaw` parameter binding) was unreached. Refactoring `buildMetadataQuery` to invoke the closure against a JoinClause mock raised it to 100%. | 2026-04-29-reverse-lookup-lens |
| When the shipping order's acceptance criteria include an "at most N queries" budget, always add a feature-level `DB::listen` query-count test on a fixture sized larger than the budget — mock-once unit tests are necessary but do not prove the SQL planner respects the budget under real fixtures. | I almost shipped without a query-count test, relying on the strict mock once-counts. Mocks prove the Action's intent; `DB::listen` proves the runtime behaviour. Both are needed when "at most N" is the contract. | 2026-04-29-reverse-lookup-lens |

---

## Logistics Director Evaluation

_Appended by the Logistics Director after reviewing the log. The sorter's sections above are not edited — they stand as written._

**Filed retroactively 2026-05-05** — the original shift was completed 2026-04-29 and merged via `db9172c`; the Director Evaluation was not appended at filing time. This evaluation closes that accountability gap, surfaced as Finding 5 in the 2026-05-05 full sweep audit.

**Overall Assessment:** Excellent shift. Portfolio-quality delivery against a substantive permit. The bounded-SQL discipline, mutation-pinned testing, and explicit Q1/Q2/Q3 query budget make this a reference implementation for the next bulk-aggregation endpoint.

### Order Fulfillment Review

All five acceptance criteria met. The bounded-query proof via `DB::listen` query-count assertion on a 5-set fixture is over-and-above what the permit required — it converts "at most three queries" from a design intent into a runtime invariant. That's the kind of unprompted depth that strengthens the warehouse, not scope creep.

The same-layer `ResultDTO → ResultDTO` reference (`FamilyPartUsageData → FamilyPartUsageEntryData`) is a genuine architectural innovation. Verified deptrac allows it; the Sorter cited the existing Input-layer precedent (`RebrickableUserSetData → LegoSetData`) as the pattern to mirror. This kind of "find the precedent before assuming you need a new pattern" reasoning is exactly what ADR-0010's evolution rewards.

### Decision Review

**Decision 1 (200 vs 404 for unknown part):** Sound. The Sorter's articulation of the underlying semantics — "the endpoint is shaped as a query, not a fetch" — is the right way to think about this. A query over family data with a possibly-empty answer is 200; a missing entity fetch is 404. The consistency with `GET /family-sets/missing-parts` clinches it.

**Decision 2 (per-entry shortfall semantics, repeating `quantityStored`):** Sound. The "is this one set covered?" framing matches the Reverse Lookup Lens's UX intent. Distributing stored proportionally across entries would invent a policy the user didn't ask for. Documenting the no-summing constraint on the DTO docblock is a sharp move — future consumers can't misread the shape.

**Decision 3 (same-layer ResultDTO → ResultDTO):** Approved as documented. The deptrac verification + Input-layer precedent citation makes this defensible. Worth noting that the audit's Finding 7 remediation will amend ADR-0010 to formalize the Input/Result split rule — at that point, the same-layer dependency rule should be made explicit in the ADR text. Flagging as a follow-up for the paper-trail order.

**Decision 4 (parameterised `whereRaw` in leftJoin closure):** Approved. The +1-query alternative would have breached the documented three-query budget; `DB::raw` would have breached ADR-0007. The leftJoin-closure trick is the cleanest in-budget option. Mutation tests pin the closure body — exactly what the testing strategy should look like.

**Decision 5 (renamed `FamilyPartUsageEntry` → `FamilyPartUsageEntryData`):** Forced by `DtoArchitectureTest` — the architecture gauntlet doing its job. No judgment needed; the rule is universal.

No decisions needed escalation. The 200-vs-404 judgment was the only one that flirted with that line, and the Sorter's articulation made it self-justifying.

### Showcase Assessment

This shift strengthens the portfolio materially. A senior architect auditing this code would find:

- Bounded SQL with documented Q1/Q2/Q3 rationale
- 100% MSI on a non-trivial Action (41 mutations, 0 escaped)
- Strict-mock unit tests that lock SQL clause shape per query
- A feature-level `DB::listen` query-count test that proves the budget under real fixtures
- Same-layer ResultDTO innovation with explicit precedent citation
- Honest semantics in the DTO docblock (no-summing constraint documented)

The polish opportunity the Sorter flagged (`castNullableString` private helper) is genuine but minor — the helper improves readability at four call-sites, and PHPStan narrowing is cleaner with it. Not worth a follow-up shift.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| Before constructing a ResourceData via `Collection::map()->all()`, wrap in `array_values()` when the parameter type is `list<...>` | **Candidate** | Concrete, recurring PHPStan/typing pattern. Will repeat on every nested-list ResourceData. First confirming observation logged. |
| When designing a Result DTO that an existing precedent stores as array shapes, re-read the permit before defaulting to the cheaper pattern | **Drop** | Generic "read the order carefully" framed as a learning. Hard to formalize as a structural check; it's diligence, not pattern. The graduated 2026-05-03 training about verifying permit claims via filesystem already covers the broader "permit text is design intent; verify before defaulting" principle from a different angle. No new candidate needed. |
| When mocking a leftJoin-with-Closure for unit coverage, invoke the closure against a JoinClause mock — otherwise the closure body is uncovered | **Candidate** | Specific recurring testing technique. Will apply to every Action that uses `leftJoin(table, Closure)` for parameterised joins. Mutation testing surfaced the gap; first confirming observation. |
| When the shipping order's acceptance criteria include an "at most N queries" budget, always add a feature-level `DB::listen` query-count test on a fixture sized larger than the budget | **Candidate** | Strong proposal. Mock-once unit tests prove the Action's *intent*; `DB::listen` proves the *runtime behaviour*. Both are needed when "at most N" is the contract. Will recur on bulk aggregation endpoints. First confirming observation logged; this one is graduation-track. |

### Notes for the Sorter

This shift is a reference implementation. Points worth repeating:

- **The "I almost did not write a query-count test" self-flag.** That's the kind of self-awareness the warehouse rewards. Catching the gap before it ships is the whole point.
- **Reading the precedent first.** The permit said "mirror `GetFamilyMissingPartsAction`" and the Sorter read it before designing. Result: a sibling action that the next sorter will read in five minutes.
- **The DTO docblock no-summing constraint.** Documenting semantic constraints at the DTO layer (not just in the calling code) is excellent forward-defense. Future consumers can't misread the shape.

One small note for next time: the same-layer ResultDTO precedent citation was correctly verified, but the citation lived in the shift log's Decisions Made section, not in the ADR-0010 text. That is the right place — ADR amendments are Director-side work, not Sorter-side. But when the paper-trail order amends ADR-0010 (sibling order `2026-05-05-audit-remediation-5-paper-trail`), this same-layer dependency rule should be folded into the amendment so the precedent is captured architecturally, not just journal-archaeologically.

### Note on the Frontend Contract Blind Spot

The Sorter's blind-spot self-flag about the wire shape (snake_case fields, `status` enum string value) is well-placed. The Plate side shipped in parallel and the contract held. Future shifts producing wire shapes for cross-repo consumers should continue this pattern — flag the contract explicitly, do not unilaterally adjust.
