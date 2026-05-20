# Audit: Post-Merger Baseline — First Audit Since The Brickworks Formation

**Audit #:** 2026-05-20-post-merger-baseline
**Filed:** 2026-05-20
**Auditor:** Quality Warden
**Wing:** Cross-wing (Atrium + Foundry + Gallery)
**Scope:** Targeted: vocabulary coherence, doc accuracy post-file-moves, paper-trail structure, pattern compliance signals, gauntlet wiring
**Pulse Version:** Overall Health assessed 2026-05-05 (Foundry), 2026-04-11 (Gallery); In-Progress Work assessed 2026-05-19
**Triggered By:** The Steward request — first post-merger baseline audit, one day after eight-phase consolidation completed 2026-05-19

---

## Quality Gauntlet Results

Gauntlet not run — this is a doc-and-structure audit. No code was modified. The closing Build Record (`2026-05-19-form-the-brickworks`) reports all checks green at end of Phase 7 (105 arch tests pass, lint 0 warnings on 303 files, 41 PrePushPermitGate tests pass). This audit verifies gauntlet wiring is intact rather than re-running the full suite.

### Gauntlet Wiring Verification

| Check | Wired | Notes |
|---|---|---|
| `.githooks/pre-commit` | Yes | Routes backend staged files to CaptainHook gauntlet, frontend to lint-staged pipeline |
| `.githooks/pre-push` | Yes | Routes backend range to CaptainHook (PrePushPermitGate → composer test), frontend to Husky |
| `PrePushPermitGate.php` | Yes | `PERMIT_DIRECTORY` = `.claude/records/work-orders` (correct post-Phase-4 path) |
| `TEMPLATE_FILENAME` | Yes | `.work-order-template.md` (correct post-Phase-4 name) |
| `backend-ci.yml` | Yes | PHP 8.5, full gauntlet including pcov coverage and mutation |
| `frontend-ci.yml` | Yes | Node 24, full gauntlet including knip, size, commitlint |
| `gate.yml` | Yes | Aggregate gate with path-detection, waits on backend/frontend/e2e |
| `Makefile` → `hooks-install` | Yes | `git config core.hooksPath .githooks` |

---

## Findings

### Architecture / Vocabulary

#### 1. ADR Quick Reference tables in quality-warden.md use pre-merger sovereign numbering `high`

