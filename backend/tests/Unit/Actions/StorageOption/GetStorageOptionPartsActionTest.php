<?php

declare(strict_types = 1);

use App\Actions\StorageOption\GetStorageOptionPartsAction;
use App\Models\StorageOption;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\HasMany;

covers(GetStorageOptionPartsAction::class);

describe('GetStorageOptionPartsAction', function(): void {
    it('should query storage option parts', function(): void {
        // arrange
        $collection = new Collection;

        $relation = \Mockery::mock(HasMany::class);
        $relation->shouldReceive('orderBy')
            ->with('id')
            ->once()
            ->andReturnSelf();
        $relation->shouldReceive('get')
            ->once()
            ->andReturn($collection);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('storageOptionParts')
            ->once()
            ->andReturn($relation);

        $action = new GetStorageOptionPartsAction;

        // act
        $result = $action->execute($storageOption);

        // assert
        expect($result)->toBe($collection);
    });
});
