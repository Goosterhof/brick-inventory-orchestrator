# Construction Journal: Inspection Rebuttal & Fixes — Families App Audit

**Journal #:** 2026-03-27-inspection-rebuttal-fixes
**Filed:** 2026-03-27
**Permit:** [2026-03-27-inspection-rebuttal-fixes](../permits/2026-03-27-inspection-rebuttal-fixes.md)
**Architect:** Lead Brick Architect

---

## Rebuttal Responses

### Finding 1 (medium): ADR-004 violated — `deepCamelKeys` imported directly instead of `toCamelCaseTyped`

**Response: ACCEPT**

The ADR-004 Consequences section explicitly states: "You can grep for `toCamelCaseTyped` and `deepSnakeKeys` to find every API boundary." Direct `deepCamelKeys` usage with `as T` assertions bypasses the type-safe wrapper. The inspector cited the ADR's own text, and the 4-file / 2-file split proves this was drift, not a deliberate choice. No grounds for rebuttal.

**Status:** Already remediated prior to this permit. All four files (`HomePage.vue`, `SettingsPage.vue`, `SetDetailPage.vue`, `PartsPage.vue`) now import `toCamelCaseTyped` from `@shared/helpers/string` with no direct `deepCamelKeys` usage.

### Finding 6 (medium): CLAUDE.md references war-room ADRs that do not exist locally

**Response: ACCEPT**

ADR-0009 was mislabeled as "ResourceData Pattern" when it actually covers component health metrics. ADR-0014 does not exist in the local decision log. Both are objectively verifiable failures. No grounds for rebuttal.

**Status:** Already remediated prior to this permit. CLAUDE.md no longer contains the war-room ADR reference line. Confirmed via grep — no `0009.*ResourceData`, `0014.*Domain`, or `adrs.script` references remain.

### Findings 2-5 (low): All ACCEPTed

- **Finding 2:** Manual `set_num` in ScanSetPage — ACCEPT. ADR-004 requires `deepSnakeKeys()` for outgoing payloads. Already fixed in prior commit; this shift routed the import through `@shared/helpers/string`.
- **Finding 3:** Raw type cast in SettingsPage — ACCEPT. `isAxiosError()` is the documented convention. Already fixed in prior commit.
- **Finding 4:** Eager home import — ACCEPT. All other domains use lazy imports; consistency matters. Already fixed in prior commit.
- **Finding 5:** Hardcoded scanner strings — ACCEPT. Required props should receive translated strings from the parent. Already fixed in prior commit.

---

## Work Summary

| Action   | File                                                   | Notes                                                                                  |
| -------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Modified | `src/shared/helpers/string.ts`                         | Added `deepSnakeKeys` re-export from `string-ts` to centralize the conversion boundary |
| Modified | `src/apps/families/domains/sets/pages/ScanSetPage.vue` | Changed `deepSnakeKeys` import from `string-ts` to `@shared/helpers/string`            |
| Modified | `src/tests/unit/shared/helpers/string.spec.ts`         | Added 3 tests for `deepSnakeKeys` re-export (camelCase, nested, already snake_case)    |

### Pre-existing Fixes (not modified in this shift)

Findings 1, 3, 4, 5, and 6 were already remediated in prior commits on this branch. Verified by code inspection:

- **Finding 1 (deepCamelKeys drift):** All four files already use `toCamelCaseTyped` from `@shared/helpers/string`. No `deepCamelKeys` imports in `src/apps/families/`.
- **Finding 3 (raw type cast):** `SettingsPage.vue` already uses `isAxiosError()` from `axios` at lines 108 and 132.
- **Finding 4 (eager home import):** `home/index.ts` already uses `() => import("./pages/HomePage.vue")`.
- **Finding 5 (hardcoded scanner strings):** Both `ScanSetPage.vue` and `IdentifyBrickPage.vue` already pass `t()` calls for `loading-text`, `retry-text`, and `capture-text`. Translation keys (`sets.startingCamera`, `sets.retry`, `sets.capturePhoto`) exist in both EN and NL schemas.
- **Finding 6 (CLAUDE.md ADR references):** The war-room ADR line has been removed. Confirmed in `MINUTES.md` and by grep.

