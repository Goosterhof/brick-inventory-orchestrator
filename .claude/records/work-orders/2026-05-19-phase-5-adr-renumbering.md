# Work Order: Phase 5 — ADR Renumbering + Consolidation

**Work Order #:** 2026-05-19-phase-5-adr-renumbering
**Filed:** 2026-05-19
**Issued By:** The Steward (under CEO authority granted by the umbrella Work Order)
**Assigned To:** The Steward (self-executed)
**Priority:** Standard
**Wing:** Atrium (cross-wing structural change)
**Parent Work Order:** [`2026-05-18-form-the-brickworks`](2026-05-18-form-the-brickworks.md) (umbrella; remains `In Progress`)

> The branch slug for the Phase 5 PR matches the umbrella permit (`form-the-brickworks`) so `PrePushPermitGate` matches the umbrella, not this sub-Work-Order.

---

## The Job

Renumber and consolidate the BIO sovereign ADR sequence per `MERGER_PLAN.md` rev 4 Phase 5. Move all 13 backend ADRs (`backend/docs/adr/0001`–`0013`) and 16 frontend ADRs (`frontend/.claude/docs/decisions/001`–`016`) into a single `/.claude/docs/adr/` sequence numbered `0001`–`0029`, ordered chronologically by `**Date**` field. Update every cross-reference inside the ADRs and in BIO code that references them. Leave **War Room** ADR references untouched (separate sovereign sequence at `adrs.script.nl`).

## ADR-0015 (ADR Governance) — Compliance Note

Per the merger plan's compliance argument (rev 3 reframing, lab-review verdict): the published ADR-0015 lists `brick-inventory` as **one row** in its Implementation table and envisions **one** sovereign sequence at `docs/adr/`. The pre-monorepo split into `backend/docs/adr/` (0001–0013) and `frontend/.claude/docs/decisions/` (001–016) was a structural artifact of the multi-repo orchestrator architecture, not a doctrinally sanctioned dual sequence.

**Conclusion:** this renumbering is compliance restoration of the single-sovereign-sequence shape ADR-0015 already envisions, not a doctrinal shift. The war-room ADR-0015 canonical page itself carries a stale "0001–0009" count and a `docs/adr/` path reference that Phase 8's war-room follow-up will update.

## Hard-Gate Artifact 1 — Chronological Mapping Table

29 ADRs sorted chronologically by `**Date**`. Within a tied date, older surface-numbers come first (BE before FE; lower number first).

| New ID | Old Source | Date | Title | New File Name |
|---|---|---|---|---|
| 0001 | BE-0011 | 2026-02-11 | Save-What-You-Can Import Atomicity | `0001-import-atomicity.md` |
| 0002 | FE-014 | 2026-03-08 | Domain-driven vertical slices | `0002-domain-driven-vertical-slices.md` |
| 0003 | FE-001 | 2026-03-17 | RouterService wrapper over Vue Router | `0003-custom-routerservice.md` |
| 0004 | FE-002 | 2026-03-17 | Factory functions for services | `0004-factory-services.md` |
| 0005 | FE-003 | 2026-03-17 | UnoCSS attributify | `0005-unocss-attributify.md` |
| 0006 | FE-004 | 2026-03-17 | Snake/camel case conversion at boundary (superseded by 0029) | `0006-case-conversion-boundary.md` |
| 0007 | FE-005 | 2026-03-17 | Istanbul coverage no ignores | `0007-istanbul-coverage-no-ignores.md` |
| 0008 | FE-006 | 2026-03-18 | Resource adapter frozen-mutable | `0008-resource-adapter-frozen-mutable.md` |
| 0009 | FE-007 | 2026-03-18 | Adapter store no Pinia | `0009-adapter-store-no-pinia.md` |
| 0010 | FE-008 | 2026-03-18 | Domain isolation | `0010-domain-isolation.md` |
| 0011 | FE-009 | 2026-03-19 | Component health registry | `0011-brick-catalog-health-metrics.md` |
| 0012 | FE-010 | 2026-03-20 | Test isolation collect-guard | `0012-test-isolation-collect-guard.md` |
| 0013 | BE-0001 | 2026-03-22 | Session-based SPA auth | `0013-session-auth-not-tokens.md` |
| 0014 | BE-0002 | 2026-03-22 | Single-tier authorization | `0014-single-tier-authorization.md` |
| 0015 | BE-0003 | 2026-03-22 | Actions vs Services separation | `0015-actions-and-services-separation.md` |
| 0016 | BE-0004 | 2026-03-22 | Explicit cascade deletion | `0016-explicit-cascade-deletion.md` |
| 0017 | BE-0005 | 2026-03-22 | No mass assignment | `0017-no-mass-assignment.md` |
| 0018 | BE-0006 | 2026-03-22 | DTOFormRequest + ResourceData | `0018-dto-form-requests-and-resource-data.md` |
| 0019 | BE-0007 | 2026-03-22 | `#[Config]` attributes | `0019-config-attributes-not-helpers.md` |
| 0020 | BE-0008 | 2026-03-22 | Explicit routes (no apiResource) | `0020-explicit-routes-not-api-resource.md` |
| 0021 | BE-0009 | 2026-03-22 | Thin controllers with method injection | `0021-thin-controllers-method-injection.md` |
| 0022 | FE-011 | 2026-03-22 | Domain-based Vitest projects | `0022-domain-based-vitest-projects.md` |
| 0023 | FE-012 | 2026-03-22 | Typed mock helpers | `0023-typed-mock-helpers.md` |
| 0024 | FE-013 | 2026-03-27 | Page integration tests | `0024-page-integration-tests.md` |
| 0025 | BE-0010 | 2026-03-28 | ComputedResourceData | `0025-computed-resource-data.md` |
| 0026 | FE-015 | 2026-04-09 | Creative Engine agent (Pattern Master) | `0026-creative-engine-agent.md` |
| 0027 | BE-0012 | 2026-04-30 | Tighten PHP runtime to 8.5+ | `0027-tighten-runtime-to-php-85.md` |
| 0028 | BE-0013 | 2026-05-05 | Pre-push permit verification gate | `0028-pre-push-permit-verification.md` |
| 0029 | FE-016 | 2026-05-05 | Case conversion via HTTP middleware (supersedes 0006) | `0029-case-conversion-via-http-middleware.md` |

