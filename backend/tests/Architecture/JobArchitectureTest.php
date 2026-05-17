<?php

declare(strict_types = 1);

use Illuminate\Contracts\Queue\ShouldQueue;

it('should have all job classes as final', function(): void {
    $nonFinal = [];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Jobs', 'App\Jobs\\') as $className) {
        $file = new \ReflectionClass($className)->getFileName();
        $content = (string) shell_exec('cat ' . escapeshellarg($file));

        if (!str_contains($content, 'final class')) {
            $nonFinal[] = $className;
        }
    }

    expect($nonFinal)->toBeEmpty(
        'These jobs are not final: ' . implode(', ', $nonFinal),
    );
});

arch('jobs should implement ShouldQueue')
    ->expect('App\Jobs')
    ->toImplement(ShouldQueue::class);
