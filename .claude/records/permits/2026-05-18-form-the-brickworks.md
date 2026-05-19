# Work Order: Form The Brickworks

**Work Order #:** 2026-05-18-form-the-brickworks
**Filed:** 2026-05-18
**Issued By:** CEO
**Assigned To:** The Steward (orchestrator-level; cross-wing)
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `form-the-brickworks`

> *Note on vocabulary:* this artifact uses the **new** Brickworks vocabulary (Work Order, Build Record, Audit, The Steward, etc.) even though the directory it lives in is still called `permits/`. The folder rename to `work-orders/` happens in Phase 4. Filing this artifact under the new vocabulary is intentional — it is the first record born under The Brickworks identity, and the rename will sweep its location, not its content.

---

## The Job

Consolidate the two parallel governance systems in this monorepo — **Brick & Mortar Associates** (frontend/) and **Stud & Sort Logistics** (backend/) — into a single company, **The Brickworks**, living at the orchestrator root. Reduce both surface directories to thin wing-manual shims. Establish one deputy (The Steward), one merged crew (Brickwright + Quality Warden + Pattern Master), one paper trail under new vocabulary (Work Order → Build Record → Audit), and one renumbered ADR sequence.

The full multi-phase runbook lives at `MERGER_PLAN.md` (rev 4) at the repo root. This Work Order authorizes execution.

## Scope

### In the Box

The 9 phases enumerated in `MERGER_PLAN.md`:

- **Phase 0** — This Work Order (paper trail established before structural work)
- **Phase 0.5** — `vocabulary-lock.md` documentary artifact at repo root
- **Phase 1** — Root `/CLAUDE.md` rewrite: Brick Master persona absorbed into The Steward; Brickworks Charter added; surface CLAUDE.md references reframed as wing manuals
- **Phase 2** — Unified crew at `/.claude/agents/` (brickwright, quality-warden, pattern-master) and unified skills at `/.claude/skills/` (adr-interrogator with new neutral framing, minutes, brick-apprentice, next-build)
- **Phase 3** — Hooks consolidated to `/.claude/hooks/`; root `/.claude/settings.json` created; surface settings emptied/deleted
- **Phase 4** — Records bulk move + folder rename (`permits/` → `work-orders/`, `journals/` → `build-records/`, `inspections/` → `audits/`) with atomic update of `PrePushPermitGate.php` constant + `captainhook.json` template name
- **Phase 5** — ADR renumbering: 13 backend + 16 frontend → single 0001–0029 sequence at `/.claude/docs/adr/`, gated by mapping table + dry-run diff artifacts
- **Phase 6** — Domain docs consolidated to `/.claude/docs/`; root `/docs/` files (idea-vault, monorepo-migration-plan, muse-ledger) leave in place
- **Phase 7** — Wings shrunk: `backend/CLAUDE.md` rewritten as Foundry Wing manual, `frontend/CLAUDE.md` as Gallery Wing manual; surface `.claude/` directories deleted
- **Phase 8** — Closing Build Record with BE/FE Divergences Resolved drift log; sibling war-room-repo campaign report tagging Adjutant + General for registry/briefing refresh; MERGER_PLAN.md and review docs moved to `/docs/`

### Not in This Box

- War-room-side artifact refresh (registry, briefing, spy memory, war-room CLAUDE.md line 20, war-room ADR-0015 page line 261) — Phase 8 enumerates the edits and tags owners (Adjutant + General); the actual edits happen in the war-room repo, not this one
- Landing the in-flight ADR-0021 (phpstan-warroom-rules) shipping order — Commander's call on whether to land pre-Phase-4 (recommended) or accept the documented vocabulary collision in Phase 8 drift log
- Re-litigating the vocabulary choice (CEO-confirmed this session; Phase 0.5 is documentary, not deliberative)
- Re-litigating ADR-0015 doctrine (compliance reframing established in rev 3; renumbering is restoration of the single-sovereign-sequence shape, not a doctrinal shift)

## Acceptance Criteria

The acceptance criteria embed the two review punch lists. Both reviews are resolved in rev 4 of the plan; the criteria below are the *execution* gates — each phase ships when its criteria are met.

### Lab Review Punch List (`MERGER_PLAN_REVIEW.md`)

