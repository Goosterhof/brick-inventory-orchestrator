# Merger Plan Review — The Brickworks

**Reviewed:** `MERGER_PLAN.md` (rev 2026-05-18, 154 lines)
**Reviewer:** Cross-laboratory technical review (recon + chaos stress-test + strategic audit)
**Verdict (TL;DR):** **PROCEED WITH MODIFICATIONS.** The phasing is sound and the enforcement call-outs prove the author has read the code. But the plan has two structural gaps (overlooks an existing root persona; ignores ADR-0015) and a vocabulary regression that, if shipped, locks in a duller terminology than the one it replaces. Address the punch list below before Phase 0; the rest can ship.

---

## Per-Phase Verdicts

| Phase | Verdict | Why |
|---|---|---|
| Phase 0 — File Merger Work Order | **PROCEED** | Paper-trail-first is correct. |
| Phase 1 — Brickworks Identity at Root | **REWORK** | Plan treats root CLAUDE.md as orchestrator-only; in reality it already names a "Brick Master" persona at line 5 and a sovereignty doctrine at line 47. Phase 1 *replaces* an existing identity, doesn't *add* one. Rewrite the phase brief to acknowledge what's there. |
| Phase 2 — Unified Crew | **VERIFY** | New: `adr-interrogator` drift is substantive (each version brands the repo differently as Brick & Mortar vs Stud & Sort) — merger is judgment, not dedupe. Specify which framing wins or whether neither survives. |
| Phase 3 — Hooks & Settings | **REWORK** | Plan assumes a root `/.claude/settings.json` exists. It does not — only `settings.local.json` does. Phase 3 must *create* root settings.json and decide the local vs. shared split. Asymmetric hook registrations (frontend: 5 event types / 8 hook registrations; backend: 1 event type / 1 registration) is non-trivial; both `journal-nudge.sh` copies have persona-specific bodies (CFO vs Logistics Director — not identical). |
| Phase 4 — Rename & Move Records | **PROCEED** with atomicity note | The atomicity call-out is correct. `PrePushPermitGate.php` line 26 hardcodes the path constant; commit must update PHP + json + records together. Plan undercounts records by +1 across all three categories (recent additions); refresh totals before kickoff. |
| Phase 5 — Renumber & Consolidate ADRs | **REWORK** | Plan never cites **ADR-0015 (ADR Governance)**, which declares BIO the "ADR development laboratory" with sovereign numbering. ADR-0015 either authorizes or forbids the renumbering — the plan must state which. Also: arch test references include **ADR-0005 and ADR-0019** (not only ADR-0008 as implied); root CLAUDE.md:43 carries its own ADR cross-ref list the plan never mentions. |
| Phase 6 — Consolidate Domain Docs | **VERIFY** | Three doc files at repo `docs/` (not `.claude/docs/`) are invisible to the plan: `idea-vault.md`, `monorepo-migration-plan.md`, `muse-ledger.md`. Either explicitly move them or explicitly leave them — silence is the failure mode. |
| Phase 7 — Shrink the Wings | **PROCEED** with vocabulary note | The "judgment-heavy" admission is honest. Add a hard rule: each wing's CLAUDE.md rewritten in a *single commit*, so revert is one click. Current sizes: backend 508 lines, frontend 454 lines, root 221 lines — useful budgeting baseline. |
| Phase 8 — Closing Build Record | **PROCEED** | Add a **drift log section**: every place the two source systems disagreed and which one was retained. Otherwise the merger silently picks favorites and nobody knows why. |

---

## Drift Between Plan and Reality

The plan's factual claims have shifted since it was authored. Numbers to refresh before kickoff:

| Plan claim | Actual |
|---|---|
| 66 frontend permits | **67** |
| 37 backend permits | **38** |
| 57 frontend journals | **58** |
| 35 backend journals | **36** |
| 13 frontend inspections | **14** |
| 6 backend inspections | **7** |
| Root `/.claude/settings.json` exists | **Only `settings.local.json` exists** |
| Backend ADRs `0001…0013` format | ✓ |
| Frontend ADRs `ADR-001…ADR-016` format | ✓ but no leading zeros above 9 |
| Arch test ADR refs (plan calls out ADR-0008) | Actual refs are **ADR-0005, ADR-0019** in `ModelArchitectureTest.php` |

Systematic +1 drift across all three record types suggests recent in-flight permits. **Recommendation:** as part of Phase 0, freeze record-creation in both surfaces for the duration of the migration, or accept that Phase 4's move will sweep up whatever is in flight at execution time.

---

## High-Leverage Files (Critical, Atomic Updates Only)

Verified via enforcement audit. These eight files must change together with the phases that move their dependencies:

