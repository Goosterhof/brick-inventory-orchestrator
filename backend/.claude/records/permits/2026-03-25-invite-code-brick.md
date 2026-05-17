# Shipping Order: The Invite Code Brick

**Order #:** 2026-03-25-invite-code-brick
**Filed:** 2026-03-25
**Issued By:** Brick Master (Baseplate)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Build the invite code system — family head generates a short code (e.g., `BRICK-7X3K`), new users enter it during registration to join that family instead of creating a new one. No email infrastructure needed.

## Scope

### In the Crate

- Invite code model (or column on Family) — short, human-readable codes
- `POST /family/invite-code` — generate/regenerate an invite code (family head only)
- `DELETE /family/invite-code` — revoke the active code (family head only)
- `GET /family/invite-code` — retrieve the current active code (family head only)
- Modified registration flow — accept optional invite code, join existing family if valid
- Code expiry mechanism (TTL-based or manual revocation)
- Authorization — only family head can manage codes

### Not on This Pallet

- Frontend UI — separate building permit to the Plate
- Email-based invitations
- Invite links/URLs (the shelved Magic Link Drawbridge)
- Role-based permissions
- Batch invitations

## Acceptance Criteria

- [ ] Family head can generate a short, readable invite code
- [ ] Family head can revoke an active code
- [ ] Family head can retrieve the current active code
- [ ] Non-head members cannot manage invite codes (403)
- [ ] Registration accepts an optional invite code parameter
- [ ] Valid invite code during registration joins user to the code's family
- [ ] Invalid/expired/revoked codes return clear error responses
- [ ] Brute-force mitigated (existing registration throttle + code entropy)
- [ ] Code format is human-friendly (e.g., `BRICK-XXXX`)
- [ ] Actions follow warehouse regulations
- [ ] 100% unit test coverage on Actions
- [ ] 80% feature test coverage on endpoints
- [ ] All quality gates pass

## References

- Feature Brief: Idea Vault `docs/idea-vault.md` — The Invite Code Brick
- Related Permit: `frontend/.claude/records/permits/2026-03-25-invite-code-brick.md` (Plate side)
- Predecessor: The Family Roster Display (Shipped — PR #110)
- Key Concern: Brute-force on short codes mitigated by existing registration throttle. Codes should be revocable.

## Notes from the Issuer

Medium piece count. This touches the registration flow — the most critical path in auth. The existing `RegisterAction` will need modification to accept an optional invite code. Be careful not to break the existing registration flow when no code is provided.

Key design decision for the Logistics Director: invite code as a new model vs. columns on the Family model. A separate model is cleaner if codes need history/audit, but columns are simpler if only one active code per family.

The Plate is blocked on this — agree on the API contract early.

---

**Status:** Complete
**Shift Log:** `.claude/records/journals/2026-03-25-invite-code-brick.md`
