<?php

declare(strict_types = 1);

use App\Http\Resources\ColorResourceData;
use App\Http\Resources\PartResourceData;
use App\Http\Resources\StorageOptionPartResourceData;
use App\Models\Color;
use App\Models\Part;
use App\Models\StorageOptionPart;
use Mockery\MockInterface;

covers(StorageOptionPartResourceData::class);

function mockStorageOptionPart(array $overrides = []): MockInterface&StorageOptionPart
{
    $part = \Mockery::mock(Part::class);
    $part->allows('getAttribute')->with('id')->andReturn($overrides['part_id'] ?? 20);
    $part->allows('getAttribute')->with('part_num')->andReturn($overrides['part_num'] ?? '3001');
    $part->allows('getAttribute')->with('name')->andReturn($overrides['part_name'] ?? 'Brick 2 x 4');
    $part->allows('getAttribute')->with('category')->andReturn($overrides['part_category'] ?? 'Bricks');
    $part->allows('getAttribute')->with('image_url')->andReturn($overrides['part_image_url'] ?? 'https://example.com/3001.jpg');

    $color = null;
    if (($overrides['has_color'] ?? true) === true) {
        $color = \Mockery::mock(Color::class);
        $color->allows('getAttribute')->with('id')->andReturn($overrides['color_id'] ?? 5);
        $color->allows('getAttribute')->with('name')->andReturn($overrides['color_name'] ?? 'Red');
        $color->allows('getAttribute')->with('rgb')->andReturn($overrides['color_rgb'] ?? 'CC0000');
        $color->allows('getAttribute')->with('is_transparent')->andReturn($overrides['color_transparent'] ?? false);
    }

    $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
    $storageOptionPart->allows('getAttribute')->with('id')->andReturn($overrides['id'] ?? 1);
    $storageOptionPart->allows('getAttribute')->with('storage_option_id')->andReturn($overrides['storage_option_id'] ?? 10);
    $storageOptionPart->allows('getAttribute')->with('quantity')->andReturn($overrides['quantity'] ?? 15);
    $storageOptionPart->allows('getAttribute')->with('part')->andReturn($part);
    $storageOptionPart->allows('getAttribute')->with('color')->andReturn($color);
    $storageOptionPart->shouldReceive('loadMissing')->andReturnSelf();

    return $storageOptionPart;
}

describe('StorageOptionPartResourceData', function(): void {
    it('should convert storage option part model to resource data with nested part and color', function(): void {
        // arrange
        $storageOptionPart = mockStorageOptionPart();

        // act
        $resource = StorageOptionPartResourceData::from($storageOptionPart);

        // assert
        expect($resource)->toBeInstanceOf(StorageOptionPartResourceData::class)
            ->and($resource->id)->toBe(1)
            ->and($resource->storage_option_id)->toBe(10)
            ->and($resource->quantity)->toBe(15)
            ->and($resource->part)->toBeInstanceOf(PartResourceData::class)
            ->and($resource->part->part_num)->toBe('3001')
            ->and($resource->part->name)->toBe('Brick 2 x 4')
            ->and($resource->color)->toBeInstanceOf(ColorResourceData::class)
            ->and($resource->color->name)->toBe('Red');
    });

    it('should handle nullable color', function(): void {
        // arrange
        $storageOptionPart = mockStorageOptionPart(['has_color' => false]);

        // act
        $resource = StorageOptionPartResourceData::from($storageOptionPart);

        // assert
        expect($resource->color)->toBeNull();
    });

    it('should convert to array format with nested objects', function(): void {
        // arrange
        $storageOptionPart = mockStorageOptionPart();

        // act
        $array = StorageOptionPartResourceData::from($storageOptionPart)->toArray();

        // assert
        expect($array)->toBeArray()
            ->and($array['id'])->toBe(1)
            ->and($array['storage_option_id'])->toBe(10)
            ->and($array['quantity'])->toBe(15)
            ->and($array['part'])->toBeArray()
            ->and($array['part']['part_num'])->toBe('3001')
            ->and($array['color'])->toBeArray()
            ->and($array['color']['name'])->toBe('Red');
    });

    it('should serialize null color as null in array output', function(): void {
        // arrange
        $storageOptionPart = mockStorageOptionPart(['has_color' => false]);

        // act
        $array = StorageOptionPartResourceData::from($storageOptionPart)->toArray();

        // assert
        expect($array['color'])->toBeNull();
    });
});
