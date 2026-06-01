# Minutes — 2026-05-29 — Warden Sweep Follow-Through (WO Dispatch & Stacked Builds)

_Board meeting note between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-05-29 — Warden Sweep Follow-Through (WO Dispatch & Stacked Builds)

### Decisions

- **File 7 Work Orders for the queued sweep findings**: one WO per finding (grouping root-cause with symptom). Two carry an Issuer-decision fork written with a recommended primary + flagged inside the WO rather than blocking on a question.
- **Showcase fork → (a) Migrate**: CEO ruled migrate showcase to `createRouterService()` over amending ADR-0003 for a dev-only carve-out.
- **Stack the work, don't merge #145 first**: CEO chose to stack the follow-up branches and review the whole chain later, rather than merge the sweep PR to clean main between builds.
- **Stacked PRs target their parent branch**: #146 based on `warden-cross-wing-sweep`, #147 on `showcase-routerservice-compliance`, so each PR diff shows only its own work; GitHub auto-retargets bottom-up as bases merge.
- **`--no-verify` over faking WO status**: pushes bypass the PrePushPermitGate permit-slug check because Completed WOs don't satisfy the Open/In-Progress slug match. Reopening a finished WO to pass the gate was rejected as gaming it; testing was run by hand instead (not skipped).

### Friction Signals

- Steward fresh-context review caught a defect or drift in **every** deliverable this session: audit miscount (9 vs 7), ADR-0012 line-159 contradiction, deprecated "ADR-003" citation in new linter messages, and an unflagged base-class scope expansion.
- First sed to revert the EAGER_LOAD constant for the red/green proof silently no-matched (missed the `public const array` type) — Steward caught the unchanged grep output and retried before trusting the result.

### Dynamics

- Brickwright (Gallery) closed the linter gap harder than scoped (showcase had no router override at all) — Steward accepted the expansion but corrected the ADR-number format it introduced.
- Brickwright (Foundry) expanded scope by one file (base-class `ResourceData`) without pre-clearing; Steward did not revert it but independently verified it safe before committing.

### Process Meta

- **Brickwright dispatched twice**: Gallery (showcase RouterService migration + linter checks 6b/6c → PR #146), Foundry (EAGER_LOAD N+1 + arch-test coverage enforcement → PR #147). Both verified independently by the Steward before commit.
- **`/minutes` fired** twice this session (workflow-tool phase, then this follow-through phase — separate files to keep each on its own PR).
- **`--no-verify` on all three pushes** (#145/#146/#147) — permit-slug bypass; full backend suite / frontend gauntlet run by hand first each time.
- Steward independently re-ran: full backend suite (702), `test:arch` red/green proof (revert→RED→restore→GREEN), frontend coverage (100%) + build.

### Notes

- **EAGER_LOAD arch-test now checks coverage, not just existence**: a nesting ResourceData must declare relation-prefixed entries for every relation its nested resources require. Closes the class of N+1 that existence-only checks missed.
- **`ResourceData::validateRelationsLoaded()` validates only the root segment of dotted entries**: Eloquent's `relationLoaded()` can't parse `set.theme`; nested segments are validated by the nested resource's own `from()`. Non-dotted resources (20 of 21) unaffected; ADR-0019 loud-failure guarantee preserved end-to-end.
- **New `lint-vue-conventions` checks 6b/6c** ban raw `<RouterView>`/`<RouterLink>` and raw `vue-router` value imports anywhere under `src/apps/**` (previously only `src/shared/` was covered).

### Action Items

- [ ] CEO: review the three stacked PRs (#145 → #146 → #147), merge bottom-up.
- [ ] CEO: rule the `coverage-gate-scope-honesty` fork — qualify the 100% claim (rec.) vs widen the gate to app services/stores.
- [ ] Steward: remaining queued WOs unbuilt — `extract-parts-list-composables`, `integration-flow-test-assertions`, `family-id-belongs-archtest`, `warden-sweep-doc-reconciliation`.
- [ ] Steward: ADR-0012 Pulse-escalation + ADR-0028 `/adr-interrogator` re-run still pending from the sweep evaluation.

### Open Questions

- Adversarial-verify layer is still unproven (0/9 refuted on the sweep's only run) — watch the refutation rate next sweep before trusting it.

---
