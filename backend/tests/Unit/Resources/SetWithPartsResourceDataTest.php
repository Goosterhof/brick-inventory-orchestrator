<?php

declare(strict_types = 1);

use App\Http\Resources\SetPartResourceData;
use App\Http\Resources\SetWithPartsResourceData;
use App\Http\Resources\ThemeResourceData;
use App\Models\Color;
use App\Models\Part;
use App\Models\Set;
use App\Models\SetPart;
use App\Models\Theme;
use Illuminate\Support\Collection;
use Mockery\MockInterface;

covers(SetWithPartsResourceData::class);

function mockSetPartForSetWith(array $overrides = []): MockInterface&SetPart
{
    $part = \Mockery::mock(Part::class);
    $part->allows('getAttribute')->with('id')->andReturn($overrides['part_id'] ?? 10);
    $part->allows('getAttribute')->with('part_num')->andReturn($overrides['part_num'] ?? '3001');
    $part->allows('getAttribute')->with('name')->andReturn($overrides['part_name'] ?? 'Brick 2 x 4');
    $part->allows('getAttribute')->with('category')->andReturn($overrides['part_category'] ?? null);
    $part->allows('getAttribute')->with('image_url')->andReturn($overrides['part_image_url'] ?? null);

    $color = \Mockery::mock(Color::class);
    $color->allows('getAttribute')->with('id')->andReturn($overrides['color_id'] ?? 5);
    $color->allows('getAttribute')->with('name')->andReturn($overrides['color_name'] ?? 'Red');
    $color->allows('getAttribute')->with('rgb')->andReturn($overrides['color_rgb'] ?? 'CC0000');
    $color->allows('getAttribute')->with('is_transparent')->andReturn(false);

    $setPart = \Mockery::mock(SetPart::class);
    $setPart->allows('getAttribute')->with('id')->andReturn($overrides['id'] ?? 1);
    $setPart->allows('getAttribute')->with('quantity')->andReturn($overrides['quantity'] ?? 10);
    $setPart->allows('getAttribute')->with('is_spare')->andReturn($overrides['is_spare'] ?? false);
    $setPart->allows('getAttribute')->with('element_id')->andReturn($overrides['element_id'] ?? '300101');
    $setPart->allows('getAttribute')->with('part')->andReturn($part);
    $setPart->allows('getAttribute')->with('color')->andReturn($color);
    $setPart->shouldReceive('loadMissing')->andReturnSelf();
    $setPart->shouldReceive('relationLoaded')->with('part')->andReturnTrue();
    $setPart->shouldReceive('relationLoaded')->with('color')->andReturnTrue();

    return $setPart;
}

function mockThemeForSetWith(int $id = 158, string $name = 'Star Wars', ?int $parentId = null): MockInterface&Theme
{
    $theme = \Mockery::mock(Theme::class);
    $theme->allows('getAttribute')->with('id')->andReturn($id);
    $theme->allows('getAttribute')->with('name')->andReturn($name);
    $theme->allows('getAttribute')->with('parent_id')->andReturn($parentId);

    return $theme;
}

