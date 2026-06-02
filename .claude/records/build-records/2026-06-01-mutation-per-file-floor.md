# Build Record: Enforce per-file mutation score floor (post-v2)

**Build Record #:** 2026-06-01-mutation-per-file-floor
**Filed:** 2026-06-01
**Brickwright:** The Steward (operating directly)
**Wing:** Gallery
**Work Order:** [2026-05-28-mutation-per-file-floor](../work-orders/2026-05-28-mutation-per-file-floor.md)
**Branch:** `claude/work-order-availability-bER0S`

---

## Work Summary

Closed the structural-debt follow-up to the v2 mutation install. PR #135 shipped Stryker with an **aggregate-only** `break: 90` threshold; the General's review of #135 flagged that an aggregate floor lets a weak file hide behind strong siblings. Two files sat below the per-file floor at v2 time — `bricklinkWantedList.ts` (88.64%) and `guards.ts` (89.47%). This Work Order triaged both to ≥90% and institutionalised a per-file floor that Stryker cannot enforce natively.

Both laggards landed at **100%**, the aggregate rose **91.70% → 96.27%**, and a `posttest:mutation` script now fails the build if any single mutated file drops below 90%.

## Enforcement Mechanism — Option 2 chosen (`posttest:mutation` script)

The WO offered three options for institutionalising the per-file floor. **Option 2 was selected**, matching the Issuer's recommendation.

| Option | Verdict | Why |
|---|---|---|
| 1 — Manual triage cadence in Pulse | **Rejected** | "Below 90 for two consecutive runs blocks the next merge" relies on human discipline; it is exactly the soft commitment the General's review warned would rot. No mechanical refusal. |
| **2 — `posttest:mutation` script parsing Stryker's JSON report** | **Chosen** | Honest, mechanical enforcement (~60 lines of node). Sits in BIO with no dependency on Stryker upstream gaining a native per-file `break`. Runs automatically after `test:mutation` succeeds, so it rides the existing CI gate with zero new workflow wiring. Cost: one extra JSON parse, negligible. |
| 3 — Multiple Stryker configs (one per scope) | **Rejected** | Cleanest structurally (per-config aggregate ≈ per-file, the fs-packages shape) but multiplies CI time by ~4 for a 9-file scope. Disproportionate. Revisit only if the mutated scope grows large enough that one config becomes unwieldy. |

**Hook ordering note:** npm runs `post<script>` only when the base script exits 0. When the *aggregate* is under threshold, Stryker exits non-zero and the post-hook never runs — but the aggregate gate has already failed the build. The post-hook exists precisely for the gap Stryker cannot see: aggregate green, a single file red. That case exits Stryker 0, the hook runs, and the hook fails the build. Documented in the script header.

## Deliverables

| Action | File | Notes |
|---|---|---|
| Modified | `frontend/src/tests/unit/shared/services/auth/guards.spec.ts` | +2 tests. Killed both `BooleanLiteral` survivors (`return true` → `return false`, lines 18 & 24). The fs-router contract is `for (…middleware) if (await mw(…)) return false` — returning `true` cancels the navigation **and short-circuits later middleware**. The existing tests only asserted the final route name, which the `goToRoute(redirect)` call satisfies regardless of the boolean. The new tests register a follow-on middleware and assert the redirected-away route never reaches it — observing the short-circuit, which is the exact semantic the boolean carries. `guards.ts` 89.47 → **100%**. |
| Modified | `frontend/src/tests/unit/shared/helpers/bricklinkWantedList.spec.ts` | +2 tests. Killed all 5 survivors (inner `join('\n')`, outer `join('\n')`, `'    </ITEM>'` literal, and the two null-filter mutants at `:57`). Both new tests assert the **exact** newline-delimited document rather than substring containment: one single coloured entry (pins inner/outer joins + closing tag), one skipped-plus-real entry (pins the null-filter — without it a skipped entry injects a blank line). `bricklinkWantedList.ts` 88.64 → **100%**. |
| Created | `frontend/scripts/check-mutation-per-file-floor.mjs` | Parses `reports/mutation/mutation.json`, computes per-file score `(Killed+Timeout)/(Killed+Timeout+Survived+NoCoverage)` per the report schema, fails (exit 1) with a per-file list if any file < 90%. Accepts an optional report-path argv for fixture testing. |
| Modified | `frontend/package.json` | Added `posttest:mutation` → `node scripts/check-mutation-per-file-floor.mjs` (keys re-sorted by oxfmt; hook fires regardless of position). |
| Modified | `frontend/stryker.config.mjs` | Added `json` reporter + `jsonReporter.fileName: reports/mutation/mutation.json` so the post-hook has a machine-readable report to parse. |
| Modified | `frontend/.gitignore` | Ignore `reports/mutation/` (generated report directory). |
| Modified | `.claude/docs/pulse.md` | Updated the Stryker v2 maturity row + the metrics row to record the per-file floor, the 96.27% aggregate, and the new enforcement script. Promotion to Battle-tested held — the new per-file gate needs to ride CI green first. |

