# Work Order: Adopt @script-development/fs-form in the Gallery Wing

**Work Order #:** 2026-07-08-fs-form-adoption
**Filed:** 2026-07-08
**Issued By:** General (War Room — Structural Reform)
**Assigned To:** The Steward / Engineer soldier
**Wing:** Gallery (`frontend/`)
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `fs-form-adoption`

---

## The Job

Retire the Gallery's two local form composables (`useFormSubmit`, `useValidationErrors`) in favour of the armory package `@script-development/fs-form`, whose `useForm` one-call composable is the extracted, published successor. BIO was one of the two source territories the package was extracted from, so its call sites are the near-verbatim ancestors of the package.

## Scope

### In the Box

- Bump `@script-development/fs-http` `^0.4.0` → `^0.5.0` (required peer of fs-form; additive — adds `guarded()`), plus the peer-cascade patch bumps this forced (`fs-adapter-store` `^0.3.0`→`^0.3.1`, `fs-loading` `^0.1.4`→`^0.1.5`, `vue` floor `^3.5.38`→`^3.5.39`).
- Add `@script-development/fs-form` `^0.1.0`.
- Migrate all 9 call sites to `useForm(familyHttpService, {keyMapper: camelKey})`.
- Delete `src/shared/composables/useFormSubmit.ts` + `useValidationErrors.ts` and their two unit specs.
- Add a scalar `camelKey` helper to `@shared/helpers/string` (per-key form of `deepCamelKeys`) as the `useForm` `keyMapper`, preserving the Gallery's camelCase 422-field-error convention.
- Repoint the Forms doctrine + composables blueprint in `frontend/CLAUDE.md`.

### Not in This Set

- No `backend/` changes.
- No behaviour changes — this is a like-for-like structural swap; 422 field-error mapping (snake→camel) is preserved via `keyMapper: camelKey`.

## Acceptance

Full Gallery gauntlet green at 100% coverage: `type-check → lint → format:check → knip → test:coverage → build`. No dead code (deleted composables fully de-referenced).

## Notes

- `useForm`'s default `keyMapper` is identity, so the migration is **not** a bare one-line collapse — each site must pass `{keyMapper: camelKey}` to keep camelCase field addressing (`set_number` → `setNumber`). See the War Room execution report for detail.
- fs-form/fs-http are un-mocked node_modules ESM, so their 422 detection uses the *real* `axios.isAxiosError` (flag-based); the shared `MockAxiosError` test double gained an `isAxiosError = true` flag to match real axios.
