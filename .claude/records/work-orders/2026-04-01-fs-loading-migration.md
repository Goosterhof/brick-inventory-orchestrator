# Building Permit: fs-loading Migration

**Permit #:** 2026-04-01-fs-loading-migration
**Filed:** 2026-04-01
**Issued By:** General
**Assigned To:** Lead Brick Architect
**Priority:** When-convenient

---

## The Job

Replace the local `loading.ts` and `loading-middleware.ts` shared services with `@script-development/fs-loading`. The package is a direct extraction of these files — the API is identical. This is a dependency swap, not a rewrite.

## Scope

### In the Box

1. **Install the package** — `npm install @script-development/fs-loading` in the frontend workspace.

2. **Replace the loading service import** — In `src/apps/families/services/loading.ts`, change:

    ```ts
    // Before
    import {createLoadingService} from '@shared/services/loading';
    import {registerLoadingMiddleware} from '@shared/services/loading-middleware';

    // After
    import {createLoadingService, registerLoadingMiddleware} from '@script-development/fs-loading';
    ```

    The rest of the file (`familyLoadingService` creation, middleware registration) stays identical.

3. **Update any other direct imports** — Search for `@shared/services/loading` and `@shared/services/loading-middleware` across the codebase. Any import of `LoadingService` type, `createLoadingService`, or `registerLoadingMiddleware` should point to the package instead.

4. **Remove the local files** — Once all imports are migrated:
    - Delete `src/shared/services/loading.ts`
    - Delete `src/shared/services/loading-middleware.ts`

5. **Migrate tests** — The local test files test the now-packaged code. They should be removed:
    - Delete `src/tests/unit/shared/services/loading.spec.ts`
    - Delete `src/tests/unit/shared/services/loading-middleware.spec.ts`

    The package has 25 tests with 100% coverage — these are now the package's responsibility. The families app's `loading.ts` service file (3 lines of wiring) doesn't need its own test.

6. **Run knip** — Verify no dead exports remain after removing the local files.

### Not in This Set

- Admin app or Showcase app loading integration — they don't currently use loading services
- Changing the middleware options (timeout, etc.) — use package defaults for now
- Any loading UX changes — this is a pure dependency swap

## Acceptance Criteria

- [ ] `@script-development/fs-loading` is installed and importable
- [ ] `familyLoadingService` still works identically (same `isLoading`, `activeCount`, `startLoading`, `stopLoading`, `ensureLoadingFinished` API)
- [ ] Loading middleware still bridges to `familyHttpService` (requests trigger loading state)
- [ ] Local `loading.ts` and `loading-middleware.ts` are deleted from `src/shared/services/`
- [ ] Local test files for loading and loading-middleware are deleted
- [ ] No references to `@shared/services/loading` or `@shared/services/loading-middleware` remain in the codebase
- [ ] `npm run knip` reports no dead exports
- [ ] Full quality gauntlet passes: `npm run type-check && npm run knip && npm run test:coverage && npm run build`

## References

- Package: `@script-development/fs-loading@0.1.0` on npm
- Package source: `fs-packages/packages/loading/` (Armory)
- PR: script-development/fs-packages#6
- Precedent: `fs-storage-migration` permit (2026-03-31) — same swap pattern
- Local source being replaced: `src/shared/services/loading.ts`, `src/shared/services/loading-middleware.ts`

## Notes from the Issuer

This is the cleanest migration possible — the package was extracted verbatim from these exact files. The `LoadingService` type, the `LoadingMiddlewareOptions` type, the `LoadingMiddlewareResult` type, and both factory functions have identical signatures. The only difference is the import path.

The `registerLoadingMiddleware` in the package includes the same timeout protection (30s default), per-request deduplication via `WeakSet`, and `unregister()` return that the local version has. No behavior changes.

If integration tests import the loading service or middleware types, those imports also need updating to the package.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-04-01-fs-loading-migration.md`
