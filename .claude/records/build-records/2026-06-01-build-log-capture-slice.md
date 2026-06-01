# Build Record: The Build Log — capture slice (timestamps only)

**Build Record #:** 2026-06-01-build-log-capture-slice
**Filed:** 2026-06-01
**Builder:** Brickwright (Foundry Wing) — dispatched by The Steward; Build Record transcribed and verified by The Steward (Write-tool refusal on the Brickwright leg, see Process Note)
**Wing:** Foundry
**Work Order:** [`2026-06-01-build-log-capture-slice`](../work-orders/2026-06-01-build-log-capture-slice.md)
**Branch:** `build-log-capture-slice`
**Build commit:** `e7c2eaa` (`feat(inventory): capture build-history timestamps on family sets`)

---

## Work Summary

Built the data-capture slice of **The Build Log** (the last actionable idea in the Vault, status: Prototype First). Status-transition timestamps are now stamped on `FamilySet` inside the existing `UpdateFamilySetAction` path — `build_started_at` when a set first enters `in_progress`, `built_at` when it first enters `built`. Stamping is idempotent (first-occurrence wins). No dashboard widget, no log page, no new endpoint, no ResourceData surfacing — the prototype captures data and stops, by design.

## Deliverables

| Action | File | Notes |
|---|---|---|
| Created | `backend/database/migrations/2026_06_01_000001_add_build_timestamps_to_family_sets_table.php` | Nullable `build_started_at` + `built_at` timestamps on `family_sets`, ordered after `status`. `down()` drops both. |
| Modified | `backend/app/Models/FamilySet.php` | `@property Carbon\|null` annotations for both columns; `immutable_datetime` casts. |
| Modified | `backend/app/Actions/FamilySet/UpdateFamilySetAction.php` | Idempotent stamping inside the existing `status instanceof FamilySetStatus` branch: into `InProgress` → `build_started_at` if null; into `Built` → `built_at` if null. Uses the already-injected `DateFactory->now()` — no facade, no new dependency. |
| Modified | `backend/database/factories/FamilySetFactory.php` | Both new columns default to `null` — existing tests stay green. |
| Modified | `backend/tests/Unit/Actions/FamilySet/UpdateFamilySetActionTest.php` | 6 new unit tests (see Test Coverage). |

## Decision: `acquired_at` dropped — `purchase_date` carries acquisition

The Work Order required a recorded decision on the `acquired_at` / `purchase_date` overlap. **Decision: drop `acquired_at`; no column added.** The model already carries `purchase_date` (`FamilySet.php:23`), wired through `UpdateFamilySetData->purchaseDate`. A second acquisition-ish date column with no behavioral distinction is the exact redundancy the WO Issuer flagged as the one outcome to avoid. Grep confirms zero `acquired_at` / `acquiredAt` references across `app/`, `database/`, `tests/`. If a real need ever separates "purchase" from "acquisition" (gift, trade, hand-me-down), that is a deliberate future migration with its own semantics — not a silent column shipped now on speculation.

## Cast deviation (deliberate)

The two new columns use the `immutable_datetime` cast while the sibling `purchase_date` uses `date`. This is intentional: build timestamps carry meaningful time-of-day precision ("started building at 14:30"), whereas a purchase is naturally a calendar date. Semantics over literal parity with the neighbour. PHPStan at max (Larastan) accepts the `@property Carbon|null` annotation against the immutable cast, consistent with the file's existing date-column annotation style. **Warden-eye note:** the annotation reads `Carbon` (mutable, `Carbon\Carbon` imported at line 9) while the runtime cast yields `CarbonImmutable`; this matches the pre-existing `purchase_date` convention in the same model and clears static analysis, but if the Warden ever tightens date-column annotations to match immutable casts exactly, both new columns and `purchase_date` move together.

## Test Coverage

6 new unit tests in `UpdateFamilySetActionTest.php`, exercising every branch of the stamping logic:

- stamps `build_started_at` when transitioning into `in_progress` and it is null
- stamps `built_at` when transitioning into `built` and it is null
- does **not** overwrite an already-stamped `build_started_at`
- does **not** overwrite an already-stamped `built_at` (the `built → in_progress → built` first-occurrence-wins case)
- does **not** stamp on transition into a non-build status
- leaves both timestamps untouched on a quantity/notes-only update (no status change)

## Verification — exactly what ran

