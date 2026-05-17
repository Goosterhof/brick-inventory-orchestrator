<?php

declare(strict_types = 1);

use App\DataTransferObjects\Result\FamilySet\FamilySetCompletionsResultData;
use App\Exceptions\MissingRelationException;
use App\Http\Resources\FamilySetCompletionResourceData;
use App\Models\FamilySet;
use App\Models\Set;
use Illuminate\Support\Collection;

covers(FamilySetCompletionResourceData::class);

describe('FamilySetCompletionResourceData', function(): void {
    it('should shape resources from a Result DTO carrying a Collection of FamilySets', function(): void {
        // arrange
        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('set_num')->andReturn('75192-1');

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('getAttribute')->with('id')->andReturn(1);
        $familySet->allows('getAttribute')->with('set')->andReturn($set);
        $familySet->allows('relationLoaded')->with('set')->andReturn(true);

        $resultData = new FamilySetCompletionsResultData(
            familySets: new Collection([$familySet]),
            countsByFamilySetId: [
                1 => ['total_parts' => 7_541, 'stored_parts' => 3_200, 'percentage' => 42.43],
            ],
        );

        // act
        $resources = FamilySetCompletionResourceData::fromResult($resultData);

        // assert
        expect($resources)->toHaveCount(1)
            ->and($resources[0])->toBeInstanceOf(FamilySetCompletionResourceData::class)
            ->and($resources[0]->family_set_id)->toBe(1)
            ->and($resources[0]->set_num)->toBe('75192-1')
            ->and($resources[0]->total_parts)->toBe(7_541)
            ->and($resources[0]->stored_parts)->toBe(3_200)
            ->and($resources[0]->percentage)->toBe(42.43);
    });

    it('should return an empty list when the Result carries no family sets', function(): void {
        // arrange
        $resultData = new FamilySetCompletionsResultData(
            familySets: new Collection,
            countsByFamilySetId: [],
        );

        // act
        $resources = FamilySetCompletionResourceData::fromResult($resultData);

        // assert
        expect($resources)->toBe([]);
    });

    it('should default nullable count fields when a family_set has no counts entry', function(): void {
        // arrange
        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('set_num')->andReturn('42151-1');

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('getAttribute')->with('id')->andReturn(3);
        $familySet->allows('getAttribute')->with('set')->andReturn($set);
        $familySet->allows('relationLoaded')->with('set')->andReturn(true);

        $resultData = new FamilySetCompletionsResultData(
            familySets: new Collection([$familySet]),
            countsByFamilySetId: [],
        );

        // act
        $resources = FamilySetCompletionResourceData::fromResult($resultData);

        // assert
        expect($resources[0]->family_set_id)->toBe(3)
            ->and($resources[0]->set_num)->toBe('42151-1')
            ->and($resources[0]->total_parts)->toBeNull()
            ->and($resources[0]->stored_parts)->toBeNull()
            ->and($resources[0]->percentage)->toBeNull();
    });

    it('should serialize to array with snake_case keys', function(): void {
        // arrange
        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('set_num')->andReturn('10294-1');

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('getAttribute')->with('id')->andReturn(5);
        $familySet->allows('getAttribute')->with('set')->andReturn($set);
        $familySet->allows('relationLoaded')->with('set')->andReturn(true);

        $resultData = new FamilySetCompletionsResultData(
            familySets: new Collection([$familySet]),
            countsByFamilySetId: [
                5 => ['total_parts' => 2_532, 'stored_parts' => 2_532, 'percentage' => 100.0],
            ],
        );

        // act
        $array = FamilySetCompletionResourceData::fromResult($resultData)[0]->toArray();

        // assert
        expect($array)->toBe([
            'family_set_id' => 5,
            'set_num' => '10294-1',
            'total_parts' => 2_532,
            'stored_parts' => 2_532,
            'percentage' => 100.0,
        ]);
    });

    it('should shape a single resource via from() when called with a FamilySet model', function(): void {
        // arrange
        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('set_num')->andReturn('21318-1');

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('getAttribute')->with('id')->andReturn(9);
        $familySet->allows('getAttribute')->with('set')->andReturn($set);
        $familySet->allows('relationLoaded')->with('set')->andReturn(true);

        // act
        $resource = FamilySetCompletionResourceData::from($familySet);

        // assert — from() alone returns the shape with null counts (counts live on the Result DTO)
        expect($resource->family_set_id)->toBe(9)
            ->and($resource->set_num)->toBe('21318-1')
            ->and($resource->total_parts)->toBeNull()
            ->and($resource->stored_parts)->toBeNull()
            ->and($resource->percentage)->toBeNull();
    });

    it('should throw MissingRelationException when `set` is not loaded on fromResult()', function(): void {
        // arrange
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('getAttribute')->with('id')->andReturn(1);
        $familySet->allows('relationLoaded')->with('set')->andReturn(false);

        $resultData = new FamilySetCompletionsResultData(
            familySets: new Collection([$familySet]),
            countsByFamilySetId: [],
        );

        // act + assert
        expect(fn(): array => FamilySetCompletionResourceData::fromResult($resultData))
            ->toThrow(MissingRelationException::class);
    });
});
