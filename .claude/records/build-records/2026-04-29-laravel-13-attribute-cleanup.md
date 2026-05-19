# Shift Log: Remove Non-Existent Laravel Attribute References

**Log #:** 2026-04-29-laravel-13-attribute-cleanup
**Filed:** 2026-04-29
**Shipping Order:** [`2026-04-29-laravel-13-attribute-cleanup`](../permits/2026-04-29-laravel-13-attribute-cleanup.md)
**Sorter:** Head Sorter

---

## Work Summary

| Action | File | Notes |
|---|---|---|
| Modified | `app/Jobs/ImportOwnedSetsJob.php` | Dropped the two `use Illuminate\Queue\Attributes\{Timeout,FailOnTimeout};` imports and the two `#[Timeout(600)]` / `#[FailOnTimeout]` class decorators. Replaced with two typed instance properties on the class body: `public int $timeout = 600;` and `public bool $failOnTimeout = true;`. These are Laravel's canonical job-timeout configuration mechanism (since L8) and produce identical worker behavior — kill after 600s, route through `failed()`. |
| Modified | `config/sanctum.php` | Reverted line 6 import and line 85 value from the non-existent `Illuminate\Foundation\Http\Middleware\PreventRequestForgery` to the actually-installed `Illuminate\Foundation\Http\Middleware\ValidateCsrfToken`. Confirmed `vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/ValidateCsrfToken.php` exists; `PreventRequestForgery.php` does not. |
| Modified | `tests/Feature/Jobs/ImportOwnedSetsJobTest.php` | Dropped the two `use Illuminate\Queue\Attributes\{Timeout,FailOnTimeout};` imports. Rewrote the two reflection-based tests (lines 187-210) to instantiate a real `ImportOwnedSetsJob` and assert on property access with strict equality: `->timeout` → `expect(...)->toBe(600)`, `->failOnTimeout` → `expect(...)->toBeTrue()`. The old `getAttributes(NonExistentClass::class)->toHaveCount(1)` form silently passed because PHP doesn't autoload attribute classes until `newInstance()` is called — the new shape exercises actual property reads with values the queue worker reads at runtime. |

`bootstrap/app.php` was **not** touched, per the permit's "Not on This Pallet" boundary. Verified its line 33 still uses `$middleware->validateCsrfTokens(except: [...])`, which remains a valid method name in Laravel 13.

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| `app/Jobs/ImportOwnedSetsJob.php` no longer imports or references the non-existent attribute classes; `$timeout` and `$failOnTimeout` properties present, typed, set to `600` and `true` | Yes | Lines 13-14 (the two attribute `use`s) and lines 17-18 (the two decorators) gone; lines 19-21 replaced them with typed instance properties. |
| `config/sanctum.php` imports and references `Illuminate\Foundation\Http\Middleware\ValidateCsrfToken`; no `PreventRequestForgery` reference remains | Yes | Both line 6 (import) and line 85 (`'validate_csrf_token'` value) reverted. |
| `tests/Feature/Jobs/ImportOwnedSetsJobTest.php` rewrites assert against property access with strict equality, fail loudly if the property is missing or wrong-valued | Yes | **Verified by sandbox mutation:** temporarily set `$timeout = 599` and `$failOnTimeout = false` on the job class, ran the two filtered tests — both failed loudly (`Failed asserting that 599 is identical to 600.` and `Failed asserting that false is true.`). Restored to correct values; tests passed again. The new assertions cannot survive a property removal or wrong-valued assignment. |
| `composer phpstan` reports 0 errors at level max (was 6) | Yes | Baseline output captured 6 errors across the three target files; final `composer phpstan` reports `[OK] No errors` across all 308 analyzed files. **Delta: 6 → 0.** |
| `composer test` passes 569/569 (was 568 passing + 1 failing) | Yes | All 569 tests pass with 2330 assertions. The previously failing test (`should declare a 600 second timeout via the Timeout attribute` → renamed to `should declare a 600 second timeout`) now passes. **Delta: 568+1F → 569.** |
| `composer lint:test`, `composer deptrac`, `composer test:arch` all pass | Yes | lint:test: `{"result":"pass"}`; deptrac: 0 violations / 651 allowed / 0 errors; test:arch: 90 passed (1678 assertions). |
| Coverage drivers remain unavailable (Open Item); filtered tests over the touched files pass | Yes (with substitution) | `composer test:coverage`, `composer test:feature-coverage`, and `composer mutation` all abort with `No code coverage driver is available.` — environmental, documented in pulse under "PHP coverage driver missing from environment." Substituted: `./vendor/bin/pest --filter "ImportOwnedSetsJob"` runs all 9 ImportOwnedSetsJob tests including the two rewrites — 9 passed, 32 assertions, 0 failures. |
| Shift log records mechanism used and a grep on remaining references to the non-existent symbols | Yes | Mechanism: instance properties (`public int $timeout = 600` / `public bool $failOnTimeout = true`) — Laravel's canonical job-timeout API since L8, not the attribute approach. **Pre-flight grep:** `grep -rn -E "Illuminate\\\\Queue\\\\Attributes\\\\(Timeout\|FailOnTimeout)\|Illuminate\\\\Foundation\\\\Http\\\\Middleware\\\\PreventRequestForgery" --include="*.php" . | grep -v "^./vendor/"` — **zero hits.** Repo is clean of the three non-existent symbols outside vendor. |

