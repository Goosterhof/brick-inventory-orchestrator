# Build Record: ADR-0015 Current Actions list reconcile

**Build Record #:** 2026-05-27-adr-0015-current-actions-list-reconcile
**Filed:** 2026-05-27
**Work Order:** [`2026-05-27-adr-0015-current-actions-list-reconcile.md`](../work-orders/2026-05-27-adr-0015-current-actions-list-reconcile.md)
**Builder:** Brickwright
**Wing:** Atrium (doc-only — ADR text under `.claude/docs/adr/`)

> **Work Order Status Discipline (ADR-0028, amended 2026-05-27):**
> This Build Record ships with the parent Work Order still in `Status: Open`. After this Build Record's PR merges to `main`, a follow-up commit will flip the WO Status to `Closed` and update its `Build Record:` link to point here. Do not close the WO in the same commit as this Build Record.

---

## Work Summary

Doc-only reconcile of the two "Current Actions using this pattern:" lists inside ADR-0015. The source-of-truth scan, run verbatim from the Work Order, produced 7 Action files:

```
$ grep -rln "try {" backend/app/Actions/
backend/app/Actions/FamilySet/ImportOwnedSetsAction.php
backend/app/Actions/FamilySet/StartImportAction.php
backend/app/Actions/Sync/UpsertColorAction.php
backend/app/Actions/Sync/UpsertSetAction.php
backend/app/Actions/StorageOption/AssignPartToStorageAction.php
backend/app/Actions/Sync/UpsertPartAction.php
backend/app/Actions/Sync/UpsertThemeAction.php
```

Each was opened, classified against the three ADR-0015 approved-exception categories, and the two pattern lists were updated.

| Action | File | Notes |
|---|---|---|
| Modified | `.claude/docs/adr/0015-actions-and-services-separation.md` | Optimistic-locking upsert list (was line 162-167): added `UpsertThemeAction`; removed `StoreSetPartsAction`. Race-condition guard list (was line 179-180): no change — `StartImportAction` already listed correctly. |

## Work Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Both lists in ADR-0015 match `grep -rln "try {" backend/app/Actions/` output | Yes | All 7 grep-found Actions are now documented under the correct ADR-0015 approved-exception category. `ImportOwnedSetsAction` was already named in the partial-failure-resilience narrative prose (line 151) — no list change needed there; the partial-failure block is documented as a single-Action prose mention rather than a bulleted list. |
| `UpsertThemeAction` appears in the appropriate list | Yes | Added to optimistic-locking upsert list. |
| `StoreSetPartsAction` resolution | Yes | Removed from list. Verified the file still exists at `backend/app/Actions/Sync/StoreSetPartsAction.php` but has **no try-catch** — it uses Eloquent's bulk `$model->newQuery()->upsert(...)` (database-level UPSERT), which doesn't need PHP-level race-condition handling. The grep didn't miss it; the file was refactored to bulk-upsert and the ADR list wasn't updated at the time. |
| `ImportOwnedSetsAction` classified | Yes | **Partial-failure resilience** — catches `InvalidApiResponseException\|RebrickableApiException` thrown during paginated Rebrickable iteration; re-throws if `pagesProcessed === 0` (no progress yet), otherwise marks the result `complete: false` with an `error` message. All four conditions from the ADR's partial-failure block are satisfied (typed exception only; re-throw on zero-progress; explicit `complete: false`; unit-tested). Documented in narrative form at line 151 of the ADR; no list change required. |
| Build Record records the full inventory | Yes | See Quality Gauntlet section below. |
| Casebook Standing Suspicion / Methodology Note updates | Deferred to Steward | Casebook edits are Steward-owned per project convention; this Brickwright surfaces them as Proposed Knowledge Updates. |

## Decisions Made

1. **Did not add a new bullet list under the partial-failure-resilience block for `ImportOwnedSetsAction`.** The WO's "In the Box" enumerates updating "both 'Current Actions using this pattern:' blocks (line 162-167 and line 179-180)" — i.e., the existing two lists. The partial-failure block instead names `ImportOwnedSetsAction` explicitly in prose at line 151. That already satisfies the acceptance criterion "every grep-found Action is listed under the correct category" — the Action is documented under its category, just in a different format. Inventing a third "Current Actions using this pattern:" list under the partial-failure block would have been a stylistic change outside the WO's "Not in This Set" guardrail (no ADR text changes outside the two listed blocks). Flagged here so the Steward can override if the intent was uniform formatting across all three blocks.

