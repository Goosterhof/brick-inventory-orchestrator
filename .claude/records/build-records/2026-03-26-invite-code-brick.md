# Construction Journal: The Invite Code Brick

**Journal #:** 2026-03-26-invite-code-brick
**Filed:** 2026-03-26
**Permit:** `.claude/records/permits/2026-03-25-invite-code-brick.md`
**Architect:** Lead Brick Architect

---

## Work Summary

The production code (SettingsPage.vue, RegisterPage.vue, inviteCode.ts, auth/types.ts) was already implemented on the branch. This shift focused on completing the test coverage for the new invite code functionality and adding the missing translation keys.

| Action   | File                                                                       | Notes                                                                                                                                                                                                                                                            |
| -------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modified | `src/tests/unit/apps/families/domains/settings/pages/SettingsPage.spec.ts` | Added 18 new tests for invite code section: fetch, 404 handling, head/non-head visibility, copy, generate, revoke, error states. Added mockDeleteRequest, mockUserId, URL-based mockGetRequest routing. Total: 36 tests (was 18).                                |
| Modified | `src/tests/unit/apps/families/domains/auth/pages/RegisterPage.spec.ts`     | Updated field count from 5 to 6, switched from index-based to label-based `.find()` patterns, added invite code optional test, added empty invite code sends undefined test. Total: 11 tests (was 9).                                                            |
| Modified | `src/apps/families/services/translation.ts`                                | Added 9 translation keys for both EN and NL: auth.inviteCode, settings.inviteCodeTitle, settings.inviteCodeDescription, settings.generateInviteCode, settings.revokeCode, settings.copyCode, settings.codeCopied, settings.codeExpires, settings.inviteCodeError |

## Permit Fulfillment

| Acceptance Criterion                                           | Met | Notes                                                           |
| -------------------------------------------------------------- | --- | --------------------------------------------------------------- |
| Family head sees "Generate Invite Code" on settings page       | Yes | Covered by `isHead` computed + v-if, tested                     |
| Generated code is displayed with copy-to-clipboard             | Yes | Code display + navigator.clipboard.writeText, tested            |
| Family head can revoke/regenerate the code                     | Yes | POST generate + DELETE revoke, both tested                      |
| Registration form has an optional invite code field            | Yes | TextInput with `:optional="true"`, tested                       |
| Entering a valid code during registration joins user to family | Yes | inviteCode passed in register call, tested with value and empty |
| Invalid/expired code shows clear error message                 | Yes | Validation errors bound via useValidationErrors composable      |
| Non-head members cannot see the generate button                | Yes | v-if="isHead" + userId comparison, tested for non-head user     |
| 100% test coverage on new code                                 | Yes | 100% lines, branches, functions, statements                     |
| All quality gates pass                                         | Yes | All 7 gauntlet checks pass                                      |

## Decisions Made

1. **URL-based mockGetRequest routing over sequential mockResolvedValueOnce** -- Chose `mockImplementation((url) => {...})` to route `/family/members` and `/family/invite-code` to different responses. More explicit and resilient to call order changes than chaining `.mockResolvedValueOnce()`.

2. **Label-based `.find()` over index-based access in RegisterPage tests** -- Replaced `inputs[0]?.props("label")` with `inputs.find((i) => i.props("label") === "auth.inviteCode")`. This follows the graduated training rule against index-based array access and makes tests resilient to field reordering.

3. **`Object.defineProperty` for clipboard mock over `Object.assign`** -- JSDOM's `navigator.clipboard` is a getter-only property. Used `Object.defineProperty` with `writable: true, configurable: true` to mock it properly.

## Quality Gauntlet

| Check         | Result | Notes                               |
| ------------- | ------ | ----------------------------------- |
| format:check  | Pass   |                                     |
| lint          | Pass   | 0 errors, 5 warnings (pre-existing) |
| lint:vue      | Pass   |                                     |
| type-check    | Pass   |                                     |
| test:coverage | Pass   | 100% all metrics, 1167 tests        |
| knip          | Pass   |                                     |
| size          | Pass   | families: 104.72kB / 350kB          |

