# Work Order: Make the transaction boundary a required interaction in Action unit tests

**Work Order #:** 2026-07-09-transaction-boundary-test-rigor
**Filed:** 2026-07-09
**Issued By:** The Steward (disposition of F-test-1, audit [`2026-07-09-warden-cross-wing-sweep`](../audits/2026-07-09-warden-cross-wing-sweep.md))
**Assigned To:** Brickwright (Foundry Wing)
**Wing:** Foundry
**Priority:** Elevated — the only sweep finding touching a data-integrity guarantee (ADR-0016 atomicity)
**Status:** Completed (2026-07-09, batched close-out per ADR-0028 § Amendment 2026-07-09 Transition — merged in PR #254) — [Build Record](../build-records/2026-07-09-transaction-boundary-test-rigor.md)
**Branch slug (for PrePushPermitGate):** `transaction-boundary-test-rigor`

---

## The Job

~14 of 21 transactional Actions stub `ConnectionInterface::transaction` with a permissive zero-or-more passthrough (`allows('transaction')->andReturnUsing(fn($cb) => $cb())` or uncounted `shouldReceive`). A regression that unwraps the transaction produces identical inner behavior, so the suite stays green while atomicity silently disappears — and Infection has no mutator class that backstops this. Exemplar: `backend/tests/Unit/Actions/FamilySet/DeleteFamilySetActionTest.php:14`.

## Scope

### In the Box

- Enumerate transactional Actions (`grep -rln 'ConnectionInterface' backend/app/Actions/`) and their unit tests; for every test currently using a permissive transaction stub, standardize to a **counted** expectation: `shouldReceive('transaction')->once()->andReturnUsing(fn($cb) => $cb())` (or explicit `times(n)` where an Action legitimately opens multiple transactions).
- F-test-2 (low, concrete instance): the three delete-Action tests carrying zero `expect()` calls get at least one meaningful assertion each alongside the counted transaction pin.
- Evaluate a cheap enforcement hook: an architecture test (or Pest convention check) asserting every Action that injects `ConnectionInterface` has a test file containing a counted `transaction` expectation. Ship it if it lands under ~50 lines; otherwise record why not in the Build Record.

### Not in This Set

- No production Action changes — this is test-layer only.
- No mutation-threshold changes.

## Acceptance Criteria

- [ ] Zero permissive (`allows`/uncounted `shouldReceive`) transaction stubs remain across `backend/tests/Unit/Actions/` — verified by grep in the Build Record.
- [ ] The 7 Actions that already pin the boundary are untouched (no churn).
- [ ] `composer test` + `composer test:coverage` green (100% unit floor holds).
- [ ] `composer mutation` run once; note in the Build Record whether any previously-surviving mutants on delete/upsert Actions are now killed.
