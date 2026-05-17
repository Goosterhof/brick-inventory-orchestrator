<?php

declare(strict_types = 1);

use App\Http\Resources\ThemeResourceData;
use App\Models\Theme;

covers(ThemeResourceData::class);

describe('ThemeResourceData', function(): void {
    it('should convert theme model to resource data', function(): void {
        // arrange
        $theme = \Mockery::mock(Theme::class);
        $theme->allows('getAttribute')->with('id')->andReturn(158);
        $theme->allows('getAttribute')->with('name')->andReturn('Star Wars');
        $theme->allows('getAttribute')->with('parent_id')->andReturn(null);

        // act
        $resource = ThemeResourceData::from($theme);

        // assert
        expect($resource)->toBeInstanceOf(ThemeResourceData::class)
            ->and($resource->id)->toBe(158)
            ->and($resource->name)->toBe('Star Wars')
            ->and($resource->parentId)->toBeNull();
    });

    it('should expose parent_id as the camelCase parentId field', function(): void {
        // arrange
        $theme = \Mockery::mock(Theme::class);
        $theme->allows('getAttribute')->with('id')->andReturn(209);
        $theme->allows('getAttribute')->with('name')->andReturn('Episode I');
        $theme->allows('getAttribute')->with('parent_id')->andReturn(158);

        // act
        $resource = ThemeResourceData::from($theme);

        // assert
        expect($resource->parentId)->toBe(158);
    });

    it('should serialize to array with the camelCase field naming', function(): void {
        // arrange
        $theme = \Mockery::mock(Theme::class);
        $theme->allows('getAttribute')->with('id')->andReturn(209);
        $theme->allows('getAttribute')->with('name')->andReturn('Episode I');
        $theme->allows('getAttribute')->with('parent_id')->andReturn(158);

        // act
        $array = ThemeResourceData::from($theme)->toArray();

        // assert
        expect($array)->toBe([
            'id' => 209,
            'name' => 'Episode I',
            'parentId' => 158,
        ]);
    });
});
