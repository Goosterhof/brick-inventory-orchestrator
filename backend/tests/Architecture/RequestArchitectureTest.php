<?php

declare(strict_types = 1);

use Illuminate\Foundation\Http\FormRequest;

arch('requests should end with Request')
    ->expect('App\Http\Requests')
    ->toHaveSuffix('Request');

arch('requests should extend FormRequest')
    ->expect('App\Http\Requests')
    ->toExtend(FormRequest::class);

it('should have all form request classes as final', function(): void {
    $nonFinal = [];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Http/Requests', 'App\Http\Requests\\') as $className) {
        $file = new \ReflectionClass($className)->getFileName();
        $content = (string) shell_exec('cat ' . escapeshellarg($file));

        if (!str_contains($content, 'final class')) {
            $nonFinal[] = $className;
        }
    }

    expect($nonFinal)->toBeEmpty(
        'These form requests are not final: ' . implode(', ', $nonFinal),
    );
});

it('should not have public constants in form requests', function(): void {
    $violations = [];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Http/Requests', 'App\Http\Requests\\') as $className) {
        $file = new \ReflectionClass($className)->getFileName();
        $content = (string) shell_exec('cat ' . escapeshellarg($file));

        if (preg_match('/public\s+const\s+/', $content)) {
            $violations[] = $className;
        }
    }

    expect($violations)->toBeEmpty(
        'Form request constants should be private (internal implementation detail). Violations: ' . implode(', ', $violations),
    );
});