- [ ] Record counts in Phase 4 reflect refreshed totals (67 FE permits / 38 BE permits / 58 FE journals / 36 BE journals / 14 FE inspections / 7 BE inspections)
- [ ] Phase 3 creates root `/.claude/settings.json` (does not exist pre-merger) and decides the shared-vs-local key split
- [ ] Phase 5 Work Order carries an ADR-0015 Compliance Note with quoted-passage evidence
- [ ] Phase 1 Work Order explicitly states the Brick Master persona disposition (absorb-into-Steward)
- [ ] Phase 6 enumerates the three root `/docs/` files (idea-vault, monorepo-migration-plan, muse-ledger) with explicit move/leave/delete decisions
- [ ] Open Risks list expanded with 4 named risks (agent context-window bloat, git-blame ownership loss, Phase 4→5 rollback authorization, persona-drift-was-load-bearing), each with an owner
- [ ] `vocabulary-lock.md` exists at repo root, dated, with CEO sign-off, recording chosen names and lab dissent
- [ ] Phase 2 Work Order specifies the merged `adr-interrogator` framing (new neutral Brickworks-flavored, not picking BE or FE winner)
- [ ] Phase 5 Work Order lists `ModelArchitectureTest.php` lines 38/49/76 referencing ADR-0005 and ADR-0019 (rev 1's ADR-0008 example corrected)
- [ ] Phase 5 hard gate: ADR-mapping-table.md and rewrite-script-dryrun.diff committed to the Phase 5 Work Order before execution
- [ ] Phase 8 closing Build Record contains a **BE/FE Divergences Resolved** drift log section

### War-Room Review Punch List (`MERGER_PLAN_WAR_ROOM_REVIEW.md`)

- [ ] W-1 — Phase 5 compliance note reframed as compliance restoration (BIO is one territory in war-room doctrine; pre-monorepo dual sequences were a structural artifact, not doctrinally sanctioned)
- [ ] W-2 — Each `.claude/**`-touching phase (2, 3, 4, 6, 7) runs the deny-corpus grep against war-room `registry/ally-identifiers.md` before commit; zero hits required
- [ ] W-3 — Phase 8 includes a sibling war-room-repo deliverable: campaign report at `campaigns/brick-inventory-orchestrator/2026-XX-XX-brickworks-merger.md` enumerating registry / briefing / spy-memory / war-room CLAUDE.md line 20 / war-room ADR-0015 page line 261 edits
- [ ] W-4 — Phase 4 explicitly addresses the in-flight ADR-0021 collision: either land it pre-Phase-4 (recommended) or document the vocabulary mismatch in Phase 8 drift log
- [ ] W-5 — `docs/muse-ledger.md` remains at `/docs/` per the 2026-03-25 war-room exception (verification only)
- [ ] W-6 — Phase 0.5 framed as documentary, not deliberative (CEO has chosen; the artifact records the choice)

### Phase-Completion Gates

- [ ] Phase 0 — This Work Order filed and committed to `main`
- [ ] Phase 0.5 — `vocabulary-lock.md` exists at repo root
- [ ] Phase 1 — Root `/CLAUDE.md` rewritten; substantive read-through confirms Brickworks Charter and wing-manual framing
- [ ] Phase 2 — All three merged agents invoke successfully on a real small task in their respective wings; visibility gate clean
- [ ] Phase 3 — Each registered hook event fires on a triggering edit; root `/.claude/settings.json` exists and is the source of truth; visibility gate clean
- [ ] Phase 4 — Push of a >20-file commit against this Work Order accepted by `PrePushPermitGate`; atomic commit lands records + gate constant + template-filename together; visibility gate clean
- [ ] Phase 5 — Mapping table + dry-run diff committed before execution; full repo grep for `ADR-[0-9]{3,4}` resolves to new numbering; backend `composer test:arch` and frontend `npm run lint` pass
- [ ] Phase 6 — Brickworks governance docs live at `/.claude/docs/`; root `/docs/` files in correct disposition; visibility gate clean
- [ ] Phase 7 — Both wing CLAUDE.md files rewritten in single commits each; surface `.claude/` directories deleted; `make test` + `cd backend && composer test` + `cd frontend && npm run test:coverage && npm run build` all pass; visibility gate clean
- [ ] Phase 8 — Closing Build Record filed at `/.claude/records/build-records/`; war-room sibling campaign report filed in war-room repo with Adjutant + General tagged; MERGER_PLAN.md, MERGER_PLAN_REVIEW.md, MERGER_PLAN_WAR_ROOM_REVIEW.md, vocabulary-lock.md moved to `/docs/`; this Work Order's status flipped to **Completed** via small follow-up PR per ADR-0013 protocol

## References

- **Plan:** `MERGER_PLAN.md` (rev 4) at repo root
- **Reviews:**
  - `MERGER_PLAN_REVIEW.md` — lab review (PROCEED WITH MODIFICATIONS verdict)
  - `MERGER_PLAN_WAR_ROOM_REVIEW.md` — war-room review (PROCEED WITH WAR-ROOM ADDITIONS verdict)
- **Predecessor permit:** `.claude/records/permits/2026-05-17-monorepo-migration.md` — the monorepo migration that made The Brickworks structurally possible
- **War-room doctrine:** ADR-0015 (ADR Governance), canonical at `adrs.script.nl/presentation/decisions/adr-governance.md`
- **Surface paper trails (frozen as Phase 4 input):**
  - `backend/.claude/records/permits/` — 38 shipping orders
  - `backend/.claude/records/journals/` — 36 shift logs
  - `backend/.claude/records/inspections/` — 7 audit reports
  - `frontend/.claude/records/permits/` — 67 building permits
  - `frontend/.claude/records/journals/` — 58 construction journals
  - `frontend/.claude/records/inspections/` — 14 inspection reports

## Notes from the Issuer

This is the second orchestrator-level Work Order ever filed. The first (`2026-05-17-monorepo-migration`) collapsed three repos into one and explicitly deferred `.claude/` consolidation to a "separate discussion" (see its `Not in This Box` section). This Work Order is that discussion, executed.

The plan went through two independent review passes (lab + war room) and four revs before this Work Order was filed. The CEO confirms the rev 4 plan represents the binding execution document; deviations from it during execution must be recorded in the closing Build Record's drift log alongside any BE/FE divergences resolved.

**Record-creation during execution:** the plan's default position is to *accept the sweep* — record creation in both surfaces remains unfrozen for the migration's duration. Phase 4 will move whatever exists at execution time. If volume becomes a problem (more than a handful of new records mid-flight), the Commander may issue a freeze directive at that point.

**War-room follow-up is owned by Adjutant and General**, not by The Steward. Phase 8's BIO-side deliverable enumerates the war-room edits required and tags those owners; the actual edits happen in the war-room repo on a separate mission cadence. The Steward's responsibility ends at filing the enumeration.

---

**Status:** In Progress
**Build Record:** _to be filed at `/.claude/records/build-records/` (under the new vocabulary post-Phase-4) after all phases ship_
