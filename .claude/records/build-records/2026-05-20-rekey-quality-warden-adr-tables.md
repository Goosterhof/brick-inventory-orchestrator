# Build Record: Rekey ADR Quick Reference Tables in quality-warden.md

**Build Record #:** 2026-05-20-rekey-quality-warden-adr-tables
**Filed:** 2026-05-20
**Work Order:** [`2026-05-20-rekey-quality-warden-adr-tables`](../work-orders/2026-05-20-rekey-quality-warden-adr-tables.md)
**Builder:** Brickwright (The Steward executing as builder for an Atrium-doc rekey)
**Wing:** Atrium (governance doc)

---

## Work Summary

Pure find-and-replace rekey of every pre-merger sovereign ADR ID inside `.claude/agents/quality-warden.md` to its consolidated `0001`–`0029` counterpart, per the Phase 5 rewrite map. Row order preserved (chronological adoption); "Protects" column wording preserved — the existing descriptions were already compatible paraphrases of the consolidated ADR `# Decision:` headers, so no title rewrites were needed.

| Action | File | Notes |
|---|---|---|
| Modified | `.claude/agents/quality-warden.md` | 35 insertions / 35 deletions; 4 tables + 3 inline citations rekeyed; meta-ADR row left at `000` (canonical file is `.claude/docs/ADR-000.md`) |

### Tables Rekeyed

1. **Foundry Quick Reference** (lines 58–66, 9 rows) — BE-sovereign `0001`–`0009` → consolidated `0013`–`0021`.
2. **Foundry Open Questions** subtable (lines 72–76, 5 rows) — same BE map applied to the 5 unresolved questions.
3. **Foundry Convention-Only Gaps** subtable (lines 84–85, 2 rows) — `0002` → `0014`, `0005` → `0017`.
4. **Gallery Quick Reference** (lines 95–111, 17 rows) — FE-sovereign `001`–`016` → consolidated IDs per the Phase 5 map; row for `000` (meta-decision) preserved as-is.

### Inline Citations Rekeyed

| Line | Old | New | Context |
|---|---|---|---|
| 99 | "_(superseded by 016)_" / "see ADR-016" | "_(superseded by 0029)_" / "see ADR-0029" | Gallery row 0006 — inline supersession reference |
| 163 | `ADR-0003` | `ADR-0015` | SOP F-2 step 6 — try-catch / Actions+Services |
| 225 | `ADR-005` | `ADR-0007` | SOP G-2 — Istanbul coverage |
| 227 | `ADR-016` (×2) | `ADR-0029` (×2) | SOP G-2 — HTTP middleware case conversion |

## Work Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Foundry Quick Reference table uses consolidated 4-digit ADR numbers; every cited ID resolves to an existing file at `.claude/docs/adr/<id>-*.md` | Yes | All 9 main-table IDs (0013–0021) resolve; verified with directory listing |
| Gallery Quick Reference table uses consolidated 4-digit ADR numbers; every cited ID resolves to an existing file at `.claude/docs/adr/<id>-*.md` | Yes (with one principled exception — see Decisions Made) | All 16 rekeyed IDs resolve to `.claude/docs/adr/`. Row for ADR-000 retained at display `000` and resolves to `.claude/docs/ADR-000.md` (the canonical path for the meta-decision, which has always been 3-digit and lives outside the `adr/` subfolder per `decisions.md` line 5) |
| `rg 'ADR-?00?[0-9]{1,3}\b' .claude/agents/quality-warden.md` shows no orphan 3-digit FE-style references and no Foundry references in the `0001`–`0012` range that map to a different consolidated number | Yes | Remaining matches after rekey: ADR-000 (meta, canonical), ADR-0007/0015/0029 (inline citations, all correctly rekeyed), Gallery row 0006 inline supersession (correctly rekeyed). No orphan FE-sovereign 3-digit references remain |
| Each row title matches the corresponding consolidated ADR's `# Decision:` header | Yes | All current "Protects" descriptions are compatible paraphrases of the consolidated `# Decision:` headers; no substantive divergence found. Per WO Notes ("titles only need updating if substantively divergent"), no description rewrites needed |
| No edits outside `.claude/agents/quality-warden.md` | Yes | `git diff --stat` confirms a single file changed (35/-35) |

## Decisions Made

1. **Meta-decision row (ADR-000) kept at display `000`, not normalized to `0000`.**
   Chose to preserve the 3-digit form over the 4-digit consolidated convention because the canonical file is `.claude/docs/ADR-000.md` (3-digit), `decisions.md` line 5 cites it as "ADR-000", and renaming to `0000` would create a broken cross-reference (no `0000-*.md` file exists). The WO Acceptance Criterion text says "every cited ID resolves to an existing file at `.claude/docs/adr/<id>-*.md`" — strictly read, ADR-000 lives outside `adr/`, so an exception is principled here rather than a violation. Rejected: normalizing to `0000` and rewriting the linked path; would have made the row inconsistent with the rest of the codebase's references to ADR-000.

2. **Row order preserved (no chronological-by-new-ID reordering).**
   Chose pure find-and-replace per the WO Notes ("Pure find-and-replace job using the two maps"). After rekey the Gallery table is no longer monotonically ascending (e.g. ...0024 → 0002 → 0026 → 0029), but this matches the file's existing chronological-adoption order and is the minimum-diff outcome. Rejected: reordering rows numerically; would have inflated the diff and conflicted with the WO's "pure find-and-replace" instruction. If the Steward prefers numeric ordering in the future, that's a separate WO.

