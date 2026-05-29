# Work Order: Add prior-retro action-item tracking to `/retro` skill

**Work Order #:** 2026-05-28-retro-prior-action-item-tracking
**Filed:** 2026-05-28
**Issued By:** The Steward
**Assigned To:** Brickwright
**Wing:** Atrium (`.claude/skills/retro/`)
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `retro-prior-action-item-tracking`

---

## The Job

The `/retro` skill (filed in PR #129) recommends action items at the end of each retrospective but provides no structural way for a subsequent retro to **audit** whether those action items were implemented, dropped, or rotted. Without that loop, the same recommendation can recur across N retros and look like fresh signal each time — what the General called "introspection-theater risk" in PR #129's review. The skill's prose warning ("manufacture false learning is worse than no retro") is correct but is not a structural safeguard.

This WO adds the structural safeguard: a **"Prior Retro Action Items"** section in the retro procedure and output format, with status (implemented / pending / dropped) and citation.

## Scope

### In the Box

- File: `.claude/skills/retro/SKILL.md`
- **Procedure step (new, between current step 2 "Determine the Retro Window" and step 3 "Read the Paper Trail"):** Read the most recent prior retro's "Action Items" section. For each prior action item, classify against the current window's evidence:
  - `implemented` — completed (cite the Build Record, commit, ADR, or other artifact that closed it)
  - `pending` — still open, still relevant (carry forward; explain why no progress)
  - `dropped` — superseded or decided against (cite the decision)
  - `rotted` — still open, no longer relevant (the firm has moved on; declare it dead so it stops recurring)
- **Output format addition (new section, between "What Surprised" and "Verdict"):** `## Prior Retro Action Items` with bulleted status per item, citation, and one-line reason. If no prior retro exists (first retro ever), section reads "First retro — no prior action items to track."
- **Personality/rules update:** Add a rule that no new action item should restate a still-open prior action item verbatim — either reconfirm the prior one (kept in Prior section) or rephrase it materially. This prevents recommendations from looking fresh when they aren't.
- Update the description in the SKILL.md frontmatter only if the procedure change materially shifts what `/retro` does (likely no change needed)

### Not in This Set

- No changes to `/minutes` skill (PR #129's evolution stays as-shipped)
- No changes to the retrospective folder layout or file naming
- No retroactive updates to past retros (first retro doesn't exist yet anyway; this WO ships before the first real `/retro` run, so the loop is in place from the start)
- No automated tracking — the prior-action-item audit is a Steward judgment call done at retro time, not a CI-enforced check
- No changes to the General's other PR #129 flags (first-retro window cap, schema-cost watch) — those were explicitly optional and not requested

## Acceptance Criteria

- [ ] `.claude/skills/retro/SKILL.md` carries a new procedure step (read + classify prior action items) inserted between "Determine the Retro Window" and "Read the Paper Trail"
- [ ] Output format template includes a `## Prior Retro Action Items` section between "What Surprised" and "Verdict", with documented status options (implemented / pending / dropped / rotted)
- [ ] First-retro fallback is documented in the new section ("First retro — no prior action items to track.")
- [ ] Rules section includes a "no verbatim restatement" guard for new action items
- [ ] The skill body remains self-contained (no external doc references needed for the new procedure step)
- [ ] CaptainHook pre-commit gauntlet green; pre-push gauntlet green
- [ ] Build Record records the diff and explains the choice between "implemented/pending/dropped/rotted" vocabulary (the four-state taxonomy is load-bearing)

## References

- Source finding: PR #129 General review flag (2): *"No prior-action-item tracking across retros. Retro N recommends action items; Retro N+1 has no structural way to audit whether N's recommendations were implemented, dropped, or rotted. Same recommendation can recur N times and look like fresh signal each time. Suggest a 'Prior Retro Action Items' section in the output format with implemented / pending / dropped status."*
- Source finding (broader): PR #129 General devil's-advocate beat: *"/retro is introspection-theater risk. Verdict is framing; action items are load-bearing. Without flag #2, the skill produces well-written observations the firm doesn't actually learn from."*
- Skill landed in: PR #129 (commit `7016417`-era, merged 2026-05-28)
- Related: `/minutes` skill (sister capture flow) — not changed by this WO

## Notes from the Issuer

This is the highest-leverage of the three General flags on PR #129. The other two (first-retro window cap, schema-cost watch) were prose-friendly; this one is **structural**, and without it the retro skill's value compounds linearly while the cost of repeating action items compounds geometrically.

The four-state taxonomy (implemented / pending / dropped / rotted) is the load-bearing choice. Three states (implemented / pending / dropped) collapses "still open and relevant" with "still open but obsolete" — and obsolescence is the silent failure mode the General is naming. The fourth state (`rotted`) is what lets the retro **kill** an action item the firm has effectively abandoned, instead of letting it recur as "pending" forever.

Brickwright should resist the temptation to over-engineer this. The change is roughly: one new procedure step (~15 lines), one new output section (~10 lines), one new rule (~3 lines). Anything more is scope drift.

Sub-threshold push. ADR-0028 uniform-rule applies; close in post-merge follow-up commit on `main`.

---

**Status:** Completed
**Build Record:** [2026-05-29-retro-prior-action-item-tracking](../build-records/2026-05-29-retro-prior-action-item-tracking.md)