### Overlap Resolution

The plan flagged the possibility of thematic overlaps between BE and FE ADRs that would need supersession-marked consolidation under a single new number. **Finding: no such overlaps exist.** Each ADR addresses a distinct technical decision in its own wing. There is exactly one supersession chain inherited from before Phase 5: FE-004 → FE-016 (now 0006 → 0029); supersession markers are preserved with renumbering.

## Hard-Gate Artifact 2 — Dry-Run Rewrite Diff

Sites that will be touched by the renumbering, classified by sequence sovereignty.

### A. ADR files themselves (29 file moves with body updates)

For each ADR, the file path moves and the body's `# Decision:` header gets a new `**Renumbered**` line documenting the old ID:

| New path | Old path |
|---|---|
| `.claude/docs/adr/0001-import-atomicity.md` | `backend/docs/adr/0011-import-atomicity.md` |
| `.claude/docs/adr/0002-domain-driven-vertical-slices.md` | `frontend/.claude/docs/decisions/014-domain-driven-vertical-slices.md` |
| `.claude/docs/adr/0003-custom-routerservice.md` | `frontend/.claude/docs/decisions/001-custom-routerservice.md` |
| `.claude/docs/adr/0004-factory-services.md` | `frontend/.claude/docs/decisions/002-factory-services.md` |
| `.claude/docs/adr/0005-unocss-attributify.md` | `frontend/.claude/docs/decisions/003-unocss-attributify.md` |
| `.claude/docs/adr/0006-case-conversion-boundary.md` | `frontend/.claude/docs/decisions/004-case-conversion-boundary.md` |
| `.claude/docs/adr/0007-istanbul-coverage-no-ignores.md` | `frontend/.claude/docs/decisions/005-istanbul-coverage-no-ignores.md` |
| `.claude/docs/adr/0008-resource-adapter-frozen-mutable.md` | `frontend/.claude/docs/decisions/006-resource-adapter-frozen-mutable.md` |
| `.claude/docs/adr/0009-adapter-store-no-pinia.md` | `frontend/.claude/docs/decisions/007-adapter-store-no-pinia.md` |
| `.claude/docs/adr/0010-domain-isolation.md` | `frontend/.claude/docs/decisions/008-domain-isolation.md` |
| `.claude/docs/adr/0011-brick-catalog-health-metrics.md` | `frontend/.claude/docs/decisions/009-brick-catalog-health-metrics.md` |
| `.claude/docs/adr/0012-test-isolation-collect-guard.md` | `frontend/.claude/docs/decisions/010-test-isolation-collect-guard.md` |
| `.claude/docs/adr/0013-session-auth-not-tokens.md` | `backend/docs/adr/0001-session-auth-not-tokens.md` |
| `.claude/docs/adr/0014-single-tier-authorization.md` | `backend/docs/adr/0002-single-tier-authorization.md` |
| `.claude/docs/adr/0015-actions-and-services-separation.md` | `backend/docs/adr/0003-actions-and-services-separation.md` |
| `.claude/docs/adr/0016-explicit-cascade-deletion.md` | `backend/docs/adr/0004-explicit-cascade-deletion.md` |
| `.claude/docs/adr/0017-no-mass-assignment.md` | `backend/docs/adr/0005-no-mass-assignment.md` |
| `.claude/docs/adr/0018-dto-form-requests-and-resource-data.md` | `backend/docs/adr/0006-dto-form-requests-and-resource-data.md` |
| `.claude/docs/adr/0019-config-attributes-not-helpers.md` | `backend/docs/adr/0007-config-attributes-not-helpers.md` |
| `.claude/docs/adr/0020-explicit-routes-not-api-resource.md` | `backend/docs/adr/0008-explicit-routes-not-api-resource.md` |
| `.claude/docs/adr/0021-thin-controllers-method-injection.md` | `backend/docs/adr/0009-thin-controllers-method-injection.md` |
| `.claude/docs/adr/0022-domain-based-vitest-projects.md` | `frontend/.claude/docs/decisions/011-domain-based-vitest-projects.md` |
| `.claude/docs/adr/0023-typed-mock-helpers.md` | `frontend/.claude/docs/decisions/012-typed-mock-helpers.md` |
| `.claude/docs/adr/0024-page-integration-tests.md` | `frontend/.claude/docs/decisions/013-page-integration-tests.md` |
| `.claude/docs/adr/0025-computed-resource-data.md` | `backend/docs/adr/0010-computed-resource-data.md` |
| `.claude/docs/adr/0026-creative-engine-agent.md` | `frontend/.claude/docs/decisions/015-creative-engine-agent.md` |
| `.claude/docs/adr/0027-tighten-runtime-to-php-85.md` | `backend/docs/adr/0012-tighten-runtime-to-php-85.md` |
| `.claude/docs/adr/0028-pre-push-permit-verification.md` | `backend/docs/adr/0013-pre-push-permit-verification.md` |
| `.claude/docs/adr/0029-case-conversion-via-http-middleware.md` | `frontend/.claude/docs/decisions/016-case-conversion-via-http-middleware.md` |