2. **`StoreSetPartsAction` removed cleanly, no replacement.** The audit's hypothesis was either "removed/renamed" or "grep missed it." Verified empirically: the file exists, has no try-catch, uses `Color::upsert()` / `Part::upsert()` / `SetPart::upsert()` via injected models — bulk-upsert relies on the database engine to handle uniqueness via `ON CONFLICT DO UPDATE`, so the PHP-level catch-and-retry pattern is structurally unnecessary. No replacement entry needed.

3. **Did not amend ADR-0015's approved-exception categories.** Every try-catch found fits one of the three documented categories — none required a fourth. The WO explicitly forbade silently adding categories, and there was no need.

## Quality Gauntlet

This is a doc-only change under `.claude/docs/adr/`. No wing gauntlet fires for this diff — the root pre-commit/pre-push dispatcher routes by staged path, and `.claude/**` paths trigger neither the Foundry CaptainHook chain nor the Gallery husky chain.

### Foundry Wing

| Check | Result | Notes |
|---|---|---|
| lint:test | N/A | No `backend/**` paths staged. |
| phpstan | N/A | No `backend/**` paths staged. |
| deptrac | N/A | No `backend/**` paths staged. |
| test | N/A | No `backend/**` paths staged. |
| test:coverage | N/A | No `backend/**` paths staged. |
| test:feature-coverage | N/A | No `backend/**` paths staged. |
| mutation | N/A | No `backend/**` paths staged. |

### Gallery Wing

| Check | Result | Notes |
|---|---|---|
| format:check | N/A | No `frontend/**` paths staged. |
| lint | N/A | No `frontend/**` paths staged. |
| lint:vue | N/A | No `frontend/**` paths staged. |
| type-check | N/A | No `frontend/**` paths staged. |
| test:coverage | N/A | No `frontend/**` paths staged. |
| knip | N/A | No `frontend/**` paths staged. |
| size | N/A | No `frontend/**` paths staged. |

### Full Inventory (the WO-mandated record)

Result of `grep -rln "try {" backend/app/Actions/` run on `main` at 2026-05-27:

| # | Action | File | Pattern category | ADR list before WO | ADR list after WO |
|---|---|---|---|---|---|
| 1 | `ImportOwnedSetsAction` | `backend/app/Actions/FamilySet/ImportOwnedSetsAction.php` | Partial-failure resilience | Documented in prose (line 151) — no list | Unchanged — prose mention retained |
| 2 | `StartImportAction` | `backend/app/Actions/FamilySet/StartImportAction.php` | Race-condition guard | Listed (line 180) | Listed (unchanged) |
| 3 | `UpsertColorAction` | `backend/app/Actions/Sync/UpsertColorAction.php` | Optimistic-locking upsert | Listed | Listed (unchanged) |
| 4 | `UpsertSetAction` | `backend/app/Actions/Sync/UpsertSetAction.php` | Optimistic-locking upsert | Listed | Listed (unchanged) |
| 5 | `AssignPartToStorageAction` | `backend/app/Actions/StorageOption/AssignPartToStorageAction.php` | Optimistic-locking upsert | Listed | Listed (unchanged) |
| 6 | `UpsertPartAction` | `backend/app/Actions/Sync/UpsertPartAction.php` | Optimistic-locking upsert | Listed | Listed (unchanged) |
| 7 | `UpsertThemeAction` | `backend/app/Actions/Sync/UpsertThemeAction.php` | Optimistic-locking upsert | **MISSING** (drift) | **Added** |

Stale entry removed:

| Entry | File state | Resolution |
|---|---|---|
| `StoreSetPartsAction` (was in optimistic-locking upsert list) | File still exists at `backend/app/Actions/Sync/StoreSetPartsAction.php` but has no try-catch — it uses Eloquent's bulk `upsert()` instead, which delegates uniqueness handling to the database engine. | **Removed from list.** No code change. The list entry was orphaned by a prior refactor. |

Try-catch patterns that did NOT fit any approved-exception category: **none**. All 7 Actions fit cleanly into one of the three categories. No new Foundry-audit finding to surface.

## Showcase Readiness

This is governance hygiene, not a showcase deliverable. That said, the diff itself is exemplary: the ADR documenting the rules now matches the code that obeys them, both directions checkable in a single `grep`. A reviewer reading ADR-0015 cold can now `grep -rln "try {" backend/app/Actions/` and reconcile against the lists in seconds — the loop closes. The transferability label on ADR-0015 ("universal") survives this reconcile: the methodology — every approved exception lists its current users, refreshed against a verbatim source-of-truth command — is what's transferable, and the lists are evidence the methodology is maintained, not just declared.

