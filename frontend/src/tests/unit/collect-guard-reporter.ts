import type {SerializedError} from 'vitest';
import type {TestModule, Vitest} from 'vitest/node';
import type {Reporter, TestRunEndReason} from 'vitest/reporters';

/**
 * A Vitest reporter that enforces collect-duration limits per test file using
 * baseline-relative measurement, grouped by project.
 *
 * Vitest's `collectDuration` includes thread pool overhead (~800-1000ms) that
 * varies by environment. This reporter subtracts a baseline (the median
 * collectDuration within the same project) to isolate the actual import chain
 * cost. The median is used rather than the minimum because pool overhead is not
 * uniform — files scheduled later in the run experience more contention.
 *
 * Three tiers (informational — does not fail the suite):
 * - Warning (delta 200-500ms): import chain getting heavy
 * - Violation (delta 500ms+): import chain too slow
 * - Hard cap (raw 5000ms+): catches baseline drift
 *
 * Single-file exception: when a project has only 1 file, thresholds apply to
 * raw collectDuration directly (no subtraction), since there is no pool
 * contention within that project.
 *
 * Coverage mode: Istanbul instrumentation adds ~300-400ms overhead per file.
 * When coverage is enabled, thresholds are doubled to avoid false failures
 * from instrumentation overhead.
 *
 * See ADR-010 for the full test isolation policy.
 */

const median = (values: number[]): number => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        const lower = sorted[mid - 1] ?? 0;
        const upper = sorted[mid] ?? 0;
        return Math.round((lower + upper) / 2);
    }
    return sorted[mid] ?? 0;
};

const WARN_THRESHOLD_MS = 200;
const FAIL_THRESHOLD_MS = 500;
const HARD_CAP_MS = 5000;

interface FileEntry {
    project: string;
    file: string;
    rawMs: number;
    deltaMs: number;
    baselineMs: number;
}

class CollectGuardReporter implements Reporter {
    private entries: Array<{project: string; file: string; rawMs: number}> = [];
    private coverageEnabled = false;

    onInit(vitest: Vitest): void {
        this.coverageEnabled = vitest.config.coverage.enabled;
    }

    onTestModuleEnd(module: TestModule): void {
        const rawMs = module.diagnostic().collectDuration;
        const file = module.moduleId.replace(/.*src\/tests\/unit\//, '');
        const project = module.project.name;

        this.entries.push({project, file, rawMs: Math.round(rawMs)});
    }

    onTestRunEnd(
        _testModules: ReadonlyArray<TestModule>,
        _errors: ReadonlyArray<SerializedError>,
        _reason: TestRunEndReason,
    ): void {
        if (this.entries.length === 0) {
            return;
        }

        const byProject = new Map<string, Array<{file: string; rawMs: number}>>();
        for (const entry of this.entries) {
            const group = byProject.get(entry.project) ?? [];
            group.push({file: entry.file, rawMs: entry.rawMs});
            byProject.set(entry.project, group);
        }

        const coverageMultiplier = this.coverageEnabled ? 2 : 1;
        const warnThreshold = WARN_THRESHOLD_MS * coverageMultiplier;
        const failThreshold = FAIL_THRESHOLD_MS * coverageMultiplier;
        const hardCap = HARD_CAP_MS * coverageMultiplier;

        const warnings: FileEntry[] = [];
        const violations: FileEntry[] = [];

        for (const [projectName, projectEntries] of byProject) {
            const singleFile = projectEntries.length === 1;
            const baselineMs = singleFile ? 0 : median(projectEntries.map((e) => e.rawMs));

            for (const entry of projectEntries) {
                const deltaMs = singleFile ? entry.rawMs : entry.rawMs - baselineMs;
                const fileEntry: FileEntry = {
                    project: projectName,
                    file: entry.file,
                    rawMs: entry.rawMs,
                    deltaMs,
                    baselineMs,
                };

                if (entry.rawMs >= hardCap) {
                    violations.push(fileEntry);
                } else if (deltaMs >= failThreshold) {
                    violations.push(fileEntry);
                } else if (deltaMs >= warnThreshold) {
                    warnings.push(fileEntry);
                }
            }
        }

        if (warnings.length > 0) {
            const sorted = warnings.sort((a, b) => b.deltaMs - a.deltaMs);
            const lines = sorted.map(
                (v) =>
                    `  [${v.project}] ${v.deltaMs}ms delta | ${v.rawMs}ms raw | ${v.baselineMs}ms baseline | ${v.file}`,
            );

            const message = [
                '',
                '\x1b[1m\x1b[33m COLLECT GUARD \x1b[0m Warning — import chain getting heavy:',
                '',
                `  Threshold: ${warnThreshold}ms delta${this.coverageEnabled ? ' (coverage mode: 2x)' : ''}`,
                '',
                ...lines,
                '',
                '  Consider mocking heavy dependencies with vi.mock(() => ({...})).',
                '  See ADR-010 for the test isolation policy.',
                '',
            ].join('\n');

            console.warn(message);
        }

        if (violations.length === 0) {
            return;
        }

        const sorted = violations.sort((a, b) => b.deltaMs - a.deltaMs);
        const lines = sorted.map(
            (v) => `  [${v.project}] ${v.deltaMs}ms delta | ${v.rawMs}ms raw | ${v.baselineMs}ms baseline | ${v.file}`,
        );

        const message = [
            '',
            '\x1b[1m\x1b[31m COLLECT GUARD \x1b[0m Import chain too slow in test files:',
            '',
            `  Threshold: ${failThreshold}ms delta / ${hardCap}ms hard cap${this.coverageEnabled ? ' (coverage mode: 2x)' : ''}`,
            '',
            ...lines,
            '',
            '  Fix: mock heavy dependencies with vi.mock(() => ({...})) so the import chain stays shallow.',
            '  See ADR-010 for the test isolation policy.',
            '',
        ].join('\n');

        console.error(message);

        console.error(`\n  Collect guard: ${violations.length} file(s) exceeded collect thresholds.\n`);
    }
}

export default CollectGuardReporter;
