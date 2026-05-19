# Shipping Order: Pre-Push Permit Verification Gate

**Order #:** 2026-05-05-pre-push-permit-gate
**Filed:** 2026-05-05
**Issued By:** Logistics Director (CEO-approved design)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Implement ADR-0013 — a CaptainHook pre-push gate that verifies an open permit exists for non-trivial pushes. Threshold: `>20 files OR >500 lines (insertions + deletions)` against `origin/main` HEAD. Strict slug-match between branch and permit filename. Failure on miss; `--no-verify` remains the documented escape hatch.

This is the structural fix for Finding 7's third-cycle recurrence — the human-memory remediation of prior cycles did not hold.

## Scope

### In the Crate

1. **Custom CaptainHook action** — `tools/CaptainHook/PrePushPermitGate.php`. PHP class implementing CaptainHook's action interface. Responsibilities:
   - Read current branch via `git symbolic-ref --short HEAD`. Exit success if branch is `main`.
   - Compute file count and line delta against `origin/main` HEAD:
     - `git diff --name-only origin/main...HEAD | wc -l` for files
     - `git diff --shortstat origin/main...HEAD` parsed for insertions + deletions
   - Exit success if `files <= 20 AND lines <= 500`.
   - Compute branch slug: portion after last `/`, lowercased.
   - Scan `.claude/records/permits/*.md` (excluding `.shipping-order-template.md`):
     - Strip filename's `YYYY-MM-DD-` prefix (11 chars) and `.md` suffix; lowercase
     - Read file content; parse `**Status:**` line
     - Match: filename slug == branch slug AND status is `Open` or `In Progress`
   - On match → exit success with confirmation message naming the matched permit.
   - On no match → exit failure with structured message:
     - Branch and computed slug
     - Threshold breach (`X files changed, Y lines changed`)
     - Path to `.claude/records/permits/.shipping-order-template.md`
     - Note about `--no-verify` requirement (Director sign-off in shift log)

2. **CaptainHook config update** — `captainhook.json`. Add the new action to the `pre-push` block, **ahead of** the existing `composer test` action. Permit verification should run before the test suite — failing fast on missing paper trail saves the cost of running the full suite on a push that won't succeed.

3. **Unit tests** — `tests/Unit/CaptainHook/PrePushPermitGateTest.php` (or appropriate location given the class is outside `app/`). Coverage:
   - Branch is `main` → success without scanning
   - Threshold under (10 files, 100 lines) → success without scanning
   - Threshold over by file count (25 files, 100 lines) → triggers scan
   - Threshold over by line count (10 files, 600 lines) → triggers scan
   - Match found, status Open → success
   - Match found, status In Progress → success
   - Match found, status Completed → failure (helpful message)
   - Match found, status Cancelled → failure
   - No match anywhere → failure
   - Multiple permits, one matching Open → success
   - Slug normalization: branch `feat/foo-bar`, permit `2026-05-05-foo-bar.md` → match
   - Slug normalization: branch `Goosterhof/feat/foo-bar`, permit `2026-05-05-foo-bar.md` → match
   - Slug strict-equality: permit `audit-remediation-5` does NOT match branch `audit-remediation-5-doc-hygiene`
   - Slug strict-equality: permit `audit-remediation-5-doc-hygiene` does NOT match branch `audit-remediation-5`

4. **CLAUDE.md amendments** — two sections:
   - **Pre-Commit Gauntlet section** — add a sibling "Pre-Push Gauntlet" entry naming the new gate, the threshold, and the slug-match rule.
   - **Operations Protocol section** — add "Documented Escape Hatch" subsection formalizing the `--no-verify` requirement: must be noted in the corresponding shift log's Decisions Made section with explicit Director sign-off. Reference the 2026-04-29 warroom-rules shift as the documented precedent.

5. **ADR-0013 to indexes** — add ADR-0013 row to `docs/adr/README.md` and `.claude/docs/decisions.md`. Entry: `0013 | Pre-push permit verification gate | 2026-05-05 | Accepted` (decisions.md format) and the parallel format in the README.

6. **Architecture test (optional, low-priority)** — verify the `PrePushPermitGate` class is wired into `captainhook.json`. A simple test that loads the JSON, finds the action, and asserts the class reference. If this is non-trivial to write cleanly, defer.

### Not on This Pallet

