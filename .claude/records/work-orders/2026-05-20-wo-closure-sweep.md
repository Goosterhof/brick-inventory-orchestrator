# Work Order: WO Closure Sweep — Paper-Trail Drift Remediation

**Work Order #:** 2026-05-20-wo-closure-sweep
**Filed:** 2026-05-20
**Issued By:** CEO (via first-standup post-triage authorization)
**Assigned To:** The Steward (executing as builder — Atrium scope, mechanical sweep)
**Wing:** Atrium
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `wo-closure-sweep`

---

## The Job

First `/standup` (2026-05-20) triage matrix surfaced that **24 of 29 Work Orders marked `Open`/`In Progress` already have matching Build Records filed** — the work shipped but the WO file's `Status:` field was never closed. Pattern: at delivery time, Build Record is filed but the parent WO file is not edited. The Casebook hinted at this 2026-04-25 ("Persistent low-severity open items") but the full scale was invisible until the standup forced a roll-call.

This Work Order is the **mechanical closure sweep** for the 24 shipped WOs. Hygiene work, not feature work.

## Scope

### In the Box

For each of the 24 WO files identified by the triage matrix:

1. Update `**Status:**` field from `Open` (or `In Progress`) to `Completed (closed retroactively 2026-05-20 in paper-trail sweep)`.
2. Append a closure note block at the bottom of the file:
   ```
   ---
   _**Closed retroactively 2026-05-20** during paper-trail-drift sweep. Build Record (already filed): [link](../build-records/<matching>.md). See sweep Build Record: [2026-05-20-wo-closure-sweep](../build-records/2026-05-20-wo-closure-sweep.md)._
   ```
   Older WOs may already have a `**Build Record:**` line — leave it intact; the appended block does not replace it, it adds the explicit retroactive-closure context.

Files in scope (24 — listed by triage matrix order):

- `2026-03-25-brick-dna-lab-foundry` → BR `2026-03-25-brick-dna-lab-foundry.md`
- `2026-03-26-set-completion-gauge-foundry` → BR `2026-03-26-set-completion-gauge-foundry.md`
- `2026-03-28-response-caching` → BR `2026-03-29-response-caching.md`
- `2026-03-28-cursor-pagination` → BR `2026-03-28-cursor-pagination.md`
- `2026-03-28-computed-resource-data` → BR `2026-03-28-computed-resource-data.md`
- `2026-03-29-test-gap-sweep` → BR `2026-03-29-test-gap-sweep.md`
- `2026-04-01-fs-theme-integration` → BR `2026-04-03-fs-theme-integration.md`
- `2026-04-02-fs-translation-migration` → BR `2026-04-03-fs-translation-migration.md`
- `2026-04-02-fs-toast-migration` → BR `2026-04-03-fs-toast-migration.md`
- `2026-04-02-fs-dialog-migration` → BR `2026-04-03-fs-dialog-migration.md`
- `2026-04-08-fs-router-migration` → BR `2026-04-08-fs-router-migration.md`
- `2026-04-09-page-transition-system` → BR `2026-04-09-page-transition-system.md`
- `2026-04-10-remove-define-expose` → BR `2026-04-10-remove-define-expose.md`
- `2026-04-10-page-transition-refactor` → BR `2026-04-10-page-transition-refactor.md`
- `2026-04-19-laravel-13-mutation-drill` → BR `2026-04-19-laravel-13-mutation-drill.md`
- `2026-04-29-reverse-lookup-lens-gallery` → BR `2026-04-29-reverse-lookup-lens-gallery.md`
- `2026-04-29-phpstan-warroom-rules-adoption` → BR `2026-04-29-phpstan-warroom-rules-adoption.md`
- `2026-05-03-invite-code-by-email-gallery` → BR `2026-05-03-invite-code-by-email-gallery.md`
- `2026-05-05-snake-case-payload-keys-cleanup` → BR `2026-05-05-snake-case-payload-keys-cleanup.md`
- `2026-05-05-audit-remediation-5-doc-hygiene` → BR `2026-05-05-audit-remediation-5-doc-hygiene.md`
- `2026-05-05-adr-016-conversion-cleanup` → BR `2026-05-05-adr-016-conversion-cleanup.md`
- `2026-05-09-place-parts-from-unsorted` → BR `2026-05-09-place-parts-from-unsorted.md`
- `2026-05-20-steward-codification-and-standup` → BR `2026-05-20-steward-codification-and-standup.md`

