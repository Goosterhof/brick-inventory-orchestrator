# Building Permit: fs-helpers & fs-adapter-store Migration

**Permit #:** 2026-04-01-fs-helpers-adapter-store-migration
**Filed:** 2026-04-01
**Issued By:** General
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Replace the local `adapter-store.ts`, `resource-adapter.ts`, `copy.ts` (deepCopy/Writable), and `type-check.ts` (isExisting) with `@script-development/fs-helpers` and `@script-development/fs-adapter-store` from the Armory. These packages were extracted from BIO's own implementations — this is a homecoming, not a migration.

## Scope

### In the Box

1. **Install packages** — `npm install @script-development/fs-helpers @script-development/fs-adapter-store`

2. **Replace `shared/helpers/copy.ts`** — Delete the file. All imports of `deepCopy` and `Writable` switch to `@script-development/fs-helpers`. The package implementation is identical to BIO's (it was extracted from here).

3. **Replace `shared/helpers/type-check.ts` (isExisting only)** — The `isExisting` function moves to `@script-development/fs-helpers`. The `ensureRefValueExists` function stays local (it's BIO-specific, not in the package). If `type-check.ts` only contains these two, split: delete `isExisting`, keep `ensureRefValueExists` (move to a new file or keep in `type-check.ts`).

4. **Replace `shared/services/adapter-store.ts`** — Delete the file. Import `createAdapterStoreModule`, `EntryNotFoundError`, and all types from `@script-development/fs-adapter-store`. BIO's `toCamelCaseTyped` call inside `retrieveAll` is handled by the existing request/response middleware — the package stores data as-is, which is already camelCase after middleware conversion.

5. **Replace `shared/services/resource-adapter.ts`** — Delete the file. Import `resourceAdapter`, `MissingResponseDataError`, `Adapted`, `NewAdapted`, `AdapterStoreModule` from `@script-development/fs-adapter-store`.

6. **Wire BIO's `New<T>` as the generic `N` parameter** — The package defaults to `Omit<T, "id">`, but BIO's `New<T>` is `Omit<T, "id" | "createdAt" | "updatedAt">`. Every domain adapter that uses `New<T>` must pass it as the second generic: `Adapted<Set, New<Set>>`, `NewAdapted<Set, New<Set>>`, etc. BIO's `New<T>` and `Updatable<T>` types in `shared/types/generics.d.ts` remain — they're territory-specific type aliases.

7. **Replace `shared/errors/entry-not-found.ts`** — If this error class is identical to the package's `EntryNotFoundError`, delete it and import from the package. If BIO's version has extra functionality, keep it.

8. **Update `shared/helpers/string.ts`** — The `toCamelCaseTyped` function and `deepCamelKeys`/`deepSnakeKeys` re-exports can be replaced with imports from `@script-development/fs-helpers`. Other string helpers in this file (if any) stay local.

9. **Update all domain store files** — Every adapter store in `apps/families/domains/*/` that imports from the deleted local files needs import path updates. This is the bulk of the file changes.

10. **Update test imports** — Tests for adapter-store and resource-adapter can be deleted (the package owns those tests now at 100% coverage + 100% mutation score). Tests for domain stores that import from the deleted files need import path updates.

11. **Run knip** — After migration, knip should confirm no dead code remains from the old local implementations.

### Not in This Set

- Sibling territory migration — separate deployment
- Case conversion middleware changes — the existing middleware already handles snake/camel conversion before data reaches the store
- `ensureRefValueExists` extraction — BIO-specific, stays local
- `csv.ts` or other helpers — not in the package, stay local
- The `string.ts` helper file beyond `toCamelCaseTyped` and case conversion re-exports — other string utilities stay local

## Acceptance Criteria

- [x] `@script-development/fs-helpers` and `@script-development/fs-adapter-store` are installed and importable
- [x] `shared/helpers/copy.ts` is deleted — no local deepCopy/Writable
- [x] `isExisting` imports from `@script-development/fs-helpers`
- [x] `shared/services/adapter-store.ts` is deleted — all imports from package
- [x] `shared/services/resource-adapter.ts` is deleted — all imports from package
- [x] BIO's `New<T>` is passed as the `N` generic parameter wherever domain stores use `Adapted`/`NewAdapted`
- [x] All domain stores function identically (no behavioral change)
- [x] Integration tests still pass (mock-server pattern unaffected)
- [x] `toCamelCaseTyped`, `deepCamelKeys`, `deepSnakeKeys` import from `@script-development/fs-helpers`
- [x] knip reports no dead code from old local implementations
- [x] Full quality gauntlet passes: `npm run type-check && npm run knip && npm run test:coverage && npm run build`

## References

- Package source: `fs-packages/packages/helpers/` and `fs-packages/packages/adapter-store/` (Armory)
- PRs: script-development/fs-packages#7 (fs-helpers), script-development/fs-packages#8 (fs-adapter-store)
- Precedent: `fs-storage-migration` permit (2026-03-31), `fs-theme-integration` permit (2026-04-01)
- Design decisions: War room memory `project-armory-fs-packages.md` — adapter-store IS extractable, `New<T>` generic with `Omit<T, "id">` default
- War Room Context: Deployment orders at `orders/fs-packages/fs-helpers-extraction-deployment.md` and `orders/fs-packages/fs-adapter-store-extraction-deployment.md`

## Notes from the Issuer

This is the most impactful Armory migration yet — adapter-store is the backbone of every domain store in BIO. The package was extracted from BIO's own code, so the behavioral contract is identical. The main complexity is threading BIO's `New<T>` through the generics.

The `toCamelCaseTyped` call that BIO's adapter-store makes inside `retrieveAll` is the key difference. BIO's local version converts API responses from snake_case. The package does NOT do this — it stores data as-is. But BIO already has response middleware (via fs-http) that converts snake→camel before the data reaches the store. Verify this is wired correctly: if the middleware handles conversion, the store receives camelCase data and no explicit `toCamelCaseTyped` call is needed. If any domain bypasses the middleware, that's a bug to surface, not a reason to keep the local implementation.

The adapter-store and resource-adapter unit tests (929 + 858 lines) can be deleted — the package carries 73 tests with 100% coverage and 100% mutation score. Domain-level tests that exercise the stores should remain. Integration tests via the mock-server pattern test the full pipeline including the store layer, so they serve as the regression safety net.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-04-01-fs-helpers-adapter-store-migration.md`
