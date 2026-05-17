<?php

declare(strict_types = 1);

use App\Actions\Family\GetFamilyPartUsageAction;
use App\Enums\FamilySetStatus;
use App\Models\Family;
use App\Models\Part;
use App\Models\SetPart;
use App\Models\StorageOptionPart;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as BaseBuilder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Collection;

covers(GetFamilyPartUsageAction::class);

/**
 * Q1: parts ⨝ colors metadata lookup. Returns one row at most. We assert SQL shape
 * by matching `where('parts.part_num', $partNum)`, `leftJoin('colors', Closure)`,
 * the explicit select column list, and a single `toBase()->first()` call.
 *
 * The leftJoin closure is invoked against a JoinClause mock to cover the inner
 * `whereRaw('colors.id = ?', [$colorId])` parameter binding — proving the colour
 * filter is applied without spilling raw expressions across the codebase.
 */
function buildMetadataQuery(string $partNum, int $colorId, ?\stdClass $row): Builder
{
    $base = \Mockery::mock(BaseBuilder::class);
    $base->shouldReceive('first')->once()->andReturn($row);

    $joinClause = \Mockery::mock(JoinClause::class);
    $joinClause->shouldReceive('whereRaw')
        ->once()
        ->with('colors.id = ?', [$colorId])
        ->andReturnSelf();

    $builder = \Mockery::mock(Builder::class);
    $builder->shouldReceive('where')->once()->with('parts.part_num', $partNum)->andReturnSelf();
    $builder->shouldReceive('leftJoin')
        ->once()
        ->with('colors', \Mockery::on(static function(\Closure $closure) use ($joinClause): bool {
            $closure($joinClause);

            return true;
        }))
        ->andReturnSelf();
    $builder->shouldReceive('select')->once()->with([
        'parts.name as part_name',
        'parts.image_url as part_image_url',
        'colors.name as color_name',
        'colors.rgb as color_hex',
    ])->andReturnSelf();
    $builder->shouldReceive('toBase')->once()->andReturn($base);

    return $builder;
}

/**
 * Q2: per-family_set demand for the requested (part_num, color_id). Strict matchers
 * lock SQL shape — re-ordering or dropping a clause causes mutation tests to surface.
 */
function buildUsageQuery(int $familyId, string $partNum, int $colorId, Collection $rows): Builder
{
    $base = \Mockery::mock(BaseBuilder::class);
    $base->shouldReceive('get')->once()->andReturn($rows);

    $builder = \Mockery::mock(Builder::class);
    $builder->shouldReceive('where')->once()->with('set_parts.is_spare', false)->andReturnSelf();
    $builder->shouldReceive('where')->once()->with('set_parts.color_id', $colorId)->andReturnSelf();
    $builder->shouldReceive('join')->once()->with('parts', 'parts.id', '=', 'set_parts.part_id')->andReturnSelf();
    $builder->shouldReceive('join')->once()->with('family_sets', 'family_sets.set_id', '=', 'set_parts.set_id')->andReturnSelf();
    $builder->shouldReceive('join')->once()->with('sets', 'sets.id', '=', 'set_parts.set_id')->andReturnSelf();
    $builder->shouldReceive('where')->once()->with('parts.part_num', $partNum)->andReturnSelf();
    $builder->shouldReceive('where')->once()->with('family_sets.family_id', $familyId)->andReturnSelf();
    $builder->shouldReceive('whereNotIn')->once()->with('family_sets.status', [FamilySetStatus::Wishlist->value, FamilySetStatus::InStorage->value])->andReturnSelf();
    $builder->shouldReceive('select')->once()->with([
        'family_sets.id as family_set_id',
        'family_sets.status as status',
        'sets.set_num as set_num',
        'sets.name as set_name',
    ])->andReturnSelf();
    $builder->shouldReceive('selectRaw')->once()->with('SUM(set_parts.quantity * family_sets.quantity) AS quantity_needed')->andReturnSelf();
    $builder->shouldReceive('groupBy')->once()->with('family_sets.id', 'family_sets.status', 'sets.set_num', 'sets.name')->andReturnSelf();
    $builder->shouldReceive('toBase')->once()->andReturn($base);

    return $builder;
}

/**
 * Q3: family-wide stored quantity for the (part_num, color_id) pair.
 */
