<?php

declare(strict_types = 1);

use App\Actions\StorageOption\GetStorageOptionsAction;
use App\Models\Family;
use App\Models\StorageOption;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

covers(GetStorageOptionsAction::class);

describe('GetStorageOptionsAction', function(): void {
    it('should query storage options by family id', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(5);

        $collection = new Collection;

        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('where')
            ->with('family_id', 5)
            ->once()
            ->andReturnSelf();
        $builder->shouldReceive('whereNull')
            ->with('parent_id')
            ->once()
            ->andReturnSelf();
        $builder->shouldReceive('orderBy')
            ->with('id')
            ->once()
            ->andReturnSelf();
        $builder->shouldReceive('get')
            ->once()
            ->andReturn($collection);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')
            ->once()
            ->andReturn($builder);

        $action = new GetStorageOptionsAction($storageOption);

        // act
        $result = $action->execute($family);

        // assert
        expect($result)->toBe($collection);
    });
});