## Showcase Readiness

Solid. The invite code feature demonstrates a clean pattern for head-only settings sections: computed `isHead` from userId comparison, conditional rendering, and proper error handling for all API states (404 = no code, 500 = error, success). The test coverage is thorough -- 18 new tests for the settings page alone, covering happy paths, error states, and authorization boundaries. The URL-routing mock pattern is clean and reusable.

## Proposed Knowledge Updates

- **Learnings:** None -- no new gotchas discovered.
- **Pulse:** Update in-progress work to mark invite code brick as complete. Update test count to 1167. Update quality metrics.
- **Domain Map:** Update settings domain to include new API endpoints: `POST /family/invite-code`, `GET /family/invite-code`, `DELETE /family/invite-code`. Update auth domain to note optional `invite_code` in registration.
- **Component Registry:** No new shared components.
- **Decision Record:** None -- no significant architectural choices; followed established patterns.

## Self-Debrief

### What Went Well

- Recognized immediately that production code was already implemented and focused on the actual gap (tests + translations).
- URL-based mock routing pattern was the right call from the start -- no wasted iterations.
- Label-based `.find()` pattern in RegisterPage tests worked cleanly and followed graduated training.

### What Went Poorly

- First attempt at clipboard mock used `Object.assign(navigator, {...})` which fails on JSDOM's getter-only property. Cost one test cycle.

### Blind Spots

- Did not check whether translation keys existed before running type-check. Could have grepped for the keys first and added them before the first gauntlet run.

### Training Proposals

| Proposal                                                                                                                                                        | Context                                                                                       | Shift Evidence               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------- |
| Before running type-check on modified Vue templates, grep translation keys used in the template against the translation schema file to catch missing keys early | Hit 5 type errors for missing translation keys that required adding to both EN and NL schemas | 2026-03-26-invite-code-brick |

---

## CFO Evaluation

_Appended by the CFO after reviewing the journal. The architect's sections above are not edited -- they stand as written._

### Assessment

Clean delivery. All 9 acceptance criteria met, gauntlet green, 100% coverage. The architect correctly identified that production code was already on the branch and focused on the actual gap -- tests and translations. No wasted motion.

### Code Review Notes

- **SettingsPage**: `isHead` computed via `userId()` against members list is the right call -- avoids adding `isHead` to the Profile type and keeps the authorization logic local to where it's used. The 404 handling for "no active code" is clean -- silent catch for 404, error message for anything else.
- **RegisterPage**: `inviteCode: inviteCode.value || undefined` is correct -- sends `undefined` (omitted by deepSnakeKeys) when empty rather than an empty string. Good attention to the API contract.
- **RegistrationData type**: `inviteCode?: string` at the end of the interface -- correct placement, doesn't break existing consumers.
- **Test quality**: URL-based `mockImplementation` routing is clearly better than `mockResolvedValueOnce` chaining. Label-based `.find()` over index-based access follows graduated training. Clipboard mock via `Object.defineProperty` is the correct JSDOM workaround.

One minor note: the `DangerButton` import is new to SettingsPage -- the architect correctly used a different button variant for the destructive "revoke" action. Good UX instinct.

### Decision Review

Both decisions (URL-based mock routing, label-based find) are sound. No objections.

### Training Evaluation

| Proposal                                                                                                                                   | Verdict   | Reason                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before running type-check on modified Vue templates, grep translation keys against the translation schema file to catch missing keys early | Candidate | Valid observation -- translation key mismatches are a predictable failure mode when adding UI with i18n. One shift so far; needs a second confirming observation before graduation. |

### Graduation Check

No graduations this round. The proposal is a first observation -- needs a second confirming shift.

### Concerns

None. Solid, efficient delivery.
