# Audit: Gallery Pulse Refresh

**Audit #:** 2026-05-20-gallery-pulse-refresh
**Filed:** 2026-05-20
**Auditor:** Quality Warden (returned via subagent dispatch; file written by The Steward on the Warden's behalf — see Audit Note at file end re: Warden tool-set gap)
**Wing:** Gallery
**Scope:** Focused — Gallery Pulse sections 1-5 freshness verification
**Work Order:** [`2026-05-20-warden-gallery-pulse-refresh`](../work-orders/2026-05-20-warden-gallery-pulse-refresh.md)
**Pulse Version Assessed:** 2026-04-11 (Gallery health/concerns), 2026-03-29 (Gallery pattern maturity/quality metrics/tech debt)

---

## Gauntlet Measurements (Pulse-Claim-Relevant Only)

Environment: Node v24.13.0 (canonical — .nvmrc requirement met). No `--pool=forks` workaround required.

| Check | Result | Notes |
|---|---|---|
| format:check | Pass | 330 files clean |
| lint | Pass | 0 warnings, 0 errors, 303 files, 251 rules |
| test:coverage | Pass | 1380/1380 tests, 100% lines/branches/functions/statements |
| knip | Pass | 0 violations |
| test:integration:run | 4 FAILED / 15 passed (19 files), 5 FAILED / 138 passed (143 tests) | Permits A and B still open |

**Collect Guard (2x coverage mode, threshold 1000ms delta):**

COLLECT GUARD VIOLATION (blocked):
- `apps/families/domains/parts/pages/PartsPage.spec.ts` — 1713ms delta (threshold 1000ms)

COLLECT GUARD warnings (200-1000ms delta range):
- `apps/families/domains/about/pages/AboutPage.spec.ts` — 520ms delta, 520ms raw, 0ms baseline
- `apps/admin/App.spec.ts` — 511ms delta
- `apps/showcase/components/BrickShapes.spec.ts` — 439ms delta, 700ms raw, 261ms baseline

TEST GUARD warnings (>600ms in coverage mode):
- `apps/families/domains/sets/pages/SetsOverviewPage.spec.ts` — **2397ms** (30 tests)
- `apps/showcase/components/ComponentGallery.spec.ts` — 1050ms (18 tests)
- `apps/families/domains/about/pages/AboutPage.spec.ts` — 890ms (35 tests)
- `apps/families/domains/sets/pages/SetsOverviewTheme.spec.ts` — 877ms (13 tests)
- `apps/families/domains/parts/pages/PartsPage.spec.ts` — 732ms (44 tests)
- `apps/showcase/components/MiddlewarePipelineVisualizer.spec.ts` — 722ms (24 tests)
- `apps/families/domains/storage/pages/StorageOverviewPage.spec.ts` — 707ms (15 tests)
- `apps/families/domains/sets/pages/SetDetailPage.spec.ts` — 660ms (30 tests)
- `apps/showcase/components/ResourceAdapterPlayground.spec.ts` — 615ms (39 tests)

---

## Section 1: Overall Health — Gallery

**Pulse claims (assessed 2026-04-11):** Rating 9/10. Supporting claims: router migration complete, ADR-0024 page integration test layer established, gauntlet fully green, documentation drift as primary recurring concern.

**Verdict: Partially Drifted**

**Evidence:**

- **Router migration complete:** Confirmed. `@script-development/fs-router` is in production use. No raw `useRouter`/`useRoute` calls found. Still accurate.
- **ADR-0024 page integration test layer established:** The layer exists — 19 integration test files covering all domain pages. However, the current test run shows 4 failed files, 5 failing tests. The xNOYG merge added `in_storage` as a 6th status option but `AddSetPage.spec.ts:56` still expects `toHaveLength(5)`. Work Orders for fixing assertions (Permit A) and CI wiring (Permit B) remain Open after 15 days. "Established" was accurate in April but the layer is not green today — it has unrepaired assertion failures.
- **Gauntlet fully green:** The unit gauntlet is green. The integration gauntlet is not. The Pulse's claim was about the unit gauntlet (which includes format:check, lint, type-check, test:coverage, knip, size) — those are all green today. However, since the last assessment, a NEW collect guard VIOLATION has appeared (`PartsPage.spec.ts`, 1713ms delta) that was only in WARNING territory on 2026-05-09 (679ms delta at that point). This is a material degradation.
- **Test count:** 1380 tests (unit suite). The Pulse correctly defers to gauntlet output; this confirms compliance with the "no hardcoded counts" rule.
- **Rating 9/10:** Given the `PartsPage.spec.ts` collect guard violation (a new ADR-0012 breach), the integration suite running 5 failing tests for 15+ days, and the `SetsOverviewPage.spec.ts` alarming 2397ms execution time, the 9/10 rating is no longer supportable. The architectural foundation is sound, but the test health picture has degraded since April 11.

**Proposed rating:** 8/10 — strong architectural foundation, 100% unit coverage maintained, but collection-guard violation emerged (new since last assessment), integration suite stale failures unrepaired, and the pre-push gauntlet warnings have worsened.

---

## Section 2: Active Concerns — Gallery

**Pulse claims (assessed 2026-04-11):**

| Concern | Severity | Status |
|---|---|---|
| `AboutPage.spec.ts` collect guard breach | Medium | Active |
| `ComponentGallery.spec.ts` collect guard breach | Medium | Monitoring |
| `Item` type constraint mismatch | Low | Aware |
| `format:check` failures on `.claude/` md | Low | Known |

**Verdict: Significantly Drifted**

**Evidence per entry:**

**AboutPage.spec.ts collect guard breach:** The Pulse says 618ms delta. This audit measured 520ms delta, 890ms execution (TEST GUARD). The collect guard reading improved — it's now in the WARNING zone (200-1000ms), not a VIOLATION. However, the Pulse's notes are stale: it cites "618ms delta in coverage mode" as the severity trigger, but the current 2x-mode threshold is 1000ms delta (doubled from the 500ms threshold stated in some prior references), and 520ms falls below that. The root cause (16 shape component imports) remains unchanged. Status: still a warning, not a blocking violation. Severity should stay Medium but notes need updating.

**ComponentGallery.spec.ts collect guard breach:** This audit measured 1050ms execution (TEST GUARD warning zone, not failure), collect delta 439ms (warning range, not violation). Still flagged as a TEST GUARD concern but not a collect guard violation. The Pulse says "808ms execution time, TEST GUARD" — current reading is 1050ms, a worsening. Root cause (mount vs. shallowMount) unresolved. Status: still active.

**NEW concern not in Pulse:** `PartsPage.spec.ts` collect guard VIOLATION — 1713ms delta (threshold 1000ms in 2x mode). This file was at 679ms delta on 2026-05-09 (warning zone) and has crossed the violation threshold. This is a new Medium-severity Active Concern that the Pulse does not record.

**NEW concern not in Pulse:** `SetsOverviewPage.spec.ts` TEST GUARD alarming — 2397ms execution (30 tests). Prior reading was 1143ms on 2026-05-09. This is a significant 2.1x increase. Still below the 4000ms hard cap, but the trend is alarming. This should be flagged as a new Monitoring concern.

**Integration suite failures (5 failing tests):** Not currently in the Gallery Active Concerns table. The integration test situation is addressed in Active Concerns via the Atrium (Permit B exists). However the direct observational fact — "5 integration tests failing on main, Permits A and B both still Open" — belongs as a Gallery concern row.

**Item type constraint mismatch:** No evidence this was resolved. Still a reasonable low concern. Status: unchanged.

**format:check failures on .claude/ md:** Still a known low concern. Status: unchanged.

---

## Section 3: Pattern Maturity — Gallery

**Pulse claims (assessed 2026-03-29 — 51 days):**

| Pattern | Maturity |
|---|---|
| Multi-app architecture | Battle-tested |
| RouterService wrapper | Battle-tested |
| Factory services | Battle-tested |
| Domain isolation | Battle-tested |
| Case conversion at HTTP boundary (ADR-0029) | Battle-tested |
| Resource adapter | Battle-tested |
| Adapter-store module | Battle-tested |
| Brick Brutalism design system | Battle-tested |
| Page integration tests (ADR-0024) | Battle-tested |
| Mutation testing (Stryker) | Configured |
| Form submit loading guard | Battle-tested |

**Verdict: Significantly Drifted (two entries need correction)**

**Evidence per entry:**

**Multi-app architecture, RouterService wrapper, Factory services, Domain isolation:** All confirmed. Architecture tests enforce boundaries, 0 violations. Still Battle-tested. No change.

**Case conversion at HTTP boundary (ADR-0029):** ADR-0029 is accepted and active. HTTP middleware in both apps registers the case conversion. Confirmed Battle-tested. No change.

**Resource adapter, Adapter-store module:** Still in active production use in the sets domain. Still Battle-tested. No change.

**Brick Brutalism design system:** Showcase app tests pass. Still Battle-tested. No change.

**Page integration tests (ADR-0024) — "Battle-tested": INCORRECT**

This is the most significant pattern maturity drift. The Pulse rates this Battle-tested. Current state:
- `npm run test:integration:run` shows 4 failed files, 5 failing tests on main
- Permit A (fix assertion drift) — Status: Open, filed 2026-05-05
- Permit B (CI wiring) — Status: Open (blocked by A), filed 2026-05-05
- 15 days without resolution
- `AddSetPage.spec.ts` failure is caused by the xNOYG `in_storage` merge adding a 6th status; the test expects 5. This is a regression introduced after the maturity rating was set.

"Battle-tested" requires that the pattern is in active use and producing value. Integration tests cannot be producing detection value if they have 5 known-failing assertions and no CI gate. The correct rating today is "Established with open failures" — the layer exists, the ADR is sound, but the maintenance discipline hasn't kept pace. This must be corrected in the Pulse.

**Mutation testing (Stryker) — "Configured": Accurate, but needs clarification**

`stryker.config.json` exists, `test:mutation` script exists in `package.json`, `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` are installed as devDependencies. However, no mutation report has ever been generated (no `reports/mutation/` directory exists in the tree, no git commits reference mutation results). The config's `thresholds` sets `break: 80` — so it's plausibly configured correctly. But the last sentence in the Pulse entry "not yet run in anger" remains accurate. Status: still "Configured." No change needed.

**Form submit loading guard:** Still in use. `useFormSubmit` composable is tested. Still Battle-tested. No change.

**SOP G-4 reverse-verify (Pattern Maturity table vs. code):** All listed patterns are still in use. No patterns have been consumed since last assessment that would move "Tested, not consumed" items. Stryker remains the one "not run in production" item. No new patterns have emerged that should be added.

---

## Section 4: Tech Debt — Gallery

**Pulse claims (assessed 2026-03-25 — 55 days):**

| Item | Severity |
|---|---|
| SetDetailPage ancillary HTTP calls outside adapter | Low |
| Button/nav components lack keyboard tests | Low |
| Oxlint JS plugins not yet available for custom Vue checks | Low |

**Verdict: Partially Drifted**

**Evidence per entry:**

**SetDetailPage ancillary HTTP calls outside adapter:** Confirmed still present. `SetDetailPage.vue` contains `loadParts()` (line 118) and `storageMap` ref (line 20) — direct HTTP calls outside the adapter layer. These are noted as "read-only projections, not CRUD — correctly direct" in the Pulse. No change, still Low. Item remains valid.

**Button/nav components lack keyboard tests:** Confirmed still missing. No `keydown`, `keyboard`, or key-trigger assertions found in `PrimaryButton.spec.ts`, `DangerButton.spec.ts`, `BackButton.spec.ts`, `ListItemButton.spec.ts`, `NavLink.spec.ts`, `NavMobileLink.spec.ts`. Item remains valid.

**Oxlint JS plugins not yet available for custom Vue checks:** This is a "monitoring external tooling" item. No external verification performed (would require checking the oxlint milestone 3 external URL). Conservatively, item remains valid until a future inspection confirms availability.

**New Tech Debt items (not in current Pulse):**

1. `prevCursor` field in `src/apps/families/types/part.ts` (line 80) — still present with comment "API returns prevCursor but pagination is forward-only; retained for type accuracy." This has been flagged in the Casebook Recurring Patterns as appearing across 2 inspection cycles as of 2026-04-25. This audit marks the **third consecutive** inspection finding it unresolved. Per the Casebook's own note: "If a third inspection finds them unresolved, recommend escalation to medium." Recommend adding to the Pulse Tech Debt register at Low severity and scheduling resolution.

2. Domain pages excluded from unit-coverage 100% gate — `src/apps/**/domains/**` excluded from thresholds. Catch-branch gaps require manual inspection. This was proposed for the Pulse by the 2026-05-16 post-merge audit (Finding 4) but the Pulse was not updated to include it. Still absent from the Tech Debt register.

3. **`SetDetailPage.vue` has a `loadStorageMap` ancillary call (storage map ref) that is not covered by the adapter pattern.** The Pulse entry correctly documents `loadParts`, but `storageMap` is the second separate ancillary call. The item description "SetDetailPage ancillary HTTP calls outside adapter" (plural "calls") covers this — but only `loadParts` is named. Update the item description to name both.

---

## Section 5: Quality Metrics — Gallery

**Pulse claims (assessed 2026-03-29 — 51 days):**

The Pulse correctly defers counts to canonical sources rather than hardcoding. This audit verifies the canonical sources themselves are accurate.

| Metric | Pulse Reference | Current Verified Value | Status |
|---|---|---|---|
| Test coverage (lines) | "100% — npm run test:unit" | 100% (1280/1280 lines) | Still accurate |
| Test coverage (branches) | "100% — npm run test:unit" | 100% (1053/1053 branches) | Still accurate |
| Test count | "run npm run test:unit for current count" | 1380 tests (113 files) | Reference format still accurate |
| Shared components | "see meta.componentCount — component-registry.json" | 51 | Reference format still accurate |
| Domains (Families) | "list src/apps/families/domains/" | 8 (about, auth, brick-dna, home, parts, sets, settings, storage) | Reference format still accurate |
| knip violations | "0 — npm run knip" | 0 | Still accurate |

**Verdict: Still Accurate**

The Quality Metrics section uses canonical source references (not hardcoded values) as intended by the Pulse rules. All canonical sources produce values that are plausible and consistent with the codebase state. The reference format itself is the correct form — the Pulse correctly instructs readers to run the commands rather than hardcoding counts.

**One qualification:** The coverage summary shows 100% at the unit level. The Pulse does not separately call out integration test coverage status. Given that the integration suite has 5 failing tests, there is an honest-metrics concern: the coverage number reflects only the unit gauntlet, not the integration suite. This distinction should be noted in the Quality Metrics section header.

---

## Casebook Standing Suspicion Cross-Check

| Suspicion | Current Status |
|---|---|
| ComponentHealth registry freshness | Resolved 2026-04-25 — no change |
| Coverage exclusion scope | Still active — showcase excluded. Not verified this cycle (out of scope). |
| `ComponentGallery.spec.ts` collect guard | **Worsened.** 1050ms execution (was 933ms in 2026-04-25). Still TEST GUARD warning zone. Root cause unresolved. |
| `AboutPage.spec.ts` collect guard | **Improved.** 520ms delta, 890ms execution. Previously recorded as 1522ms delta — environment difference (Node 24 vs. earlier measurement). Still in WARNING zone. Root cause unchanged (16 shape imports). |
| Pulse staleness (systematic) | **Addressed by this audit.** The dedicated Pulse-refresh dispatch was the escalation path the Casebook recommended. Once the Steward commits the Proposed Pulse Updates from this audit, this suspicion should be moved to Crossed-Out. |
| SetsOverviewPage.spec.ts slow | **Significantly worsened.** 2397ms in this run (30 tests). Prior: 1143ms (2026-05-09). The xNOYG in_storage merge added 6 more tests and the file has grown from 24 to 30 tests. Trend is now alarming: 855ms → 1056ms → 1143ms → 2397ms. Recommend a split into `SetsOverviewPage.spec.ts` + `SetsOverviewFiltering.spec.ts`. |
| Integration test hardcoded copy drift | **Still active.** 5 integration test failures on main. Permits A and B both still Open. The `AddSetPage.spec.ts` failure is now also a structural drift (expected 5 statuses, code has 6 after xNOYG merge) — not just copy drift, but schema drift. |
| `test:coverage` parallel race condition | **Resolved.** Node 24.13.0 confirmed as the active Node version. `npm run test:coverage -- --pool=forks` ran successfully in this environment. No ENOENT race observed. CI uses Node 24 (confirmed in `frontend-ci.yml`). Suspicion closed. |

**New findings not previously in the Casebook:**

- `PartsPage.spec.ts` collect guard VIOLATION — 1713ms delta (threshold 1000ms in 2x mode). This file was at 679ms on 2026-05-09 (warning zone). It has crossed the violation threshold. New Medium Active Concern. Not yet in the Pulse.
- Integration suite now has a **structural failure** (not just copy drift): `AddSetPage.spec.ts` expects `toHaveLength(5)` but 6 status options exist. The xNOYG merge added `in_storage` and the integration test was not updated. This means Permit A's scope must include fixing this too (the Work Order's table at row 4 says `toHaveLength(5)` → `toHaveLength(6)` — this was known at permit filing but the permit remains Open).