### B. ADR body cross-references — BE-sovereign rewrite map

When rewriting a moved BE ADR body, apply this 4-digit → 4-digit map to every `ADR-NNNN` occurrence that is NOT prefixed with "War Room":

| Old BE | New |
|---|---|
| ADR-0001 | ADR-0013 |
| ADR-0002 | ADR-0014 |
| ADR-0003 | ADR-0015 |
| ADR-0004 | ADR-0016 |
| ADR-0005 | ADR-0017 |
| ADR-0006 | ADR-0018 |
| ADR-0007 | ADR-0019 |
| ADR-0008 | ADR-0020 |
| ADR-0009 | ADR-0021 |
| ADR-0010 | ADR-0025 |
| ADR-0011 | ADR-0001 |
| ADR-0012 | ADR-0027 |
| ADR-0013 | ADR-0028 |

Occurrences observed (12 lines across 7 BE ADRs):
- `0008-explicit-routes-not-api-resource.md:10` — `(ADR-0002)` → `(ADR-0014)`
- `0002-single-tier-authorization.md:15` — `(ADR-0009)` → `(ADR-0021)`
- `0005-no-mass-assignment.md:17` — `(ADR-0003)` → `(ADR-0015)`
- `0012-tighten-runtime-to-php-85.md:24` — `(see ADR-0003 spirit;...)` → `(see ADR-0015 spirit;...)`
- `0013-pre-push-permit-verification.md:10` — `to ADR-0010` → `to ADR-0025`
- `0006-dto-form-requests-and-resource-data.md:16` — `(ADR-0003)` → `(ADR-0015)`
- `0006-dto-form-requests-and-resource-data.md:29` — `Violates ADR-0003` → `Violates ADR-0015`
- `0009-thin-controllers-method-injection.md:10,16,46` — three `(ADR-0003)` / `(ADR-0002)` → `(ADR-0015)` / `(ADR-0014)`
- `0011-import-atomicity.md:74,100` — `ADR-0003 approved exception constraints` / `documented in ADR-0003` → `ADR-0015`
- `0010-computed-resource-data.md:10,92,94` — three `ADR-0006` → `ADR-0018`

