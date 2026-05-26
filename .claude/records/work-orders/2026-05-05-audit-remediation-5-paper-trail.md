# Shipping Order: Audit Remediation Round 5 — Paper Trail

**Order #:** 2026-05-05-audit-remediation-5-paper-trail
**Filed:** 2026-05-05
**Issued By:** Logistics Director
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Close the medium finding from the 2026-05-05 full sweep audit (Finding 7) — two substantive deliveries shipped without paper trail. Per Rebuttal Protocol outcome (Sorter ACCEPT with PARTIAL on remediation, ruling adopted), differentiated remediation: bounded retroactive log for the medic/CORS work; retroactive log + ADR-0010 amendment for the DTO Input/Result migration.

## Scope

### In the Crate

1. **Retroactive shift log for Delivery A — medic/CORS** — file at `.claude/records/journals/2026-04-20-medic-cors.md` (date the work shipped, not today). Reconstruct from `git show 2c5ef79`, the PR #156 merge commit, and the commit message ("Closes Sapper M5 Medium #1, #2, #3"). Scope is bounded: 5 files changed, three Sapper findings closed, no architectural decisions embedded. The shift log should document what was changed, why each Sapper finding was addressed, and the new feature test added. No retroactive Director Evaluation needed beyond a note acknowledging the paper trail was reconstructed after the fact.

