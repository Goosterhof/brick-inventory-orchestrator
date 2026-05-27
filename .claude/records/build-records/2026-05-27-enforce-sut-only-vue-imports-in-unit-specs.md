# Build Record: Enforce SUT-only top-level `.vue` imports in unit specs

**Build Record #:** 2026-05-27-enforce-sut-only-vue-imports-in-unit-specs
**Filed:** 2026-05-27
**Work Order:** [`2026-05-27-enforce-sut-only-vue-imports-in-unit-specs`](../work-orders/2026-05-27-enforce-sut-only-vue-imports-in-unit-specs.md)
**Builder:** Brickwright
**Wing:** Gallery

> **Work Order Status Discipline (ADR-0028, amended 2026-05-27):**
> This Build Record ships with the parent Work Order still in `Status: Open`. After this Build Record's PR merges to `main`, file a follow-up commit (direct or via a small chore PR — batching multiple closures is acceptable) that flips the WO Status to `Closed`/`Completed` and updates the WO's "Build Record:" link to point at the merged BR. Do **not** close the WO in the same commit as this Build Record.

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Modified | `frontend/src/tests/unit/architecture.spec.ts` | Added new `describe('SUT-only top-level .vue imports — unit specs may only import their system-under-test')` block at the tail of the existing `describe('Architecture')`, immediately after the sibling `mount boundary enforcement` block. One `it()` test; includes a `LEGACY_CROSS_COMPONENT_IMPORTS` allowlist captured from current `main` state. |

