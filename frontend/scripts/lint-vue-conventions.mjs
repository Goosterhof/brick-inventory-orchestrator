import {readdirSync, readFileSync, statSync} from 'node:fs';
import {basename, join} from 'node:path';

const errors = [];
const IGNORED_DIRS = ['node_modules', 'dist', 'coverage'];

const findFiles = (dir, extensions) => {
    const files = [];
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
            if (!IGNORED_DIRS.includes(entry)) {
                files.push(...findFiles(path, extensions));
            }
        } else if (extensions.some((ext) => entry.endsWith(ext))) {
            files.push(path);
        }
    }
    return files;
};

// Accept file paths as arguments (for lint-staged) or scan all source files
const argFiles = process.argv.length > 2 ? process.argv.slice(2) : [];
const vueFiles = argFiles.length > 0 ? argFiles.filter((f) => f.endsWith('.vue')) : findFiles('src', ['.vue']);
const allSourceFiles =
    argFiles.length > 0
        ? argFiles.filter((f) => f.endsWith('.vue') || f.endsWith('.ts'))
        : findFiles('src', ['.vue', '.ts']);

// ── Vue-specific checks ────────────────────────────────────────────────────────

for (const file of vueFiles) {
    const name = basename(file, '.vue');
    const content = readFileSync(file, 'utf-8');

    // Check 1: Multi-word PascalCase component names (App.vue is exempt)
    if (name !== 'App') {
        const words = name.match(/[A-Z][a-z]*/g) || [];
        if (words.length < 2) {
            errors.push(
                `${file}: Component name "${name}" must be multi-word PascalCase (e.g., "UserProfile" not "${name}")`,
            );
        }
    }

    // Check 2: Block order — <script> before <template> before <style>
    const scriptIndex = content.search(/<script/);
    const templateIndex = content.search(/<template/);
    const styleIndex = content.search(/<style/);

    if (scriptIndex !== -1 && templateIndex !== -1 && scriptIndex > templateIndex) {
        errors.push(`${file}: <script> block must come before <template>`);
    }
    if (templateIndex !== -1 && styleIndex !== -1 && templateIndex > styleIndex) {
        errors.push(`${file}: <template> block must come before <style>`);
    }
    if (scriptIndex !== -1 && styleIndex !== -1 && scriptIndex > styleIndex) {
        errors.push(`${file}: <script> block must come before <style>`);
    }

    // Check 3: No defineExpose — use props/emits for parent-child communication
    if (content.includes('defineExpose')) {
        errors.push(`${file}: defineExpose is forbidden. Use props and emits for parent-child communication instead.`);
    }

    // Check 4: No unscoped <style> blocks — only <style scoped> allowed for third-party overrides (ADR-003)
    if (styleIndex !== -1) {
        const hasUnscopedStyle = /<style(?![^>]*\bscoped\b)[^>]*>/.test(content);
        if (hasUnscopedStyle) {
            errors.push(
                `${file}: Unscoped <style> blocks are forbidden (ADR-003). Use UnoCSS attributify for styling. If overriding third-party CSS, use <style scoped> instead.`,
            );
        }
    }

    // Check 5: Define-macros order — defineProps before defineEmits before defineSlots
    const propsIndex = content.indexOf('defineProps');
    const emitsIndex = content.indexOf('defineEmits');
    const slotsIndex = content.indexOf('defineSlots');

    if (propsIndex !== -1 && emitsIndex !== -1 && propsIndex > emitsIndex) {
        errors.push(`${file}: defineProps must come before defineEmits`);
    }
    if (emitsIndex !== -1 && slotsIndex !== -1 && emitsIndex > slotsIndex) {
        errors.push(`${file}: defineEmits must come before defineSlots`);
    }
    if (propsIndex !== -1 && slotsIndex !== -1 && propsIndex > slotsIndex) {
        errors.push(`${file}: defineProps must come before defineSlots`);
    }

    // Check 6: No <RouterLink> or <router-link> in shared components (ADR-001)
    // The oxlint import ban catches JS imports, but globally registered components can be used without import
    if (file.startsWith('src/shared/') || file.includes('/shared/')) {
        const templateMatch = content.match(/<template[\s\S]*$/);
        if (templateMatch) {
            const template = templateMatch[0];
            if (/<RouterLink[\s/>]/.test(template) || /<router-link[\s/>]/.test(template)) {
                errors.push(
                    `${file}: <RouterLink>/<router-link> is forbidden in shared components (ADR-001). Use <a> tags with click emits instead.`,
                );
            }
        }
    }

    // Check 6b: No raw <RouterView>/<RouterLink> (or kebab) in app templates (ADR-0003)
    // Apps must route through createRouterService()'s typed components (e.g. <FamilyRouterView>,
    // <ShowcaseRouterLink>), never the globally-registered vue-router primitives. The word boundary
    // in the regex ensures sanctioned wrappers like <ShowcaseRouterView> do not match.
    if (file.includes('src/apps/')) {
        const templateMatch = content.match(/<template[\s\S]*$/);
        if (templateMatch) {
            const template = templateMatch[0];
            const rawRouterTag = /(?<![A-Za-z])<(?:RouterView|RouterLink|router-view|router-link)[\s/>]/;
            if (rawRouterTag.test(template)) {
                errors.push(
                    `${file}: Raw <RouterView>/<RouterLink> (or kebab-case) is forbidden in apps (ADR-0003). Use the components returned by createRouterService() (e.g. <FamilyRouterView>, <ShowcaseRouterLink>) instead.`,
                );
            }
        }
    }
}

