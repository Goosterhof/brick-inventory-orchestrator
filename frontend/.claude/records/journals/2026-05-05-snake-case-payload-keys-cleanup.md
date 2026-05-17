# Construction Journal: Snake-Case Payload-Key Cleanup

**Journal #:** 2026-05-05-snake-case-payload-keys-cleanup
**Filed:** 2026-05-05
**Permit:** [`2026-05-05-snake-case-payload-keys-cleanup`](../permits/2026-05-05-snake-case-payload-keys-cleanup.md)
**Architect:** Lead Brick Architect

---

## Work Summary

Surgical hygiene pass closing the last loose end from ADR-016. Three literal snake_case keys in two production files replaced with their camelCase equivalents; the request middleware (`deepSnakeKeys` registered on `familyHttpService` per `apps/families/services/http.ts`) handles the wire-format conversion downstream.

| Action   | File                                                                             | Notes                                                                                             |
| -------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Modified | `src/apps/families/domains/sets/modals/AssignPartModal.vue`                      | `part_id` -> `partId`, `color_id` -> `colorId` in the POST `/storage-options/:id/parts` payload   |
| Modified | `src/apps/families/domains/settings/pages/SettingsPage.vue`                      | `rebrickable_user_token` -> `rebrickableUserToken` in the PUT `/family/rebrickable-token` payload |
| Modified | `src/tests/unit/apps/families/domains/sets/modals/AssignPartModal.spec.ts`       | `mockPostRequest` assertion updated to camelCase keys                                             |
| Modified | `src/tests/unit/apps/families/domains/settings/pages/SettingsPageConfig.spec.ts` | `mockPutRequest` assertion updated to camelCase key                                               |

## Middleware-Pipeline Verification

Per the permit's hard requirement, I confirmed `deepSnakeKeys` is registered on the request pipeline for both endpoints before editing:

