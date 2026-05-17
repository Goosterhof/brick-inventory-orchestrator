# Shipping Order: The Member Removal Wrench

**Order #:** 2026-03-25-member-removal-wrench
**Filed:** 2026-03-25
**Issued By:** Brick Master (Baseplate)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Build the member removal endpoint — family head can remove a member from the family, which creates a new empty family for the removed user (preserving their account). The removed user's contributed data stays with the original family.

## Scope

### In the Crate

- `DELETE /family/members/{user}` — remove a member (family head only)
- New Action handling the removal logic: create new family for removed user, reassign user
- Authorization — only family head, cannot remove self
- Clear error responses for edge cases

### Not on This Pallet

- Frontend UI — separate building permit to the Plate
- Data transfer/migration for the removed user
- Self-removal (leaving a family voluntarily)
- Role changes or promotions
- Notification to the removed user

## Acceptance Criteria

- [ ] Family head can remove a non-head member via DELETE endpoint
- [ ] Removed user gets a new empty family (preserving their account)
- [ ] Removed user's contributed data stays with the original family (family_id scoping)
- [ ] Family head cannot remove themselves (400 or 422)
- [ ] Non-head members cannot remove anyone (403)
- [ ] Cannot remove a user who isn't in the family (404)
- [ ] Response confirms the removal
- [ ] Action follows warehouse regulations (final readonly, single execute())
- [ ] Explicit transaction handling (create family + reassign user = atomic)
- [ ] 100% unit test coverage on the Action
- [ ] 80% feature test coverage on the endpoint
- [ ] All quality gates pass

## References

- Feature Brief: Idea Vault `docs/idea-vault.md` — The Member Removal Wrench
- Related Permit: `frontend/.claude/records/permits/2026-03-25-member-removal-wrench.md` (Plate side)
- Predecessor: The Family Roster Display (Shipped — PR #110)
- ADR-0002: Cascade deletion / family-scoped multi-tenancy

## Notes from the Issuer

Small piece count but sensitive logic. The critical insight from the Idea Vault: contributed data stays with the original family because it's scoped by `family_id`, not `user_id`. This is correct behavior — don't try to "fix" it by moving data. The transaction must be atomic: create new family + update user's family_id. If either fails, neither happens.

The Plate is blocked on this — agree on the endpoint contract early.

---

**Status:** Complete
**Shift Log:** `.claude/records/journals/2026-03-25-member-removal-wrench.md`
