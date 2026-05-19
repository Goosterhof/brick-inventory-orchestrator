# Merger Plan — Forming The Brickworks (rev 4 — editorial cleanup)

**Rev history:**
- rev 1 (2026-05-18) — original plan
- rev 2 (2026-05-18) — incorporates `MERGER_PLAN_REVIEW.md` (lab) punch list: factual drift refresh, Phase 0.5 vocabulary lock, ADR-0015 compliance note, Brick Master persona disposition, root `/docs/` enumeration, expanded risks with owners, Phase 5 hard gate, Phase 8 drift log
- rev 3 (2026-05-18) — incorporates `MERGER_PLAN_WAR_ROOM_REVIEW.md` punch list: ADR-0015 compliance reframing (W-1), deny-corpus visibility gate added to all `.claude/**`-touching phases (W-2), Phase 8 war-room-repo follow-up campaign (W-3), in-flight ADR-0021 handling (W-4), Phase 0.5 reframed as documentary not deliberative (W-6)
- rev 4 (2026-05-18) — editorial cleanup: consolidated W-2 visibility gate into a single Cross-Phase Discipline section, stripped citation parentheticals from body prose, compressed Phase 0.5 to bullets, merged duplicate risk 6 into risk 3, resolved Phase 0.5/Phase 4 template-name reference, dropped dissent column from vocabulary table

## Context

The monorepo currently houses two parallel governance systems: **Brick & Mortar Associates** (frontend/) and **Stud & Sort Logistics** (backend/). Each runs an identical-shape persona stack (CEO → deputy → builder + auditor) and paper trail (permits → journals → inspections) under different terminology. The orchestrator root is a thin third zone with 1 permit, 2 shared skills, **and an existing AI persona named "Brick Master"** at `CLAUDE.md` line 5 — addressed in Phase 1.

