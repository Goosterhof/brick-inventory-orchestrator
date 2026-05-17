# Building Permit: Post-ADR-016 Case Conversion Cleanup

**Permit #:** 2026-05-05-adr-016-conversion-cleanup
**Filed:** 2026-05-05
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** When-convenient

---

## The Job

ADR-016 (commit `a70b8a9`) restored snake_case ↔ camelCase conversion as HTTP request/response middleware on `familyHttpService`. With the middleware in place, ~40 explicit `deepSnakeKeys` / `deepCamelKeys` / `toCamelCaseTyped` calls scattered across production code are now redundant — idempotent and safe, but architecturally noisy and misleading to a junior reading the codebase. Separately, the integration test mock-server still treats `registerRequestMiddleware` / `registerResponseMiddleware` as no-ops, so its docstring claim that "camelCase transforms run real" is a lie that prevents the integration suite from catching the next conversion regression. This permit cleans both up.

## Scope

### In the Box

**Stream A — remove redundant explicit conversion calls (production code):**

- Remove unnecessary `toCamelCaseTyped<T>(response.data)` and similar inline conversions; the response middleware already converts `response.data` to camelCase. Update the surrounding type annotations where `getRequest<T>()` is correctly typed. Files in scope:
    - `src/apps/families/domains/brick-dna/pages/BrickDnaPage.vue`
    - `src/apps/families/domains/home/pages/HomePage.vue`
    - `src/apps/families/domains/parts/modals/PartUsageModal.vue`
    - `src/apps/families/domains/parts/pages/PartsMissingPage.vue`
    - `src/apps/families/domains/parts/pages/PartsPage.vue`
    - `src/apps/families/domains/sets/modals/AssignPartModal.vue`
    - `src/apps/families/domains/sets/pages/IdentifyBrickPage.vue`
    - `src/apps/families/domains/sets/pages/ScanSetPage.vue`
    - `src/apps/families/domains/sets/pages/SetDetailPage.vue`
    - `src/apps/families/domains/sets/pages/SetsOverviewPage.vue`
    - `src/apps/families/domains/settings/pages/SettingsPage.vue`
    - `src/apps/families/domains/storage/pages/StorageDetailPage.vue`
- Remove the explicit `deepSnakeKeys(...)` POST-payload wrapping in `ScanSetPage.vue` (the request middleware does it).
- Remove `deepSnakeKeys(registrationData)` and `toCamelCaseTyped<Profile>(data)` calls in `src/shared/services/auth/index.ts`. Auth uses the same `httpService` instance, so the middleware applies.
- Update the doc comment in `src/apps/families/types/part.ts:98` — "camelCased at the HTTP boundary by `toCamelCaseTyped`" → reference ADR-016 middleware.
- Drop unused `import {toCamelCaseTyped, deepSnakeKeys, deepCamelKeys} from '@shared/helpers/string'` lines wherever the last consumer is removed; let `knip` confirm they're gone.

**Stream B — make the integration mock-server honor middleware:**

- Update `src/tests/integration/helpers/mock-server.ts` so `registerRequestMiddleware` / `registerResponseMiddleware` actually retain registered functions and apply them on each route resolution. `noop` no longer suffices.
- The mock should invoke registered request middleware on a constructed config-like object before `resolveRoute` (so future tests that assert on request payload shape get faithful conversion).
- The mock should invoke registered response middleware on the response object before returning it.
- Reset registered middleware in `mockServer.reset()`.
- Update the file's docstring — the lie about "camelCase transforms run real" becomes truth.
- Adjust integration fixtures only where necessary: tests that already register snake_case fixtures will start receiving camelCase data through the page (correct behavior); tests that registered camelCase fixtures continue to work because conversion is idempotent. Any test that asserted on raw snake_case values in rendered output is updated to camelCase.

### Not in This Set

