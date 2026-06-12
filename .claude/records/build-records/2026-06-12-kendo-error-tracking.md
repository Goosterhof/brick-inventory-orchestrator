# Build Record: Wire the Foundry to Kendo Error Tracking

**Build Record #:** 2026-06-12-kendo-error-tracking
**Filed:** 2026-06-12
**Brickwright:** Brickwright
**Wing:** Foundry
**Work Order:** [2026-06-09-kendo-error-tracking](../work-orders/2026-06-09-kendo-error-tracking.md)
**Branch:** `feat/kendo-error-tracking`

---

## Work Summary

Installed `script-development/kendo-error-tracker` (v0.1.0, ServiceProvider auto-discovered) in the Foundry and wired its single public method into the exception pipeline: one `$exceptions->report(...)` hook in `bootstrap/app.php`. Every handled throwable is now reported — scrubbed and path-normalized by the package before the queue boundary — to Kendo project **Brick Inventory (id 3)** on `goosterhof.kendo.dev`, async via the package's `ReportErrorJob`.

Per the WO's "Not in This Set" fence: **no** Action/Service/Contract wrapper, no custom scrub rules, no changes to the existing `render()` mappings. The bootstrap closure is the entire integration.

## Deliverables

| Action | File | Notes |
|---|---|---|
| Modified | `backend/composer.json` / `composer.lock` | `composer require script-development/kendo-error-tracker` → **v0.1.0**. ServiceProvider auto-discovered (`package:discover` listed it; no manual registration). |
| Modified | `backend/bootstrap/app.php` | Added the report hook at the top of the existing `->withExceptions(...)` block, plus the `ScriptDevelopment\KendoErrorTracker\ErrorTracker` import. `render()` mappings untouched. |
| Modified | `backend/.env.example` | Added the documented block: `ERROR_TRACKER_KENDO_URL=https://goosterhof.kendo.dev`, `ERROR_TRACKER_PROJECT=3`, empty `ERROR_TRACKER_TOKEN=` (CEO-provisioned, never committed), commented `# ERROR_TRACKER_ENVIRONMENT=` (defaults to `APP_ENV`) and `# ERROR_TRACKER_RELEASE=`. No real token committed. |
| Modified | `backend/tests/Feature/Controllers/FamilySetControllerTest.php` | One assertion narrowed — see "Test Adjustment" below. |

### The hook as shipped (post-lint)

```php
$exceptions->report(function(\Throwable $e): void {
    resolve(ErrorTracker::class)->report($e);
});
```

**Deviation from the WO's literal snippet, lint-enforced:** `composer lint` (Rector `AppToResolveRector`) rewrote `app(...)` → `resolve(...)`, and Pint's `fully_qualified_strict_types`/house style settled on inline `\Throwable` + `function(` spacing. Semantics identical (`resolve()` is an `app()` alias); the WO's intent — direct container resolution in the bootstrap closure, no abstraction — is preserved.

### `ERROR_TRACKER_RELEASE` left commented

The WO encouraged wiring it to a deployed commit sha if an existing release/version primitive exists in the Railway env. I found no such primitive in the repo (`railway.toml` defines no release var; Railway-side env not verifiable from here), so per the WO's own fallback the key ships commented. CEO/General can set it Railway-side later with zero code change.

## Test Adjustment (the one suite casualty)

`FamilySetControllerTest` → "should return 409 when import is already in progress" failed after wiring: its `Queue::assertNothingPushed()` now saw the package's `ReportErrorJob`. This is **correct new behavior**, not a regression — `report()` and `render()` are independent stages, so the rendered-to-409 `ImportAlreadyInProgressException` is still reported, and the package dispatches `ReportErrorJob` unconditionally in async mode (verified in vendor source: the unconfigured short-circuit lives in `send()`, i.e. on the worker side, by design — scrub-then-queue happens regardless).

The assertion was over-broad relative to the test's intent ("the import job was not dispatched"). Narrowed to `Queue::assertNotPushed(ImportOwnedSetsJob::class)` with an explanatory comment. This is a tightening-to-intent, not a weakening: the test still proves the 409 path dispatches no import work.

## Gauntlet Results (host PHP 8.5.5, from `backend/`)

| Gate | Result |
|---|---|
| `composer lint` / `composer lint:test` | Clean (Rector + Pint; post-fix dry-run green) |
| `composer phpstan` | 0 errors (level max) |
| `composer phpstan:types` | 0 errors |
| `composer deptrac` | 0 violations — the hook lives in `bootstrap/`, outside the App layer; no fence sees the vendor class |
| `composer test:arch` | 111 passed (1882 assertions) — no arch test flagged the bootstrap vendor usage |
| `composer test` | **711 passed** (2906 assertions) — was 710 + 1 failed before the assertion narrowing |
| `composer test:coverage` | 100.0% |
| `composer test:feature-coverage` | 100.0% |
| `composer mutation` | Not run — no Action/Service code changed; mutation scope untouched |

