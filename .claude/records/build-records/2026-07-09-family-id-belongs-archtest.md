# Build Record: Enforce BelongsToFamilyInterface via Arch Test (ADR-0014 Open Question)

**Build Record #:** 2026-07-09-family-id-belongs-archtest
**Filed:** 2026-07-09
**Brickwright:** Brickwright
**Wing:** Foundry
**Work Order:** [2026-05-29-family-id-belongs-archtest](../work-orders/2026-05-29-family-id-belongs-archtest.md)
**Branch:** `family-id-belongs-archtest`

---

## Work Summary

Converted the "models with `family_id` must implement `BelongsToFamilyInterface`" convention (ADR-0014, sweep signal F-adr-0014-1, re-flagged 2026-07-09 as X-adr-0014-1) into mechanical enforcement. Added a new architecture test in `backend/tests/Architecture/ModelArchitectureTest.php` that reuses the existing `@property $family_id` docblock-parse hook (same detection logic as the adjacent `family()` relationship test) and asserts `ReflectionClass::implementsInterface(BelongsToFamilyInterface::class)`, with `User::class` on an explicit allowlist carrying the ADR-0014 rationale in a comment: User is the authenticated agent, not a tenant-owned object — `EnsureFamilyOwnership` must not check User against itself (ADR-0014, "Family-Scoped Multi-Tenancy" note).

No model changes were needed — ground truth verified by grep before building: 5 models carry `family_id` (`FamilySet`, `User`, `StorageOption`, `InviteCode`, `ImportJob`); 4 implement the interface; `User` is the sole non-implementor, matching the WO's stated state exactly.

## Deliverables

| Action | File | Notes |
|---|---|---|
| Modified | `backend/tests/Architecture/ModelArchitectureTest.php` | New `it('should implement BelongsToFamilyInterface in models with family_id')` block + `use App\Contracts\BelongsToFamilyInterface;` import. Detection mirrors the existing family_id parse (docblock `@property.*\$family_id` regex over `getClassesInDirectory()`), so the two family_id rules can never drift on *which* models they see. Failure message names the model, the interface, and cites ADR-0014 with the User exemption. |
| Created | `.claude/records/build-records/2026-07-09-family-id-belongs-archtest.md` | This record. |

## Enforcement Proven (Teeth Test)

Per WO AC #2, the test was proven to fail on both failure modes, then restored:

1. **Synthetic violation** — temporarily removed `implements BelongsToFamilyInterface` from `InviteCode`:
   ```
   FAILED  Tests\Architecture\ModelArchitectureTest > it should implement Be…
   Model App\Models\InviteCode has family_id but does not implement
   App\Contracts\BelongsToFamilyInterface (ADR-0014; User is the sole documented exemption)
   ```
   Restored via `git checkout -- app/Models/InviteCode.php`; file back to green (7 passed / 533 assertions).
2. **Allowlist removal** — temporarily set `$allowlist = []`:
   ```
   Model App\Models\User has family_id but does not implement
   App\Contracts\BelongsToFamilyInterface (ADR-0014; User is the sole documented exemption)
   ```
   Restored; file back to green.

## Verification (Gauntlet)

All run from `backend/` on host PHP 8.5.4 (`update-alternatives` confirms `php → /usr/bin/php8.5`). Verbatim logs captured to scratchpad (`lint-test.log`, `phpstan.log`, `deptrac.log`, `test.log`).

| Gate | Result |
|---|---|
| `composer lint` / `composer lint:test` | Pass — Rector done, Pint passed, no changes to the new test after auto-fix pass |
| `composer phpstan` | Pass — `[OK] No errors` |
| `composer deptrac` | Pass — Violations 0, Allowed 753 |
| `composer test:arch` | Pass — 112 tests / 1924 assertions (arch suite; up from 111 pre-change) |
| `composer test` | Pass — **728 passed (2976 assertions), 19.08s** |
| Pre-commit hook (CaptainHook via root dispatcher) | Ran on commit — see PR |
| Pre-push hook (PrePushPermitGate → composer test) | Ran on push — no `--no-verify` |

