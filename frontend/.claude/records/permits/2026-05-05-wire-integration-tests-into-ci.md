# Building Permit: Wire Integration Tests into CI

**Permit #:** 2026-05-05-wire-integration-tests-into-ci
**Filed:** 2026-05-05
**Issued By:** CFO (per CEO directive)
**Assigned To:** Lead Brick Architect
**Priority:** Standard
**Blocked By:** [`2026-05-05-fix-integration-test-assertions`](./2026-05-05-fix-integration-test-assertions.md) — must land first

---

## The Job

Add `npm run test:integration:run` as a required, gating step in `.github/workflows/ci.yml`. The CEO has decided integration tests must run in CI; this permit implements that decision per the Building Inspector's Q3 specification in inspection report `2026-05-05-integration-test-baseline-triage`. Permit A delivers a green baseline; Permit B locks the gate.

## Scope

### In the Box

**One YAML edit** to `.github/workflows/ci.yml`. Insert a new step between `Test with coverage` and `Build`:

```yaml
- name: Integration tests
  run: npm run test:integration:run
```

The Inspector's Q3 specified exact placement, exact rationale, and exact step text. Match it. The placement is deliberate: unit tests must pass first (their failures make integration results noise), and Build can fail independently.

After the YAML edit:

1. Open a PR (a CI change can only be verified end-to-end on the PR run itself).
2. Confirm the CI workflow runs the new step on the PR.
3. Confirm the new step exits 0 (because Permit A delivered a green baseline).
4. Confirm the step appears as a required check on the PR (GitHub Actions step failures gate merge by default for PRs targeting `main`).
5. Merge.

### Not in This Set

- **No assertion fixes.** Permit A handles those. If `npm run test:integration:run` is failing on `main` when this permit starts, **pause and check in** — Permit A may not have completed cleanly.
- **No new workflow files.** The Inspector's recommendation was explicit: extend `ci.yml`, do not create `integration.yml`. Two workflows mean two status checks for PR authors to watch; one workflow stays simpler.
- **No parallelization.** The Inspector evaluated parallel-vs-serial and recommended serial in the existing job. The 19.37s integration runtime does not justify the ~45-60s job-setup overhead of a parallel job. Serial wins on simplicity and total wall-clock time.
- **No fail-fast / `--bail` flag.** The Inspector specified run-to-completion to match the firm's discipline on the unit gauntlet. Multiple failures should be visible in one CI log so fixes can be batched.
- **No changes to pre-push.** The CEO directive specified CI; pre-push integration would add 19.37s to every developer's push and is a separate decision not yet authorized. Keep the pre-push gauntlet as-is.
- **No ADR-013 update in this permit.** That doc-drift item (Open Questions section, Enforcement section) is a separate hygiene pass — file as a doc permit if you want, but don't couple it here. The CI change is the load-bearing deliverable.
- **No bundle-size / coverage / knip changes.** This permit touches one YAML file.

## Acceptance Criteria

- [ ] `.github/workflows/ci.yml` contains a new step named "Integration tests" running `npm run test:integration:run`
- [ ] The step is positioned between `Test with coverage` and `Build` in the steps list (matches Inspector's Q3 specification exactly)
- [ ] The PR's CI run shows the new step executing and passing (verifiable in the GitHub Actions UI on the PR)
- [ ] No allowed-failure or `continue-on-error` flag — the step blocks merge on failure
- [ ] Pre-push gauntlet clean (type-check, knip, test:coverage, build — note that the pre-push gauntlet does NOT yet run integration tests; this permit does not change that)
- [ ] Journal records: the PR# where the new CI step first ran green, confirming the gate works end-to-end
- [ ] After merge, the next PR (or push to `main`) shows "Integration tests" as a normal CI step, neither skipped nor flagged

## References

- **Inspection Report (Q3 specification):** [`2026-05-05-integration-test-baseline-triage`](../inspections/2026-05-05-integration-test-baseline-triage.md) — Q3 section has exact step, placement, rationale
- **Predecessor Permit:** [`2026-05-05-fix-integration-test-assertions`](./2026-05-05-fix-integration-test-assertions.md) — must land first to deliver green baseline
- **CEO Directive:** Recorded in the triage permit's "CEO Directive" section (added 2026-05-05 post-PR #210 merge): "Integration tests must run in CI."
- **Current CI workflow:** `.github/workflows/ci.yml` (11 sequential steps; the new step becomes the 8th)
- **ADR-013** (page integration tests) — Enforcement section is silent on CI inclusion. Not updated in this permit; flag as doc drift if appropriate.

## Notes from the Issuer

This is the smallest possible permit — one YAML step, one acceptance check (the gate works end-to-end on the PR). The discipline is in _not expanding scope_:

- **Don't add a parallel job to "shave time."** The Inspector evaluated this; the math doesn't work for a 19.37s suite.
- **Don't add `continue-on-error: true` because "we're being careful."** The whole point of the CEO directive is that integration tests must be a real gate. Allowed-failure is the mechanism that created the original gap.
- **Don't update `ADR-013` Enforcement section in the same PR.** Doc updates and CI changes are different reviews; couple them only if a reviewer explicitly asks. The CFO will track ADR-013 doc drift separately.
- **Don't change `pre-push`.** Pre-push integration would add 19.37s to every developer's push; that's a distinct decision the CEO has not authorized. The CI gate is sufficient on its own — every PR runs CI, every merge runs CI on `main`.

The Inspector's Q3 was unusually specific because the design work was the inspection's load-bearing output. The architect's job is to faithfully implement the Inspector's recommendation, not to relitigate the trade-offs. If the architect spots an objection during implementation (e.g., the `npm ci` step is missing dependencies needed by the integration runner), surface it as a finding in the journal and pause — but the default is "implement as specified."

A reasonable expectation: 15 minutes plus a CI round-trip. The architect's elapsed time on the YAML edit itself is trivial; the work is verifying the gate operates correctly on the PR run.

After this permit lands, the inspector's two graduation candidates from the triage report transition meaning: SOP-1's "include integration tests in inspection gauntlet" becomes a _backup_ detection layer (CI is now the primary), and SOP-7's "assertion-depth audit for integration tests" becomes the next methodology evolution to track. The CFO will revisit Pulse Pattern Maturity for ADR-013 after this permit ships — promoting it back to "Battle-tested" once both the suite is green and the gate is wired.

---

**Status:** Open (blocked by Permit A)
**Journal:** _link to construction journal when filed_
