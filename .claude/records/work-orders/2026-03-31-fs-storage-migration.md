# Building Permit: Replace Local Storage Service with @script-development/fs-storage

**Permit #:** 2026-03-31-fs-storage-migration
**Filed:** 2026-03-31
**Issued By:** General (war room Armory campaign)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Replace the local `createStorageService` implementation in `@shared/services/storage.ts` with the `@script-development/fs-storage` package from the Armory. The implementations are byte-for-byte identical — this is a drop-in package replacement, not a rewrite.

## Scope

### In the Box

- Install `@script-development/fs-storage` as a dependency
- Update `src/apps/families/services/storage.ts` to import `createStorageService` from `@script-development/fs-storage` instead of `@shared/services/storage`
- Update `src/shared/services/adapter-store.ts` to import `StorageService` type from `@script-development/fs-storage` instead of the local `./storage`
- Update `src/shared/services/sound.ts` to import `StorageService` type from `@script-development/fs-storage` instead of the local `./storage`
- Delete `src/shared/services/storage.ts` — the local implementation is fully replaced by the package
- Delete `src/tests/unit/shared/services/storage.spec.ts` — the package owns its own test coverage (100% coverage, mutation tested at 90%)
- Run the full quality gauntlet: type-check, knip, lint, test:coverage, build

### Not in This Set

- Changes to `@script-development/fs-storage` package itself (the package is already published and proven)
- Migration of other services (http is already migrated)
- Any behavioral changes — the APIs are identical, this is purely an import swap
- Re-export wrappers — import the package directly where needed, no indirection layer (Commander directive)

## Acceptance Criteria

- [ ] `@script-development/fs-storage` is listed in `package.json` dependencies
- [ ] `src/shared/services/storage.ts` is deleted
- [ ] `src/tests/unit/shared/services/storage.spec.ts` is deleted
- [ ] All imports of `createStorageService` and `StorageService` reference the package, not local files
- [ ] `npm run type-check` passes
- [ ] `npm run knip` passes (no dead code, no missing imports)
- [ ] `npm run test:coverage` passes at 100%
- [ ] `npm run build` passes
- [ ] No re-export wrapper files created — all consumers import directly from the package

## References

- War Room Context: Armory campaign — `@script-development/fs-storage` v0.1.0 published to npm
- Related Permit: [2026-03-31-integration-test-mock-server](2026-03-31-integration-test-mock-server.md) — integration tests use `storageService` via adapter-store; verify they still pass after the import swap
- Package: `@script-development/fs-storage` — factory function with prefix namespacing, 100% coverage, 90% mutation score, 8-gate CI

## Notes from the Issuer

**Strategic context:** The Armory (`fs-packages`) was built to extract proven patterns from BIO and share them across territories. `fs-http` was the first package consumed by BIO (already installed). `fs-storage` is the second — completing the service extraction pipeline for this territory.

**Why this is safe:** The `@script-development/fs-storage` implementation was extracted _from_ BIO's local `storage.ts`. The function signatures, error handling, prefix strategy, and edge case behavior are identical. The package adds its own 100% test coverage and Stryker mutation testing at 90% — stronger quality guarantees than the local copy.

**Coverage impact:** Deleting the local `storage.ts` and its 99-test spec file will remove lines from the coverage denominator. Since the implementation is now tested by the package's own CI pipeline, this is a net improvement — BIO's test suite focuses on BIO's code, not on reusable infrastructure that lives elsewhere.

**Integration tests:** The `adapter-store` uses `storageService.get()` on init to hydrate from localStorage. Integration tests rely on happy-dom's empty localStorage (returns `{}` by default). The import swap doesn't change this behavior — same interface, same calls, same results.

**Direct imports, no indirection:** Per Commander directive, consumers import `createStorageService` and `StorageService` directly from `@script-development/fs-storage`. No local re-export file. The dependency is honest and visible.

---

**Status:** Complete
**Journal:** [2026-03-31-fs-storage-migration.md](../journals/2026-03-31-fs-storage-migration.md)
