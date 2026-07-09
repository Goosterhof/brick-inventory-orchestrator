<?php

declare(strict_types = 1);

use App\Actions\Sync\UpsertColorAction;
use App\DataTransferObjects\Input\Lego\LegoColorData;
use App\Models\Color;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;

covers(UpsertColorAction::class);

describe('UpsertColorAction', function(): void {
    it('should create a new color when it does not exist', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('rebrickable_id', 1)->once()->andReturnSelf();
        $queryBuilder->shouldReceive('first')->once()->andReturn(null);

        $newColorSavedValues = [];
        $newColor = \Mockery::mock(Color::class);
        $newColor->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$newColorSavedValues): void {
            $newColorSavedValues[$key] = $value;
        });
        $newColor->allows('getAttribute')->andReturnUsing(function($key) use (&$newColorSavedValues): mixed {
            return $newColorSavedValues[$key] ?? null;
        });
        $newColor->shouldReceive('save')->once();

        $color = \Mockery::mock(Color::class);
        $color->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $color->shouldReceive('newInstance')->once()->andReturn($newColor);

        $action = new UpsertColorAction($color, $connection);

        $data = new LegoColorData(
            id: 1,
            name: 'White',
            rgb: 'FFFFFF',
            isTransparent: false,
        );

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($newColor);
        expect($newColorSavedValues['rebrickable_id'])->toBe(1);
        expect($newColorSavedValues['name'])->toBe('White');
        expect($newColorSavedValues['rgb'])->toBe('FFFFFF');
        expect($newColorSavedValues['is_transparent'])->toBeFalse();
    });

    it('should update an existing color when it exists', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $existingSavedValues = ['id' => 1, 'rebrickable_id' => 1];
        $existingColor = \Mockery::mock(Color::class);
        $existingColor->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$existingSavedValues): void {
            $existingSavedValues[$key] = $value;
        });
        $existingColor->allows('getAttribute')->andReturnUsing(function($key) use (&$existingSavedValues): mixed {
            return $existingSavedValues[$key] ?? null;
        });
        $existingColor->shouldReceive('save')->once();

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('rebrickable_id', 1)->once()->andReturnSelf();
        $queryBuilder->shouldReceive('first')->once()->andReturn($existingColor);

        $color = \Mockery::mock(Color::class);
        $color->shouldReceive('newQuery')->once()->andReturn($queryBuilder);

        $action = new UpsertColorAction($color, $connection);

        $data = new LegoColorData(
            id: 1,
            name: 'Updated White',
            rgb: 'FFFFF0',
            isTransparent: false,
        );

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($existingColor);
        expect($existingSavedValues['name'])->toBe('Updated White');
        expect($existingSavedValues['rgb'])->toBe('FFFFF0');
    });

    it('should handle transparent colors', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturn(null);

        $newColorSavedValues = [];
        $newColor = \Mockery::mock(Color::class);
        $newColor->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$newColorSavedValues): void {
            $newColorSavedValues[$key] = $value;
        });
        $newColor->allows('getAttribute')->andReturnUsing(function($key) use (&$newColorSavedValues): mixed {
            return $newColorSavedValues[$key] ?? null;
        });
        $newColor->shouldReceive('save')->once();

        $color = \Mockery::mock(Color::class);
        $color->shouldReceive('newQuery')->andReturn($queryBuilder);
        $color->shouldReceive('newInstance')->andReturn($newColor);

        $action = new UpsertColorAction($color, $connection);

        $data = new LegoColorData(
            id: 41,
            name: 'Trans-Red',
            rgb: 'FF0000',
            isTransparent: true,
        );

        // act
        $result = $action->execute($data);

        // assert
        expect($newColorSavedValues['name'])->toBe('Trans-Red');
        expect($newColorSavedValues['is_transparent'])->toBeTrue();
    });

    it('should retry and update on unique constraint violation', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')
            ->twice()
            ->andReturnUsing(fn(\Closure $callback) => $callback());

        // First attempt: new instance whose save throws
        $newInstance = \Mockery::mock(Color::class);
        $newInstance->allows('setAttribute');
        $newInstance->allows('getAttribute');
        $newInstance->shouldReceive('save')->once()
            ->andThrow(new UniqueConstraintViolationException('default', 'INSERT', [], new \Exception('dup')));

        // Retry: existing record found and updated
        $existingValues = [];
        $existingInstance = \Mockery::mock(Color::class);
        $existingInstance->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$existingValues): void {
            $existingValues[$key] = $value;
        });
        $existingInstance->allows('getAttribute')->andReturnUsing(function($key) use (&$existingValues): mixed {
            return $existingValues[$key] ?? null;
        });
        $existingInstance->shouldReceive('save')->once();

        // First query: find nothing
        $builder1 = \Mockery::mock(Builder::class);
        $builder1->shouldReceive('where')->with('rebrickable_id', 1)->once()->andReturnSelf();
        $builder1->shouldReceive('first')->once()->andReturn(null);

        // Retry query: find existing
        $builder2 = \Mockery::mock(Builder::class);
        $builder2->shouldReceive('where')->with('rebrickable_id', 1)->once()->andReturnSelf();
        $builder2->shouldReceive('firstOrFail')->once()->andReturn($existingInstance);

        $color = \Mockery::mock(Color::class);
        $color->shouldReceive('newQuery')->twice()->andReturn($builder1, $builder2);
        $color->shouldReceive('newInstance')->once()->andReturn($newInstance);

        $action = new UpsertColorAction($color, $connection);

        $data = new LegoColorData(
            id: 1,
            name: 'White',
            rgb: 'FFFFFF',
            isTransparent: false,
        );

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($existingInstance)
            ->and($existingValues['name'])->toBe('White')
            ->and($existingValues['rgb'])->toBe('FFFFFF')
            ->and($existingValues['is_transparent'])->toBeFalse();
    });
});
