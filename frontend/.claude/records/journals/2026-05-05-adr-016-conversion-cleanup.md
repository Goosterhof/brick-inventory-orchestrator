# Construction Journal: Post-ADR-016 Case Conversion Cleanup

**Journal #:** 2026-05-05-adr-016-conversion-cleanup
**Filed:** 2026-05-05
**Permit:** [`2026-05-05-adr-016-conversion-cleanup`](../permits/2026-05-05-adr-016-conversion-cleanup.md)
**Architect:** Lead Brick Architect

---

## Work Summary

Two streams shipped on `claude/check-architect-permit-lDYDn`. Per the permit's "Notes from the Issuer" guidance, Stream B (mock-server fidelity) shipped first as a regression safety net for Stream A (call-site cleanup).

| Action   | File(s)                                                                 | Notes                                                                                                                                                                                                                                                   |
| -------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modified | `src/tests/integration/helpers/mock-server.ts`                          | Stream B. Middleware retained on registration, applied per route resolution. `reset()` clears routes only — middleware persists across tests to mirror production's once-at-module-load registration. New `clearMiddleware()` for the rare clean slate. |
| Modified | 12 production page/modal files (paths below)                            | Stream A. ~17 explicit `toCamelCaseTyped` calls and 1 `deepSnakeKeys` POST-payload wrap removed. `@shared/helpers/string` import dropped where it was the last consumer.                                                                                |
| Modified | `src/shared/services/auth/index.ts`                                     | Stream A. Drops `deepSnakeKeys(registrationData)` and four `toCamelCaseTyped<Profile>(data)` calls. `getRequest<T>` / `postRequest<T>` typed as `T` directly.                                                                                           |
| Modified | `src/apps/families/types/part.ts`                                       | Stream A. Doc comment now references ADR-016 middleware.                                                                                                                                                                                                |
| Modified | `src/shared/helpers/string.ts`                                          | Stream A. Drops unused `DeepSnakeKeys` re-export.                                                                                                                                                                                                       |
| Modified | `package.json`, `package-lock.json`                                     | Stream A. Drops direct `string-ts` dep; remains transitive via `@script-development/fs-helpers`.                                                                                                                                                        |
| Modified | `src/tests/unit/shared/services/auth/index.spec.ts`, `register.spec.ts` | Stream A. Each gains a local `createWiredHttpService` that registers the middleware shape from production.                                                                                                                                              |

The 12 modified production files:

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

## Permit Fulfillment

| Acceptance Criterion                                                      | Met                  | Notes                                                                                                                                                                                     |
| ------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No production calls to the helpers outside the four documented carve-outs | Yes                  | Verified by `grep -rn`. Carve-outs: `apps/families/services/http.ts` (middleware), `useValidationErrors.ts`, `shared/helpers/string.ts` barrel, `ResourceAdapterPlayground.vue` teaching. |
| Mock-server registers + applies middleware; docstring matches             | Yes                  | Three middleware arrays, applied per route resolution. Docstring rewritten.                                                                                                               |
| Unit tests still pass; coverage 100%                                      | Yes                  | 1295/1295. Statements/Branches/Functions/Lines all 100%.                                                                                                                                  |
| Integration: same 120 passing; 6 pre-existing failures unchanged          | Yes (overshot to +2) | 122/126 passing. 4 remaining are strict subset of the 6 baseline failures (translation drift).                                                                                            |
| Knip confirms no unused imports                                           | Yes                  | Surfaced + cleaned `DeepSnakeKeys` re-export and direct `string-ts` dep.                                                                                                                  |
| type-check / lint / build clean                                           | Yes                  | All clean. Lint warning count matches baseline.                                                                                                                                           |
| AddSet bug remains fixed                                                  | Yes                  | Middleware in `apps/families/services/http.ts` unchanged; `AddSetPage.spec.ts` still passes.                                                                                              |

## Decisions Made

1. **Sequencing — Stream B first.** Per the permit's recommendation. Splitting the streams gave a clean midpoint where Stream B was provably a safe no-op refinement (still 120/126 passing) before Stream A landed.

2. **`mockServer.reset()` preserves middleware.** First Stream B draft cleared all three middleware arrays in `reset()`. Stream A then broke 34 integration tests because the second test in each file lost the production middleware that the first test had registered (module-cached registration runs once). Two options: (a) re-register middleware in every `beforeEach`, or (b) make `reset()` clear only routes. Chose (b) — production registers middleware once at app-load and never tears it down; the mock should mirror that. Added a separate `clearMiddleware()` for tests that genuinely want a clean slate.

