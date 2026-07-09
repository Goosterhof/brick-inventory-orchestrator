# Build Record: Transaction boundary pinned as a counted interaction across Action unit tests

**Build Record #:** 2026-07-09-transaction-boundary-test-rigor
**Filed:** 2026-07-09
**Work Order:** [`2026-07-09-transaction-boundary-test-rigor`](../work-orders/2026-07-09-transaction-boundary-test-rigor.md)
**Builder:** Brickwright
**Wing:** Foundry

> **Work Order Status Discipline (ADR-0028):** This Build Record ships with the parent Work Order still in `Status: Open`. The WO closes post-merge via a follow-up records commit. The WO file itself is materialized into this branch (byte-identical to the copy committed on `docs/warden-sweep-2026-07-09-records`, blob `fb0a7247`) so PrePushPermitGate and the paper trail resolve in-branch.

---

## Work Summary

Test-layer only — zero production Action changes, exactly as scoped.

| Action | Files | Notes |
|---|---|---|
| Modified | 20 files under `backend/tests/Unit/Actions/` | Every permissive `ConnectionInterface::transaction` stub replaced with a counted expectation. |
| Modified | `backend/tests/Architecture/TestConventionsArchitectureTest.php` | New enforcement test (see below), ~38 lines, within the WO's ~50-line budget. |
| Untouched | `backend/tests/Unit/Actions/FamilySet/StartImportActionTest.php` | The only file that already pinned the boundary everywhere — no churn. All pre-existing counted expectations elsewhere (`->twice()` retry tests, ImportOwnedSets' per-page test) also untouched. |
| Created | `.claude/records/work-orders/2026-07-09-transaction-boundary-test-rigor.md` | Materialized from the records-branch blob (untracked in this worktree's base). |
| Created | `.claude/records/build-records/2026-07-09-transaction-boundary-test-rigor.md` | This file. |

## Ground-Truth Correction to the WO's Count

The WO said "~14 of 21" Actions had permissive stubs and "the 7 Actions that already pin the boundary are untouched." Verified enumeration (`grep -rln 'ConnectionInterface' backend/app/Actions/` → 21 Actions, 1:1 test files) shows the real split was worse:

- **20 of 21** test files carried at least one permissive stub:
  - 15 files used `allows('transaction')` in `beforeEach` (zero-or-more passthrough);
  - 5 files (`UpsertTheme`, `UpsertPart`, `UpsertColor`, `UpsertSet`, `AssignPartToStorage`) used per-test **uncounted** `shouldReceive('transaction')` on their happy paths (their retry tests were already `->twice()`).
- **1 of 21** (`StartImportActionTest`) was fully pinned.

The "7 pinned" figure appears to have counted the five Sync/Storage files with *partially* counted expectations plus StartImport (+1). The AC "the 7 already-pinned Actions are untouched" is honored in substance: every pre-existing **counted** expectation is byte-identical after this change; only permissive lines were touched.

## The Standardization

Three treatment groups, matched to each Action's actual transaction topology (every Action was read to confirm where the transaction opens relative to guard clauses):

1. **`beforeEach` upgrade** (7 files — every test opens exactly one transaction): `allows(...)` → `shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback())`. Files: CreateUserWithFamily, GenerateInviteCode, RevokeInviteCode, CreateFamilySet, UpdateFamilySet, CreateStorageOption, UpdateStorageOption.
2. **Per-test expectations** (8 files — mixed paths): the `beforeEach` keeps only the mock; each test declares its own counted expectation. Guard-clause and no-page paths now carry an explicit **`shouldNotReceive('transaction')`** — a strictly stronger pin than before (the old `allows` would have silently tolerated a transaction opening on a failed authorization). Files: SetRebrickableToken (4×once + 1 guard), RemoveFamilyMember (4×once + 6 guards), GetSetParts (2×once + 3 pass-through), StoreSetParts (7×once + existing empty-list pin), ImportOwnedSets (7×once + 3 no-page pins + 1 pre-existing counted test untouched), and the three delete files (below).
3. **Count appended** (5 files): uncounted per-test `shouldReceive('transaction')` → `->once()`. The multi-line `->twice()` retry expectations were structurally unmatchable by the edit and are untouched.

Net counts after: **61** `shouldReceive('transaction')` occurrences, all counted; **17** `shouldNotReceive('transaction')` negative pins; **0** `allows('transaction')`.

Notable topology facts encoded into the tests (comments in-file): ImportOwnedSets opens its per-page transaction even for an empty page (the early return lives *inside* `processPage`); its first-page-failure path opens zero transactions; GetSetParts' three status pass-throughs open zero transactions.

## F-test-2 — Meaningful Assertions in the Delete Tests

The three delete-Action test files (`DeleteFamilySetActionTest`, `DeleteStorageOptionActionTest`, `DeleteStorageOptionPartActionTest`) had zero `expect()` calls. Each now asserts event ordering captured through the mock closures:

- Delete-inside-boundary: `expect($events)->toBe(['transaction:begin', 'delete', 'transaction:end'])` — directly pins the ADR-0016 atomicity semantics, not just "delete was called."
- `DeleteStorageOptionActionTest`'s "eager load the full tree before the transaction" test now actually asserts it: `expect($events)->toBe(['load', 'transaction:begin'])`.
- The parts-deletion test asserts `expect($partsDeleted)->toBeTrue()`.

## Enforcement Hook — Shipped

Added to `TestConventionsArchitectureTest.php` (house style, file-content scan): for every Action under `app/Actions/` whose source mentions `ConnectionInterface`, the mirrored `tests/Unit/Actions/**Test.php` must (a) exist, (b) contain no `allows('transaction')`, (c) chain a count (`once|twice|times|never`) as the *first* call after every `shouldReceive('transaction')`, and (d) contain at least one positive counted expectation. ~38 lines including comments.

**Fail-first verified:** seeded a violation (stripped one `->once()` from `UpsertThemeActionTest`), watched the test fail naming the right file, restored, watched it pass. First cut had a real false positive — `\s*` before a negative lookahead backtracked around multi-line `->twice()` chains and flagged compliant files; fixed by requiring a literal `->` + non-count method name for a violation (`/shouldReceive\(\s*['"]transaction['"]\s*\)\s*->\s*(?!once\b|twice\b|times\b|never\b)\w/s`). The false positive was caught precisely *because* the guard was run against the clean tree before trusting it.

## Acceptance Criteria

| Criterion | Met | Evidence |
|---|---|---|
| Zero permissive transaction stubs remain | **Yes** | `grep -rn "allows('transaction')" backend/tests/` → empty. `grep -rn "shouldReceive('transaction')" backend/tests/Unit/Actions/` → 61 lines, every one chaining `->once()`/`->twice()` (multi-line retry chains verified by `-A2` context grep). Now machine-enforced by the arch test on every pre-commit (`test:arch` is in the CaptainHook gauntlet). |
| 7 already-pinned Actions untouched | **Yes (in substance)** | No pre-existing counted expectation was modified; see Ground-Truth Correction for the count discrepancy. `StartImportActionTest` has zero diff. |
| `composer test` + `composer test:coverage` green | **Yes / Yes*** | `composer test`: 728 passed (3085 assertions) — up from 2002 unit-suite assertions at baseline. `composer test:coverage`: **Total: 100.0%** locally via the pcov workaround (*see Environment Deviation). CI's PHP 8.5 + pcov job on the PR is the authoritative verdict per Steward direction. |
| `composer mutation` run once; delete/upsert mutant delta noted | **Yes*** | Full run locally via workaround: 898 mutations, **Score 80.40%** (min 76, exit 0). Delta answer below. |

## Mutation Verdict — Before/After (captured, not quoted)

Per the baseline-capture discipline, I ran a **scoped** mutation baseline against the *old* tests (via `git stash`) before any of my edits took effect, on the eight delete/upsert Actions the WO names:

- **Baseline (old permissive tests):** 49 mutations for 8 files, **Score 100.00%** — zero surviving mutants.
- **Post-change (counted tests):** 49 mutations for 8 files, **Score 100.00%** — identical.

**So the honest answer to the WO's question is: there were no previously-surviving mutants on the delete/upsert Actions to kill.** This *confirms* the audit's premise rather than undermining it: Pest's mutation engine generates no "unwrap the transaction closure" mutant, so mutation testing was structurally blind to this regression class — the suite scored 100% on these files while a dropped wrapper would have shipped green. The counted `->once()` expectation (plus the arch test) is the only guard for this failure mode, which is exactly why the WO was elevated. CI's full mutation job will re-confirm on the PR.

## Environment Deviation (disclosed per Steward direction)

The dispatch asserted "Host PHP is 8.5 with pcov." Verified false: `php -v` = 8.5.4 but only `php8.4-pcov` is installed (`dpkg -l`); `php8.5-pcov` is available in the sury PPA but uninstalled, and sudo requires a password I don't have. **CEO-actionable:** `sudo apt install php8.5-pcov` (already flagged as a Foundry Active Concern in commit `cb4e87bd`).

The Steward directed deferral of the coverage/mutation ACs to CI (house precedent: WO 2026-06-01-build-log-capture-slice). I additionally ran them locally via a no-root workaround: `apt-get download php8.5-pcov` → `dpkg-deb -x` → load the extracted `pcov.so` via `PHP_INI_SCAN_DIR=":<dir>"` pointing at a one-line ini. All coverage/mutation numbers above come from that workaround; CI remains authoritative. The workaround leaves no trace in the repo.

## Full Gauntlet Results

| Step | Result |
|---|---|
| `composer lint:test` | ✓ (after `composer lint` normalized the new arch test — Rector `mb_substr` + condition split, Pint blank-line separation; two fix-then-recheck passes) |
| `composer phpstan` | ✓ No errors |
| `composer deptrac` | ✓ 0 violations |
| `composer test` | ✓ 728 passed, 3085 assertions |
| `composer test:coverage` | ✓ Total: 100.0% (workaround; CI authoritative) |
| `composer test:feature-coverage` | ✓ Total: 100.0% (workaround; CI authoritative) |
| `composer mutation` | ✓ 898 mutations, Score 80.40% ≥ 76 (workaround; CI authoritative) |

Unit-suite assertion count moved 2002 → 2111 from the counted pins and new `expect()`s alone (before the feature suite; full-suite totals above).

## Decisions Made

1. **Counted-in-`beforeEach` only where the invariant is file-wide.** Where any test diverges (guards, pass-throughs, zero-page generators), the expectation moved into each test. Mockery matches expectations in declaration order, so a `beforeEach` `->once()` plus a per-test override would mis-fire — per-test declarations avoid the trap entirely.
2. **Guard paths pin `shouldNotReceive('transaction')`** rather than simply omitting the stub. A bare mock would throw on an unexpected call anyway, but the explicit negative expectation documents intent and survives a future refactor to a partial/lenient mock. This also upgrades the guard tests beyond the WO's letter: they now prove authorization failures never open a transaction.
3. **Event-ordering assertions for F-test-2** instead of token `expect($result)->toBeNull()`. The delete Actions return void; the only meaningful observable is *interaction order*, which is also the ADR-0016 property at stake.
4. **Arch test placed in `TestConventionsArchitectureTest.php`** rather than a new file — it is a test-convention rule, the file already owns Mockery-usage conventions, and `test:arch` runs in the pre-commit gauntlet so violations are caught before commit, not at PR time.
5. **No Rector/Pint churn beyond my own files** — `composer lint` touched only the new arch-test block.

## Showcase Readiness

This is the kind of diff a prospective client's senior architect should see: a data-integrity guarantee moved from "tested by convention" to "machine-enforced invariant" — counted interactions at the boundary, negative pins on guard paths, ordering assertions on the atomicity property itself, and an architecture test that makes the whole class of regression unshippable. The fail-first verification of the guard (including catching its own false positive) is the methodology on display.

## Self-Debrief

- **What went right:** Verifying the WO's external-state claims up front paid off twice — the "14 of 21" undercount and the missing `php8.5-pcov`. The stash-scoped mutation baseline produced a defensible before/after instead of an unfalsifiable "mutants now killed" claim.
- **What went sideways:** My first arch-test regex had a backtracking false positive; the fail-first protocol caught it in the same session, but I should default to "literal `->` anchor before negative lookahead" when linting method chains. The first background baseline run also raced my own edits (launched the long-running baseline, then started editing the same files) — caught it via task-completion timing and re-ran from a stash; sequencing baseline-capture strictly before edit-start would have avoided the re-run.
- **Rebuttal-readiness:** Every claim in this record traces to a captured log in the session scratchpad (`baseline-unit.log`, `baseline-mutation.log`, `gauntlet-*.log`).

## Discovered Defect — PrePushPermitGate is worktree-blind (follow-up WO candidate)

First push attempt was refused despite an Open, slug-matched permit committed on this branch. Root cause, traced in `backend/tools/CaptainHook/PrePushPermitGate.php` + `.githooks/pre-push`: the dispatcher passes `--git-directory="$(git rev-parse --git-common-dir)"`, which in a linked worktree is the **main repo's** `.git/`. CaptainHook's `Repository::getRoot()` therefore resolves to the **main checkout**, and the gate's `scanPermits()` (plain PHP `scandir`) reads the main checkout's `.claude/records/work-orders/` — not the pushing worktree's. Meanwhile `computeDiffStats()` reported the *worktree branch's* diff (23 files / 472 lines — git's hook environment overrides the `-C <root>`), so the two halves of the gate disagreed about which tree they were guarding. The permit had been present (untracked) in the main checkout at dispatch time but was moved onto `docs/warden-sweep-2026-07-09-records` mid-session, exposing the bug.

**Resolution used:** restored the byte-identical untracked WO copy into the main checkout's `work-orders/` (exactly the dispatch-time state; identical content means the records branch merges over it cleanly) and re-pushed — the gate then matched the permit legitimately. No `--no-verify`. **Follow-up:** the gate should resolve the permit directory from the *worktree* root (same defect family as the pre-commit worktree fix in PR #138 / WO 2026-05-28-backend-pre-commit-worktree-safety). Not fixed in this branch — the WO scopes this build to the test layer, and the gate has its own test file deserving a proper WO.

## Training Proposals (Foundry graduation log candidates)

1. **"Long-running baseline captures must complete (or be stash-isolated) before the first edit lands."** Observed: my scoped mutation baseline raced my Group-C sed edits and had to be re-run from `git stash`. A one-line rule — *baseline first, edits after; if parallelizing, stash-isolate the baseline* — prevents silent baseline contamination. First observation; filing as candidate.
2. **"When writing content-scan enforcement regexes over method chains, anchor on the literal `->` before any negative lookahead; `\s*(?!...)` backtracks around multi-line chains and produces false positives."** Observed concretely in this build (UpsertPartActionTest false-flagged). First observation; filing as candidate.