## Mutation Testing Results (full suite, post-fix)

```
-------------------------|------------------|----------|-----------|------------|----------|----------|
                         | % Mutation score |          |           |            |          |          |
File                     |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
-------------------------|--------|---------|----------|-----------|------------|----------|----------|
All files                |  96.27 |   96.27 |      226 |         6 |          9 |        0 |        1 |
 bricklinkWantedList.ts  | 100.00 |  100.00 |       44 |         0 |          0 |        0 |        0 |
 guards.ts               | 100.00 |  100.00 |       14 |         5 |          0 |        0 |        0 |
-------------------------|--------|---------|----------|-----------|------------|----------|----------|
```

Aggregate 91.70 → **96.27%**. The 9 remaining survivors all sit in files individually ≥ 90% (`useValidationErrors.ts` 94.44%, `fromQuery.ts` 93.33%, …) — explicitly out of scope per the WO ("only the two laggards in scope; the eight other files cleared the floor"). The `posttest:mutation` hook ran end-to-end on the full suite and reported: *"All 8 mutated file(s) at or above the 90% floor."*

## Verification

| Gate | Result |
|---|---|
| `bricklinkWantedList.ts` per-file mutation score | **100%** (≥ 90 ✓) |
| `guards.ts` per-file mutation score | **100%** (≥ 90 ✓) |
| Aggregate mutation score | **96.27%** (≥ 90 ✓, up from 91.70%) |
| `posttest:mutation` on real report | Pass — "All 8 mutated file(s) at or above the 90% floor." |
| `posttest:mutation` on **deliberately-failing** fixture (weak.ts @ 50%) | Exit 1 ✓ — flagged `weak.ts`, passed `strong.ts` (timeout counted as detected) |
| `npm run type-check` | Clean |
| `npm run lint` (oxlint type-aware, changed specs) | 0 errors |
| `npm run format:check` (changed files) | Clean |
| `npm run knip` | 0 violations (new script resolved via the package.json hook reference) |
| `npm run test:unit` (two affected specs) | 23/23 pass (was 17; +2 guards, +4 bricklink) |

## Acceptance Criteria

- [x] `bricklinkWantedList.ts` per-file mutation score ≥ 90% — **100%**
- [x] `guards.ts` per-file mutation score ≥ 90% — **100%**
- [x] Aggregate mutation score remains ≥ 90% — **96.27%**
- [x] Per-file enforcement mechanism chosen, documented, implemented — **Option 2**
- [x] Script at `frontend/scripts/check-mutation-per-file-floor.mjs`, wired as `posttest:mutation`, tested with a deliberately-failing setup
- [x] Pulse "Mutation testing (Stryker) v2" row updated (promotion to Battle-tested deliberately held — see below)
- [x] Build Record captures the chosen option and why the other two were rejected

## Notes & Deferrals

- **Battle-tested promotion held.** The v2 row stays **Established**. The promotion condition was "one sprint of green CI runs"; this WO adds a *new* per-file gate that has not yet ridden CI at all. Promoting now would certify an unproven gate. Recommend re-evaluating after the per-file hook has a sprint of green CI runs.
- **WO status flip deferred to post-merge** per ADR-0028 uniform-rule — the WO remains `Status: Open` on this branch and flips to `Closed` in a post-merge follow-up.
- **Environment:** session started on Node v22 with `frontend/node_modules` absent (flagged by the SessionStart hook). Resolved before any build by `nvm install 24` + `npm ci`. The pre-push gauntlet requires Node 24.
- **Out of scope, untouched:** mutation scope expansion beyond the 9 files; lowering `break: 90`; pre-emptive triage of files already ≥ 90% — all explicitly fenced out by the WO.
