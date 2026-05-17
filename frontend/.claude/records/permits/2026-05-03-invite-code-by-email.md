# Building Permit: Invite Code by Email (Plate Side)

**Permit #:** 2026-05-03-invite-code-by-email
**Filed:** 2026-05-03
**Issued By:** CEO (via CFO)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Wire the Plate to the warehouse's first email use case. Two small, independent surfaces:

1. **Settings → Family invite-code section**: extend with a recipient-email input + "Send invite by email" button calling `POST /family/invite-code/email`. The recipient gets an email containing the code and a clickable link to register.
2. **RegisterPage.vue**: read the `?invite={code}` query param on mount and pre-fill the existing `inviteCode` field. The recipient who clicks the email's button lands on the register page with the code already populated.

The Brick-side companion permit shipped in `backend/.claude/records/permits/2026-05-03-invite-code-by-email.md` (PR #166, merged). The endpoint is live, the queue worker drains locally via `make queue`, and the production worker is being provisioned in parallel. Plate work does not block on the Railway worker — `Mail::fake()` in tests means everything verifies green without a live send.

## Scope

### In the Box

- **`SettingsPage.vue` — extend the existing invite-code section** (`v-if="isHead"`):
    - Add a `recipientEmail` ref and a `recipientName` ref (the latter optional).
    - Add a `<form>` block beneath the existing Copy / Revoke controls with a `TextInput` for email (type="email", required), a `TextInput` for name (optional), and a `PrimaryButton` (label key: `settings.sendInviteByEmail`).
    - The form is visible **whether or not** an active invite code exists. The endpoint generates a fresh code regardless; the response carries the new code, so any displayed `inviteCode.value` reactive state must be replaced with the response's code immediately on success (this matches the backend's "always rotate" semantic — described in the shift log as Decision §1 of the brick side).
    - Inline status pattern matching the existing section: `inviteEmailSent` ref shown as `text="baseplate-green"` line on success, `inviteEmailError` ref shown as `text="brick-red-dark"` line on failure. **Do not introduce a toast service**; that earns its own permit if a need surfaces.
    - On 422 from the backend, surface field-level errors via `useValidationErrors` against the `recipientEmail` and `recipientName` fields, mirroring the registration flow's pattern.
    - On 429 (rate limited at 10/hour per user), show a translated message hinting at the throttle ("Too many emails sent — try again later"). Don't expose the limit in the UI.
- **`RegisterPage.vue` — read the invite param on mount**:
    - Import `useRoute` from `vue-router`.
    - On `<script setup>` body, read `route.query.invite`, coerce to string, and use it as the initial value of the `inviteCode` ref (e.g. `const inviteCode = ref(typeof route.query.invite === 'string' ? route.query.invite : '');`).
    - Strip the `invite` query param from the URL after consumption is **out of scope** — refreshing the page is allowed to re-populate the field, and we don't want the user to lose the code if they nav-back.
- **Type additions** in `src/apps/families/types/inviteCode.ts` (or wherever the existing `InviteCode` type lives):
    - `EmailInviteCodeRequest` matching the brick's FormRequest body: `{recipientEmail: string; recipientName?: string}`. The HTTP service handles the camelCase → snake_case conversion via `deepSnakeKeys()` (per the established API convention), so this stays camelCase.
- **Translation strings** in `src/apps/families/translations/` (or wherever the existing `settings.*` keys live) for the new UI:
    - `settings.sendInviteByEmail` (button label)
    - `settings.recipientEmail` (input label)
    - `settings.recipientName` (input label, with "(optional)" or marked as optional in the input itself if the existing pattern supports it)
    - `settings.inviteEmailSent` (success line)
    - `settings.inviteEmailError` (generic failure)
    - `settings.inviteEmailRateLimited` (429 message)
    - English first; mirror to any other languages already present in the file.
- **Tests** (`SettingsPage.spec.ts` and `RegisterPage.spec.ts`):
    - Unit: 100% coverage on the new branches per the project's coverage policy.
        - SettingsPage:
            - Email + name happy path → `POST /family/invite-code/email` called with the right body, success line shown, displayed code rotates to the new code from the response.
            - Email-only happy path (name omitted) → request body has `recipientEmail` only.
            - 422 → field errors render against `recipientEmail` / `recipientName`.
            - 429 → rate-limit translated line shown.
            - Generic failure (500) → generic error line shown.
            - Existing tests (Generate / Copy / Revoke / Theme / Members / Rebrickable token / Import) must still pass without modification.
        - RegisterPage:
            - Mount with `?invite=BRICK-ABCD` query → `inviteCode` field pre-filled.
            - Mount without query → `inviteCode` field empty (existing behavior preserved).
            - Mount with array-shaped query (Vue Router can produce `string[]` for repeated params) → field empty (defensive coercion).
            - Existing register-submit tests must still pass.

### Not in This Set

