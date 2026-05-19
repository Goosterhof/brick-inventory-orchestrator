# Construction Journal: Adopt Wrapped Storage Map Response Shape

**Journal #:** 2026-04-29-storage-map-response-shape
**Filed:** 2026-04-29
**Permit:** [`2026-04-29-storage-map-response-shape`](../permits/2026-04-29-storage-map-response-shape.md)
**Architect:** Lead Brick Architect

---

## Work Summary

Paired Plate-side match-up after the Brick brought `GET /sets/{setNum}/storage-map` under its `ResourceData` umbrella with **Option A** (wrapped envelope: `{entries: [...]}`). Added a wrapper type, switched the `SetDetailPage` consumer to read `.entries`, and folded the per-row `toCamelCaseTyped` map into a single payload-level conversion. Tests already covered empty and one-entry cases; added two new cases (multi-entry and request failure) so the four scenarios the permit named are explicit.

| Action   | File                                                                    | Notes                                                                                                                                                                                                                    |
| -------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Modified | `src/apps/families/types/part.ts`                                       | Added `StorageMapResponse` interface mirroring `MasterShoppingListResponse` (no `unknownFamilySetIds` analogue — storage-map has no shortfall semantics).                                                                |
| Modified | `src/apps/families/domains/sets/pages/SetDetailPage.vue`                | Request typed as `StorageMapResponse`; one `toCamelCaseTyped<StorageMapResponse>(mapResponse.data).entries` call replaces the per-row `.map(...)`. Inline `// Why:` comment documents why the explicit conversion stays. |
| Modified | `src/tests/unit/apps/families/domains/sets/pages/SetDetailPage.spec.ts` | Updated all `mockResolvedValueOnce({data: ...})` storage-map mocks from bare arrays to `{entries: [...]}`. Added two tests: multi-entry rendering and request-failure fallback.                                          |

## Permit Fulfillment

| Acceptance Criterion                                                                                                                    | Met | Notes                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StorageMapResponse` type exists in `part.ts`, follows the `MasterShoppingListResponse` shape pattern (`{entries: StorageMapEntry[]}`). | Yes | Storage-map has no honesty sibling; the type carries only `entries`. Confirmed against the Brick shift log: "no `unknownFamilySetIds`-style fields." |
| `SetDetailPage.vue` calls `familyHttpService.getRequest<StorageMapResponse>(...)` and reads `.entries`.                                 | Yes | Line 106. Reading happens via `toCamelCaseTyped<StorageMapResponse>(mapResponse.data).entries`.                                                      |
| The redundant-or-kept `toCamelCaseTyped` decision is documented; if kept, an inline `// Why:` comment explains it.                      | Yes | KEPT. Rationale below in **Decisions Made**. Inline comment at line 107.                                                                             |
| `npm run type-check` passes.                                                                                                            | Yes | Clean.                                                                                                                                               |
| `npm run test:coverage` passes at 100% lines/functions/branches/statements.                                                             | Yes | 1294 tests, all green; coverage report `All files: 100/100/100/100`.                                                                                 |
| `npm run lint` and `npm run lint:vue` both pass.                                                                                        | Yes | 0 warnings, 0 errors. Conventions linter green.                                                                                                      |
| `npm run knip` reports no dead types — old `StorageMapEntry[]` shape is fully replaced.                                                 | Yes | Clean. `StorageMapEntry` is still used (still the per-row type); `StorageMapResponse` has one consumer — the page itself.                            |
| `npm run build` builds all three apps cleanly.                                                                                          | Yes | Families/Admin/Showcase all built. SetDetailPage chunk: 12.69 kB (4.11 kB gzip).                                                                     |
| Pre-push gauntlet passes end-to-end.                                                                                                    | Yes | type-check → knip → test:coverage → build all green.                                                                                                 |
| Construction journal records the deployment ordering note.                                                                              | Yes | See **Showcase Readiness** below — flagged explicitly.                                                                                               |

## Decisions Made

1. **Keep the explicit `toCamelCaseTyped` call (do not drop it).** — The permit asked me to verify empirically whether `familyHttpService` middleware already snake↔camel-converts. It does not. `createHttpService` from `@script-development/fs-http` is bare axios with empty middleware arrays; the only registered middleware in this codebase is `withCredentials` plumbing. Every other consumer in `src/apps/families/**` (`SettingsPage`, `PartUsageModal`, `StorageDetailPage`, `AssignPartModal`, `ScanSetPage`, `PartsPage`, `BrickDnaPage`, `HomePage`, `SetsOverviewPage`, `PartsMissingPage`) does explicit `toCamelCaseTyped<T>(response.data)` for the same reason. Dropping it here would produce snake-cased keys (`part_id`, `color_id`, etc.) that the rest of `SetDetailPage` would silently mis-read — `entry.partId` would be `undefined`, `storageByPartKey` would key everything as `undefined_undefined`, and the storage badges and build-check would silently render empty. Inline `// Why:` comment at the call site explains it. _Rejected alternative:_ relying on hypothetical middleware — would only work if a separate piece of work had registered camel-case middleware on the families app, which it has not.

