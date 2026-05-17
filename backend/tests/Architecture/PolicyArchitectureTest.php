<?php

declare(strict_types = 1);

use Illuminate\Contracts\Auth\Access\Gate;

/*
|--------------------------------------------------------------------------
| Policy Architecture
|--------------------------------------------------------------------------
|
| Policies are authorization gates that:
| - End with "Policy" suffix
| - Are final readonly classes
| - Have methods that return bool
| - Use single-tier model (no interaction tier — unlike issue-tracker)
| - Are enforced via `can:` middleware on routes, NOT via Gate injection
|
 */

arch('policies should end with Policy')
    ->expect('App\Policies')
    ->toHaveSuffix('Policy');

it('should have all policy classes as final readonly', function(): void {
    $nonFinalReadonly = [];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Policies', 'App\Policies\\') as $className) {
        $file = new \ReflectionClass($className)->getFileName();
        $content = (string) shell_exec('cat ' . escapeshellarg($file));

        if (!str_contains($content, 'final readonly class')) {
            $nonFinalReadonly[] = $className;
        }
    }

    expect($nonFinalReadonly)->toBeEmpty(
        'These policies are not final readonly: ' . implode(', ', $nonFinalReadonly),
    );
});

it('should have all policy methods return bool', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Policies', 'App\Policies\\') as $className) {
        $reflection = new \ReflectionClass($className);

        foreach ($reflection->getMethods(\ReflectionMethod::IS_PUBLIC) as $method) {
            if ($method->getDeclaringClass()->getName() !== $className) {
                continue;
            }

            if ($method->getName() === '__construct') {
                continue;
            }

            $returnType = $method->getReturnType();

            expect($returnType)->not->toBeNull(
                \sprintf('Policy method %s::%s() should have a return type', $className, $method->getName()),
            );

            expect($returnType)->toBeInstanceOf(\ReflectionNamedType::class);
            expect($returnType->getName())->toBe(
                'bool',
                \sprintf('Policy method %s::%s() should return bool, got %s', $className, $method->getName(), $returnType->getName()),
            );
        }
    }
});

it('should not inject Gate contract in controllers', function(): void {
    $methodsChecked = 0;

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Http/Controllers', 'App\Http\Controllers\\') as $className) {
        $reflection = new \ReflectionClass($className);

        if ($reflection->isAbstract()) {
            continue;
        }

        foreach ($reflection->getMethods(\ReflectionMethod::IS_PUBLIC) as $method) {
            if ($method->getDeclaringClass()->getName() !== $className) {
                continue;
            }

            $methodsChecked++;

            foreach ($method->getParameters() as $param) {
                $type = $param->getType();
                if ($type instanceof \ReflectionNamedType && $type->getName() === Gate::class) {
                    expect(false)->toBeTrue(
                        \sprintf(
                            'Controller %s::%s() should not inject %s. Use can: middleware on routes instead.',
                            $className,
                            $method->getName(),
                            Gate::class,
                        ),
                    );
                }
            }
        }
    }

    expect($methodsChecked)->toBeGreaterThan(0);
});

it('should not use gate authorize calls in controllers', function(): void {
    $controllersDir = \dirname(__DIR__, 2) . '/app/Http/Controllers';

    $iterator = new \RecursiveIteratorIterator(
        new \RecursiveDirectoryIterator($controllersDir, \RecursiveDirectoryIterator::SKIP_DOTS),
    );

    foreach ($iterator as $file) {
        if (!$file->isFile()) {
            continue;
        }

        if ($file->getExtension() !== 'php') {
            continue;
        }

        if ($file->getFilename() === 'Controller.php') {
            continue;
        }

        $content = file_get_contents($file->getPathname());
        $relativePath = str_replace($controllersDir . '/', '', $file->getPathname());

        expect(str_contains($content, '->authorize('))->toBeFalse(
            \sprintf(
                'Controller %s should not call ->authorize(). Use can: middleware on routes instead.',
                $relativePath,
            ),
        );
    }
});