## Acceptance Criteria

- [x] `composer require` succeeds; `ErrorTrackerServiceProvider` auto-discovered
- [x] `report()` hook present in `bootstrap/app.php`, fires for handled throwables (proven incidentally by the `ReportErrorJob` appearing under `Queue::fake()` in the 409 feature test)
- [x] `.env.example` documents the keys with placeholders; no real token committed
- [ ] **Smoke test — BLOCKED on CEO-provisioned prerequisites** (see below)
- [x] Pest suite green; tests never hit real Kendo (`Queue::fake()` intercepts `ReportErrorJob`; package is swallow-on-failure besides)
- [x] Full Foundry gauntlet green

## Outstanding — CEO-Provisioned Prerequisites

The live smoke test (deliberate test exception → surfaces scrubbed in Kendo project 3's error groups with `app/...`-relative stack paths) is **blocked** until:

1. **Token minted** on Kendo project Brick Inventory (id 3) with the **`error-events:write`** ability (project API-token settings). Not the report-filing token — different ability, different WO.
2. **`ERROR_TRACKER_TOKEN` set in Railway** for **both** the web service **and** the `worker` service (async reports POST from the worker). Tenant URL `https://goosterhof.kendo.dev` confirmed as the configured default.

Until then the integration degrades exactly as designed: `ReportErrorJob` runs on the worker, `send()` short-circuits on the missing token, logs `[kendo-error-tracker] not configured` to `error_log`, drops the report. No retries, no load amplification.

## Notes

- **External-state verification (graduated 2026-05-03):** WO claims verified against ground truth — vendor `ErrorTracker::report(Throwable): void` surface, async-dispatch-always behavior, and `send()`-side config short-circuit all confirmed by reading the installed package source, not the WO text. Railway env state is **not verifiable from this session** (no dashboard access) — flagged above as the CEO-actionable prerequisite.
- The WO's `use Throwable;` import line was unnecessary (`bootstrap/app.php` is unnamespaced); Pint settled on inline `\Throwable`.

---

## Review Follow-up (2026-06-12) — dontReport split for rendered domain exceptions

**Trigger:** General's review on PR #194 (`bootstrap/app.php:45`): the global `report()` hook fired for every handled throwable, including the 11 domain exceptions the same block renders to 4xx. Expected control-flow signals (404/403/409/422) would land as distinct error groups in Kendo project 3 on day one — the package does no client-side filtering by design.

**Steward decision:** reviewer's option A, scoped to expected-condition domain exceptions only.

**The rule as shipped (comment in `bootstrap/app.php`):** rendered domain control-flow signals are not telemetry; external faults are.

| Disposition | Exceptions |
|---|---|
| **Suppressed** (`$exceptions->dontReport([...])`) | `SetNotFoundException`, `MissingRebrickableTokenException`, `NotFamilyHeadException`, `CannotRemoveSelfException`, `UserNotInFamilyException`, `InviteCodeNotFoundException`, `InvalidInviteCodeException`, `ImportAlreadyInProgressException` |
| **Still reported** (deliberate) | `RebrickableApiException` (yes, even its 404 render path — the 502 case is worth the occasional 404 noise), `BrickognizeApiException`, `InvalidApiResponseException` — genuine upstream failures, which is exactly what error tracking is for |

**Test restoration:** the earlier narrowing of `FamilySetControllerTest`'s 409 test is reverted. With `ImportAlreadyInProgressException` in the dontReport set, Laravel's handler short-circuits before the custom report callback, so `Queue::assertNothingPushed()` holds again — and now doubles as a regression guard proving the suppression works (it failed before the dontReport landed, passes after).

**Environment note:** mid-follow-up the suite failed with `Target class [ScriptDevelopment\KendoErrorTracker\ErrorTracker] does not exist` — `backend/vendor/` had lost the package (a `composer install` against a package-less lock ran in this shared working copy while another branch was checked out; the stale `autoload_psr4.php` still referenced it). `composer install` from this branch's lock restored it. No code change involved; noting for the next crew member who hits a vendor/branch drift.

**Gauntlet (re-run, post-fix):** `lint:test` / `phpstan` / `phpstan:types` / `deptrac` all clean; `test:arch` green; `composer test` **711 passed** (2906 assertions); unit coverage **100.0%**; feature coverage **100.0%**.
