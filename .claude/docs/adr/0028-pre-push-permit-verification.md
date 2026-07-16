# Decision: Pre-Push Permit Verification Gate

**Date**: 2026-05-05
**Last Amended**: 2026-07-16 (retirement — Devil's Court re-interrogation of the root decision; ruling **Cracked**, gate retired; see § Amendment 2026-07-16 below). Prior amendments: 2026-07-09 (documented-dual-mode), 2026-05-28 (II — bypass-log retirement), 2026-05-28 (I — bypass-log scope, superseded), 2026-05-27 (uniform-rule convention, superseded).
**Feature**: CaptainHook pre-push gate; Operations Protocol enforcement
**Status**: retired (gate removed 2026-07-16; the permit-before-work guarantee lives upstream on the Kendo board — see § Amendment 2026-07-16)
**Stress-Tested**: 2026-07-16 (root decision re-interrogated — outcome **Cracked**, retired). Prior: 2026-07-09 (§ Amendment 2026-05-27 re-interrogated — outcome **Cracked**, revised by § Amendment 2026-07-09)
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

> **SUPERSEDED** by § Amendment 2026-07-09 — Documented-Dual-Mode (below), the outcome of this amendment's own scheduled Devil's Court re-interrogation (ruling: **Cracked**). Retained for the paper trail.

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

---

## Amendment 2026-05-28 (I) — Bypass-Log Scope

> **SUPERSEDED** by § Amendment 2026-05-28 (II) — Bypass-Log Retirement (below), filed the same day. The Category 1/Category 2 distinction described here never went into operation; the CEO retired the bypass-log requirement entirely rather than rescope it. Retained for the paper trail.

**Triggering signal:** The firm's first Retrospective (2026-05-28) named the bypass-log clause as the highest-cost paper-trail debt of the post-merger window — six `--no-verify` Build Record back-fills owed and uncollected since 2026-05-26. The clause was reaffirmed by § Amendment 2026-05-27 (seven days prior to this amendment); the back-fill discipline did not catch up. The doctrinal-vs-actual gap was widening.

**Empirical evidence:** All six pending back-fills fall in well-understood **operational** categories. None is the case the clause was designed to catch (a Brickwright skipping the gauntlet to ship untested production code):

| # | Source | Category | Cause |
|---|---|---|---|
| 1 | 2026-05-26 sweep, PR #105 | Operational (knip.json revert push) | Revert needed to drop a still-current-knip-5-breaking config change; no application code. |
| 2 | 2026-05-26 sweep, post-rebase force-pushes to #106/#110/#112 | Operational (post-rebase force-push) | Lock-file rebases after CVE-2026-46644 fix (PR #111) landed; pre-rebase content had already passed the gauntlet on each branch. |
| 3 | 2026-05-27 PR #119 (PartsPage) | Hook-bug (worktree pre-commit regression) | `.githooks/pre-commit`'s `git add` of `component-registry.json` with cwd-relative path under worktree-mode dispatch; fixed in PR #126. |
| 4 | 2026-05-27 PR #120 (SetsOverview) | Hook-bug | Same root cause as row 3. |
| 5 | 2026-05-27 PR #121 (ComponentGallery) | Hook-bug | Same root cause as row 3. |
| 6 | 2026-05-28 PR #129 (/retro skill) | Operational (merge-commit) | Merge commit bringing main's existing changes; no new code to test. |

Six of six are operational. The clause as written treats them identically with the case the clause was designed to catch — that produced paper-trail debt without firm signal.

**Categorization stress on day zero.** Row 1 (knip.json revert push) does not fit any of the four operational sub-types cleanly. It is closest to post-rebase force-push in spirit (the proximate need was to drop a still-current-knip-breaking config change without touching application code), but the action was a revert push, not a rebase. Filed as Operational because no new application code shipped, but the fit is loose enough to record explicitly: this amendment ships with the categorization already under one near-miss, not after a clean 30-day window. The 2026-06-28 calendar trigger will survey whether the sub-types remain exhaustive once more cases accrue; if they do not, the categorization is wrong and the amendment is cracked.

**The Resolved Question:** What scope of `--no-verify` bypass requires a full Build Record, and what scope is appropriately logged in a lighter-weight artifact?

### The Convention

`--no-verify` push handling distinguishes two categories:

**Category 1 — Code-bearing bypass.** The push ships new application code (`backend/app/**`, `frontend/src/**`, or any code path the bypassed hooks would have validated). **Requires a full Build Record entry** with explicit Steward sign-off, per § Documented Escape Hatch (unchanged). This is the scary case the original clause was designed for and remains so.

**Category 2 — Operational bypass.** The push falls in one of these exhaustive sub-types:

- **Hook-bug bypass** — a known tooling defect in the hook itself forces the bypass (e.g., the worktree-mode pre-commit regression PR #126 fixed).
- **Merge-commit bypass** — a merge commit bringing already-merged content from `main` into a branch with no new code to test.
- **Post-rebase force-push** — force-push of rebased history where the pre-rebase content already passed the gauntlet.
- **Pre-existing-baseline bypass** — push hits a baseline breach unrelated to the work being shipped (e.g., the 2026-04-29 warroom-rules shift with a 4-error PHPStan baseline from the L13 upgrade).

Category 2 **requires only a one-line entry in the session's `/minutes` § Process Meta** naming the PR, the operational sub-type, and the cause. The `/minutes` entry is the authoritative log; no standalone Build Record is required.

### Basis

The convention is chosen on **empirical operational fit**, not taste. Six pending back-fills produced over two weeks were all Category 2 (operational). Producing six Build Records whose content is "the hook had a bug" or "this was a merge commit" generates paper trail that does not teach. The clause's purpose — to catch code-bearing bypasses that ship untested code — is preserved by Category 1; Category 2 is moved to the lightest-weight log that maintains traceability.

This is recorded as empirical-fit, not taste, because the evidence is concrete: six observed cases over fourteen days, zero of them Category 1, all of them cleanly fitting Category 2's exhaustive sub-types. If the next observed case spills outside the sub-types, the categorization is wrong and the amendment is cracked.

### Back-fill Disposition

The six pending bypass logs are filed as a consolidated paragraph in the Build Record introducing this amendment ([`2026-05-28-adr-0028-bypass-log-scope-amendment`](../../records/build-records/2026-05-28-adr-0028-bypass-log-scope-amendment.md) § Bypass-Log Back-Fill), satisfying the prior clause retroactively. Future operational bypasses log to `/minutes` § Process Meta.

### Enforcement (honest description)

Category 1 (code-bearing) is enforced by **Steward judgment** — the Steward is responsible for noting when a `--no-verify` push touches application code and triggering the Build Record entry. There is no mechanical gate that distinguishes code-bearing from operational bypasses.

Category 2 (operational) is enforced by **the existing `/minutes` skill** — § Process Meta is a standard minutes section; logging a `--no-verify` push there is mechanically the same as logging any other process observation.

The convention is **procedural, not mechanical**. Gate code, failure-message text, and tests are untouched. The enforcement asymmetry (Steward judgment for Category 1, minutes-discipline for Category 2) is named here in plain language as the honest description.

### Relationship to § Amendment 2026-05-27

The two amendments are independent axes of paper-trail discipline:

- § Amendment 2026-05-27 governs **when** a Work Order's Status flips (uniform-rule: post-merge on `main`, always).
- § Amendment 2026-05-28 governs **how detailed** the bypass log must be (code-bearing → Build Record; operational → `/minutes` one-liner).

Neither amendment modifies the gate's mechanical behavior; both are procedural. They can be evaluated, confirmed, cracked, or strained independently — but with one inheritance to name explicitly: this amendment's **operational pattern of "the WO closes post-merge on `main`"** (used by this amendment's own Work Order, and by every future amendment-style WO) inherits the 2026-05-27 uniform-rule. If § Amendment 2026-05-27 is later cracked and reverted at its Devil's Court re-interrogation, the WO-close mechanics this amendment uses need re-evaluation. The convention layers remain independent; the operational pattern does not.

> **Inheritance resolved 2026-07-09:** § Amendment 2026-05-27 was cracked at its Devil's Court re-interrogation. The WO-close mechanics named here now follow § Amendment 2026-07-09 (documented-dual-mode): amendment-style WOs — Atrium/docs-only, gate never fires — close **in the work PR itself**.

### Trial Doctrine — Devil's Court Re-Interrogation Triggers

This amendment is recorded as **trial doctrine**, not settled doctrine. The first of two independent triggers fires a full nine-step `/adr-interrogator` re-run:

1. **Code-bearing case:** the first `--no-verify` push under this amendment that ships new application code. Re-interrogation tests whether Category 1's Build Record discipline holds in practice when finally invoked.
2. **Calendar:** 2026-06-28 (30 days from this amendment). Re-interrogation surveys actual Category 2 incidence to validate that operational bypasses are being logged at the minutes layer as expected, and that the operational sub-types remain exhaustive.

Re-interrogation outcomes follow the standard Devil's Court taxonomy (Confirmed / Cracked / Strained).

### Reversal Cost

Low. Doc-only amendment. Reversing it requires editing this section. No code, no tests, no fixtures. The 2026-05-27 amendment remains independently in force regardless of this amendment's disposition.

---

## Amendment 2026-05-28 (II) — Bypass-Log Retirement

**Triggering signal:** A harness-review session (Opus-4.8 onboarding, 2026-05-28) re-examined the firm's scaffolding against a more capable model. The bypass-log clause was the clearest case of doctrine the firm did not keep: the first Retrospective (same day) recorded **six owed bypass logs, honored zero times in two weeks** — and the rescoping in § Amendment 2026-05-28 (I), filed hours earlier, was itself a response to that debt. The CEO ruled that a clause honored zero times is not enforcement; it is a pretense of enforcement that manufactures debt and erodes the credibility of the rest of the paper trail.

**The Resolved Question:** Should `--no-verify` use carry any mandatory logging obligation at all?

### The Decision

**No.** The bypass-log requirement is **retired**. Using `--no-verify` is no longer a paper-trail obligation in any category.

- The § Documented Escape Hatch logging requirement (a bypass "must be documented ... with explicit Director/Steward sign-off") is **withdrawn**.
- The § Amendment 2026-05-28 (I) Category 1 / Category 2 distinction is **moot and superseded** — there is no longer a Build-Record tier or a minutes tier; there is no required artifact.
- A bypass **may** be noted in the session's `/minutes` § Process Meta as ordinary session texture, the same as any other process observation. This is optional colour, not a discharge obligation. Nothing is "owed."

### What Does NOT Change

The gate's **mechanical** behavior is untouched, and it remains the real enforcement:

- `PrePushPermitGate` still refuses over-threshold (`>20` files OR `>500` lines) backend-touching pushes that lack a matching open Work Order. That is a structural check that fails closed — it does not depend on anyone remembering to write a log afterward.
- `--no-verify` remains the documented escape hatch for the genuine cases (emergency hotfix, pre-authorized exploratory work, pre-existing-baseline breach, hook bugs, merge commits, post-rebase force-pushes). The escape was always available; this amendment only removes the after-the-fact logging tax on using it.

### Basis

Chosen on **enforcement honesty**, confirmed by evidence. A gate enforces; a logging clause that is honored zero times out of six does not. The clause's stated purpose — to catch a Brickwright skipping the gauntlet to ship untested production code — is already served by the mechanical gate (which refuses the push) plus code review and CI on the eventual PR. The clause added a manual obligation on top of mechanical enforcement, and the firm did not pay it. Removing it closes the doctrinal-vs-actual gap by lowering doctrine to what the firm actually does, rather than pretending at a discipline it does not keep.

The six previously-owed back-fills are **discharged by retirement** — there is no longer an artifact owed. They are accounted for in the consolidated paragraph filed under § Amendment 2026-05-28 (I)'s Build Record; no further action is required.

### Consequences

**Positive:**

- The firm's most visible paper-trail debt is closed — not by catching up, but by removing a clause that produced debt without signal.
- The remaining paper trail (Work Orders, Build Records, Audits, the mechanical gate) is more credible once the firm stops listing an unenforced obligation alongside the enforced ones.
- One less manual discipline concentrated on the Steward seat — aligns with the retro's "Steward bandwidth" concern.

**Negative:**

- A code-bearing `--no-verify` bypass now leaves no *mandatory* dedicated record. Mitigation: the mechanical gate already refuses the high-risk case (over-threshold backend without a WO); anything that slips past is visible in the PR diff and CI. The residual risk is a small, deliberate trade for honesty.
- The Category 1/Category 2 vocabulary introduced hours earlier is retired almost immediately. The paper trail shows two amendments on the same day moving in the same direction (rescope, then retire); recorded plainly rather than smoothed over.

### Settled, Not Trial Doctrine

Unlike the two prior amendments, this one is recorded as **settled doctrine**, not trial doctrine. It removes a clause rather than adding a convention to be validated, so there is no behavior to put on a Devil's Court trigger. If a future code-bearing bypass causes a concrete incident that a mandatory log would have prevented, that incident is the trigger to reconsider — file a new amendment then.

### Reversal Cost

Low. Doc-only. Reversing it means reinstating the § Documented Escape Hatch logging requirement (and optionally the Category distinction). No code, no tests, no fixtures. The 2026-05-27 uniform-rule amendment remains independently in force.

---

## Amendment 2026-07-09 — Documented-Dual-Mode (Devil's Court revision of § Amendment 2026-05-27)

**Triggering signal:** § Amendment 2026-05-27's own Devil's Court triggers. Trigger 2 (audit citing ADR-0028 by name) was ruled fired on **2026-05-29** — the ruling is on file in `audits/2026-05-29-warden-cross-wing-sweep.md` — and fired a second time in `audits/2026-07-09-warden-cross-wing-sweep.md` (X-adr-0028-1, medium). Trigger 1 (twenty uniform-rule closes) stood at ~19 at re-run time. The nine-step `/adr-interrogator` re-run executed 2026-07-09 — **41 days after the first ruling**; the lateness itself is a finding (see § Trigger-Tracking Meta-Finding below).

**Ruling: CRACKED.** The uniform rule's reasoning no longer holds under its own accumulated evidence.

### The Evidence Ledger (43 days of uniform-rule operation)

| Measure | Value |
|---|---|
| WOs closed cleanly under uniform-rule | ~19 |
| WOs drifted (work merged, Status never flipped) | 5 — `2026-05-28-mutation-per-file-floor` (merged 2026-06-01, Status still "Open _(flips to Closed in a post-merge follow-up per ADR-0028 uniform-rule)_" for 38 days — the WO cites the rule it violates); `2026-07-08-fs-form-adoption` (merged in PR #245 with **no Status field at all**); 3× `2026-06-09-kendo-*` (merged 2026-06-12, carrying the non-doctrine status vocabulary "Built") |
| Realized drift rate | ~20%, discovered at standup/audit time — **verbatim the failure mode this amendment's own Negative Consequences predicted** ("Discovery happens at audit time, not at push time") |
| Cost-model invalidation | `main` gained branch protection (observed 2026-07-08: direct WO-close commit to `main` rejected by the protected-branch hook). The Operational Pattern's "follow-up commit on `main` (**direct** or via a small chore PR — either is fine)" lost its cheap half; every close-out now costs a full PR cycle through the CI gate |

Confronted with the ledger, the CEO withdrew the taste preference the uniform rule was purchased on: *"I am paying the rule's cost while the audits absorb its failures."* The 2026-05-27 interrogation had already established that documented-dual-mode satisfied the original reviewers' complaint at lower cost; the taste premium was the only thing holding uniform-rule up, and it is now withdrawn with evidence.

### The Convention (revised) — Documented-Dual-Mode

1. **Default (≈95% of cases — frontend, Atrium/docs, sub-threshold backend):** the Work Order's `Status:` flips to `Completed` **in the work PR itself**, in the same change set as the Build Record, with the Build Record back-link added at the same time. The close travels with the work: reviewed together, merged together. There is no follow-up step to forget — the drift mode is structurally removed.
2. **Exception (gate-active slice — backend-touching push over 20 files OR 500 lines):** the PrePushPermitGate mechanically requires a matching **open** Work Order at push time, so these WOs stay Open through the push and close post-merge (small chore PR, batching permitted).
3. **The gate teaches its own exception:** an over-threshold backend push carrying an already-closed WO is *rejected at push time* — immediate mechanical feedback, not audit-time discovery. The junior reverts the flip, pushes, and closes post-merge. Gate code, failure messages, and tests remain untouched by this amendment.

### Basis

Chosen on **evidence, not taste** — the reverse of its predecessor's basis, recorded plainly. The uniform rule's sole surviving argument (symmetric paper trail) was not delivered in practice: the drifted WOs are asymmetries that sat unnoticed for weeks. Dual-mode aligns the doctrine with the mechanics that actually enforce it, and it fits the firm's current delivery shape: parallel worktree-dispatched builds already materialize WOs in-branch, so the Status flip rides the same PR at zero marginal cost, and the Steward's post-merge close-out queue disappears.

### Enforcement (honest description)

- **Exception slice:** mechanical, unchanged — the PrePushPermitGate refuses the push.
- **Default slice:** the closed-in-PR Status is reviewer-visible in the diff (an improvement over the invisible not-yet-flipped state under uniform-rule), but not yet machine-checked. **Recommended follow-up:** a CI-side check that flags any PR adding a Build Record whose parent WO in the same tree still reads Open — converting the `fs-form-adoption` failure mode into a red check. Until that ships, the default slice remains convention-plus-review; this asymmetry is named honestly, as the 2026-05-27 amendment named its own.

### Transition

WOs already merged or in-flight with `Status: Open` under the uniform rule (including the 2026-07-09 batch: PRs #250–#255 and the five drifted WOs in the ledger) are closed via **one final batched post-merge pass**. Dual-mode applies to every WO filed or shipped after this amendment merges. Build Records and PR bodies that cite "closes post-merge per ADR-0028 uniform rule" stand as written — no retroactive edits.

### Training-Rule Consequence

The "close parent WO in same commit as Build Record" training rule — graduated 2026-05-26, retracted by § Amendment 2026-05-27 one day later — is **reinstated with a scope clause**: it applies everywhere except the gate-active slice, where the inverse holds. The full history (graduate → retract → reinstate inside six weeks) stays on the record; the oscillation is the trial-doctrine mechanism functioning, not indecision to be smoothed over. The Casebook Methodology Note from the retraction (*trial-doctrine conventions require validation in the contested case*) remains in force and was honored here: dual-mode's contested case is the gate rejection itself, which is mechanically enforced.

### Trigger-Tracking Meta-Finding

The trial-doctrine scaffolding failed independently of the rule's content: a trigger ruled fired on 2026-05-29 went un-actioned for 41 days, its disposition dropped from tracking, and the 2026-07-09 standup initially mis-reported the triggers as untripped (since corrected in that standup). A committed governance ritual that lives only inside ADR prose is de-facto non-binding. **Standing rule going forward:** when a Devil's Court trigger is ruled fired, the ruling must be recorded as a Pulse **Active Concern** in the same session — the standup's stale-detection pass checks the Pulse mechanically, which is exactly where this one was finally caught.

### Settled, Not Trial Doctrine

This amendment is recorded as **settled doctrine**. The trial already happened: 43 days of lived uniform-rule experience, a full evidence ledger, and a complete nine-step re-interrogation are what trial doctrine exists to produce. Re-litigating dual-mode on a fresh trial clock would repeat the scaffolding failure documented above. If dual-mode produces a concrete incident — a gate-active WO closed early that the gate misses, or default-slice drift recurring despite the close-in-PR mechanics — that incident is the trigger to reconsider; file a new amendment then.

### Reversal Cost

Low. Doc-only: this section, the superseded banner on § Amendment 2026-05-27, the inheritance note in § Amendment 2026-05-28 (I), and any templates/docs that cite the close convention. Gate code, tests, and failure messages are untouched.

---

## Amendment 2026-07-16 — Retirement (Devil's Court re-interrogation of the root decision)

**Triggering signal:** Two converging pressures forced the re-interrogation the Pulse had carried as an Active Concern since 2026-07-09: (1) the un-actioned 2026-05-29 trigger ruling (Trigger 2, audit citing ADR-0028 by name — 48 days outstanding at re-run time); (2) the 2026-07-16 Kendo migration froze `.claude/records/work-orders/` — no new Work Order files are filed, so the gate's ground truth stopped being written. Every future above-threshold backend push would fail against a permanently frozen permit directory; the interim rule (sanctioned `--no-verify` with a board issue standing in as the permit) was institutionalized bypass — a gate whose escape hatch is the main door. BIO-0012 tracked the amendment; the nine-step `/adr-interrogator` re-run executed 2026-07-16 with the CEO.

**Ruling: CRACKED at the root.** Not an amendment's reasoning this time — the original decision's. The gate is **retired**.

### The Evidence Ledger (72 days of gate operation, 2026-05-05 → 2026-07-16)

| Measure | Value |
|---|---|
| True positives (pushes correctly refused) | **1** — PR #77, commit `b5a8597`, 2026-05-20 |
| False refusals | 1 — worktree blindness (PR #254, 2026-07-09; filed as BIO-0011: `getRoot()` resolves through the git common dir, so a permit existing only on the worktree's branch is invisible) |
| Amendments required | 4 before this one (uniform-rule; bypass-log scope; bypass-log retirement; documented-dual-mode) |
| Open maintenance issues at retirement | 2 (BIO-0011 worktree blindness; BIO-0012 permit-source relocation) |
| Ground truth | Frozen 2026-07-16 — the permit directory is a read-only archive |

### The Interrogation Outcome

**The problem moved upstream and got solved there.** The 2026-05-05 context was that nothing structural guaranteed a permit existed before large work shipped — enforcement was human memory, and it had failed three audit cycles running. In the board era the guarantee is enforced *before code exists*, not at push time: the autonomous-shift charter requires an open `BIO-xxxx` issue before a Brickwright is dispatched; `start-work-on-issue`/`link-branch` binds the branch to the issue; the `Agent Review Requested` label workflow puts every crew PR in front of review before merge. Asked what failure the gate still catches that the board-era workflow does not catch upstream, the CEO answered on the record: *"nobody, anymore — the gate is a relic of the file era."*

**Alternatives considered and eliminated:**

| Option | Why eliminated |
|---|---|
| **Kendo-querying gate** (permit lookup against the board at push time) | Dead on arrival mechanically: the Kendo credential is an MCP connection in `~/.claude.json` — unreachable from a PHP CaptainHook action. It would require a separate REST token provisioned into every pushing environment (dev hosts, worktrees, CI), adds a network dependency to an offline git operation, and guards against an actor the CEO states no longer exists. |
| **Branch-name pattern check** (`bio-\d{4}` slug ⇒ permitted) | Trivially satisfiable by naming a branch after a nonexistent issue — enforcement theater, not enforcement. |
| **CI-layer replacement** (flag over-threshold `backend/**` PRs with no `BIO-xxxx` reference) | Offered explicitly — the right layer for a board check (network and credentials live there). **Declined by the CEO** in favor of clean retirement; revisit if the accepted risk below materializes. |
| **Clean retirement** | **Chosen.** |

### The Decision

`PrePushPermitGate` is removed: the action class, its unit tests, and its `captainhook.json` pre-push entry are deleted. The pre-push gauntlet for backend-touching pushes becomes `composer test` alone. Doctrine references in the wing manuals, the root charter, and the `/enter` skill are swept in the same change set. The frozen Work Order archive is untouched.

### Named Accepted Risk

**Large, hand-run, non-shift work has no mechanical permit check** (CEO, 2026-07-16: "I accept the risk, and the risk is low"). The shift charter covers agent work; PR review covers everything that merges; the audit cycle is the after-the-fact backstop — the same backstop that existed before ADR-0028, now supplemented by a board that makes missing paper trail visible at standup rather than at audit. If a concrete incident occurs that a permit check would have prevented, that incident is the trigger to revisit the declined CI-layer option — file a new ADR then.

### Consequences

**Positive:**

- The institutionalized-bypass contradiction is resolved by removing the gate rather than by teaching every future session to `--no-verify` past it.
- BIO-0011 (worktree blindness) dissolves — a retired gate cannot be blind. Closed on this amendment's merge.
- Backend pushes from worktrees, CI, and fresh clones lose a failure mode that produced 1 false refusal per 1 true refusal.
- The retirement carries its full evidence ledger — in due-diligence review, a gate retired with reasoning reads as governance maturity; a gate bypassed on every push reads as rot.

**Negative:**

- The named accepted risk above. Recorded here, in the Pulse, and in BIO-0012's closing comment — not smoothed over.
- The documented-dual-mode convention (§ Amendment 2026-07-09) loses its mechanical slice and becomes fully historical: with WO files frozen and the gate gone, there is no close-in-commit question left to govern. Board lanes replaced it.

### What the Paper Trail Keeps

This ADR remains on file with all five amendments as the canonical record of a full enforcement lifecycle: structural fix → convention disputes → bypass-log retirement → dual-mode revision → retirement when the problem moved upstream. The pattern (evidence ledger → named residual risk → clean removal) is the transferable artifact; the gate itself never was.

### Settled Doctrine

Retirement removes a mechanism rather than adding a convention to validate; there is no behavior left to put on a trial clock. The revisit trigger is the concrete-incident clause under § Named Accepted Risk.

### Reversal Cost

Moderate. Code restoration is a `git revert` (class + tests + captainhook entry), but reinstating the gate would also require solving the permit-source problem that motivated this amendment — the file archive stays frozen, so any resurrection is a redesign against the board (see the eliminated alternatives), not a rollback.
