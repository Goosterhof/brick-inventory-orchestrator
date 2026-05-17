<?php

declare(strict_types = 1);

use App\Actions\Family\GetFamilyStatsAction;
use App\Enums\FamilySetStatus;
use App\Models\Family;
use App\Models\FamilySet;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

covers(GetFamilyStatsAction::class);

describe('GetFamilyStatsAction', function(): void {
    it('should query family stats for the given family', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(3);

        $familySetBuilder = \Mockery::mock(Builder::class);
        $familySetBuilder->shouldReceive('where')
            ->with('family_id', 3)
            ->andReturnSelf();
        $familySetBuilder->shouldReceive('where')
            ->with('status', '!=', FamilySetStatus::Wishlist)
            ->andReturnSelf();
        $familySetBuilder->shouldReceive('count')->andReturn(5);
        $familySetBuilder->shouldReceive('sum')->with('quantity')->andReturn(12);

        $statusBuilder = \Mockery::mock(Builder::class);
        $statusBuilder->shouldReceive('where')
            ->with('family_id', 3)
            ->andReturnSelf();
        $statusBuilder->shouldReceive('selectRaw')
            ->with('status, count(*) as count')
            ->andReturnSelf();
        $statusBuilder->shouldReceive('groupBy')
            ->with('status')
            ->andReturnSelf();

        $statusCollection = new Collection(['sealed' => 2, 'built' => 3]);

        $baseBuilder = \Mockery::mock(\Illuminate\Database\Query\Builder::class);
        $baseBuilder->shouldReceive('pluck')
            ->with('count', 'status')
            ->andReturn($statusCollection);

        $statusBuilder->shouldReceive('toBase')->andReturn($baseBuilder);

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->shouldReceive('newQuery')
            ->twice()
            ->andReturn($familySetBuilder, $statusBuilder);

        $storageOptionIds = new Collection([10, 20]);

        $storageOptionBuilder = \Mockery::mock(Builder::class);
        $storageOptionBuilder->shouldReceive('where')
            ->with('family_id', 3)
            ->andReturnSelf();
        $storageOptionBuilder->shouldReceive('pluck')
            ->with('id')
            ->andReturn($storageOptionIds);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')
            ->once()
            ->andReturn($storageOptionBuilder);

        $partsCountBuilder = \Mockery::mock(Builder::class);
        $partsCountBuilder->shouldReceive('whereIn')
            ->with('storage_option_id', $storageOptionIds)
            ->andReturnSelf();
        $partsCountBuilder->shouldReceive('count')->andReturn(8);

        $partsSumBuilder = \Mockery::mock(Builder::class);
        $partsSumBuilder->shouldReceive('whereIn')
            ->with('storage_option_id', $storageOptionIds)
            ->andReturnSelf();
        $partsSumBuilder->shouldReceive('sum')->with('quantity')->andReturn(42);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')
            ->twice()
            ->andReturn($partsCountBuilder, $partsSumBuilder);

        $action = new GetFamilyStatsAction($familySet, $storageOption, $storageOptionPart);

        // act
        $result = $action->execute($family);

        // assert
        expect($result->totalSets)->toBe(5)
            ->and($result->totalSetQuantity)->toBe(12)
            ->and($result->setsByStatus)->toBe(['sealed' => 2, 'built' => 3])
            ->and($result->totalStorageLocations)->toBe(2)
            ->and($result->totalUniqueParts)->toBe(8)
            ->and($result->totalPartsQuantity)->toBe(42);
    });

    it('should return zeros when family has no data', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $familySetBuilder = \Mockery::mock(Builder::class);
        $familySetBuilder->shouldReceive('where')->andReturnSelf();
        $familySetBuilder->shouldReceive('count')->andReturn(0);
        $familySetBuilder->shouldReceive('sum')->andReturn(0);

        $statusBuilder = \Mockery::mock(Builder::class);
        $statusBuilder->shouldReceive('where')->andReturnSelf();
        $statusBuilder->shouldReceive('selectRaw')->andReturnSelf();
        $statusBuilder->shouldReceive('groupBy')->andReturnSelf();
        $baseBuilder = \Mockery::mock(\Illuminate\Database\Query\Builder::class);
        $baseBuilder->shouldReceive('pluck')->andReturn(new Collection);

        $statusBuilder->shouldReceive('toBase')->andReturn($baseBuilder);

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->shouldReceive('newQuery')
            ->twice()
            ->andReturn($familySetBuilder, $statusBuilder);

        $storageOptionBuilder = \Mockery::mock(Builder::class);
        $storageOptionBuilder->shouldReceive('where')->andReturnSelf();
        $storageOptionBuilder->shouldReceive('pluck')->andReturn(new Collection);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')->andReturn($storageOptionBuilder);

        $partsCountBuilder = \Mockery::mock(Builder::class);
        $partsCountBuilder->shouldReceive('whereIn')->andReturnSelf();
        $partsCountBuilder->shouldReceive('count')->andReturn(0);

        $partsSumBuilder = \Mockery::mock(Builder::class);
        $partsSumBuilder->shouldReceive('whereIn')->andReturnSelf();
        $partsSumBuilder->shouldReceive('sum')->andReturn(0);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')
            ->twice()
            ->andReturn($partsCountBuilder, $partsSumBuilder);

        $action = new GetFamilyStatsAction($familySet, $storageOption, $storageOptionPart);

        // act
        $result = $action->execute($family);

        // assert
        expect($result->totalSets)->toBe(0)
            ->and($result->totalSetQuantity)->toBe(0)
            ->and($result->setsByStatus)->toBe([])
            ->and($result->totalStorageLocations)->toBe(0)
            ->and($result->totalUniqueParts)->toBe(0)
            ->and($result->totalPartsQuantity)->toBe(0);
    });
});
