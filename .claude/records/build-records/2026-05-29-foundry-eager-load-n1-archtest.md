# Build Record: Foundry — EAGER_LOAD N+1 Fix + Arch-Test Coverage Check

**Filed:** 2026-05-29
**Wing:** Foundry (`backend/`)
**Builder:** Brickwright
**Work Order:** [`2026-05-29-foundry-eager-load-n1-archtest`](../work-orders/2026-05-29-foundry-eager-load-n1-archtest.md)

---

## Summary

Sweep finding **F-debt-1** (High): `FamilySetResourceData::EAGER_LOAD = ['set']` omitted the nested `set.theme` relation that the nested `SetSummaryResourceData` requires (`EAGER_LOAD = ['theme']`). On the family-sets **index**, base `loadMissing(['set'])` loaded `set` once, then each nested `SetSummaryResourceData::from()` ran a per-item `loadMissing(['theme'])` → one `themes` query per row (N+1). Self-healing `loadMissing` kept the output correct, and the gauntlet passed because `ResourceDataArchitectureTest` only asserted that an `EAGER_LOAD` constant *existed* on a nesting class — never that it *covered* the nested resource's required relations.

Fixed the symptom (the constant), the root cause (a strengthened arch test that now enforces nested-resource coverage mechanically), and added a query-count proof. One adjacent latent bug surfaced and was fixed along the way (`validateRelationsLoaded` did not understand dot-notation).

## What Changed

### 1. Symptom — `backend/app/Http/Resources/FamilySetResourceData.php`

```php
public const array EAGER_LOAD = ['set', 'set.theme'];   // was ['set']
```

Mirrors the dot-notation pattern in `SetWithPartsResourceData` (`['theme', 'setParts.part', 'setParts.color']`). Base `loadMissing` now loads `set` and its `theme` in one pass; the nested `SetSummaryResourceData::from()` finds `theme` already hydrated and fires no extra query.

**Adjacent-relation audit (per WO):** `FamilySetResourceData` nests only `SetSummaryResourceData` (one relation, `set`). No other nested relations on this resource — `set.theme` is the complete gap. No further fix needed on this class.

### 2. Root cause — `backend/tests/Architecture/ResourceDataArchitectureTest.php`

Added a helper `discoverNestedResourceRelations(\ReflectionClass)` and a new arch test: **"should declare EAGER_LOAD entries that cover every nested resource's required relations."**

The helper parses each concrete resource's `from()` method body and maps every nested-resource construction to the model relation it is sourced from. It recognises both nesting forms used in this wing:

- **Form 1 (direct):** `SetSummaryResourceData::from($model->set)` — regex `(\w+ResourceData)::from\(\$model->(\w+)\)`
- **Form 2 (array-mapped):** `array_map(SetPartResourceData::from(...), $model->setParts->all())` — regex `(\w+ResourceData)::from\(\.\.\.\)\s*,\s*\$model->(\w+)`

For every discovered nesting `Parent → Nested via $model->relation`, the test asserts:

1. **The relation is eager-loaded** — `relation` appears in the parent's `EAGER_LOAD`, *or* a dotted entry `relation.*` does (Eloquent loads the intermediate relation when a dotted child is requested — so `setParts.part` covers `setParts`). This branch was added after the rule false-positived on `SetWithPartsResourceData`, which declares only `setParts.part`/`setParts.color`, never the bare `setParts` (literal-compliance / ADR-000 lens).
2. **Each of the nested resource's own required relations is declared relation-prefixed** — for every entry `x` in the nested resource's `EAGER_LOAD`, `relation.x` must appear in the parent's `EAGER_LOAD`. This is the clause that catches the F-debt-1 N+1: nested `SetSummaryResourceData` requires `theme`, so the parent must declare `set.theme`.

#### Recognized-forms contract (and the guard's ceiling)

`discoverNestedResourceRelations` is a **regex over `from()` source text**, not type-aware analysis. It recognises exactly the two construction forms above and **nothing else**. A nested resource constructed any other way silently escapes the coverage check with no failing test — e.g. binding the relation to a local first (`$set = $model->set; … SetSummaryResourceData::from($set)`), or mapping a loaded collection through a named helper instead of an inline `array_map`. The test still passes and an N+1 can reappear exactly as F-debt-1 did. This is the known ceiling of a regex-over-source arch guard, not a defect in this diff (every nesting in the wing today uses one of the two recognised forms).

To keep the guard load-bearing, the recognised forms are **doctrine, not tacit knowledge living in two regexes**:

> **Nested-resource construction contract.** Inside a `ResourceData::from()`, a nested resource MUST be constructed inline as either `NestedResourceData::from($model->relation)` (direct) or `array_map(NestedResourceData::from(...), $model->relation…)` (collection). Constructing it any other way — via a local variable, a helper method, a match arm — is invisible to the EAGER_LOAD coverage guard and reintroduces the N+1 risk the guard exists to catch.

