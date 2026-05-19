# Construction Journal: `/family-sets/missing-parts` Payload Shape Repair

**Journal #:** 2026-04-30-family-sets-missing-parts-payload-shape
**Filed:** 2026-04-30
**Permit:** `2026-04-30-family-sets-missing-parts-payload-shape.md`
**Architect:** Medic (war-room soldier executing the Plate's pipeline)

---

## Work Summary

| Action   | File                                                                               | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modified | `src/apps/families/types/part.ts`                                                  | `MasterShoppingListResponse.entries` → `shortfalls`; `unknownFamilySetIds: number[]` → `string[]`. `MasterShoppingListEntry` shape rewritten to match backend Resource: dropped `partId`, `brickLinkColorId`; renamed `colorRgb` → `colorHex`; renamed `neededByFamilySetIds: number[]` → `neededBySetNums: string[]`; tightened `colorName`/`colorHex` to non-nullable. JSDoc anchors the contract to the backend file paths.                  |
| Modified | `src/apps/families/domains/parts/pages/PartsMissingPage.vue`                       | `payload.entries` → `payload.shortfalls`; `unknownFamilySetIds` retyped `string[]`; `affectedSetCount` switched from numeric Set to string Set keyed by set*num; PartListItem `:key` rebuilt as `${partNum}*${colorId}`; `:color-rgb`binds`entry.colorHex`; template title/count read `neededBySetNums`; CSV export uses `colorName`directly (non-nullable now); BrickLink export hardcodes`brickLinkColorId: null` per existing helper CAVEAT. |
| Modified | `src/tests/integration/apps/families/domains/parts/pages/PartsMissingPage.spec.ts` | Module-level `makeEntry`/`makePayload` fixtures rewritten to match real backend shape (snake_case at the wire, `needed_by_set_nums: string[]`, `unknown_family_set_ids: string[]`). Stale `part_id` overrides removed. New `describe('real backend contract', ...)` block added with 4 regression-guard tests asserting page mounts, summary count, unknown-sets callout (string ids), and unknown-only edge case.                              |
| Modified | `src/tests/unit/apps/families/domains/parts/pages/PartsMissingPage.spec.ts`        | `makeEntry`/`makePayload` rewritten to camelCased post-`toCamelCaseTyped` shape (string-ts is mocked as identity in unit harness). Stale `colorName: null` and `neededByFamilySetIds: number[]` overrides updated. Color-sort test rewritten for non-nullable `colorName: ''` defensive case. BrickLink-export test asserts hardcoded `brickLinkColorId: null` per page logic.                                                                  |
| Created  | `.claude/records/permits/2026-04-30-family-sets-missing-parts-payload-shape.md`    | Permit (this work).                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Created  | `.claude/records/journals/2026-04-30-family-sets-missing-parts-payload-shape.md`   | This journal.                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Permit Fulfillment

| Acceptance Criterion                                                                      | Met | Notes                                                                                                                                                             |
| ----------------------------------------------------------------------------------------- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page renders without TypeError on real backend payload                                    | Yes | Pre-fix: 4 new integration tests fail with `TypeError: Cannot read properties of undefined (reading 'length')` at `PartsMissingPage.vue:178`. Post-fix: 4/4 pass. |
| Integration spec contains failing-pre-fix / passing-post-fix backend-contract guard tests | Yes | New `describe('real backend contract', ...)` block. Captured failure signatures in execution report.                                                              |
| `npm run lint` clean                                                                      | Yes | 0 warnings, 0 errors.                                                                                                                                             |
| `npm run type-check` clean                                                                | Yes | `vue-tsc --build` exits 0.                                                                                                                                        |
| `PartsMissingPage.spec.ts` unit pass                                                      | Yes | 24/24.                                                                                                                                                            |
| `PartsMissingPage.spec.ts` integration pass                                               | Yes | 13/13 (was 9; +4 backend-contract guards).                                                                                                                        |
| `npm run build` produces clean dist                                                       | Yes | All 3 apps build (families / admin / showcase).                                                                                                                   |
| No other consumer of `/family-sets/missing-parts` or `MasterShoppingList*` types          | Yes | Cross-territory grep clean — only PartsMissingPage and its test specs.                                                                                            |

## Decisions Made

1. **`brickLinkColorId` not removed from the shared `bricklinkWantedList.ts` helper signature** — Chose to keep the helper's `brickLinkColorId?: number | null` field and have the page hardcode `null` at call site, rather than dropping it from the helper. The helper file's CAVEAT block (lines 74-84) explicitly documents the future Rebrickable→BrickLink mapping; the field is forward-compatible scaffolding, not phantom. The phantom field was the page's _consumption_ of it from a backend payload that never sends it. Helper unchanged means the helper's 7 unit tests keep covering future use.

2. **Page's `:color-rgb` prop binding switched to `entry.colorHex`** — Backend ships `color_hex` aliased from `colors.rgb`. The PartListItem component's prop is named `color-rgb` (existing API). Rather than rename the component prop, the binding `:color-rgb="entry.colorHex"` carries the same hex value across the boundary with verbatim component contract.

3. **`affectedSetCount` semantics shifted from "distinct family_set ids" to "distinct LEGO set numbers"** — Pre-fix, the page counted `neededByFamilySetIds` as numeric tenant-scoped ids. Post-fix, the backend ships `needed_by_set_nums` as canonical LEGO catalog set numbers (e.g. `"75313-1"`). The user-facing summary "X parts needed across Y sets" reads more honestly with set numbers — same set across two FamilySet rows now correctly counts as one set. Test updated to assert this stronger semantic.

4. **`colorName` typed non-nullable** — Backend Resource declares `color_name: string` (non-nullable). The pre-fix type was `string | null` defensively. Tightening matches the backend authority. Defensive empty-string handling preserved in CSV export test for graceful degradation.

5. **`partId` dropped, `:key` rebuilt as `${partNum}_${colorId}`** — Backend doesn't ship a numeric row id; shortfall keys are the natural composite `(part_num, color_id)` per the Q2 GROUP BY in `GetFamilyMissingPartsAction`. The composite is unique by construction.

## Quality Gauntlet

| Check                        | Result | Notes                                                                                                                                                                                                                                               |
| ---------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format:check (changed files) | Pass   | All 4 changed code files clean (auto-formatted unit spec). 1 unrelated baseline drift in inspection-report markdown — out of scope.                                                                                                                 |
| lint                         | Pass   | 0 warnings, 0 errors.                                                                                                                                                                                                                               |
| type-check                   | Pass   | `vue-tsc --build` clean.                                                                                                                                                                                                                            |
| test:unit (full suite)       | Pass   | 1294/1294 — identical to baseline. Test-guard threshold warning on 2 unrelated specs (SetsOverviewPage / ComponentGallery) is pre-existing.                                                                                                         |
| test:integration (full)      | Pass\* | 120/126 — 4 new tests added + all parts-domain pass. \*6 pre-existing failures across BrickDnaPage / HomePage / StorageOverviewPage are baseline drift outside this permit (see briefing M2 active concerns). Verified by `git stash` baseline run. |
| knip                         | Pass   | No new dead code.                                                                                                                                                                                                                                   |
| build                        | Pass   | All 3 apps built clean.                                                                                                                                                                                                                             |

## Showcase Readiness

The fix is forward-compatible: when the Rebrickable→BrickLink color mapping eventually ships on the backend, the consumer can swap the hardcoded `null` for the real field with a single-line change, and the helper stays unchanged. Type definitions now anchor JSDoc back to specific backend file paths, which is a pattern senior reviewers look for: explicit, traceable contracts at the boundary, not speculative shapes. Tests are paired (unit + integration) and the integration block explicitly captures the production failure mode, so a future regression to the phantom contract would fail loudly at CI.

## Proposed Knowledge Updates

- **Learnings:** Frontend types should anchor to a specific backend Resource/Action file path in JSDoc, not just describe shape in prose. The `MasterShoppingListEntry` JSDoc now does this. Suggest as a Plate-side pattern.
- **Pulse:** This journal closes the M3 Liaison Critical mismatch on `/family-sets/missing-parts`. Plate-side pulse should reflect the resolution.
- **Domain Map:** No domain changes.
- **Component Registry:** No new components — auto-generated, no action needed.
- **Decision Record:** Not ADR-worthy on its own. The "anchor frontend types to backend file paths" pattern could be a Plate-level convention if observed again.

## Self-Debrief

### What Went Well

- Read the backend Resource + Action **before** applying any rename, exactly as the war-room order's "trust-but-verify" instruction required. The Liaison report's diagnosis was correct down to the `(string)` cast on line 178 of the Action — the cast that produces `unknown_family_set_ids: list<string>` rather than `list<int>`.
- Captured the pre-fix failure signature by stash-and-rerun discipline (added integration tests against unmodified production code, observed exact `TypeError` location and stack, then applied fix). The execution report carries both signatures.
- Cross-territory grep was scoped tight: confirmed `MasterShoppingList*` types and `/family-sets/missing-parts` URL are page-local and not consumed elsewhere.

### What Went Poorly

- The order quoted `PartsMissingPage.vue:56` as the production failure line (`reduce`). I observed the integration harness fails first at line 178 (`length` on `unknownFamilySetIds`) because the `v-else-if` short-circuits there before the `totalShortfall` computed runs. Same bug class, different first-touch. Worth flagging in the execution report so the reviewer doesn't expect line 56 in the captured signature.
- I touched the existing integration spec's stale `part_id`/`brick_link_color_id`/`needed_by_family_set_ids` fixture overrides as part of the cleanup. Strictly speaking that's adjacent fixture cleanup, but those fixtures were _also_ describing a phantom contract — leaving them would have left misleading "passing" tests describing fields the backend never ships. Judgement call to clean up; documented here.

### Blind Spots

- I didn't run the Playwright E2E suite (`make e2e`) to verify the page renders end-to-end against a live backend. The deployment order didn't request it and the Plate's pre-push gauntlet doesn't include E2E. If a CEO sets up E2E on this page later, the wrap-up should include it.
- I didn't check whether the page's translation keys for `parts.missingNeededBy` (which uses `{count}` interpolation) make sense semantically when the count is "set numbers" rather than "set ids". The text reads "Needed by N sets" which is correct in both interpretations — but the reviewer should sanity-check it.

### Training Proposals

| Proposal                                                                                                                                                                                                           | Context                                                                                                                                                                | Shift Evidence |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Before applying a rename across consumer + tests + types, stash the production-code half of the change and re-run the new test against unmodified code to capture the exact pre-fix failure signature.             | The order specified `:56` as the failure line; the integration harness actually fails at `:178` first. Capturing the actual signature beats trusting the reported one. | This journal.  |
| When tightening a type from nullable to non-nullable based on backend non-null guarantee, search test fixtures for `: null` overrides on the same field — they will silently break if the type ever gets stricter. | I caught two `colorName: null` overrides in the unit spec only because the type-check failed; if it had only been a runtime check, they could have shipped.            | This journal.  |

---

## CFO Evaluation

_Pending CFO review. The Medic is a war-room soldier; the CFO's evaluation here is administrative continuity for the Plate's paper trail. The war-room execution report at `/reports/brick-inventory-orchestrator/execution/` is the authoritative document for this deployment._
