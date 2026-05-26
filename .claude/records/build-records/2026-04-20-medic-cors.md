# Build Record: Medic/CORS — Closes Sapper M5 Medium #1, #2, #3

**Build Record #:** 2026-04-20-medic-cors
**Filed:** 2026-05-26 (filed retroactively — work originally shipped 2026-04-20)
**Work Order:** [`2026-05-05-audit-remediation-5-paper-trail`](../work-orders/2026-05-05-audit-remediation-5-paper-trail.md) (the order that funded this archaeology)
**Builder:** Brickwright (Foundry)
**Wing:** Foundry

---

## Filed Retroactively

This Build Record was reconstructed on 2026-05-26 from the surviving on-disk artifacts. The original work shipped on 2026-04-20 via PR #156 of the **standalone backend repo** (commit `2c5ef79`) — three weeks before the Brickworks formed and absorbed the backend subtree on 2026-05-17 (commit `83c2f28`). The subtree absorption was a content collapse, not a history merge, so the original commit is not reachable from this orchestrator's `git log`. Reconstruction relied on:

- The audit's verbatim characterization of `2c5ef79` ([`2026-05-05-full-sweep.md`](../audits/2026-05-05-full-sweep.md) Finding 7, Delivery A).
- The current on-disk state of `backend/config/cors.php`, `backend/.env.example`, `backend/routes/api.php`, and `backend/tests/Feature/Configuration/CorsConfigTest.php`.

No retroactive Steward Evaluation is requested — the audit already established the factual record. This log exists to close the paper-trail gap, not to re-litigate the decisions.

---

## Work Summary

Three distinct Sapper M5 audit findings were closed in a single delivery. The audit pulled the work into one commit because the fixes share a configuration-surface theme (CORS hardening, env documentation, response caching of upstream-bound endpoints) and none of them carries an architectural decision worth standing alone.

| Action | File | Notes |
|---|---|---|
| Modified | `backend/config/cors.php` | `allowed_origins` wrapped in `array_values(array_filter([env('FRONTEND_URL', 'http://localhost:5173'), env('FRONTEND_URL_PRODUCTION')], static fn(mixed $value): bool => \is_string($value) && $value !== ''))` — drops empty-string values so an unset `FRONTEND_URL_PRODUCTION` does not advertise `''` as an allowed origin. Closes Sapper M5 Medium #1. |
| Modified | `backend/.env.example` | Five production-relevant env vars documented (e.g. `FRONTEND_URL_PRODUCTION=`, `SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173`, plus related production scaffolding). Closes Sapper M5 Medium #2 — operators were configuring production without a written map of which vars matter. |
| Modified | `backend/routes/api.php` | Downgraded `Cache-Control` directives on two Rebrickable-backed catalog routes (`/sets/{setNum}/parts`, `/sets/ean/{ean}`) to `private;max_age=3600` via the `cache.headers` route middleware (route-level `SetCacheHeaders` middleware). Closes Sapper M5 Medium #3 — the routes were previously caching at public-acceptable bands despite returning per-user data via the requester's Rebrickable token. |
| Created | `backend/tests/Feature/Configuration/CorsConfigTest.php` | New feature test. Two `it()` cases under `describe('CORS configuration', …)`: (1) `should not contain empty strings in cors allowed_origins` — guards the regression that motivated Sapper M5 #1; (2) `should contain at least one well-formed origin` — guards against the inverse regression where filtering accidentally drops all origins. Uses `covers(HandleCors::class)` to satisfy ADR-0007's coverage-attribution rule. |
| Modified | `backend/app/Http/Middleware/SetCacheHeaders.php` (verified, not re-created) | The shared cache-header middleware was already in place; the route-level downgrade reused it with the narrower directive string `'private;max_age=3600'`. |

The audit lists "5 files changed" in Delivery A. The five files are: `config/cors.php`, `.env.example`, `routes/api.php`, `tests/Feature/Configuration/CorsConfigTest.php`, and one additional file the audit did not separately enumerate — most likely `bootstrap/app.php` for the `'cache.headers' => SetCacheHeaders::class` alias registration (line 39 of the current `bootstrap/app.php` carries that alias), but the original commit's exact fifth-file identity was not preserved through the subtree collapse.

