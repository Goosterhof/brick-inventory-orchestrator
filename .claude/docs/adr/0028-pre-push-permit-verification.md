# Decision: Pre-Push Permit Verification Gate

**Date**: 2026-05-05
**Last Amended**: 2026-05-27 (uniform-rule convention; see § Amendment below)
**Feature**: CaptainHook pre-push gate; Operations Protocol enforcement
**Status**: accepted (under trial doctrine per 2026-05-27 amendment — Devil's Court triggers scheduled)
**Transferability**: project-specific

## Context

The 2026-05-05 full sweep audit filed Finding 7 (medium): two substantive deliveries between April 17–27 shipped without permits or shift logs. The DTO Input/Result migration (PR #160) alone touched 91 files across seven commits and constituted material amendments to ADR-0025 — none of which were captured in the warehouse's paper trail until the Sorter's rebuttal proposed retroactive remediation.

This is the **third consecutive audit cycle** in which missing paper trail has appeared as a finding. The prior cycles' remediation was retroactive shift logs plus a reminder to the crew to file shipping orders. Discipline-based remediation has not held.

The forces:

- The Operations Protocol requires a shipping order BEFORE non-trivial work starts and a shift log AFTER. Current enforcement is human memory.
- The Inventory Auditor's graduated training (`2026-05-05-full-sweep`, candidate first observed 2026-03-26) prescribes: when filing a finding about enforcement drift, recommend the structural fix, not the human-memory fix.
- The parallel precedent is the 2026-03-26 `RoutingArchitectureTest` auto-detection refactor — which retired a hardcoded route-list training proposal by deriving ground truth from `routes/api.php` instead of asking developers to remember to update a list.
- The pattern of failure is concentrated on **large** deliveries: the medic/CORS work (5 files, ~50 lines) is borderline; the DTO migration (91 files, 1141 lines changed) is unambiguously oversized for ad-hoc execution. A threshold-gated check covers the high-recurrence band without snagging routine maintenance.
- CaptainHook already enforces `pre-commit` (lint:test, phpstan, deptrac, test:arch on PHP files) and `pre-push` (full test suite). Adding a permit-verification action to `pre-push` slots into existing infrastructure with no new tooling.
- The Sorter's initial proposal (2026-05-05 rebuttal) framed the gate as "abort with a message asking whether a permit/shift log exists." The Director rejected the prompt-only mechanism — a sign-on-the-wall does not constitute structural enforcement. The decision below is the verification-mechanism upgrade.

## Options Considered

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **A. Operations Protocol amendment with explicit "non-trivial scope test" the developer self-administers** | Zero implementation cost; no false positives on legitimate large work | Pure human-memory mechanism. Same shape as the previous two cycles' remediation, which did not hold. Violates the just-graduated structural-fix training in spirit. | Eliminated — addressing a third-cycle recurrence with the same human-memory approach that produced the recurrence. |
| **B. Prompt-only pre-push hook (Sorter's original proposal)** | Cheap; visible to the developer at the right moment | A prompt is not a verification — developer can confirm and proceed. `--no-verify` makes it trivially bypassable without justification. Adds friction without enforcement. | Eliminated — friction without enforcement is the worst of both options. |
| **C. Pre-push verification: threshold-gated permit lookup, fail (not prompt) on miss** | Structural; mirrors RoutingArchitectureTest's "derive ground truth, fail on mismatch" pattern. Bounded scope (large pushes only). Documented `--no-verify` escape for genuine exceptions. | Implementation cost (~30-line custom CaptainHook action + tests); occasional rename friction when a branch slug doesn't match an existing permit. | **Chosen** — the structural fix the third-cycle recurrence warrants. Friction cost is bounded; enforcement actually holds. |
| **D. Pre-commit gate on first commit of non-trivial branches** | Forces "permit before code" by mechanism | Hard to detect "first commit" reliably; branches that grow from trivial to non-trivial mid-stream evade the check; high false-positive rate on exploratory work. | Eliminated — too brittle. Pre-push is the right phase: by then the scope is known. |

## Decision

### The Gate

A new pre-push CaptainHook action (`PrePushPermitGate`) verifies, before allowing a push, that any branch crossing a size threshold has a corresponding open permit on file.

### Threshold

A push is **non-trivial** when `files_changed > 20` OR `lines_changed > 500`, where:

- `files_changed` = unique files in `git diff --name-only origin/main...HEAD`
- `lines_changed` = insertions + deletions from `git diff --shortstat origin/main...HEAD`

Below the threshold, the gate exits success without scanning permits — small fixes pass freely.

### Branch Base

Comparison is against `origin/main` HEAD, not the local `main` branch and not the merge-base. Rationale: simpler, deterministic, matches the working assumption that `origin/main` is the deployment trunk. CI environments may need to fetch first; the gate documents this.

### Slug Matching

When the threshold is crossed, the gate computes the **branch slug**:

1. Take the portion after the last `/` in the branch name (strips `feat/`, `fix/`, `claude/`, `Goosterhof/feat/`, etc.).
2. Lowercase.

It then scans `.claude/records/permits/*.md` (excluding `.shipping-order-template.md`) for files whose **permit slug** matches the branch slug:

1. Strip the `YYYY-MM-DD-` date prefix (eleven characters: `2026-05-05-`).
2. Strip the `.md` extension.
3. Lowercase.
4. **Exact equality** with the branch slug.

Match found AND the permit's `Status:` field reads `Open` or `In Progress` → gate passes. No match, or all matches are `Completed` / `Cancelled` → gate fails.

Strict equality is chosen over substring matching to avoid false positives where one permit slug is a substring of another (e.g., `audit-remediation-5` would match both `audit-remediation-5-doc-hygiene` and `audit-remediation-5-paper-trail`). Developers naming a branch with a different slug from its permit must either rename the branch (cheap) or rename the permit (also cheap). The friction is intentional — it reinforces the connection between branch and permit.

### Failure Mode

On miss, the gate emits a structured error message naming:

- The branch and computed slug
- The threshold breach (`X files changed; Y lines changed`)
- The expected permit location (`.claude/records/permits/`)
- The shipping order template path
- The documented `--no-verify` escape and its requirement (see below)

### Documented Escape Hatch

`--no-verify` remains available — it is the existing CaptainHook bypass and the gate does nothing to prevent it. The Operations Protocol formalizes the existing warroom-rules pattern: any push that uses `--no-verify` must be documented in the corresponding shift log's Decisions Made section, with an explicit Director sign-off note. Use cases:

- Emergency hotfix where pre-flight permit filing is impractical (rare; document the urgency).
- Pre-authorized exploratory work (Director explicitly authorizes the bypass before push).
- Pre-existing baseline breach (e.g., the 2026-04-29 warroom-rules shift, where a 4-error PHPStan baseline from L13 upgrade would have caused the pre-commit hook to fail on unrelated work).

The escape hatch is documented, not stigmatized — but it is documented. Silent `--no-verify` use is the violation, not the bypass itself.

### Branch Exemption

Pushes from `main` (direct CEO commits, release tagging) skip the gate entirely. Branches with no diff against `origin/main` (already-merged or trivially-diverged) skip implicitly via the threshold check.

## Consequences

### Positive

- The third-cycle paper trail recurrence is addressed structurally. Future audits should see the finding category disappear.
- The "structural fix not human-memory fix" candidate (graduated 2026-05-05) is exercised on its first post-graduation case — reinforcing the training.
- Branch naming conventions are mechanically reinforced — strict slug match incentivizes consistent permit↔branch naming.
- The `--no-verify` escape is formalized rather than left as folklore.

### Negative

- ~30 lines of custom CaptainHook action plus tests; small but non-zero maintenance surface.
- Occasional friction when a branch slug doesn't match an existing permit — developer must rename one or the other. Cost is bounded (single rename) and the friction is intentional.
- A push from a fresh checkout that has not fetched `origin/main` may produce a misleading threshold result. The gate documents the prerequisite (`git fetch origin main` if `origin/main` is stale) but does not auto-fetch.
- The check only validates *existence* of an open permit, not *appropriateness*. A developer could file a hand-wavy permit just to satisfy the gate. This is a known limitation; the audit cycle remains the appropriate forum for permit-quality review.

### Enforcement

- `captainhook.json` adds a `PrePushPermitGate` custom action to the `pre-push` block, ahead of the existing `composer test` action.
- The action class lives at `tools/CaptainHook/PrePushPermitGate.php` (outside `app/` — not application code; Deptrac scope unaffected).
- Unit tests cover: threshold under/over, branch on `main`, slug strip variations, permit Status filtering, no-match failure, and `--no-verify` short-circuit (verified by absence of action invocation in CaptainHook bypass mode).
- CLAUDE.md's Pre-Commit Gauntlet section gains a parallel "Pre-Push Gauntlet" entry naming the gate and the threshold.
- CLAUDE.md's Operations Protocol gains a "Documented Escape Hatch" subsection formalizing `--no-verify` requirements.

## Notes

This ADR closes Finding 7's recurrence vector. The retroactive paper trail remediation (`2026-05-05-audit-remediation-5-paper-trail.md`) handles the immediate evidence; this ADR's implementation handles the next instance.

The Sorter's original proposal (prompt-only) is preserved in the audit report's Rebuttal Protocol section as the rebuttal artifact. The verification-mechanism upgrade is the Director's ruling on that proposal — adopted in spirit, mechanism rejected, replaced.

---

## Amendment 2026-05-27 — Uniform-Rule Convention

**Triggering signal:** On 2026-05-20, two PR reviewers independently flagged (within 12 seconds of each other on PR #77 and PR #78) that the gate's behavior implies an undocumented rule for when a Work Order may be closed. The doctrine "WO stays In Progress through push" lived only in PR-body workflow notes — not in any ADR, CLAUDE.md, or template.

**The Resolved Question:** When may a Work Order's `Status:` field be flipped from Open/In-Progress to Closed — in the same commit as the Build Record (work commit), or only in a follow-up commit on `main` after the Build Record's PR merges?

### Investigation outcome (`/adr-interrogator` session, 2026-05-27)

The "dual-mode" framing the original 2026-05-20-adr-0028-dual-mode-amendment Work Order proposed was imprecise. The gate has a **single active mode** (rejects pushes that close a WO in the work commit) with a **narrow firing condition** (backend paths in push range AND over-threshold). The frequently-cited "frontend can always close in work commit" is not a separate mode — it is the gate not running at all because `.githooks/pre-push` only dispatches the gate on backend-touching pushes. Similarly, "sub-threshold backend can close in work commit" is the gate skipping its permit-lookup phase, not a different rule.

Empirical incidence: the gate has rejected exactly one push in its operational life (PR #77, commit `b5a8597`, 2026-05-20). Backend discipline pre-merger had the underlying convention baked in culturally.

### The Convention

Work Orders close **post-merge on `main`, always** — regardless of wing, regardless of diff size. The work commit (or work PR) leaves the WO in `Status: Open` or `In Progress`; a follow-up commit on `main` after merge flips the WO Status to `Closed` (or `Completed`) and back-links the Build Record.

### Basis

The convention is chosen on **CEO preference** for a single mental model and symmetric paper trail. It is recorded here as taste-based, not as architectural necessity. Three Steward-leans (predictability for the Brickwright; symmetric paper trail; reviewer signal) collapsed under interrogation:

- **Predictability** buys little against a once-a-month failure mode.
- **Symmetric paper trail** is a values claim, not a structural argument.
- **Reviewer signal** argues for *documentation* of the chosen rule, not behavior change per se.

The interrogator confirmed that "documented-dual-mode" (just write down what the gate already does) would have satisfied the reviewers' triggering complaint at lower operational cost. The CEO chose uniform-rule anyway, on taste, and that choice is honest input — recorded here as such.

### Training-Rule Consequence

A "close parent WO in same commit as Build Record" training rule functionally graduated on 2026-05-26 across three roles (Brickwright graduation-log extraction BR, Steward audit-5 paper-trail BR, Pattern Master Proposal C BR). The graduation is **retracted** by this amendment.

Reason: all three graduation instances ran in gate-inactive contexts (touched only `.claude/` paths, or frontend-only). The rule was never tested against the case the gate would have caught. The graduation observed convergent application in an unenforced space; uniform-rule reverses that convention in favor of the inverse. The retraction is recorded in the Quality Warden Casebook as a Methodology Note: **trial-doctrine conventions require validation in the contested case, not merely convergent application in gate-inactive contexts.**

### Enforcement (honest description)

The universal rule is enforced **asymmetrically**:

- The PrePushPermitGate mechanically enforces "WO Open at push" only when the push touches `backend/` AND exceeds 20 files OR 500 lines.
- All other cases — sub-threshold backend, frontend-only deliveries, Atrium-only docs — rely on **developer discipline** to honor the post-merge close convention.

The amendment is **procedural, not mechanical**. The gate code, the failure-message text, and the gate's test fixtures are untouched. The enforcement asymmetry is named here in plain language because it is the honest description of what the gate does today; the amendment does not pretend the gate enforces the universal rule everywhere.

### Operational Pattern

- A Build Record PR ships with the parent WO file still showing `Status: Open` or `In Progress`.
- After the Build Record PR merges to `main`, a follow-up commit on `main` (direct or via a small chore PR — either is fine) flips the WO Status to `Closed`/`Completed` and updates the "Build Record:" line with the link to the merged BR.
- Close-out commits MAY be batched (one chore PR closing multiple WOs at once) when the Steward is doing post-merge cleanup. Batching is a cost mitigation, not a rule change.

### Consequences

**Positive:**

- Symmetric paper trail: every WO ends with a `chore: close ...` style commit on `main` after the work merges. Audit traceability improves — the close commit is always findable in `main`'s linear history.
- Single mental model for the Brickwright and any future role: never close in the work commit, regardless of wing or size. No threshold math required at commit-message drafting time.
- The gate's current behavior becomes a **slice** of the universal rule (rather than appearing to be a different sub-rule), which the ADR now describes as such.

**Negative:**

- One extra `main`-side commit per WO. At ~5–10 WOs per active week, ~30+ extra main-line commits per month. Batching mitigates but does not eliminate.
- Enforcement is convention-only for ~95% of cases. A new Brickwright unfamiliar with the convention can close a sub-threshold or frontend WO in the work commit and nothing fails. Discovery happens at audit time, not at push time.
- The just-graduated "close in work commit" training rule is retracted with one day of lived experience, carrying a small paper-trail cost (Build Records that referenced the rule yesterday — `2026-05-26-pattern-master-proposal-c-build`, `2026-05-26-audit-remediation-5-paper-trail`, `2026-05-26-pattern-master-graduation-log-extraction` — stand as written per the "no retroactive edits" scope clause).

### Trial Doctrine — Devil's Court Re-Interrogation Triggers

This amendment is recorded as **trial doctrine**, not settled doctrine. The first of three independent triggers fires a full nine-step `/adr-interrogator` re-run:

1. **Volume:** twenty (20) Work Orders have been closed under uniform-rule.
2. **Audit reference:** the next Quality Warden audit that cites ADR-0028 by name.
3. **Calendar:** 2026-08-27 (three months from this amendment).

Re-interrogation outcomes follow the standard Devil's Court taxonomy:

- **Confirmed** — reasoning holds under accumulated experience; add `Stress-Tested: <date>` to the ADR and promote from trial doctrine to settled doctrine.
- **Cracked** — reasoning no longer holds; revise this Amendment or supersede with a new ADR (e.g. ADR-0031).
- **Strained** — reasoning holds but is approaching its limits; record pressure points and schedule another re-interrogation.

### Reversal Cost

Low. The amendment is doc-only. Reversing it requires editing this section plus updating any docs/templates that cite it. Gate code, tests, and failure-message text are untouched, so they require no reversal work.
