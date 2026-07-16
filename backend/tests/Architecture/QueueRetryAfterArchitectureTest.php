<?php

declare(strict_types = 1);

use Illuminate\Queue\Attributes\Timeout;

test('database queue retry_after strictly exceeds every job #[Timeout] value', function(): void {
    // INVARIANT (BIO-0019): Laravel requires retry_after to exceed the longest job
    // runtime. If a job's #[Timeout] is >= retry_after, the reservation is released
    // while the job still runs and a second worker picks it up concurrently — for
    // the Rebrickable imports that means duplicate FamilySet rows.
    $projectRoot = \dirname(__DIR__, 2);

    /** @var array{connections: array{database: array{retry_after: int}}} $queueConfig */
    $queueConfig = require $projectRoot . '/config/queue.php';
    $retryAfter = $queueConfig['connections']['database']['retry_after'];

    expect($retryAfter)->toBeGreaterThan(0);

    $violations = [];

    foreach (getClassesInDirectory($projectRoot . '/app/Jobs', 'App\Jobs\\') as $className) {
        $reflection = new \ReflectionClass($className);

        foreach ($reflection->getAttributes(Timeout::class) as $attribute) {
            $timeout = $attribute->newInstance()->timeout;

            if ($retryAfter <= $timeout) {
                $violations[] = \sprintf(
                    '%s declares #[Timeout(%d)] but queue.connections.database.retry_after is %d',
                    $className,
                    $timeout,
                    $retryAfter,
                );
            }
        }
    }

    expect($violations)->toBe([], \sprintf(
        'retry_after must strictly exceed every job timeout or reservations are released mid-run '
        . 'and jobs execute concurrently (duplicate imports — BIO-0019): %s. '
        . 'Raise DB_QUEUE_RETRY_AFTER (config/queue.php) above the largest #[Timeout] in app/Jobs.',
        implode('; ', $violations),
    ));
});
