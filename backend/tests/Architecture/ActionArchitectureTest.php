<?php

declare(strict_types = 1);

use Illuminate\Http\Request;

arch('actions should end with Action')
    ->expect('App\Actions')
    ->toHaveSuffix('Action');

// Custom test: BypassFinals strips `final` and `readonly` via a stream wrapper,
// so we read raw file content via subprocess to bypass it.
it('should have all action classes as final readonly', function(): void {
    $nonFinalReadonly = [];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Actions', 'App\Actions\\') as $className) {
        $file = new \ReflectionClass($className)->getFileName();
        $content = (string) shell_exec('cat ' . escapeshellarg($file));

        if (!str_contains($content, 'final readonly class')) {
            $nonFinalReadonly[] = $className;
        }
    }

    expect($nonFinalReadonly)->toBeEmpty(
        'These actions are not final readonly: ' . implode(', ', $nonFinalReadonly),
    );
});

arch('actions should have execute method')
    ->expect('App\Actions')
    ->toHaveMethod('execute');

it('should only have execute as public method in actions', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Actions', 'App\Actions\\') as $className) {
        $reflection = new \ReflectionClass($className);
        $publicMethods = array_filter(
            $reflection->getMethods(\ReflectionMethod::IS_PUBLIC),
            fn(\ReflectionMethod $reflectionMethod): bool => $reflectionMethod->getDeclaringClass()->getName() === $className,
        );

        $methodNames = array_map(fn(\ReflectionMethod $reflectionMethod): string => $reflectionMethod->getName(), $publicMethods);
        $extraMethods = array_diff($methodNames, ['__construct', 'execute']);

        expect($methodNames)->toContain('execute');
        expect($extraMethods)->toBeEmpty(
            \sprintf('Action %s should only have __construct and execute as public methods, found: %s', $className, implode(', ', $methodNames)),
        );
    }
});

arch('actions should not depend on request classes directly')
    ->expect('App\Actions')
    ->not->toUse(Request::class);

arch('actions should not depend on controllers')
    ->expect('App\Actions')
    ->not->toUse('App\Http\Controllers');

arch('actions should not use facades')
    ->expect('App\Actions')
    ->not->toUse('Illuminate\Support\Facades');

it('should not use arrow functions in transaction closures', function(): void {
    $violations = [];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Actions', 'App\Actions\\') as $className) {
        $file = new \ReflectionClass($className)->getFileName();
        $content = (string) shell_exec('cat ' . escapeshellarg($file));

        if (preg_match('/->transaction\(\s*fn\s*\(/', $content)) {
            $violations[] = $className;
        }
    }

    expect($violations)->toBeEmpty(
        'Actions must use full function() syntax in transaction closures, not arrow functions. '
        . 'Arrow functions implicitly return values which can silently discard ?bool from delete(). '
        . 'Violations: ' . implode(', ', $violations),
    );
});

it('should not use static-through-instance calls on model properties', function(): void {
    $violations = [];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Actions', 'App\Actions\\') as $className) {
        $file = new \ReflectionClass($className)->getFileName();
        $content = (string) shell_exec('cat ' . escapeshellarg($file));

        if (preg_match('/\$this->\w+::\w+\(/', $content)) {
            $violations[] = $className;
        }
    }

    expect($violations)->toBeEmpty(
        'Actions must not use static-through-instance calls ($this->model::where()). '
        . 'Use $this->model->newQuery()->where() instead. '
        . 'Violations: ' . implode(', ', $violations),
    );
});