2. **Convert at the wrapper level, not per row.** — Now that the response is wrapped, `toCamelCaseTyped<StorageMapResponse>(mapResponse.data).entries` reads as one pass instead of `mapResponse.data.map((item) => toCamelCaseTyped<StorageMapEntry>(item))`. Same runtime cost (same recursion under the hood), simpler code, mirrors how `PartsMissingPage` handles `MasterShoppingListResponse`. _Rejected alternative:_ keep the `.map()` after the `.entries` read — pointlessly redundant; `toCamelCaseTyped` already deep-walks.

3. **Add multi-entry and failure tests as new cases instead of editing existing ones.** — The permit asked for four entry-count scenarios: empty / one / multiple / failure. Empty and one-entry were already covered. I added the two missing cases without disturbing the existing tests, which keeps the diff focused on the permit's `Not in This Set` boundary (no incidental refactoring of other passing tests). _Rejected alternative:_ rewrite the storage-map test block — out of scope.

4. **Asserted via `findAllComponents(PartListItem)` props in the failure-fallback test, not via `wrapper.text()`.** — First attempt used `expect(wrapper.text()).toContain('Brick 2 x 4')`. Failed because `shallowMount` stubs `PartListItem`, so the part name never reaches text content. Switched to component-prop assertion, matching the pattern used elsewhere in the same file. The Lead Brick Architect training doc lists this exact pattern at line 64 (`.find((c) => c.props('x') === 'expected')`).

## Quality Gauntlet

| Check         | Result | Notes                                                                                                                                                                                             |
| ------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format:check  | Pass   | After running `oxfmt` on the test file. Two pre-existing format issues on `.md` files I did not author (inspection report `2026-04-26`, the permit itself) remain — out of scope for this permit. |
| lint          | Pass   | 0 warnings, 0 errors across 296 files.                                                                                                                                                            |
| lint:vue      | Pass   | All conventions passed.                                                                                                                                                                           |
| type-check    | Pass   | `vue-tsc --build` clean.                                                                                                                                                                          |
| test:coverage | Pass   | 1294 tests, 110 files. Lines: 100%, Branches: 100%, Functions: 100%, Statements: 100%.                                                                                                            |
| knip          | Pass   | No unused exports/files/deps reported.                                                                                                                                                            |
| size          | Pass   | families: 122.78 kB brotli (limit 350 kB). admin: 30.79 kB (limit 150 kB).                                                                                                                        |

## Showcase Readiness

**Deployment ordering — flagged for the CFO/General.** The Brick has shipped the wrapped envelope on the Brick territory's `main` but **has not deployed to production yet**. This Plate work cannot be released to production ahead of the paired Brick deployment. If the Plate ships first, the consumer reads `.entries` off a top-level array (which is `undefined`), `toCamelCaseTyped<StorageMapResponse>` walks `{entries: undefined}`, the `.entries` access yields `undefined`, the `try` block throws on the subsequent `[]`-style operation, and the catch fallback silently renders an empty storage map — same failure mode as the empty-entries happy path. The build-check disappears. No console error, no toast, no visible signal anything is wrong. **Merge order: Brick to prod first, then Plate.**

**ETag freshening — surface from the Brick shift log.** The Brick wire body changed shape, so existing client ETag tokens are now stale. The Brick's cache-header test asserts presence (not value), so it still passes; but every cached client will get a 200 + new body on the first post-deploy request and freshen its ETag from there. No client-side action required — this is a one-shot cache miss on rollout, not a recurring cost.

**Portfolio-grade?** Yes. Tight scope, mirrored the existing `MasterShoppingListResponse` pattern, single-pass case conversion replaces a per-row map, four named test scenarios all covered, inline `// Why:` comment justifies the `toCamelCaseTyped` survival. A senior reviewer would see the diff and immediately understand both _what_ changed and _why_ the explicit conversion stayed.

## Proposed Knowledge Updates

