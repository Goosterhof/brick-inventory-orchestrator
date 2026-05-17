<?php

declare(strict_types = 1);

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

it('should have cascadeRelations method on all models', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Models', 'App\Models\\') as $className) {
        $reflection = new \ReflectionClass($className);

        expect($reflection->hasMethod('cascadeRelations'))->toBeTrue(
            \sprintf('Model %s must have a cascadeRelations() method', $className),
        );

        $method = $reflection->getMethod('cascadeRelations');

        expect($method->isPublic())->toBeTrue(
            \sprintf('Model %s::cascadeRelations() must be public', $className),
        );

        expect($method->isStatic())->toBeTrue(
            \sprintf('Model %s::cascadeRelations() must be static', $className),
        );

        $returnType = $method->getReturnType();

        expect($returnType)->not->toBeNull(
            \sprintf('Model %s::cascadeRelations() must have a return type', $className),
        );

        expect($returnType->getName())->toBe(
            'array',
            \sprintf('Model %s::cascadeRelations() must return array', $className),
        );
    }
});

it('should declare all HasMany and HasOne relationships in cascadeRelations', function(): void {
    $allowedReturnTypes = [HasMany::class, HasOne::class];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Models', 'App\Models\\') as $className) {
        $reflection = new \ReflectionClass($className);
        $cascadeRelations = $className::cascadeRelations();

        $ownPublicMethods = array_filter(
            $reflection->getMethods(\ReflectionMethod::IS_PUBLIC),
            fn(\ReflectionMethod $reflectionMethod): bool => $reflectionMethod->getDeclaringClass()->getName() === $className,
        );

        foreach ($ownPublicMethods as $ownPublicMethod) {
            $returnType = $ownPublicMethod->getReturnType();

            if ($returnType === null) {
                continue;
            }

            if (!\in_array($returnType->getName(), $allowedReturnTypes, true)) {
                continue;
            }

            expect(\in_array($ownPublicMethod->getName(), $cascadeRelations, true))->toBeTrue(
                \sprintf(
                    'Model %s has %s relationship %s() that is not declared in cascadeRelations()',
                    $className,
                    $returnType->getName() === HasMany::class ? 'HasMany' : 'HasOne',
                    $ownPublicMethod->getName(),
                ),
            );
        }
    }
});

it('should only reference valid HasMany or HasOne relationships in cascadeRelations', function(): void {
    $allowedReturnTypes = [HasMany::class, HasOne::class];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Models', 'App\Models\\') as $className) {
        $reflection = new \ReflectionClass($className);
        $cascadeRelations = $className::cascadeRelations();

        foreach ($cascadeRelations as $cascadeRelation) {
            expect($reflection->hasMethod($cascadeRelation))->toBeTrue(
                \sprintf(
                    'Model %s declares "%s" in cascadeRelations() but no such method exists',
                    $className,
                    $cascadeRelation,
                ),
            );

            $method = $reflection->getMethod($cascadeRelation);
            $returnType = $method->getReturnType();

            expect($returnType)->not->toBeNull(
                \sprintf(
                    'Model %s::%s() must have a return type to be in cascadeRelations()',
                    $className,
                    $cascadeRelation,
                ),
            );

            expect(\in_array($returnType->getName(), $allowedReturnTypes, true))->toBeTrue(
                \sprintf(
                    'Model %s::%s() returns %s but only HasMany and HasOne are allowed in cascadeRelations()',
                    $className,
                    $cascadeRelation,
                    $returnType->getName(),
                ),
            );
        }
    }
});

it('delete actions should handle all declared cascade relations', function(): void {
    $actionsDir = \dirname(__DIR__, 2) . '/app/Actions';

    foreach (getClassesInDirectory($actionsDir, 'App\Actions\\') as $className) {
        $reflection = new \ReflectionClass($className);
        $shortName = $reflection->getShortName();
        if (!str_starts_with($shortName, 'Delete')) {
            continue;
        }

        if (!str_ends_with($shortName, 'Action')) {
            continue;
        }

        $modelName = mb_substr($shortName, mb_strlen('Delete'), -mb_strlen('Action'));
        $modelClass = 'App\Models\\' . $modelName;

        if (!class_exists($modelClass)) {
            continue;
        }

        $cascadeRelations = $modelClass::cascadeRelations();

        if ($cascadeRelations === []) {
            continue;
        }

        $file = $reflection->getFileName();
        $source = shell_exec('cat ' . escapeshellarg($file));

        foreach ($cascadeRelations as $cascadeRelation) {
            expect(str_contains($source, $cascadeRelation))->toBeTrue(
                \sprintf(
                    'Delete action %s must handle cascade relation "%s" declared by %s',
                    $className,
                    $cascadeRelation,
                    $modelClass,
                ),
            );
        }
    }
});