3. **Auth-service tests register the middleware shape locally.** Two options: shared test helper, or inline. Chose inline because there are only two consumers; a new shared test helper would be over-engineering. The 6-line helper is duplicated; a third consumer is the trigger to extract.

4. **Did NOT flip literal snake_case POST keys to camelCase.** `AssignPartModal.vue:48-51` (`{part_id, color_id, quantity}`) and `SettingsPage.vue:147-148` (`{rebrickable_user_token}`) still ship literal snake_case keys to `postRequest`. The middleware's `deepSnakeKeys` is idempotent so this is safe but architecturally inconsistent. The permit listed 13 specific files and singular `deepSnakeKeys(...)` removal in `ScanSetPage.vue`; flipping these would be scope creep. Flagged for a future hygiene permit.

5. **Did NOT update integration test fixtures from snake_case to camelCase.** With Stream B's middleware fidelity, existing snake_case fixtures now flow through `deepCamelKeys` exactly as in production. Page assertions on rendered output already used camelCase. No fixture rewrites needed.

6. **Did NOT split commits at file granularity for Stream A.** All Stream A changes plus the `mockServer.reset()` refinement landed in `ce2b7cf`. The reset() refinement is logically Stream B but was forced by Stream A's integration impact, so co-locating it with the cause is the most honest framing.

## Quality Gauntlet

| Check         | Result | Notes                                                                                                                          |
| ------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| format:check  | Pass   | 477 files                                                                                                                      |
| lint          | Pass   | 46 warnings / 0 errors (matches baseline; no new warnings)                                                                     |
| lint:vue      | Pass   | All conventions passed                                                                                                         |
| type-check    | Pass   | `vue-tsc --build` clean                                                                                                        |
| test:coverage | Pass   | 1295/1295 unit tests; Statements 100% (1317/1317), Branches 100% (1028/1028), Functions 100% (386/386), Lines 100% (1236/1236) |
| knip          | Pass   | No unused files/exports/dependencies                                                                                           |
| size          | Pass   | families 123.91 kB / 350 kB limit; admin 30.8 kB / 150 kB limit                                                                |
| build         | Pass   | 3 apps built                                                                                                                   |

Integration suite (separate config, not in the pre-push gauntlet): **122/126 passing** (was 120/126 baseline). The 4 remaining failures are a strict subset of the 6 pre-existing translation-drift failures; out of scope per the permit. Two `StorageOverviewPage` tests that previously failed because the adapter store ate an unconverted snake_case fixture now pass — Stream B's mock fidelity meeting Stream A's removed double-conversion.

## Showcase Readiness

This delivery is showcase-quality.

