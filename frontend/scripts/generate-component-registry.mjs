#!/usr/bin/env node

/**
 * Component Health Registry Generator (ADR-009)
 *
 * Generates five metrics for each shared component:
 * 1. Consumer map — which files import each component, grouped by app and domain
 * 2. Adoption breadth — how many apps and domains use each component
 * 3. API surface — props, emits, slots, and models
 * 4. Churn — commits and lines changed in a 30-day rolling window
 * 5. Dependency depth — nesting level in the shared component tree
 *
 * Usage:
 *   node scripts/generate-component-registry.mjs           # Generate registry
 *   node scripts/generate-component-registry.mjs --check   # Check if registry is stale
 */

import {execSync} from 'node:child_process';
import {existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {basename, dirname, join, relative, resolve} from 'node:path';

const ROOT = process.cwd();
const SHARED_COMPONENTS_DIR = join(ROOT, 'src/shared/components');
const OUTPUT_PATH = join(ROOT, 'src/shared/generated/component-registry.json');
const CHECK_MODE = process.argv.includes('--check');
const CHURN_WINDOW_DAYS = 30;

// ── File Discovery ──────────────────────────────────────────────────

const findFiles = (dir, extensions) => {
    const files = [];
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
            if (entry !== 'node_modules' && entry !== 'dist' && entry !== 'coverage') {
                files.push(...findFiles(path, extensions));
            }
        } else if (extensions.some((ext) => entry.endsWith(ext))) {
            files.push(path);
        }
    }
    return files;
};

const discoverComponents = () =>
    findFiles(SHARED_COMPONENTS_DIR, ['.vue'])
        .map((absolutePath) => {
            const relativePath = relative(ROOT, absolutePath);
            const name = basename(absolutePath, '.vue');
            const subdir = relative(SHARED_COMPONENTS_DIR, dirname(absolutePath));
            return {name, absolutePath, relativePath, category: subdir || null};
        })
        .sort((a, b) => a.name.localeCompare(b.name));

const discoverSourceFiles = () => {
    const srcDir = join(ROOT, 'src');
    return findFiles(srcDir, ['.vue', '.ts'])
        .filter((abs) => !abs.includes('/tests/'))
        .map((absolutePath) => ({absolutePath, relativePath: relative(ROOT, absolutePath)}));
};

// ── Import Resolution ───────────────────────────────────────────────

const IMPORT_FROM_REGEX = /\bfrom\s+["']([^"']+)["']/g;

const extractImports = (filePath) => {
    const content = readFileSync(filePath, 'utf-8');
    const imports = [];
    let match;
    while ((match = IMPORT_FROM_REGEX.exec(content)) !== null) {
        imports.push(match[1]);
    }
    IMPORT_FROM_REGEX.lastIndex = 0;
    return imports;
};

const resolveToComponent = (importPath, components, importerRelativePath) => {
    if (importPath.startsWith('@shared/components/')) {
        const resolved = importPath.replace('@shared/', 'src/shared/');
        return components.find((c) => c.relativePath === resolved);
    }
    if (importPath.startsWith('.') && importerRelativePath) {
        const importerDir = dirname(importerRelativePath);
        const resolved = relative(ROOT, resolve(ROOT, importerDir, importPath));
        return components.find((c) => c.relativePath === resolved);
    }
    return null;
};

// ── File Classification ─────────────────────────────────────────────

const classifyFile = (relativePath) => {
    const appMatch = relativePath.match(/^src\/apps\/([^/]+)/);
    if (appMatch) {
        const domainMatch = relativePath.match(/^src\/apps\/[^/]+\/domains\/([^/]+)/);
        return {app: appMatch[1], domain: domainMatch ? domainMatch[1] : null};
    }
    if (relativePath.startsWith('src/shared/')) {
        return {app: 'shared', domain: null};
    }
    return {app: null, domain: null};
};

// ── Metric 1: Consumer Map ──────────────────────────────────────────

