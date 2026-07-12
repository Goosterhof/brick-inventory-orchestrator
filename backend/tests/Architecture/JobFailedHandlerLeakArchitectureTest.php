<?php

declare(strict_types = 1);

use Tests\Architecture\Support\ArchTestHelper;

/**
 * Guards the failed()-handler raw-exception-message leak class
 * (war-room enforcement queue #140 / #134; regression seed: SyncSetPartsJob,
 * fixed 2026-07-10).
 *
 * A queued Job's failed() handler MUST NOT persist or return a raw exception
 * message to a user-visible field. Raw throwable detail — getMessage() /
 * getTraceAsString() — may appear ONLY inside a server-side logging sink
 * (logger() / Log::). Any other occurrence in a failed() body is a candidate
 * leak into a persisted failure column (e.g. Set.parts_sync_failed_reason) or a
 * response body, where it can carry DSN credentials, SQL, or API keys to any
 * authenticated user.
 *
 * Canonical safe shape: App\Jobs\ImportOwnedSetsJob::failed() — persist an
 * opaque generic message, log the raw detail server-side only.
 *
 * The matcher masks each logging-sink call (logger()->method(...) / Log::method(...))
 * out of the failed() body via balanced-parenthesis scanning, then rejects any
 * surviving getMessage()/getTraceAsString(). It is deliberately conservative:
 * extracting a raw message into a local variable *before* passing it to a log
 * sink would also be flagged. That is acceptable — inline the call into the log
 * sink to comply (a false green is the failure mode this gate exists to prevent).
 */
it('should not leak raw exception detail outside a logging sink in any Job failed() handler', function(): void {
    $extractFailedBody = function(string $source): ?string {
        if (preg_match('/function\s+failed\s*\([^)]*\)\s*:\s*\w+\s*\{/', $source, $match, \PREG_OFFSET_CAPTURE) !== 1) {
            return null;
        }

        $bracePos = $match[0][1] + mb_strlen($match[0][0]) - 1;
        $depth = 0;
        $length = mb_strlen($source);

        for ($i = $bracePos; $i < $length; $i++) {
            if ($source[$i] === '{') {
                $depth++;
            } elseif ($source[$i] === '}') {
                $depth--;

                if ($depth === 0) {
                    return mb_substr($source, $bracePos + 1, $i - $bracePos - 1);
                }
            }
        }

        return null;
    };

    $maskLoggingSinks = function(string $body): string {
        $result = $body;

        while (preg_match('/(?:logger\(\)\s*->|Log::)\w+\s*\(/', $result, $match, \PREG_OFFSET_CAPTURE) === 1) {
            $start = $match[0][1];
            $openParen = $start + mb_strlen($match[0][0]) - 1;
            $depth = 0;
            $end = $openParen;
            $length = mb_strlen($result);

            for ($i = $openParen; $i < $length; $i++) {
                if ($result[$i] === '(') {
                    $depth++;
                } elseif ($result[$i] === ')') {
                    $depth--;

                    if ($depth === 0) {
                        $end = $i;

                        break;
                    }
                }
            }

            $result = mb_substr($result, 0, $start) . '/* logsink */' . mb_substr($result, $end + 1);
        }

        return $result;
    };

    $violations = [];

    foreach (ArchTestHelper::phpFilesIn(\dirname(__DIR__, 2) . '/app/Jobs') as $file) {
        $source = (string) file_get_contents($file);
        $failedBody = $extractFailedBody($source);

        if ($failedBody === null) {
            continue;
        }

        $withoutLogSinks = $maskLoggingSinks($failedBody);

        if (preg_match('/->getMessage\s*\(|->getTraceAsString\s*\(/', $withoutLogSinks) === 1) {
            $violations[] = basename($file);
        }
    }

    expect($violations)->toBeEmpty(
        ArchTestHelper::formatViolations(
            'These Job failed() handlers reference raw exception detail (getMessage()/getTraceAsString()) '
            . 'outside a logging sink. Persist an opaque message and send raw detail to the log sink only '
            . '(see the ImportOwnedSetsJob failed() handler):',
            $violations,
        ),
    );
});
