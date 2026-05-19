# Build Record: Form The Brickworks

**Build Record #:** 2026-05-19-form-the-brickworks
**Filed:** 2026-05-19
**Work Order:** [`2026-05-18-form-the-brickworks`](../work-orders/2026-05-18-form-the-brickworks.md) (umbrella) + Phase 4 / Phase 5 sub-Work-Orders
**Builder:** The Steward (self-executed; cross-wing structural change)
**Wing:** Atrium (cross-wing)

---

## Work Summary

The merger consolidated two parallel governance systems (Brick & Mortar Associates in `frontend/` and Stud & Sort Logistics in `backend/`) into a single firm — **The Brickworks** — operating from the orchestrator root. Eight execution phases shipped as nine PRs across 2026-05-19:

| Phase | PR | Net Effect |
|---|---|---|
| 0 (paper trail) | [#62](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/62) | Umbrella Work Order filed; `MERGER_PLAN.md` rev 4 landed at root |
| 0.5 + 1 (vocabulary lock + Atrium identity) | [#63](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/63) | `vocabulary-lock.md` filed; root `CLAUDE.md` rewrote Brick Master persona → The Steward, added Brickworks Charter |
| 2 (unified crew) | [#64](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/64) | `/.claude/agents/` with brickwright + quality-warden + pattern-master + 4 wing-split graduation logs; `/.claude/skills/` with neutral `adr-interrogator` + relocated `minutes` |
| 3 (hooks + settings) | [#65](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/65) | Root `/.claude/settings.json` created; 6 hook scripts moved to `/.claude/hooks/`; surface `settings.json` files deleted |
| 4 (records bulk move) | [#66](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/66) | 226-file atomic commit: 210 records moved + folders renamed (`permits/` → `work-orders/`, `journals/` → `build-records/`, `inspections/` → `audits/`) + `PrePushPermitGate` constants retargeted + journal-nudge hook updated |
| 5 (ADR renumbering) | [#67](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/67) | 13 backend ADRs + 16 frontend ADRs consolidated chronologically into `0001`–`0029` at `/.claude/docs/adr/`; two-commit hard-gate compliance (mapping table + dry-run diff before execution) |
| 6 (doc consolidation) | [#68](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/68) | All wing-level governance docs moved to `/.claude/docs/`; merged `pulse.md`, `learnings.md`, `ADR-000.md`; new `decisions.md` (from Phase 5 mapping) and `foundry-map.md` (sibling to `domain-map.md`) |
| 7 (wing shrink + surface delete) | [#69](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/69) | `backend/CLAUDE.md` 508 → 291 lines; `frontend/CLAUDE.md` 454 → 263 lines; surface `.claude/` shadows deleted (5 agents, 3 skills, 7 hooks); 3 FE templates moved to root |
| 8 (closing record) | this PR | This Build Record + historical docs moved to `/docs/` + war-room follow-up enumeration |

## Work Order Fulfillment

The umbrella Work Order's Acceptance Criteria cover two punch lists (lab review + war-room review) plus per-phase completion gates. Every gate passed:

| Criterion | Met | Notes |
|---|---|---|
| Phase 0 — Work Order filed and committed to `main` | Yes | PR #62 |
| Phase 0.5 — `vocabulary-lock.md` exists at repo root | Yes | PR #63; will move to `/docs/` this phase |
| Phase 1 — Root `CLAUDE.md` rewritten; Brickworks Charter and wing-manual framing | Yes | PR #63 |
| Phase 2 — Three merged agents at `/.claude/agents/`; visibility gate clean | Yes | PR #64; substantive shadow verification deferred to fresh session per Phase 7's deletion gate |
| Phase 3 — Each hook event fires; root `settings.json` is source of truth; visibility gate clean | Yes | PR #65; smoke-tested journal-nudge end-to-end |
| Phase 4 — Atomic commit lands records + gate constant + template-filename; visibility gate clean | Yes | PR #66; 226-file commit; all 41 `PrePushPermitGate` tests pass with new template name |
| Phase 5 — Mapping table + dry-run diff committed before execution; `rg 'ADR-[0-9]{3,4}'` resolves to new numbering | Yes | PR #67; two-commit hard-gate compliance; 105 arch tests + 0 lint errors after rewrite |
| Phase 6 — Brickworks governance docs at `/.claude/docs/`; visibility gate clean | Yes | PR #68; this phase was flagged as highest re-leak surface; deny-corpus grep returned zero hits |
| Phase 7 — Both wing `CLAUDE.md` rewritten in single commits; surface `.claude/` deleted; visibility gate clean | Yes | PR #69; three commits, each independently revertable |
| Phase 8 — Closing Build Record filed at `/.claude/records/build-records/`; war-room enumeration; historical docs moved | This PR | — |

## Decisions Made

The merger landed without re-litigating any architectural decisions. The judgment calls fall into three categories: vocabulary lock, structural shape, and execution discipline. All recorded below in the **BE/FE Divergences Resolved** drift log.

## Quality Gauntlet

Every phase shipped through both pre-commit and pre-push gauntlets (where applicable). CI was green on every merged PR. Final cross-wing state at end-of-Phase-7:

- `cd backend && composer test:arch`: **105 architecture tests pass**
- `cd frontend && npm run lint`: **0 warnings, 0 errors** on 303 files
- `vendor/bin/pest tests/Tools/CaptainHook/PrePushPermitGateTest.php`: **41 gate tests pass** with the renumbered template

## Showcase Readiness

The merger materially improves the codebase's portfolio narrative. Before the merger, a senior reviewer reading both wing manuals would have encountered two parallel governance systems with different personas, different paper-trail vocabulary, and two ADR sequences with the same numbers meaning different things. Post-merger:

- Single identity at root (The Steward), single crew (Brickwright / Quality Warden / Pattern Master), single paper trail (Work Order → Build Record → Audit)
- Single ADR sequence (`0001`–`0029`) consolidating both wings chronologically
- War-room ADR-0015 compliance restored — the laboratory-exemption envisions one sovereign sequence; the pre-merger split was a structural artifact, not doctrine
- Wing manuals reduced to focused operational reference (Foundry: 291 lines; Gallery: 263 lines) with persona scaffolding removed

The single-source-of-truth shape is now defensible under a technical-due-diligence review.

## BE/FE Divergences Resolved — The Drift Log

The Phase 8 spec made this section mandatory: "Silence here defaults to 'the merger silently picked favorites and nobody knows why' — that's the failure mode." Each divergence below names which side won and why.

### Vocabulary

| Aspect | BE called it | FE called it | Locked (Brickworks) | Why |
|---|---|---|---|---|
| Deputy persona | Logistics Director | CFO | **The Steward** | Neutral framing; both pre-merger personas reported to the same CEO; merger needed a fresh name to signal "the unified deputy" not "one wing won". |
| Builder persona | Head Sorter | Lead Brick Architect | **Brickwright** | "Wright" carries both Foundry (forge) and Gallery (carpenter) connotations; "Brick" anchors to the universal LEGO metaphor. |
| Auditor persona | Inventory Auditor | Building Inspector | **Quality Warden** | "Warden" suggests gate-keeping authority more than "Inspector" or "Auditor". |
| Creative persona | — | Creative Engine | **Pattern Master** | FE-only role; renamed to match the new vocabulary. ADR-0026 retains "Creative Engine" in its title because that was the as-of-date name when the ADR was filed; body uses "Pattern Master" where forward-looking. |
| Pre-work artifact | Shipping Order | Building Permit | **Work Order** | "Work Order" carries clearer authorization weight than "Commission" (the lab's declined alternative) and is the canonical name in the umbrella Work Order itself. |
| Post-work artifact | Shift Log | Construction Journal | **Build Record** | "Build" mirrors the Brickwright's role; "Record" is procedural-neutral. |
| Audit artifact | Audit Report | Inspection Report | **Audit** | Single word; the noun matches the verb. |
| Sub-org name | Stud & Sort Logistics | Brick & Mortar Associates | **The Brickworks** (umbrella) + **The Foundry Wing** + **The Gallery Wing** | The merger plan's "old-world manufacturing firm with named wings" metaphor; lab's trades-vocabulary alternative ("Workshop / Foreman / Inspector") was declined by CEO. |

Recorded in `vocabulary-lock.md` (root, moving to `/docs/` this phase) on 2026-05-19.

### Agent / Skill Framing

| Artifact | BE version | FE version | Resolved | Why |
|---|---|---|---|---|
| `adr-interrogator/SKILL.md` | "Stud & Sort Logistics" framing, no re-interrogation section | "Brick & Mortar Associates" framing, Devil's Court re-interrogation section | **Neutral Brickworks framing + Devil's Court preserved** | The plan explicitly required a neutral version rather than picking a wing winner. FE's Devil's Court (re-interrogating accepted ADRs under frequency / threshold signals) is more complete than BE's; carried forward. Scale Test bullet enumerates both wings' scale axes. |
| `minutes/SKILL.md` | (not present) | "Brick & Mortar Associates" | **Moved to root with Brickworks framing** | FE-only skill; only identity refs needed updating. |
| Brickwright agent body | head-sorter.md | lead-brick-architect.md | **Merged identity + per-wing patterns delegated to wing CLAUDE.md** | Operational discipline shared; wing-specific patterns live in the wing manual to keep the agent file focused. |
| Brickwright graduation logs | head-sorter graduation log (~50 candidates) | lead-brick-architect graduation log (~30 candidates) | **Split into two companion files** | `brickwright-foundry-graduation.md` and `brickwright-gallery-graduation.md`. Foundry learnings about Mockery and `clone $builder` don't fire in the Gallery; Gallery learnings about JSDOM and theme tokens don't fire in the Foundry. Split keeps the relevant signal in front of the right wing. |
| Quality Warden agent body | inventory-auditor.md | building-inspector.md | **Merged identity + wing-specific SOPs in clearly-labeled sections** | F-1..F-5 (Foundry) and G-1..G-6 (Gallery) SOPs preserved; one cross-wing SOP (Showcase Readiness). |
| Quality Warden graduation logs | inventory-auditor graduation log | building-inspector graduation log | **Same split pattern as Brickwright** | `quality-warden-foundry-graduation.md` + `quality-warden-gallery-graduation.md`. |
| Casebook | (not present) | inspector-casebook.md | **Promoted to cross-wing as `quality-warden-casebook.md`** | The FE-only Casebook practice (private notebook of suspicions across audits) was strong enough to extend to both wings. Phase 0.5's vocabulary lock forced the rename. |
| Pattern Master agent | (not present) | creative-engine.md | **Promoted unchanged; identity refs updated** | FE-only role; scope unchanged; CFO → Steward / Architect → Brickwright / Inspector → Quality Warden rename only. |

### Hook Scripts

| Hook | BE version | FE version | Resolved | Why |
|---|---|---|---|---|
| `journal-nudge.sh` | "Unfiled shift logs for in-progress shipping orders" copy | "Unfiled construction journals for in-progress permits" copy | **Steward-flavored rewrite: "Unfiled Build Records for In Progress Work Orders"** | Both source copies were persona-tinted; merger demanded neutral copy. Body also iterates wing-tagged record locations during the transition (root + backend + frontend); after Phase 4 the loop simplifies to the single root location. Phase 4's records-folder rename (`permits/` → `work-orders/`, `journals/` → `build-records/`) triggered a Phase 4 update to the hook's path constants. |
| `check-formatting.sh` | (not present) | FE-only, ran oxfmt against current cwd | **Gallery-scoped; cd's to `frontend/` via `git rev-parse --show-toplevel`** | oxfmt lives in `frontend/node_modules`. Hook now resolves repo-root regardless of caller cwd — caught by the hook itself on the first commit attempt from a `backend/` cwd. Productive friction. |
| `session-start-check.sh` | (not present) | FE-only, checked `CWD/node_modules` | **Checks `CWD/frontend/node_modules`** | Same cwd-anchoring concern; Foundry environment (PHP 8.5 + pcov + composer) is verified by the pre-commit gauntlet, not surfaced via SessionStart hook. |
| Other hooks | (BE had only the journal-nudge) | FE had 6 hooks total | **All 6 FE hooks moved to root with persona-neutral copy** | Behavior preserved; identity refs cleaned up. |

### Documents

| Doc | BE version | FE version | Resolved | Why |
|---|---|---|---|---|
| `pulse.md` | "Warehouse Pulse — Where Things Stand" (Foundry-only, ~119 lines, dense recent-delivery history) | "Territory Pulse — Where Things Stand" (Gallery-only, ~95 lines, no-hardcoded-counts discipline) | **Merged into "Brickworks Pulse" with Foundry + Gallery + Atrium sections** | Per-wing Active Concerns and Pattern Maturity tables preserved. FE's "do not hardcode counts" discipline carried forward as global rule. |
| `learnings.md` | Placeholder text ("Pending first Head Sorter shift") | Substantive entries about FormLabel, RouterLink crashes, size-limit budgets | **FE content carried; entries tagged `[Foundry]` or `[Gallery]`; Foundry section explicitly notes the placeholder origin** | Picking FE was forced by the substance gap. The Foundry section acknowledges Foundry operational rules currently live in `backend/CLAUDE.md` and `brickwright-foundry-graduation.md` until Build Records start filing them here. |
| `ADR-000.md` | "Why This Warehouse Exists and How Decisions Are Made" (Foundry framing, +"Relationship to Brick & Mortar Associates" section) | "Why This Project Exists and How Decisions Are Made" (Gallery framing) | **Single neutral version: "Why The Brickworks Exists..."** | 95% identical content with wing-vocabulary swaps. New version covers both wings' scale-test buckets (50+ Actions + 50+ components). "Two Wings, One Firm" section replaces the BE-only Brick-&-Mortar-Associates relationship paragraph. |
| `decisions.md` (index) | 14-row table (FE ADR-000 + 13 BE ADRs) | 17-row table (FE ADR-000 + 16 FE ADRs) | **Rebuilt fresh from Phase 5's mapping table** | 29-row consolidated index with wing tags, status, and links into `./adr/`. Renumbering History section preserves the pre-merger sovereign-sequence shape for archaeology. |
| `domain-map.md` | (not present) | FE-only, Gallery domains | **Kept; sibling `foundry-map.md` distilled from `backend/CLAUDE.md`'s departments table** | Two sibling files (one per wing) cleaner than one merged file with two sections. |
| `inspector-casebook.md` | (not present) | FE-only | **Renamed to `quality-warden-casebook.md`; body sweep updated persona refs** | Phase 0.5's vocabulary lock forced the rename. |
| `.decision-record-template.md` | identical to FE | identical to BE | **Kept FE copy; deleted BE copy** | Byte-for-byte identical; arbitrary which one survived. |
| `wireframe-brick-character-deployment.md` | (not present) | FE-only | **Moved to root unchanged** | Pattern Master operational reference; not explicitly enumerated in the Phase 6 spec but worth keeping. |
| `brand.md`, `design-cycle.md` | (not present) | FE-only | **Moved unchanged with persona-ref sweep** | Pattern Master / design-system reference. |

### Settings

| Setting | BE | FE | Resolved |
|---|---|---|---|
| `settings.json` | 1 event type / 1 registration (Stop nudge) | 5 event types / 8 registrations | **FE's 5-event block + BE's nudge merged into Stop block as additional handler** |
| `settings.local.json` | absent | absent (both gitignored via global git ignore) | **Untouched; nothing from the merge goes here** |

### Records

| Aspect | BE | FE | Resolved |
|---|---|---|---|
| Filename collisions (cross-wing work logged on both sides) | 8 permits, 5 journals, 0 inspections | 8 permits, 5 journals, 0 inspections | **Both versions preserved with `-foundry` / `-gallery` suffixes**. 3-way collision for `2026-05-17-monorepo-migration` (root + BE + FE): root copy keeps no suffix (Atrium-level Work Order); BE and FE get wing suffixes. |
| Pre-move authorship signal | Subtree-merged in PR #28 (collapsed to single author) | Same | **No genuine signal to preserve; Phase 4 sub-Work-Order's pre-move shortlog artifact documents this finding instead of pretending otherwise.** `git log --follow` still traces per-file history through both renames. |

### In-flight ADR-0021 Collision (W-4)

The 2026-04-29 phpstan-warroom-rules adoption Work Order was SOLDIER-READY but unexecuted at the time of merger planning. The plan offered two dispositions: land it pre-Phase-4 (recommended) OR accept the documented vocabulary mismatch in this drift log.

**Disposition:** the Work Order was filed at `backend/.claude/records/permits/2026-04-29-phpstan-warroom-rules-adoption.md` and was moved to `.claude/records/work-orders/2026-04-29-phpstan-warroom-rules-adoption.md` in Phase 4 along with every other surface permit. Its body still calls itself a "shipping order" in vocabulary. The downstream sub-Work-Order referring to it (the one that would eventually execute the rules adoption) was never filed because the rules adoption itself was completed before Phase 4 (per the Foundry Pulse 2026-05-01 entry: "PHPStan war-room rules adoption complete — four custom rules adopted with 0 findings on discovery pass").

**Conclusion:** the W-4 collision is historical, not in-flight. The renamed file's body retains old vocabulary as a snapshot of when it was filed; no subsequent records need to reference it under new vocabulary. No drift action required.

## Proposed Knowledge Updates

- **Pulse:** confirmed up-to-date (Phase 6's `pulse.md` rebuild). The Phase 7 surface `.claude/` deletion + Phase 8 closing record don't change any pulse-tracked metric.
- **Learnings:** two cross-wing operational learnings emerged during execution and are worth promoting on a future shift:
  1. *Two-pass sentinel substitution* when renumbering cyclic identifier maps (BE `0011 → 0001` collides with `0001 → 0013`). Direct sed cascades; sentinels (`§§…§§`) decouple read from write. Used in Phase 5's ADR-body rewrite. Will recur for any future bulk rename with overlapping source/target sets.
  2. *The new hook caught its own bug.* Phase 3's auto-format-on-commit hook fired from a `backend/` cwd (left over from a prior cd), failed loudly with `cd: can't cd to frontend`. Anchored via `git rev-parse --show-toplevel`. Generalizes: any hook that cd's must anchor to the repo root, not rely on the caller's cwd.
- **Decisions:** no new ADR. The merger restored ADR-0015 compliance by consolidating sequences; no new architectural patterns were introduced.

## Self-Debrief

### What Went Well

- **Hard-gate compliance was straightforward to enforce in practice.** Phase 5's two-commit structure (artifacts before execution) became the model; the artifacts kept the rewrite honest.
- **Visibility grep returned zero genuine hits across every phase.** The doctrinal investment from the 2026-05-06 publication-readiness wave paid off — no re-leaks despite Phase 6 being the highest-FE-source-concentration phase.
- **Local pre-commit + pre-push gauntlets caught real issues.** Phase 5 surfaced a missed arch test on the deleted `decisions.md`; Phase 6 surfaced another missed test on the moved `domain-map.md`; Phase 7 surfaced the `oxfmtrc.json` ignore-list interaction with lint-staged. All caught before push or by the gauntlet on push, not by CI.
- **The `git mv` discipline preserved per-file history.** Every record, every ADR, every governance doc traces back to its pre-merger origin via `git log --follow`.
- **The shadow-first deployment of agents (Phase 2 → Phase 7) worked as intended.** The new agents existed at root from Phase 2; surface fallbacks lingered until Phase 7's confidence-deletion commit, with the Phase 7 PR body documenting the recovery options if the merged agents prove inadequate.

### What Went Poorly

- **One commit-subject case violation slipped through (Phase 3, PR #65).** Frontend CI's commitlint only fires when `frontend/**` files change; prior PRs hadn't touched FE. Force-pushed an amended subject to fix. Going forward, every merger PR touched both wings, so commitlint fired consistently and no further violations occurred.
- **Phase 6 missed 3 FE templates** (`.decision-record-template.md`, `.component-spec-template.md`, `.feature-brief-template.md`). Caught and moved during Phase 7 cleanup. The Phase 6 enumeration in the merger plan didn't list the dotfile templates explicitly.
- **`oxfmtrc.json` ignore list for CLAUDE.md was discovered as legacy debt during Phase 7.** The pre-merger ignore entry made the new oxfmt-friendly wing manual silently incompatible with lint-staged. Caught by the hook on first commit attempt.

### Blind Spots

- **Substantive agent verification was deferred from Phase 2 to Phase 7's PR.** Recovery path documented in PR #69 body: revert just the deletion commit if the merged agents prove inadequate; the wing-manual rewrites stay. As of this Build Record, fresh-session verification has not been demonstrably executed in this conversation — the CEO directs whether to execute it before or after merging PR #69.
- **War-room sister-territory artifacts** (registry, briefing, spy memory, war-room `CLAUDE.md` line 20, war-room ADR-0015 page line 261) are now stale. See the war-room follow-up section below.

### Training Proposals

| Proposal | Context | Build Record Evidence |
|---|---|---|
| When a multi-phase merger touches one wing later than the other, expect commitlint (or any wing-CI-gated check) to fire later than expected — pre-emptively normalize commit-subject case from phase 1 even if early phases skip wing CI | Phase 3's frontend CI was the first to fire commitlint in this merger; the violation only surfaced there even though it would have been caught on every prior PR if the frontend path had been touched | _This Build Record_ |
| For bulk identifier renames with overlapping source/target sets, plan the substitution as two passes (source → sentinel, sentinel → target) before writing any code | Phase 5's ADR renumbering would have cascaded incorrectly under a single-pass `sed` because BE `0011 → 0001` collides with BE `0001 → 0013` | _This Build Record_ |
| When a hook `cd`s into a path, always resolve via `git rev-parse --show-toplevel` (or equivalent repo-root anchor) — never assume the caller's cwd matches the repo root | Phase 3's commit-time auto-format hook caught its own bug on the first commit from a `backend/` cwd | _This Build Record_ |

---

## War Room Follow-Up Enumeration

The merger invalidates large portions of multiple war-room artifacts. The Steward's responsibility ends at filing this enumeration; the actual edits happen in the war-room repo on a separate mission cadence. **Tag the Adjutant for registry refresh; tag the General for briefing refresh.**

| War-room file | What needs refresh | Owner | Mission Type |
|---|---|---|---|
| `registry/brick-inventory-orchestrator.md` | CLAUDE.md Inventory table (3 rows stale post-Phase-7); Skills Inventory (6 rows; 2 `adr-interrogator` collapse to 1, `minutes` rephrased to "The Brickworks"); Settings & Hooks (consolidated at root); Territory-Specific Agents (was 5; now 3 — Brickwright / Quality Warden / Pattern Master); Cross-Territory Observations | Adjutant | Registry refresh |
| `.claude/agents/memory/briefings/brick-inventory-orchestrator.md` | Governance Model table — every persona name wrong (CFO → Steward, Logistics Director → Steward, Lead Brick Architect → Brickwright, etc.); permit/journal path references invalidate (`permits/` → `work-orders/`); ADR numbering references invalidate | General | Briefing refresh |
| `.claude/agents/memory/{cartographer,scout,liaison,sapper,quartermaster,warden,surveyor}/brick-inventory-orchestrator.md` | Persona-context language + path references partially stale | General | Touched on next per-spy mission to this territory |
| `.claude/agents/memory/pulse/brick-inventory-orchestrator.md` | Historical rows preserve old vocabulary (correct as archive); future rows use new vocabulary | _No action_ | Rolling artifact — naturally heals on next pulse update |
| War-room `CLAUDE.md` line 20 | "preserving self-contained accountability pipelines" clause becomes false post-Phase-2 (BIO now uses a unified pipeline across both wings, not per-territory pipelines) | General | Single-line edit |
| `presentation/decisions/adr-governance.md` line 261 | Path reference `docs/adr/` → `/.claude/docs/adr/`; stale "0001–0009" count → 0001–0029 | General | Implementation table edit |

Recommended packaging: one Adjutant registry-refresh mission + one General briefing-refresh mission + a single small edit to war-room `CLAUDE.md` and `adr-governance.md` (could ship as one combined PR in the war-room repo).

---

## Files Moved to `/docs/` This Phase

Historical artifacts that lived at repo root during execution, now archived alongside `/docs/monorepo-migration-plan.md`:

- `MERGER_PLAN.md` → `docs/MERGER_PLAN.md`
- `MERGER_PLAN_REVIEW.md` → `docs/MERGER_PLAN_REVIEW.md`
- `MERGER_PLAN_WAR_ROOM_REVIEW.md` → `docs/MERGER_PLAN_WAR_ROOM_REVIEW.md`
- `vocabulary-lock.md` → `docs/vocabulary-lock.md`

## Follow-Up

A **small follow-up PR** (per ADR-0028's late status-flip protocol) flips three Work Orders from `In Progress` to `Completed` after this PR merges:

- The umbrella: `.claude/records/work-orders/2026-05-18-form-the-brickworks.md`
- Phase 4 sub-Work-Order: `.claude/records/work-orders/2026-05-19-phase-4-records-move.md`
- Phase 5 sub-Work-Order: `.claude/records/work-orders/2026-05-19-phase-5-adr-renumbering.md`

That follow-up PR's diff is small enough to fall under the `PrePushPermitGate` threshold; no permit-slug match needed.

---

## Steward Evaluation

_To be appended by The Steward after the CEO reviews this Build Record._

**Overall Assessment:** _CEO to approve / amend_

### Work Order Fulfillment Review

_Did the builder deliver what the umbrella Work Order specified? Any gaps or over-delivery?_

### Decision Review

_Were the BE/FE divergence resolutions well-reasoned? Any that should have been escalated to the CEO?_

### Showcase Assessment

_Does the merged Brickworks strengthen the portfolio narrative as intended?_

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| Pre-emptively normalize commit-subject case from phase 1 even if early phases skip wing CI | Candidate / Dropped | _CEO to disposition_ |
| Two-pass sentinel substitution for cyclic-map renames | Candidate / Dropped | _CEO to disposition_ |
| Hooks that `cd` must anchor via `git rev-parse --show-toplevel` | Candidate / Dropped | _CEO to disposition_ |

### Notes for the Builder

_Direct feedback. What to repeat, what to do differently next time._
