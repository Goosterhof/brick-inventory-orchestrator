# Build Record: Warden Sweep — Doc/Governance Quick Wins

**Filed:** 2026-05-29
**Wing:** Cross-wing (Foundry + Atrium docs)
**Builder:** Brickwright
**Work Order:** [`2026-05-29-warden-sweep-quick-wins`](../work-orders/2026-05-29-warden-sweep-quick-wins.md)

---

## Summary

Two surgical doc/governance-string corrections surfaced by the 2026-05-29 cross-wing Warden sweep (findings F-doc-1 and G-adr-0012-1), both pre-verified against source by The Steward. Neither changes runtime behaviour.

1. **F-doc-1 (Foundry):** `PrePushPermitGate`'s failure message still instructed recording a bypass in "the corresponding shift log's Decisions Made section with explicit Director sign-off" — an obligation retired by ADR-0028 § Amendment 2026-05-28 (II), carrying dead pre-merger Stud & Sort vocabulary ("shift log", "Director"). Rewrote the bypass note to state only that `--no-verify` is the documented escape hatch with no logging obligation, and locked the retirement in with a new test assertion.
2. **G-adr-0012-1 (Atrium doc):** ADR-0012 documented the blocking test-execution guard's fail threshold as 1000ms in four places; the live reporter uses `FAIL_THRESHOLD_MS = 2000` (4000 under coverage). Reconciled all four sites to 2000ms / 4000ms-under-coverage and added a dated Amendment block. Left the separate collect-guard numbers untouched.

## What Changed

### Item 1 — F-doc-1

**`backend/tools/CaptainHook/PrePushPermitGate.php`** (`failureMessage()`, lines 193-194):

Before:
```php
$lines[] = 'To bypass for a documented exception, push with --no-verify and record the bypass';
$lines[] = 'in the corresponding shift log\'s Decisions Made section with explicit Director sign-off.';
```

After:
```php
$lines[] = 'To bypass for a documented exception, push with --no-verify. This is the documented';
$lines[] = 'escape hatch and carries no logging obligation (ADR-0028 Amendment 2026-05-28 II).';
```

"shift log", "Director", "Decisions Made", and "sign-off" tokens are all gone. The `--no-verify` escape hatch is retained and now cites the retiring amendment.

**`backend/tests/Tools/CaptainHook/PrePushPermitGateTest.php`** — added one new `it()` in the `failureMessage` describe block that asserts the message contains `no logging obligation` and does NOT contain `Director`, `shift log`, `Decisions Made`, or `sign-off`. This locks the retirement in — any regression that reintroduces the old vocabulary fails the suite.

### Item 2 — G-adr-0012-1

**`.claude/docs/adr/0012-test-isolation-collect-guard.md`** — four fail-threshold references reconciled from 1000ms to 2000ms (verified against the live `frontend/src/tests/unit/test-guard-reporter.ts:28-29`, `WARN_THRESHOLD_MS = 300` / `FAIL_THRESHOLD_MS = 2000`):

1. Two-tier list (Decision § Execution-time guard reporter): `1000ms+: failure` → `2000ms+: failure (4000ms+ under coverage)`; warning tier annotated with the 600–4000ms coverage band.
2. Calibration note: `The 1000ms failure threshold` → `The 2000ms failure threshold (4000ms under coverage)`.
3. Enforcement-mechanisms table row: `**fail at 1000ms**` → `**fail at 2000ms** ... thresholds double to 600/4000ms under coverage`.
4. Open-questions calibration line: `300ms/1000ms thresholds` → `300ms/2000ms thresholds`.

Added an Amendment block dated 2026-05-29 recording the 1000 → 2000 reconciliation and that the doc had drifted from the implementation since the threshold was raised (and coverage-mode doubling was added to the test guard) without the ADR being updated.

**Untouched (per WO instruction):** the collect-guard reporter's separate thresholds — warn 200 / violation 500 / hard-cap 5000ms delta, doubled to 400/1000/10000ms under coverage (~lines 104-110). The `1000` inside the collect-guard `(400/1000/10000ms)` coverage-doubling string is the collect-guard violation threshold, NOT the test-guard fail threshold, and was correctly left alone.

## Verification

All commands run from `backend/` cwd. Host PHP confirmed 8.5.5, `update-alternatives` points to `/usr/bin/php8.5`.

| Command | Result | Log |
|---|---|---|
| `composer lint:test` | PASS — Rector done, `{"tool":"pint","result":"passed"}` | `/tmp/lint-test.log` |
| `composer phpstan` | PASS — `[OK] No errors` (339 files) | `/tmp/phpstan.log` |
| `composer test:arch` | PASS — 107 passed (1860 assertions) | `/tmp/test-arch.log` |
| `vendor/bin/pest tests/Tools/CaptainHook/PrePushPermitGateTest.php` | PASS — 42 passed (52 assertions), incl. new retirement-lock test | `/tmp/permit-test.log` |

The ADR edit is documentation; no gauntlet applies.

## Acceptance Criteria

- [x] `PrePushPermitGate.php` bypass message rewritten to the no-logging-obligation state; "shift log" / "Director" tokens gone.
- [x] `PrePushPermitGateTest` asserts the message carries no logging obligation; suite green.
- [x] ADR-0012's four `1000ms` fail-threshold references reconciled to `2000ms` (4000 under coverage); collect-guard numbers untouched.
- [x] ADR-0012 carries a dated Amendment block recording the reconciliation.
- [x] Backend pre-commit gauntlet equivalent passes for the touched PHP and `PrePushPermitGateTest` is green.
- [x] Build Record filed.

## Self-Debrief

**One adjacent divergence found, left out of scope.** ADR-0012's enforcement table (line 159, the "Coverage mode threshold scaling" row) still claims the test guard is "unaffected — execution time is coverage-stable." That contradicts the live reporter, whose header comment (lines 14-25) explicitly states the test guard *does* double under coverage, mirroring the collect guard. The WO enumerated exactly four fail-threshold sites and did not list line 159, so I did not edit it — but the Amendment block I added now records that coverage-mode doubling was added to the test guard, which partially documents the truth. Flagging for The Steward: line 159's "coverage-stable" claim is a separate, still-live doc divergence that a follow-up doc pass should reconcile. I judged editing it to be scope-creep against an explicitly-enumerated four-site WO; the call could reasonably go either way.

**Verified each ADR site against the live file before editing, per the WO's standing instruction.** Line numbers had not materially shifted, but I confirmed the collect-guard `1000` occurrence (the doubled violation threshold) was distinct from the four test-guard `1000` occurrences before touching anything — the WO's CRITICAL warning was the exact trap to avoid.

**No commit or push, per instruction.** All changes left in the working tree. Did not touch `.claude/records/audits/2026-05-29-warden-cross-wing-sweep.md` or `.claude/docs/quality-warden-casebook.md`.

## Proposed Knowledge Updates

None. Both changes are corrections that bring docs/strings into line with already-settled decisions (ADR-0028 Amendment, the test-guard reporter's actual thresholds). No new learning, decision, or pulse entry warranted. The line-159 divergence noted in the Self-Debrief is a candidate follow-up doc task, not a knowledge-base entry.

## References

- Triggering audit: [`2026-05-29-warden-cross-wing-sweep`](../audits/2026-05-29-warden-cross-wing-sweep.md) — findings F-doc-1, G-adr-0012-1
- ADR-0028 § Amendment 2026-05-28 (II) — bypass-log retirement (the standard F-doc-1 is measured against)
- `frontend/src/tests/unit/test-guard-reporter.ts:28-29` — source of truth for the ADR-0012 thresholds