1. **`backend/tools/CaptainHook/PrePushPermitGate.php` line 26** — `PERMIT_DIRECTORY` constant. Update in same commit as Phase 4 records move.
2. **`backend/captainhook.json` line 28** — `TEMPLATE_FILENAME` (`.shipping-order-template.md` → `.work-order-template.md` or whatever vocabulary survives Phase 5).
3. **`backend/tests/Architecture/ModelArchitectureTest.php` lines 38, 49, 76** — ADR-0005 and ADR-0019 string references. Phase 5.
4. **`backend/.claude/hooks/journal-nudge.sh`** AND **`frontend/.claude/hooks/journal-nudge.sh`** — different bodies (CFO vs Logistics Director persona content), both reference `permits/` and `journals/`. Phase 3 + Phase 4 coupled.
5. **`frontend/.claude/settings.json`** AND **`backend/.claude/settings.json`** — frontend registers 5 event types / 8 hook registrations; backend 1 event type / 1 registration. Merge target does not yet exist at root.
6. **Root `CLAUDE.md` line 43** — ADR cross-reference list (8 ADRs). Phase 5 must update this; plan didn't flag it.
7. **Root `CLAUDE.md` line 5** — existing "Brick Master" persona declaration. Phase 1 must consciously replace or absorb this.
8. **`Makefile` `hooks-install` + `init` targets** — wire `core.hooksPath .githooks`. Verify post-merger; not impacted directly but is on the verification path.

---

## Risks the Plan Did Not Imagine

The plan's Open Risks section is the weakest page. Add at minimum:

1. **Agent context-window bloat.** *Owner: Phase 2 lead.* The merged Brickwright must carry both Laravel and Vue context. If the agent file grows large enough to crowd out the working CLAUDE.md it references, agent quality drops. Mitigation: write the merged agent file with a token budget in mind, and verify by invoking it on small tasks in both wings (this is in the verification plan but not as a token-budget gate).
2. **Git-blame ownership signal loss.** *Owner: Phase 4 lead (the bulk-move PR author).* `git log --follow` works per-file, but aggregate ownership (`git shortlog -sn -- .claude/records/`) gets reset across the bulk move. If the team uses blame signals to route review, that signal degrades. Mitigation: capture `git shortlog -sn -- .claude/records/` output *before* the move and file it as a permanent artifact in the Phase 4 Work Order.
3. **No Phase 4→5 rollback path stated.** *Owner: CEO (rollback authorization is a governance call, not an engineering one).* Phase 4 is destructive at scale (165 files moved). Phase 5 is destructive at semantics (29 ADRs renumbered). The plan says "the renumbering table is critical" but doesn't make it a hard precondition. **Hard gate proposal:** Phase 5 cannot start until the full ADR-old-to-new mapping table is committed as an artifact, with the rewrite script's dry-run diff attached.
4. **Persona drift was load-bearing, not accidental.** Backend's Logistics Director and frontend's CFO weren't identical because backend work isn't frontend work. The plan assumes a single Steward over both — verify by running one merged-agent task in each wing *before* deleting the surface agents (Phase 2 does shadow first, which is good; the verification must be substantive, not symbolic).
5. **ADR-0015 conflict.** Already covered above — surfacing it here too because it's the highest-stakes unknown. ADR-0015 declares BIO the ADR development laboratory with sovereign numbering. If "sovereign" means "do not renumber for cosmetic consolidation," Phase 5 violates the very ADR governance protocol it's trying to consolidate. Read ADR-0015 in full before kickoff.
6. **The `adr-interrogator` skill embeds identity, not just behavior.** Each version brands the repo differently. Merging them is a values decision (which brand survives) before it's an engineering one.

---

## Vocabulary — The Chaos Monkey's Strongest Swing

The renamed vocabulary is the part of the plan that outlives the plan. Once "Work Order" is in 165 file paths and 100+ records, renaming back is a second tax. Decide once.

**Chaos Monkey verdict:** the new vocabulary **regresses** against the lab's own Naming Doctrine (which forbids names that "could belong to any project"). Specifically:

- **"Work Order"** could be in any ERP since 1985.
- **"Audit"** could be in any compliance product.
- **"The Steward"** is a fantasy archetype, not a job at a brickworks.
- **"Build Record"** is a warehouse-stock-room noun.

What was discarded had more grip:
- "Building Permit" evoked a specific kind of work site.
- "Construction Journal" implied a craftsperson writing in it.
- "Inspection Report" implied a human walking the floor.

**Reviewer's recommendation:** swap to the trades column below. The trades vocabulary signals "people doing skilled work in a specific place"; the plan's vocabulary signals "generic ERP product."

| Plan's pick | Reviewer's recommendation (trades) | Alternative (manufacturing) |
|---|---|---|
| Work Order | Commission | Production Order |
| Build Record | Workshop Log | Run Book |
| Audit | Inspection *(keeping the verb that survives the doctrine)* | Quality Audit |
| The Steward | The Foreman | The Master Mason |
| Brickwright | *(keep — already strong)* | *(keep)* |
| Quality Warden | Inspector *(matches Inspection above)* | Quality Master |
| Pattern Master | *(keep — strong)* | *(keep)* |