3. **Existing "Protects" descriptions retained.**
   Spot-checked all 25 rekeyed rows against the consolidated ADR `# Decision:` headers. Every current description was a compatible paraphrase of the consolidated header (e.g. "Session-based SPA auth (no tokens)" vs "Session-Based SPA Auth, Not Tokens"). Per the WO instruction "if a row's title no longer matches the consolidated ADR's title, update the title text" — interpreted as substantive divergence, not stylistic paraphrase. None of the spot-checks revealed a substantive divergence. Rejected: rewriting every description to verbatim match `# Decision:` headers; would have flattened the table's compact phrasing without improving accuracy.

4. **Rekeyed beyond the WO's "lines ~58–80 / ~91–111" scope into the Convention-Only Gaps subtable and three inline SOP citations.**
   The WO Scope cited only the main tables by line range, but the WO Acceptance Criterion (broad `rg` sweep) would have failed if BE-sovereign references in the Convention-Only Gaps subtable (lines 84–85) and the three inline citations (lines 163, 225, 227) were left untouched — those are exactly "Foundry references in the 0001–0012 range that map to a different consolidated number" and "orphan 3-digit FE-style references" that the AC forbids. Read the WO scope as descriptive (where most of the work lives) and the AC as definitive (what passing looks like). Rejected: literal-line-only interpretation; would have left the agent file with broken inline cross-references and failed the AC.

## Quality Gauntlet

Not applicable — Atrium-doc-only change. No PHP, JS/TS, or test files modified.

| Check | Result | Notes |
|---|---|---|
| `git diff --stat` | Single file, 35/-35 | `.claude/agents/quality-warden.md` only |
| AC sweep #1: ID resolution | Pass | All 26 cited IDs resolve to existing ADR files (25 in `.claude/docs/adr/`, 1 meta at `.claude/docs/ADR-000.md`) |
| AC sweep #2: orphan 3-digit FE-style | Pass | Only 3-digit reference remaining is `000` for the meta-ADR (canonical) |
| AC sweep #3: Foundry references in 0001–0012 range that map elsewhere | Pass | None — all BE-sovereign Foundry IDs rekeyed to 0013–0021 |

The repo's pre-commit hook routes by staged path — staging only `.claude/agents/quality-warden.md` triggers neither the backend nor frontend gauntlet, so the hook is a no-op for this commit. PrePushPermitGate threshold (>20 files or >500 lines vs origin/main): this push touches 1 file / 70 lines, well below threshold — the gate will skip permit lookup entirely.

## Showcase Readiness

The agent's own cross-reference system now points at the correct ADR files. A senior architect performing due diligence on the Quality Warden's auditing surface will find that every citation in the Quick Reference tables, the Open Questions subtable, the Convention-Only Gaps section, and the inline SOP rules resolves to a real, current ADR. This was the highest-severity finding in the post-merger baseline audit (Finding 1, high); closing it restores operational integrity to the Warden's tooling.

## Proposed Knowledge Updates

- **Pulse:** None. The Atrium-level "No SOP for doc-sweep step after framework version upgrades" Active Concern was added during dispatch (and is unrelated to this WO's specific scope — that concern is owned by the Laravel-13-doc-sweep WO's eventual remediation). This rekey does not change any Active Concern.
- **Casebook:** The Methodology Note "After ADR renumbering, verify agent-file Quick Reference tables" was added during dispatch — this Build Record is the first execution of that check and confirms the methodology is sound. No further casebook entry needed.
- **Domain Map / Foundry Map:** No changes.
- **Component Registry:** N/A (Atrium doc).
- **Decision Record:** N/A (no architectural choice made).

## Self-Debrief

### What Went Well

- Verifying every consolidated ADR's `# Decision:` header **before** rekeying meant the "Protects" descriptions could be confidently left alone. Catching the compatible-paraphrase pattern saved a pointless secondary rewrite pass.
- Cross-referencing the WO's line ranges against the actual file with `grep -nE 'ADR-?0?0?[0-9]{1,4}'` surfaced the four out-of-scope references (Convention-Only Gaps subtable + three inline citations) that the broad AC sweep would have failed on if left untouched. Without that grep, the WO's literal line ranges would have under-scoped the work.
- Programmatic AC verification (per-ID file resolution loop) gave a definitive pass signal rather than relying on visual scan.

### What Could Be Improved

- The first attempt at the line-163 inline rekey edit failed because the `old_string` quoted the line-number prefix as `4. **Scan...`  when it was actually `6. **Scan...`. Lesson: when reading numbered-list line content from a grep result, the list number is part of the content, not the line number. Verify with `Read` before assembling Edit calls into multi-edit batches.

### Surprises

- The Audit's Doc Drift table mentioned "ADR-000 present at `.claude/docs/ADR-000.md`" but my first `find .claude -iname '0000-*'` missed it because the file is `ADR-000.md` (uppercase prefix), not `0000-*.md`. The naming convention for the meta-ADR is distinct from the rest of the consolidated sequence and worth remembering — Phase 5 deliberately kept it 3-digit and outside the `adr/` subfolder.

### Proposed Training (Steward Review)

No new training proposals. The Methodology Note that triggered this WO (Casebook 2026-05-20 entry: "After ADR renumbering, verify agent-file Quick Reference tables") was the correct prompt, and the WO's own structure was the correct response. The system worked as designed.

---

## Steward Evaluation

_To be filled by the Steward after review._
