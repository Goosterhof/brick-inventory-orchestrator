<?php

declare(strict_types = 1);

use App\Http\Resources\ColorResourceData;
use App\Http\Resources\PartResourceData;
use App\Http\Resources\SetPartResourceData;
use App\Models\Color;
use App\Models\Part;
use App\Models\SetPart;
use Mockery\MockInterface;

covers(SetPartResourceData::class);

function mockSetPart(array $overrides = []): MockInterface&SetPart
{
    $part = \Mockery::mock(Part::class);
    $part->allows('getAttribute')->with('id')->andReturn($overrides['part_id'] ?? 10);
    $part->allows('getAttribute')->with('part_num')->andReturn($overrides['part_num'] ?? '3001');
    $part->allows('getAttribute')->with('name')->andReturn($overrides['part_name'] ?? 'Brick 2 x 4');
    $part->allows('getAttribute')->with('category')->andReturn($overrides['part_category'] ?? 'Bricks');
    $part->allows('getAttribute')->with('image_url')->andReturn($overrides['part_image_url'] ?? 'https://example.com/3001.jpg');

    $color = \Mockery::mock(Color::class);
    $color->allows('getAttribute')->with('id')->andReturn($overrides['color_id'] ?? 5);
    $color->allows('getAttribute')->with('name')->andReturn($overrides['color_name'] ?? 'Red');
    $color->allows('getAttribute')->with('rgb')->andReturn($overrides['color_rgb'] ?? 'CC0000');
    $color->allows('getAttribute')->with('is_transparent')->andReturn($overrides['color_transparent'] ?? false);

    $setPart = \Mockery::mock(SetPart::class);
    $setPart->allows('getAttribute')->with('id')->andReturn($overrides['id'] ?? 1);
    $setPart->allows('getAttribute')->with('quantity')->andReturn($overrides['quantity'] ?? 10);
    $setPart->allows('getAttribute')->with('is_spare')->andReturn($overrides['is_spare'] ?? false);
    $setPart->allows('getAttribute')->with('element_id')->andReturn(\array_key_exists('element_id', $overrides) ? $overrides['element_id'] : '300101');
    $setPart->allows('getAttribute')->with('part')->andReturn($part);
    $setPart->allows('getAttribute')->with('color')->andReturn($color);
    $setPart->shouldReceive('loadMissing')->andReturnSelf();
    $setPart->shouldReceive('relationLoaded')->with('part')->andReturnTrue();
    $setPart->shouldReceive('relationLoaded')->with('color')->andReturnTrue();

    return $setPart;
}

describe('SetPartResourceData', function(): void {
    it('should convert set part model to resource data with nested part and color', function(): void {
        // arrange
        $setPart = mockSetPart();

        // act
        $resource = SetPartResourceData::from($setPart);

        // assert
        expect($resource)->toBeInstanceOf(SetPartResourceData::class)
            ->and($resource->id)->toBe(1)
            ->and($resource->quantity)->toBe(10)
            ->and($resource->is_spare)->toBeFalse()
            ->and($resource->element_id)->toBe('300101')
            ->and($resource->part)->toBeInstanceOf(PartResourceData::class)
            ->and($resource->part->part_num)->toBe('3001')
            ->and($resource->part->name)->toBe('Brick 2 x 4')
            ->and($resource->color)->toBeInstanceOf(ColorResourceData::class)
            ->and($resource->color->name)->toBe('Red')
            ->and($resource->color->rgb)->toBe('CC0000');
    });

    it('should handle spare parts', function(): void {
        // arrange
        $setPart = mockSetPart(['is_spare' => true, 'element_id' => null]);

        // act
        $resource = SetPartResourceData::from($setPart);

        // assert
        expect($resource->is_spare)->toBeTrue()
            ->and($resource->element_id)->toBeNull();
    });

    it('should convert to array format with nested objects', function(): void {
        // arrange
        $setPart = mockSetPart();

        // act
        $array = SetPartResourceData::from($setPart)->toArray();

        // assert
        expect($array)->toBeArray()
            ->and($array['id'])->toBe(1)
            ->and($array['quantity'])->toBe(10)
            ->and($array['is_spare'])->toBeFalse()
            ->and($array['element_id'])->toBe('300101')
            ->and($array['part'])->toBeArray()
            ->and($array['part']['part_num'])->toBe('3001')
            ->and($array['color'])->toBeArray()
            ->and($array['color']['name'])->toBe('Red');
    });
});