That's 23 listed above. The 24th: re-check during execution — the 2026-05-05-audit-remediation-5-paper-trail WO appeared as "no-build-record" in the triage but per the matrix snapshot might have a deferred close. Verify during execution; close only if a matching BR is found, otherwise leave as legitimately Open.

### Not in This Set

- Closing the 5 genuinely-outstanding WOs (no-build-record state). They remain `Open` / `In Progress`. Names:
  - `2026-05-05-wire-integration-tests-into-ci` (blocked per its own body)
  - `2026-05-05-integration-test-baseline-triage`
  - `2026-05-05-fix-integration-test-assertions`
  - `2026-05-06-canonical-oxlint-test-file-rules`
  - `2026-05-20-adr-0028-dual-mode-amendment` (filed today, deferred to next session)
- Editing any Build Record content. Build Records are immutable once filed.
- Editing the WO bodies beyond the Status line + appended closure block. No content rewrites.
- Updating the template (`.work-order-template.md`) or Build Record template — separate hygiene WO if the convention graduates.

## Acceptance Criteria

- [ ] All 23 listed WOs have `**Status:** Completed (closed retroactively 2026-05-20 in paper-trail sweep)` after the sweep.
- [ ] All 23 listed WOs have a closure block appended at file end referencing the matching Build Record and this sweep Build Record.
- [ ] The 24th candidate (audit-remediation-5-paper-trail) is verified during execution and closed only if a matching BR exists.
- [ ] Post-sweep verification: `grep -lE '^\*\*Status:\*\* (Open|In Progress)' .claude/records/work-orders/2*.md` returns exactly **5-6 files** (the genuinely-outstanding ones + possibly audit-remediation-5-paper-trail if no BR found).
- [ ] No edits to Build Records, the WO template, or any file outside `.claude/records/work-orders/`.
- [ ] Build Record filed at `.claude/records/build-records/2026-05-20-wo-closure-sweep.md` with a complete list of closed files.

## References

- First standup that surfaced the drift: [`2026-05-20-standup`](../standups/2026-05-20-standup.md)
- Pulse Atrium concern that this sweep partially remediates: "Work Order paper-trail drift — Status field not updated post-shipping" in [`pulse.md`](../../docs/pulse.md) (Active Concerns / Atrium)
- Casebook's hint at this pattern (2026-04-25): "Persistent low-severity open items" in [`quality-warden-casebook.md`](../../docs/quality-warden-casebook.md)
- Related Brickwright training candidate (proposed in Pulse but not yet promoted): *when filing a Build Record, also close the parent WO's Status field in the same commit.*

## Notes from the Issuer

The sweep is mechanical and the risk is low (git history preserves prior state; the Build Records are not touched; no code shifts). The value is two-fold:

1. **Immediate**: `grep "Status: Open"` becomes meaningful again. A new contributor pulling the repo and reading the Work Orders folder gets a true picture of what's outstanding.
2. **Forward**: the closure block format on each edited WO makes the pattern visible — the next Brickwright filing a Build Record sees the precedent of "close the parent WO in the same commit" and starts following it without prompting. The Pulse concern closes when this happens twice unprompted.

Do not deep-edit any WO body. The retroactive closure block is the only addition. Status field is the only modification.

---

**Status:** Completed
**Build Record:** [`2026-05-20-wo-closure-sweep`](../build-records/2026-05-20-wo-closure-sweep.md)
