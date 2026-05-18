# Merger Plan Review — War Room Perspective

**Reviewed:** `MERGER_PLAN.md` rev 2 (2026-05-18, 241 lines) — incorporates `MERGER_PLAN_REVIEW.md` punch list.
**Reviewer:** War Room (General). Independent of the lab review.
**Verdict (TL;DR):** **PROCEED WITH WAR-ROOM ADDITIONS.** The plan is structurally sound; the lab review caught the load-bearing factual drift and risk gaps. The war-room cost the plan does not yet price is *outside* BIO's repo — a registry refresh, a briefing refresh, partial spy-memory refresh, and a war-room CLAUDE.md edit must all land in the war-room repo after Phase 8. The plan also misses the visibility-sanitization gate (BIO `.claude/` has been publicly visible since 2026-05-06) and gets the ADR-0015 compliance argument right by accident — the framing should be tightened before Phase 5 ships.

---

## Scope of This Review (vs the Lab Review)

The lab already reviewed phasing, factual drift, vocabulary regression, ADR-0015 awareness, and risk imagination. **This review does not re-litigate any of that.** Where the war room is silent below, treat the lab's verdict as load-bearing.

The war-room-specific angles:

1. ADR-0015 doctrine read against the published page, independent of the plan's framing.
2. Cross-territory reference integrity — what in the war-room repo will break.
3. Spy / soldier infrastructure preservation — registry, briefing, spy memory, pulse.
4. Visibility classification — does the plan satisfy the public-`.claude/` sanitization gate?
5. Allied-agent protocol fidelity — Muse ledger handling.
6. War-room skill compatibility — `/sync`, `/muster`, `/intel`, `/return-to-base`.

---

## Finding W-1 — ADR-0015 Compliance Argument: Right Conclusion, Wrong Framing

**Severity:** MEDIUM (reframe before Phase 5 Work Order is filed)
**Plan reference:** Phase 5, lines 120–126

The plan's argument: "Pre-merger, BE was one territory (sequence 0001–0013) and FE was another (sequence 001–016). Post-merger, **The Brickworks is a single territory** — therefore it must have a single sovereign sequence."

**This misreads BIO's structure in war-room doctrine.** Per `presentation/decisions/adr-governance.md:75–86`, BIO has **always** been a single territory — the laboratory exemption is granted to **brick-inventory** as a whole, not to its constituent surfaces. The Implementation table at `adr-governance.md:261` lists `brick-inventory` as one row, not two. The published ADR-0015 envisions **one** sovereign sequence at `docs/adr/` (singular path reference, line 30 and line 86), currently stated as "0001–0009" (stale; actual count is 13 backend + 16 frontend = 29).

The pre-PR-28 two-sequence state was a structural accident of the multi-repo architecture — never doctrinally sanctioned as two sovereign sequences. The merger's renumbering is **compliance restoration**, not "two territories collapsing into one."

The plan's outcome is correct; the framing is not. Phase 5's compliance note should read:

> ADR-0015 grants BIO laboratory-exemption status with a *single* sovereign ADR sequence (per the Implementation table and the singular `docs/adr/` reference). The pre-monorepo split into `backend/docs/adr/` and `frontend/.claude/docs/decisions/` was an artifact of the multi-repo orchestrator architecture, not a doctrinally sanctioned dual sequence. Consolidation into one `/.claude/docs/adr/` sequence at the orchestrator root restores compliance with the laboratory-exemption shape ADR-0015 already envisions.

**War-room side effect not yet priced:** the canonical ADR-0015 page at `presentation/decisions/adr-governance.md:261` carries the line *"Laboratory exemption. Full ADR content in `docs/adr/` with sovereign numbering. War-room ADR cross-references in orchestrator CLAUDE.md."* — the path will need to update to `/.claude/docs/adr/` post-Phase-5. Add to the war-room follow-up work in Phase 8 (see W-3).

---

## Finding W-2 — Visibility-Sanitization Gate Missing

**Severity:** HIGH (governance gap — BIO `.claude/` is public)
**Plan reference:** absent

BIO is the **founding case** for war-room visibility hygiene doctrine. Per war-room `CLAUDE.md:53–63` and `registry/ally-identifiers.md`, every territory whose `.claude/` is publicly visible must satisfy the sanitization gate against `/registry/ally-identifiers.md`. The 2026-05-06 publication-readiness wave found 16 ally references in 11 frontend `.claude/` files; the Medic remediated HEAD in place. Sapper M8 on 2026-05-06 separately found a 1.2 MB / 84-file leak surface naming emmie/kendo/ublgenie/entreezuil + 4 PR numbers in a single permit + journal pair (pulse line 79).