- **No backend work.** The endpoint shipped on `main` already.
- **No toast service.** The Plate has no toast service today; introducing one for this single use case would force a cross-cutting permit. Inline status lines match the existing section's pattern.
- **No "send to multiple recipients."** The brick endpoint accepts one recipient per call — by design (each call rotates the code). The Settings UI mirrors that constraint: one email, one button press, one send.
- **No "track sends" / "list emails sent."** No backend support, no UI history. v1 is fire-and-forget; if the head wants to know whether the email arrived, they ask the recipient or check Resend's dashboard.
- **No Resend webhook integration / bounce display.** The brick permit defers webhooks; Plate cannot show what the brick doesn't expose.
- **No invite-code QR code or share link in the email-form section.** The existing Copy button covers manual share; the new Email button covers automated share. Bigger share-modal is overkill for v1 and earns its own permit if user research surfaces a need.
- **No "invite link only — no code visible" alternative flow.** The email always contains both the visible code and a clickable link. Hiding the code would make manual fallback harder.
- **No URL cleanup on the register page** after consuming `?invite=`. Reload-friendly; the user pasting the URL elsewhere is not a security concern (the code is already shared by being in the email).
- **No e2e Set Assembly Check changes.** This work is unit-test-coverable end-to-end via `Mail::fake()`-style mocks at the HTTP layer. An e2e test that round-trips through a real worker is out of scope until the e2e harness has worker support (deferred per the brick permit's "tests use fakes, e2e uses a real worker" decision).

## Acceptance Criteria

- [ ] On `/settings`, a family head sees a new "Send invite by email" form beneath the Copy / Revoke controls, regardless of whether an active code exists.
- [ ] Submitting the form with a valid email + optional name calls `POST /family/invite-code/email` with the camelCase body `{recipientEmail, recipientName}` (the HTTP service converts to snake_case).
- [ ] Success: a green confirmation line renders, and the displayed invite code rotates to the new code from the response.
- [ ] 422: field errors render under the `recipientEmail` / `recipientName` inputs via `useValidationErrors`.
- [ ] 429: a translated rate-limit hint renders.
- [ ] Other failures (500, network): a generic error line renders.
- [ ] Visiting `/register?invite=BRICK-WXYZ` pre-fills the existing `inviteCode` field with `BRICK-WXYZ`. Visiting `/register` (no query) leaves the field empty.
- [ ] All gauntlet stages green: `npm run type-check`, `npm run knip`, `npm run lint`, `npm run lint:vue`, `npm run format:check`, `npm run test:coverage` (100%), `npm run build`, `npm run size`.
- [ ] No regressions in existing SettingsPage or RegisterPage tests.

## References

- Related Permit (Brick): `backend/.claude/records/permits/2026-05-03-invite-code-by-email.md` (Status: Completed; PR #166 merged)
- Related Brick artifact: `app/Http/Resources/InviteCodeResourceData.php` (response envelope shape)
- Related Brick artifact: `app/Http/Requests/Family/EmailInviteCodeRequest.php` (validation rules — 422 messages will mirror these)
- Existing pattern: the invite-code section in `src/apps/families/domains/settings/pages/SettingsPage.vue` (lines covering `inviteCode`, `generateInviteCode`, `revokeInviteCode`, `copyCode`)
- Existing pattern: the registration flow in `src/apps/families/domains/auth/pages/RegisterPage.vue` (the `inviteCode` ref + `useFormSubmit` + `useValidationErrors` shape)

## Notes from the Issuer

Three things worth flagging during the build:

1. **The displayed code rotates on every Email-button press.** The brick endpoint behaves like the existing `POST /family/invite-code` endpoint — it always issues a fresh code, revoking the prior active one. Make sure the SettingsPage state reflects this: after a successful email, the visible code in the existing card must update to whatever the response carries. If the code doesn't visibly rotate, a head who sends two emails to two recipients will think the second send "didn't change anything" — and worse, the first recipient's code will be silently invalidated without any visual feedback that this happened. This is honest behavior, but it must be visible.

2. **Defensive coercion on the route query.** `route.query.invite` can be `string | string[] | null | undefined`. The narrow check `typeof x === 'string'` is the right form — array-shaped queries (`?invite=A&invite=B`) and missing queries should both result in an empty field, not a thrown error and not a `[object Object]`-like artifact in the input. The third unit test under RegisterPage covers this exact case; it's there because Vue Router _will_ produce an array if the URL is hand-crafted that way, and silently rendering `,`-joined garbage in the input is the kind of bug that survives manual smoke testing.

3. **Inline status, not a toast.** Resist the urge to introduce a toast service "while we're here." The existing Settings page is consistent across six sections in using inline `text="baseplate-green"` / `text="brick-red-dark"` lines for status. Adding a toast for one section breaks the visual rhythm and forces every other section to either adopt the toast or stay inline (now inconsistent in a different direction). If a future feature actually needs cross-cutting transient notifications, that's the moment for a toast permit — not this one.

The CFO will be looking at the test list during review. If it balloons past ~12 tests for the SettingsPage additions plus ~3 for RegisterPage, something is being over-built.

---

**Status:** Open
**Journal:** _link to construction journal when filed_
