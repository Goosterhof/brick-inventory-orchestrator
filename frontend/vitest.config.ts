import {fileURLToPath} from 'node:url';
import {configDefaults, defineConfig, mergeConfig} from 'vitest/config';

import viteConfig from './vite.config';

const project = (name: string, include: string) => ({
    extends: true as const,
    test: {
        name,
        environment: 'happy-dom' as const,
        setupFiles: ['./src/tests/unit/setup.ts'],
        include: [`src/tests/unit/${include}/**/*.spec.ts`],
    },
});

const rootProject = (name: string, include: string) => ({
    extends: true as const,
    test: {
        name,
        environment: 'happy-dom' as const,
        setupFiles: ['./src/tests/unit/setup.ts'],
        include: [`src/tests/unit/${include}/*.spec.ts`],
    },
});

const fileProject = (name: string, include: string) => ({
    extends: true as const,
    test: {
        name,
        environment: 'happy-dom' as const,
        setupFiles: ['./src/tests/unit/setup.ts'],
        include: [`src/tests/unit/${include}`],
    },
});

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            exclude: [...configDefaults.exclude, 'e2e/**'],
            root: fileURLToPath(new URL('./', import.meta.url)),
            reporters: [
                'default',
                './src/tests/unit/collect-guard-reporter.ts',
                './src/tests/unit/test-guard-reporter.ts',
            ],
            coverage: {
                provider: 'istanbul',
                include: ['src/**/*.ts', 'src/**/*.vue'],
                exclude: [
                    'src/apps/**/main.ts',
                    'src/apps/**/App.vue',
                    'src/**/*.d.ts',
                    'src/apps/**/router/**',
                    'src/apps/**/domains/**',
                    'src/apps/**/pages/**',
                    'src/apps/**/services/**',
                    'src/apps/**/stores/**',
                    'src/apps/**/types/**',
                    'src/shared/services/auth/types.ts',
                    'src/tests/**',
                ],
                thresholds: {lines: 100, functions: 100, branches: 100, statements: 100},
            },
            projects: [
                // Families app — domain pages
                project('families/about', 'apps/families/domains/about'),
                project('families/auth', 'apps/families/domains/auth'),
                project('families/brick-dna', 'apps/families/domains/brick-dna'),
                project('families/home', 'apps/families/domains/home'),
                project('families/parts', 'apps/families/domains/parts'),
                project('families/sets', 'apps/families/domains/sets'),
                project('families/settings', 'apps/families/domains/settings'),
                project('families/storage', 'apps/families/domains/storage'),

                // Families app — cross-domain UI primitives at app level
                project('families/modals', 'apps/families/modals'),

                // App roots — files directly in the app directory, not in domains
                rootProject('families/root', 'apps/families'),
                rootProject('admin/root', 'apps/admin'),

                // Shared directories
                project('shared/components', 'shared/components'),
                project('shared/composables', 'shared/composables'),
                project('shared/errors', 'shared/errors'),
                project('shared/helpers', 'shared/helpers'),
                project('shared/middleware', 'shared/middleware'),
                project('shared/services', 'shared/services'),

                // Showcase
                project('showcase/components', 'apps/showcase/components'),

                // Infrastructure
                fileProject('architecture', 'architecture.spec.ts'),

                // Browser integration tests — loaded from vitest.browser.config.ts via npm scripts
                // Excluded from main config to avoid Playwright provider initialization during unit tests
            ],
        },
    }),
);
