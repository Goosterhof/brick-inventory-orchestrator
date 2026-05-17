<?php

declare(strict_types = 1);

use App\Http\Resources\StorageOptionResourceData;
use App\Models\StorageOption;
use Illuminate\Support\Collection;

covers(StorageOptionResourceData::class);

describe('StorageOptionResourceData', function(): void {
    it('should convert storage option model to resource data with child_ids', function(): void {
        // arrange
        $child1 = \Mockery::mock(StorageOption::class);
        $child1->allows('getAttribute')->with('id')->andReturn(10);
        $child1->allows('offsetExists')->with('id')->andReturnTrue();
        $child1->allows('offsetGet')->with('id')->andReturn(10);

        $child2 = \Mockery::mock(StorageOption::class);
        $child2->allows('getAttribute')->with('id')->andReturn(11);
        $child2->allows('offsetExists')->with('id')->andReturnTrue();
        $child2->allows('offsetGet')->with('id')->andReturn(11);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->allows('getAttribute')->with('id')->andReturn(1);
        $storageOption->allows('getAttribute')->with('name')->andReturn('Drawer A1');
        $storageOption->allows('getAttribute')->with('description')->andReturn('Top left drawer');
        $storageOption->allows('getAttribute')->with('parent_id')->andReturn(null);
        $storageOption->allows('getAttribute')->with('row')->andReturn(1);
        $storageOption->allows('getAttribute')->with('column')->andReturn(1);
        $storageOption->allows('getAttribute')->with('grid_rows')->andReturn(null);
        $storageOption->allows('getAttribute')->with('grid_columns')->andReturn(null);
        $storageOption->allows('getAttribute')->with('children')->andReturn(new Collection([$child1, $child2]));
        $storageOption->shouldReceive('loadMissing')->andReturnSelf();
        $storageOption->shouldReceive('relationLoaded')->with('children')->andReturnTrue();

        // act
        $resource = StorageOptionResourceData::from($storageOption);

        // assert
        expect($resource)->toBeInstanceOf(StorageOptionResourceData::class)
            ->and($resource->id)->toBe(1)
            ->and($resource->name)->toBe('Drawer A1')
            ->and($resource->description)->toBe('Top left drawer')
            ->and($resource->parent_id)->toBeNull()
            ->and($resource->row)->toBe(1)
            ->and($resource->column)->toBe(1)
            ->and($resource->grid_rows)->toBeNull()
            ->and($resource->grid_columns)->toBeNull()
            ->and($resource->child_ids)->toBe([10, 11]);
    });

    it('should handle empty children', function(): void {
        // arrange
        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->allows('getAttribute')->with('id')->andReturn(2);
        $storageOption->allows('getAttribute')->with('name')->andReturn('Box B');
        $storageOption->allows('getAttribute')->with('description')->andReturn(null);
        $storageOption->allows('getAttribute')->with('parent_id')->andReturn(1);
        $storageOption->allows('getAttribute')->with('row')->andReturn(null);
        $storageOption->allows('getAttribute')->with('column')->andReturn(null);
        $storageOption->allows('getAttribute')->with('grid_rows')->andReturn(null);
        $storageOption->allows('getAttribute')->with('grid_columns')->andReturn(null);
        $storageOption->allows('getAttribute')->with('children')->andReturn(new Collection([]));
        $storageOption->shouldReceive('loadMissing')->andReturnSelf();
        $storageOption->shouldReceive('relationLoaded')->with('children')->andReturnTrue();

        // act
        $resource = StorageOptionResourceData::from($storageOption);

        // assert
        expect($resource->child_ids)->toBeArray()
            ->and($resource->child_ids)->toBeEmpty()
            ->and($resource->parent_id)->toBe(1)
            ->and($resource->description)->toBeNull()
            ->and($resource->row)->toBeNull()
            ->and($resource->column)->toBeNull()
            ->and($resource->grid_rows)->toBeNull()
            ->and($resource->grid_columns)->toBeNull();
    });

    it('should pass through child_ids as plain ints in array output', function(): void {
        // arrange
        $child = \Mockery::mock(StorageOption::class);
        $child->allows('getAttribute')->with('id')->andReturn(5);
        $child->allows('offsetExists')->with('id')->andReturnTrue();
        $child->allows('offsetGet')->with('id')->andReturn(5);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->allows('getAttribute')->with('id')->andReturn(1);
        $storageOption->allows('getAttribute')->with('name')->andReturn('Shelf');
        $storageOption->allows('getAttribute')->with('description')->andReturn(null);
        $storageOption->allows('getAttribute')->with('parent_id')->andReturn(null);
        $storageOption->allows('getAttribute')->with('row')->andReturn(null);
        $storageOption->allows('getAttribute')->with('column')->andReturn(null);
        $storageOption->allows('getAttribute')->with('grid_rows')->andReturn(null);
        $storageOption->allows('getAttribute')->with('grid_columns')->andReturn(null);
        $storageOption->allows('getAttribute')->with('children')->andReturn(new Collection([$child]));
        $storageOption->shouldReceive('loadMissing')->andReturnSelf();
        $storageOption->shouldReceive('relationLoaded')->with('children')->andReturnTrue();

        // act
        $array = StorageOptionResourceData::from($storageOption)->toArray();

        // assert
        expect($array['child_ids'])->toBe([5]);
    });

    it('should declare children in EAGER_LOAD', function(): void {
        expect(StorageOptionResourceData::EAGER_LOAD)->toBe(['children']);
    });

    it('should expose grid_rows and grid_columns when the model has them set', function(): void {
        // arrange
        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->allows('getAttribute')->with('id')->andReturn(3);
        $storageOption->allows('getAttribute')->with('name')->andReturn('Section');
        $storageOption->allows('getAttribute')->with('description')->andReturn(null);
        $storageOption->allows('getAttribute')->with('parent_id')->andReturn(1);
        $storageOption->allows('getAttribute')->with('row')->andReturn(null);
        $storageOption->allows('getAttribute')->with('column')->andReturn(null);
        $storageOption->allows('getAttribute')->with('grid_rows')->andReturn(5);
        $storageOption->allows('getAttribute')->with('grid_columns')->andReturn(6);
        $storageOption->allows('getAttribute')->with('children')->andReturn(new Collection([]));
        $storageOption->shouldReceive('loadMissing')->andReturnSelf();
        $storageOption->shouldReceive('relationLoaded')->with('children')->andReturnTrue();

        // act
        $resource = StorageOptionResourceData::from($storageOption);
        $array = $resource->toArray();

        // assert
        expect($resource->grid_rows)->toBe(5)
            ->and($resource->grid_columns)->toBe(6)
            ->and($array['grid_rows'])->toBe(5)
            ->and($array['grid_columns'])->toBe(6);
    });
});
