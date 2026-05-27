# Build Record: ADR-0028 Uniform-Rule Amendment

**Build Record #:** 2026-05-27-adr-0028-uniform-rule-amendment
**Filed:** 2026-05-27
**Work Order:** [`2026-05-20-adr-0028-dual-mode-amendment`](../work-orders/2026-05-20-adr-0028-dual-mode-amendment.md)
**Builder:** The Steward (direct — the Work Order required an `/adr-interrogator` session with the CEO before drafting; the amendment is procedural doc work, not Brickwright-class implementation)
**Wing:** Atrium (architectural decision)

> **Work Order Status Discipline (ADR-0028, amended in this very Build Record):**
> This Build Record ships with the parent Work Order still in `Status: Open`. After this PR merges to `main`, a follow-up commit will flip the WO to `Status: Closed` and back-link the merged Build Record. This is the first dispatch executed under the uniform-rule convention being amended into ADR-0028 — eating our own dog food on the first WO to ship under the new doctrine.

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Modified | `.claude/docs/adr/0028-pre-push-permit-verification.md` | Added `**Last Amended**: 2026-05-27` line; updated `Status: accepted (under trial doctrine ...)`; appended a full `## Amendment 2026-05-27 — Uniform-Rule Convention` section covering the triggering signal, the interrogation outcome, the chosen rule, taste-basis acknowledgment, training-rule retraction, honest enforcement description, operational pattern, consequences, Devil's Court re-interrogation triggers, and reversal cost. |
| Modified | `.claude/records/build-records/.build-record-template.md` | Added a blockquoted Work Order Status Discipline guidance note between the frontmatter and the first H2, citing ADR-0028 amended 2026-05-27 and prescribing the post-merge close pattern. |
| Modified | `.claude/docs/quality-warden-casebook.md` | Added a new Methodology Note row: "Trial-doctrine convention 'graduates' by convergent application" — the lesson from the retracted "close in work commit" rule that graduated in gate-inactive contexts only. Sourced to this Build Record. |
| Created | `.claude/records/build-records/2026-05-27-adr-0028-uniform-rule-amendment.md` | This file. |

## Work Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| ADR-0028 (or successor) explicitly addresses the dual-mode question with a single chosen rule | **Yes** | ADR-0028 amended in place per the WO's preferred path. The new `## Amendment 2026-05-27 — Uniform-Rule Convention` section names the chosen rule (close post-merge on `main`, always), the basis (CEO taste preference), the honest enforcement asymmetry, and the Devil's Court re-interrogation triggers. |
| `PrePushPermitGate`'s failure-message text matches the chosen rule | **Yes (no change required)** | The gate's failure message says "Expected: an open permit at ... with Status: Open or In Progress." Under uniform-rule, the WO is always Open or In Progress at push time, so the message remains accurate. The gate enforces a slice of the universal rule; the message describes the slice it enforces. No contradiction; no edit. |
| The chosen rule is testable | **Partial (acknowledged in ADR)** | The slice the gate enforces is testable via existing `PrePushPermitGateTest.php` fixtures (unchanged). The universal rule's enforcement for sub-threshold backend, frontend-only, and Atrium pushes is convention-only, named explicitly in the ADR's Enforcement section as "developer discipline." The amendment is procedural, not mechanical; this matches the WO's "Not in This Set" exclusion of new gate mechanisms. |
| `/adr-interrogator` session minutes filed under `.claude/records/minutes/` if decisions worth preserving | **Yes — adapted** | The Brickworks does not maintain `.claude/records/minutes/` (the WO referenced a directory that doesn't exist in the firm's filesystem — a pre-merger vocabulary artifact). Minutes are filed in `MINUTES.md` at repo root per the firm's actual convention. The 2026-05-27 entry covers the interrogation outcome. |
| No edits to historical Build Records or Work Orders | **Yes** | Yesterday's Build Records (`2026-05-26-pattern-master-proposal-c-build`, `2026-05-26-audit-remediation-5-paper-trail`, `2026-05-26-pattern-master-graduation-log-extraction`) reference the "close in work commit" rule that this amendment retracts. Per WO scope, those records stand as written. The retraction is captured prospectively in the Casebook Methodology Note and in this Build Record's Decisions Made section. |

