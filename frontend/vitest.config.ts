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
            root: import.meta.dirname,
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
                    'src/apps/**/types/**',
                    // Domains still outside the gate — each later slice of BIO-0007 (b) removes one entry
                    'src/apps/families/domains/home/**',
                    'src/apps/families/domains/parts/**',
                    'src/apps/families/domains/storage/**',
                    'src/apps/families/domains/sets/**',
                    // Design prototypes driving canvas, WebGL and animation APIs happy-dom lacks — ruled outside the gate (BIO-0043)
                    'src/apps/showcase/pages/**',
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

                // Families app — app-level service wiring
                project('families/services', 'apps/families/services'),

                // Families app — adapter-store modules
                project('families/stores', 'apps/families/stores'),

                // App roots — files directly in the app directory, not in domains
                rootProject('families/root', 'apps/families'),
                rootProject('admin/root', 'apps/admin'),
                rootProject('showcase/root', 'apps/showcase'),

                // Admin app — domain pages
                project('admin/home', 'apps/admin/domains/home'),

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
                fileProject('lint-vue-conventions', 'lint-vue-conventions.spec.ts'),

                // Browser integration tests — loaded from vitest.browser.config.ts via npm scripts
                // Excluded from main config to avoid Playwright provider initialization during unit tests
            ],
        },
    }),
);