- A junior writing a new GET-driven page sees `dna.value = response.data` and copies that pattern. The conversion is invisible from the call site and centralized in `apps/families/services/http.ts` — exactly what ADR-016 promised. Junior-readability spot-check across `BrickDnaPage`, `StorageDetailPage`, and `SetDetailPage` confirms this.
- The integration mock-server now tells the truth. Its docstring used to claim "camelCase transforms run real" while skipping the middleware entirely. Now the docstring matches behavior, and the integration suite can catch the next conversion regression.
- Auth-service tests model the production contract honestly. Each test wires the middleware on its `httpService` exactly as production does.
- Net positive on test count. Two previously-failing integration tests now pass because the mock-server fidelity surfaced the right behavior. No regressions, two unblocked.
- One small architectural inconsistency remains (Decision #4) — flagged for a future hygiene permit.

## Proposed Knowledge Updates

- **Learnings:** propose adding _"After ADR-016, when a test that constructs its own `httpService` exercises a contract that depended on case conversion, register the same request/response middleware shape from `apps/families/services/http.ts` on the test httpService. The contract under test is the wired service, not the raw httpService."_
- **Pulse:**
    - Update **Pattern Maturity** row "Case conversion at HTTP boundary" to reference ADR-016 explicitly. The pattern is still battle-tested, but the implementation moved from explicit per-call-site to middleware.
    - Add `PartsPage.spec.ts` collect-guard breach (588ms baseline / 707ms in coverage) to **Active Concerns** — discovered during the gauntlet, pre-existing, not caused by this permit but worth tracking.
- **Domain Map:** no changes.
- **Component Registry:** auto-generated; no manual updates.
- **Decision Record:** no new ADR. ADR-016's Open Questions section explicitly tracked "mock-server fidelity" and "long-term cleanup of redundant explicit calls" as deferrals; this permit closes both. Suggest the CFO mark those two Open Questions as resolved with a forward-reference to this journal.

## Self-Debrief

### What Went Well

- Sequencing instinct paid off — doing Stream B first gave a clean baseline check before Stream A landed.
- Carve-out verification (`fs-http/dist/index.mjs:38-45`) was load-bearing — without that read I might have second-guessed `useValidationErrors`'s `deepCamelKeys` carve-out.
- Knip surfaced the right cleanup chain. First pass flagged `DeepSnakeKeys`. Removing it surfaced `string-ts`. Each step was small and honest.
- The two recovered `StorageOverviewPage` tests are the strongest validation of the permit's premise — Stream A and Stream B together produced behavior neither could alone.

### What Went Poorly

- First Stream B draft cleared middleware in `reset()`. Discovered the hard way when 34 integration tests failed on Stream A. The fix was small but the diagnosis was a 5-minute detour avoidable by asking "how long does this live in production?" first.
- I read all 12 Stream A files up front in two parallel batches. For 10 files with the identical pattern, batch grep-and-replace with on-demand reading for irregular ones would have been faster.

### Blind Spots

- Almost missed the literal snake_case POST keys (`AssignPartModal`, `SettingsPage`). I read them, recognized them, and made a deliberate scope decision — a less attentive pass might have either silently flipped or silently skipped.
- Didn't proactively check `vi.mock('string-ts', ...)` resolution via transitive dep before removing the direct dep. Confirmed by running tests rather than reasoning from `fs-helpers/package.json`.

### Training Proposals

| Proposal                                                                                                                                                                                                                                                                                                                                                                                                              | Context                                                                                                                                                   | Shift Evidence                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| When changing the lifecycle semantics of a test helper that mirrors a production lifetime (registration, subscription, singleton), trace the production wiring's actual lifetime first. Production registers middleware once at module-load and never tears it down; a test `reset()` that clears it per-test is reaching for "isolation" but breaking "fidelity." Resolve in favor of fidelity unless tests opt out. | Stream B's first draft cleared middleware in `reset()`, breaking 34 integration tests on Stream A. The fix took 30 seconds; the diagnosis took 5 minutes. | 2026-05-05-adr-016-conversion-cleanup |
| When a permit calls for removing N "redundant" call sites and N is large, batch the identical-pattern edits via grep-and-replace and reserve full-file reads for the irregular ones. Reading all N files in advance is thorough but adds latency without proportional value.                                                                                                                                          | Stream A: 12 files, 10 identical pattern, 2 irregular. Read all 12 up front.                                                                              | 2026-05-05-adr-016-conversion-cleanup |
| Before removing a direct package dependency consumed only via `vi.mock(packageName, ...)` in tests, confirm the package remains a transitive dep so npm hoists it and `vi.mock` continues to resolve. Reason from the dep tree before removing, not after.                                                                                                                                                            | Removed `string-ts` from direct deps. It remains transitive via `fs-helpers`. Confirmed by running tests rather than reasoning ahead.                     | 2026-05-05-adr-016-conversion-cleanup |

---

## CFO Evaluation

**Filed:** 2026-05-05 (same day)
**Overall Assessment:** Excellent

### Permit Fulfillment Review

Every acceptance criterion met, with two unbudgeted wins:

1. **Two integration tests recovered.** The permit said "must not regress" the 6 baseline failures and did not anticipate any of them being fixed as a side effect. `StorageOverviewPage > renders real ListItemButton for each storage option` and `StorageOverviewPage > navigates to detail on ListItemButton click` now pass — Stream A removed the double-conversion that was corrupting the adapter-store fixture, and Stream B's middleware fidelity made the conversion happen in the mock layer instead. The recorded "6 pre-existing failures" baseline in the permit is now stale at 4. Pulse will be updated.

2. **Knip-driven cleanup chain.** The architect's first pass flagged `DeepSnakeKeys`. Removing it surfaced direct `string-ts`. Each step landed honestly without dragging unrelated cleanup into scope. This is the right way to use knip — incrementally, not as a justification for sprawling diffs.

Trust-but-verify: I re-ran type-check, knip, and test:coverage on the architect's pushed branch myself. All pass. `grep -rn "toCamelCaseTyped\|deepSnakeKeys\|deepCamelKeys" src` confirms only the four documented carve-outs remain in production code (middleware, barrel, `useValidationErrors`, `ResourceAdapterPlayground`).

### Decision Review

All six decisions are well-reasoned. Three deserve specific commentary:

- **Decision #2 (`reset()` preserves middleware)** is the kind of decision that separates senior from mid-level work. The architect hit a 34-test failure cliff, diagnosed it as a lifecycle mismatch (not a wiring bug), traced it to "production registers once at module-load," and chose fidelity over per-test isolation. The escape hatch (`clearMiddleware()`) for the rare clean-slate case is exactly right. The architect flagged this as something they could have gotten right faster with a different up-front question — that's also right, and it's the basis for one of their training proposals.

- **Decision #4 (left literal snake_case POST keys)** is correct scope discipline. The two flagged sites (`AssignPartModal`, `SettingsPage`) are architecturally inconsistent but functionally fine because `deepSnakeKeys` is idempotent. Flipping them was not in the permit's listed file scope. Closing them belongs in a follow-up hygiene permit, not in this one. **CFO will file that follow-up permit** when capacity allows.

- **Decision #6 (single Stream A commit)** is honest framing — co-locating the `reset()` refinement with the diff that forced it is more readable than scattering it across two commits in service of a clean stream-by-stream narrative.

No decision should have escalated to the CEO. All within architect authority.

### Showcase Assessment

Strengthens the portfolio. Specifically:

- **The middleware story now tells itself.** ADR-016 set up the architecture; this permit removed the residual scaffolding from the old approach. A senior reviewer reading `BrickDnaPage.vue` today sees a clean call site with no manual case conversion noise. ADR-016's "junior-readability" promise is now visibly delivered.
- **The mock-server change is a quality signal.** The previous state was "the docstring lies but the tests pass anyway." That's a smell juniors would learn from. The fixed state — mock honors registered middleware, docstring matches behavior — is a teaching artifact.
- **Net-positive test count is rare in cleanup work.** Most cleanup permits at best preserve test count. Recovering two integration tests as a structural side effect demonstrates that the cleanup wasn't just hygiene — it surfaced and resolved a latent inconsistency.

One observation, not a deduction: the architect proposed adding `PartsPage.spec.ts` collect-guard breach (588ms / 707ms) to **Active Concerns**. My own gauntlet run flagged `SetsOverviewPage.spec.ts` (1009ms) and `ComponentGallery.spec.ts` (600ms) instead — different files. These guards are run-to-run variable; both observations are likely real but transient. CFO will land the architect's proposed Pulse update with a note that breaches drift between SetsOverviewPage / ComponentGallery / PartsPage depending on machine state, and the larger pattern (heavy-import tests) is the actual concern, not any single file.

### Training Proposal Dispositions

| Proposal                                                                                        | Disposition | Rationale                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lifecycle of test helpers must mirror production lifetime; `reset()` should not break fidelity  | Candidate   | Specific, actionable, evidence-backed (34 tests broke). The "ask 'how long does this live in production?' first" framing is teachable. First observation; needs a second confirming shift before graduation. |
| Batch identical-pattern edits via grep-and-replace; reserve full-file reads for irregular cases | Candidate   | Actionable, evidence-backed (12 files read, 10 were identical). Slightly soft — "large N" needs a number. Accepting as candidate; if it recurs I'll sharpen the threshold.                                   |
| Verify transitive dep before removing a direct dep consumed only via `vi.mock`                  | Candidate   | Specific, actionable, evidence-backed. The "reason from dep tree before removing, not after" framing is teachable. First observation.                                                                        |

### Graduation Check

The 2026-04-29 candidate — _"Before deciding whether an HTTP utility at the call site is redundant, grep `registerRequestMiddleware` / `registerResponseMiddleware` in the app's `services/` directory"_ — gets a **second confirming observation** from this shift. The architect's carve-out verification (reading `fs-http/dist/index.mjs:38-45` to confirm middleware behavior, and confirming via the existing `apps/families/services/http.ts` middleware that the call sites really were redundant) is the inverse application of the same heuristic: in 2026-04-29 the answer was "no middleware → keep the call," in 2026-05-05 the answer was "middleware exists → remove the call." Same lesson, both directions exercised.

Graduation tests are drafted in the Dispatch Report. If they pass, the candidate graduates to "When You Build" guidance.

### Notes for the Architect

Repeat:

- The Stream B-first sequencing instinct.
- The fs-http source read to verify the carve-out. Reading the dist code rather than reasoning about it from documentation is the right move when correctness depends on a third-party's behavior.
- The honesty about "I read 12 files when 2 would have done" — that's exactly the right self-debrief texture.

Do differently next time:

- Before extending or modifying a test helper that mirrors a production wiring, write down (mentally or on paper) "production lifetime = X" before touching the helper's lifecycle methods. Stream B's `reset()` mistake would have been caught at the design stage instead of at the integration-suite stage.
- For large N similar edits, write the grep-replace script first and only fall back to full-file reads for the files where the script reports "no match" or "ambiguous match." Saves real time on permits with 10+ near-identical sites.

CFO files this evaluation as Excellent. Permit closed.
