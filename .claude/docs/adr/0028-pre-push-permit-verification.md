# Decision: Pre-Push Permit Verification Gate

**Date**: 2026-05-05
**Feature**: CaptainHook pre-push gate; Operations Protocol enforcement
**Status**: accepted
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
