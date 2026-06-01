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

/**
 * Discover every nested-resource construction in a ResourceData's from() method body and
 * map it to the model relation it is sourced from.
 *
 * Recognises both nesting forms used in this wing:
 *   1. Direct:        SetSummaryResourceData::from($model->set)
 *   2. Array-mapped:  array_map(SetPartResourceData::from(...), $model->setParts->all())
 *
 * @return array<int, array{resource: class-string, relation: string}>
 */
function discoverNestedResourceRelations(\ReflectionClass $reflectionClass): array
{
    $method = $reflectionClass->getMethod('from');
    $file = $method->getFileName();
    if ($file === false) {
        return [];
    }

    $lines = file($file, \FILE_IGNORE_NEW_LINES);
    $startLine = $method->getStartLine();
    $endLine = $method->getEndLine();
    if ($lines === false || $startLine === false || $endLine === false) {
        return [];
    }

    $body = implode("\n", \array_slice($lines, $startLine - 1, $endLine - $startLine + 1));

    $namespace = $reflectionClass->getNamespaceName();
    $nested = [];

    // Form 1: <Resource>::from($model-><relation>)
    if (preg_match_all('/(\w+ResourceData)::from\(\$model->(\w+)\)/', $body, $matches, \PREG_SET_ORDER)) {
        foreach ($matches as $match) {
            $nested[] = ['resource' => $namespace . '\\' . $match[1], 'relation' => $match[2]];
        }
    }

    // Form 2: array_map(<Resource>::from(...), $model-><relation>...)
    if (preg_match_all('/(\w+ResourceData)::from\(\.\.\.\)\s*,\s*\$model->(\w+)/', $body, $matches, \PREG_SET_ORDER)) {
        foreach ($matches as $match) {
            $nested[] = ['resource' => $namespace . '\\' . $match[1], 'relation' => $match[2]];
        }
    }

    return $nested;
}

it("should declare EAGER_LOAD entries that cover every nested resource's required relations", function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Http/Resources', 'App\Http\Resources\\') as $className) {
        $reflection = new \ReflectionClass($className);
        if ($reflection->isAbstract()) {
            continue;
        }

        if (!$reflection->hasMethod('from')) {
            continue;
        }

        $nestedRelations = discoverNestedResourceRelations($reflection);
        if ($nestedRelations === []) {
            continue;
        }

        /** @var array<int, string> $eagerLoad */
        $eagerLoad = $reflection->getConstant('EAGER_LOAD');

        foreach ($nestedRelations as $nested) {
            $relation = $nested['relation'];
            $nestedResource = $nested['resource'];

            // The relation that supplies the nested resource must itself be eager-loaded —
            // either as the bare relation ("setParts") or via a nested entry ("setParts.part"),
            // since Eloquent loads the intermediate relation when a dotted child is requested.
            $relationCovered = \in_array($relation, $eagerLoad, true)
                || array_any($eagerLoad, static fn(string $entry): bool => str_starts_with($entry, $relation . '.'));

            expect($relationCovered)->toBeTrue(
                \sprintf(
                    'ResourceData class %s nests %s from $model->%s but EAGER_LOAD does not declare "%s"',
                    $className,
                    $nestedResource,
                    $relation,
                    $relation,
                ),
            );

            // Every relation the nested resource itself requires must be declared relation-prefixed
            // on the parent, so the base loadMissing() covers the whole tree in one pass (no N+1).
            /** @var array<int, string> $nestedEagerLoad */
            $nestedEagerLoad = \constant($nestedResource . '::EAGER_LOAD');

            foreach ($nestedEagerLoad as $nestedRelation) {
                $expected = $relation . '.' . $nestedRelation;

                expect(\in_array($expected, $eagerLoad, true))->toBeTrue(
                    \sprintf(
                        'ResourceData class %s nests %s (which requires "%s") from $model->%s, '
                        . 'but EAGER_LOAD omits "%s" — this fires an N+1 (one query per row) on collection endpoints',
                        $className,
                        $nestedResource,
                        $nestedRelation,
                        $relation,
                        $expected,
                    ),
                );
            }
        }
    }
});
