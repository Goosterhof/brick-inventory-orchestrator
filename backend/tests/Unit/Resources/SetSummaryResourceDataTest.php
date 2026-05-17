<?php

declare(strict_types = 1);

use App\Http\Resources\SetSummaryResourceData;
use App\Http\Resources\ThemeResourceData;
use App\Models\Set;
use App\Models\Theme;

covers(SetSummaryResourceData::class);

describe('SetSummaryResourceData', function(): void {
    it('should convert set model to summary resource data with theme', function(): void {
        // arrange
        $theme = \Mockery::mock(Theme::class);
        $theme->allows('getAttribute')->with('id')->andReturn(158);
        $theme->allows('getAttribute')->with('name')->andReturn('Star Wars');
        $theme->allows('getAttribute')->with('parent_id')->andReturn(null);

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(1);
        $set->allows('getAttribute')->with('set_num')->andReturn('75192-1');
        $set->allows('getAttribute')->with('name')->andReturn('Millennium Falcon');
        $set->allows('getAttribute')->with('year')->andReturn(2_017);
        $set->allows('getAttribute')->with('theme')->andReturn($theme);
        $set->allows('getAttribute')->with('num_parts')->andReturn(7_541);
        $set->allows('getAttribute')->with('image_url')->andReturn('https://example.com/falcon.jpg');
        $set->shouldReceive('loadMissing')->andReturnSelf();

        // act
        $resource = SetSummaryResourceData::from($set);

        // assert
        expect($resource)->toBeInstanceOf(SetSummaryResourceData::class)
            ->and($resource->id)->toBe(1)
            ->and($resource->set_num)->toBe('75192-1')
            ->and($resource->name)->toBe('Millennium Falcon')
            ->and($resource->year)->toBe(2_017)
            ->and($resource->theme)->toBeInstanceOf(ThemeResourceData::class)
            ->and($resource->theme->id)->toBe(158)
            ->and($resource->theme->name)->toBe('Star Wars')
            ->and($resource->theme->parentId)->toBeNull()
            ->and($resource->num_parts)->toBe(7_541)
            ->and($resource->image_url)->toBe('https://example.com/falcon.jpg');
    });

    it('should handle nullable year and null theme', function(): void {
        // arrange
        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(2);
        $set->allows('getAttribute')->with('set_num')->andReturn('10281-1');
        $set->allows('getAttribute')->with('name')->andReturn('Bonsai Tree');
        $set->allows('getAttribute')->with('year')->andReturn(null);
        $set->allows('getAttribute')->with('theme')->andReturn(null);
        $set->allows('getAttribute')->with('num_parts')->andReturn(878);
        $set->allows('getAttribute')->with('image_url')->andReturn(null);
        $set->shouldReceive('loadMissing')->andReturnSelf();

        // act
        $resource = SetSummaryResourceData::from($set);

        // assert
        expect($resource->year)->toBeNull()
            ->and($resource->theme)->toBeNull()
            ->and($resource->image_url)->toBeNull();
    });

    it('should convert to nested array format with theme', function(): void {
        // arrange
        $theme = \Mockery::mock(Theme::class);
        $theme->allows('getAttribute')->with('id')->andReturn(158);
        $theme->allows('getAttribute')->with('name')->andReturn('Star Wars');
        $theme->allows('getAttribute')->with('parent_id')->andReturn(1);

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(1);
        $set->allows('getAttribute')->with('set_num')->andReturn('75192-1');
        $set->allows('getAttribute')->with('name')->andReturn('Millennium Falcon');
        $set->allows('getAttribute')->with('year')->andReturn(2_017);
        $set->allows('getAttribute')->with('theme')->andReturn($theme);
        $set->allows('getAttribute')->with('num_parts')->andReturn(7_541);
        $set->allows('getAttribute')->with('image_url')->andReturn('https://example.com/falcon.jpg');
        $set->shouldReceive('loadMissing')->andReturnSelf();

        // act
        $array = SetSummaryResourceData::from($set)->toArray();

        // assert
        expect($array)->toBeArray()
            ->and($array['id'])->toBe(1)
            ->and($array['set_num'])->toBe('75192-1')
            ->and($array['name'])->toBe('Millennium Falcon')
            ->and($array['year'])->toBe(2_017)
            ->and($array['theme'])->toBe([
                'id' => 158,
                'name' => 'Star Wars',
                'parentId' => 1,
            ])
            ->and($array['num_parts'])->toBe(7_541)
            ->and($array['image_url'])->toBe('https://example.com/falcon.jpg');
    });
});
