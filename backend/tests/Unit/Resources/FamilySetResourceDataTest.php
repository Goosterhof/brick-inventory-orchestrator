<?php

declare(strict_types = 1);

use App\Enums\FamilySetStatus;
use App\Http\Resources\FamilySetResourceData;
use App\Http\Resources\SetSummaryResourceData;
use App\Models\FamilySet;
use App\Models\Set;
use App\Models\Theme;

covers(FamilySetResourceData::class);

describe('FamilySetResourceData', function(): void {
    it('should convert family set model to resource data with nested set', function(): void {
        // arrange
        $theme = \Mockery::mock(Theme::class);
        $theme->allows('getAttribute')->with('id')->andReturn(158);
        $theme->allows('getAttribute')->with('name')->andReturn('Star Wars');
        $theme->allows('getAttribute')->with('parent_id')->andReturn(null);

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(100);
        $set->allows('getAttribute')->with('set_num')->andReturn('75192-1');
        $set->allows('getAttribute')->with('name')->andReturn('Millennium Falcon');
        $set->allows('getAttribute')->with('year')->andReturn(2_017);
        $set->allows('getAttribute')->with('theme')->andReturn($theme);
        $set->allows('getAttribute')->with('num_parts')->andReturn(7_541);
        $set->allows('getAttribute')->with('image_url')->andReturn('https://example.com/falcon.jpg');
        $set->shouldReceive('loadMissing')->andReturnSelf();

        $purchaseDate = new \DateTimeImmutable('2025-01-15');

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('getAttribute')->with('id')->andReturn(1);
        $familySet->allows('getAttribute')->with('set_id')->andReturn(100);
        $familySet->allows('getAttribute')->with('quantity')->andReturn(2);
        $familySet->allows('getAttribute')->with('status')->andReturn(FamilySetStatus::Built);
        $familySet->allows('getAttribute')->with('purchase_date')->andReturn($purchaseDate);
        $familySet->allows('getAttribute')->with('notes')->andReturn('Birthday gift');
        $familySet->allows('getAttribute')->with('set')->andReturn($set);
        $familySet->shouldReceive('loadMissing')->andReturnSelf();
        $familySet->shouldReceive('relationLoaded')->with('set')->andReturnTrue();

        // act
        $resource = FamilySetResourceData::from($familySet);

        // assert
        expect($resource)->toBeInstanceOf(FamilySetResourceData::class)
            ->and($resource->id)->toBe(1)
            ->and($resource->set_id)->toBe(100)
            ->and($resource->quantity)->toBe(2)
            ->and($resource->status)->toBe(FamilySetStatus::Built)
            ->and($resource->purchase_date)->toBe('2025-01-15')
            ->and($resource->notes)->toBe('Birthday gift')
            ->and($resource->set)->toBeInstanceOf(SetSummaryResourceData::class)
            ->and($resource->set->set_num)->toBe('75192-1')
            ->and($resource->set->theme?->name)->toBe('Star Wars');
    });

    it('should serialize enum status to its backing value in array output', function(): void {
        // arrange
        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(100);
        $set->allows('getAttribute')->with('set_num')->andReturn('10281-1');
        $set->allows('getAttribute')->with('name')->andReturn('Bonsai Tree');
        $set->allows('getAttribute')->with('year')->andReturn(2_021);
        $set->allows('getAttribute')->with('theme')->andReturn(null);
        $set->allows('getAttribute')->with('num_parts')->andReturn(878);
        $set->allows('getAttribute')->with('image_url')->andReturn(null);
        $set->shouldReceive('loadMissing')->andReturnSelf();

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('getAttribute')->with('id')->andReturn(2);
        $familySet->allows('getAttribute')->with('set_id')->andReturn(100);
        $familySet->allows('getAttribute')->with('quantity')->andReturn(1);
        $familySet->allows('getAttribute')->with('status')->andReturn(FamilySetStatus::InProgress);
        $familySet->allows('getAttribute')->with('purchase_date')->andReturn(null);
        $familySet->allows('getAttribute')->with('notes')->andReturn(null);
        $familySet->allows('getAttribute')->with('set')->andReturn($set);
        $familySet->shouldReceive('loadMissing')->andReturnSelf();
        $familySet->shouldReceive('relationLoaded')->with('set')->andReturnTrue();

        // act
        $array = FamilySetResourceData::from($familySet)->toArray();

        // assert
        expect($array['status'])->toBe('in_progress')
            ->and($array['set'])->toBeArray()
            ->and($array['set']['set_num'])->toBe('10281-1')
            ->and($array['set']['theme'])->toBeNull();
    });

    it('should handle nullable purchase_date and notes', function(): void {
        // arrange
        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(100);
        $set->allows('getAttribute')->with('set_num')->andReturn('42151-1');
        $set->allows('getAttribute')->with('name')->andReturn('Transformers Optimus Prime');
        $set->allows('getAttribute')->with('year')->andReturn(2_023);
        $set->allows('getAttribute')->with('theme')->andReturn(null);
        $set->allows('getAttribute')->with('num_parts')->andReturn(1_508);
        $set->allows('getAttribute')->with('image_url')->andReturn(null);
        $set->shouldReceive('loadMissing')->andReturnSelf();

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('getAttribute')->with('id')->andReturn(3);
        $familySet->allows('getAttribute')->with('set_id')->andReturn(100);
        $familySet->allows('getAttribute')->with('quantity')->andReturn(1);
        $familySet->allows('getAttribute')->with('status')->andReturn(FamilySetStatus::Sealed);
        $familySet->allows('getAttribute')->with('purchase_date')->andReturn(null);
        $familySet->allows('getAttribute')->with('notes')->andReturn(null);
        $familySet->allows('getAttribute')->with('set')->andReturn($set);
        $familySet->shouldReceive('loadMissing')->andReturnSelf();
        $familySet->shouldReceive('relationLoaded')->with('set')->andReturnTrue();

        // act
        $resource = FamilySetResourceData::from($familySet);

        // assert
        expect($resource->purchase_date)->toBeNull()
            ->and($resource->notes)->toBeNull();
    });
});
