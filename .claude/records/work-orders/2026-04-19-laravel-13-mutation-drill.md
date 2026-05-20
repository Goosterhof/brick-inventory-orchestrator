# Shipping Order: Laravel 13 Mutation Drill

**Order #:** 2026-04-19-laravel-13-mutation-drill
**Filed:** 2026-04-19
**Issued By:** Logistics Director (CEO-approved)
**Assigned To:** Head Sorter
**Priority:** Standard — blocks the next feature shift

---

## The Shipment

Run the mutation drill (`composer mutation`) on the Laravel 13 codebase and document the result. This is the one deferred acceptance criterion from shipping order `2026-04-19-laravel-13-upgrade`. Until it lands, "Laravel 13 upgrade complete" is partially unvouched — no feature work should ship in front of it.

## Scope

### In the Crate

1. **Run the drill:**
   ```
   COMPOSER_ALLOW_SUPERUSER=1 composer mutation
   ```
   The `COMPOSER_ALLOW_SUPERUSER=1` prefix is mandatory in this container — Composer 2.x refuses to load plugins as root without it (documented in the parent upgrade's shift log).
2. **Capture the MSI** (Mutation Score Indicator). Acceptance threshold is **≥ 76%** on Actions & Services per the mutation script definition (`--testsuite=Unit --path=app/Actions,app/Services --min=76`).
3. **Compare against the pre-upgrade baseline if available.** The CaptainHook pre-push or prior audit reports may have a recorded baseline — check `.claude/records/inspections/` and recent shift logs. If no baseline is findable, state that explicitly in the shift log.
4. **If MSI dips below 76%:** investigate the surviving mutants. The most plausible L13-related suspects:
   - `app/Actions/Family/GetFamilyPartsAction.php` — the `selectRaw()` + bound-parameter refactor may have introduced mutants that weren't there in the string-interpolation version.
   - `app/Jobs/ImportOwnedSetsJob.php` — the new `#[Timeout]` / `#[FailOnTimeout]` attributes and their reflection tests.
   Document each survivor's location, the mutation applied, and whether it represents a real test-coverage gap or a framework-behavior change we should accept.
5. **If survivors represent real gaps:** write the missing tests and re-run the drill. The shift is not complete until MSI is ≥ 76% or the Director has explicitly ratified a temporary exemption.
6. **File the shift log** at `.claude/records/journals/2026-04-19-laravel-13-mutation-drill.md` following `.claude/records/journals/.shift-log-template.md`. The log must include:
   - Final MSI, with baseline comparison if available.
   - Per-survivor analysis if any dips were addressed.
   - Confirmation that the parent shipping order `2026-04-19-laravel-13-upgrade` can now be marked fully complete.
   - A short back-pointer updating the parent log's "Known Open Items" section (this will need a scoped commit: `docs(arch): resolve deferred mutation drill from L13 upgrade`).

### Not on This Pallet

- **No other work.** No code changes beyond writing tests for documented MSI gaps. No refactors, no feature additions, no unrelated cleanups. The three sorter timeouts on the parent order were — per the Director's hypothesis — caused by mixing the long-running drill with judgment calls. This order is the isolation test for that hypothesis.
- **No mutation-testing philosophy changes.** The 76% threshold is set in `composer.json` and reflected in ADR discussions; do not unilaterally raise or lower it.
- **No Octane boot smoke check.** That's the other follow-up item in the parent log, and it belongs in its own 60-second shift when the next feature work starts.

## Acceptance Criteria

- [ ] `COMPOSER_ALLOW_SUPERUSER=1 composer mutation` executed to completion.
- [ ] Final MSI reported in the shift log, with baseline comparison if available.
- [ ] MSI ≥ 76%, OR every surviving mutant below that threshold is documented and has a ratified disposition (new test written, or Director-ratified exemption).
- [ ] Shift log filed at `.claude/records/journals/2026-04-19-laravel-13-mutation-drill.md`.
- [ ] Parent shipping order's status line updated to remove the "pending mutation-drill follow-up" qualifier, in the same commit as the new shift log.
- [ ] Branch pushed to origin with `COMPOSER_ALLOW_SUPERUSER=1 git push -u origin claude/laravel-13-upgrade-exploration-W5nU8` (or a fresh branch if the CEO wants this on its own PR — default to same branch unless told otherwise).

## References

- Parent shipping order: `.claude/records/permits/2026-04-19-laravel-13-upgrade.md`
- Parent shift log: `.claude/records/journals/2026-04-19-laravel-13-upgrade.md` — read the "Known Open Items" and "Gotchas" sections before starting.
- Mutation command definition: `composer.json` line `"mutation": "php -d pcov.enabled=1 ./vendor/bin/pest --mutate --path=app/Actions,app/Services --testsuite=Unit --parallel --min=76"`.
- ADR-0003 (Actions/Services separation), ADR-0011 (save-what-you-can import atomicity) — relevant if surviving mutants land in the `ImportOwnedSetsAction` try-catch boundary.

## Notes from the Issuer

**Sequencing discipline.** The parent order was sunk by running the drill inside a shift that also had judgment calls and paper-trail work. This order is the isolation remedy. When you start, the order of operations is:

1. Read the parent shift log first (five minutes, no tool-call budget in the drill itself).
2. Run the drill. It will take ~10 minutes. Do not multitask — no file reads, no refactors, no log authoring while it runs.
3. If the drill passes clean, file the shift log and close out. One focused commit. Done.
4. If the drill fails, **stop and report before writing any tests**. Surviving-mutant analysis is its own judgment call and the Director wants to see it before you commit fixes. This prevents you from paper-trail-less fixing in an already time-pressured shift.

**If the shift runs long,** the rule from the parent-shift retrospective applies: file a minimal stub shift log before continuing, capturing MSI and any in-flight observations. A stub log is a recoverable position; a timed-out shift with no paper trail is not.

**The baseline question.** If no prior MSI is recorded anywhere in the warehouse's records, record today's result as the new baseline and note the gap in the log. We should not upgrade again without a baseline to compare against — that's a lesson from this upgrade worth carrying forward.

**Protocol deviation carryover.** The parent log was Director-authored because of three sorter timeouts. This order is the *test* of whether narrowing scope to a single long-running step and nothing else lets the Sorter complete a shift cleanly. If this one times out too, we have an environment-level issue that isn't about shift design, and the Director will escalate.

---

**Status:** Completed (closed retroactively 2026-05-20 in paper-trail sweep)
**Shift Log:** _to be linked when filed_

---

_**Closed retroactively 2026-05-20** during paper-trail-drift sweep. Build Record (already filed): [`2026-04-19-laravel-13-mutation-drill`](../build-records/2026-04-19-laravel-13-mutation-drill.md). See sweep Build Record: [`2026-05-20-wo-closure-sweep`](../build-records/2026-05-20-wo-closure-sweep.md)._