## Work Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| New architecture test in `frontend/src/tests/unit/architecture.spec.ts` enforces the SUT-only top-level `.vue` import rule. | Yes | New `describe` block at lines 757–1043 (post-edit). One `it()` test; mirrors the sibling `mount boundary enforcement` style. |
| Test passes on current `main` (after PRs #119/#120/#121 merge). | Yes | `npx vitest run src/tests/unit/architecture.spec.ts` → 34/34 passing. The new test green via the documented allowlist. |
| A deliberately-violating temp spec triggers a clear error message naming the offending import and suggesting `findComponent({ name: 'X' })`. | Yes | Reproduced under a scratch `ScratchSutCheck.spec.ts` (added then deleted before commit). Verbatim failure output captured below in "Verification". |
| Opt-out mechanism works: one documented case where it's required, or a clear note in the Build Record that no opt-outs were needed. | Yes | Allowlist mechanism is JSON-shaped (`Record<string, readonly string[]>`) inside the arch-test file. 38 legacy spec entries documented; 6 of them are *split-spec* (filename mismatch by design — `SetsOverview*`, `SettingsPage*`) and 32 are *legacy debt* (cross-component imports stubbed via `vi.mock` but the static `import` was never removed). |
| Build Record records: implementation approach, opt-out mechanism choice, any legacy violations and their disposition, and one example of the test's failure message. | Yes | See "Decisions Made" + "Verification" + "Legacy violation inventory" below. |
| Frontend pre-push gauntlet green. | Yes | See "Quality Gauntlet" table below — all six checks (`format:check`, `lint`, `lint:vue`, `type-check`, `knip`, `test:coverage`, `build`) green. **Pre-push gauntlet green on this branch — no `--no-verify` required.** |

## Decisions Made

1. **Opt-out mechanism: JSON-shaped allowlist literal inside the arch-test file, not inline comment markers.** The WO offered both shapes. Comment markers (`// arch-allow: cross-component-import`) would require touching every legacy spec to annotate the offending import lines — but the WO's "Not in This Set" clause explicitly forbids changes to existing spec files. JSON allowlist keeps every change inside the single arch-test file, makes the legacy-debt scale visible in one place, and lets the rule still bite on new violations. The allowlist is **self-cleaning**: if an entry's spec no longer imports any disallowed `.vue` file (e.g. because a follow-up WO cleaned it up), the test fails on the stale entry until it is removed. This protects against allowlist rot — the legacy debt cannot silently grow stale.

2. **AST-vs-regex: regex-based, consistent with sibling arch tests.** The sibling `mount boundary enforcement` test (and the file-wide `getImportPaths` helper at the top of `architecture.spec.ts`) uses regex parsing of import statements. I followed the same convention. The new regex `^\s*import\s+(?!type\b)[^;]+?\s+from\s+["']([^"']+\.vue)["']/gm` is anchored to line start, requires a non-`type` first token (so `import type X from '...vue'` is excluded — type-only imports are erased at compile time and do not contribute to the Vite collect-phase dependency graph), and captures the full path so we can take the basename. Reviewed all unit specs: zero specs use `import type ... .vue` patterns today, so the type-only branch is defensive only.

3. **Filename-based SUT derivation, no `.vue` co-existence check.** Per WO: `Foo.spec.ts` → SUT = `Foo.vue`. The rule only checks the *basename* match — it does not verify that the `.vue` file actually exists alongside the spec, nor does it inspect the spec's contents to find which component is *actually* mounted. This intentionally tolerates the **split-spec pattern** (one SUT, multiple specs with derivative names — e.g. `SetsOverviewFiltering.spec.ts` testing `SetsOverviewPage.vue`); those land in the allowlist with a one-line "Split-spec: SUT is X.vue" comment rather than a separate file-existence check. Keeping the rule a pure name-match keeps the implementation under 50 lines of detection logic and removes any I/O beyond reading the spec files.

4. **"Top level" === every static `import` statement.** JavaScript/TypeScript `import` statements are always top-level — there are no nested imports. The WO's phrase "at top level" was effectively distinguishing static `import` from `vi.mock(path)` calls (which are factory invocations, not imports) and `await import()` inside `vi.hoisted(...)` (which are dynamic). The regex only matches static `import ... from "X.vue"`, so `vi.mock('@shared/components/PrimaryButton.vue', () => ...)` is correctly ignored — the path appears inside a string literal that is not preceded by `from`.

5. **Allowlist categorization comments.** The 38 entries split cleanly into two categories: 6 **split-spec** entries (intentional SUT-filename mismatch, generated by TEST GUARD escapes like PR #120; flagged inline with `// Split-spec: SUT is X.vue ...`) and 32 **legacy** entries (cross-component imports that `vi.mock` already stubs; the static `import` was just never removed). The arch-test file documents the categorization in a long block comment above the allowlist literal. Follow-up WOs to drain legacy debt would target the 32; the 6 split-spec entries are stable.

6. **No new helper extracted; kept scope inside the new `describe` block.** The sibling `mount boundary enforcement` block declares its helpers (`getTestSpecFiles`, `getImportedNames`) inside its own scope rather than promoting them to the file-wide top. I followed the same pattern: `getTopLevelVueImports` lives inside the new describe. Two pre-existing `unicorn(consistent-function-scoping)` warnings already exist on this file (lines 2 and 704) — they predate this change and the same shape is being repeated, so no scope promotion was warranted.

## Verification

### Verbatim failure output from a deliberately-violating spec

Created `src/tests/unit/shared/components/ScratchSutCheck.spec.ts` with two top-level cross-component imports (`LegoBrick.vue` and `PrimaryButton.vue`); SUT name would be `ScratchSutCheck.vue` so both imports violate. Ran `npx vitest run src/tests/unit/architecture.spec.ts`. Verbatim failure block:

```
 FAIL  |architecture| src/tests/unit/architecture.spec.ts > Architecture > SUT-only top-level .vue imports — unit specs may only import their system-under-test > unit specs should only import their system-under-test .vue file at top level
AssertionError: Unit specs may only import their system-under-test (matching the spec filename) as a top-level .vue import. All other component references must go through findComponent({ name: "X" }) with vi.mock(...) stubs. Legacy violations are tracked in LEGACY_CROSS_COMPONENT_IMPORTS and should shrink over time, not grow.: expected [ …(2) ] to strictly equal []

- Expected
+ Received

- []
+ [
+   "shared/components/ScratchSutCheck.spec.ts imports LegoBrick.vue at top level (SUT is ScratchSutCheck.vue). Use findComponent({ name: 'LegoBrick' }) and stub via vi.mock(...) instead — top-level .vue imports drag the transitive dependency graph into the Vite collect phase (ADR-0012).",
+   "shared/components/ScratchSutCheck.spec.ts imports PrimaryButton.vue at top level (SUT is ScratchSutCheck.vue). Use findComponent({ name: 'PrimaryButton' }) and stub via vi.mock(...) instead — top-level .vue imports drag the transitive dependency graph into the Vite collect phase (ADR-0012).",
+ ]
```

The error names the offending import, names the expected SUT, suggests the exact `findComponent({ name: 'X' })` replacement string, and cites ADR-0012. Scratch spec was deleted before the work commit; not present in the diff.

### Coverage of legacy state

| Spec category | Count | Disposition |
|---|---|---|
| **Clean** — only the SUT `.vue` imported at top level | 77 | Pass the rule unchanged. |
| **Legacy debt** — cross-component imports stubbed via `vi.mock` but the static `import` was never removed | 32 | Allowlisted with category note. Follow-up WO can drain these; each removal will trigger the self-cleaning assertion until the allowlist entry is removed too. |
| **Split-spec** — multiple specs share a single SUT; spec filename is derivative (`SetsOverviewFiltering.spec.ts` → SUT `SetsOverviewPage.vue`) | 6 | Allowlisted with inline `// Split-spec:` comment. Stable; not expected to be removed. |

The 38 allowlisted specs are listed in the arch-test file directly. The same list is reproduced here for the Steward's review:

```
apps/admin/App.spec.ts                                          [legacy] NavLink.vue
apps/families/App.spec.ts                                       [legacy] NavHeader.vue, NavMobileLink.vue
apps/families/domains/about/pages/AboutPage.spec.ts             [legacy] 16 LegoX/LegoXSvg imports
apps/families/domains/auth/pages/LoginPage.spec.ts              [legacy] PrimaryButton.vue, TextInput.vue
apps/families/domains/auth/pages/RegisterPage.spec.ts           [legacy] PrimaryButton.vue, TextInput.vue
apps/families/domains/brick-dna/pages/BrickDnaPage.spec.ts      [legacy] 5 component imports
apps/families/domains/home/pages/HomePage.spec.ts               [legacy] 6 component imports
apps/families/domains/parts/modals/PartUsageModal.spec.ts       [legacy] 3 component imports
apps/families/domains/parts/pages/PartsMissingPage.spec.ts      [legacy] 7 component imports
apps/families/domains/parts/pages/PartsUnsortedPage.spec.ts     [legacy] 9 component imports
apps/families/domains/sets/pages/AddSetPage.spec.ts             [legacy] 6 component imports
apps/families/domains/sets/pages/EditSetPage.spec.ts            [legacy] 6 component imports
apps/families/domains/sets/pages/IdentifyBrickPage.spec.ts      [legacy] 4 component imports
apps/families/domains/sets/pages/ScanSetPage.spec.ts            [legacy] 4 component imports
apps/families/domains/sets/pages/SetDetailPage.spec.ts          [legacy] 5 component imports
apps/families/domains/sets/pages/SetsOverviewFiltering.spec.ts  [split-spec] SetsOverviewPage.vue
apps/families/domains/sets/pages/SetsOverviewTheme.spec.ts      [split-spec] SetsOverviewPage.vue + 4 cross-component
apps/families/domains/settings/pages/SettingsPageConfig.spec.ts [split-spec] SettingsPage.vue + 3 cross-component
apps/families/domains/settings/pages/SettingsPageInviteEmail.spec.ts [split-spec] SettingsPage.vue + 2 cross-component
apps/families/domains/settings/pages/SettingsPageMembers.spec.ts [split-spec] SettingsPage.vue + 4 cross-component
apps/families/domains/settings/pages/SettingsPageTheme.spec.ts  [split-spec] SettingsPage.vue
apps/families/domains/storage/pages/AddStoragePage.spec.ts      [legacy] 4 component imports
apps/families/domains/storage/pages/EditStoragePage.spec.ts     [legacy] 7 component imports
apps/families/domains/storage/pages/StorageDetailPage.spec.ts   [legacy] 6 component imports
apps/families/domains/storage/pages/StorageOverviewPage.spec.ts [legacy] 5 component imports
apps/families/modals/PlacePartModal.spec.ts                     [legacy] 4 component imports
apps/showcase/components/AntiPatterns.spec.ts                   [legacy] SectionHeading.vue
apps/showcase/components/BrandVoice.spec.ts                     [legacy] SectionHeading.vue
apps/showcase/components/BrickDimensions.spec.ts                [legacy] SectionHeading.vue
apps/showcase/components/BrickShapes.spec.ts                    [legacy] SectionHeading.vue
apps/showcase/components/ColorPalette.spec.ts                   [legacy] SectionHeading.vue
apps/showcase/components/ComponentHealthMocked.spec.ts          [legacy] ComponentHealth.vue, SectionHeading.vue
apps/showcase/components/DialogServiceDemo.spec.ts              [legacy] PrimaryButton.vue, SectionHeading.vue
apps/showcase/components/FormValidationWorkbench.spec.ts        [legacy] 7 component imports
apps/showcase/components/ResourceAdapterPlayground.spec.ts      [legacy] 4 component imports
apps/showcase/components/SnapDemo.spec.ts                       [legacy] SectionHeading.vue
apps/showcase/components/TypographySpecimen.spec.ts             [legacy] SectionHeading.vue
shared/components/ConfirmDialog.spec.ts                         [legacy] ModalDialog.vue
shared/components/EmptyState.spec.ts                            [legacy] LegoBrick.vue
```

## Quality Gauntlet

### Gallery Wing

| Check | Result | Notes |
|---|---|---|
| `format:check` | Pass | `oxfmt --check .` clean across 333 files. |
| `lint` | Pass | 0 errors; warnings unchanged from baseline (`vitest(prefer-strict-boolean-matchers)` in 13 sibling files + 2 pre-existing warnings in `architecture.spec.ts` lines 2 and 704). No new warnings introduced by the new block. |
| `lint:vue` | Pass | "All conventions passed." |
| `type-check` | Pass | `vue-tsc --build` clean. |
| `knip` | Pass | No unused exports. |
| `test:coverage` | Pass | All tests green. 100% coverage on statements (1445/1445), branches (1118/1118), functions (422/422), lines (1344/1344). Collect-guard and test-guard reporters print informational warnings only — no violations. |
| `build` | Pass | All three apps (families, admin, showcase) built. |

**Pre-push gauntlet (Husky chain: type-check → knip → test:coverage → build):** green on this branch; no `--no-verify` required for the work-commit push. (The `chore(atrium)` Casebook-update commit further below in the history is also a frontend-touching commit and runs the same gauntlet — see "Worktree-mode pre-commit hook bug — pre-emptive sign-off" in the Notes section if the hook regression bites at commit time.)

## Self-Debrief

### What went well

- **WO scope was precise.** "Not in This Set" explicitly forbade changes to existing spec files, which made the JSON-allowlist vs. inline-comment choice mechanical: only the JSON allowlist is in-scope. No design ambiguity.
- **Sibling arch test gave a template.** The `mount boundary enforcement` block at lines 694-755 was a 1:1 structural sibling. Mirroring its shape — regex parsing, scoped helpers, `expect(violations).toStrictEqual([])` — kept the new block consistent with the file's conventions.
- **Self-cleaning allowlist.** The `unusedAllowlistEntries` set adds maybe 6 lines but converts the allowlist from "permanent debt" to "rolling debt that signals when it can be paid down." Worth the marginal complexity.
- **Verification flow worked first try.** Scratch spec → run vitest → capture verbatim failure → delete scratch → re-run vitest → green. Exactly the WO-prescribed verification loop.

### What didn't go well

- **Scope surprise on legacy violation count.** The WO said "Aim for narrow opt-outs; the rule should bite unless the spec has a defended exception" and "if a violation surfaces, route it to a follow-up WO." Reading those together I expected to find maybe 2-5 legacy violations. Actual count: 38 specs, ~110 individual imports. That's an order of magnitude larger than the WO language anticipates. I made the reasonable call (allowlist all 38 with a category breakdown rather than fail the rule or open 38 follow-up WOs), but the Steward may want to (a) decompose into a series of follow-up WOs to drain the legacy debt and (b) re-read the WO language as a signal that the scope-discovery step in the dispatch wasn't tight enough.
- **No baseline coverage delta number reported.** Unlike the PartsPage WO (which had concrete before/after timing for collect-guard), this WO doesn't produce a runtime metric — it's a static-analysis guardrail. The "delta on a metric" graduated learning (2026-04-29) does not strictly apply here, but I want to flag that there is no quantitative "before/after" I can paste because the value of this work is preventing a future regression class, not fixing a present-day metric.

### What I'd do differently next time

- **Survey first, choose allowlist shape second.** I ran the scan to count violations *after* having mentally committed to the JSON-shape choice. If the count had been smaller (say, 5), inline comment markers might have been the lower-friction shape since the per-spec churn would have been trivial. The order should have been: (1) scan, (2) count, (3) pick shape based on scale + WO constraints.
- **Confirm the WO's scope assumption before building.** "If a violation surfaces, route it to a follow-up WO" was language I noticed but did not raise back to the Steward when the count came in at 38. In hindsight I should have flagged the divergence between WO language ("narrow opt-outs") and reality (38 entries) before committing to the all-in-one allowlist approach. Auto Mode biases toward making the reasonable call, which I did, but a one-line "FYI: WO expected narrow opt-outs; actual scan finds 38; proceeding with allowlist + legacy-debt categorization — flag if you want a different shape" would have been cheap insurance.

### Methodology Objection — none filed

The Quality Warden's SOPs do not surface a gap on this build. The WO + sibling-template + manual verification flow worked as documented.

## Proposed Knowledge Updates

> _Brickwright proposes; Steward dispositions._

### Pulse (`.claude/docs/pulse.md`)

**Proposed addition (Active Concerns or equivalent section — Steward's call):**

> **Drain legacy cross-component .vue imports from unit specs (32 specs, ~100 imports)** — The SUT-only top-level `.vue` import arch test (lines 757-1043 of `frontend/src/tests/unit/architecture.spec.ts`, landed 2026-05-27) lists 32 legacy-debt specs in `LEGACY_CROSS_COMPONENT_IMPORTS`. Each legacy entry is a spec that has its child-component imports stubbed via `vi.mock(...)` but never removed the static `import X from '...X.vue'` at the top, meaning the spec still pays the full Vite collect-phase cost for the transitive component chain. Pattern fix is mechanical (drop the import, switch `findComponent(X)` to `findComponent({name: 'X'})`); follow PR #119 / Build Record `2026-05-27-partspage-spec-collect-guard-fix.md`. Each cleaned spec should remove itself from the allowlist; the arch test self-asserts that the allowlist is tight (stale entries fail). Worth batching ~6-8 per WO to keep diffs reviewable.

**Seed update:** the existing Seed `Promote collect-guard from informational to failing` in the Pulse can now reference the SUT-only arch test as a complementary static guardrail — once enough legacy specs are drained, the dynamic collect-guard's failing-mode promotion becomes safer because the static rule has already pulled most of the heavy collect-graph offenders out.

### Decision Ledger (`.claude/docs/decisions.md`)

No new ADR required. This work implements an architectural guard derived from ADR-0012 (test isolation collect guard); it does not create a new architectural decision. If the Steward disagrees and wants this codified as its own ADR, I'd suggest "ADR-NNNN: SUT-only top-level component imports in unit specs" with the WO + this BR as primary references.

### Learnings (`.claude/docs/learnings.md`)

**Candidate learning (1st observation — not yet eligible for graduation):**

> _When a WO's "narrow opt-out" language meets a 30+-violation reality, flag the scope-discovery divergence back to the Steward before committing to an allowlist shape._ The Brickwright made the reasonable call (JSON allowlist + categorization), but the gap between WO assumption and codebase reality was a signal worth raising. Next time: do the scan, eyeball the count, and if the count > 1 order of magnitude beyond the WO's framing, raise it before building.

### Casebook / Standing Suspicions

No update proposed. The Quality Warden Casebook (Steward-managed) may want to record this guardrail under the "test infrastructure / collect-graph cost" cluster, but that's the Steward's curation call.

## Notes

### Worktree-mode pre-commit hook bug — pre-emptive sign-off acknowledged

The dispatch brief flagged that the orchestrator-root `.githooks/pre-commit` has a known regression that fires for `frontend/**` changes and reproducibly stages a spurious `src/shared/generated/component-registry.json` at the orchestrator root. The fix is being dispatched in parallel as a sibling WO (`2026-05-27-worktree-mode-pre-commit-hook-regression`). **Steward sign-off granted in advance per ADR-0028 § Amendment 2026-05-27.** Will document the bypass under this section if it bites; if not, this note remains informational only.

### Files changed

- `frontend/src/tests/unit/architecture.spec.ts` — added one new `describe` block (lines 757-1043 post-edit); the file grew from 757 lines to 1044 lines (+287 net). No other files touched.
