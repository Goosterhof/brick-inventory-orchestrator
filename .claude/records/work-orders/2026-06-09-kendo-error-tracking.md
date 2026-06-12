# Work Order: Wire the Foundry to Kendo Error Tracking

**Work Order #:** 2026-06-09-kendo-error-tracking
**Filed:** 2026-06-09
**Issued By:** General
**Assigned To:** Brickwright
**Wing:** Foundry
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `kendo-error-tracking`

---

## The Job

Install the `script-development/kendo-error-tracker` Composer package in the Foundry (`backend/`) and report every handled exception, source-scrubbed, into the Brickworks' Kendo board (project **Brick Inventory**, id **3**, on the `goosterhof.kendo.dev` tenant). One call wired into the exception pipeline; the package owns scrubbing, auth, path normalization, and swallow-on-failure.

This is the first of three Kendo work orders. Sisters: `2026-06-09-kendo-report-filing` (user feedback → reports) and `2026-06-09-kendo-board-wiring` (the kanban board + MCP). They are independent — do them in any order, one branch each.

## Background — what the package does (so you don't reinvent it)

`kendo-error-tracker` is a published Laravel client library (auto-discovered ServiceProvider). Its public surface is one method:

```php
app(\ScriptDevelopment\KendoErrorTracker\ErrorTracker::class)->report($throwable);
```

`report()` builds a scrubbed, path-normalized payload and POSTs it to `{kendo_url}/api/projects/{project}/error-events`. It is **swallow-on-failure** — never throws, never blocks the request — so it is safe to call from inside the exception handler. Scrubbing (JWT / Bearer / BSN / email → `[REDACTED:<kind>]`) and `base_path()` stripping happen *before* the queue boundary, so no raw PII is ever serialized. Async by default (dispatches `ReportErrorJob`, 0 retries, logs to `error_log` on failure); sync is opt-in.

## Scope

### In the Box

- `composer require script-development/kendo-error-tracker` in `backend/`.
- Env keys added to `backend/.env.example` (documented, with placeholders — **no real token committed**):
  ```dotenv
  ERROR_TRACKER_KENDO_URL=https://goosterhof.kendo.dev
  ERROR_TRACKER_PROJECT=3
  ERROR_TRACKER_TOKEN=                  # error-events:write project token — CEO-provisioned, never committed
  # ERROR_TRACKER_ENVIRONMENT=          # defaults to APP_ENV
  # ERROR_TRACKER_RELEASE=              # optional git sha / version tag
  ```
- One report hook wired into `backend/bootstrap/app.php`, inside the existing `->withExceptions(function (Exceptions $exceptions): void { ... })` block (which currently holds only `$exceptions->render(...)` mappings):
  ```php
  use ScriptDevelopment\KendoErrorTracker\ErrorTracker;
  use Throwable;

  $exceptions->report(function (Throwable $e): void {
      app(ErrorTracker::class)->report($e);
  });
  ```
- `ERROR_TRACKER_RELEASE` (optional but encouraged): wire to the deployed commit sha so Kendo groups by release. If there's an existing release/version primitive in the Railway env, reuse it; otherwise leave commented.

### Not in This Set

- **No wrapping `ErrorTracker` in a BIO Action, Service, or Contract.** The integration point is `bootstrap/app.php`, not the App layer — it touches no Deptrac fence. Calling `app(ErrorTracker::class)` directly in the bootstrap closure is correct and idiomatic; a single-use adapter would violate the "no single-use abstractions" doctrine *and* drag a vendor class across a boundary fence that currently doesn't see it.
- No custom scrub rules — the package owns the scrubbing contract (per-project rules are a package v1.5 concern).
- Report filing (separate WO) and the board/MCP (separate WO).
- No changes to the existing `$exceptions->render(...)` mappings — `report()` and `render()` are independent stages.

## Prerequisites (CEO-provisioned — the Brickwright cannot mint these)

- [ ] **Mint a Kendo project token** on project **Brick Inventory (id 3)** carrying the **`error-events:write`** ability. Project API-token settings → create token → grant ability → copy.
- [ ] **Set `ERROR_TRACKER_TOKEN`** in the Railway environment for **both** the web service **and** the `worker` service (async reports run on the worker). Confirm the tenant URL is `https://goosterhof.kendo.dev`.

## Acceptance Criteria

- [ ] `composer require` succeeds; `ErrorTrackerServiceProvider` auto-discovered (no manual provider registration).
- [ ] The `report()` hook is present in `bootstrap/app.php` and fires for handled throwables.
- [ ] `.env.example` documents the three keys with placeholders; no real token is committed.
- [ ] **Smoke test:** with the token set locally (or on staging), deliberately throw a test exception and confirm it surfaces in Kendo project 3's error groups, **scrubbed** (no email/JWT/BSN in the message) and with `app/...`-relative stack paths.
- [ ] The existing Pest suite stays green — tests do **not** hit real Kendo (the package swallows on failure, and unit/feature tests run under `Queue::fake()` so `ReportErrorJob` never dispatches a live POST).
- [ ] Full Foundry gauntlet passes: `composer lint:test`, `composer phpstan`, `composer phpstan:types`, `composer deptrac`, `composer test:arch`, `composer test`.

## References

- War Room Context: General-issued. Companion WOs `2026-06-09-kendo-report-filing`, `2026-06-09-kendo-board-wiring`.
- Package: `script-development/kendo-error-tracker` (packagist; public, MIT). README is the integration contract.
- Server contract: KD-0771 — `POST /api/projects/{project}/error-events`, Bearer `error-events:write`, `202` = success.

## Notes from the Issuer

The whole integration is one method call — resist the urge to build scaffolding around it. The async path needs the queue worker alive (BIO already runs one via `make queue` locally and a Railway `worker` service in prod); that's why the token must be on the worker env, not just the web env. If you ever doubt the worker is processing, the package degrades safely — a failed report logs to `error_log` and is dropped, never requeued, so error tracking never amplifies load during an outage.

One token, one ability (`error-events:write`). Do **not** reuse the report-filing token (that one carries `report:create` — different WO, different ability).

---

**Status:** Open
**Build Record:** _link when filed_
