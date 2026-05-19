# Building Permit: Form Submit Loading Guard

**Permit #:** 2026-03-28-form-submit-loading-guard
**Filed:** 2026-03-28
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Add a `submitting` ref to `useFormSubmit` that tracks whether a form submission is in flight, preventing double-submit spam. Wire it to the submit buttons in all form pages.

## Scope

### In the Box

- Add `submitting` ref to `useFormSubmit` composable
- Guard `handleSubmit` so it no-ops if already submitting
- Return `submitting` from the composable
- Wire `:disabled="submitting"` to submit buttons on all form pages that use `useFormSubmit`
- Update existing tests for `useFormSubmit`
- Add tests for the new behavior (double-submit guard, submitting state lifecycle)
- Full quality gauntlet pass

### Not in This Set

- A generic `useAsyncAction` composable for non-form async operations (separate concern, not enough occurrences yet)
- Changes to non-form loading patterns (fetch-on-mount, action-triggered searches)
- Changes to the global loading service or loading middleware
- Changes to `useValidationErrors`

## Acceptance Criteria

- [ ] `useFormSubmit` returns a `submitting` Ref<boolean>
- [ ] `submitting` is `true` during action execution, `false` before and after
- [ ] Calling `handleSubmit` while `submitting` is `true` is a no-op
- [ ] `submitting` resets to `false` even when the action throws a non-422 error
- [ ] All form pages using `useFormSubmit` pass `submitting` as `:disabled` to their submit button
- [ ] 100% test coverage maintained
- [ ] Full gauntlet passes: type-check, knip, lint, format, build

## References

- Composable: `src/shared/composables/useFormSubmit.ts`
- Form pages: EditSetPage, AddSetPage, EditStoragePage, AddStoragePage, AssignPartModal (if applicable)

## Notes from the Issuer

This is a bug fix disguised as a feature. Every form page currently allows submit spam — there's no guard against firing multiple concurrent requests. The fix belongs in `useFormSubmit` because it already owns the submission lifecycle. Keep it simple: one ref, one guard, one finally block. The composable is currently 21 lines — it should stay under 30.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-03-28-form-submit-loading-guard.md`
