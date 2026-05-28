# Work Order: ADR-0028 Bypass-Log Scope Amendment

**Work Order #:** 2026-05-28-adr-0028-bypass-log-scope-amendment
**Filed:** 2026-05-28
**Issued By:** The CEO (via retrospective Action Item #1, accepted 2026-05-28)
**Assigned To:** The Steward
**Wing:** Atrium (architectural decision)
**Priority:** Standard — non-blocking but doctrinal-debt-accruing
**Branch slug (for PrePushPermitGate):** `adr-0028-bypass-log-scope-amendment`

---

## The Job

Today's first firm-wide Retrospective ([`2026-05-28-retro.md`](../retrospectives/2026-05-28-retro.md)) named the `--no-verify` bypass-log clause as the highest-cost paper-trail debt of the post-merger window. ADR-0028 § Amendment 2026-05-27 reaffirmed the clause; **six** Build Record back-fills are pending and uncollected. The doctrinal-vs-actual gap is widening.

Empirically: zero of the six pending back-fills is the case the clause was designed to catch (a Brickwright shipping untested code via gauntlet bypass). All six are operational categories (hook-bug, post-rebase force-push, merge-commit) where the gauntlet's value-add was zero or negative.

Amend ADR-0028 to scope the bypass-log clause to **code-bearing** bypasses only, with **operational** bypasses logging to `/minutes` § Process Meta instead. Bulk-resolve the six pending back-fills in the same Build Record.

## Scope

### In the Box

- New § Amendment 2026-05-28 — Bypass-Log Scope section in `.claude/docs/adr/0028-pre-push-permit-verification.md`, following the shape of § Amendment 2026-05-27.
- Two-category convention (code-bearing vs operational) with exhaustive operational sub-types (hook-bug, merge-commit, post-rebase force-push, baseline-breach).
- Trial-doctrine framing with two re-interrogation triggers (first code-bearing bypass under new clause, or 2026-06-28 calendar).
- Consolidated bypass-log back-fill table for the six pending entries in the Build Record's § Bypass-Log Back-Fill section.
- Explicit relationship statement to § Amendment 2026-05-27 (WO closure timing) — the two amendments are independent axes of paper-trail discipline.

### Not in This Set

- No edits to other ADRs unless they cross-reference ADR-0028's bypass-log clause and need updating (none believed to exist; the Steward will grep before closing the WO).
- No retroactive Build Records — the back-fill is consolidated into this Work Order's Build Record by design.
- No changes to `PrePushPermitGate` gate code, fixtures, or failure-message text — the amendment is procedural.
- No `/minutes` skill template changes — § Process Meta is already an existing section.
- No automated detection of code-bearing vs operational bypasses; the categorization remains a Steward judgment call.

## Acceptance Criteria

- [ ] ADR-0028 § Amendment 2026-05-28 reads as a self-contained convention statement with categories, basis, enforcement description, and trial-doctrine triggers.
- [ ] Build Record contains a § Bypass-Log Back-Fill table covering all pending entries with PR, category, cause, and Steward sign-off columns. (Filed AC said "six-row" at issuance; BR landed with **eight rows** — the three post-rebase force-pushes (#106, #110, #112) were disaggregated into one row each for citation discipline, and the merge-commit bypass on PR #129 was added late in the same session. Both deltas are documented in the BR's § Permit Fulfillment.)
- [ ] Both amendments are referenced from each other as independent axes (the 2026-05-27 amendment governs WO closure timing; the 2026-05-28 amendment governs bypass-log detail).
- [ ] No edits to historical Build Records, Work Orders, or the Pulse.
- [ ] Per § Amendment 2026-05-27 (uniform rule): this WO closes post-merge on `main` in a follow-up commit, not in the work commit.

## References

- **Triggering retrospective:** [`2026-05-28-retro.md`](../retrospectives/2026-05-28-retro.md) — Verdict + Action Items #1.
- **Prior amendment:** ADR-0028 § Amendment 2026-05-27 (uniform-rule convention).
- **Six pending back-fills evidence:**
  - 2026-05-26 sweep: MINUTES.md 2026-05-26 § Open-PR Sweep, Action Items.
  - 2026-05-27 parallel-dispatch: MINUTES.md 2026-05-27 § Parallel-dispatch burndown, Context block ("5 `--no-verify` Build Record back-fills now pending").
  - 2026-05-28 #129 merge: MINUTES.md 2026-05-28 § Process Meta ("One `--no-verify` commit: The #129 merge commit (`7e2eddf`)").

## Notes from the Issuer

The Steward's recommendation in the post-retro discussion was option (b): amend with two-category scope. The CEO accepted in one line ("no i agree with you"). Memory-validated CEO style — terse decisive, expects deputy to execute autonomously between strategic decision points.

The amendment ships in the same PR as the consolidated bypass-log back-fill. The back-fill is the proof-of-concept that the new clause's "operational bypasses go to /minutes one-liners" shape is viable — the six pending entries collapse cleanly into a table that would have been six minutes lines.

---

**Status:** Open
