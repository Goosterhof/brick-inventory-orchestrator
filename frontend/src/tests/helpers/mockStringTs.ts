type CaseConversionMock = {deepCamelKeys: <T>(obj: T) => T; deepSnakeKeys: <T>(obj: T) => T};

const createIdentityMock = (): CaseConversionMock => ({
    deepCamelKeys: <T>(obj: T): T => obj,
    deepSnakeKeys: <T>(obj: T): T => obj,
});

/** Mock for direct `string-ts` imports (auth, router, translation services). */
export const createMockStringTs = (): CaseConversionMock => createIdentityMock();

/**
 * Mock for `@script-development/fs-helpers` — the package that `@shared/helpers/string`
 * re-exports `deepCamelKeys`, `deepSnakeKeys`, and `toCamelCaseTyped` from.
 *
 * Required because the package bundles `string-ts` internally, so mocking `string-ts`
 * alone does not intercept case conversion when imported via the package.
 */
export const createMockFsHelpers = (): CaseConversionMock & {toCamelCaseTyped: <T>(obj: T) => T} => ({
    ...createIdentityMock(),
    toCamelCaseTyped: <T>(obj: T): T => obj,
});