describe('SetWithPartsResourceData', function(): void {
    it('should convert set with parts and theme to resource data', function(): void {
        // arrange
        $setPart = mockSetPartForSetWith();
        $theme = mockThemeForSetWith();

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(1);
        $set->allows('getAttribute')->with('set_num')->andReturn('75192-1');
        $set->allows('getAttribute')->with('name')->andReturn('Millennium Falcon');
        $set->allows('getAttribute')->with('year')->andReturn(2_017);
        $set->allows('getAttribute')->with('theme')->andReturn($theme);
        $set->allows('getAttribute')->with('num_parts')->andReturn(7_541);
        $set->allows('getAttribute')->with('image_url')->andReturn('https://example.com/falcon.jpg');
        $set->allows('getAttribute')->with('setParts')->andReturn(new Collection([$setPart]));
        $set->shouldReceive('loadMissing')->andReturnSelf();

        // act
        $resource = SetWithPartsResourceData::from($set);

        // assert
        expect($resource)->toBeInstanceOf(SetWithPartsResourceData::class)
            ->and($resource->id)->toBe(1)
            ->and($resource->set_num)->toBe('75192-1')
            ->and($resource->name)->toBe('Millennium Falcon')
            ->and($resource->year)->toBe(2_017)
            ->and($resource->theme)->toBeInstanceOf(ThemeResourceData::class)
            ->and($resource->theme->id)->toBe(158)
            ->and($resource->theme->name)->toBe('Star Wars')
            ->and($resource->num_parts)->toBe(7_541)
            ->and($resource->image_url)->toBe('https://example.com/falcon.jpg')
            ->and($resource->parts)->toBeArray()
            ->and($resource->parts)->toHaveCount(1)
            ->and($resource->parts[0])->toBeInstanceOf(SetPartResourceData::class)
            ->and($resource->parts[0]->quantity)->toBe(10)
            ->and($resource->parts[0]->part->part_num)->toBe('3001');
    });

    it('should handle empty parts and null theme', function(): void {
        // arrange
        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(1);
        $set->allows('getAttribute')->with('set_num')->andReturn('10281-1');
        $set->allows('getAttribute')->with('name')->andReturn('Bonsai Tree');
        $set->allows('getAttribute')->with('year')->andReturn(2_021);
        $set->allows('getAttribute')->with('theme')->andReturn(null);
        $set->allows('getAttribute')->with('num_parts')->andReturn(878);
        $set->allows('getAttribute')->with('image_url')->andReturn(null);
        $set->allows('getAttribute')->with('setParts')->andReturn(new Collection([]));
        $set->shouldReceive('loadMissing')->andReturnSelf();

        // act
        $resource = SetWithPartsResourceData::from($set);

        // assert
        expect($resource->set_num)->toBe('10281-1')
            ->and($resource->theme)->toBeNull()
            ->and($resource->parts)->toBeArray()
            ->and($resource->parts)->toBeEmpty();
    });

    it('should convert to array format', function(): void {
        // arrange
        $setPart = mockSetPartForSetWith();
        $theme = mockThemeForSetWith();

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(1);
        $set->allows('getAttribute')->with('set_num')->andReturn('75192-1');
        $set->allows('getAttribute')->with('name')->andReturn('Millennium Falcon');
        $set->allows('getAttribute')->with('year')->andReturn(2_017);
        $set->allows('getAttribute')->with('theme')->andReturn($theme);
        $set->allows('getAttribute')->with('num_parts')->andReturn(7_541);
        $set->allows('getAttribute')->with('image_url')->andReturn('https://example.com/falcon.jpg');
        $set->allows('getAttribute')->with('setParts')->andReturn(new Collection([$setPart]));
        $set->shouldReceive('loadMissing')->andReturnSelf();

        // act
        $array = SetWithPartsResourceData::from($set)->toArray();

        // assert
        expect($array)->toBeArray()
            ->and($array['id'])->toBe(1)
            ->and($array['set_num'])->toBe('75192-1')
            ->and($array['theme'])->toBe([
                'id' => 158,
                'name' => 'Star Wars',
                'parentId' => null,
            ])
            ->and($array['parts'])->toBeArray()
            ->and($array['parts'])->toHaveCount(1)
            ->and($array['parts'][0]['quantity'])->toBe(10)
            ->and($array['parts'][0]['part']['part_num'])->toBe('3001');
    });

    it('should handle multiple parts', function(): void {
        // arrange
        $setPart1 = mockSetPartForSetWith(['id' => 1, 'part_id' => 10, 'part_num' => '3001', 'quantity' => 5]);
        $setPart2 = mockSetPartForSetWith(['id' => 2, 'part_id' => 20, 'part_num' => '3002', 'quantity' => 3, 'is_spare' => true, 'element_id' => '300226']);
        $theme = mockThemeForSetWith();

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(1);
        $set->allows('getAttribute')->with('set_num')->andReturn('10179-1');
        $set->allows('getAttribute')->with('name')->andReturn('Ultimate Collector Millennium Falcon');
        $set->allows('getAttribute')->with('year')->andReturn(2_007);
        $set->allows('getAttribute')->with('theme')->andReturn($theme);
        $set->allows('getAttribute')->with('num_parts')->andReturn(5_195);
        $set->allows('getAttribute')->with('image_url')->andReturn(null);
        $set->allows('getAttribute')->with('setParts')->andReturn(new Collection([$setPart1, $setPart2]));
        $set->shouldReceive('loadMissing')->andReturnSelf();

        // act
        $resource = SetWithPartsResourceData::from($set);

        // assert
        expect($resource->parts)->toHaveCount(2)
            ->and($resource->parts[0]->part->part_num)->toBe('3001')
            ->and($resource->parts[1]->part->part_num)->toBe('3002')
            ->and($resource->parts[1]->is_spare)->toBeTrue();
    });
});