## Decisions Made

1. **Properties over attributes for the job timeout configuration.** The permit specified properties; this is the right call regardless. The `$timeout` and `$failOnTimeout` instance properties are Laravel's canonical, framework-documented mechanism since L8 and are read by the queue worker via `Worker::process()` and `JobProcessing` event handling. No L13 attribute equivalents exist (the `Illuminate\Queue\Attributes` namespace has no public classes in v13.5.0; the directory itself doesn't ship). The attribute approach the 2026-04-19 shift attempted was speculative — properties are the actual API.

2. **Strict equality on property access for the rewritten tests.** The permit warned about the original failure mode — `getAttributes(NonExistentClass::class)->toHaveCount(1)` returns an empty `array` against a non-existent class because PHP returns matched attributes (zero of them), not an error. To prove the rewrites avoid this trap, I instantiate the job with positional `(importJobId: 1, familyId: 1)` and assert directly on `->timeout` (`->toBe(600)` — strict integer equality) and `->failOnTimeout` (`->toBeTrue()` — strict bool equality). Then I executed a **sandbox mutation check**: changed the property values to `599` and `false`, re-ran the two filtered tests, and confirmed both failed loudly. Restored. The tests cannot pass against a missing or wrong-valued property.

3. **Sandbox mutation check executed on production code, not in a separate fixture file.** The permit said "verify by temporarily mutating the property in a sandbox check, or by using a strict equality assertion on the value." I did both. The strict equality is in the committed assertions; the property-mutation sandbox check was a transient `Edit` on `ImportOwnedSetsJob.php` that I reverted immediately after confirming the failure modes. No code from the sandbox check remains in the working tree. This is more rigorous than just trusting `toBe(600)` would catch a mutation — I proved it does.

4. **`bootstrap/app.php` left alone.** The permit's "Not on This Pallet" called this out explicitly: the file still uses `$middleware->validateCsrfTokens(except: [...])` which is correct for L13 (the `preventRequestForgery()` rename the 2026-04-19 journal claimed never landed, and `validateCsrfTokens()` remains valid). I verified this with `grep` before starting and confirmed `git diff --stat bootstrap/app.php` is empty after the shift. Zero touches.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | `{"result":"pass"}` — Rector and Pint clean on the three modified files. |
| phpstan | Pass | **6 → 0 errors at level max** across 308 files. The exact 6 errors the permit identified (`ImportOwnedSetsJob.php:17-18`, `config/sanctum.php:85`, `ImportOwnedSetsJobTest.php:192/198/206`) are gone. |
| deptrac | Pass | 0 violations, 651 allowed dependencies, 0 errors. The Job layer's existing dependency edges still hold; no new edges introduced. |
| test | Pass | **569 passed, 2330 assertions** (was 568 passing + 1 failing). The previously failing reflection test now passes after the rewrite. |
| test:arch | Pass | 90 architecture tests passed, 1678 assertions. `JobArchitectureTest` accepts the property-based shape — no architectural drift introduced. |
| test:coverage | Cannot measure | `No code coverage driver is available.` — environmental Open Item documented in pulse. Substituted with filtered runs (see below). |
| test:feature-coverage | Cannot measure | Same root cause. |
| mutation | Cannot measure | Same root cause — Pest aborts with "Mutation testing requires code coverage to be enabled." |

**Filtered runs over the touched surface area (substituting for the unavailable coverage drivers):**