The merger touches `.claude/**` in five phases:

| Phase | `.claude/**` action | Re-leak risk |
|---|---|---|
| 2 | New `agents/` + new `skills/` at root — merged from BE + FE sources | Inherits whatever ally references were redacted in the source files; new neutral framing pass may re-leak |
| 3 | New `hooks/` + new `settings.json` at root | `journal-nudge.sh` text rewrite re-introduces persona language; ally references unlikely but possible |
| 4 | ~170 records moved + 5 file templates renamed | Bulk action — any future permit or journal authored mid-migration could re-introduce ally identifiers |
| 6 | New docs at `/.claude/docs/` | `inspector-casebook` / `domain-map` / `learnings` merges from FE source where prior-redaction work was concentrated |
| 7 | Wing CLAUDE.md rewrites | Single-commit-per-wing rule (per lab) — narrative reframing can re-introduce identifiers |

**The plan does not mention this gate in any phase.** That's a war-room doctrine miss.

**Recommended fix:** Add to each affected phase's verification step:

> Run a deny-corpus grep against `/.claude/**` files touched in this phase (corpus at war-room `registry/ally-identifiers.md`). Zero hits required. Any hit gets redacted per the canonical redaction vocabulary before commit.

This is mechanical work — the deny-corpus list is short (5 private app names, 3 private orgs, 1 prefix family). A 30-second grep per phase. The cost of skipping it: a public-record leak that war-room doctrine was specifically authored to prevent.

---

## Finding W-3 — War-Room Artifact Refresh Cost Not Priced

**Severity:** MEDIUM (Phase 8 closing record incomplete without it)
**Plan reference:** Phase 8

Phase 8 plans for a closing build record inside BIO. It says nothing about the war-room repo. But the merger **invalidates large portions of multiple war-room artifacts**:

**`/registry/brick-inventory-orchestrator.md`** (Adjutant-maintained):
- *CLAUDE.md Inventory* table (3 rows, all 3 stale post-merger — root CLAUDE.md restructures, both wings shrink to ~200 lines)
- *Skills Inventory* table (6 rows — 2 adr-interrogators collapse to 1 root, frontend `minutes` moves, 3 orchestrator skills relocate beneath new identity)
- *Settings & Hooks* sections (entire structure changes — see Phase 3)
- *Territory-Specific Agents* (5 agents become 3, all renamed)
- *Cross-Territory Observations* (overlap analysis at registry lines 110–116 references "x2 adr-interrogator" — becomes ×1)

**`.claude/agents/memory/briefings/brick-inventory-orchestrator.md`** (General-maintained):
- Governance Model table at briefing lines 184–188 explicitly lists "Logistics Director → Head Sorter, Inventory Auditor" and "CFO → Lead Brick Architect, Building Inspector" — every persona becomes wrong
- All path references to `.claude/records/permits/` and `.claude/records/journals/` invalidate
- "E2E tooling: oxlint + oxfmt" subsection survives — operational rules untouched

**Spy memory** (per-spy, General-checked):
- 7 spy-memory files at `.claude/agents/memory/{spy}/brick-inventory-orchestrator.md` (cartographer, scout, liaison, sapper, quartermaster, warden, surveyor) each contain path references and persona-context language that will be partially stale
- Not blocking — spy memory is intentionally rolling — but the next spy mission per type will be reading stale context until refresh

**War-room `CLAUDE.md` line 20:**
> brick-inventory-orchestrator — ... Monorepo with `backend/` + `frontend/` subdirectories preserving self-contained accountability pipelines (interact via work orders, not deployment orders) ...

The "preserving self-contained accountability pipelines" clause becomes false post-Phase-2 (single Brickwright + single Steward replaces the two pipelines). Update needed.

**War-room ADR-0015 canonical page (`presentation/decisions/adr-governance.md:261`):** path reference `docs/adr/` → `/.claude/docs/adr/` (see W-1).

**Recommended fix:** Phase 8's closing build record's *"BE/FE Divergences Resolved"* drift log is filed in BIO. Add a sibling deliverable filed in the war-room repo — a campaign report at `campaigns/brick-inventory-orchestrator/2026-XX-XX-brickworks-merger.md` enumerating these war-room edits, with the Adjutant tagged for a registry refresh mission. Without this, the war-room sources of truth go stale silently and the next muster reports false drift against the actual BIO state.

---

## Finding W-4 — In-Flight ADR-0021 Shipping Order Collides With Phase 4

**Severity:** LOW (operational coordination, not blocking)
**Plan reference:** Phase 4 / pulse line 19, briefing line 109

