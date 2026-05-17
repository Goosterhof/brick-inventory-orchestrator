# Inspection Report: Post-Merge Review — Parts ADR-004 Fix + Isometric SVG Formula Fix

**Report #:** 2026-04-23-post-merge-review
**Filed:** 2026-04-23
**Inspector:** CFO (static review — gauntlet unavailable, node_modules absent)
**Scope:** Targeted — PR #193 (snake_case drift fix) and PR #190 (isometric SVG viewBox fix)
**Pulse Version:** Assessed 2026-04-11
**Triggered By:** CEO request — review latest commits and document findings

---

## Quality Gauntlet Results

| Check         | Result  | Notes                            |
| ------------- | ------- | -------------------------------- |
| format:check  | Skipped | node_modules absent — cannot run |
| lint          | Skipped | node_modules absent — cannot run |
| lint:vue      | Skipped | node_modules absent — cannot run |
| type-check    | Skipped | node_modules absent — cannot run |
| test:coverage | Skipped | node_modules absent — cannot run |
| knip          | Skipped | node_modules absent — cannot run |
| size          | Skipped | node_modules absent — cannot run |

Static code review only. Gauntlet was green on the previous full inspection (2026-04-11).

---

## Changes Reviewed

### PR #193 — `fix(parts): resolve ADR-004 snake_case drift on CursorPaginatedParts` (merged 2026-04-21)

**Files changed:**

- `src/apps/families/types/part.ts` — renamed `CursorPaginatedParts` fields to camelCase
- `src/apps/families/domains/parts/pages/PartsPage.vue` — moved `toCamelCaseTyped` to envelope level
- `src/tests/unit/apps/families/domains/parts/pages/PartsPage.spec.ts` — fixture updated to camelCase
- `src/tests/integration/apps/families/domains/parts/pages/PartsMissingPage.spec.ts` — 2 new tests
- `.claude/docs/domain-map.md` — added `PartsMissingPage`, `/parts/missing`, and API endpoints

### PR #190 — `fix: correct studExtentTop viewBox formula in LegoBrickIsometricSvg` (merged 2026-04-21)

**Files changed:**

- `src/shared/components/LegoBrickIsometricSvg.vue` — formula corrected
- `src/tests/unit/shared/components/LegoBrickIsometricSvg.spec.ts` — height upper bound added

---

## Findings

### Architecture

1. **PR #193: ADR-004 fix is correct and complete** `severity: none (positive finding)`
    - **Location:** `src/apps/families/domains/parts/pages/PartsPage.vue:33` and `src/apps/families/types/part.ts:71-77`
    - **Standard:** ADR-004 — explicit case conversion at the HTTP boundary
    - **Observation:** The fix correctly moves `toCamelCaseTyped<CursorPaginatedParts>()` from per-item (on `envelope.data[]`) to the full envelope, matching the `PartsMissingPage` reference pattern. `CursorPaginatedParts` type now represents the post-conversion shape (camelCase fields), consistent with all other app types. `toCamelCaseTyped` from `@script-development/fs-helpers` performs a deep conversion — confirmed by cross-referencing `SetDetailPage.vue:103` which applies it to `SetWithParts` (which contains nested `parts: SetPart[]`) and accesses `p.isSpare` (camelCase) without per-item conversion.
    - **Recommendation:** No action needed.

2. **PR #193: Unit test fixture correctly represents post-conversion shape** `severity: none (positive finding)`
    - **Location:** `src/tests/unit/apps/families/domains/parts/pages/PartsPage.spec.ts:123-130` (`makeEnvelope`)
    - **Observation:** `makeEnvelope` now uses `nextCursor`, `prevCursor`, `perPage` (camelCase). This is correct because `toCamelCaseTyped` is mocked as an identity function in unit tests (`src/tests/helpers/mockStringTs.ts:20`). The fixture must match the post-conversion shape that the component will actually read. The integration test fixtures (`makeEntry` in `PartsMissingPage.spec.ts`) correctly retain snake_case because the real `toCamelCaseTyped` is used there.
    - **Recommendation:** No action needed.

3. **PR #190: Isometric SVG viewBox formula is correct** `severity: none (positive finding)`
    - **Location:** `src/shared/components/LegoBrickIsometricSvg.vue:78`
    - **Standard:** Mathematical correctness — `projectedExtents.minY` already reflects top face corners at z=BODY_HEIGHT
    - **Observation:** Old formula `−BODY_HEIGHT − STUD_HEIGHT + minY` double-counted BODY_HEIGHT. Given the projection function `sy = (x+y)*SIN30 − z`, at z=BODY_HEIGHT the top-face corner (0,0,BODY_HEIGHT) produces `sy = −BODY_HEIGHT = −48`. So `minY = −48`. Stud top at z=BODY_HEIGHT+STUD_HEIGHT has `sy = −58`. Correct viewBox top = `minY − STUD_HEIGHT = −58`. Old formula produced `−106`, creating ~48px invisible whitespace above the brick. Fix is verified correct.
    - **Recommendation:** No action needed.

### Tests