## Decisions Made

1. **Uniform-rule chosen over documented-dual-mode and over full gate extension.** The `/adr-interrogator` session (preserved in `MINUTES.md` entry for 2026-05-27) walked the CEO through three options: (A) document the existing dual-mode unchanged; (B) uniform-rule with convention-only enforcement; (C) extend the gate to enforce universally. The CEO chose (B). The basis was explicitly named as CEO taste preference for a single mental model and symmetric paper trail — not as architectural necessity. Recording the taste basis in the ADR is itself the decision-quality signal; manufactured architectural justification for what is genuinely a taste call would have been a worse outcome.

2. **The "dual-mode" framing in the original Work Order body was imprecise; the amendment uses sharper language.** The WO described the gate as exhibiting "size-dependent behavior" as if size were a separate mode. The interrogation surfaced that the gate has **one** active mode (rejects WO-closed pushes that touch backend AND exceed threshold) with **two** ways for it not to fire (no backend in range; under threshold). The "frontend can always close in work commit" is the gate not running at all, not a different mode. The amendment uses the more precise framing.

3. **The "close in work commit" training rule's 2026-05-26 functional graduation is retracted.** All three graduation instances ran in gate-inactive contexts (`.claude/` only or frontend-only). Convergent application in unenforced space is not graduation. Per WO scope, yesterday's Build Records stand as written; the retraction is captured forward-looking in the Casebook Methodology Note (new row added). A new lesson — **trial-doctrine conventions require validation in the contested case** — is recorded for future Warden use.

4. **Amendment in place rather than successor ADR.** The WO permitted either. Amendment in place was chosen because (a) the underlying mechanism (gate code, threshold, slug match, failure mode, escape hatch) is unchanged; only the convention layered above the gate is changing; (b) ADR-0028's original Context, Options Considered, and Decision sections remain accurate and useful as the historical record of the gate's mechanical introduction; (c) a successor ADR would have to re-explain the gate's mechanics or cross-link extensively. The `## Amendment 2026-05-27 — Uniform-Rule Convention` section appears after the original `## Notes` so the original ADR reads top-down as the 2026-05-05 record, with the amendment as a clearly-dated addendum.

5. **Trial doctrine, not settled doctrine.** The CEO explicitly named this as "not really happy with this whole ADR" and authorized a "bigger check once we worked with it for a while." The amendment is recorded as trial doctrine with three independent Devil's Court re-interrogation triggers: volume (20 closed WOs), audit reference (next Warden audit citing ADR-0028), calendar (2026-08-27). First-to-fire wins. This is the right shape because aspirational "we'll review later" promises rot; concrete triggers force the re-review.

6. **Convention-only enforcement is named honestly in the ADR.** The gate enforces ~5% of cases; convention enforces ~95%. Pretending otherwise would have been a worse ADR. The amendment's Enforcement section states this in plain language. A senior architect reading the ADR sees: "they chose uniform-rule on taste, named the asymmetry, scheduled a review." That is a stronger showcase than a manufactured "all enforcement mechanical" claim would have been.

7. **WO Status stays Open through this PR.** This Build Record's PR ships with the WO file in `Status: Open`. After PR merge, a follow-up commit on `main` flips the Status. The amendment being introduced in this very Build Record is the first dispatch to execute under uniform-rule. This is deliberate — the new doctrine is exercised on its own introduction. Yesterday's graduated "close in work commit" pattern would have closed the WO in this same commit; we are not doing that.

## Quality Gauntlet

### Atrium / doc-only

