# Work Order: Amend ADR-0028 — Push-Gate Dual-Mode Behavior

**Work Order #:** 2026-05-20-adr-0028-dual-mode-amendment
**Filed:** 2026-05-20
**Issued By:** The Steward
**Assigned To:** Brickwright (after an `adr-interrogator` session with the CEO)
**Wing:** Atrium (architectural decision)
**Priority:** Standard — preventative, no active incident
**Branch slug (for PrePushPermitGate):** `adr-0028-dual-mode-amendment`

---

## The Job

Both PR #77 (laravel-13-doc-sweep) and PR #78 (rekey-quality-warden-adr-tables) reviewers **independently** flagged that ADR-0028's PrePushPermitGate exhibits size-dependent behavior that is documented nowhere:

- **Under the 500-line / 20-file threshold:** gate skips permit lookup entirely. The WO can be flipped Open → Closed in the work commit and push succeeds.
- **At/above threshold:** gate requires the WO file to be in `Status: Open` or `Status: In Progress` at push time. Closing the WO in the work commit causes push rejection.

The doctrine "WO stays In Progress through push" is currently size-dependent in practice but lives only in PR-body workflow notes. Either the rule should apply **uniformly** (close WO post-merge on `main` always, regardless of diff size) or ADR-0028 should **explicitly describe the dual-mode behavior** with both branches of the rule.

This WO carries the decision to the architectural ledger.

## Scope

### In the Box

- Stress-test the dual-mode rule via the `adr-interrogator` skill **before** drafting the amendment. The interrogator should pressure-test:
  - Why was the size threshold built into ADR-0028 originally? (workflow simplicity for small PRs — was that the chosen tradeoff?)
  - What does the dual-mode rule cost in cognitive load vs. uniform-rule simplicity?
  - Are there scenarios where uniform "close post-merge" is actively worse than the current size-dependent behavior?
  - If uniform-rule wins, what's the migration cost (existing tooling/docs/build-record templates)?
- Amend ADR-0028 (or file a successor ADR that supersedes it) with the decided rule. If amending in place, preserve the original `Resolved Questions` section and add a new entry capturing the dual-mode debate and its resolution.
- Update `PrePushPermitGate`'s failure-message text (in `backend/app/Tools/CaptainHook/PrePushPermitGate.php`) if the chosen rule changes the user-facing guidance.
- Update the gate-test fixtures in `backend/tests/Unit/Tools/CaptainHook/PrePushPermitGateTest.php` if behavior changes; add a new arch test or feature test if uniformity-of-WO-status-at-push should be mechanically enforceable.
- Update the Build Record template (`.claude/records/build-records/.build-record-template.md`) if the chosen rule changes how Build Records should declare WO Status transitions.

### Not in This Set

- No changes to other ADRs unless one explicitly cross-references ADR-0028 and the reference becomes stale.
- No retroactive updates to historical Build Records or Work Orders — the paper trail documents what happened at filing time.
- No new gate mechanisms (e.g., "look at parent commit's WO status" gate-side reads). The amendment is procedural, not mechanical.
- No changes to the threshold values themselves (500 lines / 20 files). If the dual-mode rule survives, the threshold is part of it; if uniform-rule wins, the threshold remains as a permit-lookup trigger but doesn't change WO status semantics.

## Acceptance Criteria

- [ ] ADR-0028 (or successor) explicitly addresses the dual-mode question with a single chosen rule
- [ ] `PrePushPermitGate`'s failure-message text matches the chosen rule (no contradictions between the gate's hint and the ADR's stated policy)
- [ ] The chosen rule is testable — either via existing gate-test fixtures (updated as needed) or a new architecture test
- [ ] `adr-interrogator` session minutes filed under `.claude/records/minutes/` if the interrogation surfaces decisions worth preserving as a meeting record
- [ ] No edits to historical Build Records or Work Orders

## References

- **Triggering signal — independent same-day flag from two reviewers:**
  - PR #77 review by @Goosterhof (2026-05-20T10:29:27Z): "ADR-0028's PrePushPermitGate reads the WO file's *current* status at push time ... the lesson should not live only in this PR body."
  - PR #78 review by @Goosterhof (2026-05-20T10:29:16Z): "The doctrine 'WO stays In Progress through push' is currently size-dependent in practice. Either the doctrine should apply uniformly ... or ADR-0028 should explicitly describe the dual-mode behavior."
- **Original ADR:** `.claude/docs/adr/0028-pre-push-permit-verification.md`
- **Gate implementation:** `backend/app/Tools/CaptainHook/PrePushPermitGate.php`
- **Gate tests:** `backend/tests/Unit/Tools/CaptainHook/PrePushPermitGateTest.php`
- **Evidence of dual-mode behavior within this session:**
  - **Under threshold:** PR #78 closed WO in work commit (commit `65ea638`), pushed clean — gate skipped permit lookup (under 500-line threshold).
  - **Over threshold:** PR #77 closed WO in work commit (commit `b5a8597`), gate rejected push; required reopen commit (`ff81fec`) to put WO back to In Progress so the gate's permit-lookup could match.
  - **Uniform-rule attempt:** PR #79 (symfony-805-cve-bump) kept WO Status as In Progress through push even though the diff was small enough for the gate to skip — applied the would-be uniform rule preemptively to test consistency. Closed via the post-merge bookkeeping PR #80.

## Notes from the Issuer

Both reviewers raised this independently within twelve seconds of each other (PR #78 review filed 10:29:16Z; PR #77 review filed 10:29:27Z). That's the "two reviewer signal" worth escalating — the lesson is not noise, it's a real doctrine gap.

The Steward leans toward **uniform-rule** (close WO post-merge on `main` always) on three grounds:
1. **Predictability for the Brickwright** — one rule, no threshold math during commit-message drafting.
2. **Symmetric paper trail** — every WO ends with a `chore: close ...` commit on `main` (mirrors the audit-cycle dispatch pattern: small atomic governance commits as the canonical close-out).
3. **Reviewer signal** — two reviewers had to point out the inconsistency. That's the smell of a missing rule, not a missing exception.

But the interrogator should surface what we'd be giving up:
- **Workflow friction for tiny PRs** — a 5-line typo fix now needs a follow-up commit instead of one-and-done.
- **Symmetric paper trail proliferation** — every PR generates two `main`-side commits (the squash + the close).
- **Threshold semantics** — if the threshold no longer gates WO status, what does it gate? (Currently: permit lookup vs. skip; arguably still useful as a "this PR needs a recorded Work Order at all" signal, independent of the closing-timing question.)

If the interrogator surfaces a third option — e.g. "gate accepts Closed if the close happened in this same push" by reading commit history — that's gate-side mechanical work and lands outside this WO's scope (see Not in This Set).

---

**Status:** Open
**Build Record:** _link to Build Record when filed_
