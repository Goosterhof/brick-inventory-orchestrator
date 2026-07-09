# Build Record: Guard the families HttpService transform middleware

**Build Record #:** 2026-07-09-guard-http-transform-middleware
**Filed:** 2026-07-09
**Builder:** Brickwright (Gallery Wing)
**Wing:** Gallery
**Work Order:** [`2026-07-08-guard-http-transform-middleware`](../work-orders/2026-07-08-guard-http-transform-middleware.md)
**Branch:** `guard-http-transform-middleware`
**Build commits:** `e9d69115` (`fix: guard families http transform middleware against throwing transforms`)

---

## Work Summary

Closed the last error-masking seam on the families HttpService. The two transform middleware in `frontend/src/apps/families/services/http.ts` — request-side `deepSnakeKeys` and response-side `deepCamelKeys` — ran synchronously and uncaught per the fs-http middleware contract, so a throwing transform on a malformed/exotic 200 payload rejected an already-resolved success. Both are now wrapped in fs-http's `guarded()` (available since `@script-development/fs-http` 0.5.0, confirmed installed at 0.5.0 in `node_modules` before relying on it — WO external-state claim verified against the package, not memo text).

**Guarded failure semantics (WO "decide and document" item):** `guarded()`'s contract, read from the installed package's `dist/index.d.mts` and `dist/index.mjs`, is try/catch around the middleware body with the thrown value routed to an `onError` handler that defaults to a loud `console.error('[fs-http] middleware body threw and was swallowed by guarded():', error)`. The default handler is used — identical to what fs-http/fs-form apply on the 422 response-error path, so failure behavior is now uniform across every middleware on this service: the throw is surfaced loudly, the chain stays intact, and the original (untransformed) payload passes through rather than masking the resolved response. No custom `onError` was introduced — consistency with the existing guarded 422 path was the WO's stated tiebreaker.

## Deliverables

| Action | File | Notes |
|---|---|---|
| Modified | `frontend/src/apps/families/services/http.ts` | Both transform middleware wrapped in `guarded()`; rationale comment citing fs-http Principle #8 (loud library, defensive consumer) |
| Created | `frontend/src/tests/unit/apps/families/services/http.spec.ts` | 4 regression tests — see Test Coverage |
| Modified | `frontend/vitest.config.ts` | New `families/services` project (`src/tests/unit/apps/families/services/**`) — no existing project included this directory, so the spec would otherwise never run |

## Test Coverage

The spec drives the **real production wiring**, not a re-created mirror: fs-http captures the axios adapter at `createHttpService()` time, so the spec installs `MockAdapter` on global axios first and then dynamically imports `@app/services/http` (top-level await). `@shared/helpers/string` is module-mocked with `vi.fn`-wrapped actual implementations so individual tests can inject a throw via `mockImplementationOnce` while happy paths keep real conversion behavior.