// Check 6c: No raw vue-router primitive imports in apps (ADR-0003)
// createRouter / createWebHistory / createWebHashHistory / RouterView / RouterLink must come from
// createRouterService(), not directly from 'vue-router'. Value imports only — `import type` is allowed
// (e.g. `import type {RouteRecordRaw} from 'vue-router'`), as type-only names never produce runtime routing.
const RAW_ROUTER_PRIMITIVES = ['createRouter', 'createWebHistory', 'createWebHashHistory', 'RouterView', 'RouterLink'];

for (const file of allSourceFiles) {
    if (!file.includes('src/apps/')) {
        continue;
    }

    const content = readFileSync(file, 'utf-8');
    // Match value imports from 'vue-router': `import {...} from 'vue-router'`, excluding `import type {...}`.
    const importRegex = /import\s+(?!type\s)({[^}]*})\s+from\s+['"]vue-router['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        // Strip inline `type` specifiers (e.g. `{type RouteRecordRaw, createRouter}`) before checking names.
        const named = match[1]
            .replace(/[{}]/g, '')
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && !s.startsWith('type '))
            .map((s) => s.split(/\s+as\s+/)[0].trim());

        const offending = named.filter((name) => RAW_ROUTER_PRIMITIVES.includes(name));
        for (const name of offending) {
            errors.push(
                `${file}: "${name}" must not be imported directly from 'vue-router' in apps (ADR-0003). Use createRouterService() from '@script-development/fs-router' instead.`,
            );
        }
    }
}

// ── Cross-file checks (all .vue and .ts files) ─────────────────────────────────

// Check 7: No coverage ignore comments (ADR-005)
// istanbul ignore, v8 ignore, c8 ignore are all banned — every line must be tested or removed
const COVERAGE_IGNORE_PATTERN = /\/\*\s*(istanbul|v8|c8)\s+ignore\b/;

for (const file of allSourceFiles) {
    // Skip test files — they aren't subject to coverage ignore bans
    if (file.includes('/tests/') || file.endsWith('.spec.ts')) {
        continue;
    }

    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        if (COVERAGE_IGNORE_PATTERN.test(lines[i])) {
            errors.push(
                `${file}:${i + 1}: Coverage ignore comments are forbidden (ADR-005). Restructure the code to be testable instead.`,
            );
        }
    }
}

// Check 8: No singleton exports in shared services (ADR-002)
// Shared services must export factory functions, not pre-instantiated instances.
// Detects: export const x = createSomething(...), export const x = new Something(), export default new Something()
const SINGLETON_CALL_PATTERN = /^export\s+(?:const|let|var)\s+\w+\s*=\s*(?:new\s+\w|create\w*\()/;
const EXPORT_DEFAULT_INSTANCE_PATTERN = /^export\s+default\s+(?:new\s+\w|create\w*\()/;

for (const file of allSourceFiles) {
    if (!file.includes('shared/services/')) {
        continue;
    }
    // Skip type declaration files
    if (file.endsWith('.d.ts')) {
        continue;
    }

    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (SINGLETON_CALL_PATTERN.test(line)) {
            errors.push(
                `${file}:${i + 1}: Shared services must not export pre-instantiated instances (ADR-002). Export a factory function and let each app call it.`,
            );
        }
        if (EXPORT_DEFAULT_INSTANCE_PATTERN.test(line)) {
            errors.push(
                `${file}:${i + 1}: Shared services must not export pre-instantiated instances (ADR-002). Export a factory function and let each app call it.`,
            );
        }
    }
}

// Check 9: vi.mock() must include a factory function (ADR-010)
// Without a factory, vi.mock() still triggers a full module load during test collection.
// Only vi.mock("module", () => ({...})) avoids the import chain entirely.
const VI_MOCK_WITHOUT_FACTORY = /vi\.mock\(\s*["'][^"']+["']\s*\)/;

const specFiles =
    argFiles.length > 0 ? argFiles.filter((f) => f.endsWith('.spec.ts')) : findFiles('src/tests', ['.spec.ts']);

for (const file of specFiles) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        if (VI_MOCK_WITHOUT_FACTORY.test(lines[i])) {
            errors.push(
                `${file}:${i + 1}: vi.mock() must include a factory function as the second argument (ADR-010). Use vi.mock("module", () => ({...})) instead of vi.mock("module").`,
            );
        }
    }
}

// ── Report ──────────────────────────────────────────────────────────────────────

if (errors.length > 0) {
    console.error('Convention violations found:\n');
    for (const error of errors) {
        console.error(`  ${error}`);
    }
    console.error(`\n${errors.length} violation(s) found.`);
    process.exit(1);
} else {
    console.log('All conventions passed.');
}
