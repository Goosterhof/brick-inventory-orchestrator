<?php

declare(strict_types = 1);

use Tests\Architecture\Support\ArchTestHelper;

/*
|--------------------------------------------------------------------------
| Input / Result DTO Placement — Architecture Tests
|--------------------------------------------------------------------------
|
| The boundary between `App\DataTransferObjects\Input\*` and
| `App\DataTransferObjects\Result\*` is governed by **usage direction**,
| measured at the Action boundary:
|
|   - Actions RECEIVE Input DTOs (FormRequest::toDto() → Action parameter,
|     or Service → Action parameter).
|   - Actions RETURN Result DTOs.
|
| These three tests enforce that rule so the next crew member cannot
| mis-locate a DTO. Three angles are checked, per cross-territory pattern:
| return types, parameter types, and FormRequest::toDto() return types.
|
| Deptrac enforces the secondary constraint (Input DTOs may not reach
| Models; Result DTOs may) in deptrac.yaml.
|
 */

test('action return types that are DTOs live in the Result namespace', function(): void {
    $actionsPath = \dirname(__DIR__, 2) . '/app/Actions';
    $files = ArchTestHelper::phpFilesIn($actionsPath);

    expect($files)->not->toBeEmpty('No action classes found in App\Actions');

    $violations = [];

    foreach ($files as $file) {
        $className = ArchTestHelper::resolveClassName($file, $actionsPath, 'App\Actions');

        if (!class_exists($className)) {
            continue;
        }

        $reflection = new \ReflectionClass($className);

        if (!$reflection->hasMethod('execute')) {
            continue;
        }

        $executeMethod = $reflection->getMethod('execute');
        $returnType = $executeMethod->getReturnType();

        if (!$returnType instanceof \ReflectionNamedType) {
            continue;
        }

        if ($returnType->isBuiltin()) {
            continue;
        }

        $returnTypeName = $returnType->getName();

        if (!str_starts_with($returnTypeName, 'App\DataTransferObjects\\')) {
            continue;
        }

        if (!str_starts_with($returnTypeName, 'App\DataTransferObjects\Result\\')) {
            $violations[] = \sprintf(
                '%s::execute() returns %s — DTO must live in App\DataTransferObjects\Result\*',
                $className,
                $returnTypeName,
            );
        }
    }

    expect($violations)->toBeEmpty(
        ArchTestHelper::formatViolations(
            'Action execute() return types that are DTOs must live in the Result namespace:',
            $violations,
        ),
    );
});

test('action parameter types that are DTOs live in the Input namespace', function(): void {
    $actionsPath = \dirname(__DIR__, 2) . '/app/Actions';
    $files = ArchTestHelper::phpFilesIn($actionsPath);

    expect($files)->not->toBeEmpty('No action classes found in App\Actions');

    $violations = [];

    foreach ($files as $file) {
        $className = ArchTestHelper::resolveClassName($file, $actionsPath, 'App\Actions');

        if (!class_exists($className)) {
            continue;
        }

        $reflection = new \ReflectionClass($className);

        if (!$reflection->hasMethod('execute')) {
            continue;
        }

        $executeMethod = $reflection->getMethod('execute');

        foreach ($executeMethod->getParameters() as $param) {
            $type = $param->getType();

            if (!$type instanceof \ReflectionNamedType) {
                continue;
            }

            if ($type->isBuiltin()) {
                continue;
            }

            $typeName = $type->getName();

            if (!str_starts_with($typeName, 'App\DataTransferObjects\\')) {
                continue;
            }

            if (!str_starts_with($typeName, 'App\DataTransferObjects\Input\\')) {
                $violations[] = \sprintf(
                    '%s::execute($%s) accepts %s — DTO must live in App\DataTransferObjects\Input\*',
                    $className,
                    $param->getName(),
                    $typeName,
                );
            }
        }
    }

    expect($violations)->toBeEmpty(
        ArchTestHelper::formatViolations(
            'Action execute() DTO parameters must live in the Input namespace:',
            $violations,
        ),
    );
});

test('form request toDto() return types that are DTOs live in the Input namespace', function(): void {
    $requestsPath = \dirname(__DIR__, 2) . '/app/Http/Requests';
    $files = ArchTestHelper::phpFilesIn($requestsPath);

    expect($files)->not->toBeEmpty('No form request classes found in App\Http\Requests');

    $violations = [];

    foreach ($files as $file) {
        $className = ArchTestHelper::resolveClassName($file, $requestsPath, 'App\Http\Requests');

        if (!class_exists($className)) {
            continue;
        }

        $reflection = new \ReflectionClass($className);

        if (!$reflection->hasMethod('toDto')) {
            continue;
        }

        $toDto = $reflection->getMethod('toDto');

        // Only assert on toDto() declared directly on this class (skip inherited)
        if ($toDto->getDeclaringClass()->getName() !== $className) {
            continue;
        }

        $returnType = $toDto->getReturnType();

        if ($returnType === null) {
            $violations[] = \sprintf(
                '%s::toDto() has no return type declared — add an explicit return type',
                $className,
            );

            continue;
        }

        if (!$returnType instanceof \ReflectionNamedType) {
            continue;
        }

        if ($returnType->isBuiltin()) {
            continue;
        }

        $typeName = $returnType->getName();

        if (!str_starts_with($typeName, 'App\DataTransferObjects\\')) {
            continue;
        }

        if (!str_starts_with($typeName, 'App\DataTransferObjects\Input\\')) {
            $violations[] = \sprintf(
                '%s::toDto() returns %s — DTO must live in App\DataTransferObjects\Input\*',
                $className,
                $typeName,
            );
        }
    }

    expect($violations)->toBeEmpty(
        ArchTestHelper::formatViolations(
            'FormRequest toDto() return types that are DTOs must live in the Input namespace:',
            $violations,
        ),
    );
});
