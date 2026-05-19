<?php

declare(strict_types = 1);

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

arch('models should extend Illuminate\Database\Eloquent\Model')
    ->expect('App\Models')
    ->toExtend(Model::class);

it('should have @property annotations in models', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Models', 'App\Models\\') as $className) {
        // Skip User model as it may have special Laravel requirements
        if ($className === User::class) {
            continue;
        }

        $reflection = new \ReflectionClass($className);
        $docComment = $reflection->getDocComment();

        expect($docComment)->not->toBeFalse(
            \sprintf('Model %s should have a docblock with @property annotations', $className),
        );

        expect(str_contains($docComment, '@property'))->toBeTrue(
            \sprintf('Model %s should have @property annotations in its docblock', $className),
        );
    }
});

it('should not have fillable property in models', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Models', 'App\Models\\') as $className) {
        $reflection = new \ReflectionClass($className);
        $hasFillable = array_any($reflection->getProperties(), fn($property): bool => $property->getDeclaringClass()->getName() === $className && $property->getName() === 'fillable');

        expect($hasFillable)->toBeFalse(
            \sprintf('Model %s should not have $fillable property - use explicit property assignment instead (ADR-0017 / War Room ADR-0019)', $className),
        );
    }
});

it('should not have guarded property in models', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Models', 'App\Models\\') as $className) {
        $reflection = new \ReflectionClass($className);
        $hasGuarded = array_any($reflection->getProperties(), fn($property): bool => $property->getDeclaringClass()->getName() === $className && $property->getName() === 'guarded');

        expect($hasGuarded)->toBeFalse(
            \sprintf('Model %s should not have $guarded property - use explicit property assignment instead (ADR-0017 / War Room ADR-0019)', $className),
        );
    }
});

it('should not use mass-assignment methods in application code', function(): void {
    $appDir = \dirname(__DIR__, 2) . '/app';
    $bannedPatterns = [
        '::create(' => 'Model::create()',
        '->fill(' => '$model->fill()',
        '->forceFill(' => '$model->forceFill()',
    ];

    foreach ($bannedPatterns as $pattern => $description) {
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($appDir, \FilesystemIterator::SKIP_DOTS),
        );

        foreach ($files as $file) {
            if ($file->getExtension() !== 'php') {
                continue;
            }

            $contents = file_get_contents($file->getPathname());
            $relativePath = str_replace($appDir . '/', '', $file->getPathname());

            expect(str_contains($contents, $pattern))->toBeFalse(
                \sprintf('%s uses %s - use explicit property assignment instead (ADR-0017 / War Room ADR-0019)', $relativePath, $description),
            );
        }
    }
});

it('should have family relationship in models with family_id', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Models', 'App\Models\\') as $className) {
        $reflection = new \ReflectionClass($className);
        $docComment = $reflection->getDocComment();

        if ($docComment === false) {
            continue;
        }

        // Check if model has family_id property annotation
        if (!preg_match('/@property.*\$family_id/', $docComment)) {
            continue;
        }

        // Model has family_id, so it should have a family() method
        expect($reflection->hasMethod('family'))->toBeTrue(
            \sprintf('Model %s has family_id but is missing family() relationship method', $className),
        );
    }
});
