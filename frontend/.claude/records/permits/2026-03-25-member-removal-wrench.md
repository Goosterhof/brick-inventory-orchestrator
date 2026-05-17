# Building Permit: The Member Removal Wrench (Plate Side)

**Permit #:** 2026-03-25-member-removal-wrench
**Filed:** 2026-03-25
**Issued By:** Brick Master (Baseplate)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Build the frontend for member removal — family head can remove a member from the settings page, which creates a new empty family for the removed user (preserving their account).

## Scope

### In the Box

- Remove button next to each non-head member on the settings page family roster
- Confirmation dialog before removal (this is a significant action)
- Success/error messaging after removal
- Updated member list after successful removal

### Not in This Set

- The backend endpoint — separate shipping order to the Brick
- Self-removal (leaving a family voluntarily)
- Data transfer or migration options for the removed user
- Role changes or promotions

## Acceptance Criteria

- [ ] Remove button appears next to each non-head family member
- [ ] Remove button is NOT shown for the family head
- [ ] Only family head sees the remove buttons
- [ ] Confirmation dialog warns about the consequences
- [ ] Successful removal updates the member list immediately
- [ ] Error states handled (member already removed, network error)
- [ ] 100% test coverage on new code
- [ ] All quality gates pass

## References

- Feature Brief: Idea Vault `docs/idea-vault.md` — The Member Removal Wrench
- Related Permit: `backend/.claude/records/permits/2026-03-25-member-removal-wrench.md` (Brick side)
- Predecessor: The Family Roster Display (Shipped)

## Notes from the Issuer

Small piece count. The key UX concern from the Idea Vault: removed user's contributed data stays with the original family (scoped by family_id, not user_id). The confirmation dialog should communicate this clearly — "This member will be moved to their own family. Sets and parts they added will remain in your family's collection." Coordinate with the Brick on the endpoint.

**Dependency:** ~~Blocked on the Brick's shipping order being completed first.~~ **CLEARED** — Backend shipped 2026-03-25. Endpoint: `DELETE /family/members/{user}`. Returns 200 on success. Errors: 422 (self-removal), 403 (not head), 404 (not in family). See `backend/.claude/records/journals/2026-03-25-member-removal-wrench.md`.

---

**Status:** Complete — delivered as part of settings page members build; permit status was never updated
**Journal:** N/A — work was bundled with the settings page members implementation
