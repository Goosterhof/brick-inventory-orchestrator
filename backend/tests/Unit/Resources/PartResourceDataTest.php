<?php

declare(strict_types = 1);

use App\Http\Resources\PartResourceData;
use App\Models\Part;

covers(PartResourceData::class);

describe('PartResourceData', function(): void {
    it('should convert part model to resource data', function(): void {
        // arrange
        $part = \Mockery::mock(Part::class);
        $part->allows('getAttribute')->with('id')->andReturn(1);
        $part->allows('getAttribute')->with('part_num')->andReturn('3001');
        $part->allows('getAttribute')->with('name')->andReturn('Brick 2 x 4');
        $part->allows('getAttribute')->with('category')->andReturn('Bricks');
        $part->allows('getAttribute')->with('image_url')->andReturn('https://example.com/3001.jpg');

        // act
        $resource = PartResourceData::from($part);

        // assert
        expect($resource)->toBeInstanceOf(PartResourceData::class)
            ->and($resource->id)->toBe(1)
            ->and($resource->part_num)->toBe('3001')
            ->and($resource->name)->toBe('Brick 2 x 4')
            ->and($resource->category)->toBe('Bricks')
            ->and($resource->image_url)->toBe('https://example.com/3001.jpg');
    });

    it('should handle nullable category', function(): void {
        // arrange
        $part = \Mockery::mock(Part::class);
        $part->allows('getAttribute')->with('id')->andReturn(2);
        $part->allows('getAttribute')->with('part_num')->andReturn('99999');
        $part->allows('getAttribute')->with('name')->andReturn('Unknown Part');
        $part->allows('getAttribute')->with('category')->andReturn(null);
        $part->allows('getAttribute')->with('image_url')->andReturn(null);

        // act
        $resource = PartResourceData::from($part);

        // assert
        expect($resource->category)->toBeNull()
            ->and($resource->image_url)->toBeNull();
    });

    it('should convert to array format', function(): void {
        // arrange
        $part = \Mockery::mock(Part::class);
        $part->allows('getAttribute')->with('id')->andReturn(1);
        $part->allows('getAttribute')->with('part_num')->andReturn('3001');
        $part->allows('getAttribute')->with('name')->andReturn('Brick 2 x 4');
        $part->allows('getAttribute')->with('category')->andReturn('Bricks');
        $part->allows('getAttribute')->with('image_url')->andReturn('https://example.com/3001.jpg');

        // act
        $array = PartResourceData::from($part)->toArray();

        // assert
        expect($array)->toBeArray()
            ->and($array['id'])->toBe(1)
            ->and($array['part_num'])->toBe('3001')
            ->and($array['name'])->toBe('Brick 2 x 4')
            ->and($array['category'])->toBe('Bricks')
            ->and($array['image_url'])->toBe('https://example.com/3001.jpg');
    });
});