The Foreman + Brickwright + Inspector + Pattern Master reads as a job site. The Steward + Brickwright + Quality Warden + Pattern Master reads as a fantasy novel cast. Both are coherent, but they signal different things about who works here. The reviewer prefers the job site.

**CEO decision required:** confirm the trades recommendation, hold the plan's original vocabulary, or pick a third option. Whichever is chosen, record the choice and the rationale in a `vocabulary-lock.md` artifact at repo root — defaulting in silence is the failure mode.

---

## Recommended Sequence Adjustment

The plan's phase order is mostly correct. Two small moves:

1. **Add Phase 0.5 — Vocabulary Lock.** Before Phase 0's Work Order is filed, the CEO confirms the final vocabulary (with the regression discussion above in front of them). This decision is a one-way door and it deserves its own decision artifact, not a default inside Phase 0.
2. **Phase 5 hard gate.** Phase 5 does not begin execution until: (a) full ADR mapping table is committed as a separate artifact, (b) ADR-0015's stance on renumbering is explicitly addressed in the Phase 5 Work Order, (c) the rewrite-script dry-run diff is attached.

---

## What Surprised the Reviewer (in a good way)

One thing worth naming, because it's not common: the plan's **PrePushPermitGate atomic-commit call-out (plan line 85)**. Most refactoring plans treat enforcement code as "we'll update it when we get there." This plan names the specific gate, the specific path constant, and explicitly demands the records-move and the gate-update share a commit. That's the difference between a plan written by someone who read the code and a plan written by someone who skimmed the README. It's the reason this review ends in **PROCEED WITH MODIFICATIONS** rather than **REWORK**.

---

## Final Recommendation

**File the punch list below as the Phase 0 Work Order's acceptance criteria**, then proceed. The vocabulary decision is a one-way door; do not skip it.

**Estimated effort:**
- Plan revision (this punch list): **1–2 hours**.
- Phase 0–3 execution (paper trail + identity + crew + hooks): **~1 working day** total.
- Phase 4 execution (records move + atomic gate update): **0.5–1 day** — the move is mechanical; the atomic-commit discipline is what slows it.
- Phase 5 execution (ADR renumbering + cross-ref rewrite): **1 working day**, gated by the mapping-table dry-run artifact landing first.
- Phase 6–8 execution (docs + wing rewrites + closing record): **1–2 days** — Phase 7 wing rewrites are the swing factor; honest range is 0.5 day if it goes clean, 1.5 days if "claw back specifics" hits more than twice.
- **Total: 4–6 working days end-to-end**, assuming no rollback. Add 1 day per rollback event.

### Punch List (Address Before Phase 0)

- [ ] Plan totals updated: frontend permits 67, backend permits 38, frontend journals 58, backend journals 36, frontend inspections 14, backend inspections 7
- [ ] Phase 3 brief specifies: root `/.claude/settings.json` will be **created** (does not exist); decide which keys belong in `settings.json` vs `settings.local.json`
- [ ] Phase 5 brief contains a section titled "ADR-0015 (ADR Governance) — Compliance Note" stating whether ADR-0015 authorizes or constrains the renumbering, with a quoted passage from ADR-0015 as evidence
- [ ] Phase 1 brief contains a section titled "Existing Brick Master Persona" specifying one of: **keep / replace / absorb-into-Steward** — with the chosen verb stated explicitly
- [ ] Phase 6 brief enumerates `docs/idea-vault.md`, `docs/monorepo-migration-plan.md`, `docs/muse-ledger.md` and marks each: **move / leave / delete**
- [ ] Open Risks section expanded with 4 named risks: agent context-window bloat, git-blame ownership loss, Phase 4→5 rollback path, persona-drift-was-load-bearing — each with an owner
- [ ] `vocabulary-lock.md` exists at repo root, dated, with CEO sign-off; specifies the final names for the artifacts (Work Order / Build Record / Audit) and the roles (The Steward / Brickwright / Quality Warden / Pattern Master); states "Reviewer recommended trades vocabulary; CEO chose: ___"
- [ ] Phase 2 brief specifies which `adr-interrogator` framing survives (Brick & Mortar / Stud & Sort / new neutral framing)
- [ ] Phase 5 brief lists `ModelArchitectureTest.php` lines 38, 49, 76 referencing ADR-0005 and ADR-0019; plan's earlier ADR-0008 example replaced or supplemented
- [ ] Phase 5 brief includes a **hard gate**: "Execution does not begin until ADR-mapping-table.md and rewrite-script-dryrun.diff are committed to the Phase 5 Work Order"
- [ ] Phase 8 brief includes a **drift log requirement**: section in the closing build record titled "BE/FE Divergences Resolved" listing every place the two source systems disagreed and which won
