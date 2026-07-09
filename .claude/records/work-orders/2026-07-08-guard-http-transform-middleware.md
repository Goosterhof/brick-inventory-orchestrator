# Work Order: Guard the families HttpService transform middleware

**Work Order #:** 2026-07-08-guard-http-transform-middleware
**Filed:** 2026-07-08
**Issued By:** The Steward (on CEO direction, during the open-PR review sweep)
**Assigned To:** Brickwright (Gallery Wing)
**Wing:** Gallery
**Priority:** Standard
**Status:** Completed (2026-07-09, batched close-out per ADR-0028 § Amendment 2026-07-09 Transition — merged in PR #253) — [Build Record](../build-records/2026-07-09-guard-http-transform-middleware.md)
**Branch slug (for PrePushPermitGate):** `guard-http-transform-middleware`

---

## The Job

Close the residual error-masking gap surfaced during the 2026-07-08 PR-review sweep. PR #243 (guard fs-http response-error middleware) and PR #245 (adopt `@script-development/fs-form`) between them guarded the **422 / response-error** middleware path, but neither touched `frontend/src/apps/families/services/http.ts` — which still registers **two unguarded transform middleware**:

```ts
familyHttpService.registerRequestMiddleware((config) => {
    if (config.data && !(config.data instanceof FormData)) config.data = deepSnakeKeys(config.data);
});

familyHttpService.registerResponseMiddleware((response) => {
    if (response.data && typeof response.data === 'object') response.data = deepCamelKeys(response.data);
});
```

Per the fs-http middleware sync-contract (see `frontend/CLAUDE.md` / fs-http docs), registered middleware run **synchronously and uncaught**. A throwing `deepCamelKeys` on a malformed/exotic response therefore rejects an already-**resolved 200** and masks the real result — the exact "error-masking" the #243 title targeted, on the higher-risk response-**transform** path. This is the last unguarded seam in the families HttpService.

## Scope

### In the Box

- Wrap both the request (`deepSnakeKeys`) and response (`deepCamelKeys`) transform middleware in fs-http's `guarded()` helper in `frontend/src/apps/families/services/http.ts`, matching the guarding pattern fs-http/fs-form already apply to the 422 middleware (fs-http Principle #8).
- Decide and document the guarded failure semantics: a throwing transform should **not** mask a resolved response — the guarded wrapper should let the original (untransformed) payload through or surface a typed error, per fs-http's `guarded()` contract. Follow whatever fs-http's own `guarded` does for the error-response middleware so the behavior is consistent across all middleware on this service.
- Tests: add a unit/integration test proving a throwing transform on a 200 response does not reject the resolved result (the regression this guards). Keep the 100% coverage gate satisfied.
- Check the sibling app services (`admin`, and any other `createHttpService` registration) for the same bare-transform pattern; guard them too if present, or note in the Build Record that they were checked and clean.

### Not in This Set

- No change to the snake/camel conversion logic itself (`deepSnakeKeys`/`deepCamelKeys` in `@shared/helpers/string.ts`) — only how the middleware is registered.
- No backend changes.

## Context / Provenance

- Surfaced by the Steward's own war-room review on **PR #243** ("guard is correct but INCOMPLETE — http.ts still registers two unguarded transform middleware").
- CEO decision during the 2026-07-08 sweep: fix #245 as the destination state and **close #243 as superseded** (fs-form adoption retired the local composable #243 patched), carrying this transform-middleware guard gap into this fresh follow-up rather than reviving #243.
- The emmie sibling (entreezuil#283) reportedly came out complete (no bare transform middleware); BIO is the territory with the residual gap.

## Acceptance Criteria

- [ ] Both transform middleware in `frontend/src/apps/families/services/http.ts` are wrapped in `guarded()` (or the fs-http-blessed equivalent).
- [ ] A test demonstrates a throwing transform on a resolved 2xx response no longer masks the result.
- [ ] Sibling HttpService registrations audited; guarded or documented-clean.
- [ ] Full Gallery gauntlet green (type-check → knip → test:coverage @ 100% → build), plus mutation per-file floor.
- [ ] Carries the `Agent Review Requested` label.

## Notes from the Issuer

Small, surgical slice — the fix is a few lines, the value is closing the last error-masking seam on the primary HttpService. The real work is proving the failure mode with a test and confirming the guarded semantics match fs-http's contract rather than guessing.
