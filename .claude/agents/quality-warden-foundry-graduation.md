# Quality Warden — Foundry Wing Graduation Log

Training proposals from Audits filed against the Foundry Wing (backend / Laravel). Inherited from the pre-merger Inventory Auditor at Stud & Sort Logistics. A proposal must prove itself across **at least 2 audits** before being promoted into the Quality Warden's SOP body. The Steward manages this log.

### Candidates

| Proposal | First Observed | Report Evidence | Context |
|---|---|---|---|
| SOP F-3: verify all FormRequests use `$this->safe()` not `$this->input()` in toDto() | 2026-03-25 | 2026-03-25-full-sweep-baseline | ADR-0006 specifies this; no architecture test enforces it; spot-check was incomplete |
| SOP F-1: document fallback procedure when coverage driver is absent | 2026-03-25 | 2026-03-25-full-sweep-baseline | Coverage driver absent; SOP had no guidance for "unable to measure" scenario |
| When filing a finding about enforcement drift, ask: can the enforcement be made self-maintaining instead? Recommend the structural fix, not a human-memory fix | 2026-03-26 | 2026-03-26-route-test-auto-detect | Filed Finding 2 recommending "add routes to hardcoded list" — the real fix was making the test auto-detect routes. CEO identified the structural solution. |
| SOP F-2 step 6: when a try-catch hits a documented exception type, verify the implementation matches the documented pattern (not just the exception class) | 2026-04-11 | 2026-04-11-post-delivery-sweep | `StartImportAction` catches `UniqueConstraintViolationException` (documented type) but implements re-throw, not upsert retry — a different pattern needing separate documentation |
| SOP F-3: check all prose count references in CLAUDE.md, not just tables | 2026-04-11 | 2026-04-11-post-delivery-sweep | "Ten decisions" prose was stale while the table beneath it had 11 entries; existing SOP focuses on threshold tables |
| SOP F-3 or F-4: verify all Build Records in the audit period have completed Steward Evaluations | 2026-05-05 | 2026-05-05-full-sweep | Findings 5 and 6 — two records with placeholder Steward sections were caught only by reading logs end-to-end; no SOP step prompts checking the Steward's accountability artifact |

### Graduated

| Proposal | Graduated | Confirming Reports | Promoted To |
|---|---|---|---|
| SOP F-2: scan Actions for try-catch blocks | 2026-03-26 | 2026-03-25-full-sweep-baseline, 2026-03-26-routine-sweep | SOP F-2 step 6 |
| SOP F-4: count Policy public methods and compare to unit test describe blocks | 2026-03-27 | 2026-03-26-routine-sweep, 2026-03-27-post-delivery-audit | SOP F-4 step 6 |
| SOP F-3: compare CLAUDE.md quality thresholds against composer.json script values | 2026-03-30 | 2026-03-27-post-delivery-audit, 2026-03-30-full-sweep-post-delivery | SOP F-3 |
| SOP F-3: cross-reference recent Build Record claims against git log to detect undocumented reverts or scope changes | 2026-04-11 | 2026-03-30-full-sweep-post-delivery, 2026-04-11-post-delivery-sweep | SOP F-3 |

### Dropped

| Proposal | Dropped | Report Evidence | Reason |
|---|---|---|---|
| SOP F-3: cross-reference RoutingArchitectureTest hardcoded route list against actual routes | 2026-03-26 | 2026-03-26-route-test-auto-detect | Structurally eliminated — test now auto-detects all auth:sanctum routes. No hardcoded list to cross-reference. |