- **Branch field in shipping order template** — out of scope. Strict slug match by branch↔filename is the chosen mechanism. If slug-mismatch friction becomes a problem in practice, a future ADR can extend the matcher with an explicit `Branch:` field; not now.
- **Auto-fetch of `origin/main`** — out of scope. Stale `origin/main` is a developer hygiene issue; documented as a prerequisite, not auto-handled.
- **Permit-quality verification** — out of scope. The gate verifies *existence* of an open permit, not *appropriateness*. Audit cycles remain the forum for permit-quality review.
- **Backfilling the gate against historical pushes** — out of scope. The gate operates on future pushes only.
- **Findings 1–6 from the audit** — separate orders (`2026-05-05-audit-remediation-5-doc-hygiene.md`, `2026-05-05-audit-remediation-5-paper-trail.md`).
- **`Goosterhof/lego-storage` GitHub branch protection rules** — out of scope. The gate is local enforcement; CI-side enforcement is a separate consideration if and when this gate proves it works.

## Acceptance Criteria

- [ ] `tools/CaptainHook/PrePushPermitGate.php` exists, implements CaptainHook's action interface, follows warehouse conventions (`final` class; explicit types; no facades)
- [ ] `captainhook.json` `pre-push` block lists `PrePushPermitGate` BEFORE `composer test`
- [ ] Unit tests cover all enumerated scenarios; suite passes
- [ ] CLAUDE.md has a Pre-Push Gauntlet entry naming the gate, the threshold, and the slug-match rule
- [ ] CLAUDE.md has a Documented Escape Hatch subsection in the Operations Protocol naming the `--no-verify` requirement
- [ ] `docs/adr/README.md` and `.claude/docs/decisions.md` both list ADR-0013
- [ ] Manual verification: simulate a non-trivial push without a matching permit → gate fails; create a matching permit → gate passes; remove permit's `Open` status → gate fails again
- [ ] `composer phpstan` passes (the new action class is type-clean at level max)
- [ ] `composer deptrac` passes — the gate's location at `tools/` is outside `app/`, so deptrac scope should be unaffected; verify
- [ ] `composer test` passes
- [ ] Shift log filed at `.claude/records/journals/2026-05-05-pre-push-permit-gate.md`

## References

- ADR: `docs/adr/0013-pre-push-permit-verification.md`
- Audit Report: `.claude/records/inspections/2026-05-05-full-sweep.md` (Finding 7, Rebuttal Protocol section)
- Sibling Orders: `.claude/records/permits/2026-05-05-audit-remediation-5-doc-hygiene.md`, `.claude/records/permits/2026-05-05-audit-remediation-5-paper-trail.md`
- Sorter's original proposal: see Rebuttal Protocol section of the audit report
- Parallel precedent: `RoutingArchitectureTest` auto-detection (2026-03-26) — derive ground truth, fail on mismatch

## Notes from the Issuer

The original Sorter proposal was a prompt-only mechanism. The Director rejected the prompt and approved a verification mechanism instead — that's the structural-vs-discipline distinction that the just-graduated training (`structural fix not human-memory fix`) is meant to enforce. The implementation should reflect that distinction explicitly: the gate fails on miss, it does not ask. A prompt-based implementation would not satisfy this order.

CaptainHook's documentation has examples of custom action classes — follow the established interface. The gate is a self-contained verification; do not import application code (no `App\` dependencies). It runs at git-hook time, before any application bootstrap.

The `--no-verify` formalization is important. The current state is: developers know `--no-verify` works but the warehouse does not document when it's appropriate. The CLAUDE.md amendment is the doctrine — file it carefully. The 2026-04-29 warroom-rules shift is the right exemplar: the bypass was justified, narrowly scoped, and documented in the shift log. Future bypasses should follow that pattern.

The unit test for "permit `audit-remediation-5` does NOT match branch `audit-remediation-5-doc-hygiene`" is the most important test in the suite — it proves the strict-equality rule is enforced, which is the whole point of the slug normalization. Do not let that test be loose.

For CLAUDE.md amendments — consider whether the Pre-Push Gauntlet section deserves a top-level header parallel to "The Pre-Commit Gauntlet" (currently a subsection of Quality Control Bay), or whether both should be promoted to a single "Gauntlet" header with two subsections. Sorter's call.

This is a regulation change — once shipped, the warehouse's pre-push contract changes for everyone. Verify all branch-naming conventions in active use against the slug-match rule before committing the implementation. If a long-lived branch would suddenly fail the gate on its next push, that's worth noting in the shift log.

---

**Status:** Completed
**Shift Log:** [`.claude/records/journals/2026-05-05-pre-push-permit-gate.md`](../journals/2026-05-05-pre-push-permit-gate.md)

_Flipped to `Completed` after PR #171 merged, per the Permit Lifecycle rule in CLAUDE.md._