- `./vendor/bin/pest --filter "ImportOwnedSetsJob"` — **9 passed, 32 assertions, 0 failures.** All `ImportOwnedSetsJobTest` cases including the two rewrites green.
- **Sandbox mutation check** (transient, reverted): `$timeout = 599` and `$failOnTimeout = false` → both rewritten tests **failed loudly** with diagnostic messages (`Failed asserting that 599 is identical to 600.` and `Failed asserting that false is true.`). Restored to `600` / `true`; both tests passed again. This is the strongest possible substitute for mutation testing on this surface area — manual targeted mutation, with the mutation site visible and the test reaction observable.

**Pre-flight grep for the three non-existent symbols (post-fix, excluding vendor):**

```
grep -rn -E "Illuminate\\\\Queue\\\\Attributes\\\\(Timeout|FailOnTimeout)|Illuminate\\\\Foundation\\\\Http\\\\Middleware\\\\PreventRequestForgery" --include="*.php" . | grep -v "^./vendor/"
```

**Result: empty.** Zero hits across all PHP files outside vendor. The repo is clean of the three drift symbols.

## Showcase Readiness

Strong. The cleanup restores the warehouse to the "PHPStan: 0 errors, tests: all green" state the 2026-04-19 journal claimed but did not deliver. A senior architect auditing the warehouse will see:

- A queue job that uses Laravel's canonical, framework-documented timeout API — not a speculative attribute path that doesn't exist in the installed framework.
- A Sanctum config that imports and references a real class from vendor.
- Two timeout-configuration tests that actually exercise property access with strict equality, not toothless reflection that silently passes against missing classes.
- A complete pre-flight grep result demonstrating no other code path still references the broken symbols.

This is a defensibly minimal correction — three files, surgical edits, a sandbox mutation check to prove the test rewrites have teeth, and an exhaustive grep to confirm zero other contamination. Nothing speculative was added, nothing scope-adjacent was refactored.

The original failure mode is now impossible to reintroduce silently: if a future shift writes `getAttributes(SomeClass::class)->toHaveCount(N)` against a missing class, the assertion will pass — but the JobArchitectureTest and PHPStan would catch the missing class on the property itself, because the property API is what the codebase commits to.

## Proposed Knowledge Updates

- **Learnings:** Propose a new entry under "Mistakes Not to Repeat" — *"Reflection-based attribute assertions silently pass against non-existent attribute classes. PHP's `ReflectionClass::getAttributes(MissingClass::class)` returns an empty array (zero matches), not an error — so `->toHaveCount(1)` fails for the right reason but `->toHaveCount(0)` would silently pass. When asserting on attribute presence, either (a) call `->newInstance()` to force class autoloading and get a hard failure on missing classes, or (b) prefer property-based APIs where they exist (Laravel job `$timeout` / `$failOnTimeout` are the canonical mechanism)."* This explains the original 2026-04-19 mistake's root cause in operational terms — useful for any future Sorter writing reflection tests.

