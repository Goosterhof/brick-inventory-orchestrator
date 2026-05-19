# Shipping Order: Adopt War-Room Canonical PHPStan Rules Package

**Order #:** 2026-04-29-phpstan-warroom-rules-adoption
**Filed:** 2026-04-29
**Issued By:** General (CEO sign-off pending)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

The war room has packaged five PHPStan rules into a canonical Composer package — `script-development/phpstan-warroom-rules` (ADR-0021). Four ally cascades have already shipped (donor-origin dogfood, plus three follow-on Phase 1 adoptions). Lego-storage is the next leg of the rollout. Replace the warehouse's inline `App\PHPStan\ConnectionTransactionReturnTypeExtension` with the published package, surface any rule violations in a discovery pass, and land Phase 1 (adoption) — Phase 2 (cleanup of any systemic findings) is scoped only if discovery surfaces them.

The pre-survey signals this is the cleanest non-donor cascade we'll see: every Action already injects `Illuminate\Database\ConnectionInterface` (donor convention, mandated by `app/CLAUDE.md` warehouse regulations), no `DatabaseManager` is imported anywhere in `app/Actions/`, no `abort()` family helper appears anywhere in `app/`, and no model name contains "Log" (case-insensitive). The shipment should land as a one-commit dogfood-shape adoption — closer to the donor's round-trip than to the Phase 1 cascades that needed global suppression.

## Scope

### In the Crate

1. **Step 1 — Discovery pass (do this first; report counts in the shift log).**
   - On the working branch, run:
     - `composer require --dev script-development/phpstan-warroom-rules:^0.1.1`
     - Edit `phpstan.neon`: add `- vendor/script-development/phpstan-warroom-rules/extension.neon` to the `includes:` block (above the `phar://phpstan.phar/conf/bleedingEdge.neon` line for ordering parity with the donor configs), and **remove the `services:` block that wires `App\PHPStan\ConnectionTransactionReturnTypeExtension`** (the package ships the same extension; keeping both is a duplicate-service error).
     - Run `composer phpstan` and capture the per-rule error counts:
       - `enforceActionTransactions.missingTransaction`
       - `forbidDatabaseManager.inAction`
       - `forbidAbort.abortUsed`
       - `log.forbiddenWrite`
   - Pre-survey expectation (must be confirmed, not assumed): 0 findings on `forbidDatabaseManager`, `forbidAbort`, `log`. Findings on `enforceActionTransactions` are the only realistic surface — record exact line:rule entries.
2. **Step 2 — Retire the inline extension.**
   - Delete `app/PHPStan/ConnectionTransactionReturnTypeExtension.php`. The package's class lives under the same `App\PHPStan\` namespace? **No** — verify the class is namespaced under `ScriptDevelopment\PhpstanWarroomRules\` in the package source. Our inline copy under `App\PHPStan\` will become unused once the `services:` wiring is removed; deleting the file removes the dead class.
   - Remove the empty `app/PHPStan/` directory if no other files remain.
3. **Step 3 — Disposition each finding from Step 1.**
   - **0 findings on a rule:** no action; the rule enforces silently going forward.
   - **`enforceActionTransactions.missingTransaction` finding(s):** open each cited Action and reason about whether the missing transaction is (a) a real bug — an Action performing ≥2 writes without `->transaction()` wrapping, in which case it goes on the Phase 2 backlog and is suppressed in `phpstan.neon` with `identifier: enforceActionTransactions.missingTransaction` + a `path:` scoped to the cited file, **with a `# TODO:` comment naming the follow-up shipping order**; or (b) a false positive (e.g., the rule miscounts non-DB property calls), in which case open a war-room issue against the package before suppressing. Do not blanket-suppress.
   - **Any other unexpected finding** (a rule that pre-survey expected 0 from): stop and ping the General before drafting suppression — the rule is doing what it should, and a surprise finding is news worth reading.
