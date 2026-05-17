# Decision: Case conversion via HTTP middleware

**Date**: 2026-05-05
**Feature**: API communication layer — restoring snake_case ↔ camelCase conversion after the fs-adapter-store package migration silently dropped it
**Status**: accepted (supersedes ADR-004)
**Transferability**: universal

## Context

ADR-004 (2026-03-17) chose explicit `deepSnakeKeys` / `toCamelCaseTyped` calls at every API boundary, explicitly rejecting HTTP middleware on the grounds that it was "too broad, too invisible." That decision was made when BIO owned its own `resource-adapter.ts` and `adapter-store.ts`, both of which performed the conversion internally as a centralized choke point. ADR-006 likewise asserted that "case conversion is invisible — handled inside the repository factory."

On 2026-04-01 (PR #158, commit `09f5795`) those local files were deleted in favor of `@script-development/fs-adapter-store@0.1.4`. The migration permit (`2026-04-01-fs-helpers-adapter-store-migration.md:75`) assumed BIO already had an HTTP-level middleware doing the conversion:

> "BIO already has response middleware (via fs-http) that converts snake→camel before the data reaches the store. Verify this is wired correctly... If any domain bypasses the middleware, that's a bug to surface."

That middleware did not exist. It was never registered. The published `fs-adapter-store` package posts `mutable.value` straight to the HTTP service with no conversion, and `retrieveAll` stores the raw response with no conversion. The migration silently regressed every adapter-driven create/update/patch/retrieve in the codebase. The bug surfaced when a user reported "Set number is required" on `AddSetPage`: the form posted `{setNum: '75192-1', ...}`, the Laravel backend looked for `set_num`, and rejected the request as missing.

The forces have shifted since ADR-004:

- **Adapter is now external** — we no longer own the conversion choke point. The pattern that ADR-004 relied on (centralized in our own repository factory) no longer applies.
- **War-room precedent** — sibling territories adopted HTTP middleware for the same conversion, and the pattern has held up in production.
- **The "invisibility" objection has flipped** — explicit per-call-site conversion was supposed to be greppable and visible, but in practice it produced a 20+ call-site footprint, easy to forget at new boundaries, and silently broken when the adapter regressed. Visibility didn't prevent the bug; it just spread the responsibility thin enough that no one noticed it was missing.

## Options Considered

| Option                                                                      | Pros                                                                                                                                                                                                                                                      | Cons                                                                                                                                                                                                                                                                            | Why eliminated / Why chosen                                                                                                                            |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Restore explicit conversion at every adapter call site**                  | Honors the original ADR-004 spirit. No new middleware abstraction.                                                                                                                                                                                        | Bypasses the adapter's `create()` / `update()` / `patch()` methods, which is the API surface ADR-006 designed for. Forces every domain page to know about case conversion. Already proven brittle — the migration regression is exactly this failure mode at the package level. | Eliminated — it papers over the symptom and contradicts ADR-006's "case conversion is invisible" promise.                                              |
| **Patch / fork `fs-adapter-store` upstream to restore internal conversion** | Most architecturally pure — restores the pre-migration contract.                                                                                                                                                                                          | We don't own the package's release cadence. Fork creates ongoing maintenance debt. Other Armory consumers would need to coordinate. Doesn't help inbound conversion for non-adapter HTTP calls (auth, settings, scan, etc.).                                                    | Eliminated for now — useful as a longer-term cleanup but not the right fix for today's regression.                                                     |
| **HTTP request/response middleware (per a sibling territory's pattern)**    | Single registration point. Catches every HTTP call — adapter and non-adapter alike. Already battle-tested in a sibling territory. Fixes the bug for all current and future call sites at once. Mirrors what the migration permit assumed already existed. | Reverses ADR-004's explicit rejection of middleware. Risk of converting things that shouldn't be converted (FormData, Blob) — addressed by guards.                                                                                                                              | **Chosen** — the world ADR-004 was written for no longer exists. Aligning with a sibling territory also lowers the cost of the next package migration. |

## Decision

Register two middleware functions on each app's `HttpService` instance immediately after construction:

```ts
familyHttpService.registerRequestMiddleware((config) => {
    if (config.data && !(config.data instanceof FormData)) config.data = deepSnakeKeys(config.data);
});

familyHttpService.registerResponseMiddleware((response) => {
    if (response.data && typeof response.data === 'object') response.data = deepCamelKeys(response.data);
});
```

The shape is byte-for-byte the same as a sibling territory's. Cross-territory consistency is part of the value.

**Guards:**

- **Outbound** — skip `FormData` instances. Multipart bodies (e.g., `IdentifyBrickPage` image upload) must reach the wire untouched.
- **Inbound** — skip non-object responses (strings, numbers, `null`, `undefined`). The `typeof === 'object'` check is sufficient for the families app today; if blob downloads (`responseType: 'blob'`) are added, this guard must be tightened to also exclude `Blob` / `ArrayBuffer`.

**ADR-004 is superseded.** ADR-006's "case conversion is invisible" claim is preserved but now points at this middleware as the actual mechanism rather than the (now-external) repository factory.

## Consequences

- **The AddSet bug is fixed** — and so is every other latent conversion miss in the adapter call graph (`update`, `patch`, `retrieveAll`, `retrieveById`).
- **Existing explicit conversion calls become redundant.** They remain idempotent, so leaving them in place is safe for now (`deepSnakeKeys` and `deepCamelKeys` on already-converted data return the same object). A follow-up cleanup PR should remove the ~20 redundant `toCamelCaseTyped` / `deepSnakeKeys` call sites in production code and the surrounding type assertions; tracked separately to keep this PR's blast radius contained.
- **Cross-territory consistency** — BIO and a sibling territory now share the same conversion mechanism, which makes future fs-http migrations safer for both.
- **One escape hatch needs care** — any future endpoint whose request or response should not be converted (e.g., a passthrough proxy, an external API call, a binary download) must opt out at the call site. The middleware applies universally to anything routed through `familyHttpService`. The `FormData` and `typeof object` guards are the only built-in opt-outs.
- **The integration test mock-server is now lying louder.** It documents that "camelCase transforms run real" while skipping the middleware entirely. Tests don't currently assert on the values that would differ, so nothing breaks today, but the docstring should be updated and the mock should call registered middleware in a follow-up — otherwise the integration suite cannot catch the next conversion regression.

## Enforcement

| What                                                                                                                                    | Mechanism                                                                                                               | Scope                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Each app's `HttpService` registers the two middleware functions before any caller uses it                                               | Code review on `apps/*/services/http.ts` — there is exactly one such file per app, and it is short enough to spot-check | `apps/families/services/http.ts` (admin and showcase do not currently make API calls; if they add one, this ADR's enforcement extends there) |
| Middleware uses `deepSnakeKeys` / `deepCamelKeys` from `@shared/helpers/string` (which re-export from `@script-development/fs-helpers`) | Import path is the existing standard; no new lint rule needed                                                           | `apps/*/services/http.ts`                                                                                                                    |

Automated detection of the regression (i.e., a test that catches "the middleware was removed") is deferred to the integration mock-server cleanup follow-up.

## Resolved Questions

### Why not restore explicit conversion and leave ADR-004 standing?

**Resolved 2026-05-05.** Because the migration regression already proved that explicit conversion is brittle when the choke point moves out of our repo. ADR-004's strongest argument — "you can grep for `deepSnakeKeys` and `toCamelCaseTyped` to find every API boundary" — assumed those calls were the only mechanism. With the package now stripping internal conversion, callers who relied on the adapter (`AddSetPage`, `EditSetPage`, etc.) had no `deepSnakeKeys` call to grep for, so the bug was invisible to that detection method. Middleware moves the choke point back inside our repo where we control it.

### Does this contradict ADR-002 (visibility-over-magic) and the cited "junior follows literally" principle from ADR-000?

**Resolved 2026-05-05.** No — and this is the same reasoning a sibling territory arrived at. A junior who reads `apps/families/services/http.ts` sees the conversion in 4 lines of code. A junior who debugs why `setNum` shows up as `set_num` in the network tab follows the http service to the same file. The middleware is invisible from a single component's perspective but central and grep-able from the architectural perspective. ADR-004's "visibility" was visibility in 20+ places; this ADR's visibility is in 1 place. Both are visible — this one is just more honest about where the responsibility lives.

### Why not patch the package and bump the version?

**Resolved 2026-05-05.** Because (a) the package is shared across multiple territories and changing its behavior would surprise the others, (b) the inbound conversion problem affects non-adapter HTTP calls too (auth, settings page, etc.), so a package-internal fix wouldn't be sufficient anyway, and (c) the middleware approach generalizes cleanly to future packages that consume the http service. A package-side fix may still happen as a separate cleanup, but it is not the right shape for today's bug.

## Open Questions

- **Mock-server fidelity.** The integration test mock currently treats `registerRequestMiddleware` / `registerResponseMiddleware` as no-ops. It should either invoke registered middleware on each route resolution, or apply the conversion directly to mirror production. Tracked as a follow-up; today's tests do not assert on values that would differ, so the lie is not currently observable.
- **Should the middleware live in `fs-http`?** BIO and a sibling territory both register the same shape. If a third territory adopts the pattern, extracting to `fs-http` (as an opt-in option, e.g., `createHttpService(url, {convertCase: true})`) becomes worthwhile. Today, two consumers is below that threshold.
- **Long-term cleanup of redundant explicit calls.** ~20 production call sites still invoke `toCamelCaseTyped` / `deepSnakeKeys` directly. They are idempotent and safe but architecturally noisy. A separate permit should remove them once the middleware has shipped and stabilized.