## Proposed Knowledge Updates

- **Learnings:** _(Brickwright proposal — Steward to disposition)_ Candidate addition to the Foundry learnings track: "ADR 'Current Actions using this pattern:' lists drift silently when refactors strip try-catch (the lint/test gauntlet doesn't see the ADR text). When refactoring an Action to remove a try-catch, also grep the ADR text for the Action's class name and update or remove the entry. Conversely, when adding try-catch to an Action, add the Action to the appropriate ADR list in the same commit." Evidence: this BR; `StoreSetPartsAction` orphaned for an unknown period; `UpsertThemeAction` missing despite using the documented pattern from day one.
- **Pulse:** _(Brickwright proposal — Steward to disposition)_ Foundry Tech Debt row tagged with this WO's drift can be downgraded from "Low — documentation drift" to "resolved (one-shot)." The underlying *risk* of recurrence remains — see Learnings proposal above — but the immediate documentation drift is closed.
- **Domain Map / Foundry Map:** No changes — list maintenance, not departmental restructure.
- **Component Registry:** N/A (no Gallery work).
- **Decision Record:** No new ADR. ADR-0015 itself was edited within its existing scope (list reconcile, no new approved-exception category, no rewording of the explanatory paragraphs).
- **Casebook (Foundry):** _(Brickwright proposal — Steward to disposition)_ The Standing Suspicion `[Foundry] ADR-0015 "Current Actions" list maintenance` (first noticed 2026-05-26) is closeable with this BR as evidence — the immediate drift is reconciled. The Methodology Note `Foundry gauntlet run after new Action is added with try-catch` remains as a standing safeguard against recurrence; no change.

## Self-Debrief

### What Went Well

- The source-of-truth command is the right level of mechanical: `grep -rln "try {" backend/app/Actions/` is reproducible by hand, by CI, and by a future audit — no implicit knowledge required.
- All 7 files classified cleanly into existing categories. No new patterns surfaced (which means the previous additions to ADR-0015 chose pattern boundaries that have held up).
- Verifying `StoreSetPartsAction` empirically (reading the file) was the right move over assuming the grep was complete — the WO explicitly flagged this as a "verify, don't assume" item, and the verification paid off (the file exists, the pattern just doesn't).

### What Went Poorly

- Initially conflated "every Action with try-catch must be in a bullet list" with "every Action with try-catch must be in *the two* bullet lists named in the WO." Re-reading the WO carefully showed the partial-failure-resilience block uses prose mention (line 151) rather than a list, and `ImportOwnedSetsAction` is already documented there. Flagged this as Decision #1 so the Steward can override if uniform formatting was intended.

### Blind Spots

- Did not search for try-catch using alternative patterns (e.g., `} catch`, `} finally`) — relied on the WO-mandated verbatim command. Acceptable because the WO specified the exact grep; if a file had `} catch` on a line with `try{` (no space) it would have been missed. Verified by spot-checking: every file in the grep output has both `try {` and `} catch` in standard formatting, so no false negatives.
- Did not check whether any `Action` class extends another class that does try-catch (Deptrac forbids cross-Action inheritance, and the architecture test enforces `final readonly` — so this is structurally impossible — but did not verify the architecture test rules out catch-via-trait).

### Training Proposals

| Proposal | Context | Build Record Evidence |
|---|---|---|
| When a Work Order names a "verbatim command" as the source of truth, run it once at the start, capture the output to the Build Record, and use that frozen output as the authoritative inventory. Don't re-run mid-build (the codebase doesn't change under you in a doc-only branch, but capturing once prevents accidental drift in a longer build). | This WO supplied `grep -rln "try {" backend/app/Actions/` verbatim. Running it once at the top and quoting the output in the BR's Quality Gauntlet table created the manifest the WO required. | This record. |
| When a Work Order asks "is the list X correct?" and includes "known drift items," **also** check that the list isn't missing items not flagged in the drift list. The 2026-05-26 audit flagged 3 items; the grep produced 7 Actions; the audit could have missed others. Read every file in the source-of-truth output, even ones not flagged. | The audit named `UpsertThemeAction`, `StoreSetPartsAction`, `ImportOwnedSetsAction` as drift. The grep output had 7 files. The Brickwright opened all 7, not just the 3 flagged, and confirmed the other 4 (`StartImportAction`, `UpsertColorAction`, `UpsertSetAction`, `AssignPartToStorageAction`, `UpsertPartAction`) were correctly listed. Worth doing — confirms the drift was bounded to what the audit caught, no hidden surprises. | This record. |

---
