import {execFileSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';

// Regression coverage for the raw-Vue-Router bans in scripts/lint-vue-conventions.mjs (checks 6b + 6c),
// added to close sweep finding G-arch-1: the showcase app routed through createRouter/createWebHistory and
// raw <RouterView>/<RouterLink> while every existing gate stayed green. The linter accepts explicit file-path
// arguments (process.argv.slice(2)), so we drive it against fixtures whose on-disk path contains "src/apps/"
// (the path slice the app-scoped checks key on) and assert it fires on raw usage but passes on RouterService usage.

const SCRIPT_DIR = join(import.meta.dirname, '../../../scripts');
const LINTER = join(SCRIPT_DIR, 'lint-vue-conventions.mjs');

let workDir: string;
let appsDir: string;

const runLinter = (...fixturePaths: string[]): {code: number; output: string} => {
    try {
        const stdout = execFileSync('node', [LINTER, ...fixturePaths], {encoding: 'utf-8'});
        return {code: 0, output: stdout};
    } catch (error) {
        const execError = error as {status?: number; stdout?: string; stderr?: string};
        return {code: execError.status ?? 1, output: `${execError.stdout ?? ''}${execError.stderr ?? ''}`};
    }
};

const writeFixture = (relativePath: string, contents: string): string => {
    const fullPath = join(appsDir, relativePath);
    mkdirSync(join(fullPath, '..'), {recursive: true});
    writeFileSync(fullPath, contents);
    // Return the absolute path: readFileSync needs the real on-disk location, and the path still
    // contains "src/apps/" (appsDir ends in src/apps) — the slice the app-scoped checks key on.
    return fullPath;
};

beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), 'lint-vue-conventions-'));
    appsDir = join(workDir, 'src/apps');
    mkdirSync(appsDir, {recursive: true});
});

afterAll(() => {
    rmSync(workDir, {recursive: true, force: true});
});

describe('lint-vue-conventions raw Vue Router bans (ADR-0003)', () => {
    it('should flag a raw createRouter/createWebHistory import in an app router file', () => {
        // Arrange
        const fixture = writeFixture(
            'showcase/router/index.ts',
            [
                "import type {RouteRecordRaw} from 'vue-router';",
                "import {createRouter, createWebHistory} from 'vue-router';",
                '',
                'const routes = [] as const satisfies readonly RouteRecordRaw[];',
                'export const router = createRouter({history: createWebHistory(), routes: [...routes]});',
                '',
            ].join('\n'),
        );

        // Act
        const {code, output} = runLinter(fixture);

        // Assert
        expect(code).toBe(1);
        expect(output).toContain('"createRouter" must not be imported directly');
        expect(output).toContain('"createWebHistory" must not be imported directly');
    });

    it('should flag raw <RouterView>/<RouterLink> in an app template', () => {
        // Arrange
        const fixture = writeFixture(
            'showcase/RawApp.vue',
            [
                '<script setup lang="ts">',
                "import {RouterLink, RouterView} from 'vue-router';",
                '</script>',
                '',
                '<template>',
                '    <RouterLink :to="{name: \'showcase\'}">Showcase</RouterLink>',
                '    <RouterView />',
                '</template>',
                '',
            ].join('\n'),
        );

        // Act
        const {code, output} = runLinter(fixture);

        // Assert
        expect(code).toBe(1);
        expect(output).toContain('Raw <RouterView>/<RouterLink>');
        expect(output).toContain('"RouterLink" must not be imported directly');
        expect(output).toContain('"RouterView" must not be imported directly');
    });

    it('should pass a router file that uses createRouterService()', () => {
        // Arrange
        const fixture = writeFixture(
            'showcase/router/compliant.ts',
            [
                "import type {RouteRecordRaw} from 'vue-router';",
                '',
                "import {createRouterService} from '@script-development/fs-router';",
                '',
                'const routes = [] as const satisfies readonly RouteRecordRaw[];',
                'export const showcaseRouterService = createRouterService([...routes]);',
                '',
            ].join('\n'),
        );

        // Act
        const {code, output} = runLinter(fixture);

        // Assert
        expect(code).toBe(0);
        expect(output).toContain('All conventions passed.');
    });

    it('should pass an app template that uses the RouterService-sanctioned components', () => {
        // Arrange
        const fixture = writeFixture(
            'showcase/CompliantApp.vue',
            [
                '<script setup lang="ts">',
                "import {ShowcaseRouterLink, ShowcaseRouterView} from './router';",
                '</script>',
                '',
                '<template>',
                '    <ShowcaseRouterLink :to="{name: \'showcase\'}">Showcase</ShowcaseRouterLink>',
                '    <ShowcaseRouterView />',
                '</template>',
                '',
            ].join('\n'),
        );

        // Act
        const {code, output} = runLinter(fixture);

        // Assert
        expect(code).toBe(0);
        expect(output).toContain('All conventions passed.');
    });
});