The BIO pulse and briefing both record that an ADR-0021 (phpstan-warroom-rules adoption) shipping order was filed 2026-04-29 — SOLDIER-READY but unexecuted at last assessment (2026-05-01). It currently lives at `backend/.claude/records/permits/` and is named in the war-room intel report (`campaigns/war-room/2026-05-07-intel-pattern-analysis.md:97`).

Phase 4 will:
- Rename the *folder* (`permits/` → `work-orders/`)
- Possibly rename the *file template* the order was authored against (`.shipping-order-template.md` → `.work-order-template.md`)
- Move the file to `/.claude/records/work-orders/`

The order's **content** will still call itself a "shipping order" with "Logistics Director" / "Head Sorter" personas. The plan's "default: accept the sweep" position (line 52) handles this — historical records keep old vocabulary, only the folder rename happens. Fine.

But: any **subsequent journal/audit** filed against this order post-Phase-4 will reference the order by name in new-vocabulary text ("Work Order 2026-04-29-…"), creating a vocabulary mismatch between the order title and the references to it. Phase 8's drift-log section should call out this in-flight collision explicitly.

**Alternative disposition:** land ADR-0021 (a half-day Engineer task per intel report) **before** Phase 4 begins. Removes the only known in-flight cross-vocabulary reference. Recommended — not required.

---

## Finding W-5 — Muse Ledger Handling Correct

**Severity:** PASS (verification only)
**Plan reference:** Phase 6, line 148

Phase 6 marks `docs/muse-ledger.md` as "Leave at `/docs/` — working ledger for 'The Muse' allied agent from sister territory under war-room protocol; not Brickworks governance."

This is consistent with the 2026-03-25 war-room exception to allied-agent protocol: *"For ideation sessions where ideas belong to the target territory (not the lab), the Commander can direct the Muse to file its ledger in the target territory."* The original BIO Muse session (campaign `campaigns/brick-inventory/2026-03-25-muse-ideation-session.md`) applied this exception explicitly. **Pass — no action required.**

One adjacent note: the lab's allied-agent training-sovereignty rule (war-room `CLAUDE.md` § Allied Agent Deployment) says the lab governs Muse evolution. The plan does not modify the ledger format; it only leaves it at its current path. No conflict.

---

## Finding W-6 — War-Room Skills Compatibility

**Severity:** LOW (no breaking changes detected)
**Plan reference:** N/A — out of scope but worth confirming

I checked the four war-room skills that touch BIO state:

- **`/sync`** — operates on war-room + submodule git state. Path-agnostic. No impact.
- **`/muster`** — runs `check-artifacts.sh`, `check-candidates.sh`, `check-memory.sh`, `check-queue.py`. All operate on war-room paths (`reports/{territory}/...`, `.claude/agents/memory/...`, `.claude/agents/...`). Does not enter the BIO submodule. **Will continue to operate.** Note: muster reads the BIO briefing and spy memory — both go partially stale per W-3 — so muster will report nothing wrong, but its findings will be against stale snapshots until the briefing refreshes.
- **`/intel`** — mines pulse files and field reports in the war-room repo. Same path scope as muster. No breaking change.
- **`/return-to-base`** — branch-return + memory consolidation. Operates on the war-room and territory branches but not on `.claude/**` content shape. No breaking change.

**Pass — war-room skills survive the merger unchanged.** The BIO-local `back-to-baseplate` skill (per registry) is also unaffected — it lives in BIO and is being preserved through the merger.

---

## Where the General Disagrees With the Lab Review

Two mild disagreements. Neither is load-bearing.

**Lab review's vocabulary critique.** The lab argues for the trades vocabulary on Naming Doctrine grounds ("could belong to any project"). War room does not have a Naming Doctrine that applies to BIO sovereign vocabulary — BIO is the Commander's personal domain. The lab's argument is aesthetic-doctrine internal to the lab; it does not bind here. The CEO already picked from this session's AskUserQuestion. Plan rev 2's Phase 0.5 (vocabulary lock with the option to swap) is the right disposition — confirm the default, log the dissent, move on. **Do not re-deliberate.**

**Phase 0.5 risks being theatrical.** Plan rev 2 reads Phase 0.5 as a deliberation gate ("If Phase 0.5 swaps to trades..."). If the CEO has already decided this session — and the plan says "Default-going-in is the CEO's already-confirmed pick" — then Phase 0.5 is a *documentary* step, not a *decision* step. Frame it as such. Filing `vocabulary-lock.md` is the artifact; the decision already happened. Otherwise Phase 0.5 becomes a re-litigation invitation.

