# Work Order: Warden Sweep — Doc/Governance Quick Wins

**Work Order #:** 2026-05-29-warden-sweep-quick-wins
**Filed:** 2026-05-29
**Issued By:** CEO (via 2026-05-29 cross-wing sweep session)
**Assigned To:** Brickwright
**Wing:** Cross-wing (Foundry + Atrium docs)
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `warden-sweep-quick-wins`

---

## The Job

The 2026-05-29 cross-wing Warden sweep ([`2026-05-29-warden-cross-wing-sweep`](../audits/2026-05-29-warden-cross-wing-sweep.md)) surfaced two medium-severity doc-vs-code divergences the CEO flagged as the cheapest credibility wins — both verified against source by The Steward before this dispatch. Close them.

Both are governance-string / doc corrections. Neither changes behaviour. Together they are well under the PrePushPermitGate threshold (this WO exists for the paper trail, not because the gate requires it).

## Scope

### In the Box

**Item 1 — F-doc-1: PrePushPermitGate failure message instructs a retired obligation.**

- **File:** `backend/tools/CaptainHook/PrePushPermitGate.php:193-194`
- The failure message still reads: "To bypass for a documented exception, push with `--no-verify` and record the bypass / in the corresponding shift log's Decisions Made section with explicit Director sign-off."
- ADR-0028 § Amendment 2026-05-28 (II) **retired** that logging obligation entirely; the wing manual was updated, the code string was not. The message also carries pre-merger Stud & Sort vocabulary ("shift log", "Director") that did not survive into Brickworks vocabulary.
- **Fix:** rewrite lines 193-194 so the bypass note states only that `--no-verify` is the documented escape hatch with **no logging obligation**. Remove "shift log" / "Director" tokens. Match the state ADR-0028 Amendment (II) describes.
- **Test:** update/extend `PrePushPermitGateTest` so it asserts the failure message no longer references a logging obligation or a Director sign-off (lock the retirement in).

**Item 2 — G-adr-0012-1: ADR-0012 documents the wrong blocking threshold.**

- **File:** `.claude/docs/adr/0012-test-isolation-collect-guard.md`
- The **test-execution guard** (the blocking one) fails at **2000ms base / 4000ms under coverage** per `frontend/src/tests/unit/test-guard-reporter.ts:28-29` (`WARN_THRESHOLD_MS = 300`, `FAIL_THRESHOLD_MS = 2000`). The ADR documents the fail line as **1000ms** in four places: the tier list (~lines 49-50), the calibration note (~line 52), the enforcement-mechanisms table (~line 156), and the open-questions calibration line (~line 202).
- **Fix:** reconcile those four locations to **warn 300ms / fail 2000ms** (600 / 4000 under coverage). Verify each location against the live file before editing — line numbers may have shifted. **Do NOT touch the collect-guard numbers** (warn 200 / violation 500 / hard-cap 5000, doubled to 400/1000/10000 under coverage at ~line 110) — those belong to the *separate* collect-guard reporter and are correct.
- Add an **Amendment block** to the ADR recording the 1000 → 2000 reconciliation, dated 2026-05-29, noting the doc had drifted from the implementation since the threshold was raised.

### Not in This Set

- The N+1 / EAGER_LOAD arch-test hardening (F-debt-1), the showcase RouterService migration (G-arch-1), and the rest of the sweep's medium findings — separate dispatch, queued by The Steward.
- The remaining doc-drift corrections (G-doc-1..5, F-doc-2/3) — Steward Pulse/manual pass, not a Brickwright build.
- Committing or pushing. Leave the changes in the working tree for CEO review unless told otherwise.

## Acceptance Criteria

- [x] `PrePushPermitGate.php` bypass message rewritten to the no-logging-obligation state; "shift log" / "Director" tokens gone.
- [x] `PrePushPermitGateTest` asserts the message carries no logging obligation; suite green.
- [x] ADR-0012's four `1000ms` fail-threshold references reconciled to `2000ms` (4000 under coverage); collect-guard numbers untouched.
- [x] ADR-0012 carries a dated Amendment block recording the reconciliation.
- [x] Backend pre-commit gauntlet equivalent passes for the touched PHP (`composer lint:test`, `phpstan`, `test:arch`) and `PrePushPermitGateTest` is green.
- [x] Build Record filed at `.claude/records/build-records/2026-05-29-warden-sweep-quick-wins.md`.

## References

- Triggering audit: [`2026-05-29-warden-cross-wing-sweep`](../audits/2026-05-29-warden-cross-wing-sweep.md) (findings F-doc-1, G-adr-0012-1)
- ADR-0028 § Amendment 2026-05-28 (II) — bypass-log retirement (the standard F-doc-1 is measured against)
- `frontend/src/tests/unit/test-guard-reporter.ts` — the source of truth for the ADR-0012 thresholds

## Notes from the Issuer

Two surgical corrections. Verify each site against the live file before editing — the audit's line numbers are advisory. Do not scope-creep into the larger sweep findings; those are queued separately. Do not commit/push — leave for review.

---

**Status:** Completed — [Build Record](../build-records/2026-05-29-warden-sweep-quick-wins.md)
