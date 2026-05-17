<?php

declare(strict_types = 1);

use Illuminate\Support\Facades\DB;

arch('services should end with Service')
    ->expect('App\Services')
    ->toHaveSuffix('Service');

// Custom test: BypassFinals strips `final` and `readonly` via a stream wrapper,
// so we read raw file content via subprocess to bypass it.
it('should have all service classes as final readonly', function(): void {
    $nonFinalReadonly = [];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Services', 'App\Services\\') as $className) {
        $file = new \ReflectionClass($className)->getFileName();
        $content = (string) shell_exec('cat ' . escapeshellarg($file));

        if (!str_contains($content, 'final readonly class')) {
            $nonFinalReadonly[] = $className;
        }
    }

    expect($nonFinalReadonly)->toBeEmpty(
        'These services are not final readonly: ' . implode(', ', $nonFinalReadonly),
    );
});

arch('services should not extend anything')
    ->expect('App\Services')
    ->toExtendNothing();

it('should have all services implement a contract interface', function(): void {
    $violations = [];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Services', 'App\Services\\') as $className) {
        $reflection = new \ReflectionClass($className);
        $interfaces = $reflection->getInterfaceNames();

        $contractInterfaces = array_filter(
            $interfaces,
            fn(string $interface): bool => str_starts_with($interface, 'App\Contracts\\'),
        );

        if ($contractInterfaces === []) {
            $violations[] = $className;
        }
    }

    expect($violations)->toBeEmpty(
        'These services do not implement a contract interface from App\Contracts\: ' . implode(', ', $violations),
    );
});

arch('services should not depend on Actions')
    ->expect('App\Services')
    ->not->toUse('App\Actions');

arch('services should not use Models directly')
    ->expect('App\Services')
    ->not->toUse('App\Models');

arch('services should not depend on other services directly')
    ->expect('App\Services')
    ->not->toUse('App\Services');

arch('services should not use database layer directly')
    ->expect('App\Services')
    ->not->toUse([
        DB::class,
        'Illuminate\Database',
    ]);