- `src/apps/families/services/http.ts:9-11` — `familyHttpService.registerRequestMiddleware((config) => { if (config.data && !(config.data instanceof FormData)) config.data = deepSnakeKeys(config.data); });`
- Both modified files import `familyHttpService` from `@app/services` (re-export of the same singleton) and call `postRequest` / `putRequest` on it.
- The middleware runs unconditionally on any non-FormData request body, so a JS object with camelCase keys flowing into `postRequest` / `putRequest` will reach the wire as snake_case. The modified payloads are plain JS objects, not FormData.
- Server wire format is unchanged (the permit's "Not in This Set" constraint).

The premise holds; no pause-and-report scenario triggered.

## Test-Layer Assertion Shape

**Chose:** camelCase pre-middleware assertions.

**Why:** Both unit-test files mock `@app/services` directly with `vi.fn()` for `getRequest` / `postRequest` / `putRequest`, bypassing the real `familyHttpService` and therefore bypassing the request middleware entirely. The mock captures whatever the call site passes literally — so the assertion necessarily mirrors the call-site object shape. After the production edit, that shape is camelCase.

The alternative — asserting on the post-middleware snake_case payload — would require rewiring both spec files to mount the real `httpService` with the production middleware shape and mock at the axios layer, exactly the refactor the permit warned about as scope creep ("splitting 'edit two payload objects' from 'rewire the test layer' may be the right call"). The simpler assertion shape is also the more honest one for what these tests are actually exercising: "did the call site pass the right object to the http facade?" — not "did the wire payload reach the network in the right format?" That second concern lives at the integration layer, where Stream B of the predecessor permit already wired the mock-server to apply registered middleware.

Net: zero test rewiring, one literal-string update per file.

## Permit Fulfillment

| Acceptance Criterion                                                                    | Met | Notes                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grep` for snake_case payload keys in `AssignPartModal.vue` returns zero matches        | Yes | Verified post-edit; only payload-position keys were targeted, no comment/string false positives                                                                                        |
| Same grep against `SettingsPage.vue` returns zero matches                               | Yes | Verified post-edit                                                                                                                                                                     |
| Network still receives the same snake_case body (verified via test or middleware trace) | Yes | Middleware in `apps/families/services/http.ts:9-11` is unchanged, runs `deepSnakeKeys` on every non-FormData body, idempotent on already-snake'd keys (which we no longer pass anyway) |
| `npm run test:coverage` — 100% retained, all unit tests pass                            | Yes | 1297/1297 tests; Statements 100% (1317/1317), Branches 100% (1028/1028), Functions 100% (386/386), Lines 100% (1236/1236)                                                              |
| Pre-push gauntlet clean                                                                 | Yes | All 7 checks pass — see Quality Gauntlet section                                                                                                                                       |
| Journal records test-assertion shape choice and reasoning                               | Yes | See "Test-Layer Assertion Shape" above                                                                                                                                                 |

## Third-Site Check

Per the permit ("if a third site exists, the architect should flag it in the journal but not silently expand scope"), I ran `grep -rnE "[a-z]+_[a-z]+:\s*[a-zA-Z_.]+" src/apps/families/domains --include="*.vue" --include="*.ts"` filtering out comment lines. Result: **only the three documented keys in the two listed files**. No third site found. After the edit, the same grep returns zero matches across the entire families domain tree.

I also verified the integration-test snake_case occurrences (`brick-dna`, `parts/missing`, `parts` page specs) are response-fixture data — those flow through `deepCamelKeys` response middleware and are correct as-is. Not in scope.

## Decisions Made

1. **CamelCase-pre-middleware test assertions.** Detailed in "Test-Layer Assertion Shape" above. Rejected alternative: rewire test mocking to axios layer to assert post-middleware. The rewire would be a 2-3 hour scope expansion to gain the same correctness guarantee that integration tests (Stream B mock-server fidelity) already provide for the wire format. Not worth the trade.

2. **Did not touch `apps/admin` or `apps/showcase`.** The permit explicitly carved these out per the just-graduated middleware-awareness heuristic — those apps register no request middleware, so any literal snake_case keys there would be structurally required, not redundant. Confirmed via `grep`: no matches in admin/showcase that map to outbound payloads.

3. **Did not touch integration-test fixtures.** Stream B (mock-server middleware fidelity) means existing snake_case integration-test fixtures flow through `deepCamelKeys` correctly. Page assertions on rendered output are in camelCase already. No fixture rewrites needed and none in scope.

## Quality Gauntlet

| Check         | Result | Notes                                                                                                                          |
| ------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| format:check  | Pass   | 480 files                                                                                                                      |
| lint          | Pass   | 46 warnings / 0 errors (matches baseline; no new warnings)                                                                     |
| lint:vue      | Pass   | All conventions passed                                                                                                         |
| type-check    | Pass   | `vue-tsc --build` clean                                                                                                        |
| test:coverage | Pass   | 1297/1297 unit tests; Statements 100% (1317/1317), Branches 100% (1028/1028), Functions 100% (386/386), Lines 100% (1236/1236) |
| knip          | Pass   | No unused files/exports/dependencies                                                                                           |
| size          | Pass   | families 124.04 kB / 350 kB; admin 30.8 kB / 150 kB                                                                            |

Coverage-mode collect/test guard breaches observed (AboutPage 618ms, SetsOverviewPage 958ms, BrickDnaPage 1805ms, App 2279ms, HomePage 1125ms-delta, ComponentGallery 619ms) are pre-existing, tracked in Pulse Active Concerns, and not introduced by this permit. Bundle size delta from baseline is +0.13 kB (124.04 vs 123.91 from the predecessor journal) which is below noise — the only behavior change is two literal-string keys swapped, no new imports or runtime branches.

## Showcase Readiness

This delivery is showcase-quality, but it is genuinely small.

What it demonstrates well:

- **The middleware abstraction is the abstraction.** A senior reviewer reading `AssignPartModal.vue` post-change sees `{partId, colorId, quantity}` — a JS-idiomatic object. They have to grep for the wire format. That's exactly what ADR-016 promised: case conversion is a transport concern, not a call-site concern.
- **Test mocking matches mocking strategy.** The unit tests still mock at the service-facade layer (the production contract for these pages) and assert on the same. Nothing in the test setup got rewired to chase a stronger assertion that integration tests already provide.
- **No scope creep.** Permit said three keys in two files, journal flags zero additional sites, gauntlet shows zero collateral churn. The diff is exactly six lines of production change and three lines of test-assertion change.

What it doesn't demonstrate (because nothing in scope warranted it):

- New patterns. None introduced. None needed.
- New ADRs. ADR-016 already covers the decision; this is enforcement.

If a senior asked "why are these the only two files that ever had this pattern in the first place?" — the predecessor journal's Decision #4 has the answer: the predecessor permit's Stream A explicitly listed 13 files; flipping these would have been scope creep there. Today's permit closes that intentional carve-out. The paper trail tells the full story.

## Proposed Knowledge Updates

- **Learnings:** None proposed. The middleware-awareness heuristic graduated 2026-05-05 already covers the reasoning; this permit was its first production application post-graduation, and it worked exactly as the heuristic predicted.
- **Pulse:** No structural change. Optionally, Pattern Maturity row "Case conversion at HTTP boundary" could note "Last call-site exceptions removed 2026-05-05" — but that's archaeological detail, not state-of-the-territory information. CFO's call.
- **Domain Map:** No changes.
- **Component Registry:** No component changes.
- **Decision Record:** No new ADR. ADR-016's Open Questions were marked resolved by the predecessor journal's CFO evaluation; this permit's only contribution to that record is "the carve-out flagged in the predecessor journal's Decision #4 has been closed."

## Self-Debrief

### What Went Well

- **Verified the middleware premise before editing**, not after. Read `apps/families/services/http.ts` first, confirmed `deepSnakeKeys` runs on every non-FormData body, then edited. The just-graduated middleware-awareness heuristic made this the natural first step.
- **Test-assertion shape decided in one read.** Looking at `vi.mock('@app/services', () => createMockFamilyServices(...))` made the answer immediately clear: mocks bypass middleware, so camelCase pre-middleware is the only feasible shape without a test rewire. No detour into "should I rewire" wheel-spinning.
- **Third-site check done with one grep.** Used the permit's recommended pattern (`[a-z]+_[a-z]+:\s*[a-zA-Z_.]+`) before and after the edit. Pre-edit: 3 hits in 2 files. Post-edit: 0 hits in 2 files. Permit's "if a third exists, flag it" condition resolved cleanly.
- **Right-sized work.** Permit estimated ~30 minutes; actual elapsed time matched. No scope creep, no rabbit holes.

### What Went Poorly

- Nothing material. The work was small enough that any "what went poorly" answer would be confabulated.

### Blind Spots

- I checked the unit test files for assertion impact but did not initially check whether any **integration test** asserts on the POST/PUT payload for these endpoints. Caught it on the second pass with `grep -rn "rebrickable-token\|/parts'" src/tests`. Result was that no integration test asserts on the payload object (they assert on rendered output and middleware-applied response transforms), but I should have run that grep up front rather than as a verification afterthought.

### Training Proposals

| Proposal                                                                                                                                                                                                                                                                                                        | Context                                                                                                                                                                                                                        | Shift Evidence                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| When a permit modifies a call-site payload object, grep `src/tests` (both unit and integration directories) for the endpoint URL up front to map all assertion-blast-radius before editing — not as a verification step after.                                                                                  | This permit: the integration-test check was an after-the-fact pass; it happened to find nothing, but that's luck, not process. A future permit on a more-tested endpoint could discover an integration assertion mid-gauntlet. | 2026-05-05-snake-case-payload-keys-cleanup |
| When a unit test mocks the service facade directly (`vi.mock('@app/services', ...)`), the test asserts on the **call-site shape**, not the wire shape. Don't reach for "but the wire format is snake_case" reasoning when deciding what an assertion should be — first check what layer the mock intercepts at. | This permit's test-assertion shape decision: I considered the wire shape first, caught myself, then traced the mock layer. Would have been faster to lead with "what does the mock intercept?"                                 | 2026-05-05-snake-case-payload-keys-cleanup |

---

## CFO Evaluation

_Appended 2026-05-05 by the CFO after reviewing the journal and verifying the diff._

**Overall Assessment:** Excellent

### Permit Fulfillment Review

Permit asked for three keys in two files; journal delivers exactly that, plus the four test-assertion follow-throughs the permit's "update any same-file unit tests" clause demanded. CFO independently re-ran the permit's grep — zero matches across both files in payload position; confirmed via `git diff --stat` that the production change is six lines (three pairs of key renames including the spec-file mirror) and the test change is three lines. No silent expansion, no missed sites: the third-site grep (`grep -rnE "[a-z]+_[a-z]+:\s*[a-zA-Z_.]+" src/apps/families/domains`) is the right pattern and the journal's "post-edit returns zero matches" claim is verifiable.

The middleware-pipeline verification in the journal (`apps/families/services/http.ts:9-11`) is exactly the artifact the permit demanded as a precondition. The architect did not skip the verification or treat it as ceremony — they confirmed the premise before editing and recorded the proof in the journal. This is the just-graduated middleware-awareness heuristic working as designed, on its first production application post-graduation.

Acceptance criteria: 6 of 6 met. No gaps, no over-delivery.

### Decision Review

Three decisions in the journal, all well-reasoned:

1. **CamelCase-pre-middleware test assertions.** The reasoning — "mocks at `@app/services` bypass middleware, so the assertion must mirror call-site shape" — is correct and economical. The alternative (rewire to mock at the axios layer to assert post-middleware payload) is the textbook scope creep the permit explicitly warned against. The architect's framing in the journal — "that second concern lives at the integration layer, where Stream B of the predecessor permit already wired the mock-server to apply registered middleware" — also correctly identifies that the wire-format guarantee is provided by a different test layer, so no coverage is lost. Approved.

2. **Did not touch admin/showcase.** Correct application of the middleware-awareness heuristic. Those apps don't register `deepSnakeKeys` middleware; any literal snake_case in those apps would be structurally required, not redundant. The architect verified via grep, not assumption. Approved.

3. **Did not touch integration-test fixtures.** Correct — those snake_case occurrences are response fixtures flowing through `deepCamelKeys` response middleware, which is the inverse direction and not in scope. The architect cited Stream B's mock-server middleware fidelity as the reason this is settled. Approved.

None warranted CEO escalation.

### Showcase Assessment

The journal's own "Showcase Readiness" assessment is honest: this delivery is showcase-quality but small. The CFO concurs. The portfolio value is in the trail, not the diff:

- Predecessor permit's Decision #4 explicitly carved these out and explained why.
- This permit closed the carve-out with a verifiable acceptance condition.
- The journal cites the predecessor's reasoning rather than re-deriving it.

A senior reviewer reading the two journals end-to-end sees an architect who tracks intentional debt, files the cleanup permit when the supporting heuristic graduates, and verifies the premise before acting on it. The diff is small; the operational discipline it demonstrates is not.

Bundle delta of +0.13 kB across two payload-key string swaps is within noise; CFO accepts the explanation. No size-budget concern.

### Training Proposal Dispositions

| Proposal                                                                                                                                                                                                                                                                    | Disposition   | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When a permit modifies a call-site payload object, grep `src/tests` (unit + integration) for the endpoint URL up front to map assertion-blast-radius before editing — not as a verification step after.                                                                     | **Candidate** | This is the third concrete instance of a meta-pattern already represented twice in the candidates log (line 404: "permit targets a specific page" → check ALL tests; line 411: "modifying a shared component's props" → grep test dirs for blast radius). Each candidate has a different trigger but the underlying behavior is identical: grep tests upfront, not after. CFO is logging this as a fresh candidate rather than graduating the meta-rule because the architect on this very shift caught the gap on a verification pass — i.e., the rule is not yet internalized as a proactive first step. The pattern is approaching graduation pressure but needs one more shift where the architect proactively runs the grep before editing without being prompted. |
| When a unit test mocks the service facade directly (`vi.mock('@app/services', ...)`), the test asserts on the call-site shape, not the wire shape. Don't reason about wire format when the mock layer answers the question — first check what layer the mock intercepts at. | **Candidate** | Specific, actionable, and tightly related to the just-graduated middleware-awareness bullet (same family of "what runs where in the request pipeline" reasoning). Worth tracking for graduation: a future shift where the architect picks the right test-assertion shape on the first read, citing the mock-intercept layer before the wire shape, would confirm. CFO would accept that as the second confirming shift.                                                                                                                                                                                                                                                                                                                                                 |

### Notes for the Architect

Repeat:

- **Verifying the middleware premise before editing.** This is the just-graduated heuristic landing exactly as intended. Keep doing this on the first read of any case-conversion-adjacent permit.
- **The Showcase Readiness section is honest.** "This delivery is showcase-quality, but it is genuinely small" — no inflation, no false claim of demonstrating patterns that weren't introduced. That honesty is the showcase-quality signal, more than the diff itself.
- **Right-sized scope.** Permit estimated ~30 minutes; you matched it. No detour into rewiring tests to chase the post-middleware assertion shape, despite the temptation. The journal's framing of "that second concern lives at the integration layer" is the correct architectural reasoning.

Do differently:

- **Run the integration-test grep up front, not as a verification afterthought.** The blind-spot you identified is the right one to flag. On this shift it cost nothing because no integration tests asserted on the payload — pure luck. On a more-tested endpoint (e.g., anything in `parts/` or `storage/`), the same lapse would land you mid-gauntlet with a broken integration test and no plan. Lead the next payload-touching permit with `grep -rn "<endpoint-url>" src/tests/` before reading any source file.

Branch hygiene note (not a finding, just an observation): the local main is two commits behind origin/main. Not your concern — the architect doesn't manage the branch state — but the CEO should pull/rebase before committing this work to avoid a noisy merge.