| Check | Result | Notes |
|---|---|---|
| Markdown link integrity (manual spot-check) | Pass | ADR amendment's cross-references to WO, Build Records, and Casebook resolve. Casebook entry's link to this Build Record resolves. |
| BR template guidance note renders correctly | Pass | Blockquote between frontmatter and first H2 — visually distinct, doesn't disrupt subsequent sections. |
| ADR-0028 backward compatibility | Pass | Original sections (Context, Options Considered, Decision sub-sections, Consequences, Notes) untouched. The `## Amendment` section is purely additive. |

The orchestrator-level pre-commit hook will skip both wing gauntlets because no `backend/` or `frontend/` paths are touched. `.githooks/pre-push` will likewise dispatch neither the CaptainHook gate nor the Husky chain. Diff scope: 4 files modified/created, all under `.claude/`.

## Showcase Readiness

A senior architect reviewing this amendment will see:

- An ADR that originally introduced a structural enforcement mechanism (the gate), being amended with a taste-based convention that the amendment names as taste-based.
- An interrogation summary in `MINUTES.md` showing the reasoning was pressure-tested by a separate role (`/adr-interrogator`) before being inked.
- A retracted training rule recorded with the specific methodology lesson the retraction taught (convergent application in unenforced space ≠ graduation).
- A trial-doctrine status with three concrete re-interrogation triggers, the first of which forces a return to the question with operational data.

This is honest decision-making at the deputy/CEO interface. It strengthens the portfolio more than a manufactured architectural justification for the same outcome would have.

## Proposed Knowledge Updates

- **Pulse — Atrium Active Concerns:** the "ADR-0028 push-gate dual-mode behavior pending amendment" entry can be closed when this PR merges. Recommend the post-merge close commit flip both this Build Record's parent WO Status AND remove that Pulse entry from the Atrium concerns table in the same commit (or a sibling commit on `main`).
- **Decisions log (`.claude/docs/decisions.md`):** if the firm's decisions ledger has an ADR-0028 row, it should be touched to reflect "amended 2026-05-27 (trial doctrine)." Confirmed not in scope per WO `Not in This Set` for "other ADRs unless they cross-reference ADR-0028 and become stale" — but the decisions ledger is the ADR index, not a cross-referencing ADR, so an index-line refresh is mechanically a separate small follow-up if the ledger format needs it.
- **Learnings:** none proposed. The lesson (trial-doctrine conventions need contested-case validation) is filed in the Casebook as a Methodology Note — the right surface for a Warden-side process check. Promoting it to `learnings.md` would be premature; it earns that move on a second occurrence.

## Self-Debrief

### What Went Well

- The interrogator forced the original "uniform vs dual-mode" framing to be sharpened. The WO's framing was the question we started with; the question we ended with was tighter.
- The retracted training rule was caught **before** it landed in the Casebook formally. The "graduation" was functional but uncodified — the only paper-trail residue is in yesterday's Build Record bodies and the standup file. No corrective edit to a codified-and-now-wrong Casebook row required.
- Naming the taste basis explicitly in the ADR is, on reflection, a higher-quality decision than dressing it up as enforcement reasoning. The Interrogator pushed for honesty and the CEO gave it.

### What Went Poorly

