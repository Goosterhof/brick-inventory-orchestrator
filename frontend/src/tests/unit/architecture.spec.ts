import {readdirSync, readFileSync} from 'node:fs';
import {basename, dirname, join, relative, resolve, sep} from 'node:path';
import {describe, expect, it} from 'vitest';

const CURRENT_DIR = import.meta.dirname;
const SRC_DIR = join(CURRENT_DIR, '../..');
const ROOT_DIR = join(SRC_DIR, '..');
const SHARED_DIR = join(SRC_DIR, 'shared');
const APPS_DIR = join(SRC_DIR, 'apps');

const getSourceFiles = (dir: string): string[] => {
    return readdirSync(dir, {recursive: true, encoding: 'utf-8'})
        .filter((file) => file.endsWith('.ts') || file.endsWith('.vue'))
        .map((file) => join(dir, file));
};

const getImportPaths = (filePath: string): string[] => {
    const content = readFileSync(filePath, 'utf-8');
    const paths: string[] = [];

    const fromRegex = /\bfrom\s+["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = fromRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath !== undefined) {
            paths.push(importPath);
        }
    }

    const sideEffectRegex = /^\s*import\s+["']([^"']+)["']\s*;?\s*$/gm;
    while ((match = sideEffectRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath !== undefined) {
            paths.push(importPath);
        }
    }

    return paths;
};

const getVueFiles = (dir: string): string[] => {
    return readdirSync(dir, {recursive: true, encoding: 'utf-8'})
        .filter((file) => file.endsWith('.vue'))
        .map((file) => join(dir, file));
};

const getTsFiles = (dir: string): string[] => {
    return readdirSync(dir, {recursive: true, encoding: 'utf-8'})
        .filter((file) => file.endsWith('.ts'))
        .map((file) => join(dir, file));
};

const getAppNames = (): string[] => {
    return readdirSync(APPS_DIR, {withFileTypes: true})
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
};

const dirExists = (dir: string): boolean => {
    try {
        readdirSync(dir);
        return true;
    } catch {
        return false;
    }
};

