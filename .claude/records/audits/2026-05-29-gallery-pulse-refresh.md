# Audit — Gallery Pulse Refresh

**Filed:** 2026-05-29
**Auditor:** Quality Warden
**Wing:** Gallery
**Work Order:** [`2026-05-29-warden-gallery-pulse-refresh`](../work-orders/2026-05-29-warden-gallery-pulse-refresh.md)
**Type:** Freshness audit (not a bug hunt)
**Scope:** Verify the five Gallery Pulse sections against current reality; produce drop-in replacement text for drift; close two stale Casebook entries with evidence.

---

## Executive Summary

The Gallery Pulse is **mostly accurate but lagging in three places**, all traceable to deliveries that postdate the 2026-05-25 / 2026-05-27 assessment dates:

| Section | Verdict | Why |
|---|---|---|
| Overall Health — Gallery | **Partially Drifted** | Narrative still leads with the resolved `PartsPage` collect-guard violation as "the loudest active medium" and predates Stryker v2. Rating 8/10 still defensible. |
| Quality Metrics — Gallery | **Still Accurate** (canonical-source rows verified) | All canonical-source pointers resolve correctly; values confirmed. Only an optional freshness note to add. |
| Active Concerns — Gallery | **Partially Drifted** | `AboutPage` collect-guard re-measured higher than the recorded 520ms and the structural framing changed (now on the SUT-only arch-test legacy allowlist, PR #127). Other two entries accurate. |
| Pattern Maturity — Gallery | **Partially Drifted** | Mutation Testing v2 row says "Reintroduced 2026-05-28 (PR forthcoming)" — the PR (#135) has shipped and merged. Promotion condition assessed **pending**. |
| Tech Debt — Gallery | **Partially Drifted** | One new structural item to add (SUT-only legacy allowlist debt, 7 specs incl. AboutPage's 16 shape imports). Existing items still valid. |

Both Casebook closures applied with verified evidence. No findings outside Pulse scope surfaced that warrant a stop-and-flag — the audit stayed in its lane.

---

## Canonical-Source Measurements (this audit, 2026-05-29)

All run after `(cd frontend && npm install)` synced deps (the session-start hook flagged `package.json` newer than `node_modules`; `npm install` reported **0 vulnerabilities**, which independently confirms the Pattern-Maturity `qs` override claim).

| Metric | Value | Source command |
|---|---|---|
| Unit test count | **1413 tests / 115 files, all passing** | `npm run test:unit` |
| Coverage — statements | **100% (1445/1445)** | `npm run test:coverage` |
| Coverage — branches | **100% (1118/1118)** | `npm run test:coverage` |
| Coverage — functions | **100% (422/422)** | `npm run test:coverage` |
| Coverage — lines | **100% (1344/1344)** | `npm run test:coverage` |
| Shared components | **51** | `meta.componentCount` in `src/shared/generated/component-registry.json` |
| Families domains | **8** — about, auth, brick-dna, home, parts, sets, settings, storage | `ls src/apps/families/domains/` |
| knip violations | **0** (exit 0) | `npm run knip` |
| npm audit | **0 vulnerabilities** | `npm audit` |

The Pulse correctly stores these as canonical-source *pointers* rather than hardcoded numbers — that discipline held and is the reason I do not propose hardcoding any of them.

---

## AboutPage Collect-Guard Re-measurement (verbatim)

The WO requires the verbatim re-measured value, not the prior number. Captured across multiple `npm run test:coverage` runs in 2x coverage mode:

- **Run A:** AboutPage **did not appear** in the collect-guard warning list at all — i.e. below the 400ms warning floor.
- **Run B (verbatim):** `[families/about] 932ms delta | 932ms raw | 0ms baseline | apps/families/domains/about/pages/AboutPage.spec.ts`
- **Execution (TEST GUARD, 600ms 2x threshold):** ranged **811ms–1165ms / 35 tests** across runs.

**Interpretation:** the collect delta is **baseline-order-sensitive, not monotonic**. When AboutPage runs cold (0ms baseline — first file in its worker thread to pay the import chain) it shows ~932ms; when a sibling has already paid the chain, the delta drops below the 400ms warning floor. The Pulse's recorded "520ms delta" was a single point on this swing, not a stable value.

- Still **under** the 1000ms collect-guard FAIL cap (2x mode) — no gate breach.
- Root cause **unchanged**: 16 named Lego shape component imports at the top of the spec (lines 2–17; 17 grep-hits). Now also enumerated explicitly on the SUT-only arch-test **legacy allowlist** (`architecture.spec.ts` line 793, PR #127).

The honest characterization for the Pulse: "warning-zone, baseline-order-sensitive, structurally tracked on the SUT-only legacy allowlist" — not a single fixed delta.

---

## Mutation Testing v2 — Promotion Condition Assessment

**Verdict: PENDING (not met).** The promotion condition is "after one sprint of green CI runs."

Evidence:

- **PR #135 merged to `main` 2026-05-28** (commit `f8887e3`, `feat(gallery): reintroduce frontend mutation testing (v2) with CI gate`). The Pulse text "Reintroduced 2026-05-28 (PR forthcoming)" is now stale — the PR has shipped.
- `frontend/stryker.config.mjs` confirmed: `testRunner: 'vitest'`, `thresholds: {high: 95, low: 90, break: 90}`, `incremental: true`. Mutate scope resolves to **9 files** (helpers, composables, middleware, services/auth — minus types/d.ts/index). Matches the Pulse "9 files" claim.
- `.github/workflows/frontend-ci.yml`: the **Mutation testing (Stryker)** step (line 69) sits **between "Test with coverage" (line 66) and "Integration tests" (line 72)** — exactly as the Pulse documents.
- CI history (`gh run list --workflow=frontend-ci.yml`): the gate has been green on `main` since it landed. The one failing run since (`arch-cleanup-sweep`, 2026-05-28T15:01) failed on **"Lint commit messages"**, NOT the mutation step — its mutation step passed, and the run log shows **"15/242 tested"**, confirming the **242 mutants** claim.
- **Timeline:** only ~1 day elapsed (2026-05-28 → 2026-05-29). "One sprint" has not passed. Promotion to Battle-tested is **correctly still pending** — the row should stay Established, with the stale "(PR forthcoming)" phrasing corrected to reflect the merge.

---

## Section-by-Section Verdicts

### 1. Overall Health — Gallery → Partially Drifted

The 8/10 rating remains defensible (100% coverage held, gauntlet green, multi-app isolation intact). Two drift points:

- The narrative ends with "`PartsPage.spec.ts` collect guard violation (1713ms delta) emerged 2026-05-20 and remains the loudest active medium." **That concern was closed 2026-05-27** (PR #119) — the Active Concerns section itself records the closure. The Overall Health narrative was not re-synced.
- The narrative predates **Stryker v2** (the explicit trigger for this audit) and the **worktree-mode hook fixes**. Neither appears.

### 2. Quality Metrics — Gallery → Still Accurate

Every canonical-source pointer row resolves correctly (verified above). The integration-suite preamble (19 specs / 143 tests, gated in `frontend-ci.yml`) remains accurate. No hardcoded-count drift because the Pulse deliberately stores pointers. Optional: a one-line note that Mutation Testing v2 is now a CI-gated metric layer would improve completeness, but the table as written is not wrong.

### 3. Active Concerns — Gallery → Partially Drifted

| Concern | Recorded | Re-verified verdict |
|---|---|---|
| `AboutPage.spec.ts` collect guard warning | Low / Monitoring / "520ms delta" | **Still Active, value drifted.** Re-measured 932ms-delta-or-below-floor (baseline-order-sensitive). New structural fact: now on the SUT-only arch-test legacy allowlist (PR #127). Reframe needed. |
| `Item` type constraint mismatch | Low / Aware | **Still Accurate** — not re-triggered; no new domains added since (domain count steady at 8). |
| `format:check` failures on `.claude/` md | Low / Known | **Still Accurate** — oxfmt-reformats-markdown behavior unchanged; not a code defect. |

The "Closed 2026-05-27" subsection (PartsPage / SetsOverviewPage / ComponentGallery) remains accurate and verified against the Casebook closures.

### 4. Pattern Maturity — Gallery → Partially Drifted

All Battle-tested rows re-confirmed (no regressions; arch tests green, isolation holds). The single drift is the **Mutation testing (Stryker) v2** row: "Reintroduced 2026-05-28 (PR forthcoming)" is stale (PR #135 shipped). Maturity stays **Established** — promotion condition correctly **pending** (see assessment above). All other claims in that row (Stryker 9 + Vitest runner, 9 files / 242 mutants, `break: 90`, CI-gated between Test-with-coverage and Integration tests, `qs` override → 0 vulnerabilities) **verified accurate**.

### 5. Tech Debt — Gallery → Partially Drifted

Existing five items re-verified, all **still valid** (SetDetailPage ancillary HTTP calls; keyboard tests; oxlint JS plugins; `prevCursor`; domain pages excluded from unit-coverage gate). **One new item to add:**

- **SUT-only legacy-allowlist debt** (PR #127). The SUT-only top-level `.vue` import arch test shipped with a `LEGACY_CROSS_COMPONENT_IMPORTS` allowlist (`architecture.spec.ts` line 790+) enumerating ~7 specs that still import cross-component `.vue` files at top level — including AboutPage's full 16-shape block (lines 793–810). Each entry is declared one-line legacy debt; paydown converts to `findComponent({name})` + `vi.mock`. This is the structural root of the collect-guard warnings and is the paydown target referenced by the existing "Promote collect-guard from informational to failing" Seed.

---

## Proposed Pulse Updates

Drop-in replacement text. The Steward commits; the Warden does not edit `pulse.md`.

### A. Overall Health — Gallery (replace the Gallery paragraph; bump Assessed date)

> **Assessed:** 2026-05-26 (Foundry), **2026-05-29 (Gallery)**

> **Gallery (frontend):** Strong architectural foundation with 100% unit test coverage maintained (lines / branches / functions / statements). Multi-app structure with strict isolation. Showcase app fully tested. Adapter-store and resource-adapter patterns battle-tested. Page integration test layer (ADR-0024) Battle-tested — 19 specs / 143 tests green on `main`, wired as a required gating step in `frontend-ci.yml`. Router migration to `@script-development/fs-router` complete. **Frontend Mutation Testing v2 shipped 2026-05-28 (Stryker 9 + Vitest runner, PR #135): 9 files / 242 mutants, 91.70% score against `break: 90`, CI-gated between "Test with coverage" and "Integration tests" — `npm audit` clean via the `qs` override.** Worktree-mode git-hook regression resolved on both legs (PR #138 pre-commit, PR #140 backend pre-push dispatch). Pattern Master agent operational. Unit gauntlet fully green. The 2026-05-20 `PartsPage`/`SetsOverviewPage`/`ComponentGallery` collect-guard cluster was closed 2026-05-27 (PRs #119/#120/#121); the remaining test-perf signal is `AboutPage.spec.ts` (warning-zone, baseline-order-sensitive, structurally tracked on the SUT-only arch-test legacy allowlist — PR #127). Documentation drift addressed by recurring Pulse-refresh audits.

### B. Quality Metrics — Gallery (bump Assessed date; optional row)

> **Assessed:** 2026-05-26 (Foundry), **2026-05-29 (Gallery)**

Optionally append the integration-suite preamble with a second sentence, or add a metric row:

> | Mutation score (Stryker v2) | _run `npm run test:mutation` for current_ — last CI run 91.70% against `break: 90` (9 files / 242 mutants, `stryker.config.mjs`) | `frontend-ci.yml` Stryker step |

(Keeps the no-hardcode rule: the score is a CI-output pointer, not a frozen number.)

### C. Active Concerns — Gallery (bump Assessed date; rewrite AboutPage row)

> **Assessed:** **2026-05-29 (Gallery)**, 2026-05-26 (Foundry)

> | `AboutPage.spec.ts` collect guard warning | Low | Monitoring | Baseline-order-sensitive in 2x coverage mode: re-measured 2026-05-29 between below-the-400ms-warning-floor and 932ms delta (932ms raw, 0ms cold baseline); execution 811–1165ms / 35 tests. Under the 1000ms FAIL cap. Root cause unchanged: 16 named Lego shape imports (lines 2–17), now enumerated on the SUT-only arch-test legacy allowlist (`architecture.spec.ts`, PR #127). Paydown = `findComponent({name})` + `vi.mock`. |

(The `Item` type constraint and `format:check` rows carry unchanged.)

### D. Pattern Maturity — Gallery (replace the Stryker v2 row; bump Assessed date)

> **Assessed:** 2026-05-26 (Foundry), **2026-05-29 (Gallery)**

> | Mutation testing (Stryker) v2 | Established | **Shipped 2026-05-28 in PR #135** (commit `f8887e3`) after v1 was retired as VESTIGIAL in PR #133. Stryker 9 + Vitest runner, config mirrored from `script-development/fs-packages`. Scope: `src/shared/{helpers,composables,middleware,services/auth}/**/*.ts` (9 files, 242 mutants). 91.70% score against `break: 90`. **CI-gated from day one** in `frontend-ci.yml` between "Test with coverage" and "Integration tests" — addresses the v1 no-consumer/vestigial failure mode. Transitive `qs` advisory closed via `overrides: {qs: "^6.15.2"}`; `npm audit` reports 0 vulnerabilities. **Promotion Established → Battle-tested remains pending: condition is one sprint of green CI runs; only ~1 day elapsed since merge. Gate green on `main` since landing (the one failing CI run since was a commit-lint failure, not the mutation step).** |

### E. Tech Debt — Gallery (bump Assessed date; add one row)

> **Assessed:** 2026-05-27 (Foundry), **2026-05-29 (Gallery)**

> | SUT-only top-level `.vue` import legacy allowlist | Low | The SUT-only arch test (PR #127) carries a `LEGACY_CROSS_COMPONENT_IMPORTS` allowlist of ~7 specs that import cross-component `.vue` files at top level (incl. `AboutPage.spec.ts`'s 16 Lego shapes, `App.spec.ts`, `HomePage`, `BrickDnaPage`, the auth pages). Each entry is declared one-line legacy debt; paydown converts to `findComponent({name})` + `vi.mock` and shrinks the Vite collect phase. Root of the residual collect-guard warnings; paydown target for the "promote collect-guard to failing" Seed. |

---

## Casebook Closures (applied this audit)

Both closures were **verified against current code/git before writing** — not taken on the WO's word.

### 1. `[Foundry] LogoutController session branch coverage` — CLOSED

- **PR #122**, commit `67186d6` (`test(auth): cover LogoutController stateful-session branch (lines 19-20)`).
- Verified in current code: `backend/tests/Feature/Auth/LogoutTest.php` line 30 — `it('should invalidate the session and regenerate the CSRF token when the request is stateful')` — uses `withSession([])` + a `sanctum.stateful`-matching Referer so `$request->hasSession()` is true at handler entry, then asserts both session-id (`invalidate()`) and CSRF-token (`regenerateToken()`) rotated. The Casebook prediction ("verify the fix adds a stateful session-based test that hits lines 19-20 and brings coverage to 100%") was met exactly.
- Commit message records feature coverage 60% → 100% for `Auth/LogoutController`, overall feature 98.1% → 100%.
- Standing Suspicion row updated to Resolved; mirror entry added to Crossed-Out.
- **Steward note:** the Foundry Pulse **Tech Debt** row and **Quality Metrics** "Feature coverage 98.1% — LogoutController at 60%" still record the pre-fix figures. Out of this audit's Gallery scope — flag for the next Foundry Pulse refresh.

### 2. `[Atrium] Worktree-mode pre-commit hook regen path bug` (Recurring Patterns, 3 reproductions) — CLOSED

- **PR #138**, commit `2b93a8e` (pre-commit leg) + **PR #140**, commit `0ece8bc` (backend pre-push dispatch leg); WOs closed via PR #141.
- Verified in current code: `.githooks/pre-commit` line 14 now sets `repo_root=$(git rev-parse --show-toplevel)` and line 55 stages the registry as `git -C "$repo_root" add frontend/src/shared/generated/component-registry.json` — exactly the `git rev-parse --show-toplevel` anchoring the Casebook predicted. The backend dispatch block is similarly anchored against git-common-dir for worktree safety.
- The Warden hypothesis ("a hook that doesn't `cd` but should anchor its `git add` similarly") **confirmed correct on resolution**.
- Recurring Pattern row marked RESOLVED 2026-05-29 with PR evidence.

---

## ADR Pressure

No new ADR-pressure signal from this audit. Noted for the Steward (already tracked, not re-raised here): **ADR-0028** carries a standing frequency watch (two procedural amendments in 8 days; calendar trigger 2026-06-26). This audit did not cite ADR-0028 as a finding, so it does not trip the "next Warden audit citing ADR-0028" re-interrogation trigger.

---

## Self-Debrief

**What I caught:**
- The Mutation v2 promotion condition is genuinely pending (1 day, not a sprint) — and the one failing CI run since landing was a commit-lint failure, not the mutation gate. Distinguishing "the gate failed" from "a different step failed in a run that included the gate" mattered; a lazier read would have recorded a false instability.
- The AboutPage collect-guard delta is baseline-order-sensitive, not a fixed number. Re-running rather than trusting the recorded 520ms surfaced the swing (below-floor ↔ 932ms). The WO's instruction to capture the verbatim value and not trust prior numbers was load-bearing.
- The SUT-only arch test (PR #127) had already shipped and AboutPage's shapes are on its legacy allowlist — a structural fact the Pulse hadn't absorbed, which reframes the AboutPage concern from "slow spec" to "tracked legacy debt with a known paydown."

**What I missed / checked superficially:**
- I did not re-run the full `lint` / `lint:vue` / `type-check` / `size` gauntlet — the WO explicitly de-scoped a full sweep, and no Pulse claim depended on them being contested. If a future Overall Health re-rating hinges on those, they'd need a run.
- I verified the integration suite count (19/143) from the Pulse/CI text and the `frontend-ci.yml` wiring, but did not execute `npm run test:integration:run` this pass — no claim was contested and it was out of the freshness scope.

**Methodology gaps:**
- The Pulse Overall Health narrative drifted because it embeds *resolved* concern text inline (the PartsPage "loudest active medium" line). Active Concerns and Overall Health are maintained separately and can disagree. A standing check — "when an Active Concern is closed, re-scan Overall Health for stale mentions of it" — would have caught this without a full audit.

**Training proposals (candidates, evidence = this audit):**
1. *SOP G-3 (Doc Accuracy) should add: when verifying a "shipped/in-progress" claim in the Pulse, confirm the PR's actual merge state via `git log --grep` AND that the cited CI gate's most recent failures (if any) were caused by that gate vs an unrelated step.* Evidence: the arch-cleanup-sweep run failed on commit-lint while its mutation step passed; a name-only read would have mis-recorded the mutation gate as unstable.
2. *SOP G-4 / S-cross: when re-measuring a timing-based guard (collect/test guard), run ≥2 times and record the range, not a single value — collect deltas are baseline-order-sensitive.* Evidence: AboutPage swung from below-the-400ms-floor to 932ms across two runs of the same command.
3. *Overall-Health-vs-Active-Concerns consistency check: when an Active Concern is marked Closed, scan the Overall Health narrative for stale inline references to it.* Evidence: the PartsPage collect-guard violation closed 2026-05-27 but persisted as "the loudest active medium" in Overall Health on 2026-05-29.

**Casebook reclassification (WO Acceptance Criterion):**
- `AboutPage.spec.ts collect guard` standing suspicion **stays Active** but is reclassified from "monitor whether delta remains stable" to "baseline-order-sensitive, structurally tracked on the SUT-only legacy allowlist" — updated in the Casebook this pass.
- The `Documentation counts` Recurring Pattern (occurrence 5) did **not** fire this audit — every canonical-source pointer resolved cleanly and the Pulse stored pointers rather than hardcoded counts. The structural fix (pointer-not-number discipline) appears to be holding. Not closing it (one clean audit is not proof), but noting the positive signal.