A type-aware successor (resolving the nested-resource graph from `from()`'s actual expression types rather than source regex) would lift this ceiling; logged as a candidate below, not in scope here.

#### Red/green proof (both directions)

| `FamilySetResourceData::EAGER_LOAD` | `composer test:arch` |
|---|---|
| `['set']` (pre-fix) | **RED** — `ResourceData class App\Http\Resources\FamilySetResourceData nests App\Http\Resources\SetSummaryResourceData (which requires "theme") from $model->set, but EAGER_LOAD omits "set.theme" — this fires an N+1 (one query per row) on collection endpoints` — 1 failed, 107 passed |
| `['set', 'set.theme']` (fixed) | **GREEN** — 108 passed (1871 assertions) |

Verified by temporarily reverting the constant, running `test:arch` (confirmed red with the exact message above), then restoring.

### 3. Latent bug fixed — `backend/app/Http/Resources/ResourceData.php`

Adding the dotted `set.theme` entry exposed a bug in the abstract base's `validateRelationsLoaded()`: it called `$model->relationLoaded('set.theme')`, but Eloquent's `relationLoaded()` does **not** understand dot-notation — it looks for a literal relation named `set.theme` on the `FamilySet` model, which never exists, so it always reported the relation missing. The first run of the new query-count test caught this as a 500 (`MissingRelationException: ... missing required relation(s): set.theme`).

`SetSummaryResourceData` / `SetWithPartsResourceData` never hit this because they only call `loadMissing()` (no `validateRelationsLoaded`). `FamilySetResourceData` and `StorageOptionResourceData` are the two resources that call `validateRelationsLoaded`.

Fix: `validateRelationsLoaded` now validates only the **root segment** of each (possibly dotted) relation — `explode('.', $relation)[0]` reduces `set.theme` → `set` and `theme` → `theme` (always a string, so no no-dot special case).

**Framing correction (the nested segment is self-healed, not loudly validated).** An earlier draft of this record — and the WO Steward note — claimed that after this loosening "the ADR-0019 loud-failure guarantee holds end-to-end because the nested resource's own `from()` validates the nested segment." That overstates it. `SetSummaryResourceData::from()` calls only `loadMissing(self::requiredRelations())`; it does **not** call `validateRelationsLoaded` (only `FamilySetResourceData` and `StorageOptionResourceData` do). So if `set.theme` were dropped from the parent's `EAGER_LOAD` again, the nested `theme` segment would be **self-healed by `loadMissing`** — correct output, but the per-row N+1 returns — *not* a loud `MissingRelationException`. The runtime behaviour is right either way (no 500, no broken output), but the **loud-failure guarantee for the nested segment now lives at CI time in the new arch test, not at runtime.** That is a deliberate, acceptable tradeoff — the root-segment loosening was required to stop `relationLoaded()` misfiring on dot-notation — but it *shifts* that segment's enforcement from runtime to CI rather than preserving end-to-end runtime loud-failure. The root segment (`set`) is still loudly validated at runtime as before.

### 4. Query-count proof — `backend/tests/Feature/Controllers/FamilySetControllerTest.php`

Added to the `index` describe block: **"should issue a single themes query regardless of how many family sets are listed."** Creates 5 owned sets each with a distinct theme (`Set::factory()->withTheme()` — the default factory leaves `theme_id` null, which would skip the themes query entirely and prove nothing), listens on `DB::listen`, hits `GET /api/family-sets`, and asserts exactly one query touches `from "themes"`. Mirrors the existing `DB::listen` + table-filter pattern already used in `FamilyControllerPartUsageTest`.

#### Query-count numbers (before/after)

| `FamilySetResourceData::EAGER_LOAD` | themes queries on 5-row index |
|---|---|
| `['set']` (pre-fix) | **5** — one per row (the N+1); test red: `actual size 5 matches expected size 1` |
| `['set', 'set.theme']` (fixed) | **1** — the single eager load; test green (3 assertions) |

## Acceptance Criteria (from WO)

- [x] `FamilySetResourceData::EAGER_LOAD` includes `set.theme`.
- [x] `ResourceDataArchitectureTest` asserts nested-resource EAGER_LOAD coverage and fails on the old constant (red/green proof above).
- [x] A query-count assertion proves the family-sets index has no per-row theme query (5 → 1).
- [x] Backend gauntlet green (lint:test, phpstan, deptrac, test:arch, test).
- [x] Build Record filed; further EAGER_LOAD offenders the new arch test surfaces are listed below (none).

## Other EAGER_LOAD offenders surfaced by the new arch test

**None.** I ran the strengthened rule against all 21 resources. The full nesting inventory and its coverage verdict:

| Parent | Nests | via relation | Nested EAGER_LOAD | Parent declares | Verdict |
|---|---|---|---|---|---|
| `FamilySetResourceData` | `SetSummaryResourceData` | `set` | `['theme']` | `['set','set.theme']` | covered (was the bug) |
| `SetWithPartsResourceData` | `ThemeResourceData` | `theme` | `[]` | `['theme','setParts.part','setParts.color']` | covered |
| `SetWithPartsResourceData` | `SetPartResourceData` | `setParts` | `['part','color']` | `['theme','setParts.part','setParts.color']` | covered (bare `setParts` satisfied by `setParts.*`) |
| `SetPartResourceData` | `PartResourceData` / `ColorResourceData` | `part` / `color` | `[]` / `[]` | `['part','color']` | covered |
| `StorageOptionPartResourceData` | `PartResourceData` / `ColorResourceData` | `part` / `color` | `[]` / `[]` | `['part','color']` | covered |
| `SetSummaryResourceData` | `ThemeResourceData` | `theme` | `[]` | `['theme']` | covered |

`StorageOptionResourceData` nests no child resource (it plucks `children->pluck('id')`, never constructs a child resource), so it is not flagged — correct. `FamilySetResourceData` was the sole offender. No follow-up WO needed.

## Verification

All commands run from `backend/` cwd. Host PHP confirmed **8.5.5**; `update-alternatives --display php` → link best version `/usr/bin/php8.5`.

| Command | Result |
|---|---|
| `composer lint:test` | PASS — `[OK] Rector is done!`, `{"tool":"pint","result":"passed"}` |
| `composer phpstan` | PASS — `[OK] No errors` |
| `composer deptrac` | PASS — 0 errors (744 allowed, 581 uncovered, 0 warnings) |
| `composer test:arch` | PASS — 108 passed (1871 assertions) |
| `composer test` | PASS — 702 passed (2880 assertions) |
| `composer test:coverage` | PASS — Total 100.0% (unit/Actions/Services/Mail) |
| `composer test:feature-coverage` | PASS — 227 passed, Total 100.0% (gate is 90%) |

`composer mutation` was not part of the WO verification list and was not run.

## Decisions Made

- **`validateRelationsLoaded` validates root segments only.** The alternative — teaching it to traverse dotted relations (`$model->set->relationLoaded('theme')`) — would re-walk the relation tree and duplicate work the nested resource's own `from()` already does. Root-segment validation keeps the guard meaningful (it still catches an unloaded `set`) without misfiring on dot-notation, and matches the existing contract that each resource validates its own direct relations.
- **The arch rule accepts `relation.*` as satisfying the bare-relation requirement.** Without this, the rule would have flagged the *correctly-written* `SetWithPartsResourceData` (`setParts.part`, no bare `setParts`) as a violation — a false positive. Eloquent loads the intermediate relation when a dotted child is eager-loaded, so `setParts.part` genuinely covers `setParts`.
- **Query-count test uses `withTheme()`.** The default `SetFactory` leaves `theme_id` null, and a null belongsTo FK makes Eloquent skip the themes query entirely — which would make the test pass for the wrong reason (0 queries) and never catch the N+1. Explicit themes are required for the proof to bite.

## Self-Debrief

What went cleanly: the symptom fix and the arch-test design were straightforward. The red/green discipline (revert → confirm red → restore) is what surfaced the precise failure message and gave confidence the rule actually bites.

What didn't go cleanly (three iterations on the arch rule before green):
1. **Pest `toContain` is variadic, not message-bearing.** I initially passed a sprintf message as `toContain`'s second argument — Pest treats that as a *second needle to also contain*, so the assertion failed spuriously. Switched to `expect(in_array(...))->toBeTrue($message)`.
2. **Literal bare-relation check false-positived** on `SetWithPartsResourceData` — caught by running the rule against the whole codebase, exactly the audit-before-build step. Added the `relation.*` acceptance branch.
3. **`relationLoaded` dot-notation latent bug** — only the runtime query-count test caught this (the arch test is static and never executes `from()`). Strong argument for pairing a static arch guard with a runtime proof; neither alone would have caught everything.

The chain `static arch rule → runtime query-count test → coverage gate` each caught a different defect. That triangulation is the takeaway.

## Proposed Knowledge Updates

- **Foundry learning candidate:** "Pest's `expect(...)->toContain($a, $b)` treats every argument as a needle to match, not a failure message. For a custom message on a containment check, use `expect(in_array($needle, $haystack, true))->toBeTrue($message)`." First observation — logging as a candidate, not graduating.
- **Foundry learning candidate:** "Eloquent `Model::relationLoaded()` does not understand dot-notation — `relationLoaded('set.theme')` checks for a literal `set.theme` relation and always returns false. Any code validating dotted eager-load entries must validate root segments only." Surfaced here; relevant to any future dotted `EAGER_LOAD` addition on a resource that calls `validateRelationsLoaded`.

- **Foundry doctrine candidate (added on PR #147 review):** the EAGER_LOAD coverage guard is a regex over `from()` source and only sees the two inline construction forms (`::from($model->relation)` and `array_map(::from(...), $model->relation…)`). A nested resource built any other way escapes it silently. The "Nested-resource construction contract" stated in §2 above should graduate to a convention note (or `ResourceData` PHPDoc) so the constraint is enforced doctrine rather than tacit regex knowledge; a type-aware successor that resolves the nesting graph from expression types would lift the ceiling entirely.

These are proposals for The Steward to review — not written to the knowledge base by me.

---

*Filed by the Brickwright. The Steward appends evaluation below.*