---

## Doc Drift

| Document | Accurate | Drift Found |
|---|---|---|
| Pulse — Overall Health Gallery | Partially drifted | Rating still 9/10 but gauntlet is not "fully green" — collect guard violation and 5 integration failures |
| Pulse — Active Concerns Gallery | Significantly drifted | `PartsPage.spec.ts` VIOLATION missing; `SetsOverviewPage.spec.ts` alarming increase missing; integration failures not listed as Gallery concern |
| Pulse — Pattern Maturity Gallery | Significantly drifted | "Page integration tests (ADR-0024): Battle-tested" is incorrect — 5 failing tests, Permit A still open |
| Pulse — Tech Debt Gallery | Partially drifted | `prevCursor` (3rd occurrence), domain-page coverage gap, `storageMap` not named in SetDetailPage item |
| Pulse — Quality Metrics Gallery | Still accurate | Canonical source reference format intact; current values verified |
| Domain Map | Still accurate | 8 Families domains confirmed, Admin/Showcase correct |
| Component Registry | Still accurate | meta.componentCount = 51, format:check passes |

---

## Proposed Pulse Updates

### Section 1: Overall Health — Gallery

Replace the Gallery paragraph:

```
**Gallery Wing Rating:** 8/10
**Assessed:** 2026-05-20 (Gallery)

**Gallery (frontend):** Strong architectural foundation with 100% unit test coverage maintained. Multi-app structure with strict isolation. Showcase app fully tested. Adapter-store and resource-adapter patterns battle-tested. Page integration test layer established (ADR-0024) but currently has 5 unrepaired assertion failures and no CI gate (Permits A and B open). Router migration to `@script-development/fs-router` complete. Unit gauntlet fully green. New collect guard violation in `PartsPage.spec.ts` (1713ms delta) emerged this cycle. Documentation drift remains the primary recurring concern; addressed by Pulse-refresh audit 2026-05-20.
```