function buildStoredQuantityQuery(int $familyId, string $partNum, int $colorId, ?\stdClass $row): Builder
{
    $base = \Mockery::mock(BaseBuilder::class);
    $base->shouldReceive('first')->once()->andReturn($row);

    $builder = \Mockery::mock(Builder::class);
    $builder->shouldReceive('join')->once()->with('parts', 'parts.id', '=', 'storage_option_parts.part_id')->andReturnSelf();
    $builder->shouldReceive('join')->once()->with('storage_options', 'storage_options.id', '=', 'storage_option_parts.storage_option_id')->andReturnSelf();
    $builder->shouldReceive('where')->once()->with('parts.part_num', $partNum)->andReturnSelf();
    $builder->shouldReceive('where')->once()->with('storage_option_parts.color_id', $colorId)->andReturnSelf();
    $builder->shouldReceive('where')->once()->with('storage_options.family_id', $familyId)->andReturnSelf();
    $builder->shouldReceive('selectRaw')->once()->with('SUM(storage_option_parts.quantity) AS quantity_stored')->andReturnSelf();
    $builder->shouldReceive('toBase')->once()->andReturn($base);

    return $builder;
}

describe('GetFamilyPartUsageAction', function(): void {
    it('should return envelope with metadata and empty usages when no sets need the part', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $metadataRow = (object) [
            'part_name' => 'Brick 2 x 4',
            'part_image_url' => 'https://example.test/3001.png',
            'color_name' => 'Red',
            'color_hex' => 'C91A09',
        ];

        $part = \Mockery::mock(Part::class);
        $part->shouldReceive('newQuery')->once()->andReturn(buildMetadataQuery('3001', 4, $metadataRow));

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->once()->andReturn(buildUsageQuery(1, '3001', 4, new Collection));

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->once()
            ->andReturn(buildStoredQuantityQuery(1, '3001', 4, (object) ['quantity_stored' => null]));

        $action = new GetFamilyPartUsageAction($part, $setPart, $storageOptionPart);
        $result = $action->execute($family, '3001', 4);

        expect($result->partNum)->toBe('3001')
            ->and($result->colorId)->toBe(4)
            ->and($result->partName)->toBe('Brick 2 x 4')
            ->and($result->partImageUrl)->toBe('https://example.test/3001.png')
            ->and($result->colorName)->toBe('Red')
            ->and($result->colorHex)->toBe('C91A09')
            ->and($result->usages->isEmpty())->toBeTrue();
    });

    it('should return null metadata fields and empty usages when part is unknown to the catalog', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(2);

        $part = \Mockery::mock(Part::class);
        $part->shouldReceive('newQuery')->once()->andReturn(buildMetadataQuery('9999', 4, null));

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->once()->andReturn(buildUsageQuery(2, '9999', 4, new Collection));

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->once()
            ->andReturn(buildStoredQuantityQuery(2, '9999', 4, null));

        $action = new GetFamilyPartUsageAction($part, $setPart, $storageOptionPart);
        $result = $action->execute($family, '9999', 4);

        expect($result->partNum)->toBe('9999')
            ->and($result->colorId)->toBe(4)
            ->and($result->partName)->toBeNull()
            ->and($result->partImageUrl)->toBeNull()
            ->and($result->colorName)->toBeNull()
            ->and($result->colorHex)->toBeNull()
            ->and($result->usages->isEmpty())->toBeTrue();
    });

    it('should compute one entry per family_set with per-set need, family-wide stored, and shortfall', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(3);

        $metadataRow = (object) [
            'part_name' => 'Plate 2 x 4',
            'part_image_url' => null,
            'color_name' => 'Blue',
            'color_hex' => '0055BF',
        ];

        // Two non-wishlist family_sets need (part '3020', color 5). Mismatched scalar
        // types in the mock prove the (string)/(int) casts in the Action — removing a
        // cast surfaces as a TypeError or wrong field value.
        //
        // Set A: needs 4, status 'built', family_set_id supplied as int.
        // Set B: needs 12, status 'in_progress', family_set_id supplied as string.
        // Family-wide stored: 6.
        //
        // Expected:
        //   Set A → quantityNeeded 4,  shortfall max(0, 4-6) = 0.
        //   Set B → quantityNeeded 12, shortfall max(0, 12-6) = 6.
        $usageRows = new Collection([
            (object) [
                'family_set_id' => 100,                              // int → (int) 100
                'status' => 'built',
                'set_num' => '75192-1',
                'set_name' => 'Millennium Falcon',
                'quantity_needed' => '4',                            // string → (int) 4
            ],
            (object) [
                'family_set_id' => '101',                            // string → (int) 101
                'status' => 'in_progress',
                'set_num' => 10_294,                                 // int → (string) '10294'
                'set_name' => 'Titanic',
                'quantity_needed' => 12,
            ],
        ]);

        $part = \Mockery::mock(Part::class);
        $part->shouldReceive('newQuery')->once()->andReturn(buildMetadataQuery('3020', 5, $metadataRow));

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->once()->andReturn(buildUsageQuery(3, '3020', 5, $usageRows));

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->once()
            ->andReturn(buildStoredQuantityQuery(3, '3020', 5, (object) ['quantity_stored' => '6']));

        $action = new GetFamilyPartUsageAction($part, $setPart, $storageOptionPart);
        $result = $action->execute($family, '3020', 5);

        expect($result->partName)->toBe('Plate 2 x 4')
            ->and($result->partImageUrl)->toBeNull()
            ->and($result->colorName)->toBe('Blue')
            ->and($result->colorHex)->toBe('0055BF')
            ->and($result->usages)->toHaveCount(2);

        $entries = $result->usages->all();

        expect($entries[0]->familySetId)->toBe(100)
            ->and($entries[0]->setNum)->toBe('75192-1')
            ->and($entries[0]->setName)->toBe('Millennium Falcon')
            ->and($entries[0]->status)->toBe(FamilySetStatus::Built)
            ->and($entries[0]->quantityNeeded)->toBe(4)
            ->and($entries[0]->quantityStored)->toBe(6)
            ->and($entries[0]->shortfall)->toBe(0);

        expect($entries[1]->familySetId)->toBe(101)
            ->and($entries[1]->setNum)->toBe('10294')
            ->and($entries[1]->setName)->toBe('Titanic')
            ->and($entries[1]->status)->toBe(FamilySetStatus::InProgress)
            ->and($entries[1]->quantityNeeded)->toBe(12)
            ->and($entries[1]->quantityStored)->toBe(6)
            ->and($entries[1]->shortfall)->toBe(6);
    });

    it('should treat null stored aggregate as zero', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(4);

        $usageRows = new Collection([
            (object) [
                'family_set_id' => 200,
                'status' => 'sealed',
                'set_num' => '21318-1',
                'set_name' => 'Treehouse',
                'quantity_needed' => 9,
            ],
        ]);

        $part = \Mockery::mock(Part::class);
        $part->shouldReceive('newQuery')->once()->andReturn(buildMetadataQuery(
            'X',
            11,
            (object) [
                'part_name' => 'Slope',
                'part_image_url' => null,
                'color_name' => 'Black',
                'color_hex' => '05131D',
            ],
        ));

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->once()->andReturn(buildUsageQuery(4, 'X', 11, $usageRows));

        // SUM() over an empty result returns NULL — the Action must coerce to 0.
        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->once()
            ->andReturn(buildStoredQuantityQuery(4, 'X', 11, (object) ['quantity_stored' => null]));

        $action = new GetFamilyPartUsageAction($part, $setPart, $storageOptionPart);
        $result = $action->execute($family, 'X', 11);

        $entries = $result->usages->all();

        expect($entries)->toHaveCount(1)
            ->and($entries[0]->quantityStored)->toBe(0)
            ->and($entries[0]->shortfall)->toBe(9);
    });

    it('should return empty usages and zero stored when neither part nor sets are known', function(): void {
        // Catalog has the part but no family_sets reference it AND no storage rows exist.
        // This path proves the empty-collection map() branch and the null-storedRow branch
        // travel the code without raising.
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(5);

        $part = \Mockery::mock(Part::class);
        $part->shouldReceive('newQuery')->once()->andReturn(buildMetadataQuery(
            '3001',
            4,
            (object) [
                'part_name' => 'Brick',
                'part_image_url' => null,
                'color_name' => 'Red',
                'color_hex' => 'C91A09',
            ],
        ));

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->once()->andReturn(buildUsageQuery(5, '3001', 4, new Collection));

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->once()
            ->andReturn(buildStoredQuantityQuery(5, '3001', 4, null));

        $action = new GetFamilyPartUsageAction($part, $setPart, $storageOptionPart);
        $result = $action->execute($family, '3001', 4);

        expect($result->usages->isEmpty())->toBeTrue()
            ->and($result->partName)->toBe('Brick')
            ->and($result->colorName)->toBe('Red');
    });
});
