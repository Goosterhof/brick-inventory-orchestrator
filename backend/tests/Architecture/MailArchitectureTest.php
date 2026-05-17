<?php

declare(strict_types = 1);

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;

/*
|--------------------------------------------------------------------------
| Mail Architecture
|--------------------------------------------------------------------------
|
| Mailables in App\Mail are App\ leaves: they receive primitives via the
| constructor and render. They must NOT depend on Models, DTOs, or any
| other App\ class — that boundary keeps them simple to test, free of
| cascading rebuild cost when models change shape, and friendly to the
| queue serializer.
|
| Every Mailable also implements ShouldQueue; the warehouse only mails
| asynchronously. The Mail layer in deptrac.yaml has no allowed deps.
|
 */

it('should have all mailables as final', function(): void {
    $nonFinal = [];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Mail', 'App\Mail\\') as $className) {
        $file = new \ReflectionClass($className)->getFileName();
        $content = (string) shell_exec('cat ' . escapeshellarg((string) $file));

        if (!str_contains($content, 'final class')) {
            $nonFinal[] = $className;
        }
    }

    expect($nonFinal)->toBeEmpty(
        'These mailables are not final: ' . implode(', ', $nonFinal),
    );
});

it('should have all mailables extending Mailable', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Mail', 'App\Mail\\') as $className) {
        expect(is_subclass_of($className, Mailable::class))->toBeTrue(
            \sprintf('Mailable %s must extend Illuminate\Mail\Mailable', $className),
        );
    }
});

it('should have all mailables implementing ShouldQueue', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Mail', 'App\Mail\\') as $className) {
        expect(is_subclass_of($className, ShouldQueue::class))->toBeTrue(
            \sprintf('Mailable %s must implement ShouldQueue — every email goes through the queue', $className),
        );
    }
});

it('should have only primitive constructor parameters in mailables', function(): void {
    $allowedTypes = ['string', 'int', 'float', 'bool', 'array', CarbonImmutable::class];

    $violations = [];
    $parametersInspected = 0;

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Mail', 'App\Mail\\') as $className) {
        $reflection = new \ReflectionClass($className);
        $constructor = $reflection->getConstructor();

        if ($constructor === null) {
            continue;
        }

        foreach ($constructor->getParameters() as $parameter) {
            $parametersInspected++;
            $type = $parameter->getType();

            if (!$type instanceof \ReflectionNamedType) {
                continue;
            }

            $typeName = $type->getName();
            // Accept builtins, plus a small allowlist of value-object primitives
            // (CarbonImmutable is a serializer-friendly date primitive — it survives
            // marshalling across worker boundaries cleanly).
            if ($type->isBuiltin()) {
                continue;
            }

            if (\in_array($typeName, $allowedTypes, strict: true)) {
                continue;
            }

            $violations[] = \sprintf(
                'Mailable %s::__construct($%s) accepts %s — only primitives (and CarbonImmutable) are allowed. '
                . 'Unpack Models/DTOs in the Action; if a new value-object primitive is justified, extend the allowlist in MailArchitectureTest.',
                $className,
                $parameter->getName(),
                $typeName,
            );
        }
    }

    expect($violations)->toBeEmpty(implode("\n", $violations));
    // Counter-assertion: at least one constructor parameter must have been inspected,
    // otherwise this test is silently green when nobody is looking.
    expect($parametersInspected)->toBeGreaterThan(
        0,
        'No mailable constructor parameters were inspected — either the Mail layer is empty or the test is mis-wired.',
    );
});

it('should not use facades in mailables', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Mail', 'App\Mail\\') as $className) {
        $file = new \ReflectionClass($className)->getFileName();
        $content = (string) shell_exec('cat ' . escapeshellarg((string) $file));

        expect($content)->not->toContain(
            'Illuminate\Support\Facades',
            \sprintf('Mailable %s uses a facade — Mailables must be pure renderers; inject any dependency or pass it as a primitive.', $className),
        );
    }
});

it('should not use Eloquent in mailables', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Mail', 'App\Mail\\') as $className) {
        $file = new \ReflectionClass($className)->getFileName();
        $content = (string) shell_exec('cat ' . escapeshellarg((string) $file));

        expect($content)->not->toContain(
            'App\Models',
            \sprintf('Mailable %s imports an App\Models class — Mailables must receive primitives, not Models.', $className),
        );

        expect($content)->not->toContain(
            'Illuminate\Database\Eloquent',
            \sprintf('Mailable %s imports Eloquent — Mailables must not query the database.', $className),
        );
    }
});

it('should only have Mailable contract methods plus constructor as public', function(): void {
    $allowedPublicMethods = [
        '__construct',
        'envelope',
        'content',
        'attachments',
        'headers',
        'build', // pre-Laravel-9-style; not used here but accepted as Mailable contract
    ];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Mail', 'App\Mail\\') as $className) {
        $reflection = new \ReflectionClass($className);
        $publicMethods = array_filter(
            $reflection->getMethods(\ReflectionMethod::IS_PUBLIC),
            fn(\ReflectionMethod $reflectionMethod): bool => $reflectionMethod->getDeclaringClass()->getName() === $className,
        );

        $methodNames = array_map(fn(\ReflectionMethod $reflectionMethod): string => $reflectionMethod->getName(), $publicMethods);
        $extraMethods = array_diff($methodNames, $allowedPublicMethods);

        expect($extraMethods)->toBeEmpty(
            \sprintf(
                'Mailable %s has unexpected public methods: %s. Mailables should only expose Mailable-contract methods plus the constructor.',
                $className,
                implode(', ', $extraMethods),
            ),
        );
    }
});
