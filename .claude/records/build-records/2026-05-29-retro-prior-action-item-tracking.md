# Build Record: Add prior-retro action-item tracking to `/retro` skill

**Build Record #:** 2026-05-29-retro-prior-action-item-tracking
**Filed:** 2026-05-29
**Built By:** Brickwright
**Work Order:** [2026-05-28-retro-prior-action-item-tracking](../work-orders/2026-05-28-retro-prior-action-item-tracking.md)
**Wing:** Atrium (`.claude/skills/retro/`)

---

## What Was Built

Added a prior-retro action-item audit loop to the `/retro` skill (`.claude/skills/retro/SKILL.md`). The skill previously recommended action items each retro but had no structural way for a later retro to audit whether prior items were implemented, dropped, or rotted — what PR #129's review called "introspection-theater risk." This closes that loop with a four-state classification.

Single-file `.claude/`-only changeset. No backend/frontend gauntlets fire; there is no automated test for skill prose. The WO's "four-state taxonomy is load-bearing / no over-engineering" guidance is the spec.

## The Diff — Exact Lines Changed

All edits in `.claude/skills/retro/SKILL.md`:

1. **Step 1 cross-reference** (line 37): `pass the procedure below (steps 2–6)` → `(steps 2–7)`.

2. **New procedure step 3** (inserted after "### 2. Determine the Retro Window", before the former step 3). Title `### 3. Audit the Prior Retro's Action Items`. Body: read the most recent prior retro's "Action Items" section (the same file located by mtime in step 2); classify each prior item into one of four states (`implemented` / `pending` / `dropped` / `rotted`), each requiring a citation; first-retro fallback no-op with the line "First retro — no prior action items to track."

3. **Renumbered subsequent procedure headings:**
   - `### 3. Read the Paper Trail` → `### 4.`
   - `### 4. Mine for the Three Buckets` → `### 5.`
   - `### 5. Render the Verdict` → `### 6.`
   - `### 6. File the Retrospective` → `### 7.`

4. **New output-format section** `## Prior Retro Action Items`, inserted in the fenced `markdown` block between `## What Surprised` and `## Verdict`. Bulleted status per item with the four-state vocabulary, a citation, and a one-line reason. Includes the first-retro fallback line.

5. **New rule** in the `## Rules` section ("No verbatim restatement of open action items"): a new action item may not restate a still-open prior action item word-for-word — either reconfirm it (it stays tracked in the Prior Retro Action Items section) or rephrase it materially, so recommendations never look fresh when they aren't.

6. **Frontmatter `description`:** left unchanged. The existing description already frames `/retro` as a tool "to learn from the firm's recent track, not to summarize it" — the audit loop reinforces that framing rather than shifting what `/retro` does. The WO said likely no change needed; a light-touch edit here would be cosmetic.

Final procedure heading sequence (verified via `grep`): 1, 2, 3, 4, 5, 6, 7 — no duplicates, no gaps.

## Decisions

### Why four states (implemented / pending / dropped / rotted) over three

Per the Acceptance Criterion, the choice of the four-state taxonomy over three is load-bearing and explained here.

A three-state model (implemented / pending / dropped) collapses two genuinely different "still open" conditions into one bucket:

- **`pending`** — still open **and still relevant.** The firm hasn't acted but should; the item legitimately carries forward.
- **`rotted`** — still open but **no longer relevant.** The firm has effectively moved on, but no one ever formally killed the item.

A three-state model has no place for `rotted`, so an obsolete item gets logged as `pending` indefinitely. That is exactly the silent failure mode PR #129's General was naming: an action item that recurs across N retros looking like live signal when the firm abandoned it long ago. `pending` is "we owe this"; `rotted` is "this debt is uncollectible — write it off." Without the distinction, the retro can never *kill* an item — it can only complete it (`implemented`), formally cancel it via a cited decision (`dropped`), or carry it (`pending`). `rotted` is the path for the common case where there was never an explicit decision to drop it; it just quietly stopped mattering. Declaring it dead stops it recurring.

`dropped` and `rotted` are also distinct: `dropped` is an *active* decision against the item (cite the decision); `rotted` is *passive* obsolescence (no decision was ever made — the retro is making the call now). Folding them would lose the citation requirement that keeps `dropped` auditable.

### Scope discipline

The WO's Notes explicitly warned against over-engineering (~28 lines total: ~15 procedure, ~10 output, ~3 rule). Built to that envelope: one procedure step, one output section, one rule, one cross-reference touch-up, renumbering. No automated tracking added (the WO scopes the audit as a Steward judgment call, not a CI check). No folder/naming changes. No touching the other two PR #129 flags.

## Showcase Readiness

Internal governance tooling — not customer-facing. The change strengthens the firm's own learning loop, which is the kind of process maturity a reviewing architect would expect to see in a portfolio repo.

## Quality Gauntlet

`.claude/`-only changeset. No backend (`composer`) or frontend (`npm`) gauntlet applies — no PHP or Vue/TS files touched. Verification performed: `grep` confirms procedure headings renumber cleanly 1–7 with no duplicate or skipped numbers.

## Proposed Knowledge Updates

None. This is a contained skill-prose change; no new learning, decision, or pulse entry warranted.

## Self-Debrief

- Followed the WO's line-budget guidance and resisted scope drift (no automated tracking, no schema, no extra states beyond the specified four).
- Renumbering was the only mechanical risk; verified with `grep` rather than eyeballing.
- Left the frontmatter description unchanged after weighing it — the audit loop deepens the existing "learn, don't summarize" framing rather than changing the skill's purpose.

## Methodology Objection

None.

---

**Status:** Completed — handed to The Steward for review. Do NOT commit/push/PR (per WO; Steward handles the `.claude`-via-PR step).
