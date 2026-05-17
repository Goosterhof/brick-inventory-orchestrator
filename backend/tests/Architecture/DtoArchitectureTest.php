<?php

declare(strict_types = 1);

/*
|--------------------------------------------------------------------------
| DataTransferObject — Core Structural Rules
|--------------------------------------------------------------------------
|
| Every class under App\DataTransferObjects\{Input,Result}\* must be a
| final readonly value carrier. Placement rules (Input vs Result by usage
| direction) live in DataTransferObjectPlacementTest.php.
|
 */

arch('data transfer objects should end with Data')
    ->expect('App\DataTransferObjects')
    ->toHaveSuffix('Data');

arch('data transfer objects should be readonly')
    ->expect('App\DataTransferObjects')
    ->toBeReadonly();

arch('data transfer objects should be final')
    ->expect('App\DataTransferObjects')
    ->toBeFinal();

it('should not have methods in DTOs', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/DataTransferObjects', 'App\DataTransferObjects\\') as $className) {
        $reflection = new \ReflectionClass($className);
        $methods = array_filter(
            $reflection->getMethods(),
            fn(\ReflectionMethod $reflectionMethod): bool => $reflectionMethod->getDeclaringClass()->getName() === $className,
        );

        $methodNames = array_map(fn(\ReflectionMethod $reflectionMethod): string => $reflectionMethod->getName(), $methods);
        $nonConstructorMethods = array_diff($methodNames, ['__construct']);

        expect($nonConstructorMethods)->toBeEmpty(
            \sprintf('DTO %s should only have __construct, found: %s', $className, implode(', ', $methodNames)),
        );
    }
});
