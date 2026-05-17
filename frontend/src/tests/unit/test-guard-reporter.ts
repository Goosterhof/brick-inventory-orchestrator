import type {SerializedError} from 'vitest';
import type {TestModule, Vitest} from 'vitest/node';
import type {Reporter, TestRunEndReason} from 'vitest/reporters';

/**
 * A Vitest reporter that enforces per-file test execution time limits.
 *
 * Execution time (diagnostic().duration) measures how long all tests and hooks
 * in a file take to run. A high execution time signals one of:
 * - Insufficient mocking (real I/O, heavy dependencies not stubbed)
 * - File too large (too many tests in one file)
 * - Expensive test setup/teardown
 *
 * Execution time varies under full-suite load due to thread contention and
 * worker pool pressure — tests routinely measure 1.5–2x slower in the full
 * suite vs isolated project runs, and coverage instrumentation layers another
 * ~2x on top. The sibling CollectGuardReporter doubles its thresholds under
 * coverage for exactly this reason; this reporter mirrors that policy so the
 * gauntlet gates stay consistent across `test:unit` and `test:coverage`.
 *
 * Two tiers (base thresholds; doubled under coverage):
 * - Warning (300ms base / 600ms under coverage): printed but does not fail the suite
 * - Failure (2000ms base / 4000ms under coverage): fails the suite with exit code 1
 *
 * See ADR-010 for the full test isolation policy.
 */

const WARN_THRESHOLD_MS = 300;
const FAIL_THRESHOLD_MS = 2000;

interface FileEntry {
    project: string;
    file: string;
    durationMs: number;
    testCount: number;
}

class TestGuardReporter implements Reporter {
    private coverageEnabled = false;
    private entries: FileEntry[] = [];

    onInit(vitest: Vitest): void {
        this.coverageEnabled = vitest.config.coverage.enabled;
    }

    onTestModuleEnd(module: TestModule): void {
        const durationMs = Math.round(module.diagnostic().duration);
        const file = module.moduleId.replace(/.*src\/tests\/unit\//, '');
        const project = module.project.name;
        const testCount = [...module.children.allTests()].length;

        this.entries.push({project, file, durationMs, testCount});
    }

    onTestRunEnd(
        _testModules: ReadonlyArray<TestModule>,
        _errors: ReadonlyArray<SerializedError>,
        _reason: TestRunEndReason,
    ): void {
        const coverageMultiplier = this.coverageEnabled ? 2 : 1;
        const warnThreshold = WARN_THRESHOLD_MS * coverageMultiplier;
        const failThreshold = FAIL_THRESHOLD_MS * coverageMultiplier;

        const warnings: FileEntry[] = [];
        const violations: FileEntry[] = [];

        for (const entry of this.entries) {
            if (entry.durationMs >= failThreshold) {
                violations.push(entry);
            } else if (entry.durationMs >= warnThreshold) {
                warnings.push(entry);
            }
        }

        if (warnings.length > 0) {
            const sorted = warnings.sort((a, b) => b.durationMs - a.durationMs);
            const lines = sorted.map((v) => `  [${v.project}] ${v.durationMs}ms | ${v.testCount} tests | ${v.file}`);

            const message = [
                '',
                '\x1b[1m\x1b[33m TEST GUARD \x1b[0m Test files getting slow:',
                '',
                `  Threshold: ${warnThreshold}ms${this.coverageEnabled ? ' (coverage mode: 2x)' : ''}`,
                '',
                ...lines,
                '',
                '  Consider: mock heavy dependencies, split large files, or reduce setup overhead.',
                '  See ADR-010 for the test isolation policy.',
                '',
            ].join('\n');

            console.warn(message);
        }

        if (violations.length === 0) {
            return;
        }

        const sorted = violations.sort((a, b) => b.durationMs - a.durationMs);
        const lines = sorted.map((v) => `  [${v.project}] ${v.durationMs}ms | ${v.testCount} tests | ${v.file}`);

        const message = [
            '',
            '\x1b[1m\x1b[31m TEST GUARD \x1b[0m Test files too slow:',
            '',
            `  Threshold: ${failThreshold}ms${this.coverageEnabled ? ' (coverage mode: 2x)' : ''}`,
            '',
            ...lines,
            '',
            '  Fix: mock heavy dependencies, split large files, or reduce setup overhead.',
            '  See ADR-010 for the test isolation policy.',
            '',
        ].join('\n');

        console.error(message);

        throw new Error(`Test guard: ${violations.length} file(s) exceeded ${failThreshold}ms execution threshold`);
    }
}

export default TestGuardReporter;