### C. ADR body cross-references — FE-sovereign rewrite map

When rewriting a moved FE ADR body, apply this 3-digit → 4-digit map to every `ADR-NNN` occurrence:

| Old FE | New |
|---|---|
| ADR-001 | ADR-0003 |
| ADR-002 | ADR-0004 |
| ADR-003 | ADR-0005 |
| ADR-004 | ADR-0006 |
| ADR-005 | ADR-0007 |
| ADR-006 | ADR-0008 |
| ADR-007 | ADR-0009 |
| ADR-008 | ADR-0010 |
| ADR-009 | ADR-0011 |
| ADR-010 | ADR-0012 |
| ADR-011 | ADR-0022 |
| ADR-012 | ADR-0023 |
| ADR-013 | ADR-0024 |
| ADR-014 | ADR-0002 |
| ADR-015 | ADR-0026 |
| ADR-016 | ADR-0029 |

Occurrences observed (35+ lines across the FE ADRs).

### D. Non-ADR code references

| File | Line(s) | Change |
|---|---|---|
| `backend/tests/Architecture/ModelArchitectureTest.php` | 38, 49, 76 | `ADR-0005` → `ADR-0017` (BIO sovereign); `War Room ADR-0019` unchanged |
| `frontend/src/tests/unit/collect-guard-reporter.ts` | 28, 134, 159 | `ADR-010` → `ADR-0012` |
| `frontend/src/tests/unit/architecture.spec.ts` | 525 | `ADR-013` → `ADR-0024` |
| `docs/idea-vault.md` | 90 | `ADR-009 component health registry` → `ADR-0011 component health registry` |

### E. Index files to delete (Phase 6 will rebuild)

- `backend/docs/adr/README.md` — index of BE ADRs; superseded by the consolidated sequence
- `frontend/.claude/docs/decisions.md` — index of FE ADRs; Phase 6 builds a new `.claude/docs/decisions.md` from this Work Order's mapping table

### F. NOT touched in Phase 5 (war-room references, historical artifacts)

- `CLAUDE.md` line 87 — war-room ADRs (0002/0004/0009/0011/0012/0014/0016/0019) reference a separate sovereign sequence at `adrs.script.nl`; not BIO-renumbered
- `backend/tests/Architecture/ModelArchitectureTest.php` `War Room ADR-0019` reference — same as above
- `MERGER_PLAN.md`, `MERGER_PLAN_REVIEW.md`, `MERGER_PLAN_WAR_ROOM_REVIEW.md` — historical plan documents
- `frontend/MINUTES.md` — meeting minutes; reference ADRs in their as-of date numbering. Updating would distort the historical record
- `frontend/.claude/docs/ADR-000.md` — meta-decision-framework document (not an ADR in the numbered sequence); Phase 6 handles its move

## Acceptance Criteria

- [ ] All 29 ADR files exist at `.claude/docs/adr/0001-…` through `…-0029` per the mapping table
- [ ] Old paths `backend/docs/adr/` and `frontend/.claude/docs/decisions/` are empty (delete `README.md` and `decisions.md` accordingly)
- [ ] Every ADR-body cross-reference resolves to the new numbering per the rewrite maps in §B and §C
- [ ] Non-ADR code references in §D updated
- [ ] War-room references in §F left intact
- [ ] `cd backend && composer test:arch` passes
- [ ] `cd frontend && npm run lint` passes
- [ ] `rg 'ADR-?[0-9]{3,4}' --type md --type php --type ts --type vue` shows no orphan FE-3-digit references in code (only in MERGER_PLAN*.md, MINUTES.md, and ADR bodies themselves where they reference older numbering as historical context, e.g. the `005-istanbul-coverage-no-ignores.md` body's "Previous ADR-005")
- [ ] Hard-gate artifacts (this file with §A–§D filled in) committed BEFORE the execution commit

## Status

**Status:** Completed

## Build Record

This Phase 5 sub-Work-Order's outcome is absorbed into the umbrella [closing Build Record](../build-records/2026-05-19-form-the-brickworks.md), which covers all eight phases of the Brickworks merger.