4. **Step 4 — Add a clarifying comment above any `ignoreErrors` entries** stating the doctrine origin (ADR-0021), the package version, and the disposition (Phase 2 backlog vs. legitimate exception). The cross-territory legitimate-exception comment style is the model.
5. **Step 5 — Verify `composer phpstan` is green at level max** with the new package wired and any suppression entries in place. `reportUnmatchedIgnoredErrors: true` is already on (line 35 of `phpstan.neon`), which is the correct posture — keep it on.
6. **Step 6 — Run the full Quality Control gauntlet locally** before the push gauntlet runs it again: `composer lint:test && composer phpstan && composer deptrac && composer test`. The arch-test suite (`tests/Architecture/`) does not test for the new rules' coverage and will not regress; this is a precaution against any incidental cross-effect.
7. **Step 7 — Land as one or two commits.**
   - Commit 1 (canonical case, expected): `chore(arch): adopt war-room phpstan rules package` — `composer.json` + `composer.lock` + `phpstan.neon` + delete inline extension. If Step 3 produced no suppression entries, this is the only commit.
   - Commit 2 (only if Step 3 surfaced findings to suppress): `chore(arch): suppress phpstan-warroom-rules findings pending phase 2` — `phpstan.neon` `ignoreErrors` additions only.
   - PR title: `chore(arch): adopt war-room phpstan rules package`. Body should reference ADR-0021, this shipping order, and the per-rule discovery counts table.

### Not on This Pallet

