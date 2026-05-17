<?php

declare(strict_types = 1);

arch('enums should be backed enums')
    ->expect('App\Enums')
    ->toBeEnums();

it('should have string or int backing type in enums', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Enums', 'App\Enums\\') as $className) {
        $reflection = new \ReflectionEnum($className);

        expect($reflection->isBacked())->toBeTrue(
            \sprintf('Enum %s should be a backed enum (string or int)', $className),
        );
    }
});
