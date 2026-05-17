import {playwright} from '@vitest/browser-playwright';
import {fileURLToPath} from 'node:url';
import {defineConfig, mergeConfig} from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            root: fileURLToPath(new URL('./', import.meta.url)),
            include: ['src/tests/browser/**/*.spec.ts'],
            setupFiles: ['./src/tests/browser/setup.ts'],
            coverage: {
                provider: 'istanbul',
                include: ['src/**/*.ts', 'src/**/*.vue'],
                exclude: [
                    'src/apps/**/main.ts',
                    'src/apps/**/App.vue',
                    'src/**/*.d.ts',
                    'src/apps/**/router/**',
                    'src/apps/**/domains/**',
                    'src/apps/**/services/**',
                    'src/apps/**/stores/**',
                    'src/apps/**/types/**',
                    'src/shared/services/auth/types.ts',
                    'src/tests/**',
                ],
            },
            browser: {
                enabled: true,
                provider: playwright({
                    launchOptions: {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH},
                }),
                instances: [{browser: 'chromium'}],
                headless: true,
            },
        },
    }),
);