4. **PR #193: Two new integration tests plug L2 gaps on PartsMissingPage** `severity: none (positive finding)`
    - **Location:** `src/tests/integration/apps/families/domains/parts/pages/PartsMissingPage.spec.ts:134-179`
    - **Observation:** Search filtering and sort chip interaction were not covered at the integration layer. Both new tests are well-structured. The sort test uses optional chaining `nameChip?.find("button").trigger("click")` — this is functionally safe (if `nameChip` were undefined, the sort wouldn't change and the order assertion would fail), but an explicit `expect(nameChip).toBeDefined()` would clarify intent.
    - **Recommendation:** Low priority. If anyone edits this test, add the explicit `toBeDefined` guard for clarity.

5. **PR #190: Height upper bound tightens regression guard** `severity: none (positive finding)`
    - **Location:** `src/tests/unit/shared/components/LegoBrickIsometricSvg.spec.ts:154`
    - **Observation:** `expect(height).toBeLessThan(275)` means the formula error (which produced ~298px) cannot silently regress. The correct height (~250px) has ~25px of headroom before the assertion fails — appropriate tolerance for floating-point projection arithmetic.
    - **Recommendation:** No action needed.

### Documentation

6. **Prior finding resolved: `auth/index.ts` ADR-004 violation** `severity: none (resolved)`
    - **Location:** `src/shared/services/auth/index.ts:2,6`
    - **Standard:** ADR-004 — import `deepSnakeKeys` and `toCamelCaseTyped` from `@shared/helpers/string`, not directly from `string-ts` or `@script-development/fs-helpers`
    - **Observation:** The April 11 inspection (finding #1) flagged direct `string-ts` imports in `auth/index.ts`. The file now correctly imports `{deepSnakeKeys, toCamelCaseTyped}` from `@shared/helpers/string` and `{DeepSnakeKeys}` type from `@shared/helpers/string`. Finding is closed.
    - **Recommendation:** No action needed.

7. **Pulse — "In-Progress Work" and "Pattern Maturity" sections stale** `severity: low`
    - **Location:** `.claude/docs/pulse.md`
    - **Standard:** Pulse sections carry an `Assessed:` date and should reflect current state after major deliveries
    - **Observation:** "In-Progress Work" is assessed 2026-03-29 (7+ weeks stale). "Pattern Maturity" assessed the same date. Deliveries since then include: 3D brick components (CSS cuboid + SVG isometric), master shopping list, mobile-friendly playground, and the ADR-004 fix. None are reflected in Pattern Maturity. The 3D brick component library (two new techniques) and the parts ADR-004 fix being tracked through the inspector cycle are both new maturity signals.
    - **Recommendation:** CFO to update Pulse: (1) clear "In-Progress Work" stale entries; (2) add 3D brick rendering (CSS cuboid + SVG isometric) to Pattern Maturity as "Proven — single use in showcase" or similar; (3) update assessed dates.

8. **Seeds: Inspector Memory File trigger crossed 3 inspections ago** `severity: low`
    - **Location:** `.claude/docs/pulse.md` (Seeds section)
    - **Standard:** Seeds should be promoted when their trigger condition is met
    - **Observation:** The Inspector Memory File seed reads "Trigger: After 3+ inspector missions (currently at 2)." This is the 6th inspection report. The trigger was crossed after the 3rd mission (approximately `2026-03-29-post-delivery-audit.md`). The seed has been dormant for 3 missions past its trigger.
    - **Recommendation:** CFO to decision: promote the Inspector Memory File seed to active work (create a persistent assessment tracking file for the Building Inspector), or formally close it with rationale for deferral. Leaving it in "Seeds" past its trigger date creates false status.

---

## Doc Drift

| Document           | Accurate | Drift Found                                                                                                       |
| ------------------ | -------- | ----------------------------------------------------------------------------------------------------------------- |
| Domain Map         | Yes      | Correctly updated in PR #193: `/parts/missing` route and API endpoints                                            |
| Component Registry | Partial  | Churn counts updated (LegoBrickIsometricSvg, LegoBrick3dCss) — adequate                                           |
| Pulse              | Partial  | Overall Health and Active Concerns current (2026-04-11); Pattern Maturity and In-Progress Work stale (2026-03-29) |
| CLAUDE.md          | Yes      | No drift detected                                                                                                 |

## Proposed Pulse Updates

1. **In-Progress Work** — Update `Assessed:` date to 2026-04-23, clear stale "(none)" row, confirm no active items.
2. **Pattern Maturity** — Update `Assessed:` date; add row for "3D brick rendering (CSS cuboid + SVG isometric)" at "Proven — single showcase use"; add row for "Cursor pagination with ADR-004 alignment" at "Established — one domain page pair."
3. **Seeds** — Decision on Inspector Memory File (promote or close with rationale).

---

## Summary

**Overall Health:** 9/10 (unchanged from April 11 — no regression signals)
**Findings:** 8 total (0 high, 0 medium, 2 low, 6 positive confirmations)
**Showcase Readiness:** Portfolio-ready
**Recommendation:** Targeted fixes — Pulse staleness and dormant seed are housekeeping items, not quality risks. Code changes reviewed are correct and well-tested.

---

## Self-Debrief

### What I Caught

- Confirmed `toCamelCaseTyped` is a deep converter by cross-referencing `SetDetailPage.vue` pattern — key to validating the PR #193 fix without running tests
- Caught the Seeds trigger miss (Inspector Memory File at 6 inspections, trigger was 3)
- Verified prior finding (#1 from April 11) is resolved — good pipeline closure

### What I Missed

- Could not run the quality gauntlet (node_modules absent). Static review cannot substitute for a green test run. The next session that installs node_modules should run the full gauntlet to confirm.

### Methodology Gaps

- Static review without gauntlet execution is inherently lower confidence. For a post-merge audit, the gauntlet should run. Node version and module installation should be part of session startup — this is already flagged in the startup hook but wasn't resolved before this review.

### Training Proposals

| Proposal                                                                  | Context                                                                    | Report Evidence              |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------- |
| Add Seeds staleness check to inspection SOP (check trigger dates)         | Seeds table had a triggered-but-unacted seed for 3 missions                | 2026-04-23-post-merge-review |
| Require `expect(element).toBeDefined()` before optional-chaining in tests | Sort test uses `nameChip?.find()` — intent would be clearer with assertion | 2026-04-23-post-merge-review |

---

## CFO Evaluation

_To be appended._