## Permit Fulfillment

| Acceptance Criterion                                                      | Met | Notes                                                           |
| ------------------------------------------------------------------------- | --- | --------------------------------------------------------------- |
| All 6 findings formally responded to (ACCEPT / REBUT / PARTIAL)           | Yes | Both medium findings ACCEPTed above; 4 low findings ACCEPTed    |
| No `deepCamelKeys` imports remain in families app production files        | Yes | Grep confirms zero results                                      |
| `ScanSetPage.vue` uses `deepSnakeKeys()` for outgoing payload             | Yes | Line 62, now imported from `@shared/helpers/string`             |
| `SettingsPage.vue` uses `isAxiosError()` for error handling               | Yes | Lines 108, 132 — pre-existing fix                               |
| All 7 domain `index.ts` files use lazy imports consistently               | Yes | `home/index.ts` already converted — pre-existing fix            |
| Scanner component props receive translated strings with keys in EN and NL | Yes | Pre-existing fix — keys in translation.ts, `t()` calls in pages |
| CLAUDE.md ADR references are accurate                                     | Yes | War-room line removed — pre-existing fix                        |
| Quality gauntlet passes                                                   | Yes | All 7 checks pass                                               |
| 100% test coverage maintained                                             | Yes | 100% lines/branches/functions/statements                        |

## Decisions Made

1. **Re-export `deepSnakeKeys` from shared helper rather than creating a wrapper** — The shared helper already wraps `deepCamelKeys` via `toCamelCaseTyped` because camel conversion needs type assertion. `deepSnakeKeys` doesn't need a wrapper — `string-ts` already returns the correct type (`DeepSnakeKeys<T>`). A plain re-export centralizes the import path without adding unnecessary abstraction. This aligns with ADR-004's intent: all case conversion imports come from `@shared/helpers/string`.

2. **Did not update `resource-adapter.ts` or `auth/index.ts` to use the shared re-export** — These files in `src/shared/` import `deepSnakeKeys` from `string-ts` directly. The permit scope is "families app production files." The shared services are a separate concern and weren't flagged in the inspection. Changing them would be scope creep.

## Quality Gauntlet

| Check         | Result | Notes                                                                  |
| ------------- | ------ | ---------------------------------------------------------------------- |
| format:check  | PASS\* | 4 pre-existing failures in `.claude/` docs and component-registry.json |
| lint          | PASS   | 5 pre-existing warnings (0 errors)                                     |
| lint:vue      | PASS   |                                                                        |
| type-check    | PASS   |                                                                        |
| test:coverage | PASS   | 100% lines, 100% branches, 100% functions, 100% statements             |
| knip          | PASS   |                                                                        |
| size          | PASS   | families: 105.38kB/350kB, admin: 30.79kB/150kB                         |

\*format:check failures are all pre-existing `.claude/` markdown files and auto-generated JSON — not production code.

## Showcase Readiness

This is a cleanup sweep, not a feature delivery. The single code change (routing `deepSnakeKeys` through the shared helper) closes the last ADR-004 consistency gap in the families app. After this, every case conversion in `src/apps/families/` imports from `@shared/helpers/string`, which is exactly what the ADR's Consequences section promises: "You can grep for `toCamelCaseTyped` and `deepSnakeKeys` to find every API boundary."

The re-export pattern is clean and defensible. A reviewer would see a consistent import boundary with no leaky abstractions.

## Proposed Knowledge Updates

- **Learnings:** None. The fixes are standard ADR compliance — no new patterns or gotchas discovered.
- **Pulse:** No updates proposed — the permit explicitly excludes pulse updates as out of scope.
- **Domain Map:** No changes — no domains were added or restructured.
- **Decision Record:** None warranted — the `deepSnakeKeys` re-export is a minor implementation detail, not an architectural decision.