The split made sense pre-monorepo when the surfaces lived in separate repos. Post-merge (2026-05-17, PR #28) it produces friction: two ADR ledgers with conflicting numbering, two sets of training/graduation logs, duplicated `adr-interrogator` skills with **drifted identity branding** (each version brands the repo differently — addressed in Phase 2), parallel `learnings.md` files. Cross-surface work (e.g., monorepo migration permit) has no clean home.

**Goal:** consolidate both companies into one — **The Brickworks** — living at the orchestrator root, with the two surfaces reduced to thin reference shims. Single deputy, single crew, single paper trail, single ADR sequence.

**CEO-confirmed decisions** (from this session, AskUserQuestion record):
- **Name:** The Brickworks
- **Metaphor:** Old-world manufacturing firm with named wings
- **Location:** Root `/.claude/` is canonical. `backend/.claude/` and `frontend/.claude/` are deleted; `backend/CLAUDE.md` and `frontend/CLAUDE.md` shrink to short surface-reference pointers
- **Deputy structure:** Single deputy (**The Steward**) over everything
- **Crew shape:** Merge by role — one Brickwright (Builder), one Quality Warden (Auditor), keep one Pattern Master (Creative). Dedupe skills
- **History:** Consolidate all records to root with renamed vocabulary; renumber ADRs into single sequence

## Vocabulary (Locked by Phase 0.5 Artifact)

CEO chose the names below in this session's AskUserQuestion. Phase 0.5 is documentary, not deliberative — it files `vocabulary-lock.md` to record the decision and its date. The names stand unless the CEO actively swaps them at file-time.

| Old (BE) | Old (FE) | **The Brickworks** |
|---|---|---|
| Logistics Director | CFO | **The Steward** |
| Head Sorter | Lead Brick Architect | **Brickwright** |
| Inventory Auditor | Building Inspector | **Quality Warden** |
| — | Creative Engine | **Pattern Master** |
| Shipping Order | Building Permit | **Work Order** |
| Shift Log | Construction Journal | **Build Record** |
| Audit Report | Inspection Report | **Audit** |
| Warehouse | Firm | **Brickworks** |
| Sorting Procedure | (varies) | **Build Operation** |
| Backend domain | — | **The Foundry Wing** |
| — | Frontend domain | **The Gallery Wing** |
| Orchestrator | Orchestrator | **The Atrium** |

*Footnote:* lab review proposed an alternative trades vocabulary (Commission / Workshop Log / Inspection ; The Foreman / Brickwright / Inspector / Pattern Master); CEO declined. Recorded in `vocabulary-lock.md`.

## Cross-Phase Discipline: Before-Commit Visibility Checklist

BIO `.claude/` has been publicly visible since 2026-05-06. Every phase that writes fresh narrative text into `.claude/**` runs the deny-corpus grep gate before commit:

- **Corpus:** war-room canonical at `registry/ally-identifiers.md` — 5 private app names, 3 private orgs, 1 prefix family
- **Procedure:** grep the corpus terms against every file written or rewritten in the phase
- **Threshold:** zero hits. Any hit gets redacted per the canonical redaction vocabulary before commit
- **Why it exists:** 2026-05-06 publication-readiness wave found 16 ally references across 11 FE `.claude/` files; doctrine was authored to prevent recurrence

Each phase below names its **visibility checklist targets** — files where fresh narrative is being written. Files that preserve historical content as-is do not need re-scanning.

## Approach: Phased, Each Phase = One Permit + One PR

A single mega-PR would touch ~170 records, renumber 29 ADRs, rewire hooks, and update enforcement tests. Too brittle to land cleanly. Each phase below ships independently and leaves the repo in a working state.

The merger itself is a non-trivial change and **must be filed as a Work Order** under the existing root permit conventions (currently named permits). The Phase 0 work order is the first artifact created.

### Phase 0 — File the Merger Work Order

- File `.claude/records/permits/2026-05-18-form-the-brickworks.md` (still under the old `permits/` name; the renaming happens in Phase 4) describing this whole multi-phase effort
- Acceptance criteria embedded in the Work Order are the **review punch list** from `MERGER_PLAN_REVIEW.md` (now resolved in this rev 2)
- **Record-creation freeze recommendation:** review notes systematic +1 drift in all three record types since rev 1 was authored, suggesting in-flight work in both surfaces. Either freeze record-creation in both surfaces for the migration's duration, or accept Phase 4 will sweep whatever exists at execution time. **Default:** accept the sweep — freeze adds coordination overhead that exceeds the cost of a few extra files moving
- No code changes; this phase only establishes the paper trail before the structural work begins

### Phase 0.5 — Vocabulary Lock (Documentary)

- Create `vocabulary-lock.md` at repo root, dated, with CEO sign-off
- Record chosen artifact names (Work Order / Build Record / Audit) and role names (The Steward / Brickwright / Quality Warden / Pattern Master)
- File moves to `/docs/` at Phase 8 alongside the other historical decision artifacts

### Phase 1 — Establish The Brickworks Identity at Root

**Existing Brick Master Persona disposition:** **absorb-into-Steward.** Root `CLAUDE.md` line 5 currently reads: *"You are the **Brick Master** — the master builder of this codebase."* This persona is implicitly the AI's role at the orchestrator level. Under the merger, the AI's persona at the root becomes **The Steward** (deputy to the CEO), which subsumes the Brick Master's "master builder of this codebase" framing. The Brick Master line is rewritten, not retired in silence — the Brick Master *is* who The Steward used to be.

- Update `/CLAUDE.md`:
  - Replace the Brick Master persona declaration (line 5) with The Steward
  - Replace the orchestrator-only framing with The Brickworks identity layered on top of the existing Baseplate/Brick/Plate LEGO vocabulary (which stays — it's still accurate)
  - Add a top-level **Brickworks Charter** section: company name, wings (Foundry/Gallery/Atrium), the Steward role, the crew (Brickwright/Quality Warden/Pattern Master), the paper trail vocabulary
  - Reframe the existing surface CLAUDE.md references (lines 47–51) as "wing manuals"
- Surface CLAUDE.md files (`backend/CLAUDE.md`, `frontend/CLAUDE.md`) untouched in this phase — they still operate under their old personas. The orchestrator just gains the umbrella identity
- **Verification:** read `/CLAUDE.md` end-to-end; the company structure should be clear without needing to read either surface

### Phase 2 — Build the Unified Crew

Create root `.claude/agents/` and `.claude/skills/`:

- `/.claude/agents/brickwright.md` — merged from `frontend/.claude/agents/lead-brick-architect.md` and `backend/.claude/agents/head-sorter.md`. Covers both stacks; references wing-specific patterns via `@backend/CLAUDE.md` and `@frontend/CLAUDE.md`
- `/.claude/agents/quality-warden.md` — merged from `building-inspector.md` and `inventory-auditor.md`. Read-only
- `/.claude/agents/pattern-master.md` — promoted from `frontend/.claude/agents/creative-engine.md`. Renamed; scope unchanged
- `/.claude/skills/adr-interrogator/` — **new neutral framing under The Brickworks identity**. The two source versions brand the repo differently (Brick & Mortar vs Stud & Sort) — merger requires writing a clean Brickworks-flavored version rather than picking a winner. Behavior/protocol from both copies merges in; only the identity language is rewritten
- `/.claude/skills/minutes/` — moved from frontend, identity references updated from CFO→Steward, otherwise unchanged
- `/.claude/skills/brick-apprentice/` and `next-build/` — already at root, no changes
- The surface-level `.claude/agents/` and `.claude/skills/` still exist in this phase. They are not yet deleted — they're just shadowed by the root versions. This lets us verify the new agents work before pulling the rug

**Verification (substantive, not symbolic):** invoke the new Brickwright on a real small task in each wing — e.g., a backend Action change AND a frontend component change. Both must produce code that follows the wing's conventions. Symbolic "the agent loads" check is insufficient.

**Visibility checklist targets:** merged agent files at `/.claude/agents/`, new neutral `adr-interrogator` framing — freshly-written narrative text, highest re-leak risk.

### Phase 3 — Consolidate Hooks and Settings

**Root settings.json does NOT exist** (only `settings.local.json` does). Phase 3 *creates* root `/.claude/settings.json`.

- Frontend `.claude/settings.json` registers **5 event types / 8 hook registrations**; backend registers **1 event type / 1 registration**. Asymmetric — backend has one nudge hook, frontend has the full guard suite (generated-file guard, destructive-git guard, formatting check, session-start check, two nudges)
- Merge `frontend/.claude/hooks/` (6 scripts) and `backend/.claude/hooks/` (1 script) into `/.claude/hooks/`. **Both copies of `journal-nudge.sh` have persona-specific bodies** (CFO vs. Logistics Director text; not identical). Rewrite the merged hook with Steward-flavored copy
- Resolve path assumptions: hook scripts that `cd` to a surface or grep relative paths need to either work from repo root or get a wing argument
- **Settings split decision** (must decide as part of Phase 3): shared `settings.json` carries hook registrations and any team-wide defaults. `settings.local.json` (per-developer, gitignored) carries permissions and per-user overrides. Default: copy frontend's 5-event-type hook block into the new shared `settings.json`, copy the backend nudge into it as an additional matcher; nothing goes to `settings.local.json` from the merge itself
- Both surface `settings.json` files become empty/deleted at end of Phase 3
- **Verification:** trigger each registered hook event on a small edit; confirm all fire. Specifically test: `journal-nudge.sh` fires on session stop, `check-formatting.sh` fires on file save, guards block forbidden ops
- **Visibility checklist targets:** rewritten `journal-nudge.sh` (fresh persona-flavored copy) and the new root `settings.json`.

### Phase 4 — Rename and Move Records

This is the highest-churn phase. Net: ~170 files move + rename. **Counts (refreshed):**

- Rename `permits/` → `work-orders/`, `journals/` → `build-records/`, `inspections/` → `audits/` at root (vocabulary names final per Phase 0.5)
- Move **67 frontend permits, 38 backend permits, 1 root permit** into `/.claude/records/work-orders/`
- Move **58 frontend journals + 36 backend journals** into `/.claude/records/build-records/`
- Move **14 frontend inspections + 7 backend inspections** into `/.claude/records/audits/`
- File templates (`.shipping-order-template.md`, `.building-permit-template.md`, etc.) — pick the better one as basis, rename to `.work-order-template.md` etc., update terminology references inside the template body
- Historical files keep their filenames; the *folder* rename is the only change to their location. Their content uses old vocabulary; that's fine — they're historical
- **Atomic-commit requirement:** single commit must update **all three** dependencies together:
  1. `backend/tools/CaptainHook/PrePushPermitGate.php` **line 26** — `PERMIT_DIRECTORY` constant
  2. `backend/captainhook.json` **line 28** — `TEMPLATE_FILENAME` (`.shipping-order-template.md` → new template name from this phase's rename, e.g. `.work-order-template.md`)
  3. The records bulk move itself
  Splitting these into separate commits breaks the pre-push gate for everyone with a checkout against the split-commit range
- **Pre-Phase-4 artifact:** capture `git shortlog -sn -- .claude/records/` output from both surfaces *before* the move and file it as a permanent artifact in the Phase 4 Work Order. Aggregate ownership signals (`git shortlog`, blame heatmaps) reset on bulk moves; per-file `git log --follow` still traces history
- **In-flight ADR-0021 handling:** the BIO pulse and briefing record an ADR-0021 (phpstan-warroom-rules adoption) shipping order filed 2026-04-29, SOLDIER-READY but unexecuted. It currently lives at `backend/.claude/records/permits/`. Phase 4 will rename the folder + template + move the file; the order's *content* still calls itself a "shipping order." Subsequent records authored against it post-Phase-4 will reference it by name in new-vocabulary text, creating a documented vocabulary mismatch. **Recommended disposition:** land ADR-0021 (a half-day Engineer task) **before** Phase 4 begins to remove the only known in-flight cross-vocabulary reference. **Fallback:** accept the mismatch and call it out explicitly in Phase 8's drift log
- **Verification:** push a small change against a properly-filed work order; the gate must accept it. Run `cd backend && composer test:arch` to confirm no arch test trips
- **Visibility checklist targets:** renamed file templates only — historical record bodies are preserved as-is and don't need re-scanning.

### Phase 5 — Renumber and Consolidate ADRs

**ADR-0015 (ADR Governance) — Compliance Note:**

ADR-0015 is referenced in root `CLAUDE.md` **line 43**: *"Per **ADR-0015** (ADR Governance), BIO operates as the **ADR development laboratory** — full ADR content in sovereign numbering, not distilled projections."* Canonical text lives at `adrs.script.nl` (no local copy).

The published ADR-0015 lists `brick-inventory` as **one row** in its Implementation table and envisions **one** sovereign sequence at `docs/adr/` (singular path reference). BIO has always been a single territory in war-room doctrine — the laboratory exemption is granted to brick-inventory as a whole, not to its constituent surfaces.

**Conclusion: this renumbering is compliance restoration, not a doctrinal shift.** The pre-monorepo split into `backend/docs/adr/` (sequence 0001–0013) and `frontend/.claude/docs/decisions/` (sequence 001–016) was a structural artifact of the multi-repo architecture, never a doctrinally sanctioned dual sequence. Consolidation into one `/.claude/docs/adr/` sequence at the orchestrator root restores the single-sovereign-sequence shape ADR-0015 already envisions. The war-room ADR-0015 canonical page itself carries a stale "0001–0009" count and a `docs/adr/` path reference that will need updating to `/.claude/docs/adr/` (see Phase 8 W-3 follow-up).

**Renumbering execution:**

- Move all 13 backend ADRs (`backend/docs/adr/0001-…` through `0013-…`) and 16 frontend ADRs (`frontend/.claude/docs/decisions/ADR-001-…` through `ADR-016-…` — note FE numbering lacks leading zeros above 9; standardize to 4-digit) into `/.claude/docs/adr/`
- **Renumbering strategy:** chronological by adoption date (`Decided:` field in each ADR header). Each ADR gets a new 4-digit number `0001`–`0029`
- **Hard gate:** Phase 5 execution does not begin until **two artifacts** are committed to the Phase 5 Work Order:
  1. `ADR-mapping-table.md` — old-id → new-id table for all 29 ADRs, sortable, including each ADR's title and adoption date
  2. `rewrite-script-dryrun.diff` — output of the mechanical rewrite script run in dry-run mode, showing every file the script would touch and the textual change at each site
- For each renumbered ADR: update its own header, update every cross-reference inside other ADRs, and grep the codebase for ADR number mentions
- **Architecture test references:** primary site is `backend/tests/Architecture/ModelArchitectureTest.php` **lines 38, 49, 76** — references **ADR-0005 (no mass assignment) and ADR-0019 (Explicit Model Hydration)**. Also update **root `CLAUDE.md` line 43** which carries its own cross-reference list of 8 ADRs (0002/0004/0009/0011/0012/0014/0016/0019)
- **Overlap resolution:** ADRs that already overlap thematically (e.g., both surfaces have decisions about ADR governance) get a single consolidated record under the new number; the redundant ADR is marked Superseded with a pointer to the survivor
- **Verification:** every `rg "ADR-[0-9]{3,4}" -t md -t php -t ts -t vue` hit in the repo resolves to the new numbering. `cd backend && composer test:arch` and `cd frontend && npm run lint` still pass

### Phase 6 — Consolidate Domain Docs

**Root `/docs/` enumeration:**

| File | Disposition | Rationale |
|---|---|---|
| `docs/idea-vault.md` | **Leave** at `/docs/` | Working artifact for `brick-apprentice` skill; not Brickworks governance |
| `docs/monorepo-migration-plan.md` | **Leave** at `/docs/` | Historical migration plan; archive material |
| `docs/muse-ledger.md` | **Leave** at `/docs/` | Working ledger for "The Muse" allied agent from sister territory under war-room protocol; not Brickworks governance |
| `MERGER_PLAN.md` (this file) | **Move to `/docs/`** at Phase 8 | Becomes historical alongside `monorepo-migration-plan.md` |
| `MERGER_PLAN_REVIEW.md` | **Move to `/docs/`** at Phase 8 | Becomes historical alongside the plan |
| `vocabulary-lock.md` | **Move to `/docs/`** at Phase 8 | Historical decision artifact |

**Move into `/.claude/docs/`** (Brickworks governance):

- `ADR-000.md` — single merged version
- `decisions.md` — index of consolidated ADRs (rebuilt from Phase 5's mapping table)
- `learnings.md` — merged from both surfaces, deduped
- `pulse.md` — merged
- `inspector-casebook.md` (from frontend) → renamed `quality-warden-casebook.md` if Phase 0.5 vocabulary makes "inspector" wrong; otherwise stays
- `domain-map.md` (frontend) — kept; add a sibling `foundry-map.md` distilled from backend's department list in `backend/CLAUDE.md`
- `brand.md` (frontend) — design system
- `design-cycle.md` (frontend) — Pattern Master's protocol
- Frontend's 16 ADRs in `decisions/` subdir — already addressed by Phase 5 (the renumbered files land in `/.claude/docs/adr/`, this is a separate top-level reference doc move)

Surface-specific operational reference (Laravel patterns, Vue patterns, deptrac, etc.) **stays in the surface CLAUDE.md** — that's the "wing manual" role.

**Visibility checklist targets:** merged `learnings.md`, `inspector-casebook.md` / `quality-warden-casebook.md`, `domain-map.md`, `pulse.md` — FE-source concentration; highest re-leak surface in the whole merger.

### Phase 7 — Shrink the Wings

**Size baselines:** backend CLAUDE.md 508 lines, frontend CLAUDE.md 454 lines, root CLAUDE.md 221 lines. Expect the post-shrink wing files at ~200 lines each (operational manual only; persona + Operations Protocol go away).

**Hard rule:** each wing's CLAUDE.md rewritten in a *single commit*, so revert is one click. No incremental cleanup commits; the rewrite either lands clean or rolls back whole.

- Rewrite `backend/CLAUDE.md` as **The Foundry Wing** — a focused operational manual for the Laravel surface only. Strip the persona content (Logistics Director, Head Sorter, etc.), Operations Protocol (now at root), and ADR ledger table (now at root). Keep: warehouse departments map, coding conventions, machinery list, quality commands, deptrac boundaries
- Rewrite `frontend/CLAUDE.md` as **The Gallery Wing** — same approach. Keep: building structure, naming/imports, formatting standards, linting/TS strictness, complexity limits. Strip personas and Operations Protocol
- Delete `backend/.claude/` and `frontend/.claude/` after confirming all content has moved
- Delete the now-redundant `backend/docs/adr/` directory (content already moved to root in Phase 5)
- **Verification:** open a fresh terminal in the repo, run the relevant commands in each surface, follow the CLAUDE.md from cold; should be sufficient to do real work without bouncing to root for persona context
- **Visibility checklist targets:** rewritten `backend/CLAUDE.md`, `frontend/CLAUDE.md` — single-commit narrative reframing is a known re-leak vector.

### Phase 8 — File the Closing Build Record

**BIO-side deliverable:**

- File a `2026-XX-XX-form-the-brickworks.md` build record under the new `/.claude/records/build-records/` documenting the full migration: what moved, the ADR renumbering table, training proposals
- **Drift Log requirement:** dedicated section titled **"BE/FE Divergences Resolved"** listing every place the two source systems disagreed and which one was retained, with rationale. Examples to expect: which `adr-interrogator` framing won, which `journal-nudge.sh` copy survived, which `ADR-000.md` framing won, any conflicting conventions between the two CLAUDE.md files, the in-flight ADR-0021 vocabulary collision disposition (W-4). Silence here defaults to "the merger silently picked favorites and nobody knows why" — that's the failure mode
- The Steward (acting via CEO direction) appends an evaluation
- Move `MERGER_PLAN.md`, `MERGER_PLAN_REVIEW.md`, `MERGER_PLAN_WAR_ROOM_REVIEW.md`, and `vocabulary-lock.md` from repo root to `/docs/` as historical artifacts
- Update the original Phase 0 Work Order status to **Completed** via small follow-up PR (matches backend's ADR-0013 protocol for late status flips)

**War-room-side deliverable:**

The merger invalidates large portions of multiple war-room artifacts. Without a sibling deliverable in the war-room repo, war-room intelligence goes stale silently and the next muster reports false drift against actual BIO state. File `campaigns/brick-inventory-orchestrator/2026-XX-XX-brickworks-merger.md` in the war-room repo enumerating these edits:

| War-room file | What needs refresh | Owner |
|---|---|---|
| `registry/brick-inventory-orchestrator.md` | CLAUDE.md Inventory table (all 3 rows stale), Skills Inventory (6 rows; 2 adr-interrogators collapse to 1), Settings & Hooks, Territory-Specific Agents (5→3), Cross-Territory Observations | Adjutant — registry refresh mission |
| `.claude/agents/memory/briefings/brick-inventory-orchestrator.md` | Governance Model table (lines 184–188) — every persona name wrong; permit/journal path references invalidate | General — briefing refresh |
| `.claude/agents/memory/{cartographer,scout,liaison,sapper,quartermaster,warden,surveyor}/brick-inventory-orchestrator.md` | Persona-context language + path references partially stale | General — touched on next per-spy mission |
| `.claude/agents/memory/pulse/brick-inventory-orchestrator.md` | Historical rows preserve old vocabulary (correct); future rows use new vocabulary | No action — rolling artifact |
| War-room `CLAUDE.md` line 20 | "preserving self-contained accountability pipelines" clause becomes false post-Phase-2 | General — single-line edit |
| `presentation/decisions/adr-governance.md` line 261 | Path reference `docs/adr/` → `/.claude/docs/adr/`; stale "0001–0009" count → 0001–0029 | General — Implementation table edit |

Most of this absorbs into a single Adjutant registry-refresh mission plus a General briefing-refresh, both scheduled post-Phase-8.

## Critical Files

**Touched in every phase:** `/CLAUDE.md` (until Phase 1 lands), `/.claude/settings.json` (created Phase 3)

**Phase-specific high-leverage files:**

1. **`backend/tools/CaptainHook/PrePushPermitGate.php` line 26** — `PERMIT_DIRECTORY` constant. Atomic with Phase 4 records move.
2. **`backend/captainhook.json` line 28** — `TEMPLATE_FILENAME`. Atomic with Phase 4 template rename.
3. **`backend/tests/Architecture/ModelArchitectureTest.php` lines 38, 49, 76** — ADR-0005 and ADR-0019 string references. Phase 5.
4. **`backend/.claude/hooks/journal-nudge.sh`** AND **`frontend/.claude/hooks/journal-nudge.sh`** — different bodies (CFO vs Logistics Director persona content), both reference `permits/` and `journals/`. Phase 3 + Phase 4 coupled — rewrite with Steward-flavored copy AND update path references.
5. **`frontend/.claude/settings.json`** AND **`backend/.claude/settings.json`** — frontend 5 event types/8 registrations; backend 1 event type/1 registration. Merge target at root does not yet exist; Phase 3 creates it.
6. **Root `CLAUDE.md` line 43** — ADR cross-reference list (0002/0004/0009/0011/0012/0014/0016/0019). Phase 5 must update this; plan rev 1 didn't flag it.
7. **Root `CLAUDE.md` line 5** — existing "Brick Master" persona declaration. Phase 1 explicitly absorbs into The Steward.
8. **`Makefile` `hooks-install` + `init` targets** — wire `core.hooksPath .githooks`. Verify post-merger; not impacted directly but on the verification path.

## Verification Plan

End-to-end smoke test after Phase 7 completes, before Phase 8:

1. **Fresh-eyes test:** clone the repo into a scratch dir, open `/CLAUDE.md`, follow only what's written. A new contributor should understand The Brickworks and find their way into either wing without reading legacy docs
2. **Agent dispatch test (substantive):** invoke Brickwright on a real small backend task and a real small frontend task. Confirm it produces code that follows the wing's conventions in both cases. Token-budget gate: the merged agent file plus the wing CLAUDE.md it references must fit comfortably within agent context with room for working files
3. **Hook test:** trigger each registered hook event (PreToolUse, PostToolUse, SessionStart, Stop, SessionEnd). All fire correctly with Steward-flavored output where applicable
4. **Permit gate test:** push a >20-file commit against a properly-filed Work Order. `cd backend && composer test` and the pre-push gauntlet succeed
5. **ADR reference integrity:** `rg "ADR-[0-9]{3,4}" -t md -t php -t ts -t vue` returns only references that match the new numbering. Cross-check against the Phase 5 mapping table
6. **Build verification:** `make test` (root), `cd backend && composer test`, `cd frontend && npm run test:coverage && npm run build` all pass
7. **Hook installation:** `make init` on a fresh checkout still wires `core.hooksPath` correctly

## Open Risks

Each risk names an owner. The owner is responsible for the mitigation landing before the named phase begins.

1. **PrePushPermitGate downtime during Phase 4** — *Owner: Phase 4 PR author.* If records move before the gate config updates, pushes start failing for everyone with a checkout against the split-commit range. Mitigation: single atomic commit per Phase 4 spec above (records move + `PrePushPermitGate.php` line 26 + `captainhook.json` line 28).
2. **ADR cross-reference drift during Phase 5** — *Owner: Phase 5 PR author.* Mitigation enforced by Phase 5 hard gate: mapping table + dry-run diff committed first, then mechanical script execution; no by-hand rewrites.
3. **Loss of historical context and git-blame ownership signal on bulk move** — *Owner: Phase 4 PR author.* `git log --follow` works per-file; aggregate ownership signals (`git shortlog`, blame heatmaps) reset. Mitigation: capture `git shortlog -sn -- .claude/records/` artifact in Phase 4 Work Order before the move.
4. **Phase 7 wing rewrite is judgment-heavy** — *Owner: Phase 7 PR author.* Persona content and operational reference are tangled in both wings' CLAUDE.md files. Mitigation: single-commit-per-wing-rewrite rule so revert is one click; original files preserved in git history for clawback.
5. **Agent context-window bloat** — *Owner: Phase 2 PR author.* Merged Brickwright must carry both Laravel and Vue context plus reference both wing CLAUDE.md files. Token budget matters. Mitigation: write merged agent file with token budget in mind; verify via substantive task invocation in each wing.
6. **Phase 4→5 rollback path is unstated** — *Owner: CEO.* Rollback authorization is governance, not engineering. Mitigation: Phase 5 hard gate makes execution conditional on mapping-table + dry-run artifacts — if either fails review, Phase 5 simply doesn't start; Phase 4 stands as a complete shipped change.
7. **Persona drift was load-bearing, not accidental** — *Owner: CEO + Phase 7 PR author.* Backend's Logistics Director and frontend's CFO weren't identical because backend work isn't frontend work. The single-Steward bet assumes the differences were vocabulary, not substance. Mitigation: Phase 2 shadow-first deployment (new agents exist before old ones delete); substantive task verification catches if a merged agent fails on real work.
8. **ADR-0015 doctrine conflict** — *Owner: Phase 5 PR author.* Already resolved in this rev: ADR-0015's sovereign-numbering doctrine *authorizes* renumbering when two territories merge into one. The compliance note in Phase 5 carries the reasoning so reviewers don't re-litigate.
9. **`adr-interrogator` skill embeds identity** — *Owner: Phase 2 PR author.* The skill's framing isn't behavior-neutral; each version brands the repo. Mitigation: Phase 2 spec writes new neutral Brickworks framing rather than picking a winner.
10. **Public-`.claude/` ally-identifier re-leak** — *Owner: every Phase 2/3/4/6/7 PR author.* BIO `.claude/` has been publicly visible since 2026-05-06; doctrine requires the deny-corpus grep gate. Fresh narrative text (merged agents, rewritten hooks, merged learnings/casebook/domain-map, wing CLAUDE.md rewrites) is the highest re-leak surface. Mitigation: per-phase visibility checklist targets listed under each phase, run against war-room `registry/ally-identifiers.md`.
11. **War-room artifact staleness post-merger** — *Owner: Phase 8 PR author + Adjutant + General.* Registry, briefing, spy memory, war-room CLAUDE.md line 20, and war-room ADR-0015 page line 261 all go stale. Without a war-room-side campaign report, the next muster reports false drift against actual BIO state. Mitigation: Phase 8 enumerates the war-room edits and tags Adjutant + General for follow-up missions.
12. **In-flight ADR-0021 vocabulary collision** — *Owner: Commander.* The 2026-04-29 phpstan-warroom-rules shipping order is SOLDIER-READY but unexecuted; if it lands post-Phase-4, the order title carries old vocabulary while subsequent records reference it under new vocabulary. Mitigation: land ADR-0021 (half-day Engineer task) pre-Phase-4, OR accept the documented mismatch in Phase 8 drift log.

## Estimated Effort

- Phase 0 + 0.5 (paper trail + vocabulary lock): **2–3 hours**
- Phase 1 (root identity rewrite): **3–4 hours**
- Phase 2 (unified crew): **half day**
- Phase 3 (hooks + settings): **half day**
- Phase 4 (records move + atomic gate update): **0.5–1 day** — the move is mechanical; atomic-commit discipline slows it
- Phase 5 (ADR renumbering + cross-ref rewrite): **1 working day**, gated by mapping-table dry-run artifact landing first
- Phase 6 (docs consolidation): **half day**
- Phase 7 (wing rewrites): **0.5–1.5 days** — swing factor; 0.5 day if clean, 1.5 if clawback hits more than twice
- Phase 8 (closing build record + status flip): **half day**

**Total: 4–6 working days end-to-end**, assuming no rollback. Add 1 day per rollback event.

**War-room overhead:** +1 working day total
- W-3 war-room follow-up campaign + Adjutant registry refresh + General briefing refresh (post-Phase-8): **+half day**
- W-4 ADR-0021 land-first (if Commander chooses): **+half day** (pre-Phase-4)

**Plan revision overhead (rev 3 + rev 4):** ~1 hour — already absorbed.

**Grand total: 5–7 working days end-to-end** including the war-room follow-up campaign.
