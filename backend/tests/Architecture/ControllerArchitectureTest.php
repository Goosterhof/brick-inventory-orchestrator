<?php

declare(strict_types = 1);

use App\Contracts\ResourceResponseInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

/*
|--------------------------------------------------------------------------
| Controller Architecture
|--------------------------------------------------------------------------
|
| Controllers are thin HTTP handlers that:
| - End with "Controller" suffix
| - Delegate business logic to Action classes
| - Return JsonResponse or array (for collections)
| - Do NOT use try-catch blocks (exception handling is global)
| - Do NOT return ResourceData directly (use ->toResponse() instead)
| - Do NOT have constructors — use method injection for all dependencies
|
 */

/**
 * Extract all type names from a reflection type (handles named, union, and intersection types).
 *
 * @return list<string>
 */
function getTypeNames(\ReflectionType $reflectionType): array
{
    if ($reflectionType instanceof \ReflectionNamedType) {
        return [$reflectionType->getName()];
    }

    if ($reflectionType instanceof \ReflectionUnionType || $reflectionType instanceof \ReflectionIntersectionType) {
        $names = [];
        foreach ($reflectionType->getTypes() as $subType) {
            $names = array_merge($names, getTypeNames($subType));
        }

        return $names;
    }

    return [];
}

arch('controllers should end with Controller')
    ->expect('App\Http\Controllers')
    ->toHaveSuffix('Controller');

arch('controllers should not use Eloquent Builder directly')
    ->expect('App\Http\Controllers')
    ->not->toUse(Builder::class);

it('should have controller methods return JsonResponse or array', function(): void {
    $allowedReturnTypes = [JsonResponse::class, 'array'];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Http/Controllers', 'App\Http\Controllers\\') as $className) {
        $reflection = new \ReflectionClass($className);

        // Skip abstract base Controller class
        if ($reflection->isAbstract()) {
            continue;
        }

        foreach ($reflection->getMethods(\ReflectionMethod::IS_PUBLIC) as $method) {
            // Skip inherited methods and constructor
            if ($method->getDeclaringClass()->getName() !== $className) {
                continue;
            }

            if ($method->getName() === '__construct') {
                continue;
            }

            $returnType = $method->getReturnType();

            expect($returnType)->not->toBeNull(
                \sprintf('Controller method %s::%s() should have a return type', $className, $method->getName()),
            );

            $typeNames = getTypeNames($returnType);
            foreach ($typeNames as $typeName) {
                expect(\in_array($typeName, $allowedReturnTypes, true))->toBeTrue(
                    \sprintf(
                        'Controller method %s::%s() should return JsonResponse or array, got %s',
                        $className,
                        $method->getName(),
                        $typeName,
                    ),
                );
            }
        }
    }
});

it('should not return ResourceResponse directly from controller methods', function(): void {
    $methodsChecked = 0;

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Http/Controllers', 'App\Http\Controllers\\') as $className) {
        $reflection = new \ReflectionClass($className);

        // Skip abstract base Controller class
        if ($reflection->isAbstract()) {
            continue;
        }

        foreach ($reflection->getMethods(\ReflectionMethod::IS_PUBLIC) as $method) {
            // Skip inherited methods and constructor
            if ($method->getDeclaringClass()->getName() !== $className) {
                continue;
            }

            if ($method->getName() === '__construct') {
                continue;
            }

            $returnType = $method->getReturnType();
            if ($returnType === null) {
                continue;
            }

            $methodsChecked++;
            $typeNames = getTypeNames($returnType);
            foreach ($typeNames as $typeName) {
                // Check if return type implements ResourceResponse (covers both ResourceData and ComputedResourceData)
                if (class_exists($typeName) && is_subclass_of($typeName, ResourceResponseInterface::class)) {
                    expect(false)->toBeTrue(
                        \sprintf(
                            'Controller method %s::%s() should not return ResourceResponse directly. Use ->toResponse() instead.',
                            $className,
                            $method->getName(),
                        ),
                    );
                }
            }
        }
    }

    expect($methodsChecked)->toBeGreaterThan(0);
});

it('should not have constructors in controllers', function(): void {
    $controllersChecked = 0;

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Http/Controllers', 'App\Http\Controllers\\') as $className) {
        $reflection = new \ReflectionClass($className);

        if ($reflection->isAbstract()) {
            continue;
        }

        $controllersChecked++;
        $constructor = $reflection->getConstructor();

        // Constructor must either not exist or be inherited (not declared in the controller itself)
        if ($constructor !== null) {
            expect($constructor->getDeclaringClass()->getName())->not->toBe(
                $className,
                \sprintf(
                    'Controller %s should not have a constructor. Use method injection instead.',
                    $className,
                ),
            );
        }
    }

    expect($controllersChecked)->toBeGreaterThan(0);
});

it('should not use try-catch blocks in controllers', function(): void {
    $controllersDir = \dirname(__DIR__, 2) . '/app/Http/Controllers';
    $filesChecked = 0;

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

        $filename = $file->getFilename();

        // Skip base Controller class
        if ($filename === 'Controller.php') {
            continue;
        }

        $filesChecked++;
        $content = file_get_contents($file->getPathname());
        $tokens = token_get_all($content);
        $relativePath = str_replace($controllersDir . '/', '', $file->getPathname());

        foreach ($tokens as $token) {
            if (\is_array($token) && $token[0] === \T_TRY) {
                expect(false)->toBeTrue(
                    \sprintf(
                        'Controller %s should not use try-catch blocks. Exception handling is done globally in bootstrap/app.php.',
                        $relativePath,
                    ),
                );
            }
        }
    }

    expect($filesChecked)->toBeGreaterThan(0);
});
