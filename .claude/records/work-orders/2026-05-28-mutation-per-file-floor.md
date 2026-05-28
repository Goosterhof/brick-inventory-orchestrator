# Work Order: Enforce per-file mutation score floor (post-v2)

**Work Order #:** 2026-05-28-mutation-per-file-floor
**Filed:** 2026-05-28
**Issued By:** The Steward (in response to General review of PR #135)
**Assigned To:** Brickwright (Gallery Wing)
**Wing:** Gallery
**Priority:** Soon
**Branch slug (for PrePushPermitGate):** `mutation-per-file-floor`

---

## The Job

PR #135 reintroduced Stryker mutation testing for the Gallery Wing with a `break: 90` threshold. The threshold operates on the **aggregate** score across all 9 mutated files. The General review flagged a structural concern: an aggregate-only floor lets weak files hide behind strong siblings. Triage of `useValidationErrors.ts` (72.22 → 94.44) shipped in PR #135 closed the loudest offender, but two files remain below the 90% per-file floor:

- `src/shared/helpers/bricklinkWantedList.ts` — **88.64%** (5 survivors, 39 mutants evaluated)
- `src/shared/services/auth/guards.ts` — **89.47%** (2 survivors + 5 timeouts, 19 mutants evaluated)

Both are within ~1.5 points of the per-file floor. The fs-packages reference setup avoids this shape because each Stryker config covers exactly one package — per-config aggregate ≈ per-file enforcement. BIO's 9-file single-config aggregate is structurally weaker on per-file enforcement; this WO addresses both the immediate laggards and the structural gap.

## Scope

### In the Box

- **Triage `bricklinkWantedList.ts` to ≥90% per-file score.** Five survivors; likely candidates for Path A tightening (similar pattern to the csv.ts and earlier bricklinkWantedList wins on Blob inspection — the remaining survivors are in the XML rendering path).
- **Triage `guards.ts` to ≥90% per-file score.** Two survivors are both `BooleanLiteral` mutations on `return true` (lines 18 + 24). The 5 timeouts indicate Stryker is correctly killing mutants via test runner crash, but per-file aggregate counts only the clean kills. Either tighten the route-guard tests to assert on the next-function call arguments, or surface the timeout-as-kill in the per-file score via a Stryker config tweak.
- **Decide on per-file enforcement mechanism.** Stryker does not support per-file `break` thresholds natively. Three options for institutionalizing the per-file floor:
  1. **Manual triage cadence** documented in Pulse: "any per-file score below 90 for two consecutive Stryker runs blocks the next merge". Cheap; relies on human discipline.
  2. **Custom `posttest:mutation` script** that parses Stryker's JSON reporter output and fails if any per-file score is below 90. Honest enforcement; ~30 lines of node.
  3. **Multiple Stryker configs** (one per scope: helpers, composables, middleware, services) to bring fs-packages-style per-package enforcement. Cleanest structurally; multiplies CI time by ~4.

### Not in This Set

- **Expanding mutation scope** beyond the current 9 files. That's a separate decision tied to whether the v2 install settles in CI without flake.
- **Lowering the `break: 90` threshold.** Same Path A discipline as v2 — if files can't make 90%, tighten or split, don't lower.
- **Pre-emptive triage of files currently AT 90+%.** Only the two laggards (`bricklinkWantedList.ts`, `guards.ts`) are in scope; the eight other files cleared the floor.

## Acceptance Criteria

- [ ] `src/shared/helpers/bricklinkWantedList.ts` per-file mutation score ≥ 90%
- [ ] `src/shared/services/auth/guards.ts` per-file mutation score ≥ 90%
- [ ] Aggregate mutation score remains ≥ 90% (sanity — the triage shouldn't regress elsewhere)
- [ ] Per-file enforcement mechanism (option 1, 2, or 3 above) chosen, documented, and (if a script) implemented
- [ ] If option 2 (posttest script) chosen: script lives at `frontend/scripts/check-mutation-per-file-floor.mjs`, wired as `posttest:mutation` in `package.json`, tested locally with a deliberately-failing setup
- [ ] Pulse "Mutation testing (Stryker) v2" row updated to reflect the new per-file enforcement (and promote to Battle-tested if appropriate)
- [ ] Build Record explicitly captures which enforcement option was chosen and why the other two were rejected

## References

- General review of PR #135: structural concern about aggregate hiding weak files
- v2 Build Record: [2026-05-28-frontend-mutation-testing-v2](../build-records/2026-05-28-frontend-mutation-testing-v2.md)
- v2 Work Order: [2026-05-28-frontend-mutation-testing-v2](2026-05-28-frontend-mutation-testing-v2.md)
- fs-packages per-package-per-config pattern: `/home/goosterhof/Code/war-room/territories/fs-packages/packages/*/stryker.config.mjs`

## Notes from the Issuer

This is the structural-debt follow-up to v2. v2 was deliberately scope-tight ("install + CI gate + clear the aggregate threshold"); v2's WO explicitly deferred per-file triage. The General's review correctly identified that deferral as a soft commitment that would rot if not formalized. This WO is the formalization.

Recommended option for the enforcement mechanism: **option 2 (posttest:mutation script)** — it gives honest enforcement without multiplying CI time, sits in BIO without depending on Stryker upstream behavior, and is ~30 lines of node. Option 1 is too soft; option 3 is too expensive for a 9-file scope.

Priority is **Soon** rather than **Now** — v2 needs to settle in CI for a sprint to confirm the install is stable before we ratchet enforcement. If v2's CI gate flakes or surfaces unexpected costs, this WO should reorder behind the stabilization work.

---

**Status:** Open
**Build Record:** _to be filled when filed_