describe('Architecture', () => {
    describe('shared code must not import from app code', () => {
        it('should not contain imports from @app/ or app directories', () => {
            const sharedFiles = getSourceFiles(SHARED_DIR);
            const violations: string[] = [];

            for (const file of sharedFiles) {
                const imports = getImportPaths(file);
                const appImports = imports.filter((imp) => imp.startsWith('@app/') || imp.includes('/apps/'));

                if (appImports.length > 0) {
                    const rel = relative(SRC_DIR, file);
                    violations.push(`${rel} imports: ${appImports.join(', ')}`);
                }
            }

            expect(violations, 'Shared code must not depend on app-specific code').toStrictEqual([]);
        });
    });

    describe('apps must not import from other apps', () => {
        const appNames = getAppNames();

        for (const appName of appNames) {
            it(`${appName} should not import from other apps`, () => {
                const appDir = join(APPS_DIR, appName);
                const appFiles = getSourceFiles(appDir);
                const otherApps = appNames.filter((name) => name !== appName);
                const violations: string[] = [];

                for (const file of appFiles) {
                    const imports = getImportPaths(file);

                    for (const imp of imports) {
                        const hasDirectRef = otherApps.some((other) => imp.includes(`/apps/${other}`));

                        let resolvesToOtherApp = false;
                        if (imp.startsWith('.')) {
                            const resolved = resolve(dirname(file), imp);
                            resolvesToOtherApp = otherApps.some((other) => resolved.startsWith(join(APPS_DIR, other)));
                        }

                        if (hasDirectRef || resolvesToOtherApp) {
                            const rel = relative(SRC_DIR, file);
                            violations.push(`${rel} imports: ${imp}`);
                        }
                    }
                }

                expect(violations, `The ${appName} app must not import from other apps`).toStrictEqual([]);
            });
        }
    });

    describe('component naming conventions', () => {
        it('should use multi-word PascalCase names for shared components', () => {
            const vueFiles = getVueFiles(join(SRC_DIR, 'shared/components'));
            const violations: string[] = [];

            for (const file of vueFiles) {
                const name = basename(file, '.vue');
                const uppercaseCount = (name.match(/[A-Z]/g) ?? []).length;
                const isMultiWordPascalCase = uppercaseCount >= 2 && /^[A-Z][a-zA-Z]+$/.test(name);

                if (!isMultiWordPascalCase) {
                    violations.push(basename(file));
                }
            }

            expect(
                violations,
                'Shared components must use multi-word PascalCase names (e.g., FormLabel, TextInput)',
            ).toStrictEqual([]);
        });

        it('should use PascalCase names ending with Page for domain pages', () => {
            const appNames = getAppNames();
            const violations: string[] = [];

            for (const appName of appNames) {
                const domainsDir = join(APPS_DIR, appName, 'domains');
                if (!dirExists(domainsDir)) continue;

                const vueFiles = getVueFiles(domainsDir);
                for (const file of vueFiles) {
                    const isInPagesDir = file.includes(`${sep}pages${sep}`);
                    if (!isInPagesDir) continue;

                    const name = basename(file, '.vue');
                    const isValidPage = /^[A-Z][a-zA-Z]+Page$/.test(name);

                    if (!isValidPage) {
                        violations.push(`${appName}/${basename(file)}`);
                    }
                }
            }

            expect(
                violations,
                'Page components must be PascalCase ending with Page (e.g., HomePage, LoginPage)',
            ).toStrictEqual([]);
        });
    });

    describe('composable naming conventions', () => {
        it("should prefix composable filenames with 'use'", () => {
            const composablesDir = join(SHARED_DIR, 'composables');
            if (!dirExists(composablesDir)) return;

            const tsFiles = getTsFiles(composablesDir);
            const violations: string[] = [];

            for (const file of tsFiles) {
                const name = basename(file, '.ts');
                if (name === 'index') continue;

                if (!name.startsWith('use')) {
                    violations.push(basename(file));
                }
            }

            expect(
                violations,
                "Composable files must be prefixed with 'use' (e.g., useValidationErrors.ts)",
            ).toStrictEqual([]);
        });

        it("should export a function named with the 'use' prefix", () => {
            const composablesDir = join(SHARED_DIR, 'composables');
            if (!dirExists(composablesDir)) return;

            const tsFiles = getTsFiles(composablesDir);
            const violations: string[] = [];

            for (const file of tsFiles) {
                const name = basename(file, '.ts');
                if (name === 'index') continue;

                const content = readFileSync(file, 'utf-8');
                const hasUseExport = /export\s+(const|function)\s+use[A-Z]/.test(content);

                if (!hasUseExport) {
                    violations.push(`${basename(file)} does not export a use* function`);
                }
            }

            expect(
                violations,
                "Composable files must export a function prefixed with 'use' (e.g., export const useAuth = ...)",
            ).toStrictEqual([]);
        });
    });

    describe('app services must re-export through barrel file', () => {
        const appNames = getAppNames();

        for (const appName of appNames) {
            it(`${appName} services directory should have an index.ts barrel file`, () => {
                const servicesDir = join(APPS_DIR, appName, 'services');
                if (!dirExists(servicesDir)) return;

                const files = readdirSync(servicesDir, {encoding: 'utf-8'});
                expect(files, `${appName}/services/ must have an index.ts barrel file`).toContain('index.ts');
            });
        }
    });

    describe('domains must not import from deep app service paths', () => {
        const appNames = getAppNames();

        for (const appName of appNames) {
            it(`${appName} domains should import from @app/services, not @app/services/*`, () => {
                const domainsDir = join(APPS_DIR, appName, 'domains');
                if (!dirExists(domainsDir)) return;

                const domainFiles = getSourceFiles(domainsDir);
                const violations: string[] = [];

                for (const file of domainFiles) {
                    const imports = getImportPaths(file);

                    for (const imp of imports) {
                        if (/^@app\/services\/.+/.test(imp)) {
                            const rel = relative(SRC_DIR, file);
                            violations.push(`${rel} imports: ${imp} (use @app/services barrel instead)`);
                        }

                        if (imp.startsWith('.') && imp.includes('/services/') && !imp.endsWith('/services')) {
                            const resolved = resolve(dirname(file), imp);
                            const servicesDir = join(APPS_DIR, appName, 'services');
                            if (resolved.startsWith(servicesDir) && resolved !== join(servicesDir, 'index')) {
                                const rel = relative(SRC_DIR, file);
                                violations.push(`${rel} imports: ${imp} (use @app/services barrel instead)`);
                            }
                        }
                    }
                }

                expect(
                    violations,
                    `Domains in ${appName} must import from @app/services (barrel), not individual service files`,
                ).toStrictEqual([]);
            });
        }
    });

    describe('domain isolation — domains must not import from other domains', () => {
        const appNames = getAppNames();

        for (const appName of appNames) {
            it(`${appName} domains should not import from other domains`, () => {
                const domainsDir = join(APPS_DIR, appName, 'domains');
                if (!dirExists(domainsDir)) return;

                const domainNames = readdirSync(domainsDir, {withFileTypes: true})
                    .filter((entry) => entry.isDirectory())
                    .map((entry) => entry.name);

                const violations: string[] = [];

                for (const domainName of domainNames) {
                    const domainDir = join(domainsDir, domainName);
                    const domainFiles = getSourceFiles(domainDir);
                    const otherDomains = domainNames.filter((name) => name !== domainName);

                    for (const file of domainFiles) {
                        const imports = getImportPaths(file);
                        const rel = relative(SRC_DIR, file);

                        for (const imp of imports) {
                            const importsOtherDomain = otherDomains.some(
                                (other) => imp.startsWith(`@app/domains/${other}`) || imp.includes(`/domains/${other}`),
                            );

                            if (importsOtherDomain) {
                                violations.push(`${rel} imports: ${imp}`);
                                continue;
                            }

                            if (!imp.startsWith('.')) continue;

                            const resolved = resolve(dirname(file), imp);
                            const crossesDomain = otherDomains.some((other) =>
                                resolved.startsWith(join(domainsDir, other)),
                            );
                            if (crossesDomain) {
                                violations.push(`${rel} imports: ${imp}`);
                            }
                        }
                    }
                }

                expect(
                    violations,
                    `Domains in ${appName} must not import from other domains. Use @shared/ for shared code.`,
                ).toStrictEqual([]);
            });
        }
    });

    describe('domain index files must only export routes', () => {
        const appNames = getAppNames();

        for (const appName of appNames) {
            it(`${appName} domain index files should only export routes`, () => {
                const domainsDir = join(APPS_DIR, appName, 'domains');
                if (!dirExists(domainsDir)) return;

                const domainNames = readdirSync(domainsDir, {withFileTypes: true})
                    .filter((entry) => entry.isDirectory())
                    .map((entry) => entry.name);

                const violations: string[] = [];

                for (const domainName of domainNames) {
                    const indexFile = join(domainsDir, domainName, 'index.ts');
                    try {
                        const content = readFileSync(indexFile, 'utf-8');
                        const lines = content.split('\n');

                        for (const line of lines) {
                            const trimmed = line.trim();
                            const isNonTypeExport = trimmed.startsWith('export') && !trimmed.startsWith('export type');

                            if (isNonTypeExport && !trimmed.startsWith('export const routes')) {
                                violations.push(
                                    `${appName}/domains/${domainName}/index.ts has non-routes export: ${trimmed}`,
                                );
                            }
                        }
                    } catch {
                        violations.push(`${appName}/domains/${domainName}/ is missing index.ts`);
                    }
                }

                expect(violations, `Domain index files in ${appName} must only export routes`).toStrictEqual([]);
            });
        }
    });

    describe('each domain must have an index.ts file', () => {
        const appNames = getAppNames();

        for (const appName of appNames) {
            it(`${appName} domain directories should each have an index.ts`, () => {
                const domainsDir = join(APPS_DIR, appName, 'domains');
                if (!dirExists(domainsDir)) return;

                const domainNames = readdirSync(domainsDir, {withFileTypes: true})
                    .filter((entry) => entry.isDirectory())
                    .map((entry) => entry.name);

                const violations: string[] = [];

                for (const domainName of domainNames) {
                    const domainDir = join(domainsDir, domainName);
                    const files = readdirSync(domainDir, {encoding: 'utf-8'});
                    if (!files.includes('index.ts')) {
                        violations.push(`${appName}/domains/${domainName}/ is missing index.ts`);
                    }
                }

                expect(violations, `Every domain in ${appName} must have an index.ts barrel file`).toStrictEqual([]);
            });
        }
    });

    describe('shared services must be factories, not singletons', () => {
        it('shared services should export functions, not pre-instantiated objects', () => {
            const servicesDir = join(SHARED_DIR, 'services');
            if (!dirExists(servicesDir)) return;

            const tsFiles = getTsFiles(servicesDir);
            const violations: string[] = [];

            for (const file of tsFiles) {
                const name = basename(file, '.ts');
                if (name === 'index') continue;

                const content = readFileSync(file, 'utf-8');

                // Shared services should export factory functions (create*) or types, not instances
                // Check for suspicious top-level instantiation patterns
                const hasTopLevelInstance =
                    /^export\s+const\s+\w+\s*=\s*new\s+/m.test(content) ||
                    /^export\s+const\s+\w+\s*=\s*axios\.create/m.test(content);

                if (hasTopLevelInstance) {
                    violations.push(`${basename(file)} exports a pre-instantiated object (should export a factory)`);
                }
            }

            expect(
                violations,
                'Shared services should export factory functions (e.g., createHttpService), not singletons',
            ).toStrictEqual([]);
        });
    });

    describe('test file structure', () => {
        it('test files should use .spec.ts extension', () => {
            const testsDir = join(SRC_DIR, 'tests');
            if (!dirExists(testsDir)) return;

            const allFiles = readdirSync(testsDir, {recursive: true, encoding: 'utf-8'}).filter(
                (file) => file.endsWith('.ts') && !file.endsWith('.d.ts'),
            );

            const testFiles = allFiles.filter(
                (file) =>
                    !file.endsWith('setup.ts') &&
                    !file.endsWith('-reporter.ts') &&
                    !file.includes('helpers/') &&
                    !file.includes('stubs/'),
            );
            const violations: string[] = [];

            for (const file of testFiles) {
                if (!file.endsWith('.spec.ts')) {
                    violations.push(file);
                }
            }

            expect(violations, 'Test files must use .spec.ts extension').toStrictEqual([]);
        });
    });

    describe('accessibility — outline removal must have focus-visible replacement', () => {
        it('should not have outline=none without a paired focus-visible:brick-focus on the same element', () => {
            const vueFiles = getVueFiles(SRC_DIR);
            const violations: string[] = [];

            for (const file of vueFiles) {
                const content = readFileSync(file, 'utf-8');

                // Extract opening tags (potentially multi-line) that contain outline="none"
                // Match from < to > across lines, capturing tags with outline="none"
                const tagRegex = /<[a-zA-Z][^>]*outline="none"[^>]*>/gs;
                let match: RegExpExecArray | null;

                while ((match = tagRegex.exec(content)) !== null) {
                    const tag = match[0];
                    if (!tag.includes('focus-visible')) {
                        const lineNum = content.slice(0, match.index).split('\n').length;
                        const rel = relative(SRC_DIR, file);
                        violations.push(`${rel}:${lineNum} has outline="none" without focus-visible replacement`);
                    }
                }
            }

            expect(
                violations,
                'Every outline="none" must be paired with focus-visible:brick-focus on the same element (WCAG 2.4.7)',
            ).toStrictEqual([]);
        });
    });

    describe('domain map completeness — every domain directory must be documented', () => {
        it('every domain directory should have a corresponding entry in domain-map.md', () => {
            // domain-map.md moved to the orchestrator root during Phase 6 of the Brickworks merger
            const domainMap = readFileSync(join(ROOT_DIR, '..', '.claude/docs/domain-map.md'), 'utf-8');
            const appNames = getAppNames();
            const violations: string[] = [];

            for (const appName of appNames) {
                const domainsDir = join(APPS_DIR, appName, 'domains');
                if (!dirExists(domainsDir)) continue;

                const domainNames = readdirSync(domainsDir, {withFileTypes: true})
                    .filter((entry) => entry.isDirectory())
                    .map((entry) => entry.name);

                for (const domainName of domainNames) {
                    const hasTableEntry = new RegExp(`\\|\\s*\\*\\*${domainName}\\*\\*\\s*\\|`).test(domainMap);
                    if (!hasTableEntry) {
                        violations.push(`${appName}/domains/${domainName} is not documented in domain-map.md`);
                    }
                }
            }

            expect(violations, 'Every domain directory must have a corresponding entry in domain-map.md').toStrictEqual(
                [],
            );
        });
    });

    describe('page integration test coverage — ADR-0024', () => {
        it('every domain page should have a corresponding integration test', () => {
            const integrationDir = join(SRC_DIR, 'tests/integration/apps');
            const appNames = getAppNames();
            const violations: string[] = [];

            for (const appName of appNames) {
                const appIntegrationDir = join(integrationDir, appName);
                if (!dirExists(appIntegrationDir)) continue;

                const domainsDir = join(APPS_DIR, appName, 'domains');
                if (!dirExists(domainsDir)) continue;

                const domainNames = readdirSync(domainsDir, {withFileTypes: true})
                    .filter((entry) => entry.isDirectory())
                    .map((entry) => entry.name);

                for (const domainName of domainNames) {
                    const pagesDir = join(domainsDir, domainName, 'pages');
                    if (!dirExists(pagesDir)) continue;

                    const pageFiles = readdirSync(pagesDir, {encoding: 'utf-8'}).filter((file) =>
                        file.endsWith('.vue'),
                    );

                    for (const pageFile of pageFiles) {
                        const specName = pageFile.replace('.vue', '.spec.ts');
                        const expectedSpecPath = join(
                            integrationDir,
                            appName,
                            'domains',
                            domainName,
                            'pages',
                            specName,
                        );

                        try {
                            readFileSync(expectedSpecPath);
                        } catch {
                            violations.push(
                                `${appName}/domains/${domainName}/pages/${pageFile} has no integration test at tests/integration/apps/${appName}/domains/${domainName}/pages/${specName}`,
                            );
                        }
                    }
                }
            }

            expect(violations, 'Every domain page must have a corresponding integration test (ADR-0024)').toStrictEqual(
                [],
            );
        });
    });

    // ADR sync — decision log index vs. agent Quick Reference: removed during Phase 5 of the
    // Brickworks merger. The Gallery-Wing decision-log index (frontend/.claude/docs/decisions.md)
    // and the per-wing inspector agent are both retired in this phase; Phase 6 will rebuild the
    // consolidated index at .claude/docs/decisions.md and re-target this check against the
    // Quality Warden agent's ADR Quick Reference.

    describe('dark mode enforcement — no hardcoded light-mode colors in non-showcase Vue files', () => {
        const SHOWCASE_DIR = join(APPS_DIR, 'showcase');
        const ADMIN_DIR = join(APPS_DIR, 'admin');

        /** LEGO brick shape components use hardcoded colors for decorative rendering — they are exempt. */
        const EXEMPT_PATTERNS = [
            /\/Lego[A-Z]\w+\.vue$/, // LegoArch, LegoBrick, LegoTechnicBeam, etc.
            /\/scanner\//, // Camera overlay buttons need fixed contrast on dark background
        ];

        const isExempt = (filePath: string): boolean => EXEMPT_PATTERNS.some((pattern) => pattern.test(filePath));

        /**
         * Matches UnoCSS attributify bg values that are bare Tailwind colors
         * (e.g., bg="white", bg="gray-200") but NOT token-based values
         * (e.g., bg="[var(--brick-card-bg)]"), brand colors, or dynamic bindings.
         */
        const HARDCODED_BG_PATTERN = /\bbg="(?:white|gray-\d{2,3})(?:\s|")/;

        /**
         * Matches UnoCSS attributify text values with bare gray colors
         * (e.g., text="gray-600", text="sm gray-600") but NOT token-based values.
         */
        const HARDCODED_TEXT_GRAY_PATTERN = /\btext="(?:[a-z]+ )?gray-\d{2,3}(?:\s|")/;

        /**
         * Matches class-based bg-white or bg-gray-* utilities.
         */
        const HARDCODED_CLASS_BG_PATTERN = /\bbg-(?:white|gray-\d{2,3})\b/;

        it("should not have hardcoded bg='white' or bg='gray-*' in non-showcase Vue files", () => {
            const vueFiles = getVueFiles(SRC_DIR).filter(
                (file) => !file.startsWith(SHOWCASE_DIR) && !file.startsWith(ADMIN_DIR) && !isExempt(file),
            );
            const violations: string[] = [];

            for (const file of vueFiles) {
                const content = readFileSync(file, 'utf-8');
                const templateMatch = content.match(/<template[\s\S]*$/);
                if (!templateMatch) continue;
                const template = templateMatch[0];

                const lines = template.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line === undefined) continue;

                    if (HARDCODED_BG_PATTERN.test(line) || HARDCODED_CLASS_BG_PATTERN.test(line)) {
                        const rel = relative(SRC_DIR, file);
                        violations.push(`${rel}:${String(i + 1)} has hardcoded background: ${line.trim()}`);
                    }
                }
            }

            expect(
                violations,
                'Use CSS custom property tokens (e.g., bg="[var(--brick-card-bg)]") instead of hardcoded colors like bg="white" or bg="gray-200". See theme.css for available tokens.',
            ).toStrictEqual([]);
        });

        it("should not have hardcoded text='gray-*' in non-showcase Vue files", () => {
            const vueFiles = getVueFiles(SRC_DIR).filter(
                (file) => !file.startsWith(SHOWCASE_DIR) && !file.startsWith(ADMIN_DIR) && !isExempt(file),
            );
            const violations: string[] = [];

            for (const file of vueFiles) {
                const content = readFileSync(file, 'utf-8');
                const templateMatch = content.match(/<template[\s\S]*$/);
                if (!templateMatch) continue;
                const template = templateMatch[0];

                const lines = template.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line === undefined) continue;

                    if (HARDCODED_TEXT_GRAY_PATTERN.test(line)) {
                        const rel = relative(SRC_DIR, file);
                        violations.push(`${rel}:${String(i + 1)} has hardcoded text color: ${line.trim()}`);
                    }
                }
            }

            expect(
                violations,
                'Use CSS custom property tokens (e.g., text="[var(--brick-muted-text)]") instead of hardcoded colors like text="gray-600". See theme.css for available tokens.',
            ).toStrictEqual([]);
        });

        it('should not have hardcoded bg-white in <script> computed classes in non-showcase Vue files', () => {
            const vueFiles = getVueFiles(SRC_DIR).filter(
                (file) => !file.startsWith(SHOWCASE_DIR) && !file.startsWith(ADMIN_DIR) && !isExempt(file),
            );
            const violations: string[] = [];

            for (const file of vueFiles) {
                const content = readFileSync(file, 'utf-8');
                const scriptMatch = content.match(/<script[\s\S]*?<\/script>/);
                if (!scriptMatch) continue;
                const script = scriptMatch[0];

                const lines = script.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line === undefined) continue;

                    if (HARDCODED_CLASS_BG_PATTERN.test(line)) {
                        const rel = relative(SRC_DIR, file);
                        violations.push(`${rel}:${String(i + 1)} has hardcoded bg class in script: ${line.trim()}`);
                    }
                }
            }

            expect(
                violations,
                'Computed class strings must use token-based bg values (e.g., "bg-[var(--brick-card-bg)]") instead of "bg-white" or "bg-gray-*".',
            ).toStrictEqual([]);
        });
    });

    describe('mount boundary enforcement — unit tests use shallowMount, integration tests use mount', () => {
        const TESTS_DIR = join(SRC_DIR, 'tests');

        const getTestSpecFiles = (dir: string): string[] => {
            if (!dirExists(dir)) return [];
            return readdirSync(dir, {recursive: true, encoding: 'utf-8'})
                .filter((file) => file.endsWith('.spec.ts'))
                .map((file) => join(dir, file));
        };

        const getImportedNames = (filePath: string, fromModule: string): string[] => {
            const content = readFileSync(filePath, 'utf-8');
            const names: string[] = [];
            const regex = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*["']${fromModule}["']`, 'g');
            let match: RegExpExecArray | null;
            while ((match = regex.exec(content)) !== null) {
                const imports = match[1];
                if (imports) {
                    for (const name of imports.split(',')) {
                        names.push(name.trim());
                    }
                }
            }
            return names;
        };

        it('unit test files should not import mount from @vue/test-utils', () => {
            const unitDir = join(TESTS_DIR, 'unit');
            const specFiles = getTestSpecFiles(unitDir);
            const violations: string[] = [];

            for (const file of specFiles) {
                const importedNames = getImportedNames(file, '@vue/test-utils');
                if (importedNames.includes('mount')) {
                    violations.push(relative(SRC_DIR, file));
                }
            }

            expect(
                violations,
                'Unit tests must use shallowMount, not mount. Use shallowMount with explicit unstubbing where needed.',
            ).toStrictEqual([]);
        });

        it('integration test files should not import shallowMount from @vue/test-utils', () => {
            const integrationDir = join(TESTS_DIR, 'integration');
            const specFiles = getTestSpecFiles(integrationDir);
            const violations: string[] = [];

            for (const file of specFiles) {
                const importedNames = getImportedNames(file, '@vue/test-utils');
                if (importedNames.includes('shallowMount')) {
                    violations.push(relative(SRC_DIR, file));
                }
            }

            expect(
                violations,
                'Integration tests must use mount, not shallowMount. Integration tests verify component composition.',
            ).toStrictEqual([]);
        });
    });

    describe('SUT-only top-level .vue imports — unit specs may only import their system-under-test', () => {
        const TESTS_DIR = join(SRC_DIR, 'tests');
        const UNIT_DIR = join(TESTS_DIR, 'unit');

        /**
         * Captures `import X from "...Foo.vue"` and `import { X } from "...Foo.vue"`
         * but excludes type-only imports (`import type X from "...Foo.vue"`) — those
         * are erased at compile time and do not contribute to the Vite collect-phase
         * dependency graph that this rule guards.
         */
        const VUE_IMPORT_REGEX = /^\s*import\s+(?!type\b)[^;]+?\s+from\s+["']([^"']+\.vue)["']/gm;

        /**
         * Legacy allowlist — specs that import cross-component `.vue` files at top
         * level today. Each entry is a one-line legacy-debt declaration; the goal
         * is for this map to shrink over time. New specs MUST use
         * `findComponent({ name: 'X' })` + `vi.mock(...)` instead of top-level
         * imports (see PR #119 / Build Record 2026-05-27-partspage-spec-collect-guard-fix
         * for the source pattern).
         *
         * Two categories live here today:
         *  - "Legacy" — predates the SUT-only rule; cross-component imports were
         *    stubbed via `vi.mock` but the static `import` was never removed.
         *    Each one is collect-phase debt and will be paid down in follow-up WOs.
         *  - "Split-spec" — specs split off the same SUT (e.g. `SetsOverviewTheme.spec.ts`
         *    against `SetsOverviewPage.vue`, `SettingsPageConfig.spec.ts` against
         *    `SettingsPage.vue`). Filename does not match the SUT by design; these
         *    entries document the SUT mismatch rather than the cross-component drag.
         *    Spec splits driven by TEST GUARD escapes (e.g. PR #120) generate these.
         *
         * Key = spec path relative to src/tests/unit. Value = list of `.vue`
         * basenames the spec is permitted to import.
         */
        const LEGACY_CROSS_COMPONENT_IMPORTS: Record<string, readonly string[]> = {
            'apps/admin/App.spec.ts': ['NavLink.vue'],
            'apps/families/App.spec.ts': ['NavHeader.vue', 'NavMobileLink.vue'],
            'apps/families/domains/about/pages/AboutPage.spec.ts': [
                'LegoArch.vue',
                'LegoArchSvg.vue',
                'LegoBrick.vue',
                'LegoBrickSvg.vue',
                'LegoPlate.vue',
                'LegoPlateSvg.vue',
                'LegoRound.vue',
                'LegoRoundSvg.vue',
                'LegoSlope.vue',
                'LegoSlopeSvg.vue',
                'LegoTechnicBeam.vue',
                'LegoTechnicBeamSvg.vue',
                'LegoTile.vue',
                'LegoTileSvg.vue',
                'LegoWedge.vue',
                'LegoWedgeSvg.vue',
            ],
            'apps/families/domains/auth/pages/LoginPage.spec.ts': ['PrimaryButton.vue', 'TextInput.vue'],
            'apps/families/domains/auth/pages/RegisterPage.spec.ts': ['PrimaryButton.vue', 'TextInput.vue'],
            'apps/families/domains/brick-dna/pages/BrickDnaPage.spec.ts': [
                'CardContainer.vue',
                'EmptyState.vue',
                'PageHeader.vue',
                'SectionDivider.vue',
                'StatCard.vue',
            ],
            'apps/families/domains/home/pages/HomePage.spec.ts': [
                'CardContainer.vue',
                'LegoBrick.vue',
                'NavLink.vue',
                'PageHeader.vue',
                'StatCard.vue',
                'YearDistributionChart.vue',
            ],
            'apps/families/domains/parts/modals/PartUsageModal.spec.ts': [
                'EmptyState.vue',
                'ListItemButton.vue',
                'ModalDialog.vue',
            ],
            'apps/families/domains/parts/pages/PartsMissingPage.spec.ts': [
                'BackButton.vue',
                'EmptyState.vue',
                'FilterChip.vue',
                'PageHeader.vue',
                'PartListItem.vue',
                'PrimaryButton.vue',
                'TextInput.vue',
            ],
            'apps/families/domains/parts/pages/PartsUnsortedPage.spec.ts': [
                'BackButton.vue',
                'EmptyState.vue',
                'FilterChip.vue',
                'ListItemButton.vue',
                'PageHeader.vue',
                'PartListItem.vue',
                'PlacePartModal.vue',
                'PrimaryButton.vue',
                'TextInput.vue',
            ],
            'apps/families/domains/sets/pages/AddSetPage.spec.ts': [
                'DateInput.vue',
                'NumberInput.vue',
                'PrimaryButton.vue',
                'SelectInput.vue',
                'TextInput.vue',
                'TextareaInput.vue',
            ],
            'apps/families/domains/sets/pages/EditSetPage.spec.ts': [
                'ConfirmDialog.vue',
                'DangerButton.vue',
                'LoadingState.vue',
                'NumberInput.vue',
                'PrimaryButton.vue',
                'SelectInput.vue',
            ],
            'apps/families/domains/sets/pages/IdentifyBrickPage.spec.ts': [
                'BackButton.vue',
                'CameraCapture.vue',
                'PageHeader.vue',
                'PrimaryButton.vue',
            ],
            'apps/families/domains/sets/pages/ScanSetPage.spec.ts': [
                'BackButton.vue',
                'BarcodeScanner.vue',
                'PageHeader.vue',
                'PrimaryButton.vue',
            ],
            'apps/families/domains/sets/pages/SetDetailPage.spec.ts': [
                'BackButton.vue',
                'LoadingState.vue',
                'PartListItem.vue',
                'PlacePartModal.vue',
                'PrimaryButton.vue',
            ],
            // Split-spec: SUT is SetsOverviewPage.vue (filename mismatch is intentional, PR #120).
            'apps/families/domains/sets/pages/SetsOverviewFiltering.spec.ts': ['SetsOverviewPage.vue'],
            // Split-spec: SUT is SetsOverviewPage.vue (filename mismatch is intentional, PR #120).
            'apps/families/domains/sets/pages/SetsOverviewTheme.spec.ts': [
                'CollapsibleSection.vue',
                'EmptyState.vue',
                'FilterChip.vue',
                'SetsOverviewPage.vue',
                'TextInput.vue',
            ],
            // Split-spec: SUT is SettingsPage.vue (filename mismatch is intentional).
            'apps/families/domains/settings/pages/SettingsPageConfig.spec.ts': [
                'PageHeader.vue',
                'PrimaryButton.vue',
                'SettingsPage.vue',
                'TextInput.vue',
            ],
            // Split-spec: SUT is SettingsPage.vue (filename mismatch is intentional).
            'apps/families/domains/settings/pages/SettingsPageInviteEmail.spec.ts': [
                'PrimaryButton.vue',
                'SettingsPage.vue',
                'TextInput.vue',
            ],
            // Split-spec: SUT is SettingsPage.vue (filename mismatch is intentional).
            'apps/families/domains/settings/pages/SettingsPageMembers.spec.ts': [
                'BadgeLabel.vue',
                'ConfirmDialog.vue',
                'DangerButton.vue',
                'PrimaryButton.vue',
                'SettingsPage.vue',
            ],
            // Split-spec: SUT is SettingsPage.vue (filename mismatch is intentional).
            'apps/families/domains/settings/pages/SettingsPageTheme.spec.ts': ['SettingsPage.vue'],
            'apps/families/domains/storage/pages/AddStoragePage.spec.ts': [
                'NumberInput.vue',
                'PrimaryButton.vue',
                'TextInput.vue',
                'TextareaInput.vue',
            ],
            'apps/families/domains/storage/pages/EditStoragePage.spec.ts': [
                'ConfirmDialog.vue',
                'DangerButton.vue',
                'LoadingState.vue',
                'NumberInput.vue',
                'PrimaryButton.vue',
                'TextInput.vue',
                'TextareaInput.vue',
            ],
            'apps/families/domains/storage/pages/StorageDetailPage.spec.ts': [
                'BackButton.vue',
                'DetailRow.vue',
                'EmptyState.vue',
                'LoadingState.vue',
                'PartListItem.vue',
                'PrimaryButton.vue',
            ],
            'apps/families/domains/storage/pages/StorageOverviewPage.spec.ts': [
                'EmptyState.vue',
                'ListItemButton.vue',
                'PageHeader.vue',
                'PrimaryButton.vue',
                'TextInput.vue',
            ],
            'apps/families/modals/PlacePartModal.spec.ts': [
                'ModalDialog.vue',
                'NumberInput.vue',
                'PrimaryButton.vue',
                'SelectInput.vue',
            ],
            'apps/showcase/components/AntiPatterns.spec.ts': ['SectionHeading.vue'],
            'apps/showcase/components/BrandVoice.spec.ts': ['SectionHeading.vue'],
            'apps/showcase/components/BrickDimensions.spec.ts': ['SectionHeading.vue'],
            'apps/showcase/components/BrickShapes.spec.ts': ['SectionHeading.vue'],
            'apps/showcase/components/ColorPalette.spec.ts': ['SectionHeading.vue'],
            'apps/showcase/components/ComponentHealthMocked.spec.ts': ['ComponentHealth.vue', 'SectionHeading.vue'],
            'apps/showcase/components/DialogServiceDemo.spec.ts': ['PrimaryButton.vue', 'SectionHeading.vue'],
            'apps/showcase/components/FormValidationWorkbench.spec.ts': [
                'DateInput.vue',
                'NumberInput.vue',
                'PrimaryButton.vue',
                'SectionHeading.vue',
                'SelectInput.vue',
                'TextInput.vue',
                'TextareaInput.vue',
            ],
            'apps/showcase/components/ResourceAdapterPlayground.spec.ts': [
                'DangerButton.vue',
                'NumberInput.vue',
                'PrimaryButton.vue',
                'TextInput.vue',
            ],
            'apps/showcase/components/SnapDemo.spec.ts': ['SectionHeading.vue'],
            'apps/showcase/components/TypographySpecimen.spec.ts': ['SectionHeading.vue'],
            'shared/components/ConfirmDialog.spec.ts': ['ModalDialog.vue'],
            'shared/components/EmptyState.spec.ts': ['LegoBrick.vue'],
        };

        const getTopLevelVueImports = (filePath: string): string[] => {
            const content = readFileSync(filePath, 'utf-8');
            const imports: string[] = [];
            let match: RegExpExecArray | null;
            VUE_IMPORT_REGEX.lastIndex = 0;
            while ((match = VUE_IMPORT_REGEX.exec(content)) !== null) {
                const importPath = match[1];
                if (importPath !== undefined) {
                    imports.push(basename(importPath));
                }
            }
            return imports;
        };

        it('unit specs should only import their system-under-test .vue file at top level', () => {
            const specFiles = readdirSync(UNIT_DIR, {recursive: true, encoding: 'utf-8'})
                .filter((file) => file.endsWith('.spec.ts'))
                .map((file) => join(UNIT_DIR, file))
                .filter((file) => file !== join(UNIT_DIR, 'architecture.spec.ts'));

            const violations: string[] = [];
            const unusedAllowlistEntries = new Set(Object.keys(LEGACY_CROSS_COMPONENT_IMPORTS));

            for (const file of specFiles) {
                const rel = relative(UNIT_DIR, file);
                const sutVueName = `${basename(file, '.spec.ts')}.vue`;
                const allowlist = LEGACY_CROSS_COMPONENT_IMPORTS[rel] ?? [];
                if (rel in LEGACY_CROSS_COMPONENT_IMPORTS) {
                    unusedAllowlistEntries.delete(rel);
                }

                const importedVueBasenames = getTopLevelVueImports(file);
                for (const vueName of importedVueBasenames) {
                    if (vueName === sutVueName) continue;
                    if (allowlist.includes(vueName)) continue;
                    violations.push(
                        `${rel} imports ${vueName} at top level (SUT is ${sutVueName}). ` +
                            `Use findComponent({ name: '${basename(vueName, '.vue')}' }) and stub via vi.mock(...) instead — ` +
                            `top-level .vue imports drag the transitive dependency graph into the Vite collect phase (ADR-0012).`,
                    );
                }
            }

            if (unusedAllowlistEntries.size > 0) {
                for (const stale of unusedAllowlistEntries) {
                    violations.push(
                        `${stale} is in LEGACY_CROSS_COMPONENT_IMPORTS but no longer imports any disallowed .vue file — remove the entry from the allowlist.`,
                    );
                }
            }

            expect(
                violations,
                'Unit specs may only import their system-under-test (matching the spec filename) as a top-level .vue import. ' +
                    'All other component references must go through findComponent({ name: "X" }) with vi.mock(...) stubs. ' +
                    'Legacy violations are tracked in LEGACY_CROSS_COMPONENT_IMPORTS and should shrink over time, not grow.',
            ).toStrictEqual([]);
        });
    });
});