- **Learnings:** _none._ The permit explicitly says "no new ADR" and "this change follows the existing case-conversion + ResourceData-mirror conventions." Surfacing the "no middleware = explicit `toCamelCaseTyped` is structurally required" observation as a learning would be useful, but it is already implicit in every page consumer that does the same thing — adding a learning would document existing practice, not capture a new one. Flag for the CFO if they disagree.
- **Pulse:** _none._ This is a single contract match-up, not a territory state change.
- **Domain Map:** _none._ No new domain.
- **Component Registry:** _auto-generated, no manual update._
- **Decision Record:** _none._ Permit explicitly rules out a new ADR.

## Self-Debrief

### What Went Well

- Empirical verification of the middleware claim took two greps and one read of the `fs-http` dist — quick to falsify, decision documented in 30 seconds.
- The wrapper-level conversion was a one-line cleanup that fell out naturally; no contortion.
- Test coverage was already at 100% for SetDetailPage — adding two cases didn't move the needle but made the permit's named scenarios explicit, which is the kind of artifact a reviewer would expect.

### What Went Poorly

- First attempt at the failure-fallback assertion used `wrapper.text()` matching a part name, which fails under `shallowMount` because `PartListItem` is stubbed. One-cycle fix using `findAllComponents(PartListItem).find((p) => !p.props('spare'))` — the pattern is already in the same file three other times. Should have grepped the existing tests in the file before writing the assertion.

### Blind Spots

- I almost trusted the permit's hypothesis ("the httpService middleware should already be running snake↔camel conversion") without verifying. The permit was honest enough to say "verify that empirically before deciding," but a less-careful pass could have dropped the `toCamelCaseTyped` call on the assumption alone and shipped a silent-empty-storage-map regression. Concrete shift evidence: I went looking for middleware in the families' `services/http.ts`, found just `createHttpService(API_BASE_URL)` with no middleware registration, then read the `@script-development/fs-http` dist to confirm zero default middleware. Without that empirical step, the rationale would have been wrong.

### Training Proposals

| Proposal                                                                                                                                                                                                                                                                                                                                                               | Context                                                                                                                                                                                                                                                                                 | Shift Evidence                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Before deciding whether an HTTP utility (`toCamelCaseTyped`, `deepSnakeKeys`, etc.) at the call site is redundant, grep `registerRequestMiddleware` / `registerResponseMiddleware` in the app's `services/` directory — if no middleware is registered, the call-site conversion is structurally required and dropping it produces silently-broken data with no error. | Verified the middleware claim before deciding to keep `toCamelCaseTyped`. Two greps — `registerResponseMiddleware` (only matches showcase docs) and the `services/http.ts` itself (no registrations) — would have answered the question in 5 seconds without reading the upstream dist. | 2026-04-29-storage-map-response-shape |
| When writing a `wrapper.text()` assertion for content rendered by a child component, first check whether the test uses `shallowMount` — if so, the child is stubbed and its rendered text never reaches `wrapper.text()`. Use `findAllComponents(Child).find(...).props(...)` instead.                                                                                 | Wrote a failure-fallback assertion as `wrapper.text()` matching a part name; failed because `PartListItem` is stubbed under `shallowMount`. The same file already has three working examples of the prop-based pattern.                                                                 | 2026-04-29-storage-map-response-shape |

---

## CFO Evaluation

**Overall Assessment:** Excellent

### Permit Fulfillment Review

All ten acceptance criteria met with no gaps. 1294 tests, 100/100/100/100 coverage, full pre-push gauntlet green, the four permit-named test scenarios (empty / one / multiple / failure) all explicit. The diff is exactly what the permit asked for and nothing more — no incidental refactoring of passing tests, no styling drift, no Brick-side reach-across. The two pre-existing `.md` format failures correctly left alone with scope notation in the journal.

The single-pass `toCamelCaseTyped<StorageMapResponse>(mapResponse.data).entries` replacing the per-row `.map(...)` is a quiet quality win that fell out of the wrapping change naturally — the kind of cleanup that's worth taking when it's a one-line consequence and worth refusing when it isn't.

### Decision Review

Four decisions, all sound — and the first one is the most important to flag for the record:

1. **Keep `toCamelCaseTyped` (do not drop).** The permit floated a hypothesis ("the httpService middleware should already be running snake↔camel conversion") and asked the Architect to verify before deciding. The Architect did exactly that — two greps and one read of the upstream `fs-http` dist — and discovered the permit's hypothesis was **wrong**. `createHttpService` here is bare axios with zero registered middleware. Dropping the call would have produced a silent regression: snake-cased keys arriving on a type-checked camelCase object, `entry.partId === undefined` on every row, the `storageByPartKey` keyer collapsing every row to `"undefined_undefined"`, the storage badges and build-check rendering empty with no error signal. **The Architect saved us from a permit-induced silent failure by refusing to trust an unverified premise.** This is the cleanest possible application of the firm's first principle — "make a strong argument before I comply." Permit-authoring lesson on my side: I should not encode guesses into permits as if they were known facts. Approved without qualification.