- **Phase 2 cleanup of any `enforceActionTransactions.missingTransaction` findings.** If discovery surfaces real multi-write-without-transaction bugs, suppress in this order, file a follow-up shipping order, and ship the migration there. Do not bundle the fix into this PR. (Donor pattern: the suppression's lifetime is short — `reportUnmatchedIgnoredErrors: true` will force the cleanup back to the surface as soon as Phase 2 lands.)
- **Adding `phpstan-strict-rules`, `phpstan-deprecation-rules`, or `bleedingEdge.neon`.** All three are already on the warehouse (`phpstan.neon` lines 2–5). Nothing to do.
- **Flipping `reportUnmatchedIgnoredErrors`.** Already `true`. Per the cascade learnings, this is the canonical posture; no change needed.
- **Updating any ADR.** ADR-0021 is the doctrine source for all five rules. This adoption is an instance of the ADR, not an amendment.
- **Updating `app/CLAUDE.md` warehouse regulations.** The Sorting Procedures section already says "Use `$this->connection->transaction(Closure)` via injected `ConnectionInterface`" — the rules codify this, they do not change it. The only doctrine-propagation surface that *might* warrant a note is the `app/CLAUDE.md` reference to the inline `ConnectionTransactionReturnTypeExtension` — if such a reference exists in the warehouse's docs, update it; if not (and a quick `grep -r ConnectionTransactionReturnTypeExtension docs/ app/CLAUDE.md` will tell), there is nothing to do.
- **Migrating any existing ADR-0019 hydration violations.** ADR-0019 enforcement (Phase 2 of the war-room campaign) is a separate package-level rule that has not shipped yet. Out of scope.

## Acceptance Criteria

- [ ] `composer.json` requires `script-development/phpstan-warroom-rules` at `^0.1.1` under `require-dev`.
- [ ] `composer.lock` is updated and committed.
- [ ] `phpstan.neon` `includes:` block references the package's `extension.neon`.
- [ ] `phpstan.neon` no longer wires `App\PHPStan\ConnectionTransactionReturnTypeExtension` in its `services:` block.
- [ ] `app/PHPStan/ConnectionTransactionReturnTypeExtension.php` is deleted; `app/PHPStan/` is removed if empty.
- [ ] `composer phpstan` passes at level max with 0 errors.
- [ ] If any `ignoreErrors` entries were added: each is scoped by `identifier:` + `path:` (no broad regex), each carries a doctrine-origin comment, and each cites the Phase 2 follow-up order if applicable.
- [ ] `composer deptrac` passes with 0 violations (sanity check; no expected change).
- [ ] `composer test` passes in full (unit, feature, architecture).
- [ ] Per-rule discovery counts are recorded in the shift log under a "Discovery findings" section, with one row per rule.
- [ ] PR opened against the warehouse's default branch; PR body references ADR-0021, this shipping order, and the discovery counts.
- [ ] Shift log filed at `.claude/records/journals/2026-04-29-phpstan-warroom-rules-adoption.md`.

## References

- War Room Campaign: `war-room/campaigns/war-room/2026-04-29-phpstan-rules-canonical-promotion.md` (the shipment is the lego-storage leg of this campaign — entry 21 on the "Artifacts pending" list).
- ADR (canonical): `war-room/presentation/decisions/phpstan-rules-package.md` (ADR-0021 — doctrine source for all five rules).
- Package repo: https://github.com/script-development/phpstan-warroom-rules
- Package on Packagist: https://packagist.org/packages/script-development/phpstan-warroom-rules
- Donor cascade PRs (use these as shape references, not as instruction):
  - donor dogfood: [private-territory]/[allied-app]#REDACTED
  - cleanest cleanroom: [private-org]/[allied-app]#REDACTED
  - Phase 1 with global suppression: [private-org]/[allied-app]#REDACTED
  - Phase 1 + Phase 2 same-day: [private-org]/[allied-app]#REDACTED / #REDACTED
- War room `MEMORY.md` lessons that apply to this shipment:
  - **Cascade Discovery Pass** — drives Step 1 above.
  - **PHPStan Baseline Cascade** — `reportUnmatchedIgnoredErrors: true` already on; suppressions decay loudly when violations move.
  - **Deployment-Order Shell Pitfalls** — naked `composer require` (do **not** prefix with `php8.4 -d ...`).

## Notes from the Issuer

**Why this is a Shipping Order, not a Building Permit.** The campaign report's pending list reads "Building Permit + CFO sign-off pending" — that wording is loose. Lego-storage is the warehouse (backend), and the warehouse's accountability artifact is a Shipping Order with the Logistics Director, not a Building Permit with the CFO. The frontend's leg of the package adoption (if it ever has one — the package is PHP-only, so it likely never will) would be the Building Permit case. This order is filed correctly per warehouse doctrine.

**Why a permit at all for what looks like a config tweak.** Same answer as the 2026-04-23 oxfmt-template-adoption case: the permit system exists so a future architect reading `git blame` on `phpstan.neon` understands *why* the inline extension disappeared and the package include arrived. The cost of filing is low; the discoverability dividend is real.

**The pre-survey is strong but not a substitute for the discovery pass.** Grep can prove absence of `DatabaseManager` imports, of `abort()` calls, of "Log" model names — those are syntactic surfaces. It cannot prove absence of `enforceActionTransactions.missingTransaction` findings, because that rule reasons about call sequences inside `execute()` methods, not about syntax. The discovery pass is mandatory; the pre-survey just sets the prior on what to expect.

**The inline `ConnectionTransactionReturnTypeExtension` is a happy coincidence, not duplication that needs careful migration.** When the donor cascade started, this extension was already in lego-storage — same use case (return-type inference on `$connection->transaction()` closures), same code shape. The package consolidates it. There is no behavioral migration; the package's class replaces the inline class, the namespace differs, the `phpstan.neon` wiring shifts from `services:` to `includes:`. PHPStan's behavior for the warehouse's source code does not change.

**Time-to-enforcement is immediate on the four other rules.** Whatever findings appear in the discovery pass are findings that the warehouse has been carrying without static-analysis surfacing them. That is the entire point of the cascade: rules that were Level 6 (passive monitoring) for every territory except the donor are now Level 2 (static analysis) here. If the discovery pass finds 0 across all four new rules, the warehouse has been doing the right thing on doctrine that wasn't yet enforced — record that explicitly in the shift log; it is a portfolio signal.

**`composer require` only — no `php8.4 -d ...` prefix.** Per the war room's deployment-order shell pitfalls memo: a prefixed install bypasses warehouse environment expectations and has caused setup drift on prior cascades. Run the bare command.

**The warehouse is on Laravel 13 and PHP 8.4.** Both are within the package's `^11.0 || ^12.0 || ^13.0` Laravel constraint and the `^8.3` PHP floor. The v0.1.0 → v0.1.1 patch (Laravel 13 widening, shipped same-day during a prior allied cascade) means lego-storage gets the right constraint floor on the first install attempt.

Run the gauntlet before filing the shift log. Include the per-rule discovery counts and a one-paragraph "what the cascade revealed about the warehouse" section — this PR's `git blame` will be referenced when the next non-donor territory adopts the package.

---

**Status:** Open
**Shift Log:** _to be filed at `.claude/records/journals/2026-04-29-phpstan-warroom-rules-adoption.md`_
