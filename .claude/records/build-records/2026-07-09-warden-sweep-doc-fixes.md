# Build Record: Cross-wing doc-drift fixes from the 2026-07-09 Warden sweep

**Build Record #:** 2026-07-09-warden-sweep-doc-fixes
**Filed:** 2026-07-09
**Builder:** Brickwright (cross-wing)
**Wing:** Atrium (both wing manuals + one Gallery lint config)
**Work Order:** [`2026-07-09-warden-sweep-doc-fixes`](../work-orders/2026-07-09-warden-sweep-doc-fixes.md)
**Audit source:** [`2026-07-09-warden-cross-wing-sweep`](../audits/2026-07-09-warden-cross-wing-sweep.md)
**Branch:** `warden-sweep-doc-fixes` (slug matches the WO per PrePushPermitGate convention; docs-only diff is under the gate's threshold regardless)

---

## Work Summary

Reconciled seven doc-vs-code drifts (4 medium + 3 low) confirmed by the 2026-07-09 cross-wing sweep. Per the WO's critical rule, every item was re-verified against its source-of-truth file before writing — none was taken from the audit text alone. Code is canonical in all seven cases; no runtime behavior changed. The single non-markdown edit removes a dead lint override whose file pattern (`src/shared/services/storage.ts`) matches nothing since the fs-storage extraction.

## What Changed, Per Finding

### F-arch-1 (medium) — `backend/CLAUDE.md` › Controllers

- **Source of truth verified:** `.claude/docs/adr/0021-thin-controllers-method-injection.md` — line 39 shows `FamilySetResourceData::from($familySet)->toResponseWithStatus(201)` *inside a controller* as the canonical example; line 45 mandates "Return `JsonResponse` or `array` — never ResourceData directly (controllers call `->toResponse()`)".
- **Fix:** Replaced the bullet "No `ResourceData` construction — Actions return the shaped data" with: construct `ResourceData` in the controller via `::from()` and return `->toResponse()` / `->toResponseWithStatus()`; Actions return Models or Result DTOs, never `ResourceData` (ADR-0021).

### F-doc-1 (medium) — `backend/CLAUDE.md` › Exceptions

- **Source of truth verified:** `backend/bootstrap/app.php:66-99` — counted **12** `$exceptions->render(...)` closures (read in full, not taken from the audit).
- **Fix:** The Exceptions block now enumerates all 12 mappings in file order, with a "source of truth: `bootstrap/app.php`" pointer:
  - `SetNotFoundException` → 404
  - `MissingRebrickableTokenException` → 400
  - `NotFamilyHeadException` → 403
  - `RebrickableApiException` → 502 (404 when the upstream 404s — per the `match` on `statusCode`)
  - `BrickognizeApiException` → 502
  - `InvalidApiResponseException` → 502
  - `CannotRemoveSelfException` → 422
  - `UserNotInFamilyException` → 404
  - `InviteCodeNotFoundException` → 404
  - `InvalidInviteCodeException` → 422
  - `ImportAlreadyInProgressException` → 409
  - `ReportSubmissionException` → 502 (vendor — kendo-report-tool)

### F-doc-2 (low) — `backend/CLAUDE.md` › Floor Plan

- **Source of truth verified:** `ls backend/app/Actions/` (contains `Feedback/`) and `ls backend/app/Models/` (contains `ImportJob.php`, `InviteCode.php`, `Theme.php`).
- **Fix:** Added `Feedback/` to the Actions tree (customer feedback relay via kendo-report-tool, alphabetical position after `FamilySet/`). Added `Theme` to the catalog-data Models row (Rebrickable theme taxonomy, per its `rebrickable_id`/`parent_id` columns) and new rows for `ImportJob` (async Rebrickable import tracking) and `InviteCode` (family invitation codes).
- **Scope note:** `app/Actions/` also carries four loose set-catalog Actions at its root (`GetSetAction`, `GetSetByEanAction`, `GetSetPartsAction`, `GetSetStorageMapAction`) not shown in the illustrative tree. Not in the WO's box; flagged here rather than silently expanded.

### G-doc-1 (medium) — `frontend/CLAUDE.md` › Materials table

- **Source of truth verified:** `environment: 'happy-dom'` at `vitest.config.ts:9,19,29` and `vitest.integration.config.ts:21`; `happy-dom` in `package.json`, no `jsdom` dependency.
- **Fix:** Testing row now reads `Vitest + @vue/test-utils (happy-dom)`.

### G-doc-2 (medium) — `frontend/CLAUDE.md` › Blueprint Room + Services

- **Source of truth verified:** `ls frontend/src/shared/services/` → only `auth/` + `sound.ts`. `package.json` carries `@script-development/fs-form|fs-http|fs-loading|fs-router|fs-storage|fs-toast|fs-translation`; `apps/families/services/http.ts:1` imports `createHttpService` from `fs-http`; `shared/services/auth/index.ts` exports `createAuthService`; `sound.ts:132` exports `createSoundService(storageService)` (Web-Audio synthesis, `prefers-reduced-motion` guard, toggle persisted via fs-storage); `apps/families/services/` instantiates auth, dialog, http, loading, router, sound, storage, theme, toast, translation.
- **Fix:** Blueprint Room `services/` comment now says locally-owned factories are `auth/` + `sound.ts` with the rest coming from `@script-development/fs-*` packages. The Services convention section now splits platform factories (fs-* packages) from locally-owned ones (`createAuthService`, `createSoundService` — the latter previously undocumented anywhere in the manual) and names the families instantiation list.

### G-doc-3 + G-arch-2 (low) — dead `storage.ts` exemption

- **Source of truth verified:** `src/shared/services/storage.ts` does not exist (extracted to `@script-development/fs-storage`); the `.oxlintrc.json` override at line 227 matched nothing.
- **Fix:** Removed the "Singleton exemption" bullet from `frontend/CLAUDE.md` Linting Standards AND the dead override object from `frontend/.oxlintrc.json` overrides. `npm run lint` confirmed green after the config edit (exit 0).

### G-doc-4 (low) — `frontend/CLAUDE.md` › Blueprint Room helpers

- **Source of truth verified:** `ls frontend/src/shared/helpers/` → `bricklinkWantedList.ts, csv.ts, string.ts, type-check.ts`.
- **Fix:** Helpers comment now lists `(bricklinkWantedList, csv, string, type-check)` — phantom `copy` dropped, `bricklinkWantedList` added.

## Files Touched

| Action | File | Findings |
|---|---|---|
| Modified | `backend/CLAUDE.md` | F-arch-1, F-doc-1, F-doc-2 |
| Modified | `frontend/CLAUDE.md` | G-doc-1, G-doc-2, G-doc-3, G-doc-4 |
| Modified | `frontend/.oxlintrc.json` | G-arch-2 |
| Created | `.claude/records/build-records/2026-07-09-warden-sweep-doc-fixes.md` | this record |

## Acceptance Criteria — Verification Output

1. **Each item verified against source-of-truth, not audit text** — per-finding verification notes above; all seven held exactly as the audit described (the audit was accurate this cycle — 0 divergences found during re-verification).
2. **`rg -n "JSDOM" frontend/CLAUDE.md`** → no hits (exit 1). ✔
3. **`rg -n "storage.ts" frontend/CLAUDE.md frontend/.oxlintrc.json`** → no hits (exit 1) — no live-exemption references remain. ✔
4. **Exceptions block lists 12 mappings matching `bootstrap/app.php` exactly** — `awk '/^### Exceptions/,/^## Quality Gauntlet/' backend/CLAUDE.md | grep -c "→"` → `12`; names, statuses, and order match the render closures at `bootstrap/app.php:66-99`. ✔
5. **Gauntlets** — docs-only change; the one config edit gate:
   - `cd frontend && npm run lint` → **exit 0** (only the ~16 pre-existing non-failing unicorn warnings the audit already catalogued).
   - `cd frontend && npm run format:check` → **exit 0** ("All matched files use the correct format", 345 files).
   - Full wing gauntlets not run beyond the hook-enforced set — no source, test, or type surface changed; pre-commit/pre-push hooks were allowed to run un-bypassed (see Environment Notes).

## Environment Notes

- Fresh git worktree: ran `npm install` in `frontend/` (required for the `.oxlintrc.json` lint gate and the frontend pre-commit pipeline) and `composer install` in `backend/` (required because staging `backend/CLAUDE.md` dispatches the CaptainHook gauntlet, which needs `vendor/bin/captainhook`). Hooks ran un-bypassed.
- The Work Order file itself is **untracked in the main checkout** (not yet committed by the Steward), so this record's WO back-link resolves on disk but not yet in git history. Not committed from this branch — the WO is Steward paper; flagged as a CEO/Steward-actionable line.
- WO Status left **Open** per instruction — closes post-merge per ADR-0028.

## Self-Debrief

- **What went to plan:** All seven fixes were mechanical once verified; the audit's evidence was precise enough that re-verification confirmed rather than corrected (consistent with the Warden's "0 refuted" adversarial-verification claim).
- **Judgment calls:** (1) F-doc-1 renders `RebrickableApiException` as "502 (404 when the upstream 404s)" rather than the old "502 or 404" — the `match` in `bootstrap/app.php` makes the condition explicit and the doc should too. (2) G-doc-2's rewrite names the families instantiation list — slightly beyond the minimal fix, but the Services section's old text ("Services live in each app's services/ directory") was the part most likely to re-drift without a concrete anchor. (3) F-doc-2 scope note above — loose root-level Actions observed but not added, staying inside the WO's box.
- **Nothing failed; no rebuttals pending.** No Methodology Objection — the SOPs performed correctly this sweep.

## Proposed Knowledge Updates

- None proposed. The "fresh worktree needs both wings' dependency installs before hooks can run" behavior is already documented in prior build records (2026-05-27/28 worktree-safety fixes) and held as described.

## Training Proposals

- None. Docs-only reconciliation; no new pattern surfaced beyond what the graduated "verify external-state claims before relying on them" rule already covers (it was exercised seven times here and earned its keep).