const buildConsumerMap = (components, sourceFiles) => {
    const result = {};
    for (const comp of components) {
        result[comp.name] = {};
    }

    for (const file of sourceFiles) {
        const imports = extractImports(file.absolutePath);
        for (const imp of imports) {
            const comp = resolveToComponent(imp, components, file.relativePath);
            if (!comp) continue;
            if (comp.relativePath === file.relativePath) continue;

            const {app, domain} = classifyFile(file.relativePath);
            if (!app) continue;

            const consumers = result[comp.name];
            if (!consumers[app]) consumers[app] = {};
            const key = domain || '_root';
            if (!consumers[app][key]) consumers[app][key] = [];
            if (!consumers[app][key].includes(file.relativePath)) {
                consumers[app][key].push(file.relativePath);
            }
        }
    }

    // Sort for deterministic output
    for (const compConsumers of Object.values(result)) {
        for (const appConsumers of Object.values(compConsumers)) {
            for (const key of Object.keys(appConsumers)) {
                appConsumers[key].sort();
            }
        }
    }

    return result;
};

// ── Metric 2: Adoption Breadth ──────────────────────────────────────

const calculateAdoption = (consumers) => {
    const apps = Object.keys(consumers).filter((a) => a !== 'shared');
    let domainCount = 0;
    for (const [app, appConsumers] of Object.entries(consumers)) {
        if (app === 'shared') continue;
        for (const key of Object.keys(appConsumers)) {
            if (key !== '_root') domainCount++;
        }
    }
    return {apps: apps.length, domains: domainCount};
};

// ── Metric 3: API Surface ───────────────────────────────────────────