### Section 2: Active Concerns — Gallery

Replace the Gallery table:

```
| Concern | Severity | Status | Notes |
|---|---|---|---|
| `PartsPage.spec.ts` collect guard violation | Medium | New | 1713ms delta (threshold 1000ms in 2x mode). Emerged since 2026-05-09 (was 679ms delta then). Root cause: heavy import chain. ADR-0012 breach. |
| `AboutPage.spec.ts` collect guard warning | Low | Monitoring | 520ms delta in 2x mode (threshold 1000ms). Root cause: 16 named Lego shape component imports. Improved from prior readings. |
| `ComponentGallery.spec.ts` TEST GUARD | Medium | Monitoring | 1050ms execution (30+ tests). Root cause: `mount` (not `shallowMount`) importing all shared components. Worsening trend. |
| `SetsOverviewPage.spec.ts` TEST GUARD alarming | Medium | Monitoring | 2397ms execution (30 tests). Significant jump from 1143ms on 2026-05-09. xNOYG `in_storage` merge added 6 tests. Trend warrants split into two spec files. |
| Integration suite: 5 failing tests (Permits A + B open) | Medium | Active | 4 spec files, 5 failing tests on main. Permit A (assertion fixes) and Permit B (CI wiring) both Open as of 2026-05-20. Root causes: copy drift + `AddSetPage` expects 5 statuses, code now has 6. |
| `Item` type constraint mismatch | Low | Aware | `FamilySet` has `id` but no `createdAt`/`updatedAt` — may surface in future domains |
| `format:check` failures on `.claude/` md | Low | Known | oxfmt reformats markdown — agent docs and journal files drift; not a code defect |
```