- The original WO body, which the Steward filed, conflated "frontend bypasses the gate" with "dual-mode behavior of the gate." That conflation cost the interrogator time to unwind. The Steward should have refreshed the WO body to add the wing axis before dispatching the interrogator (yesterday's standup AI explicitly recommended this and it was carried unactioned for two standups). The interrogator absorbed the framing correction in-conversation, so no harm done, but the WO body remains imprecise as historical record.
- The original WO referenced `.claude/records/minutes/` as a directory — which doesn't exist in this firm. Minutes live in `MINUTES.md` at repo root. A pre-merger vocabulary leak in a Steward-filed WO. Caught during AC fulfillment review.

### Blind Spots

- Did not check `.claude/docs/decisions.md` before drafting to confirm whether the ADR-0028 index entry needs updating. Flagged in Proposed Knowledge Updates as a follow-up rather than discovered in time to include in this commit.
- Did not verify whether the recently-merged PR #115 standup's "graduated training rule" claim survives the retraction in this Build Record. The standup file at `.claude/records/standups/2026-05-27-standup.md` (filed earlier today) declares the rule "functionally graduated" — that claim is now historically inaccurate. Per WO scope, no retroactive edit to the standup; readers will need to follow the trail to find the retraction. Acceptable but worth naming.

### Training Proposals

| Proposal | Context | Build Record Evidence |
|---|---|---|
| **Before filing a Work Order body, sweep for pre-merger vocabulary leaks.** The WO referenced `.claude/records/minutes/` which doesn't exist; the directory belongs to a pre-merger vocabulary set that didn't survive into Brickworks. | The minutes-directory reference would have caused the original-author Brickwright to try to file in a nonexistent location. Caught during AC review at close. | This record (Self-Debrief > Blind Spots) |
| **When the Standup recommends refreshing a WO body before dispatch, do it before dispatch.** Yesterday's standup said "refresh the WO body first to add the wing-scope axis discovered yesterday." The Steward dispatched the interrogator without refreshing. Cost was absorbed but the imprecision in the WO body remains as historical record. | The WO scope and the interrogation's outcome don't quite match in framing; future readers must reconcile via the BR. | This record (Self-Debrief > What Went Poorly) |

---

## Steward Evaluation

_The builder for this record IS The Steward. Self-evaluation is appended below._

**Overall Assessment:** Solid

### Work Order Fulfillment Review

All five Acceptance Criteria met or adapted (one referenced a nonexistent directory; adaptation captured in the AC table and the Self-Debrief). The WO's `Not in This Set` exclusions (no other-ADR changes, no retroactive Build Record edits, no new gate mechanisms, no threshold changes) are honored without exception.

### Decision Review

Seven Decisions Made, all evaluated:

- Decisions 1, 3, 5: outcomes of the interrogator session, owned by the CEO. Honest taste-basis recording is the right call; the alternative (manufactured architectural justification) would have been worse.
- Decisions 2, 4: framing/structuring calls by the Steward, both defensible.
- Decision 6: the "name the enforcement asymmetry honestly in the ADR" call is the highest-leverage choice in this delivery. A weaker BR would have hand-waved the asymmetry into "mostly mechanical with some convention."
- Decision 7: eating the firm's own dog food on the introducing dispatch is the right reflex. The follow-up commit on `main` after PR merge is the operational confirmation.

### Showcase Assessment

This amendment makes the repo *more* impressive to a prospective client, not less, despite (or because of) its taste-based justification. The decision-making process — Steward leans → Interrogator pressure-tests → CEO names the taste basis honestly → trial doctrine with concrete review triggers — is a portfolio-visible demonstration of architectural maturity at the role/process level, not just the code level.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| Pre-merger vocabulary leak sweep before filing WO bodies | Candidate | Second occurrence in two days of a pre-merger vocabulary leak surfacing during close (yesterday's `2026-05-26-close-canonical-oxlint-test-file-rules` BR noted the WO's "Building Permit / Lead Brick Architect / General" vocabulary; today's BR notes the `.claude/records/minutes/` directory reference). One more occurrence and this becomes a Casebook Recurring Pattern. |
| Refresh the WO body before dispatch when Standup recommends it | Candidate | First occurrence as a named training rule; the underlying behavior (standup AI not executed before related dispatch) has happened repeatedly across the last week. |

### Notes for the Builder

Trust the Interrogator. The original framing was wrong-shaped and the interrogator's first question fixed it. If the Steward had simply drafted the amendment off the WO body without dispatching the interrogator first, the ADR would have inherited the imprecise "dual-mode" language and the retracted training rule would have stayed inscribed. The interrogation cost was the right cost to pay.

---

**Status:** Build Record filed; parent Work Order remains `Status: Open` through this PR per uniform-rule (closes in a follow-up commit on `main` after merge).
**Closes (post-merge):** [`2026-05-20-adr-0028-dual-mode-amendment`](../work-orders/2026-05-20-adr-0028-dual-mode-amendment.md)
