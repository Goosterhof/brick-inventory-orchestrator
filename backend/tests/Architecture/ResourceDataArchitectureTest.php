<?php

declare(strict_types = 1);

use App\Http\Resources\ComputedResourceData;
use App\Http\Resources\ResourceData;

/*
|--------------------------------------------------------------------------
| ResourceData Architecture
|--------------------------------------------------------------------------
|
| ResourceData classes are DTO-style API response objects that:
| - End with "ResourceData" suffix
| - Are readonly (immutable)
| - Are final (concrete classes) or abstract (base class only)
| - Extend either ResourceData (Model-sourced) or ComputedResourceData (DTO-sourced)
|
 */

arch('resource data classes should end with ResourceData')
    ->expect('App\Http\Resources')
    ->toHaveSuffix('ResourceData');

arch('resource data classes should be readonly')
    ->expect('App\Http\Resources')
    ->toBeReadonly();

it('should have ResourceData as abstract readonly base class', function(): void {
    $reflection = new \ReflectionClass(ResourceData::class);

    expect($reflection->isAbstract())->toBeTrue('ResourceData base class should be abstract')
        ->and($reflection->isReadOnly())->toBeTrue('ResourceData base class should be readonly');
});

it('should have ComputedResourceData as abstract readonly base class', function(): void {
    $reflection = new \ReflectionClass(ComputedResourceData::class);

    expect($reflection->isAbstract())->toBeTrue('ComputedResourceData base class should be abstract')
        ->and($reflection->isReadOnly())->toBeTrue('ComputedResourceData base class should be readonly');
});

it('should have all concrete resource data classes extending ResourceData or ComputedResourceData', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Http/Resources', 'App\Http\Resources\\') as $className) {
        $reflection = new \ReflectionClass($className);

        // Skip abstract classes (like ResourceData and ComputedResourceData base classes)
        if ($reflection->isAbstract()) {
            continue;
        }

        $extendsResourceData = is_subclass_of($className, ResourceData::class);
        $extendsComputedResourceData = is_subclass_of($className, ComputedResourceData::class);

        expect($extendsResourceData || $extendsComputedResourceData)->toBeTrue(
            \sprintf(
                'Resource class %s must extend either ResourceData or ComputedResourceData',
                $className,
            ),
        );
    }
});

it('should have all concrete resource data classes as final', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Http/Resources', 'App\Http\Resources\\') as $className) {
        $reflection = new \ReflectionClass($className);

        // Skip abstract classes (like ResourceData base class)
        if ($reflection->isAbstract()) {
            continue;
        }

        expect($reflection->isFinal())->toBeTrue(
            \sprintf('Resource class %s should be final', $className),
        );
    }
});

it('should have from method in concrete resource data classes', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Http/Resources', 'App\Http\Resources\\') as $className) {
        $reflection = new \ReflectionClass($className);

        // Skip abstract classes (like ResourceData base class)
        if ($reflection->isAbstract()) {
            continue;
        }

        expect($reflection->hasMethod('from'))->toBeTrue(
            \sprintf('ResourceData class %s should have a from() method', $className),
        );
    }
});

it('should define EAGER_LOAD constant when using nested ResourceData', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Http/Resources', 'App\Http\Resources\\') as $className) {
        $reflection = new \ReflectionClass($className);

        // Skip abstract classes (like ResourceData base class)
        if ($reflection->isAbstract()) {
            continue;
        }

        // Check if constructor has any ResourceData-typed parameters
        $constructor = $reflection->getConstructor();
        if ($constructor === null) {
            continue;
        }

        $hasNestedResourceData = false;
        foreach ($constructor->getParameters() as $parameter) {
            $type = $parameter->getType();
            if ($type instanceof \ReflectionNamedType && !$type->isBuiltin()) {
                $typeName = $type->getName();
                if (is_subclass_of($typeName, ResourceData::class)) {
                    $hasNestedResourceData = true;

                    break;
                }
            }
        }

        // Also check for arrays that might contain ResourceData (property types)
        foreach ($reflection->getProperties() as $property) {
            $type = $property->getType();
            // Check docblock for array types like @var SetPartResourceData[]
            $docComment = $property->getDocComment();
            if ($docComment && preg_match('/@var\s+(\w+ResourceData)\[\]/', $docComment)) {
                $hasNestedResourceData = true;

                break;
            }
        }

        if (!$hasNestedResourceData) {
            continue;
        }

        // Verify EAGER_LOAD constant is defined in the concrete class (not just inherited)
        $eagerLoadConstant = $reflection->getReflectionConstant('EAGER_LOAD');

        expect($eagerLoadConstant)->not->toBeFalse(
            \sprintf(
                'ResourceData class %s has nested ResourceData but does not define EAGER_LOAD constant',
                $className,
            ),
        );

        expect($eagerLoadConstant->getDeclaringClass()->getName())->toBe(
            $className,
            \sprintf(
                'ResourceData class %s has nested ResourceData but does not define its own EAGER_LOAD constant',
                $className,
            ),
        );
    }
});
