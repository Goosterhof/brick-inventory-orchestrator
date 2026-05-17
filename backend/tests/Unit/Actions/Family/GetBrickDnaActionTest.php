<?php

declare(strict_types = 1);

use App\Actions\Family\GetBrickDnaAction;
use App\Models\Family;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as BaseBuilder;
use Illuminate\Support\Collection;
use Mockery\MockInterface;

covers(GetBrickDnaAction::class);

/**
 * Helper to create a mock Eloquent Builder that returns itself for chained calls.
 *
 * @param list<string> $chainMethods
 */
function mockChainBuilder(array $chainMethods): MockInterface
{
    $builder = \Mockery::mock(Builder::class);

    foreach ($chainMethods as $chainMethod) {
        $builder->shouldReceive($chainMethod)->andReturnSelf();
    }

    return $builder;
}

describe('GetBrickDnaAction', function(): void {
    it('should return empty data when family has no storage options', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $storageOptionBuilder = \Mockery::mock(Builder::class);
        $storageOptionBuilder->shouldReceive('where')->with('family_id', 1)->andReturnSelf();
        $storageOptionBuilder->shouldReceive('pluck')->with('id')->andReturn(new Collection);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')->once()->andReturn($storageOptionBuilder);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);

        $action = new GetBrickDnaAction($storageOption, $storageOptionPart);
        $result = $action->execute($family);

        expect($result->topColors)->toBe([])
            ->and($result->topPartTypes)->toBe([])
            ->and($result->rarestParts)->toBe([])
            ->and($result->diversityScore)->toBe(0.0)
            ->and($result->totalUniqueParts)->toBe(0)
            ->and($result->totalPartsQuantity)->toBe(0);
    });

    it('should compute brick DNA analytics for a family with stored parts', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(3);

        $storageOptionIds = new Collection([10, 20]);

        // StorageOption query
        $storageOptionBuilder = \Mockery::mock(Builder::class);
        $storageOptionBuilder->shouldReceive('where')->with('family_id', 3)->andReturnSelf();
        $storageOptionBuilder->shouldReceive('pluck')->with('id')->andReturn($storageOptionIds);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')->once()->andReturn($storageOptionBuilder);

        // Count query
        $countBuilder = \Mockery::mock(Builder::class);
        $countBuilder->shouldReceive('whereIn')->with('storage_option_id', $storageOptionIds)->andReturnSelf();
        $countBuilder->shouldReceive('count')->andReturn(15);

        // Sum query
        $sumBuilder = \Mockery::mock(Builder::class);
        $sumBuilder->shouldReceive('whereIn')->with('storage_option_id', $storageOptionIds)->andReturnSelf();
        $sumBuilder->shouldReceive('sum')->with('quantity')->andReturn(150);

        // Top colors query
        $topColorsRow = (object) [
            'color_id' => 1,
            'name' => 'Red',
            'rgb' => 'FF0000',
            'is_transparent' => false,
            'total_quantity' => 50,
        ];
        $topColorsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topColorsBaseBuilder->shouldReceive('get')->andReturn(new Collection([$topColorsRow]));

        $topColorsBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topColorsBuilder->shouldReceive('toBase')->andReturn($topColorsBaseBuilder);

        // Top part types query
        $topPartsRow = (object) [
            'part_id' => 5,
            'part_num' => '3001',
            'name' => 'Brick 2x4',
            'category' => 'Bricks',
            'total_quantity' => 30,
        ];
        $topPartsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topPartsBaseBuilder->shouldReceive('get')->andReturn(new Collection([$topPartsRow]));

        $topPartsBuilder = mockChainBuilder(['whereIn', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topPartsBuilder->shouldReceive('toBase')->andReturn($topPartsBaseBuilder);

        // Rarest parts query
        $rarestRow = (object) [
            'part_id' => 99,
            'part_num' => '9999',
            'part_name' => 'Rare Brick',
            'color_id' => 2,
            'color_name' => 'Blue',
            'color_rgb' => '0000FF',
            'quantity' => 1,
        ];
        $rarestBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $rarestBaseBuilder->shouldReceive('get')->andReturn(new Collection([$rarestRow]));

        $rarestBuilder = mockChainBuilder(['whereIn', 'join', 'leftJoin', 'selectRaw', 'orderBy', 'limit']);
        $rarestBuilder->shouldReceive('toBase')->andReturn($rarestBaseBuilder);

        // Diversity score query — 2 colors, equal distribution = 1.0
        $diversityBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $diversityBaseBuilder->shouldReceive('pluck')->with('total_quantity')->andReturn(new Collection([75, 75]));

        $diversityBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'selectRaw', 'groupBy']);
        $diversityBuilder->shouldReceive('toBase')->andReturn($diversityBaseBuilder);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')
            ->times(6)
            ->andReturn($countBuilder, $sumBuilder, $topColorsBuilder, $topPartsBuilder, $rarestBuilder, $diversityBuilder);

        $action = new GetBrickDnaAction($storageOption, $storageOptionPart);
        $result = $action->execute($family);

        expect($result->totalUniqueParts)->toBe(15)
            ->and($result->totalPartsQuantity)->toBe(150)
            ->and($result->topColors)->toHaveCount(1)
            ->and($result->topColors[0]['color_id'])->toBe(1)
            ->and($result->topColors[0]['name'])->toBe('Red')
            ->and($result->topColors[0]['rgb'])->toBe('FF0000')
            ->and($result->topColors[0]['is_transparent'])->toBeFalse()
            ->and($result->topColors[0]['total_quantity'])->toBe(50)
            ->and($result->topPartTypes)->toHaveCount(1)
            ->and($result->topPartTypes[0]['part_id'])->toBe(5)
            ->and($result->topPartTypes[0]['part_num'])->toBe('3001')
            ->and($result->topPartTypes[0]['name'])->toBe('Brick 2x4')
            ->and($result->topPartTypes[0]['category'])->toBe('Bricks')
            ->and($result->topPartTypes[0]['total_quantity'])->toBe(30)
            ->and($result->rarestParts)->toHaveCount(1)
            ->and($result->rarestParts[0]['part_id'])->toBe(99)
            ->and($result->rarestParts[0]['part_name'])->toBe('Rare Brick')
            ->and($result->rarestParts[0]['color_id'])->toBe(2)
            ->and($result->rarestParts[0]['color_name'])->toBe('Blue')
            ->and($result->rarestParts[0]['quantity'])->toBe(1)
            ->and($result->diversityScore)->toBe(1.0);
    });

    it('should return diversity score of 0 when only one color exists', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $storageOptionIds = new Collection([10]);

        $storageOptionBuilder = \Mockery::mock(Builder::class);
        $storageOptionBuilder->shouldReceive('where')->with('family_id', 1)->andReturnSelf();
        $storageOptionBuilder->shouldReceive('pluck')->with('id')->andReturn($storageOptionIds);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')->once()->andReturn($storageOptionBuilder);

        // Count + Sum
        $countBuilder = \Mockery::mock(Builder::class);
        $countBuilder->shouldReceive('whereIn')->andReturnSelf();
        $countBuilder->shouldReceive('count')->andReturn(5);

        $sumBuilder = \Mockery::mock(Builder::class);
        $sumBuilder->shouldReceive('whereIn')->andReturnSelf();
        $sumBuilder->shouldReceive('sum')->andReturn(20);

        // Top colors — empty
        $topColorsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topColorsBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $topColorsBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topColorsBuilder->shouldReceive('toBase')->andReturn($topColorsBaseBuilder);

        // Top parts — empty
        $topPartsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topPartsBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $topPartsBuilder = mockChainBuilder(['whereIn', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topPartsBuilder->shouldReceive('toBase')->andReturn($topPartsBaseBuilder);

        // Rarest — empty
        $rarestBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $rarestBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $rarestBuilder = mockChainBuilder(['whereIn', 'join', 'leftJoin', 'selectRaw', 'orderBy', 'limit']);
        $rarestBuilder->shouldReceive('toBase')->andReturn($rarestBaseBuilder);

        // Diversity — only one color
        $diversityBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $diversityBaseBuilder->shouldReceive('pluck')->with('total_quantity')->andReturn(new Collection([20]));
        $diversityBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'selectRaw', 'groupBy']);
        $diversityBuilder->shouldReceive('toBase')->andReturn($diversityBaseBuilder);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')
            ->times(6)
            ->andReturn($countBuilder, $sumBuilder, $topColorsBuilder, $topPartsBuilder, $rarestBuilder, $diversityBuilder);

        $action = new GetBrickDnaAction($storageOption, $storageOptionPart);
        $result = $action->execute($family);

        expect($result->diversityScore)->toBe(0.0)
            ->and($result->totalUniqueParts)->toBe(5)
            ->and($result->totalPartsQuantity)->toBe(20);
    });

    it('should handle rarest parts with null color', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(2);

        $storageOptionIds = new Collection([30]);

        $storageOptionBuilder = \Mockery::mock(Builder::class);
        $storageOptionBuilder->shouldReceive('where')->with('family_id', 2)->andReturnSelf();
        $storageOptionBuilder->shouldReceive('pluck')->with('id')->andReturn($storageOptionIds);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')->once()->andReturn($storageOptionBuilder);

        $countBuilder = \Mockery::mock(Builder::class);
        $countBuilder->shouldReceive('whereIn')->andReturnSelf();
        $countBuilder->shouldReceive('count')->andReturn(1);

        $sumBuilder = \Mockery::mock(Builder::class);
        $sumBuilder->shouldReceive('whereIn')->andReturnSelf();
        $sumBuilder->shouldReceive('sum')->andReturn(3);

        $topColorsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topColorsBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $topColorsBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topColorsBuilder->shouldReceive('toBase')->andReturn($topColorsBaseBuilder);

        $topPartsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topPartsBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $topPartsBuilder = mockChainBuilder(['whereIn', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topPartsBuilder->shouldReceive('toBase')->andReturn($topPartsBaseBuilder);

        // Rarest — part with null color
        $rarestRow = (object) [
            'part_id' => 10,
            'part_num' => '1234',
            'part_name' => 'Unknown Part',
            'color_id' => null,
            'color_name' => null,
            'color_rgb' => null,
            'quantity' => 1,
        ];
        $rarestBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $rarestBaseBuilder->shouldReceive('get')->andReturn(new Collection([$rarestRow]));
        $rarestBuilder = mockChainBuilder(['whereIn', 'join', 'leftJoin', 'selectRaw', 'orderBy', 'limit']);
        $rarestBuilder->shouldReceive('toBase')->andReturn($rarestBaseBuilder);

        // Diversity — no colors
        $diversityBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $diversityBaseBuilder->shouldReceive('pluck')->with('total_quantity')->andReturn(new Collection);
        $diversityBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'selectRaw', 'groupBy']);
        $diversityBuilder->shouldReceive('toBase')->andReturn($diversityBaseBuilder);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')
            ->times(6)
            ->andReturn($countBuilder, $sumBuilder, $topColorsBuilder, $topPartsBuilder, $rarestBuilder, $diversityBuilder);

        $action = new GetBrickDnaAction($storageOption, $storageOptionPart);
        $result = $action->execute($family);

        expect($result->rarestParts)->toHaveCount(1)
            ->and($result->rarestParts[0]['color_id'])->toBeNull()
            ->and($result->rarestParts[0]['color_name'])->toBeNull()
            ->and($result->rarestParts[0]['color_rgb'])->toBeNull()
            ->and($result->rarestParts[0]['quantity'])->toBe(1);
    });

    it('should handle part types with null category', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(4);

        $storageOptionIds = new Collection([40]);

        $storageOptionBuilder = \Mockery::mock(Builder::class);
        $storageOptionBuilder->shouldReceive('where')->with('family_id', 4)->andReturnSelf();
        $storageOptionBuilder->shouldReceive('pluck')->with('id')->andReturn($storageOptionIds);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')->once()->andReturn($storageOptionBuilder);

        $countBuilder = \Mockery::mock(Builder::class);
        $countBuilder->shouldReceive('whereIn')->andReturnSelf();
        $countBuilder->shouldReceive('count')->andReturn(1);

        $sumBuilder = \Mockery::mock(Builder::class);
        $sumBuilder->shouldReceive('whereIn')->andReturnSelf();
        $sumBuilder->shouldReceive('sum')->andReturn(5);

        $topColorsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topColorsBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $topColorsBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topColorsBuilder->shouldReceive('toBase')->andReturn($topColorsBaseBuilder);

        // Top parts with null category
        $topPartsRow = (object) [
            'part_id' => 7,
            'part_num' => '5678',
            'name' => 'Mystery Part',
            'category' => null,
            'total_quantity' => 5,
        ];
        $topPartsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topPartsBaseBuilder->shouldReceive('get')->andReturn(new Collection([$topPartsRow]));
        $topPartsBuilder = mockChainBuilder(['whereIn', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topPartsBuilder->shouldReceive('toBase')->andReturn($topPartsBaseBuilder);

        $rarestBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $rarestBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $rarestBuilder = mockChainBuilder(['whereIn', 'join', 'leftJoin', 'selectRaw', 'orderBy', 'limit']);
        $rarestBuilder->shouldReceive('toBase')->andReturn($rarestBaseBuilder);

        $diversityBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $diversityBaseBuilder->shouldReceive('pluck')->with('total_quantity')->andReturn(new Collection);
        $diversityBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'selectRaw', 'groupBy']);
        $diversityBuilder->shouldReceive('toBase')->andReturn($diversityBaseBuilder);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')
            ->times(6)
            ->andReturn($countBuilder, $sumBuilder, $topColorsBuilder, $topPartsBuilder, $rarestBuilder, $diversityBuilder);

        $action = new GetBrickDnaAction($storageOption, $storageOptionPart);
        $result = $action->execute($family);

        expect($result->topPartTypes)->toHaveCount(1)
            ->and($result->topPartTypes[0]['category'])->toBeNull()
            ->and($result->topPartTypes[0]['name'])->toBe('Mystery Part');
    });

    it('should compute uneven diversity score between 0 and 1', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(5);

        $storageOptionIds = new Collection([50]);

        $storageOptionBuilder = \Mockery::mock(Builder::class);
        $storageOptionBuilder->shouldReceive('where')->with('family_id', 5)->andReturnSelf();
        $storageOptionBuilder->shouldReceive('pluck')->with('id')->andReturn($storageOptionIds);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')->once()->andReturn($storageOptionBuilder);

        $countBuilder = \Mockery::mock(Builder::class);
        $countBuilder->shouldReceive('whereIn')->andReturnSelf();
        $countBuilder->shouldReceive('count')->andReturn(10);

        $sumBuilder = \Mockery::mock(Builder::class);
        $sumBuilder->shouldReceive('whereIn')->andReturnSelf();
        $sumBuilder->shouldReceive('sum')->andReturn(100);

        $topColorsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topColorsBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $topColorsBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topColorsBuilder->shouldReceive('toBase')->andReturn($topColorsBaseBuilder);

        $topPartsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topPartsBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $topPartsBuilder = mockChainBuilder(['whereIn', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topPartsBuilder->shouldReceive('toBase')->andReturn($topPartsBaseBuilder);

        $rarestBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $rarestBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $rarestBuilder = mockChainBuilder(['whereIn', 'join', 'leftJoin', 'selectRaw', 'orderBy', 'limit']);
        $rarestBuilder->shouldReceive('toBase')->andReturn($rarestBaseBuilder);

        // Diversity — 90% one color, 10% another = low diversity
        $diversityBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $diversityBaseBuilder->shouldReceive('pluck')->with('total_quantity')->andReturn(new Collection([90, 10]));
        $diversityBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'selectRaw', 'groupBy']);
        $diversityBuilder->shouldReceive('toBase')->andReturn($diversityBaseBuilder);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')
            ->times(6)
            ->andReturn($countBuilder, $sumBuilder, $topColorsBuilder, $topPartsBuilder, $rarestBuilder, $diversityBuilder);

        $action = new GetBrickDnaAction($storageOption, $storageOptionPart);
        $result = $action->execute($family);

        // Shannon diversity for 90/10 split normalized: should be between 0 and 1
        expect($result->diversityScore)->toBeGreaterThan(0.0)
            ->and($result->diversityScore)->toBeLessThan(1.0);
    });

    it('should return diversity score of 0 when total quantity is zero across multiple colors', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(6);

        $storageOptionIds = new Collection([60]);

        $storageOptionBuilder = \Mockery::mock(Builder::class);
        $storageOptionBuilder->shouldReceive('where')->with('family_id', 6)->andReturnSelf();
        $storageOptionBuilder->shouldReceive('pluck')->with('id')->andReturn($storageOptionIds);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')->once()->andReturn($storageOptionBuilder);

        $countBuilder = \Mockery::mock(Builder::class);
        $countBuilder->shouldReceive('whereIn')->andReturnSelf();
        $countBuilder->shouldReceive('count')->andReturn(2);

        $sumBuilder = \Mockery::mock(Builder::class);
        $sumBuilder->shouldReceive('whereIn')->andReturnSelf();
        $sumBuilder->shouldReceive('sum')->andReturn(0);

        $topColorsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topColorsBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $topColorsBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topColorsBuilder->shouldReceive('toBase')->andReturn($topColorsBaseBuilder);

        $topPartsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topPartsBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $topPartsBuilder = mockChainBuilder(['whereIn', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topPartsBuilder->shouldReceive('toBase')->andReturn($topPartsBaseBuilder);

        $rarestBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $rarestBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $rarestBuilder = mockChainBuilder(['whereIn', 'join', 'leftJoin', 'selectRaw', 'orderBy', 'limit']);
        $rarestBuilder->shouldReceive('toBase')->andReturn($rarestBaseBuilder);

        // Diversity — 2 colors, both with zero quantity
        $diversityBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $diversityBaseBuilder->shouldReceive('pluck')->with('total_quantity')->andReturn(new Collection([0, 0]));
        $diversityBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'selectRaw', 'groupBy']);
        $diversityBuilder->shouldReceive('toBase')->andReturn($diversityBaseBuilder);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')
            ->times(6)
            ->andReturn($countBuilder, $sumBuilder, $topColorsBuilder, $topPartsBuilder, $rarestBuilder, $diversityBuilder);

        $action = new GetBrickDnaAction($storageOption, $storageOptionPart);
        $result = $action->execute($family);

        expect($result->diversityScore)->toBe(0.0);
    });

    it('should skip zero-quantity colors in diversity computation', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(7);

        $storageOptionIds = new Collection([70]);

        $storageOptionBuilder = \Mockery::mock(Builder::class);
        $storageOptionBuilder->shouldReceive('where')->with('family_id', 7)->andReturnSelf();
        $storageOptionBuilder->shouldReceive('pluck')->with('id')->andReturn($storageOptionIds);

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')->once()->andReturn($storageOptionBuilder);

        $countBuilder = \Mockery::mock(Builder::class);
        $countBuilder->shouldReceive('whereIn')->andReturnSelf();
        $countBuilder->shouldReceive('count')->andReturn(3);

        $sumBuilder = \Mockery::mock(Builder::class);
        $sumBuilder->shouldReceive('whereIn')->andReturnSelf();
        $sumBuilder->shouldReceive('sum')->andReturn(100);

        $topColorsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topColorsBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $topColorsBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topColorsBuilder->shouldReceive('toBase')->andReturn($topColorsBaseBuilder);

        $topPartsBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $topPartsBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $topPartsBuilder = mockChainBuilder(['whereIn', 'join', 'selectRaw', 'groupBy', 'orderByDesc', 'limit']);
        $topPartsBuilder->shouldReceive('toBase')->andReturn($topPartsBaseBuilder);

        $rarestBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $rarestBaseBuilder->shouldReceive('get')->andReturn(new Collection);
        $rarestBuilder = mockChainBuilder(['whereIn', 'join', 'leftJoin', 'selectRaw', 'orderBy', 'limit']);
        $rarestBuilder->shouldReceive('toBase')->andReturn($rarestBaseBuilder);

        // Diversity — 3 colors, one with zero quantity (skipped in Shannon computation)
        $diversityBaseBuilder = \Mockery::mock(BaseBuilder::class);
        $diversityBaseBuilder->shouldReceive('pluck')->with('total_quantity')->andReturn(new Collection([0, 50, 50]));
        $diversityBuilder = mockChainBuilder(['whereIn', 'whereNotNull', 'selectRaw', 'groupBy']);
        $diversityBuilder->shouldReceive('toBase')->andReturn($diversityBaseBuilder);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')
            ->times(6)
            ->andReturn($countBuilder, $sumBuilder, $topColorsBuilder, $topPartsBuilder, $rarestBuilder, $diversityBuilder);

        $action = new GetBrickDnaAction($storageOption, $storageOptionPart);
        $result = $action->execute($family);

        // With the zero-quantity color skipped, the two remaining colors are equal
        // Shannon normalized for 2 equal proportions out of 3 distinct colors:
        // H = -2*(0.5*ln(0.5)) = ln(2) ≈ 0.6931
        // H_max = ln(3) ≈ 1.0986
        // Normalized = 0.6931/1.0986 ≈ 0.6309
        expect($result->diversityScore)->toBeGreaterThan(0.0)
            ->and($result->diversityScore)->toBeLessThan(1.0);
    });
});