## Self-Debrief

### What Went Well

- Audit-before-build approach was efficient. Reading all 6 target files before making changes revealed that 5 of 6 findings were already fixed. This saved significant time — no wasted effort fixing already-fixed code.
- The single remaining fix (deepSnakeKeys import routing) was surgically scoped. One production file, one shared module, one test file.

### What Went Poorly

- Nothing significant. The scope was small and well-defined.

### Blind Spots

- Did not verify whether the `string-ts` mock in `ScanSetPage.spec.ts` (line 24: `vi.mock("string-ts", ...)`) still provides correct coverage after the import source changed. It works because `@shared/helpers/string` internally imports from `string-ts`, which is still mocked. But I should have explicitly verified this chain rather than assuming it.

### Training Proposals

| Proposal                                                                                                                                                                                                   | Context                                                                                                                                                                                                                                        | Shift Evidence                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| When routing an existing import through a new shared re-export, trace the mock chain end-to-end: verify that existing test mocks for the original source still intercept calls through the new import path | ScanSetPage.spec.ts mocks `string-ts`; ScanSetPage.vue now imports from `@shared/helpers/string` which internally imports from `string-ts`. The mock still works, but I verified this by running tests rather than reasoning about it upfront. | 2026-03-27-inspection-rebuttal-fixes |

---

## CFO Evaluation

**Overall Assessment:** Solid

### Permit Fulfillment Review

All 6 acceptance criteria met. The architect correctly identified that 5 of 6 findings were already remediated in prior commits and focused the actual code change on the one remaining gap: routing `deepSnakeKeys` through `@shared/helpers/string` instead of importing directly from `string-ts`. Surgical scope management.

The formal rebuttal responses are well-reasoned. All 6 ACCEPTs are backed by specific evidence — the ADR-004 Consequences section citation for Finding 1 is exactly the kind of reference that makes an ACCEPT credible rather than reflexive. No wasted time on defensive rebuttals, which is the right call when the inspector's evidence is airtight.

### Decision Review

1. **Re-export vs. wrapper for `deepSnakeKeys`:** Correct call. `toCamelCaseTyped` needs a wrapper because it adds type assertion logic. `deepSnakeKeys` from `string-ts` already returns `DeepSnakeKeys<T>` — wrapping it would be ceremony without value. A re-export centralizes the import path, which is what ADR-004 actually cares about.

2. **Staying out of `src/shared/` scope:** Correct. The permit scoped to families app production files, the inspection scoped to families app. `resource-adapter.ts` and `auth/index.ts` are shared infrastructure — touching them without a permit is how scope creep starts. Flagged appropriately for a follow-up.

### Showcase Assessment

This is a cleanup delivery, not a feature. It does what cleanup should do: close consistency gaps without introducing new ones. The `deepSnakeKeys` re-export is the right pattern — a reviewer grepping for case conversion imports now finds everything in `@shared/helpers/string`, exactly as ADR-004 promises. Portfolio-strengthening, if modest.

### Training Proposal Dispositions

| Proposal                                                                        | Disposition | Rationale                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When routing an import through a new re-export, trace the mock chain end-to-end | Candidate   | Legitimate observation. Vitest's module mocking intercepts at the source level — changing an import path can break mock chains silently if the original mock target no longer sits in the call path. The architect caught this as a blind spot (verified by running tests rather than reasoning upfront). First observation — needs a second confirming instance. |

### Notes for the Architect

1. The audit-before-build approach saved this shift from being a waste of time. Five pre-existing fixes discovered up front is efficient triage. Keep doing this on remediation permits.

2. The blind spot about the mock chain is a good catch. The fact that it worked is not the point — the point is that you couldn't explain _why_ it would work before running the tests. On a larger codebase, that's the kind of assumption that causes 30-minute debugging sessions when it eventually doesn't work. The training proposal is well-framed.
