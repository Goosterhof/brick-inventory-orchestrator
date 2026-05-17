import vue from '@vitejs/plugin-vue';
import {fileURLToPath, URL} from 'node:url';
import UnoCSS from 'unocss/vite';
import {defineConfig} from 'vite';
import oxlint from 'vite-plugin-oxlint';
import vueDevTools from 'vite-plugin-vue-devtools';

// Determines which app is built and served based on the APP_NAME environment variable; defaults to "families" if APP_NAME is not set.
const appName = process.env.APP_NAME ?? 'families';

// https://vite.dev/config/
export default defineConfig({
    root: `src/apps/${appName}`,
    publicDir: fileURLToPath(new URL('./public', import.meta.url)),
    plugins: [vue(), vueDevTools(), UnoCSS(), oxlint({configFile: '.oxlintrc.json'})],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
            '@app': fileURLToPath(new URL(`./src/apps/${appName}`, import.meta.url)),
        },
    },
    build: {outDir: fileURLToPath(new URL(`./dist/${appName}`, import.meta.url)), emptyOutDir: true},
});