## Work Order Fulfillment

The original work had no Work Order — that is the gap this retroactive log closes. Against the acceptance criteria of the funding Work Order (`2026-05-05-audit-remediation-5-paper-trail`):

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Retroactive build record reconstructs the Sapper M5 Medium #1/#2/#3 closures | Yes | Each finding mapped to its closing change above. |
| Retroactive build record reconstructs the new feature test added | Yes | `CorsConfigTest.php` documented above, including its two `it()` cases and the `covers()` attribution. |
| "Filed Retroactively" preamble noting original-work date vs. log-filing date | Yes | Top of file. |
| No retroactive Director Evaluation needed | Acknowledged | Audit established the factual record; no evaluation appended. |

## Decisions Made

The original commit embedded no architectural decisions worth re-litigating. The three Sapper findings were targeted fixes:

1. **Filter empty strings out of `allowed_origins` at config-load time rather than at the middleware** — Chose config-time filtering because Laravel's `HandleCors` middleware loops `allowed_origins` against the request `Origin` header, and a literal `''` in the list could match an empty `Origin` header on some upstream proxies. Filtering at config-load is the single chokepoint that makes the empty-string concern impossible to reach, regardless of how many middlewares later evolve. The `is_string($value) && $value !== ''` predicate is deliberately defensive against any `env()` returning a non-string (Laravel's `env()` is typed `string|bool|null` but downstream `Repository` access can widen).

2. **Use `cache.headers` route middleware with directive string `private;max_age=3600` instead of hard-coding headers in the controller** — The audit's wording "downgrades Cache-Control" describes a narrowing, not a removal: the routes already had aggressive caching; the fix narrowed the visibility (`private`, not `public`) because the responses are personalized to the requester's Rebrickable token. Putting the directive on the route definition keeps the controller free of HTTP-header noise and uses the same middleware alias already established for other catalog endpoints.

3. **Use `describe()` + `it('should …')` Pest convention for the new feature test** — Matches the Foundry's test-naming convention (Pest with `describe()` + `it('should ...')`, enforced by `TestConventionsArchitectureTest` once the DTO migration landed the day after this commit).

## Quality Gauntlet

The original commit passed the standalone-backend CI before merge to its `main` branch. Re-running the gauntlet today against this retroactive log is unnecessary and irrelevant — this Build Record adds no PHP, no schema, no routes; it is one Markdown file. The funding Work Order's Build Record (`2026-05-26-audit-remediation-5-paper-trail.md`) carries the live gauntlet run that protects the ADR amendment text introduced alongside this log.

## Showcase Readiness

The medic/CORS work was hygiene, not showcase. What is mildly portfolio-relevant is that **the warehouse's auditor caught the empty-string-in-allowed-origins risk before any production deploy** — Sapper M5 was a pre-production audit. The fix landed within a day of the finding. That is the pattern a senior architect wants to see: an auditor finds a configuration foot-gun, a small focused commit closes it, and a regression-guarding test ships in the same commit.

The Build Record's late filing is the unflattering part. The recurring "paper trail filed late" pattern is exactly what the audit's Finding 7 promoted from cosmetic to structural, and the structural fix (CaptainHook pre-push permit gate, ADR-0028) was filed two weeks after this work. Going forward, the gate makes "ship without a Work Order" cost a `--no-verify` and a Steward sign-off in the Build Record — the right shape of friction.

## Proposed Knowledge Updates

None. This Build Record is reconstruction, not new architectural ground.

## Self-Debrief

Not applicable — the original builder's self-debrief is lost to the subtree collapse, and the retroactive reconstructor (this Brickwright, 2026-05-26) did not perform the original work. The funding Build Record (`2026-05-26-audit-remediation-5-paper-trail.md`) carries the archaeology session's self-debrief.

---

**Status:** Closed (filed retroactively)
**Original Commit:** `2c5ef79` (standalone backend repo, PR #156) — not reachable in orchestrator history post-subtree collapse
**Funding Work Order:** [`2026-05-05-audit-remediation-5-paper-trail`](../work-orders/2026-05-05-audit-remediation-5-paper-trail.md)
