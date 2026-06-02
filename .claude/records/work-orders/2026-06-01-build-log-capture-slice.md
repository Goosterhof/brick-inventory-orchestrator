# Work Order: The Build Log — capture slice (timestamps only)

**Work Order #:** 2026-06-01-build-log-capture-slice
**Filed:** 2026-06-01
**Issued By:** The Steward (CEO-directed via `/next-build`)
**Assigned To:** Brickwright (Foundry Wing)
**Wing:** Foundry
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `build-log-capture-slice`

---

## The Job

Capture status-transition timestamps on `FamilySet` so the collection accumulates real build-history data: when a set was acquired, when its build started, and when it was completed. This is the **data-capture slice only** — stamp the timestamps inside the existing status-transition path. The dashboard widget and the chronological Build Log page are explicitly **out of scope** and gated behind this prototype (see Notes).

## Scope

### In the Box

- **Migration** adding nullable timestamp columns to `family_sets`:
  - `build_started_at` (nullable timestamp) — stamped when a set transitions **into** `in_progress`
  - `built_at` (nullable timestamp) — stamped when a set transitions **into** `built`
  - `acquired_at` — **see the `purchase_date` reconciliation decision below before adding this column.**
- **Model:** add `@property Carbon|null` annotations for each new column to `app/Models/FamilySet.php`, and cast as `datetime`/`immutable_datetime` consistent with `purchase_date`'s existing handling.
- **Transition stamping** in `app/Actions/FamilySet/UpdateFamilySetAction::execute()`:
  - When `$updateFamilySetData->status` changes to `FamilySetStatus::InProgress` and `build_started_at` is null, stamp it via the injected `DateFactory` (no `now()` facade — the Action already injects `DateFactory`).
  - When `$updateFamilySetData->status` changes to `FamilySetStatus::Built` and `built_at` is null, stamp it.
  - **Idempotent stamping:** only stamp when the column is null — re-saving a set already `built` must not overwrite the original `built_at`. A set moving `built → in_progress → built` keeps its first `built_at` (decision: first-occurrence wins; document if you choose otherwise).
- **Factory:** update `database/factories/FamilySetFactory.php` so the new columns are populated/nullable in a way that keeps existing tests green.
- **`acquired_at` reconciliation decision (REQUIRED):** the model **already has `purchase_date`** (`app/Models/FamilySet.php:21`), set via `UpdateFamilySetData->purchaseDate`. The original Idea Vault entry predates this column. Decide and record in the Build Record: (a) treat `purchase_date` AS the acquisition timestamp and **drop `acquired_at`** from this slice (recommended — avoids a redundant column), or (b) justify why a distinct `acquired_at` earns its place alongside `purchase_date`. Do not add both without a stated reason.
- **Unit coverage** (100% mandate) on the transition-stamping logic: into-`in_progress` stamps `build_started_at`, into-`built` stamps `built_at`, null-guard idempotency holds, non-status updates (quantity/notes) leave timestamps untouched.

### Not in This Set

- **No dashboard widget.** "Total hours/days built this year," "built in X days" on set detail — all deferred behind the prototype gate.
- **No Build Log page** (chronological history view) — frontend, deferred.
- **No retroactive date-entry UI.** The Key Concern (users mark sets "built" late) is real; solving it is a separate decision, not this slice.
- **No ResourceData / API response surfacing** of the new timestamps beyond what falls out naturally — if the existing `FamilySetResourceData` doesn't already expose them, leave them unexposed this slice (the prototype is about *capturing* data, not reading it).
- **No new endpoint.** Stamping rides the existing `PUT/PATCH /family-sets/{family_set}` → `UpdateFamilySetAction` path.

## Acceptance Criteria

- [ ] Migration adds `build_started_at` + `built_at` (and `acquired_at` **only if** the reconciliation decision lands on option (b)) as nullable timestamps on `family_sets`
- [ ] `FamilySet` model carries `@property Carbon|null` annotations + casts for each new column
- [ ] Transition into `in_progress` stamps `build_started_at` when null; transition into `built` stamps `built_at` when null
- [ ] Stamping is idempotent — an already-stamped column is never overwritten by a later save
- [ ] Quantity/notes/purchase_date updates that don't change status leave the new timestamps untouched
- [ ] `acquired_at` vs `purchase_date` reconciliation decided and recorded in the Build Record with the rationale
- [ ] `composer test` green; unit coverage 100% on `UpdateFamilySetAction`; `composer phpstan` + `composer deptrac` + `composer test:arch` clean
- [ ] Factory updated; no existing feature/unit test regressed
- [ ] Build Record explicitly states the prototype gate: what evidence would justify building the dashboard widget / log page next, and what would send the idea back to the shelf

## References

- Idea Vault entry: **The Build Log** (`docs/idea-vault.md`, status: Prototype First) — "Ship the capture without the widget first, then decide if the log page earns its place."
- Status-transition path: `backend/app/Actions/FamilySet/UpdateFamilySetAction.php` (`execute()`, the `status instanceof FamilySetStatus` branch)
- Status enum: `backend/app/Enums/FamilySetStatus.php` (`Sealed`, `Built`, `InProgress`, `InStorage`, `Incomplete`, `Wishlist`)
- Existing acquisition field: `backend/app/Models/FamilySet.php:21` (`purchase_date`)
- Convention: root `CLAUDE.md` (Actions — no facades, injected `DateFactory`/`ConnectionInterface`, explicit property assignment) and `backend/CLAUDE.md` (Foundry Wing manual)

## Notes from the Issuer

This is the last actionable idea in the Vault — every other entry is Shipped, Return-to-Shelf, or Back-to-the-Drawing-Board. It is deliberately a **Prototype First**, and the firm's own scoping note is the safeguard: the data capture is cheap and reversible; the dashboard widget is the part with a real "this might be noise" concern (users mark sets `built` months after the fact, so `built_at` degrades to "when you clicked the button," not "when you actually finished"). We capture first, judge later.

The single sharpest call in this slice is the **`acquired_at` / `purchase_date` overlap** — the model already tracks an acquisition-ish date. My recommendation is to drop `acquired_at` and let `purchase_date` carry that meaning, but the Brickwright owns the call and must record it. Adding a redundant column silently is the one outcome to avoid.

Backend-only by design. No Gallery work until the captured data earns the widget. When the Build Record lands, this idea either graduates to a follow-up frontend WO or goes Back to the Shelf with the prototype's verdict attached.

---

**Status:** Completed (2026-06-01 — build commit `e7c2eaa`; coverage/mutation gates deferred to CI's PHP-8.5+pcov jobs, binding before merge)
**Build Record:** [`2026-06-01-build-log-capture-slice`](../build-records/2026-06-01-build-log-capture-slice.md)
