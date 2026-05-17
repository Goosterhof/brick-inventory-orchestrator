<?php

declare(strict_types = 1);

use App\Http\Resources\ColorResourceData;
use App\Models\Color;

covers(ColorResourceData::class);

describe('ColorResourceData', function(): void {
    it('should convert color model to resource data', function(): void {
        // arrange
        $color = \Mockery::mock(Color::class);
        $color->allows('getAttribute')->with('id')->andReturn(1);
        $color->allows('getAttribute')->with('name')->andReturn('Red');
        $color->allows('getAttribute')->with('rgb')->andReturn('CC0000');
        $color->allows('getAttribute')->with('is_transparent')->andReturn(false);

        // act
        $resource = ColorResourceData::from($color);

        // assert
        expect($resource)->toBeInstanceOf(ColorResourceData::class)
            ->and($resource->id)->toBe(1)
            ->and($resource->name)->toBe('Red')
            ->and($resource->rgb)->toBe('CC0000')
            ->and($resource->is_transparent)->toBeFalse();
    });

    it('should handle transparent colors', function(): void {
        // arrange
        $color = \Mockery::mock(Color::class);
        $color->allows('getAttribute')->with('id')->andReturn(2);
        $color->allows('getAttribute')->with('name')->andReturn('Trans-Clear');
        $color->allows('getAttribute')->with('rgb')->andReturn('FFFFFF');
        $color->allows('getAttribute')->with('is_transparent')->andReturn(true);

        // act
        $resource = ColorResourceData::from($color);

        // assert
        expect($resource->is_transparent)->toBeTrue();
    });

    it('should convert to array format', function(): void {
        // arrange
        $color = \Mockery::mock(Color::class);
        $color->allows('getAttribute')->with('id')->andReturn(1);
        $color->allows('getAttribute')->with('name')->andReturn('Red');
        $color->allows('getAttribute')->with('rgb')->andReturn('CC0000');
        $color->allows('getAttribute')->with('is_transparent')->andReturn(false);

        // act
        $array = ColorResourceData::from($color)->toArray();

        // assert
        expect($array)->toBeArray()
            ->and($array['id'])->toBe(1)
            ->and($array['name'])->toBe('Red')
            ->and($array['rgb'])->toBe('CC0000')
            ->and($array['is_transparent'])->toBeFalse();
    });
});