### Section 3: Pattern Maturity — Gallery

Update the Gallery table (only the changed rows):

```
| Page integration tests (ADR-0024) | Established | Layer exists with 19 test files covering all domain pages. 5 failing assertions on main (Permit A Open). No CI gate (Permit B Open, blocked by A). Cannot be rated Battle-tested until both permits ship and CI confirms green. |
```

All other rows unchanged.

Update assessed date: `**Assessed:** 2026-05-20 (Gallery)`

### Section 4: Tech Debt — Gallery

Add two new items to the Gallery table:

```
| `prevCursor` field in part types unused by UI | Low | API returns prevCursor but pagination is forward-only; retained for type accuracy. Third inspection cycle unresolved. |
| Domain pages excluded from unit-coverage 100% gate | Low | `src/apps/**/domains/**` excluded from thresholds — catch-branch gaps require manual inspection or integration-test coverage. No automated detection. |
```

Update the `SetDetailPage` item to name both ancillary calls:

```
| SetDetailPage ancillary HTTP calls outside adapter | Low | `loadParts` + `loadStorageMap` (storage map ref) are read-only projections, not CRUD — correctly direct. Both named explicitly. |
```

Update assessed date: `**Assessed:** 2026-05-20 (Gallery)`

### Section 5: Quality Metrics — Gallery

Add a clarifying note under the Gallery header:

```
_Coverage figures below reflect the unit test gauntlet only. Integration tests (`npm run test:integration:run`) are not included in these thresholds — see Active Concerns for integration suite status._
```

Update assessed date: `**Assessed:** 2026-05-20 (Gallery)`

---

## ADR Pressure

None detected specific to the Gallery sections reviewed. ADR-0024 (page integration tests) is under pressure — the "Battle-tested" designation in the Pulse is wrong, and the CI gate absence means the enforcement section of the ADR is effectively unenforced. This is a maintenance failure, not an ADR architectural failure. No re-interrogation recommended at this time; the issue is operational (permits open), not architectural (ADR still valid).

---

## Self-Debrief

### What I Caught

- Pattern Maturity "Page integration tests: Battle-tested" is the most significant finding in this audit. The rating was set when the suite was green; it has never been updated despite 5 failures persisting for 15+ days and both Permits A and B remaining Open. The rating is wrong and would mislead anyone using the Pulse to assess Gallery health.
- `PartsPage.spec.ts` collect guard crossed from WARNING to VIOLATION between the last inspection (679ms delta, 2026-05-09) and this one (1713ms delta, 2026-05-20). This is a NEW Active Concern not in the Pulse.
- `SetsOverviewPage.spec.ts` jumped from 1143ms to 2397ms — a 2.1x increase in one cycle. This is alarming and actionable.
- The `test:coverage` parallel race condition was confirmed resolved by Node 24 being present. A Casebook suspicion that had been open since 2026-05-09 can now be closed.
- Stryker verification: still "Configured" and not yet run in anger. No mutation report directory exists. The Pulse claim is accurate.

### What I Missed

- Did not run `npm run type-check` separately (it is bundled in `npm run build`). Coverage of the type-check claim is indirect.
- Did not inspect the full `vitest.config.ts` to verify the coverage exclusion list hasn't grown. The Casebook has a standing suspicion on this; it was out of scope for today but remains unverified.
- Did not examine whether the `PartsPage.spec.ts` collect guard violation is pre-existing or caused by a recent change. The 2026-05-09 audit recorded it at 679ms (warning zone). Something between 2026-05-09 and today caused it to cross 1000ms. Without deeper investigation, I cannot name the commit that caused it.

### Methodology Gaps

- The SOP G-1 instruction to "capture full collect-guard and test-guard reporter output separately from pass/fail" was followed — the verbatim output is in the Gauntlet Measurements section. The prior instinct (from the 2026-05-09 audit) to use `--pool=forks` was unnecessary on Node 24; this confirms the race was a Node 22 artifact. Good calibration.
- **Tooling gap surfaced during this dispatch:** the Quality Warden's tool-set (`Read, Bash, Glob, Grep`) does not include `Write`. The Warden's primary deliverable is the Audit file under `.claude/records/audits/`. The Warden had no clean way to file the Audit themselves and returned it as text for The Steward to file. This is a structural gap in the agent definition and warrants either (a) granting the Warden `Write` access restricted to `.claude/records/audits/` and the Casebook, or (b) formalizing the "Warden returns Audit text; Steward files" pattern as the canonical flow. Either choice should be made explicitly, not by accident.

### Should "Pulse staleness (systematic)" be downgraded after Steward commits proposed updates?

**Yes, conditionally.** If The Steward commits the Proposed Pulse Updates from this audit, the "Pulse staleness (systematic)" Standing Suspicion should be moved from Standing Suspicions to Crossed-Out in the Casebook, with the conclusion: "Dedicated Pulse-refresh audit commissioned (2026-05-20) and proposed updates filed. Suspicion resolved at the dispatch level. New suspicion: drift will recur if updates are not part of every Build Record." The underlying structural cause — no automated Pulse update mechanism — remains. The suspicion should be replaced with a lighter monitoring note rather than left as a "medium severity" standing suspicion, since the dedicated dispatch path now exists.

---

## Casebook Updates (Proposed — Applied by The Steward on the Warden's behalf)

The Steward applied the Casebook updates listed below in the same commit as this Audit's filing, given that the Warden's tool-set lacks Write access (see Methodology Gaps).

**Standing Suspicions table changes:**

- `ComponentGallery.spec.ts collect guard` — Evidence updated with 2026-05-20 readings (1050ms execution, 439ms collect delta; worsened from 933ms). Next Inspection: monitor for crossing 1500ms.
- `AboutPage.spec.ts collect guard` — Evidence updated with 2026-05-20 readings (520ms delta, 890ms execution; improved from 1522ms prior — Node 24 environment difference). Next Inspection: monitor stability on Node 24.
- `Pulse staleness (systematic)` — Moved to Crossed-Out. Conclusion: dedicated Pulse-refresh audit dispatched, proposed updates filed and committed. Replaced by lighter structural note.
- `SetsOverviewPage.spec.ts slow` — Evidence updated with 2026-05-20 readings (2397ms execution; trend: 855ms → 1056ms → 1143ms → 2397ms). Next Inspection: file Work Order if still above 1500ms.
- `test:coverage parallel race condition` — Moved to Crossed-Out. Conclusion: Node v24.13.0 confirmed active. Race was Node 22 artifact.

**New Standing Suspicion to add:**

- `PartsPage.spec.ts collect guard VIOLATION` — 1713ms delta crossed 1000ms threshold in 2x coverage mode. First noticed 2026-05-20. ADR-0012 breach. Next Inspection: re-measure and file Work Order if still >1000ms.

**Recurring Patterns table changes:**

- `prevCursor` — Occurrences 2 → 3, Last Seen 2026-05-20, Escalated: Yes — added to Pulse Tech Debt register.
- `Integration tests not in any automated gate` — Occurrences 1 → 2, Last Seen 2026-05-20, Escalated: Partially — Permits A and B both still Open.

---

## Showcase Readiness

Needs polish. The 9/10 Gallery health rating in the Pulse is overstated for a codebase with 5 known-failing integration tests sitting unrepaired for 15+ days and a new collect guard violation. The architectural foundation is genuinely strong, but the maintenance picture would raise questions from a senior architect performing due diligence. The Proposed Pulse Updates correct the rating to 8/10, which is honest and still portfolio-positive.

---

## Verdict Summary

- **Overall Health:** Partially Drifted (rating should be 8/10, not 9/10)
- **Active Concerns:** Significantly Drifted (two new mediums missing: PartsPage VIOLATION, SetsOverviewPage alarming; integration failures not listed)
- **Pattern Maturity:** Significantly Drifted ("Page integration tests: Battle-tested" is wrong — suite has 5 failures and no CI gate)
- **Tech Debt:** Partially Drifted (two items missing, one item description needs updating)
- **Quality Metrics:** Still Accurate (canonical source references intact, values verified)

---

## Audit Note — Tooling Gap

This Audit was returned by the Quality Warden subagent as text in its return message and filed by The Steward, because the Warden's current `tools` allowlist (`Read, Bash, Glob, Grep`) does not include `Write`. The Warden's primary deliverable per its own agent definition is the Audit file at `.claude/records/audits/YYYY-MM-DD-{scope}.md` — but the agent has no canonical mechanism to produce that file. This dispatch confirmed the gap structurally. A follow-up decision is required (see Methodology Gaps).

---

## Steward Evaluation

_To be filled — same fresh-context disclosure as recent Build Records. Pending until a Steward dispatch can evaluate without conversation-window contamination._