2. **Wrapper-level conversion over per-row.** Cleaner, identical runtime cost (the recursion is the same), mirrors the existing `MasterShoppingListResponse` consumption in `PartsMissingPage`. Approved.

3. **Add new test cases instead of editing existing ones.** Preserves diff focus, respects the "Not in This Set" boundary. Approved.

4. **`findAllComponents().props()` recovery from `wrapper.text()`.** One-cycle self-correction using a pattern already documented three times in the same file. The honest self-debrief note ("should have grepped the existing tests in the file before writing the assertion") is the right framing — this is muscle memory training, not a new learning.

None of these warranted CEO escalation.

### Showcase Assessment

Strong. The deployment-ordering analysis under Showcase Readiness is the single best part of this journal — the Architect didn't just flag "Brick must deploy first," they walked through the exact silent-failure mode (`undefined.entries` → `try` block exit → catch fallback → empty storage map → no console error → no toast). That kind of failure-mode analysis is the difference between "I noticed a constraint" and "I understand what happens if the constraint is violated." A senior engineer auditing this work will read that section and trust the rest of the diff.

The ETag freshening note correctly carried over from the Brick shift log — cross-territory facts surfaced in the journal where the General can see them.

The inline `// Why:` comment at `SetDetailPage.vue:107` is portfolio-grade. A future reader will see exactly why the explicit conversion stays.

### Training Proposal Dispositions

| Proposal                                                                                                                                                                                                                                                                                                                                                              | Disposition | Rationale                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before deciding whether an HTTP utility (`toCamelCaseTyped`, `deepSnakeKeys`, etc.) at the call site is redundant, grep `registerRequestMiddleware` / `registerResponseMiddleware` in the app's `services/` directory — if no middleware is registered, the call-site conversion is structurally required and dropping it produces silently-broken data with no error | Candidate   | Specific trigger (deciding to drop a case-conversion call), specific check (grep for middleware registration), evidence-backed (this shift saved a silent-failure regression). High-value: the failure mode is silent, which makes the structural check the only reliable safeguard. Will graduate on a second confirming observation. |
| When writing a `wrapper.text()` assertion for content rendered by a child component, first check whether the test uses `shallowMount` — if so, the child is stubbed; use `findAllComponents(Child).find(...).props(...)` instead                                                                                                                                      | Candidate   | Specific trigger (text assertion against child-component content), specific test framework state (`shallowMount`), specific replacement pattern. Three existing examples in the same file confirm it's the established pattern. Will graduate on a second confirming observation.                                                      |

### Graduation Check

No graduations this round — both proposals are first observations.

### Notes for the Architect

Three things to keep doing:

1. **Empirical verification of permit hypotheses.** The permit said "the httpService middleware should already be running snake↔camel conversion" — and you tested it. That instinct is the most valuable thing in your training right now. Two greps + one dist read = saved regression. Don't compromise on this even when the permit sounds confident.

2. **Failure-mode analysis in the journal.** Walking through `undefined.entries → try-block exit → catch fallback → silent empty render` for the deployment-ordering scenario was textbook. Keep doing that whenever a constraint is named — describe what happens if it's violated, not just that it exists.

3. **Self-honest debrief.** "Should have grepped the existing tests in the file before writing the assertion" — that framing is exactly right. You owned the cycle without inflating it. Defensive debriefs feed weak training proposals; honest ones feed strong ones.

One thing to do differently next time: when adopting an established pattern (the `findAllComponents().props()` shape that's already in the file three times), grep the same file first before writing the new assertion. Your own training proposal #2 covers this — once it graduates, this becomes muscle memory.

**Permit-authoring lesson on my side, recorded for the next paired permit:** I should not encode unverified guesses into permits as factual hypotheses. The "the httpService middleware should already be running" line was a guess I hadn't checked — it cost you one verification cycle. Next time I draft a paired permit, I'll either verify the assumption myself or frame the hypothesis explicitly as "verify this — I haven't checked." Adjusting the CFO drafting workflow accordingly.

Permit `2026-04-29-storage-map-response-shape` is closed. Plate–Brick contract for `/sets/{setNum}/storage-map` is now fully under the ResourceData umbrella on both sides.
