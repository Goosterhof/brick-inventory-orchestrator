import {fileURLToPath} from 'node:url';
import {defineConfig, mergeConfig} from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
    viteConfig,
    defineConfig({
        resolve: {
            alias: {
                '@phosphor-icons/vue': fileURLToPath(
                    new URL('./src/tests/integration/stubs/phosphorIcons.ts', import.meta.url),
                ),
                '@integration': fileURLToPath(new URL('./src/tests/integration', import.meta.url)),
            },
        },
        test: {
            root: fileURLToPath(new URL('./', import.meta.url)),
            include: ['src/tests/integration/**/*.spec.ts'],
            setupFiles: ['./src/tests/integration/setup.ts'],
            environment: 'happy-dom',
            fileParallelism: false,
        },
    }),
);
