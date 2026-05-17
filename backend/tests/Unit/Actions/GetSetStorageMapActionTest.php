<?php

declare(strict_types = 1);

use App\Actions\GetSetStorageMapAction;
use App\DataTransferObjects\Result\Set\SetStorageMapData;
use App\DataTransferObjects\Result\Set\StorageMapEntryData;
use App\Models\Family;
use App\Models\Set;
use App\Models\StorageOptionPart;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Query\Builder as BaseBuilder;
use Illuminate\Support\Collection;

covers(GetSetStorageMapAction::class);

describe('GetSetStorageMapAction', function(): void {
    it('should return empty SetStorageMapData when set has no parts', function(): void {
        // arrange
        $uniqueCollection = \Mockery::mock(Collection::class);
        $uniqueCollection->shouldReceive('toArray')->once()->andReturn([]);

        $pluckedCollection = \Mockery::mock(Collection::class);
        $pluckedCollection->shouldReceive('unique')->once()->andReturn($uniqueCollection);

        $setParts = \Mockery::mock(HasMany::class);
        $setParts->shouldReceive('pluck')
            ->with('part_id')
            ->once()
            ->andReturn($pluckedCollection);

        $set = \Mockery::mock(Set::class);
        $set->shouldReceive('setParts')
            ->once()
            ->andReturn($setParts);

        $family = \Mockery::mock(Family::class);
        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);

        $action = new GetSetStorageMapAction($storageOptionPart);

        // act
        $result = $action->execute($set, $family);

        // assert
        expect($result)->toBeInstanceOf(SetStorageMapData::class)
            ->and($result->entries)->toBe([]);
    });

    it('should query storage option parts with correct family scope and return entry DTOs', function(): void {
        // arrange
        $uniqueCollection = \Mockery::mock(Collection::class);
        $uniqueCollection->shouldReceive('toArray')->once()->andReturn([10, 20]);

        $pluckedCollection = \Mockery::mock(Collection::class);
        $pluckedCollection->shouldReceive('unique')->once()->andReturn($uniqueCollection);

        $setParts = \Mockery::mock(HasMany::class);
        $setParts->shouldReceive('pluck')
            ->with('part_id')
            ->once()
            ->andReturn($pluckedCollection);

        $set = \Mockery::mock(Set::class);
        $set->shouldReceive('setParts')
            ->once()
            ->andReturn($setParts);

        $family = \Mockery::mock(Family::class);
        $family->shouldReceive('getAttribute')->with('id')->andReturn(1);

        $row = (object) [
            'part_id' => 10,
            'color_id' => 1,
            'storage_option_id' => 5,
            'storage_option_name' => 'Drawer A',
            'quantity' => 8,
        ];

        $base = \Mockery::mock(BaseBuilder::class);
        $base->shouldReceive('get')->once()->andReturn(new Collection([$row]));

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('join')
            ->with('storage_options', 'storage_option_parts.storage_option_id', '=', 'storage_options.id')
            ->once()
            ->andReturnSelf();
        $queryBuilder->shouldReceive('where')
            ->with('storage_options.family_id', 1)
            ->once()
            ->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')
            ->with('storage_option_parts.part_id', [10, 20])
            ->once()
            ->andReturnSelf();
        $queryBuilder->shouldReceive('select')
            ->once()
            ->andReturnSelf();
        $queryBuilder->shouldReceive('toBase')->once()->andReturn($base);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')
            ->once()
            ->andReturn($queryBuilder);

        $action = new GetSetStorageMapAction($storageOptionPart);

        // act
        $result = $action->execute($set, $family);

        // assert
        expect($result)->toBeInstanceOf(SetStorageMapData::class)
            ->and($result->entries)->toHaveCount(1)
            ->and($result->entries[0])->toBeInstanceOf(StorageMapEntryData::class)
            ->and($result->entries[0]->partId)->toBe(10)
            ->and($result->entries[0]->colorId)->toBe(1)
            ->and($result->entries[0]->storageOptionId)->toBe(5)
            ->and($result->entries[0]->storageOptionName)->toBe('Drawer A')
            ->and($result->entries[0]->quantity)->toBe(8);
    });

    it('should preserve null color_id in entry DTO', function(): void {
        // arrange
        $uniqueCollection = \Mockery::mock(Collection::class);
        $uniqueCollection->shouldReceive('toArray')->once()->andReturn([10]);

        $pluckedCollection = \Mockery::mock(Collection::class);
        $pluckedCollection->shouldReceive('unique')->once()->andReturn($uniqueCollection);

        $setParts = \Mockery::mock(HasMany::class);
        $setParts->shouldReceive('pluck')
            ->with('part_id')
            ->once()
            ->andReturn($pluckedCollection);

        $set = \Mockery::mock(Set::class);
        $set->shouldReceive('setParts')
            ->once()
            ->andReturn($setParts);

        $family = \Mockery::mock(Family::class);
        $family->shouldReceive('getAttribute')->with('id')->andReturn(1);

        $row = (object) [
            'part_id' => 10,
            'color_id' => null,
            'storage_option_id' => 5,
            'storage_option_name' => 'Mixed Bin',
            'quantity' => 3,
        ];

        $base = \Mockery::mock(BaseBuilder::class);
        $base->shouldReceive('get')->once()->andReturn(new Collection([$row]));

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('join')->once()->andReturnSelf();
        $queryBuilder->shouldReceive('where')->once()->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->once()->andReturnSelf();
        $queryBuilder->shouldReceive('select')->once()->andReturnSelf();
        $queryBuilder->shouldReceive('toBase')->once()->andReturn($base);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->once()->andReturn($queryBuilder);

        $action = new GetSetStorageMapAction($storageOptionPart);

        // act
        $result = $action->execute($set, $family);

        // assert
        expect($result->entries)->toHaveCount(1)
            ->and($result->entries[0]->colorId)->toBeNull();
    });
});
