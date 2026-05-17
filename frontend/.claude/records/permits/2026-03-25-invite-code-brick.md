# Building Permit: The Invite Code Brick (Plate Side)

**Permit #:** 2026-03-25-invite-code-brick
**Filed:** 2026-03-25
**Issued By:** Brick Master (Baseplate)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Build the frontend for the invite code system — family head generates a short invite code from settings, new users enter the code during registration to join that family. No email infrastructure needed.

## Scope

### In the Box

- "Generate Invite Code" button on settings page (visible to family head only)
- Display of active invite code with copy-to-clipboard
- Revoke/regenerate code functionality
- Invite code input field on the registration form (optional field)
- Success messaging when joining an existing family via code

### Not in This Set

- The backend endpoints — separate shipping order to the Brick
- Email-based invitations
- Invite link/URL system (that's the shelved Magic Link Drawbridge)
- Role-based permissions

## Acceptance Criteria

- [ ] Family head sees "Generate Invite Code" on settings page
- [ ] Generated code is displayed with copy-to-clipboard
- [ ] Family head can revoke/regenerate the code
- [ ] Registration form has an optional invite code field
- [ ] Entering a valid code during registration joins the user to the existing family
- [ ] Invalid/expired code shows clear error message
- [ ] Non-head members cannot see the generate button
- [ ] 100% test coverage on new code
- [ ] All quality gates pass

## References

- Feature Brief: Idea Vault `docs/idea-vault.md` — The Invite Code Brick
- Related Permit: `backend/.claude/records/permits/2026-03-25-invite-code-brick.md` (Brick side)
- Predecessor: The Family Roster Display (Shipped)

## Notes from the Issuer

Medium piece count, fullstack. The backend handles code generation, validation, and family joining logic — the Plate just needs the UI to trigger and display it. The registration form change is the most sensitive part — make sure a blank invite code field doesn't break the existing registration flow. Coordinate with the Brick on the API contract.

**Dependency:** ~~Blocked on the Brick's shipping order being completed first (or at minimum, the API contract being agreed).~~ **CLEARED** — Backend shipped 2026-03-25. Endpoints: `POST /family/invite-code` (generate), `GET /family/invite-code` (show active), `DELETE /family/invite-code` (revoke). Response: `InviteCodeResourceData` with `id`, `code`, `expiresAt`, `createdAt`. Registration accepts optional `invite_code` field. See `backend/.claude/records/journals/2026-03-25-invite-code-brick.md`.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-03-26-invite-code-brick.md`