| Gate | Result | Notes |
|---|---|---|
| `composer test` | ✅ GREEN | 706 passed, 2890 assertions |
| `composer test:arch` | ✅ GREEN | 105 passed (2 pre-existing route-count warnings, unrelated to this change) |
| `composer phpstan` | ✅ GREEN | OK, 340 files |
| `composer phpstan:types` | ✅ GREEN | OK, 155 files |
| `composer deptrac` | ✅ GREEN | 0 violations |
| `composer lint:test` | ✅ GREEN | Rector + Pint clean |
| Migration on sqlite | ✅ | Both columns confirmed present after `migrate` |
| ResourceData boundary | ✅ | New timestamps confirmed NOT surfaced in any API response — capture-only boundary holds |
| `composer test:coverage` | ⛔ BLOCKED (environmental) | `No code coverage driver is available`. Host is PHP **8.4.19**; project pins 8.5; pcov not loaded. |
| `composer test:feature-coverage` | ⛔ BLOCKED (environmental) | Same driver absence. |
| `composer mutation` | ⛔ BLOCKED (environmental) | Same driver absence. |

**Honest gate status:** every gate measurable on the available host is green. The three coverage/mutation gates could not run because the dev host is PHP 8.4.19 without pcov (project pins PHP 8.5). The 100% unit-coverage and 76% mutation thresholds on `UpdateFamilySetAction` are therefore **asserted by branch-walking reasoning, not measured locally** — every branch of the new logic has a dedicated test, but the numeric proof is deferred. This is not a free pass: **CI runs `composer test:coverage` (100% gate) and `composer test:feature-coverage` (90% gate) in dedicated PHP-8.5 + pcov jobs** (`.github/workflows/backend-ci.yml`, the `coverage:` and `feature-coverage:` jobs). Those jobs are the binding measurement and must pass before merge. The local environmental blocker does not lower the bar — it relocates the measurement to CI, which is purpose-built for it.

**Removed blocker (not committed):** the repo had no `.env`, which made the suite report `706 warnings` (risky, `fopen(.env)` failure) instead of clean passes. The Brickwright created `.env` from `.env.example` + `php artisan key:generate`. `.env` is gitignored and was **not** committed.

## Prototype Gate

This is a **Prototype First** idea. The capture slice is cheap and reversible; the deferred surfaces (dashboard "hours/days built this year" widget, the chronological Build Log page) carry the real risk — users typically mark a set `built` long after they actually finished it, so `built_at` degrades toward "when you clicked the button," not "when you finished building."

**What would justify building the widget / log page next:** real captured data showing that `built_at` − `build_started_at` deltas are *meaningful* for a non-trivial share of sets — i.e. users actually pass through `in_progress` rather than jumping `sealed → built` in one click. If the deltas are dominated by zero/near-zero (no `in_progress` dwell) or by absurd spans (months, because the status was flipped retroactively), the timestamps are noise and the widget would lie.

**What would send it Back to the Shelf:** if, after a stretch of real usage, the captured timestamps show no usable signal (everyone one-click-builds, or the dates are retroactive noise), the capture columns stay as cheap latent data but the widget/page idea is shelved with that verdict attached. The columns cost nothing to keep; the UI would cost trust to ship on bad data.

**Decision rule:** revisit when there is real captured `build_started_at`/`built_at` data to inspect — not on a calendar, on evidence.

## Process Note — Build Record + WO flip transcribed by the Steward

The Brickwright's `Write` call was refused on `.claude/records/build-records/2026-06-01-build-log-capture-slice.md`. Per the graduated learning (2026-04-16: treat a first tool refusal as a permission signal, flag it, hand verbatim content to the Steward rather than retrying across tool classes), the Brickwright stopped and reported rather than thrashing. Because the WO required the Status flip *in the same commit as the Build Record*, that flip was blocked as a consequence. The Steward independently reviewed the build commit (`e7c2eaa`) — code, tests, migration, casts — before transcribing this record; this is a verification pass, not a rubber-stamp. The Build Record and the WO Status flip land together in the Steward's commit.

## Candidate Learnings (observations, not settled rules)

1. **[Foundry] Absent `.env` turns the test suite's passes into "risky" warnings.** With no `.env`, `composer test` reported 706 *warnings* (an `fopen(.env)` failure surfaced as risky tests) rather than clean passes — easy to misread as a failure. Creating `.env` from `.env.example` + `key:generate` clears it. Candidate for the dev-setup checklist; the Steward should weigh whether this belongs in `make init` guidance or is already covered.
2. **Two distinct host blockers wear the same error.** The dev host failed coverage for *two independent* reasons — PHP 8.4 vs the 8.5 pin **and** pcov absent — but both present as "No code coverage driver is available." Fixing only one would not unblock. Worth noting so a future session doesn't install pcov on 8.4 and still hit the wall.

---

**Status:** Completed (code shipped on `e7c2eaa`; coverage/mutation measurement deferred to CI's PHP-8.5+pcov jobs — binding before merge)
