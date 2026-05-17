# Shipping Order: Action Contract Hygiene

**Order #:** 2026-04-16-action-contract-hygiene
**Filed:** 2026-04-16
**Issued By:** Logistics Director
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Tighten three contract inconsistencies across the Action layer uncovered in the 2026-04-16 actions audit. All three touch the boundary between authentication context, tenant scoping, and transaction hygiene — related enough to ship as a single pass.

## Scope

### In the Crate

1. **Remove `#[CurrentUser]` from `CreateStorageOptionAction`** (Finding 1, medium)
   - `app/Actions/StorageOption/CreateStorageOptionAction.php` — drop the `#[CurrentUser] User $user` constructor dependency. Accept `Family $family` as an `execute()` parameter and use `$family->id` for the `family_id` assignment.
   - `app/Http/Controllers/StorageOptionController.php:41` — inject `#[CurrentUser] User $user` in the method signature and pass `$user->family` through (the `EnsureFamilyOwnership` middleware has already loaded it).
   - Rationale: constructor-time session resolution is an HTTP concern bleeding into an Action. Blocks any future async/console call path.

2. **Normalize family-scoped Action signatures to `Family $family`** (Finding 2, medium)
   - `app/Actions/FamilySet/GetFamilySetsAction.php` — change `execute(User $user)` to `execute(Family $family)`; replace `$user->family_id` with `$family->id`.
   - `app/Actions/StorageOption/GetStorageOptionsAction.php` — same change.
   - `app/Http/Controllers/FamilySetController.php:30` and `app/Http/Controllers/StorageOptionController.php:32` — pass `$user->family` instead of `$user`.
   - Rationale: 13 of 15 family-scoped Actions already take `Family`. These two are the outliers; junior devs reading the codebase shouldn't have to pick between patterns.

3. **Move authorization guards outside the transaction closure** (Finding 3, medium)
   - `app/Actions/Family/SetRebrickableTokenAction.php:22-23` — move the `NotFamilyHeadException` check to before the `$this->connection->transaction(...)` call.
   - `app/Actions/Family/RemoveFamilyMemberAction.php:23-34` — move all three guards (`NotFamilyHeadException`, `CannotRemoveSelfException`, `UserNotInFamilyException`) to before the transaction. Only the model mutations stay inside the closure.
   - Rationale: authorization checks don't read or write — they don't belong in a transaction. Throwing inside a TX forces a rollback round-trip for every unauthorized caller.

### Not on This Pallet

- Findings 4–6 from the audit (upsert field-assignment extraction, `StoreSetPartsAction` comment, `GetFamilyPartsAction` raw SQL binding) — defer to a separate shipping order.
- No new features, no new endpoints, no DTO changes.
- No ADR amendments — these are consistency fixes, not decisions.
- No test rewrites beyond what the signature changes mechanically require.

## Acceptance Criteria

- [ ] `CreateStorageOptionAction` has no `#[CurrentUser]` attribute and no `User` dependency in its constructor; `execute()` accepts `Family $family`.
- [ ] `GetFamilySetsAction::execute()` and `GetStorageOptionsAction::execute()` both accept `Family $family` and reference `$family->id`.
- [ ] Both controllers updated at the call sites listed above, passing `$user->family` through.
- [ ] `SetRebrickableTokenAction` and `RemoveFamilyMemberAction` — every `throw` statement appears before the `$this->connection->transaction(` line.
- [ ] Existing unit tests for all five Actions still pass without loosening any assertions. Test signatures updated to pass `Family` where they now pass `User`.
- [ ] `composer test` fully green.
- [ ] `composer phpstan` passes at level max.
- [ ] `composer deptrac` passes.
- [ ] `composer test:arch` passes.
- [ ] `composer mutation` on the five touched Actions stays at or above the 76% MSI threshold.
- [ ] Shift log filed upon completion with a self-debrief.

## References

- Audit findings: delivered inline by Inventory Auditor on 2026-04-16 (no formal audit report filed — findings were scoped to the action layer only, generated on request).
- ADR-0003: `docs/adr/0003-actions-and-services-separation.md` — `final readonly`, single `execute()`, injected `ConnectionInterface`, no HTTP concerns.
- ADR-0002: `docs/adr/0002-authorization-architecture.md` — authorization-before-persistence precedent.

## Notes from the Issuer

Ship all three findings in a single commit or a short series — they're small individually but thematically bound ("what an Action accepts and where authorization runs"). A single `refactor(arch): normalize action signatures and transaction boundaries` commit works; if split, scope them `arch`/`storage`/`family` appropriately.

Watch for test fixtures that construct these Actions manually with `new CreateStorageOptionAction($storageOption, $user, $this->db)` — they need to drop the `$user` argument. The Auditor confirmed tests bypass the `#[CurrentUser]` attribute today, so the signature change is a mechanical find-and-replace in test files too.

For Finding 3: check whether the controllers for `SetRebrickableTokenAction` and `RemoveFamilyMemberAction` already run `.can()` middleware that covers the same authorization. If so, note it in the shift log — the Actions may be doing defense-in-depth, which is fine to keep as long as the guards are moved outside the transaction.

---

**Status:** Complete
**Shift Log:** `.claude/records/journals/2026-04-16-action-contract-hygiene.md`
