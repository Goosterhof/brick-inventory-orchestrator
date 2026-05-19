# Building Permit: Form Validation Workbench

**Permit #:** 2026-03-28-form-validation-workbench
**Filed:** 2026-03-28
**Issued By:** CEO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Build an interactive showcase page that demonstrates the form composables (`useFormSubmit`, `useValidationErrors`) working end-to-end with all input types. Visitors should see real-time validation, simulated 422 error parsing, and submit lifecycle handling — proving our form infrastructure is production-grade.

## Scope

### In the Box

- New showcase section/page: Form Validation Workbench
- Demo form using every shared input component (TextInput, NumberInput, SelectInput, DateInput, TextareaInput)
- Live demonstration of `useValidationErrors` — set errors, clear on input, display per-field
- Live demonstration of `useFormSubmit` — submitting state, 422 error handling, success flow
- Simulated API responses: success, 422 validation failure, generic error
- Show the validation error object state alongside the form (inspector panel)
- Integrate into existing showcase navigation
- 100% test coverage on all new code

### Not in This Set

- No real API calls — all responses are simulated/mocked
- No new shared composables or modifications to existing ones
- No new shared input components
- No changes to the Families app

## Acceptance Criteria

- [ ] Showcase includes a Form Validation Workbench section
- [ ] Every shared input type is represented in the demo form
- [ ] Users can trigger a simulated 422 response and see field-level errors appear
- [ ] Users can see errors clear as they interact with fields
- [ ] Submit lifecycle is visible (idle -> submitting -> success/error)
- [ ] An inspector panel shows the raw validation error state in real-time
- [ ] All quality gates pass: type-check, knip, lint, test:coverage, build
- [ ] 100% test coverage on new code

## References

- Composable: `src/shared/composables/useFormSubmit.ts`
- Composable: `src/shared/composables/useValidationErrors.ts`
- Input components: `src/shared/components/forms/inputs/`
- Existing showcase: `src/apps/showcase/`

## Notes from the Issuer

The composables gap is the most visible weakness in the showcase right now. We have two well-built composables and zero visibility into how they work. This workbench should make the form handling story self-evident. Keep the demo realistic — model it after a plausible "add a LEGO set" form, not abstract field1/field2 nonsense.

---

**Status:** Complete
**Journal:** _link to construction journal when filed_
