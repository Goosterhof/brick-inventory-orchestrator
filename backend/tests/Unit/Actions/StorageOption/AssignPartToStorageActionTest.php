<?php

declare(strict_types = 1);

use App\Actions\StorageOption\AssignPartToStorageAction;
use App\DataTransferObjects\Input\StorageOption\AssignPartToStorageData;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;

covers(AssignPartToStorageAction::class);

describe('AssignPartToStorageAction', function(): void {
    it('should create a new assignment when one does not exist', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $savedValues = [];
        $storageOptionPartInstance = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPartInstance->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $storageOptionPartInstance->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $storageOptionPartInstance->shouldReceive('save')->once();

        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('where')->with('storage_option_id', 1)->once()->andReturnSelf();
        $builder->shouldReceive('where')->with('part_id', 2)->once()->andReturnSelf();
        $builder->shouldReceive('where')->with('color_id', null)->once()->andReturnSelf();
        $builder->shouldReceive('first')->once()->andReturn(null);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->withNoArgs()->once()->andReturn($builder);
        $storageOptionPart->shouldReceive('newInstance')->withNoArgs()->once()->andReturn($storageOptionPartInstance);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->allows('getAttribute')->with('id')->andReturn(1);

        $action = new AssignPartToStorageAction($storageOptionPart, $connection);
        $data = new AssignPartToStorageData(
            partId: 2,
            colorId: null,
            quantity: 50,
        );

        // act
        $result = $action->execute($storageOption, $data);

        // assert
        expect($result)->toBe($storageOptionPartInstance)
            ->and($savedValues['storage_option_id'])->toBe(1)
            ->and($savedValues['part_id'])->toBe(2)
            ->and($savedValues['color_id'])->toBeNull()
            ->and($savedValues['quantity'])->toBe(50);
    });

    it('should update existing assignment when one exists', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $existingSavedValues = [];
        $existingInstance = \Mockery::mock(StorageOptionPart::class);
        $existingInstance->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$existingSavedValues): void {
            $existingSavedValues[$key] = $value;
        });
        $existingInstance->allows('getAttribute')->andReturnUsing(function($key) use (&$existingSavedValues): mixed {
            return $existingSavedValues[$key] ?? null;
        });
        $existingInstance->shouldReceive('save')->once();

        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('where')->with('storage_option_id', 1)->once()->andReturnSelf();
        $builder->shouldReceive('where')->with('part_id', 2)->once()->andReturnSelf();
        $builder->shouldReceive('where')->with('color_id', 3)->once()->andReturnSelf();
        $builder->shouldReceive('first')->once()->andReturn($existingInstance);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->withNoArgs()->once()->andReturn($builder);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->allows('getAttribute')->with('id')->andReturn(1);

        $action = new AssignPartToStorageAction($storageOptionPart, $connection);
        $data = new AssignPartToStorageData(
            partId: 2,
            colorId: 3,
            quantity: 100,
        );

        // act
        $result = $action->execute($storageOption, $data);

        // assert
        expect($result)->toBe($existingInstance)
            ->and($existingSavedValues['quantity'])->toBe(100);
    });

    it('should call save on the storage option part', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $storageOptionPartInstance = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPartInstance->allows('setAttribute');
        $storageOptionPartInstance->allows('getAttribute');
        $storageOptionPartInstance->shouldReceive('save')->once();

        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('where')->andReturnSelf();
        $builder->shouldReceive('first')->andReturn(null);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->andReturn($builder);
        $storageOptionPart->shouldReceive('newInstance')->andReturn($storageOptionPartInstance);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->allows('getAttribute')->with('id')->andReturn(1);

        $action = new AssignPartToStorageAction($storageOptionPart, $connection);
        $data = new AssignPartToStorageData(
            partId: 2,
            colorId: null,
            quantity: 100,
        );

        // act
        $action->execute($storageOption, $data);

        // assert - Mockery expectations verify the interactions
    });

    it('should retry and update on unique constraint violation', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')
            ->twice()
            ->andReturnUsing(fn(\Closure $callback) => $callback());

        // First attempt: new instance whose save throws
        $newInstance = \Mockery::mock(StorageOptionPart::class);
        $newInstance->allows('setAttribute');
        $newInstance->allows('getAttribute');
        $newInstance->shouldReceive('save')->once()
            ->andThrow(new UniqueConstraintViolationException('default', 'INSERT', [], new \Exception('dup')));

        // Retry: existing record found and updated
        $existingValues = [];
        $existingInstance = \Mockery::mock(StorageOptionPart::class);
        $existingInstance->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$existingValues): void {
            $existingValues[$key] = $value;
        });
        $existingInstance->allows('getAttribute')->andReturnUsing(function($key) use (&$existingValues): mixed {
            return $existingValues[$key] ?? null;
        });
        $existingInstance->shouldReceive('save')->once();

        // First query: find nothing
        $builder1 = \Mockery::mock(Builder::class);
        $builder1->shouldReceive('where')->with('storage_option_id', 1)->once()->andReturnSelf();
        $builder1->shouldReceive('where')->with('part_id', 2)->once()->andReturnSelf();
        $builder1->shouldReceive('where')->with('color_id', 3)->once()->andReturnSelf();
        $builder1->shouldReceive('first')->once()->andReturn(null);

        // Retry query: find existing
        $builder2 = \Mockery::mock(Builder::class);
        $builder2->shouldReceive('where')->with('storage_option_id', 1)->once()->andReturnSelf();
        $builder2->shouldReceive('where')->with('part_id', 2)->once()->andReturnSelf();
        $builder2->shouldReceive('where')->with('color_id', 3)->once()->andReturnSelf();
        $builder2->shouldReceive('firstOrFail')->once()->andReturn($existingInstance);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->twice()->andReturn($builder1, $builder2);
        $storageOptionPart->shouldReceive('newInstance')->once()->andReturn($newInstance);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->allows('getAttribute')->with('id')->andReturn(1);

        $action = new AssignPartToStorageAction($storageOptionPart, $connection);
        $data = new AssignPartToStorageData(partId: 2, colorId: 3, quantity: 50);

        // act
        $result = $action->execute($storageOption, $data);

        // assert
        expect($result)->toBe($existingInstance)
            ->and($existingValues['quantity'])->toBe(50);
    });
});
