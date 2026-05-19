## Building Permit: Snake-Case Payload-Key Cleanup (Post-ADR-016 Hygiene)

**Permit #:** 2026-05-05-snake-case-payload-keys-cleanup
**Filed:** 2026-05-05
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** When-convenient

---

## The Job

ADR-016 established that the Families app's `requestMiddleware` runs `deepSnakeKeys` on every outbound request body, so call sites should hand the middleware idiomatic camelCase and let the middleware own the wire format. After the 2026-05-05 conversion-cleanup permit closed, three call sites were intentionally left out of scope because they pre-shape their payloads with literal snake_case keys — they happen to work (middleware is idempotent on already-snake'd keys) but are architecturally inconsistent and read as a maintenance trap. Replace the literal snake_case keys with their camelCase equivalents.

## Scope

### In the Box

- `src/apps/families/domains/sets/modals/AssignPartModal.vue:48-49` — replace `part_id` / `color_id` keys with `partId` / `colorId` in the POST payload object
- `src/apps/families/domains/settings/pages/SettingsPage.vue:146` — replace `rebrickable_user_token` key with `rebrickableUserToken` in the PATCH (or POST) payload object
- Update any same-file unit tests that assert on the literal key names — adjust assertions to the camelCase form (or to the `deepSnakeKeys`-applied snake_case form if the test mocks the wire payload at the axios layer)
- Run the full pre-push gauntlet (format / lint / lint:vue / type-check / test:coverage / knip / size)

### Not in This Set

- No backend API changes — the wire format on the server stays snake_case; only the frontend call-site object literals change. The middleware does the conversion.
- No new ADR needed — this is straight ADR-016 enforcement, not a new decision
- No changes to `apps/admin` or `apps/showcase` — those apps don't run middleware (per the just-graduated middleware-awareness heuristic) and any literal snake_case keys in those apps would be structurally required, not redundant
- No grep-and-sweep across other domains beyond the two listed files — if a third site exists, the architect should flag it in the journal but not silently expand scope

## Acceptance Criteria

- [ ] `grep -nE "[a-z]+_[a-z]+:\s*[a-zA-Z_.]+" src/apps/families/domains/sets/modals/AssignPartModal.vue` returns zero matches in payload-object positions (allowing legitimate snake_case in comments or doc strings)
- [ ] Same grep against `SettingsPage.vue` returns zero matches in payload-object positions
- [ ] Network request still POSTs / PATCHes the same snake_case body to the backend (verified via the relevant unit-test assertion on `axios.post` / `axios.patch` mock call args, or by tracing through the middleware in the AssignPartModal / SettingsPage spec)
- [ ] `npm run test:coverage` — 100% retained, all unit tests pass
- [ ] Pre-push gauntlet clean
- [ ] Journal records: which test-layer assertion shape was chosen (camelCase pre-middleware vs snake_case post-middleware) and why

## References

- ADR: [`ADR-016`](../../docs/decisions.md) — explicit middleware ownership of case conversion
- Predecessor Permit: [`2026-05-05-adr-016-conversion-cleanup`](./2026-05-05-adr-016-conversion-cleanup.md) — the call-site cleanup that explicitly carved these two files out of scope
- Predecessor Journal: [`2026-05-05-adr-016-conversion-cleanup`](../journals/2026-05-05-adr-016-conversion-cleanup.md) — Decision #4 ("Left literal snake_case POST keys in two files") documents why these were deferred
- Graduated Heuristic: Lead Brick Architect "When You Build" middleware-awareness bullet (graduated 2026-05-05) — the same logic that justifies removing these keys also justifies _not_ touching admin/showcase

## Notes from the Issuer

This is the last loose end from ADR-016. The architect already established in the predecessor journal that idempotency makes these safe to leave; this permit is about consistency, not correctness. Treat it as a low-risk hygiene pass — the kind of thing that, when a senior reviewer reads the families app cold, shouldn't make them ask "why does this one POST hand-shape its keys when nothing else does?"

A reasonable expectation is that this is a 30-minute job: two file edits, one or two test assertion updates, one gauntlet run. If the test-assertion shape question turns out to be non-trivial (e.g., the existing tests mock at the axios layer and asserting on the post-middleware payload requires a refactor of the test setup), pause and check in before refactoring — splitting "edit two payload objects" from "rewire the test layer" may be the right call.

The architect's just-graduated middleware-awareness heuristic makes this a natural fit: the same reasoning that approved removing call-site `toCamelCaseTyped` calls (middleware exists, runs on the relevant pipeline, owns the conversion) approves removing call-site snake_case keys here. If the architect cannot demonstrate `deepSnakeKeys` is registered and runs on the request pipeline for both endpoints, the permit should be paused and that gap reported instead.

---

**Status:** Open
**Journal:** _to be linked when filed_