2. **Retroactive shift log for Delivery B — DTO Input/Result migration** — file at `.claude/records/journals/2026-04-21-dto-input-result-migration.md` (date of PR #160 merge `56cd7e9`). This is archaeological work: 91 files changed, 7 commits, 774 insertions / 367 deletions. Reconstruct from the seven constituent commits:
   - `6dd9145` — refactor: move DataTransferObjects into Input/ namespace
   - `8e9cf1d` — refactor: move Action-return shapes from Data/ to Result/
   - `2cb1dff` — refactor: retire ResourceDataSourceInterface and relax ComputedResourceData
   - `c16b5eb` — fix: restore validateCsrfTokens() after Laravel 13 upgrade inverted rename
   - `8ed25c3` — chore: rewrite Deptrac layers for Input/Result split + retire Data layer
   - `20316b6` — test: enforce Input/Result DTO placement by Action usage direction
   - `f2adae1` — style: apply Pint + Rector canonical formatting after DTO migration
   - `6a0cd39` — docs(claude.md): reframe DTO namespaces as Input/Result by usage direction

   The shift log captures: what motivated the migration, the rules introduced (Input vs Result by Action usage direction), the architecture test added (`DataTransferObjectPlacementTest`), the marker interface retired (`ResourceDataSourceInterface`), the deptrac layer rewrite, and the CLAUDE.md update. Decisions Made section captures the Input/Result naming choice and rationale.

3. **ADR-0010 amendment** — `docs/adr/0010-computed-resource-data.md`. The current ADR file (114 lines, last touched at original implementation `9942d22`) describes `ResourceDataSourceInterface` at line 42 as the live marker interface. CLAUDE.md's Ledger entry already forward-references an amendment ("marker interface retired; Input/Result namespace split supersedes the Data/DataTransferObjects duality") that was never actually written into the ADR file. The amendment must capture three substantive rule changes:
   - **Marker interface retirement** — `ResourceDataSourceInterface` removed; `ComputedResourceData` no longer requires it. Document why (the constraint became redundant once the Input/Result split made eligible classes structurally discoverable by namespace).
   - **Input/Result namespace split** — DTOs split by usage direction at the Action boundary: `App\DataTransferObjects\Input\<Domain>\` (Action receives) vs `App\DataTransferObjects\Result\<Domain>\` (Action returns). The dependency content (whether the DTO references a Model) is a consequence of the rule, not the rule itself.
   - **Architecture test enforcement** — `DataTransferObjectPlacementTest` enforces the placement rule from three angles: Action return types (Result), Action `execute()` parameter types (Input), and FormRequest `toDto()` return types (Input).

   Use the ADR's existing Status / Decision / Consequences structure. Append an "Amended 2026-04-21" subsection rather than rewriting the original — the amendment evolves the decision; it does not invalidate it.

### Not on This Pallet

- **Findings 1–6 (doc hygiene + Director Evaluations)** — separate shipping order: `2026-05-05-audit-remediation-5-doc-hygiene.md`.
- **Production code changes** — none. The DTO migration and CORS work are already in the codebase; this order documents them retroactively.
- **New ADRs** — only ADR-0010 is amended. The Input/Result split is an evolution of ADR-0010, not a new ADR.
- **CaptainHook pre-push proposal** — escalated to CEO; if approved, it gets its own ADR and shipping order separately.
- **CLAUDE.md updates** — the existing Ledger entry's wording about ADR-0010 should remain unchanged once the ADR amendment lands; the forward-reference becomes a back-reference. If the wording needs adjustment to match the amended ADR's exact language, that is in scope for the doc-hygiene order, not this one.

## Acceptance Criteria

- [ ] `.claude/records/journals/2026-04-20-medic-cors.md` filed, dated 2026-04-20, reconstructs the Sapper M5 Medium #1/#2/#3 closures and the new feature test
- [ ] `.claude/records/journals/2026-04-21-dto-input-result-migration.md` filed, dated 2026-04-21 (PR #160 merge), reconstructs the seven-commit migration with Decisions Made section capturing the Input/Result naming rule
- [ ] `docs/adr/0010-computed-resource-data.md` contains an "Amended 2026-04-21" subsection covering all three rule changes (marker interface retirement, Input/Result namespace split, `DataTransferObjectPlacementTest` enforcement)
- [ ] The amended ADR-0010 is internally consistent — no remaining text describes `ResourceDataSourceInterface` as a current requirement
- [ ] Both retroactive logs include an explicit "Filed retroactively" preamble noting the date of original work vs. the date of log filing
- [ ] `composer phpstan` passes (no type errors introduced by ADR text)
- [ ] `composer test:arch` passes
- [ ] Shift log for THIS order filed at `.claude/records/journals/2026-05-05-audit-remediation-5-paper-trail.md`

## References

- Audit Report: `.claude/records/inspections/2026-05-05-full-sweep.md` (Finding 7, Rebuttal Protocol outcome)
- Sibling Order: `.claude/records/permits/2026-05-05-audit-remediation-5-doc-hygiene.md`
- ADR-0010 (current): `docs/adr/0010-computed-resource-data.md`
- PR #156 (Delivery A): commit `2c5ef79`
- PR #160 (Delivery B): merge `56cd7e9`; constituent commits listed in scope item 2
- CLAUDE.md Ledger entry currently says: "ADR-0010 — ComputedResourceData for Result-DTO-sourced responses (marker interface retired; Input/Result namespace split supersedes the `Data`/`DataTransferObjects` duality)"

## Notes from the Issuer

The medium finding survived rebuttal — the Sorter accepted the factual record and proposed the differentiated remediation that became this order. Treat the work accordingly: this is not a chore, it is the third-cycle paper trail debt finally getting paid down.

The DTO migration archaeology is the substantive part. Read all seven constituent commits before drafting the shift log. The `Decisions Made` section is the most important — the Input/Result rule by Action usage direction is a real architectural choice that deserves explicit articulation, not a summary of "we moved files." The dependency-content footnote (DTOs in Input/ may not reference Models; DTOs in Result/ may carry `Collection<Model>`) is the rule's *consequence*, not its essence — write the rule first, then derive the consequence.

For the ADR-0010 amendment: the ADR's original Status / Decision / Consequences structure stays intact. Append the amendment as a clearly demarcated section. The amendment should explain not just *what* changed but *why* — specifically, why the marker interface became redundant once the namespace split was in place. That "why" is the part future-you (or a junior auditor) will want to understand.

The CaptainHook pre-push proposal that came out of the rebuttal is the structural fix that would prevent recurrence. The CEO is deciding on it separately. Whether it's adopted or not, the retroactive paper trail still needs to be filed — the structural fix prevents the next miss, it does not absolve the existing ones.

This order is the larger of the two split remediation orders. Do not rush. The doc-hygiene order can wait for this one if you'd rather work them in either order.

---

**Status:** Closed
**Build Record:** [`2026-05-26-audit-remediation-5-paper-trail`](../build-records/2026-05-26-audit-remediation-5-paper-trail.md)