const parseProps = (content) => {
    const match = content.match(/defineProps<\{([\s\S]*?)\}>\s*\(/);
    if (!match) return [];

    const body = match[1];
    const props = [];
    const propRegex = /(\w+)(\?)?:/g;
    let m;
    while ((m = propRegex.exec(body)) !== null) {
        props.push({name: m[1], required: !m[2]});
    }
    return props;
};

const parseEmits = (content) => {
    const match = content.match(/defineEmits<\{([\s\S]*?)\}>\s*\(/);
    if (!match) return [];

    const body = match[1];
    const emits = [];
    const emitRegex = /(\w+)\s*:\s*\[/g;
    let m;
    while ((m = emitRegex.exec(body)) !== null) {
        emits.push({name: m[1]});
    }
    return emits;
};

const parseModels = (content) => {
    const models = [];
    const modelRegex = /defineModel<[^>]+>\(\s*(?:"([^"]+)"[,\s]*)?(?:\{([^}]*)\})?\s*\)/g;
    let m;
    while ((m = modelRegex.exec(content)) !== null) {
        models.push({name: m[1] || 'modelValue', required: (m[2] || '').includes('required')});
    }
    return models;
};

const parseSlots = (content) => {
    const templateMatch = content.match(/<template>([\s\S]*)<\/template>/);
    if (!templateMatch) return [];

    const template = templateMatch[1];
    const slots = [];
    const seen = new Set();
    const slotRegex = /<slot\b([^>]*)\/?>(?!\/)/g;
    let m;
    while ((m = slotRegex.exec(template)) !== null) {
        const attrs = m[1];
        const nameMatch = attrs.match(/name="([^"]*)"/);
        const name = nameMatch ? nameMatch[1] : 'default';
        if (!seen.has(name)) {
            seen.add(name);
            slots.push({name});
        }
    }
    return slots;
};

const parseApiSurface = (absolutePath) => {
    const content = readFileSync(absolutePath, 'utf-8');
    return {
        props: parseProps(content),
        emits: parseEmits(content),
        slots: parseSlots(content),
        models: parseModels(content),
    };
};

// ── Metric 4: Churn ─────────────────────────────────────────────────

const calculateChurnData = (components) => {
    const churnMap = new Map();
    for (const comp of components) {
        churnMap.set(comp.relativePath, {commits: 0, linesChanged: 0});
    }

    try {
        // Use HEAD date for deterministic output given same git state
        const headDate = execSync('git log -1 --format=%aI HEAD', {encoding: 'utf-8'}).trim();
        const sinceDate = new Date(new Date(headDate).getTime() - CHURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const since = sinceDate.toISOString().split('T')[0];

        // Commit counts — use COMMIT marker to delimit per-commit file lists
        const commitLog = execSync(
            `git log --since="${since}" --name-only --pretty=format:"COMMIT" -- "src/shared/components/"`,
            {encoding: 'utf-8'},
        );

        let currentCommitFiles = new Set();
        for (const line of commitLog.split('\n')) {
            if (line.trim() === 'COMMIT') {
                for (const file of currentCommitFiles) {
                    if (churnMap.has(file)) churnMap.get(file).commits++;
                }
                currentCommitFiles = new Set();
            } else if (line.trim()) {
                currentCommitFiles.add(line.trim());
            }
        }
        // Flush last commit
        for (const file of currentCommitFiles) {
            if (churnMap.has(file)) churnMap.get(file).commits++;
        }

        // Line changes
        const numstatLog = execSync(
            `git log --since="${since}" --numstat --pretty=format:"" -- "src/shared/components/"`,
            {encoding: 'utf-8'},
        );

        for (const line of numstatLog.split('\n')) {
            const parts = line.trim().split('\t');
            if (parts.length === 3) {
                const [added, deleted, file] = parts;
                if (churnMap.has(file)) {
                    const a = added === '-' ? 0 : Number.parseInt(added, 10);
                    const d = deleted === '-' ? 0 : Number.parseInt(deleted, 10);
                    churnMap.get(file).linesChanged += a + d;
                }
            }
        }
    } catch {
        // Git unavailable or empty repo — all components get zero churn
    }

    return churnMap;
};

// ── Metric 5: Dependency Depth ──────────────────────────────────────

const buildDependencyGraph = (components) => {
    const graph = new Map();

    for (const comp of components) {
        const imports = extractImports(comp.absolutePath);
        const deps = new Set();

        for (const imp of imports) {
            const dep = resolveToComponent(imp, components, comp.relativePath);
            if (dep && dep.name !== comp.name) {
                deps.add(dep.name);
            }
        }

        graph.set(comp.name, deps);
    }

    return graph;
};

const calculateDepths = (graph) => {
    const depths = new Map();

    const getDepth = (name, visited) => {
        if (depths.has(name)) return depths.get(name);
        if (visited.has(name)) return 0;
        visited.add(name);

        const deps = graph.get(name);
        if (!deps || deps.size === 0) {
            depths.set(name, 0);
            return 0;
        }

        let maxDep = 0;
        for (const dep of deps) {
            maxDep = Math.max(maxDep, getDepth(dep, new Set(visited)));
        }
        const depth = maxDep + 1;
        depths.set(name, depth);
        return depth;
    };

    for (const name of graph.keys()) {
        getDepth(name, new Set());
    }

    return depths;
};

// ── Registry Generation ─────────────────────────────────────────────

const generateRegistry = (components, sourceFiles) => {
    const consumerMap = buildConsumerMap(components, sourceFiles);
    const churnData = calculateChurnData(components);
    const depGraph = buildDependencyGraph(components);
    const depths = calculateDepths(depGraph);

    const registry = {meta: {componentCount: components.length, churnWindowDays: CHURN_WINDOW_DAYS}, components: {}};

    for (const comp of components) {
        const consumers = consumerMap[comp.name];
        registry.components[comp.name] = {
            path: comp.relativePath,
            category: comp.category,
            consumers,
            adoption: calculateAdoption(consumers),
            apiSurface: parseApiSurface(comp.absolutePath),
            churn: churnData.get(comp.relativePath) || {commits: 0, linesChanged: 0},
            dependencyDepth: depths.get(comp.name) || 0,
        };
    }

    return registry;
};

// ── Check Mode ──────────────────────────────────────────────────────

const stripChurn = (registry) => {
    const copy = JSON.parse(JSON.stringify(registry));
    for (const comp of Object.values(copy.components)) {
        delete comp.churn;
    }
    return JSON.stringify(copy);
};

// ── Main ────────────────────────────────────────────────────────────

const start = performance.now();

const components = discoverComponents();
const sourceFiles = discoverSourceFiles();
const registry = generateRegistry(components, sourceFiles);
const json = JSON.stringify(registry, null, 4) + '\n';

const elapsed = (performance.now() - start).toFixed(0);

if (CHECK_MODE) {
    if (!existsSync(OUTPUT_PATH)) {
        console.error('Registry file does not exist. Run `npm run registry` to generate it.');
        process.exit(1);
    }
    const existing = readFileSync(OUTPUT_PATH, 'utf-8');
    const existingRegistry = JSON.parse(existing);

    if (stripChurn(registry) !== stripChurn(existingRegistry)) {
        console.error('Component registry is stale. Run `npm run registry` to regenerate.');
        process.exit(1);
    }
    console.log(`Registry is up to date — ${components.length} components (${elapsed}ms)`);
} else {
    const outputDir = dirname(OUTPUT_PATH);
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, {recursive: true});
    }
    writeFileSync(OUTPUT_PATH, json);
    console.log(`Generated component registry — ${components.length} components (${elapsed}ms)`);
}
