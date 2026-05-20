# Build Record: Laravel 12 → 13 Doc Sweep + Two Low-Severity Drift Fixes

**Build Record #:** 2026-05-20-laravel-13-doc-sweep
**Filed:** 2026-05-20
**Work Order:** [`2026-05-20-laravel-13-doc-sweep`](../work-orders/2026-05-20-laravel-13-doc-sweep.md)
**Builder:** Brickwright (The Steward executing as builder for an Atrium-doc sweep)
**Wing:** Atrium (governance + wing manual)

---

## Work Summary

Closed out three findings from the post-merger baseline audit in one bundled doc sweep:

- **Finding 2 (medium)** — Framework version drift across surface-level governance/agent/manual docs.
- **Finding 3 (low)** — Stale `permits/` path in the vocabulary-lock Authority line (Phase 4 renamed the folder to `work-orders/`).
- **Finding 4 (low)** — Pulse Foundry Overall Health clause carried a pre-Phase-5 narration ("13 coherent BIO sovereign ADRs (now consolidated...)") that re-read as a historical footnote.

| Action | File | Notes |
|---|---|---|
| Modified | `backend/CLAUDE.md` | Heavy Machinery table: `Framework: Laravel 12 → 13` |
| Modified | `.claude/docs/foundry-map.md` | Heavy Machinery table: `Framework: Laravel 12 → 13` |
| Modified | `CLAUDE.md` (root) | Project Overview: `The Brick (Laravel 12 API → 13 API)` |
| Modified | `.claude/agents/quality-warden.md` | Wing introduction: `Laravel 12 → 13` |
| Modified | `.claude/agents/brickwright.md` | **Not listed in WO Scope** — caught by broader AC `rg` sweep (see Decisions Made #2). Two occurrences: agent `description` frontmatter line + Foundry Wing introduction |
| Modified | `docs/vocabulary-lock.md` | Authority line: `.claude/records/permits/` → `.claude/records/work-orders/` |
| Modified | `.claude/docs/pulse.md` | Foundry Overall Health sentence: removed `(now consolidated into 0001–0029 by Phase 5)` parenthetical; replaced `13 coherent BIO sovereign ADRs` with `governed by the consolidated 0001–0029 Brickworks ADR sequence` (present-tense; no hardcoded count, per Pulse rule "do not hardcode counts that are available from canonical sources") |

Total: 7 files, 8 line edits (one file got two edits).

## Work Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| All four Laravel-12 mentions in the WO table are now `Laravel 13` | Yes | All four target rows updated as written |
| `rg -n 'Laravel 12' backend/CLAUDE.md CLAUDE.md .claude/ docs/` returns no hits in active governance/agent/manual docs (historical files under `docs/MERGER_PLAN*.md` excluded) | Yes (with one additional file fixed beyond WO Scope) | Post-edit sweep returned one remaining hit in `.claude/docs/pulse.md` line 51, which is the new Atrium concern that **quotes** the past doc-drift incident ("docs still claimed 'Laravel 12' thirty-one days later") — a historical narration about the problem, not an assertion that the project is on Laravel 12. Legitimate; leave it. All `records/` hits (audit, this Build Record's parent WO, the 2026-04-19 upgrade WO) are also historical narration and out of scope by AC text |
| `docs/vocabulary-lock.md` Authority line resolves to `.claude/records/work-orders/2026-05-18-form-the-brickworks.md` (file exists) | Yes | Verified with `ls -la` — file exists at 10856 bytes |
| `.claude/docs/pulse.md` Foundry Overall Health no longer contains "(now consolidated into 0001–0029 by Phase 5)"; reads as current-state prose | Yes | Parenthetical removed; clause rewritten as "governed by the consolidated `0001`–`0029` Brickworks ADR sequence" — present-tense, references the sequence as current fact, no count hardcoded |
| No edits outside the five files listed in Scope | **Partial — exceeded scope by one file (`.claude/agents/brickwright.md`)** | See Decisions Made #2. The exceedance is principled: the broader AC `rg` sweep would have failed if `brickwright.md`'s two `Laravel 12` references were left untouched. The Audit missed this file (calibration miss — see Proposed Knowledge Updates) |

## Decisions Made

1. **Pulse Foundry sentence rewrite without hardcoding "29".**
   The original sentence claimed "13 coherent BIO sovereign ADRs". The WO instruction was to rewrite as present-tense referencing the consolidated 29-ADR sequence. I deliberately did **not** write "29 coherent consolidated ADRs" because the Pulse's own rules (file preamble: "Do not hardcode counts that are available from canonical sources. ... ADR counts come from `.claude/docs/decisions.md`. Duplicating these numbers here guarantees drift") forbid count duplication. Instead used "governed by the consolidated `0001`–`0029` Brickworks ADR sequence" — references the sequence bounds (derivable from the file system) rather than the count. The Atrium Quality Metrics table at line 154 remains the single source of truth for the count claim. Rejected: "29 consolidated ADRs" phrasing; would have created a second hardcoded count to drift.

2. **Edited `.claude/agents/brickwright.md` despite the WO Scope listing only 5 files.**
   The WO's AC #2 (`rg -n 'Laravel 12'` returns no hits in active governance/agent/manual docs) is broader than the WO's enumerated Scope. Running the AC sweep after editing the 4+1 WO-listed files surfaced two additional active hits in `brickwright.md` lines 3 and 16. The Audit (Finding 2) listed 4 doc-drift hits but missed `brickwright.md` — a calibration miss in the Audit, not a scope failure of this WO. Same judgment pattern as yesterday's rekey Build Record (Decision #4): WO Scope is descriptive (where most work lives), AC is definitive (what passing looks like). Rejected: literal-scope interpretation leaving the agent file inconsistent; would have failed the AC, perpetuated an audit blind spot, and left a senior architect reading `brickwright.md` to see "Laravel 12" for a Laravel-13 codebase. Pattern Master (`pattern-master.md`) checked separately and contains no Laravel mention — no further blind spots in the agent file set.

3. **Preserved historical "Laravel 12" mentions in `records/` and in Pulse line 51.**
   Three categories left untouched: (a) the new Atrium concern on Pulse line 51 explicitly quotes the past state of the drift ("docs still claimed 'Laravel 12' thirty-one days later") — narration of the incident, legitimate; (b) `.claude/records/work-orders/2026-04-19-laravel-13-upgrade.md` is the source Work Order for the upgrade and naturally references the prior version; (c) `.claude/records/audits/2026-05-20-post-merger-baseline.md` and `.claude/records/work-orders/2026-05-20-laravel-13-doc-sweep.md` are the audit/dispatch paperwork for this very fix. The WO explicitly excluded historical files (audits, build records, prior work orders) — those are frozen-at-filing-time historical artifacts. Rejected: rewriting historical records to remove the term; would have damaged the paper trail's archival integrity.

## Quality Gauntlet

Not applicable — Atrium-doc-only change. No PHP, JS/TS, or test files modified.

| Check | Result | Notes |
|---|---|---|
| `git diff --stat` | 7 files, +8/-8 lines | Five framework-version doc fixes + one path fix + one Pulse-clause rewrite |
| AC sweep #1: no active-doc "Laravel 12" hits | Pass | One legitimate quoted occurrence on Pulse line 51 (the Atrium concern's narration of the past incident) — not a claim, a historical reference |
| AC sweep #2: vocab-lock Authority path resolves | Pass | `.claude/records/work-orders/2026-05-18-form-the-brickworks.md` exists (10856 bytes) |
| AC sweep #3: Pulse parenthetical removed | Pass | `rg -n 'now consolidated into' .claude/docs/pulse.md` returns no hits |

The repo's pre-commit hook routes by staged path. This commit touches `backend/CLAUDE.md` only at a markdown level (no PHP files) — CaptainHook's PHP-files-only gauntlet is a no-op. Frontend pipeline is not triggered (no `frontend/**` staged). PrePushPermitGate threshold (>20 files or >500 lines vs origin/main): this push touches 7 files / 16 lines, well below the threshold — the gate will skip permit lookup entirely.

## Showcase Readiness

The four-doc Laravel-12 drift was the post-merger baseline audit's most embarrassing finding for showcase purposes: a senior architect performing technical due diligence on the root `CLAUDE.md` would have seen "Laravel 12 API" at line 80 for a codebase that's actually been on Laravel 13 since 2026-04-19. Closing this brings the stated stack into alignment with `composer.json`. The vocab-lock and Pulse fixes are lower-impact governance hygiene, but the bundling was the right call — three separate WOs for three single-line edits would have been more paper trail than the fixes were worth.

The fact that the original audit missed `brickwright.md` is itself a small showcase-readiness signal: a future audit cycle should treat the agent files (`brickwright.md` / `quality-warden.md` / `pattern-master.md`) as a deliberate doc category, not as adjuncts to CLAUDE.md.

## Proposed Knowledge Updates

- **Pulse:** None. The Atrium-level "No SOP for doc-sweep step after framework version upgrades" Active Concern (added 2026-05-20 during dispatch) was the right shape and predicted exactly this kind of fix. It remains open until either the SOP is codified into a Build Record template or a future framework upgrade Build Record carries the AC unprompted.
- **Quality Warden Casebook:** Propose adding a Methodology Note: **"When auditing framework-version doc drift, treat `.claude/agents/*.md` as a first-class doc category, not as a CLAUDE.md adjunct."** Triggering evidence: this Build Record. The 2026-05-20 post-merger baseline audit listed 4 doc-drift hits but missed `brickwright.md` lines 3 + 16 — found here by the broad AC `rg` sweep. The Quality Warden's existing Casebook already has a related note ("After ADR renumbering, verify agent-file Quick Reference tables" from 2026-05-20) — a sister entry for framework-version drift in agent files would close the parallel gap. Calibration proposal, not part of this WO; Warden housekeeping per their casebook protocol.
- **Decision Record:** N/A (no architectural choice made).
- **Domain Map / Foundry Map:** N/A (Foundry Map's framework row was the very thing this WO fixed).
- **Component Registry:** N/A (Atrium doc).

## Self-Debrief

### What Went Well

- Running the AC `rg` sweep as part of verification, not just as a closing check, surfaced the `brickwright.md` blind spot before committing — would have been a much weaker outcome to ship the WO scope-literal and only discover the miss in a follow-up audit.
- The Pulse rewrite stayed faithful to the file's own count-hardcoding ban; resisting the easy "29 consolidated ADRs" phrasing kept the canonical-source pattern intact.
- Bundle execution (5 files + brickwright extra, all touched in one branch) matched the WO's stated intent: doing these as separate WOs would have been more paper trail than the fixes were worth.

### What Could Be Improved

- I should have done the AC `rg` sweep **before** writing any edits, not after. That would have surfaced `brickwright.md` as part of the initial plan rather than as a mid-execution surprise. Lesson for next time: when a WO's AC includes a programmatic check (rg, file resolution, etc.), run that check against the pre-edit baseline first — gaps between WO Scope and AC become visible upfront.

### Surprises

- The Audit's Finding 2 listed exactly 4 files but the AC's `rg` sweep returned 6 active matches (5 unique files: the WO-listed 4 plus `brickwright.md`, plus the new pulse Atrium concern entry which is legitimate). One-third of the actual doc-drift wasn't enumerated in the Audit's finding. The Quality Warden's "Pattern Compliance Spot-Check" methodology samples 3-of-many; that sampling missed agent files entirely. Worth a casebook note.

### Proposed Training (Steward Review)

| Proposal | Context | Evidence |
|---|---|---|
| Brickwright SOP — for any WO with a programmatic AC (rg sweep, file-resolution check, count verification), run the AC against the pre-edit baseline before writing edits | This Build Record's "What Could Be Improved" — running the AC mid-execution surfaced an audit blind spot that would have been visible if the AC had been run pre-edit | Surfaced here, single occurrence; would be a candidate after a second confirming observation |
| Quality Warden Casebook Methodology Note — framework-version doc drift audits must treat `.claude/agents/*.md` as a first-class doc category | The 2026-05-20 post-merger baseline audit listed 4 framework-drift hits but missed `brickwright.md` lines 3 + 16 | Filed here as a proposal; The Warden owns whether to accept into the Casebook |

---

## Steward Evaluation

_To be filled by the Steward after review._