---

## Where the General Agrees With the Lab Review (Highlights)

- **The PrePushPermitGate atomic-commit insight is real.** Anyone reading the gate at `backend/tools/CaptainHook/PrePushPermitGate.php:26` understands the cost of splitting Phase 4. The plan author earned the lab's "PROCEED WITH MODIFICATIONS" verdict on this alone.
- **Persona-drift-was-load-bearing risk** is the highest-impact open question. The lab's framing ("backend work isn't frontend work") is exactly right. Phase 2's shadow-first deployment plus substantive verification handles it adequately, but watch for the merged Brickwright failing on real Vue work in a way the merged training didn't anticipate.
- **Phase 5 hard gate** (mapping table + dry-run diff committed before execution) is a doctrine-grade discipline. Adopt it for any future cross-territory renumbering work.

---

## Cross-References Likely to Break (War-Room Repo)

For the Phase 8 follow-up campaign report:

| File | Site | What breaks |
|---|---|---|
| `registry/brick-inventory-orchestrator.md` | Whole file (CLAUDE.md Inventory, Skills, Settings & Hooks, Agents, Observations) | Stale post-Phase-7 |
| `.claude/agents/memory/briefings/brick-inventory-orchestrator.md` | Governance Model table (lines 184–188) + persona references throughout | Stale post-Phase-2 |
| `.claude/agents/memory/{cartographer,scout,liaison,sapper,quartermaster,warden,surveyor}/brick-inventory-orchestrator.md` | Persona-context language + path references | Partial stale post-Phase-7 |
| `.claude/agents/memory/pulse/brick-inventory-orchestrator.md` | All log rows reference old persona names + folder names | Historical (preserve); future rows use new vocabulary |
| `CLAUDE.md` (war-room) | Line 20 — territory description | Stale post-Phase-2 |
| `presentation/decisions/adr-governance.md` | Line 261 (Implementation table) — `docs/adr/` path | Stale post-Phase-5 |

Most are absorbable in a single Adjutant registry-refresh mission plus a General briefing-refresh, both scheduled after Phase 8.

---

## Punch List (Additive to Lab's, Address Before Phase 0)

- [ ] **W-1.** Phase 5 compliance note reframed: BIO is one territory in war-room doctrine; the renumbering is compliance restoration of ADR-0015's single-sovereign-sequence shape, not a "two territories merging." Replace the plan's current Phase 5 framing (lines 120–126).
- [ ] **W-2.** Each phase touching `.claude/**` (Phases 2, 3, 4, 6, 7) adds a verification step: run deny-corpus grep against war-room `registry/ally-identifiers.md`, zero hits required before commit.
- [ ] **W-3.** Phase 8 adds a war-room-side deliverable: a campaign report enumerating the registry + briefing + spy-memory + war-room-CLAUDE.md + war-room-ADR-0015 edits required to bring war-room intelligence current with the post-merger BIO state. Tag the Adjutant for registry refresh and the General for briefing refresh.
- [ ] **W-4.** Phase 4 explicitly addresses the in-flight ADR-0021 shipping order: either land it pre-Phase-4 (recommended) or flag in Phase 8 drift log that "shipping order 2026-04-29-…" references in subsequent records carry old vocabulary intentionally.
- [ ] **W-5.** (Verification, no edit) — Confirm Muse ledger remains at `/docs/muse-ledger.md` per Phase 6, consistent with 2026-03-25 war-room exception.
- [ ] **W-6.** (Verification, no edit) — Confirm Phase 0.5 framing is documentary, not deliberative. The CEO has already chosen; the artifact records the choice and the dissent.

---

## Final Recommendation

**PROCEED WITH WAR-ROOM ADDITIONS.** Address W-1 and W-2 before Phase 0 (these change phase content). W-3 schedules war-room follow-up work and can be drafted alongside Phase 8. W-4 is operational coordination — Commander's call on sequencing. W-5 and W-6 are verifications, no edits.

The plan in rev 2 form is publication-ready for execution inside BIO. The gap is the war-room repo's view of BIO — that has to refresh after Phase 8 or the next muster will report drift it cannot self-correct.

**Estimated additional effort beyond the lab's estimate:**
- Plan revision (W-1, W-2 incorporation): **+30 minutes**
- W-3 war-room follow-up campaign + Adjutant registry refresh: **+half day** (post-Phase-8)
- W-4 ADR-0021 land-first (if Commander chooses): **+half day** (pre-Phase-4)

Total war-room overhead: **+1 working day** on top of the lab's 4–6-day estimate.
