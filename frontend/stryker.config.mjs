/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
    testRunner: 'vitest',
    vitest: {configFile: 'vitest.config.ts'},
    mutate: [
        'src/shared/helpers/**/*.ts',
        'src/shared/composables/**/*.ts',
        'src/shared/middleware/**/*.ts',
        'src/shared/services/auth/**/*.ts',
        '!src/**/types.ts',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
    ],
    thresholds: {high: 95, low: 90, break: 90},
    reporters: ['clear-text', 'progress'],
    incremental: true,
    incrementalFile: '.stryker-incremental.json',
    cleanTempDir: 'always',
};
