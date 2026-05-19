# Building Permit: Fix Integration-Test Stale Assertions

**Permit #:** 2026-05-05-fix-integration-test-assertions
**Filed:** 2026-05-05
**Issued By:** CFO (with CEO authorization)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Repair the 5 stale integration-test assertions on `main` that the Building Inspector triaged in inspection report `2026-05-05-integration-test-baseline-triage`. All five are one-line assertion updates — production code is correct, the tests hardcode values that drifted (4 from the 2026-03-30 brand-voice deployment, 1 from PR #208's `in_storage` status). Deliver a green `npm run test:integration:run` baseline so Permit B (CI wiring) can land on top of it without a known-failing first run.

## Scope

### In the Box

Update the literal assertion strings in five integration test files. The inspection report named each file:line and the exact `Expected:` / `Received:` strings — copy the `Received:` value (current production output) into the assertion.

| #   | File                                                                                    | Line | Change                                                                                                                 |
| --- | --------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/tests/integration/apps/families/domains/brick-dna/pages/BrickDnaPage.spec.ts`      | ~66  | `'No collection data available yet'` → `'No DNA profile yet. Add some sets and we\'ll map your building fingerprint.'` |
| 2   | `src/tests/integration/apps/families/domains/home/pages/HomePage.spec.ts`               | ~55  | `'Dashboard'` → `'Build Control'`                                                                                      |
| 3   | `src/tests/integration/apps/families/domains/home/pages/HomePage.spec.ts`               | ~88  | `'Loading your collection...'` → `'Unpacking your collection...'`                                                      |
| 4   | `src/tests/integration/apps/families/domains/sets/pages/AddSetPage.spec.ts`             | ~56  | `toHaveLength(5)` → `toHaveLength(6)`                                                                                  |
| 5   | `src/tests/integration/apps/families/domains/storage/pages/StorageOverviewPage.spec.ts` | ~49  | `'No storage locations yet'` → `'No storage bins yet. Every brick needs a home.'`                                      |

Verify each fix by re-reading the production source (`brickDna.empty`, `home.dashboardTitle`, `home.loadingStats`, `AddSetPage.vue` `statusOptions` array, `storage.noStorage`) — the inspector's report named these exact translation keys / source locations. **Do not assume** the inspector's `Received:` string is the canonical value forever; verify against the live translation/source at the moment of fix. The brand voice may have drifted further, or another permit may have updated copy since the inspection ran.

After the five fixes, run `npm run test:integration:run` and confirm 126/126 passing.

### Not in This Set

- **No production code changes.** All fixes are in `src/tests/integration/**`. If the architect discovers production output is wrong (i.e., a genuine regression masquerading as a stale assertion), pause and check in — that is a separate permit, not a quiet correction.
- **No CI configuration changes.** That is Permit B (`2026-05-05-wire-integration-tests-into-ci`). Permit A delivers a green baseline; Permit B locks the gate.
- **No assertion-depth refactor.** The Inspector's Self-Debrief flagged that integration tests asserting only component existence (L0) are too shallow. That methodology evolution is a future SOP-7 graduation, not this permit. Leave existing `exists()` assertions untouched.
- **No changes to passing integration tests.** 121 tests pass today; do not refactor them while you're in the file.
- **No new tests.** Don't write coverage for things that aren't failing.
- **No translation-key changes.** Production translations are correct; only test assertions drift.

## Acceptance Criteria

- [ ] Five test-assertion edits, each in the file:line listed above, each matching the live production output (re-verified at fix time, not copied blind from the inspection report)
- [ ] `npm run test:integration:run` exits 0 with 126/126 tests passing
- [ ] No production code modified, no CI configuration modified
- [ ] Pre-push gauntlet clean (type-check, knip, test:coverage, build)
- [ ] Journal records: which translation keys / source locations were re-verified, and whether any drifted further between the inspection (2026-05-05) and the fix
- [ ] No regressions in the 121 currently-passing integration tests

## References

- **Inspection Report:** [`2026-05-05-integration-test-baseline-triage`](../inspections/2026-05-05-integration-test-baseline-triage.md) — per-failure diagnostics with exact strings
- **Companion Permit:** [`2026-05-05-wire-integration-tests-into-ci`](./2026-05-05-wire-integration-tests-into-ci.md) — Permit B, must land **after** Permit A
- **Originating Permit (Triage):** [`2026-05-05-integration-test-baseline-triage`](./2026-05-05-integration-test-baseline-triage.md)
- **Translation source:** `src/apps/families/services/translation.ts` (keys `brickDna.empty`, `home.dashboardTitle`, `home.loadingStats`, `storage.noStorage`)
- **Status options source:** `src/apps/families/domains/sets/pages/AddSetPage.vue` (`statusOptions` array — 6 entries since PR #208)

## Notes from the Issuer

This is small, mechanical work — the kind a senior reviewer reading the diff cold should be able to verify in under 90 seconds. Resist three temptations:

1. **Don't fix 121 passing tests "while you're in there."** They pass. Touching them expands diff scope without delivering on the permit. If you spot a genuine bug in a passing test, flag it in the journal and propose a follow-up permit.
2. **Don't upgrade L0 assertions to L1/L2/L3.** That is methodology evolution — a future SOP-7 graduation candidate that the Inspector flagged. Doing it here couples a hygiene fix to a methodology change and makes both harder to review.
3. **Don't second-guess the brand voice.** "Build Control" instead of "Dashboard" and "Unpacking your collection..." instead of "Loading your collection..." are deliberate brand choices made on 2026-03-30. The fix is to align tests with current production, not to debate the copy.

The Inspector's report flagged a calibration concern that bears on this permit: Failure 4 (AddSetPage status count) was introduced _today_ by PR #208 — the gap that caused the brand-voice failures to rot for 65 merges produced a fresh one in the most recent merge cycle. Until Permit B lands, every merge has the same exposure. That argues for shipping Permit A _quickly_ (it's a 5-edit hygiene pass, no rabbit holes) so Permit B can land right after. If the architect can deliver Permit A within the same shift as starting it, that's the right cadence.

A reasonable expectation: 30 minutes. Five `Edit` calls, one `npm run test:integration:run`, one journal. If anything pushes past 60 minutes, pause and check in — that's a signal a stale assertion is masking a real regression.

---

**Status:** Open
**Journal:** _link to construction journal when filed_