1. **Happy path, response:** snake_case 200 payload arrives camelCased; no guard noise on console.error.
2. **Happy path, request:** camelCase body goes out snake_cased; no guard noise.
3. **Regression (the WO's core AC):** `deepCamelKeys` throws on a resolved 200 → the promise **resolves**, `response.data` is the original untransformed payload, and the swallowed throw is asserted loudly via guarded()'s default `console.error` signature. Unguarded, this promise rejected.
4. **Regression, request side:** `deepSnakeKeys` throws → the request is not aborted; the original camelCase body is sent and the throw is surfaced.

## Sibling HttpService Audit (WO AC #3)

Swept every `registerRequestMiddleware` / `registerResponseMiddleware` / `registerResponseErrorMiddleware` call site in `frontend/src`:

| Site | Verdict |
|---|---|
| `src/apps/families/services/http.ts` | The target — fixed in this build |
| `src/apps/admin/**` | **Clean** — the admin app has no `services/` directory and registers no HttpService middleware at all |
| `src/shared/services/**` | **Clean** — no middleware registrations (the shared auth service registers none) |
| `src/apps/showcase/components/FormValidationWorkbench.vue` | **Clean** — a demo stub capturing fs-form's own 422 response-error middleware, which fs-form already guards upstream (the PR #245 adoption); not a bare transform |
| Test scaffolding (`src/tests/**` harnesses mirroring the wiring) | Out of production scope; noted for completeness — the `shared/services/auth` specs re-create the pre-guard wiring locally, which is harness-internal and cannot mask production responses |

## Acceptance Criteria Verification

- [x] **Both transform middleware wrapped in `guarded()`** — `http.ts`, request and response registration sites.
- [x] **Test demonstrates a throwing transform on a resolved 2xx no longer masks the result** — spec tests 3 and 4 above; test 3 is the exact 200-response regression named in the WO.
- [x] **Sibling registrations audited** — table above; only the families service carried the gap (matches the WO's note that the emmie sibling came out complete).
- [x] **Full Gallery gauntlet green** — `format:check` ✅ ("All matched files use the correct format."), `lint` ✅ (exit 0, pre-existing warnings only, zero errors), `lint:vue` ✅ ("All conventions passed."), `type-check` ✅ (exit 0), `test:coverage` ✅ (**Statements 100% 1470/1470, Branches 100% 1129/1129, Functions 100% 432/432, Lines 100% 1366/1366**), `knip` ✅ (exit 0), `build` ✅ (all 3 apps), `size` ✅ (families 133.93 kB / 350 kB, admin 30.51 kB / 150 kB). Pre-commit hook pipeline passed on commit.
  - **Mutation per-file floor:** the WO lists "plus mutation per-file floor" — the Gallery gauntlet (`frontend/CLAUDE.md`, pre-push hook, npm scripts) carries no mutation-testing step; that floor is Foundry machinery (Infection). Treated as not applicable to this wing; flagging rather than silently dropping. See Open Item #1.
- [x] **Carries the `Agent Review Requested` label** — applied automatically by `.github/workflows/agent-review-label.yml` on PR #253 open; verified via `gh pr view 253 --json labels` after creation.

## Decisions

1. **Default `onError` kept (no custom handler).** The WO's tiebreaker was "follow whatever fs-http's own guarded does for the error-response middleware so the behavior is consistent." fs-form's guarded 422 path uses the default loud `console.error`; introducing a custom handler here would fork the failure semantics the WO wanted unified.
2. **New vitest project rather than relocating the spec.** The spec's natural mirror location (`src/tests/unit/apps/families/services/`) was not covered by any vitest project include. Added `project('families/services', 'apps/families/services')` beside the other families projects instead of parking the spec in the `families/root` single-level include — keeps the test-path-mirrors-src-path convention intact.
3. **Coverage config untouched.** `src/apps/**/services/**` is already coverage-excluded (app service wiring is instantiation-time singletons), so the 100% floor required no threshold or exclude changes; the new spec is behavioral regression coverage, not a coverage-denominator change.

## Open Items / Notes for The Steward

1. **WO AC wording drift:** "plus mutation per-file floor" appears to be Foundry boilerplate carried into a Gallery WO — the Gallery has no mutation tooling. If a Stryker-style floor is intended for the Gallery, that is a separate Work Order.
2. The `Agent Review Requested` label relies on the workflow; checked post-creation per the Atrium charter note about `gh pr create` not adding it on its own.

## Self-Debrief

- **Verified before relying:** fs-http version (0.5.0), `guarded()`'s exact signature/default-handler behavior (read from `dist/`, not assumed from the WO), and the adapter-capture timing that dictates the MockAdapter-before-import test structure.
- **First-pass lint misses:** initial spec draft hit five oxlint errors (`prefer-strict-equal`, `require-mock-type-parameters` ×2, `consistent-type-imports` on an inline `import()` type, and an `any`-typed spy from `ReturnType<typeof vi.spyOn>`). All caught by running the linter immediately after writing, per training — fixed with `toStrictEqual`, typed `vi.fn<typeof actual.fn>` wrappers, a type-only namespace import, and `MockInstance<typeof console.error>`. No new training candidate proposed; existing "run the linter after every code change" rule covered it.