- The 6 pre-existing integration test failures (`BrickDnaPage`, `HomePage`, `StorageOverviewPage`) — they were failing before ADR-016 landed; tracked separately.
- `src/shared/composables/useValidationErrors.ts:deepCamelKeys(data.errors)` — **stays.** Response middleware in `fs-http` runs only on success responses; 422 validation errors flow through `responseErrorMiddleware`, which the new middleware does not touch. The explicit conversion here is the only path that camelCases backend error keys (`set_num` → `setNum`) so `errors.setNum` resolves correctly. Removing it would reintroduce the AddSet validation-display bug from a different angle.
- Showcase teaching components — `MiddlewarePipelineVisualizer.vue`, `ResourceAdapterPlayground.vue`, `FormValidationWorkbench.vue` use `deepSnakeKeys` / `deepCamelKeys` to **demonstrate** the conversion concept. Their literal calls are pedagogical, not redundant. Keep as-is unless ADR-016 changes their teaching content.
- The `@shared/helpers/string.ts` barrel re-exports — leave intact. `useValidationErrors`, the showcase demos, and the new middleware all consume them.
- Forking / patching `fs-adapter-store` upstream to restore internal conversion — separate decision, separate permit. ADR-016 explicitly defers this.
- Tightening `getRequest<T>()` response types from `T` to `DeepSnakeKeys<T>` — with middleware, the existing camelCase typing on responses is correct. No type-system rewrite needed.

## Acceptance Criteria

- [ ] No production-code calls to `deepSnakeKeys`, `deepCamelKeys`, or `toCamelCaseTyped` outside:
    - `src/apps/families/services/http.ts` (the middleware itself)
    - `src/shared/composables/useValidationErrors.ts` (carve-out documented above)
    - `src/shared/helpers/string.ts` (barrel re-export)
    - Showcase teaching components (carve-out documented above)
- [ ] `src/tests/integration/helpers/mock-server.ts` registers middleware functions and applies them; docstring matches behavior.
- [ ] All previously passing unit tests still pass; coverage stays at 100% on lines/branches/functions/statements.
- [ ] Integration test suite passes the same 120 tests that pass today; the 6 pre-existing failures remain pre-existing (this permit does not fix them but must not regress them).
- [ ] `npm run knip` confirms no unused imports left behind from removed conversion calls.
- [ ] `npm run type-check`, `npm run lint`, `npm run build` all clean.
- [ ] AddSet bug remains fixed (manual smoke check or new integration test). The fix lives at the middleware layer; the cleanup must not reintroduce the symptom.

## References

- Decision: [ADR-016 — Case conversion via HTTP middleware](../../docs/decisions/016-case-conversion-via-http-middleware.md)
- Superseded Decision: [ADR-004 — Snake/camel case conversion at HTTP boundary](../../docs/decisions/004-case-conversion-boundary.md)
- Parent Commit: `a70b8a9` — `fix(http): restore case conversion via request/response middleware`
- Original Migration That Caused the Drift: PR #158, commit `09f5795` — `refactor: migrate adapter-store, resource-adapter, and helpers to Armory packages`
- Original Migration Permit (which assumed middleware already existed): `2026-04-01-fs-helpers-adapter-store-migration.md:75`

## Notes from the Issuer

This is hygiene, not a bug fix. The AddSet bug is already shipped on `claude/fix-set-number-validation-isFIv` / commit `a70b8a9`. This permit exists because ADR-016's "Open Questions" section explicitly defers two cleanup items, and the CFO does not want them to slip into "everyone forgot."

**Sequencing**: Stream A (remove call sites) and Stream B (mock-server fidelity) are independent. The architect may ship them as a single PR or split them — call it from the construction journal, not before. If splitting, do Stream B first: it's the regression safety net for Stream A. If a Stream A removal accidentally drops a conversion call that's actually load-bearing (i.e., wasn't truly redundant), Stream B's faithful mock will surface it; without Stream B, the integration suite will continue to silently pass on broken conversion paths.

**Trust-but-verify the carve-out**: `useValidationErrors` is the one place where explicit `deepCamelKeys` is load-bearing today. Confirm by reading `node_modules/@script-development/fs-http/dist/index.mjs:38-45` — the success-response middleware pipeline does not run for axios errors; only `responseErrorMiddleware` does, which our new middleware does not register on. If a future change extends ADR-016 to also middleware-convert error responses, this permit's carve-out can be revisited.

**Junior-readability lens (ADR-000)**: a junior who reads `BrickDnaPage.vue` today sees `dna.value = toCamelCaseTyped<BrickDna>(response.data)` and reasonably assumes they need to remember this pattern at every API call. After this permit, they see `dna.value = response.data` and the conversion is invisible — exactly what ADR-016 promised. Verify that promise by spot-checking three pages post-change: a junior should not need to know about `deepCamelKeys` to write a new GET-driven page.

---

**Status:** Open
**Journal:** _to be filed when complete at `.claude/records/journals/2026-05-05-adr-016-conversion-cleanup.md`_