`composer test:coverage` / `composer mutation` were **not run** — not in the WO's AC gauntlet, and blocked environmentally (see below).

## Environmental Flags (CEO-actionable)

- **Dispatch claimed "Host PHP 8.5 with pcov" — verification failed.** `php --ri pcov` → "Extension 'pcov' not present"; `dpkg -l` shows only `php8.4-pcov` installed, while `php` points to 8.5.4. Coverage and mutation drills cannot run on this host until `php8.5-pcov` is installed (`sudo apt install php8.5-pcov` via deb.sury.org). This did not block this WO (its gauntlet needs no coverage driver), but the Pulse's "coverage and mutation drills unblocked" line is stale for this host state. Flagged per the graduated verify-external-state rule.
- Deptrac allowed-count is now **753** (Pulse says 743) — informational drift for the next Pulse refresh, not a violation.

## ADR-0014 Open-Question Closure Text (for the Steward)

The WO places editing ADR-0014 out of scope (decisions.md / ADR territory is the Steward's). Proposed closure text for the Open Questions section of `.claude/docs/adr/0014-single-tier-authorization.md`:

> ~~Should an architecture test enforce that every model with a `family_id` column implements `BelongsToFamilyInterface`? Currently this is convention only. The `User` model would need an explicit exemption. A test would close the gap.~~
> **Resolved 2026-07-09 — Yes.** `tests/Architecture/ModelArchitectureTest.php` (`it should implement BelongsToFamilyInterface in models with family_id`) enforces the rule mechanically: any model whose docblock declares `@property … $family_id` must implement the interface. `User::class` sits on an explicit allowlist with the exemption rationale inline (authenticated agent, not a tenant-owned object). Proven to fail on both a synthetic non-implementing model and on allowlist removal. Work Order `2026-05-29-family-id-belongs-archtest`.

decisions.md should reflect the Open Question as closed if it summarizes ADR-0014's open items.

## Acceptance Criteria

- [x] Arch test enforces `family_id` → `BelongsToFamilyInterface` with `User` allowlisted
- [x] Test proven to fail on a synthetic violation (both modes: removed implements clause, removed allowlist)
- [x] Backend gauntlet green (lint:test, phpstan, deptrac, test:arch, test)
- [x] Build Record carries the ADR-0014 Open-Question closure text for the Steward (section above)

## Decisions Made

- **Detection key is the docblock `@property … $family_id` annotation, not the schema.** Deliberately identical to the adjacent `family()` relationship test so both rules see the same model set. The `@property` annotations are themselves enforced by the first test in the file, so the chain is closed: no annotations → fail test 1; annotations without `family()` → fail test 2; annotations without the interface → fail this test. A model that omitted the annotation to dodge enforcement would fail PHPStan (Larastan model-property checks) and the annotation-presence arch test.
- **Allowlist as an in-test array, not a config file.** One entry, documented exemption, cited ADR. A config indirection for a single permanent exemption would be ceremony.
- **New `it` block rather than folding into the `family()` test.** One rule per test keeps failure output unambiguous (WO AC asks for a distinct enforcement, and a combined test would report relationship-absence and interface-absence under one name).

## Self-Debrief

- The 90%-built hook made this a small build; the bulk of the effort was correctly spent on proving teeth (both failure modes) rather than writing code. That ratio felt right for enforcement work — matches the ADR workflow's "build enforcement first, watch it fail" discipline even though here the violations were synthetic.
- The verify-external-state rule earned its keep again: the "pcov present" claim in the dispatch was false for PHP 8.5. Had the WO required coverage, trusting the claim would have burned a full gauntlet run before surfacing.
- No Methodology Objections. No training proposals — nothing novel surfaced; existing graduated rules covered every friction point.

---

**Status:** Complete — awaiting Steward evaluation. Work Order remains Open per ADR-0028 (closes post-merge).
