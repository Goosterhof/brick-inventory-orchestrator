/**
 * Per-file mutation-score floor enforcement.
 *
 * Stryker's `thresholds.break` operates on the *aggregate* score across every
 * mutated file, which lets a weak file hide behind strong siblings (the General's
 * review of PR #135). Stryker has no native per-file `break`, so this script reads
 * the JSON report Stryker emits and fails the build if any individual file scores
 * below the floor.
 *
 * Wired as `posttest:mutation` — npm runs it automatically after `test:mutation`
 * succeeds. (When the aggregate itself is under threshold, Stryker exits non-zero
 * and this post-hook never runs; the aggregate gate has already failed. This hook
 * exists for the gap Stryker can't see: aggregate green, a single file red.)
 *
 * Score definition mirrors the mutation-testing report schema:
 *   detected      = Killed + Timeout
 *   undetected    = Survived + NoCoverage
 *   mutationScore = detected / (detected + undetected) * 100
 * CompileError / RuntimeError / Ignored / Pending mutants are excluded from the
 * denominator, exactly as Stryker's own metric does.
 */
import {readFileSync} from 'node:fs';

/** Per-file floor. Matches `thresholds.break` in stryker.config.mjs. */
const FLOOR = 90;
// Defaults to Stryker's emitted report; an explicit path can be passed as the
// first CLI argument (used to exercise the floor against a fixture report).
const REPORT_PATH = process.argv[2] ?? 'reports/mutation/mutation.json';

const readReport = () => {
    try {
        return JSON.parse(readFileSync(REPORT_PATH, 'utf8'));
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`[mutation-floor] Could not read Stryker report at ${REPORT_PATH}: ${reason}`);
        console.error('[mutation-floor] Ensure the "json" reporter is enabled in stryker.config.mjs.');
        process.exit(1);
    }
};

const scoreFor = (mutants) => {
    const counts = {Killed: 0, Timeout: 0, Survived: 0, NoCoverage: 0};
    for (const mutant of mutants) {
        if (mutant.status in counts) counts[mutant.status] += 1;
    }
    const detected = counts.Killed + counts.Timeout;
    const valid = detected + counts.Survived + counts.NoCoverage;
    // A file with no valid mutants (all compile/runtime errors) cannot drag the
    // floor down — treat it as passing rather than dividing by zero.
    return valid === 0 ? 100 : (detected / valid) * 100;
};

const report = readReport();
const files = report.files ?? {};

const violations = [];
for (const [path, file] of Object.entries(files)) {
    const score = scoreFor(file.mutants ?? []);
    if (score < FLOOR) violations.push({path, score});
}

if (violations.length > 0) {
    console.error(`\n[mutation-floor] ${violations.length} file(s) below the ${FLOOR}% per-file floor:\n`);
    for (const {path, score} of violations) {
        console.error(`  ✘ ${score.toFixed(2)}%  ${path}`);
    }
    console.error('\n[mutation-floor] Tighten or split the offending file(s) — do not lower the floor.\n');
    process.exit(1);
}

console.log(`[mutation-floor] All ${Object.keys(files).length} mutated file(s) at or above the ${FLOOR}% floor.`);