- **Location:** `.claude/agents/quality-warden.md`, lines 58–111 — both the Foundry Quick Reference table (ADRs 0001–0009) and the Gallery Quick Reference table (ADRs 000–016)
- **Standard:** Phase 5 of the merger (PR #67) consolidated all ADRs into a single 0001–0029 sequence at `.claude/docs/adr/`. `decisions.md` records this as the canonical numbering. The agent's own preamble (line 54, line 91) states "ADRs at `.claude/docs/adr/` (consolidated `0001`–`0029` sequence)" — then uses the old numbers immediately below in the tables.
- **Observation:** The Foundry Quick Reference lists "0001 = Session-based SPA auth" through "0009 = Thin controllers" using the pre-merger Foundry sovereign numbers. In the consolidated sequence these ADRs are actually 0013–0021. The Gallery Quick Reference lists "000 = Meta-decision" through "016 = Case conversion" using the pre-merger Gallery sovereign numbers. In the consolidated sequence these ADRs are 0002–0029 (with gaps). The mismatch is operational: when the Quality Warden cites "ADR-0003 (Actions/Services separation)" from the Foundry table, a reader looking up ADR-0003 in `.claude/docs/adr/` finds `0003-custom-routerservice.md` — a completely different decision. The cross-reference system is broken.
- **Recommendation:** Update both Quick Reference tables with the consolidated 0001–0029 numbers. The Foundry table should cite 0013–0021 (or the relevant subset). The Gallery table should cite 0002–0029 (or the relevant subset). Phase 5's mapping table in `.claude/records/work-orders/2026-05-19-phase-5-adr-renumbering.md` is the canonical source for the old→new mapping.

---

### Documentation Accuracy

#### 2. "Laravel 12" claimed in four documents; composer.json requires `^13.0` `medium`

- **Location:**
  - `backend/CLAUDE.md` line 15: `| Framework | Laravel 12 |`
  - `.claude/docs/foundry-map.md` line 61: `| Framework | Laravel 12 |`
  - `CLAUDE.md` (root) line 80: `The Brick (Laravel 12 API, formerly...)`
  - `.claude/agents/quality-warden.md` line 16: `Laravel 12, PHP 8.5, Deptrac boundaries`
- **Standard:** Documentation accuracy — doc claims should match the canonical source (composer.json).
- **Observation:** The Laravel 13 upgrade shipped 2026-04-19 (Build Record `2026-04-19-laravel-13-upgrade.md`). All four documents were not updated during the upgrade or during the merger's Phase 7 wing-manual rewrite. The Pulse's Overall Health section correctly references "Laravel 13.7 deprecation cascade", so awareness exists — the surface-level docs simply weren't updated. A senior architect reading `backend/CLAUDE.md` or the root `CLAUDE.md` would see "Laravel 12 API" and get a false impression of the technology stack.
- **Recommendation:** Update the framework version claim in all four documents to "Laravel 13". The root `CLAUDE.md` and `quality-warden.md` will need the phrase updated; `backend/CLAUDE.md` and `foundry-map.md` need the table row updated. This should have been a Phase 7 cleanup; it can be a single-commit housekeeping fix.

---

### Documentation Drift — Low

#### 3. Stale path in vocabulary-lock.md Authority line `low`

- **Location:** `docs/vocabulary-lock.md` line 6: `**Authority:** Phase 0 Work Order \`2026-05-18-form-the-brickworks\` (\`.claude/records/permits/2026-05-18-form-the-brickworks.md\`)`
- **Standard:** Internal links should resolve. Phase 4 renamed `permits/` → `work-orders/`. The actual file is at `.claude/records/work-orders/2026-05-18-form-the-brickworks.md`.
- **Observation:** The vocabulary-lock.md was filed during Phase 0 (before Phase 4's folder rename) and moved to `/docs/` as an archived historical artifact during Phase 8. The Body's "Folder & Path Implications" section also uses future tense ("Phase 4 of the merger plan will rename...") for actions that have already completed. As a frozen historical artifact the forward-tense body is expected. However, the Authority line's dead path is the one reference a reader would actually try to resolve. Since this is an archived doc and the Work Order's content is not in question, impact is low but a future reader would get a 404-equivalent.
- **Recommendation:** Update the Authority line path from `.claude/records/permits/` to `.claude/records/work-orders/`. The body text can remain in historical present-tense.

#### 4. Pulse Foundry Overall Health section retains pre-consolidation inline ADR count `low`

- **Location:** `.claude/docs/pulse.md` line 23: `"...13 coherent BIO sovereign ADRs (now consolidated into 0001–0029 by Phase 5)"`
- **Standard:** Pulse sections should reflect current state. The Atrium Quality Metrics table (pulse line 154) correctly shows "29 (0001–0029, consolidated)".
- **Observation:** The parenthetical "(now consolidated into 0001–0029 by Phase 5)" was written before Phase 5 completed and preserved through the merger. It now reads as a historical footnote mid-sentence in the active assessment. A reader scanning the Overall Health section sees "13 coherent BIO sovereign ADRs" followed immediately by an in-line correction — the correction is correct but the whole sentence needs to be written in current-state prose, not past-transition narration. The Pulse section has not been re-assessed since 2026-05-05 (pre-merger); the merger itself is not in the Overall Health narrative at all.
- **Recommendation:** When the Steward next re-evaluates Overall Health, rewrite the Foundry sentence in current-state prose: remove the "13 coherent...now consolidated" clause and simply reference the 29-ADR consolidated sequence as present fact. Flag the merger as a net positive for the portfolio narrative.

---

## ADR Pressure

None detected. The merger did not introduce new architectural patterns; ADR-0028 (pre-push gate) and ADR-0029 (case conversion) were the last ADRs filed. No frequency or threshold signals fired during this audit.

---

## Doc Drift

| Document | Accurate | Drift Found |
|---|---|---|
| Pulse | Partially | Overall Health (Foundry): "13 coherent BIO sovereign ADRs" pre-merger clause survives; assessed 2026-05-05 (Foundry) / 2026-04-11 (Gallery) — no post-merger update to health/concerns sections. In-Progress Work correctly updated 2026-05-19. |
| Learnings | Yes | No new post-merger learnings yet. Foundry section's "Pending first Head Sorter shift" note is a known historical artifact per merge Build Record. |
| CLAUDE.md (Atrium/root) | Partially | "Laravel 12 API" — stale (see Finding 2). All other content accurate. |
| Wing CLAUDE.md (Foundry) | Partially | "Laravel 12" in framework table — stale (see Finding 2). Conventions, ADR references (0013–0028), quality thresholds all accurate. |
| Wing CLAUDE.md (Gallery) | Yes | All accurate. |
| Foundry Map | Partially | "Laravel 12" in framework table — stale (see Finding 2). Department layout and Action/Model/Route inventory accurate. |
| Domain Map | Yes | 8 Families domains, 1 Admin domain, 17 Showcase components — all match file system. Reverse-verified. |
| Decisions Index (decisions.md) | Yes | 29 ADRs listed, all files present at `.claude/docs/adr/`, ADR-000 present at `.claude/docs/ADR-000.md`. Count and file inventory match. |
| quality-warden.md (agent) | Partially | ADR Quick Reference tables use pre-merger sovereign numbering (see Finding 1 — high). SOPs, pre/post-audit guidance, casebook paths all accurate. |
| vocabulary-lock.md | Partially | Authority line has stale `permits/` path (see Finding 3 — low). Historical doc; body content accurate. |
| Component Registry | Not checked — Gallery gauntlet not run. Marked deferred; no code changes in scope. |

---

## Pattern Compliance Spot-Check

### Foundry Wing

| Pattern | Sample | Compliant | Notes |
|---|---|---|---|
| Actions: `final readonly` | `CreateFamilySetAction`, `LoginUserAction`, `CreateStorageOptionAction` | Yes | All three verified |
| Controllers: no constructor | `FamilySetController` | Yes | No `__construct` found |
| Controllers: no try-catch | `FamilySetController` | Yes | No catch blocks |
| Actions: try-catch only for ADR-0015 documented exceptions | 7 try-catch occurrences across 6 Actions | Yes | All catch `UniqueConstraintViolationException` (upsert/race-guard) or `RebrickableApiException|InvalidApiResponseException` (partial-failure); all three documented exception types from ADR-0015 |

### Gallery Wing

| Pattern | Sample | Compliant | Notes |
|---|---|---|---|
| `<script setup lang="ts">` | `BackButton.vue`, `CardContainer.vue`, `SetsOverviewPage.vue` | Yes | All three verified |
| Path aliases: `@shared/` and `@app/` | `SetsOverviewPage.vue` imports | Yes | No `../shared/` or `@/apps/` found in sample |
| Domain structure matches domain-map | `src/apps/families/domains/` | Yes | 8 directories match 8 documented domains |

---

## Proposed Pulse Updates

1. **Overall Health — Foundry:** Replace the "13 coherent BIO sovereign ADRs (now consolidated...)" clause with present-tense. Add a line noting the merger's positive effect on portfolio readiness (single identity, single ADR sequence, unified paper trail). Update assessed date to 2026-05-20.
2. **Overall Health — Gallery:** Update assessed date to 2026-05-20 if re-evaluated.
3. **Framework version:** Once Finding 2 docs are updated, the Pulse body can mention "Laravel 13" consistently.

---

## Summary

**Overall Health:** 8.5/10 (cross-wing; consistent with pre-merger ratings; merger itself is a net positive for structural clarity)
**Findings:** 4 total (0 high per finding count above — but Finding 1 is the most impactful)

Severity breakdown:
- High: 1 (ADR Quick Reference numbering broken — operational: wrong ADR files cited)
- Medium: 1 (Laravel version claim in 4 docs)
- Low: 2 (vocabulary-lock path, Pulse stale clause)

**Showcase Readiness:** Needs polish — the charter document (CLAUDE.md root) claims "Laravel 12" for a codebase running Laravel 13, and the agent's own ADR reference guide points to the wrong ADRs. A senior architect performing due diligence would notice both.

**Recommendation:** Targeted fixes — two small Work Orders cover all findings: (1) ADR Quick Reference table rekeying in quality-warden.md; (2) "Laravel 12 → 13" doc sweep across 4 files. The vocabulary-lock and Pulse updates can fold into either.

---

## Self-Debrief

### What I Caught

- The ADR Quick Reference numbering mismatch (high severity) was the most operationally impactful finding: it breaks the quality-warden's own cross-reference system. Surfaced by comparing the table numbers against decisions.md.
- The Laravel 12/13 version inconsistency (medium) was straightforward to find: composer.json is the ground truth, and four docs contradicted it.
- Gauntlet wiring check was productive — verified PrePushPermitGate, captainhook template filename, and CI paths are all correctly updated to post-Phase-4 vocabulary.
- Pattern compliance spot-check found no regressions — all seven try-catch occurrences in Actions mapped cleanly to ADR-0015's documented exception types.

### What I Missed

- Did not run the full gauntlet (both wings). This was scoped as a doc/structure audit, not a code-quality audit. The gauntlet results from the closing Build Record are claims, not verified facts for this cycle.
- Did not check the `component-registry.json` freshness or run `npm run registry:check`. Deferred as no code changes were in scope for this audit.
- Did not audit the ADR body content itself beyond spot-checking ADR-0015 and ADR-0028. A future audit should verify that the Phase 5 cross-reference rewrites are complete (the Phase 5 Work Order acceptance criteria include `rg 'ADR-?[0-9]{3,4}'` returning no orphan 3-digit FE references in production code — worth verifying in a code-focused audit).
- Did not check the brickwright.md and pattern-master.md agent bodies for ADR Quick Reference tables (they may not have them, but was not confirmed).

### Methodology Gaps

- The merger introduced a new audit scope: **governance document self-reference consistency** (agent files citing ADR numbers must match the live ADR sequence). This isn't explicitly covered in any SOP. It surfaced only because this audit was post-merger with the specific brief to check vocabulary coherence.
- SOP G-3 (Doc Accuracy) covers domain-map reverse-verify and numeric count verification but doesn't specifically call out agent-file ADR tables as a verification target. After a renumbering event, the agent files are a distinct category of doc that can drift.

### Training Proposals

| Proposal | Context | Audit Evidence |
|---|---|---|
| After any ADR renumbering event, add an explicit checklist step: verify agent files' ADR Quick Reference tables use the new sequence numbers | Phase 5 ADR renumbering updated ADR body cross-references and decisions.md but left quality-warden.md Quick Reference tables on old pre-merger numbers | This audit, Finding 1 (high) |
| When a framework version upgrade Build Record is filed, include a doc sweep step as part of acceptance criteria: `grep -rn "Framework\|Laravel [0-9]" backend/CLAUDE.md .claude/docs/ CLAUDE.md .claude/agents/` | Laravel 13 upgrade landed 2026-04-19 but four docs still claimed Laravel 12 as of 2026-05-20 | This audit, Finding 2 (medium) |

---

## Steward Evaluation

**Assessment:** Thorough

The first audit after a structural reorg was correctly scoped to drift and consistency rather than deep code-review. The finding count is small but the calibration is honest: Finding 1 is the right call at HIGH because it breaks the Warden's own cross-reference system (operational, not cosmetic). The two LOW items are appropriately low and the medium is appropriately medium.

### Findings Review

Calibration is sound. No severity over/under-calls. The decision to bundle the two LOW items into the same Work Order as the MEDIUM (per the audit's own recommendation) was the right move — three separate Work Orders for one-line edits each would be more paper trail than the fixes are worth.

Remediation dispatched:

- Finding 1 → [`2026-05-20-rekey-quality-warden-adr-tables.md`](../work-orders/2026-05-20-rekey-quality-warden-adr-tables.md)
- Findings 2, 3, 4 → [`2026-05-20-laravel-13-doc-sweep.md`](../work-orders/2026-05-20-laravel-13-doc-sweep.md)

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| After ADR renumbering, verify agent-file Quick Reference tables | **Candidate — Accepted** | Filed as a Methodology Note in [`quality-warden-casebook.md`](../../docs/quality-warden-casebook.md). The Casebook is read before every inspection, which is the right cadence: any future renumbering event will be followed by an inspection, and the check will fire. No SOP doc needed at this stage. |
| Framework version upgrade Build Records should include doc sweep in acceptance criteria | **Candidate — Accepted** | Filed as an Atrium-level Active Concern in [`pulse.md`](../../docs/pulse.md) with the SOP shape sketched out. Lives in the Pulse rather than the Casebook because this is a process/governance change visible to the whole crew, not just the Warden. Will close out when the SOP is codified into a Build Record template or the closing Brickwright follows the pattern unprompted on the next framework upgrade. |

### Notes for the Quality Warden

Good first post-merger audit. Two methodology observations worth keeping:

1. **Self-Debrief was useful** — the "Methodology Gaps" section identified a new audit dimension (governance-doc self-reference consistency) that wasn't covered by any existing SOP. That kind of meta-finding is exactly what the Self-Debrief format is supposed to surface.
2. **Spot-check sample sizes were appropriate** — three Actions, three Vue components, three import paths. Enough to catch a regression but not so much that the audit drowned in code-reading when the scope was structural drift. Keep that ratio for similar post-reorg baselines.

Calibrate going forward: when a renumbering or terminology change ships, the next audit's scope should explicitly include "agent files" as a doc category alongside CLAUDE.md / docs / records.