- **Pulse:** Suggest the Logistics Director update "Quality Metrics" — `PHPStan` row should remain "Level max, 0 errors" (still true, but was briefly 6 errors per the storage-map shift's flagged finding). Also: drop the residual mention of the 6-error contract drift from any "Active Concerns" / "Tech Debt" pickup if the storage-map shift log surfaced it. The "Open Item: PHP coverage driver missing from environment" entry stays — that constraint is unchanged.

- **Decision Record:** No new ADR. The job-layer convention (instance properties for queue worker config) is implicit in the existing `JobArchitectureTest` regulation and matches Laravel framework documentation. No architectural choice was made — this is enforcement of the framework's actual API surface against speculative non-existent symbols.

**Out-of-scope tech debt surfaced earlier (already noted by the storage-map shift, now resolved by this shift):**

- The 6 PHPStan errors flagged in `2026-04-29-storage-map-resource-data.md` are now resolved. No further follow-up shipping order is needed for the symbol drift itself.
- The deferred mutation drill from the L13 upgrade (separate Open Item) remains untouched per the permit's "Not on This Pallet."

## Self-Debrief

### What Went Well

- **Gauntlet protocol followed top-to-bottom.** Read pulse, learnings, recent shift logs (especially the 2026-04-29 storage-map log that pre-flagged this exact drift), then the permit. Baselined PHPStan to confirm the 6 errors before starting. Verified `vendor/.../ValidateCsrfToken.php` exists before assuming the revert was safe.
- **Sandbox mutation check on the test rewrites.** The permit explicitly warned about the silent-pass failure mode of reflection-based assertions. Rather than just trusting `->toBe(600)` is "obviously" stricter, I temporarily mutated the property values to `599` / `false` and confirmed the tests fail loudly with the right diagnostics. Restored after. This is the kind of paranoia the permit asked for, and it is documented above so a Director can verify the chain of evidence.
- **Pre-flight grep.** One command confirmed zero residual references to the three non-existent symbols anywhere in the repo outside vendor. This is the single best signal that the cleanup is complete — no other test file, no other config file, no other doc has the broken imports.
- **Scope discipline.** Three files modified. `bootstrap/app.php` not touched. No refactoring of the import job's retry semantics, no audit of other ResourceData, no expansion into the deferred L13 mutation drill. The permit's "Not on This Pallet" was strictly observed.

### What Went Poorly

- **No friction.** This is genuinely a low-complexity, well-scoped paper-trail correction. The only judgment call was whether to add the sandbox mutation check, which I did because the permit specifically warned about the failure mode. Nothing else was hard.

### Blind Spots

- **I trusted the permit's "ValidateCsrfToken exists" claim before verifying.** The first thing I did was `ls vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/` to confirm. The class was there, but if it hadn't been, I'd have needed to escalate immediately rather than guess. Worth noting that "the permit said the class exists" is not evidence — `ls vendor/...` is.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| When rewriting reflection-based tests for the same intent (e.g., "assert configuration N is present"), don't trust strict equality on its own — temporarily mutate the production value, run the test, confirm it fails loudly, then restore. The original failure mode was a silent-pass against a missing class; the rewrite must demonstrably catch that mode | The 2026-04-19 shift wrote `getAttributes(Timeout::class)->toHaveCount(1)` thinking it asserted attribute presence; in reality, against a non-existent class, `getAttributes()` returns `[]` and `->toHaveCount(0)` would have silently passed. The new shape (`->toBe(600)` on property access) is structurally stricter, but I only know it's stricter because I ran the mutation check. Future Sorters should treat the mutation check as a required step when rewriting reflection tests, not optional. | This log |
| Before assuming a vendor class exists, run `ls vendor/<package-path>/` and verify — even when the permit asserts the class exists. Permit text is design intent; the filesystem is ground truth | Permit said "`ValidateCsrfToken` exists in vendor; `PreventRequestForgery` does not." I verified both with `ls` before editing. If I'd skipped the check and the assumption had been wrong, the cleanup would have introduced a fresh PHPStan error. The cost of one `ls` call is negligible; the cost of an undetected wrong assumption is a failed gauntlet and a re-do | This log |
| When a permit names a "must drop from N to M" delta on a metric (PHPStan errors, test count, etc.), capture the baseline value with the actual command before starting, and report the captured value in the shift log alongside the post-fix value. Memo-text quoting "was 6" isn't evidence — `composer phpstan` output captured at T0 is | The permit said "6 errors → 0." I ran `composer phpstan` before editing, captured the 6 errors with file/line/message detail, then ran it again at the end and captured the `[OK] No errors` output. Both captures are referenced in the Order Fulfillment table above. This makes the delta verifiable by anyone reviewing the log without re-running the command | This log |

## Methodology Objection

None. The Auditor SOPs were not exercised on this shift (no audit findings to rebut, no SOP gaps to flag). This was a permit-driven Sorter shift end to end.

---

**Permit closed.** The shipping order's status table now reads `Completed`; the file's status footer is updated to link to this shift log.

---

## Logistics Director Evaluation

**Overall Assessment:** Excellent

### Order Fulfillment Review

Every acceptance criterion met. The 6 → 0 PHPStan delta and 568+1F → 569 test delta are captured with the actual command output, not memo text — verifiable by any future reviewer without re-running. The pre-flight grep returning zero hits is the cleanest possible "we got everything" signal for a symbol-drift cleanup. `bootstrap/app.php` correctly untouched per the permit boundary, with `git diff --stat` cited as proof of zero touches.

The two unmeasurable acceptance criteria (`test:coverage`, `test:feature-coverage`, plus mutation by extension) hit the same environmental gap as the storage-map shift this morning. The substitution chosen — filtered run over the touched surface (9 passed, 32 assertions) plus the sandbox mutation check — is the strongest available substitute, and the Sorter documented it as a substitution rather than pretending it was equivalent. This is honest reporting, not coverage of an environmental constraint.

### Decision Review

Four decisions, all sound. The standout is decision #3 — the sandbox mutation check on production code:

The permit said "verify by temporarily mutating the property in a sandbox check, **or** by using a strict equality assertion on the value." The Sorter did *both*, and proved the second by running the first. That is one rung above what the permit asked for, and exactly the rigor the original silent-pass failure deserved. Anyone reviewing this log can verify the chain of evidence: baseline PHPStan output → mutation to 599/false → both tests fail loudly with diagnostic messages → restore to 600/true → both tests pass again. This is the strongest possible refutation of "could the rewrites silently pass?" — direct experimental evidence that they cannot.

Decisions #1 (properties over attributes), #2 (strict equality on property access), and #4 (`bootstrap/app.php` untouched) are all routine correct calls within the permit's frame. None warranted CEO escalation. The Sorter's framing of decision #1 — "no L13 attribute equivalents exist; the `Illuminate\Queue\Attributes` namespace has no public classes in v13.5.0; the directory itself doesn't ship" — is the kind of grounded, vendor-verified statement that distinguishes a Sorter from a senior Sorter.

### Showcase Assessment

Strong. The warehouse's actual state now matches what the 2026-04-19 journal claimed but did not deliver. A future auditor reading the upgrade journal + this shift log + the Director's Amendment gets the complete honest record: original work, divergence detected, divergence corrected, code matches docs. That sequence is portfolio-grade — it demonstrates that this team self-corrects when the paper trail diverges from reality, rather than letting the divergence fester.

The decision to do a sandbox mutation check on production code (rather than in a separate fixture file) is the right move and worth keeping in the visible record — it shows that the test rewrites were *demonstrated* to be loud-failing, not just structurally argued to be.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| When rewriting reflection-based tests for the same intent (e.g., "assert configuration N is present"), don't trust strict equality on its own — temporarily mutate the production value, run the test, confirm it fails loudly, then restore | Candidate | Specific trigger (rewriting reflection-based tests), specific check (mutate prod value, run, confirm loud fail, restore), strong evidence (this shift demonstrated the original silent-pass failure mode and the rewritten loud-fail behavior). Will graduate on a second confirming observation — likely whenever a future shift rewrites tests around a non-trivial reflection assertion. |
| Before assuming a vendor class exists, run `ls vendor/<package-path>/` and verify — even when the permit asserts the class exists. Permit text is design intent; the filesystem is ground truth | Candidate | Specific trigger (assuming a vendor class exists from permit text), specific action (`ls vendor/<path>/`), strong rationale articulated by the Sorter ("permit text is design intent; filesystem is ground truth"). The cost of the check is negligible; the cost of skipping it is a failed gauntlet. Will graduate on a second confirming observation. |
| When a permit names a "must drop from N to M" delta on a metric (PHPStan errors, test count, etc.), capture the baseline value with the actual command before starting, and report the captured value in the shift log alongside the post-fix value | Candidate | Specific trigger (permit specifies a delta on a metric), specific action (run command at T0, capture output, reference in log), evidence-backed. This is also the kind of training that makes future Director evaluations easier — captured baselines are verifiable; quoted baselines are not. Will graduate on a second confirming observation. |

### Graduation Check
No graduations this round — all three proposals are first observations.

### Notes for the Sorter

Three things to keep doing:

1. **The sandbox mutation check on production code.** This is the highest-value habit you exercised this shift. It turned "the new tests are structurally stricter" from an argument into evidence. Future reflection-test rewrites should default to this — it's now your training proposal #1, and it's already strong enough that I'd flag it as a candidate even without the second observation.

2. **Capturing baseline metrics with the actual command.** "PHPStan baseline output captured 6 errors across the three target files; final reports `[OK] No errors`" — that is the verifiable form of a delta claim. Anyone reading this log can re-run `composer phpstan` against the pre-shift commit and confirm. That's portfolio-grade reporting.

3. **`ls vendor/<path>/` before trusting permit class-existence claims.** The permit was correct about `ValidateCsrfToken` existing, but you verified anyway. That instinct is what would have caught the original 2026-04-19 mistake — if the prior Sorter had run `ls vendor/laravel/framework/src/Illuminate/Queue/Attributes/` before importing `Timeout` and `FailOnTimeout`, the entire drift would have been impossible.

Nothing to do differently next time. This was a clean shift, and the "What Went Poorly: No friction" line in the Self-Debrief is the right kind of honesty rather than inventing struggles.

**One observation for the warehouse, not the Sorter:** the coverage driver gap has now blocked full enforcement of ADR-0003's mutation/coverage thresholds across two shifts in a single day. This is no longer "open tech debt, will fix eventually" — it's a regulation enforcement gap that compounds with every shift. I'll prioritize a shipping order for the coverage driver install above other open items.

Permit `2026-04-29-laravel-13-attribute-cleanup` is closed. Warehouse is at "PHPStan: 0 errors, tests: 569/569 passing" — the state the 2026-04-19 journal claimed but did not deliver. Paper trail and code now agree.
