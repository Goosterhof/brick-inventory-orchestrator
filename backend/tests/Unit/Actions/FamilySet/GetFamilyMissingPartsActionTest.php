<?php

declare(strict_types = 1);

use App\Actions\FamilySet\GetFamilyMissingPartsAction;
use App\Enums\FamilySetStatus;
use App\Models\Family;
use App\Models\FamilySet;
use App\Models\SetPart;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as BaseBuilder;
use Illuminate\Support\Collection;

covers(GetFamilyMissingPartsAction::class);

/**
 * Q1: non-wishlist family_sets — id + set_id only. Strict matchers lock SQL shape.
 */
function buildFamilySetsQuery(int $familyId, Collection $rows): Builder
{
    $base = \Mockery::mock(BaseBuilder::class);
    $base->shouldReceive('get')->once()->andReturn($rows);

    $builder = \Mockery::mock(Builder::class);
    $builder->shouldReceive('where')->once()->with('family_sets.family_id', $familyId)->andReturnSelf();
    $builder->shouldReceive('whereNotIn')->once()->with('family_sets.status', [FamilySetStatus::Wishlist->value, FamilySetStatus::InStorage->value])->andReturnSelf();
    $builder->shouldReceive('select')->once()->with(['family_sets.id as family_set_id', 'family_sets.set_id'])->andReturnSelf();
    $builder->shouldReceive('toBase')->once()->andReturn($base);

    return $builder;
}

/**
 * Q2: aggregated NEEDED per (part_num, color_id) joined across family_sets, parts, colors.
 */
function buildNeededQuery(int $familyId, Collection $rows): Builder
{
    $base = \Mockery::mock(BaseBuilder::class);
    $base->shouldReceive('get')->once()->andReturn($rows);

    $builder = \Mockery::mock(Builder::class);
    $builder->shouldReceive('where')->once()->with('set_parts.is_spare', false)->andReturnSelf();
    $builder->shouldReceive('join')->once()->with('family_sets', 'family_sets.set_id', '=', 'set_parts.set_id')->andReturnSelf();
    $builder->shouldReceive('join')->once()->with('parts', 'parts.id', '=', 'set_parts.part_id')->andReturnSelf();
    $builder->shouldReceive('join')->once()->with('colors', 'colors.id', '=', 'set_parts.color_id')->andReturnSelf();
    $builder->shouldReceive('where')->once()->with('family_sets.family_id', $familyId)->andReturnSelf();
    $builder->shouldReceive('whereNotIn')->once()->with('family_sets.status', [FamilySetStatus::Wishlist->value, FamilySetStatus::InStorage->value])->andReturnSelf();
    $builder->shouldReceive('groupBy')->once()->with('parts.id', 'parts.part_num', 'set_parts.color_id', 'parts.name', 'colors.name', 'colors.rgb', 'parts.image_url')->andReturnSelf();
    $builder->shouldReceive('selectRaw')->once()->with('parts.id AS part_id, parts.part_num AS part_num, set_parts.color_id AS color_id, parts.name AS part_name, colors.name AS color_name, colors.rgb AS color_hex, parts.image_url AS part_image_url, SUM(set_parts.quantity * family_sets.quantity) AS quantity_needed')->andReturnSelf();
    $builder->shouldReceive('toBase')->once()->andReturn($base);

    return $builder;
}

/**
 * Q3a: storage_options for family — pluck('id') returns a Collection.
 */
function buildStorageOptionIdsQuery(int $familyId, Collection $ids): Builder
{
    $builder = \Mockery::mock(Builder::class);
    $builder->shouldReceive('where')->once()->with('family_id', $familyId)->andReturnSelf();
    $builder->shouldReceive('pluck')->once()->with('id')->andReturn($ids);

    return $builder;
}

/**
 * Q3b: aggregated STORED per (part_num, color_id), null colors filtered out.
 */
function buildStoredQuery(array $storageOptionIds, Collection $rows): Builder
{
    $base = \Mockery::mock(BaseBuilder::class);
    $base->shouldReceive('get')->once()->andReturn($rows);

    $builder = \Mockery::mock(Builder::class);
    $builder->shouldReceive('whereIn')->once()->with('storage_option_parts.storage_option_id', $storageOptionIds)->andReturnSelf();
    $builder->shouldReceive('whereNotNull')->once()->with('storage_option_parts.color_id')->andReturnSelf();
    $builder->shouldReceive('join')->once()->with('parts', 'parts.id', '=', 'storage_option_parts.part_id')->andReturnSelf();
    $builder->shouldReceive('groupBy')->once()->with('parts.part_num', 'storage_option_parts.color_id')->andReturnSelf();
    $builder->shouldReceive('selectRaw')->once()->with('parts.part_num AS part_num, storage_option_parts.color_id AS color_id, SUM(storage_option_parts.quantity) AS quantity_stored')->andReturnSelf();
    $builder->shouldReceive('toBase')->once()->andReturn($base);

    return $builder;
}

/**
 * Q4: needed-by-set lookup — distinct (part_num, color_id, set_num).
 */
function buildNeededBySetQuery(int $familyId, Collection $rows): Builder
{
    $base = \Mockery::mock(BaseBuilder::class);
    $base->shouldReceive('get')->once()->andReturn($rows);

    $builder = \Mockery::mock(Builder::class);
    $builder->shouldReceive('where')->once()->with('set_parts.is_spare', false)->andReturnSelf();
    $builder->shouldReceive('join')->once()->with('family_sets', 'family_sets.set_id', '=', 'set_parts.set_id')->andReturnSelf();
    $builder->shouldReceive('join')->once()->with('sets', 'sets.id', '=', 'set_parts.set_id')->andReturnSelf();
    $builder->shouldReceive('join')->once()->with('parts', 'parts.id', '=', 'set_parts.part_id')->andReturnSelf();
    $builder->shouldReceive('where')->once()->with('family_sets.family_id', $familyId)->andReturnSelf();
    $builder->shouldReceive('whereNotIn')->once()->with('family_sets.status', [FamilySetStatus::Wishlist->value, FamilySetStatus::InStorage->value])->andReturnSelf();
    $builder->shouldReceive('distinct')->once()->withNoArgs()->andReturnSelf();
    $builder->shouldReceive('select')->once()->with(['parts.part_num as part_num', 'set_parts.color_id as color_id', 'sets.set_num as set_num'])->andReturnSelf();
    $builder->shouldReceive('toBase')->once()->andReturn($base);

    return $builder;
}

/**
 * Q5: known set_ids — distinct pluck over non-spare set_parts.
 */
function buildKnownSetIdsQuery(array $setIds, Collection $knownIds): Builder
{
    $builder = \Mockery::mock(Builder::class);
    $builder->shouldReceive('where')->once()->with('is_spare', false)->andReturnSelf();
    $builder->shouldReceive('whereIn')->once()->with('set_id', $setIds)->andReturnSelf();
    $builder->shouldReceive('distinct')->once()->withNoArgs()->andReturnSelf();
    $builder->shouldReceive('pluck')->once()->with('set_id')->andReturn($knownIds);

    return $builder;
}

describe('GetFamilyMissingPartsAction', function(): void {
    it('should return empty envelope when family has no non-wishlist sets', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->shouldReceive('newQuery')->once()->andReturn(buildFamilySetsQuery(1, new Collection));

        $setPart = \Mockery::mock(SetPart::class);
        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);

        $action = new GetFamilyMissingPartsAction($familySet, $setPart, $storageOption, $storageOptionPart);
        $result = $action->execute($family);

        expect($result->shortfalls)->toBe([])
            ->and($result->unknownFamilySetIds)->toBe([]);
    });

    it('should surface un-synced family sets as unknown and report no shortfalls', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(2);

        // Q1: non-wishlist family_set 500 pointing at set_id 99 which has no set_parts rows.
        // family_set_id is an int in the mock to prove the (string) cast converts it to '500'.
        $familySetRow = (object) [
            'family_set_id' => 500,
            'set_id' => 99,
        ];
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->shouldReceive('newQuery')->once()->andReturn(buildFamilySetsQuery(2, new Collection([$familySetRow])));

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->times(3)->andReturn(
            buildNeededQuery(2, new Collection),
            buildNeededBySetQuery(2, new Collection),
            buildKnownSetIdsQuery([99], new Collection),
        );

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')->once()->andReturn(buildStorageOptionIdsQuery(2, new Collection));

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldNotReceive('newQuery');

        $action = new GetFamilyMissingPartsAction($familySet, $setPart, $storageOption, $storageOptionPart);
        $result = $action->execute($family);

        expect($result->shortfalls)->toBe([])
            ->and($result->unknownFamilySetIds)->toBe(['500']);
    });

    it('should compute shortfalls, subtract stored, attach set_nums, and skip zero-shortfall rows', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(3);

        // Two owned sets: set 30 (75192-1), set 31 (10294-1).
        $familySetRows = new Collection([
            (object) ['family_set_id' => 300, 'set_id' => 30],
            (object) ['family_set_id' => 301, 'set_id' => 31],
        ]);
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->shouldReceive('newQuery')->once()->andReturn(buildFamilySetsQuery(3, $familySetRows));

        // Q2: three needed rows. Types are intentionally mismatched in the mock so that removing
        // the (string)/(int) casts produces a TypeError or wrong array value — making the cast
        // mutants observable.
        //
        // Row A: part '3001' / color 4 — zero shortfall (stored fully satisfies). First in the loop,
        //        so ContinueToBreak mutation would skip all later rows.
        // Row B: part '3001' / color 5 — non-zero shortfall. Shares part_num with A — exposes
        //        `$partNum . ':'` (RemoveRight) key-collision mutants.
        // Row C: part '3020' / color 4 — non-zero shortfall. Shares color_id with A — exposes
        //        `':' . $colorId` (RemoveLeft) key-collision mutants.
        $neededRows = new Collection([
            (object) [
                'part_id' => '101',                                  // string → (int) 101
                'part_num' => 3_001,                                  // int → (string) '3001'
                'color_id' => '4',                                   // string → (int) 4
                'part_name' => 'Brick 2 x 4',
                'color_name' => 'Red',
                'color_hex' => 'C91A09',
                'part_image_url' => 'https://example.test/3001.png',
                'quantity_needed' => '10',                           // string → (int) 10
            ],
            (object) [
                'part_id' => 101,
                'part_num' => '3001',
                'color_id' => 5,
                'part_name' => 'Brick 2 x 4',
                'color_name' => 'Blue',
                'color_hex' => '0055BF',
                'part_image_url' => null,
                'quantity_needed' => 20,
            ],
            (object) [
                'part_id' => 202,
                'part_num' => '3020',
                'color_id' => 4,
                'part_name' => 'Plate 2 x 4',
                'color_name' => 'Red',
                'color_hex' => 'C91A09',
                'part_image_url' => 'https://example.test/3020.png',
                'quantity_needed' => 15,
            ],
        ]);

        // Q4: set_num mapping. Different pairs map to different sets, dedupe across repeated rows.
        $neededBySetRows = new Collection([
            (object) ['part_num' => '3001', 'color_id' => 4, 'set_num' => '75192-1'],
            (object) ['part_num' => '3001', 'color_id' => 5, 'set_num' => '10294-1'],
            (object) ['part_num' => '3001', 'color_id' => 5, 'set_num' => '75192-1'],
            (object) ['part_num' => '3001', 'color_id' => 5, 'set_num' => '75192-1'], // dedupe
            (object) ['part_num' => '3020', 'color_id' => 4, 'set_num' => '75192-1'],
        ]);

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->times(3)->andReturn(
            buildNeededQuery(3, $neededRows),
            buildNeededBySetQuery(3, $neededBySetRows),
            buildKnownSetIdsQuery([30, 31], new Collection([30, 31])),
        );

        // Q3: storage option exists (id 7).
        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')->once()->andReturn(buildStorageOptionIdsQuery(3, new Collection([7])));

        // Q3b: stored rows. (3001,4) fully satisfies row A (10 stored vs 10 needed).
        //      (3001,5) partial (8 of 20 needed). (3020,4) partial (5 of 15 needed).
        //      Two decoy rows never matched under correct key(), but crafted to collide under
        //      mutated key() variants so that their high quantities corrupt the real lookups —
        //      observable via shortfall differences.
        //
        //        decoy (3050,4)  → ':4'      clashes with (3001,4)/(3020,4) under RemoveLeft
        //        decoy (300,15) → '30015'    clashes with (3001,5) under RemoveRight-inner
        $storedRows = new Collection([
            (object) ['part_num' => '3001', 'color_id' => 4, 'quantity_stored' => 10],
            (object) ['part_num' => '3001', 'color_id' => 5, 'quantity_stored' => 8],
            (object) ['part_num' => '3020', 'color_id' => 4, 'quantity_stored' => 5],
            (object) ['part_num' => '3050', 'color_id' => 4, 'quantity_stored' => 999],
            (object) ['part_num' => '300', 'color_id' => 15, 'quantity_stored' => 99_999],
        ]);
        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->once()->andReturn(buildStoredQuery([7], $storedRows));

        $action = new GetFamilyMissingPartsAction($familySet, $setPart, $storageOption, $storageOptionPart);
        $result = $action->execute($family);

        // Row A is zero-shortfall so it's dropped; rows B and C survive.
        expect($result->shortfalls)->toHaveCount(2)
            ->and($result->shortfalls[0])->toBe([
                'part_id' => 101,
                'part_num' => '3001',
                'color_id' => 5,
                'part_name' => 'Brick 2 x 4',
                'color_name' => 'Blue',
                'color_hex' => '0055BF',
                'part_image_url' => null,
                'quantity_needed' => 20,
                'quantity_stored' => 8,
                'shortfall' => 12,
                'needed_by_set_nums' => ['10294-1', '75192-1'],
            ])
            ->and($result->shortfalls[1])->toBe([
                'part_id' => 202,
                'part_num' => '3020',
                'color_id' => 4,
                'part_name' => 'Plate 2 x 4',
                'color_name' => 'Red',
                'color_hex' => 'C91A09',
                'part_image_url' => 'https://example.test/3020.png',
                'quantity_needed' => 15,
                'quantity_stored' => 5,
                'shortfall' => 10,
                'needed_by_set_nums' => ['75192-1'],
            ])
            ->and($result->unknownFamilySetIds)->toBe([]);
    });

    it('should treat stored rows with null color as non-matching and skip Q3 entirely when no storage options', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(4);

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->shouldReceive('newQuery')->once()->andReturn(buildFamilySetsQuery(4, new Collection([
            (object) ['family_set_id' => 400, 'set_id' => 40],
        ])));

        $neededRows = new Collection([
            (object) [
                'part_id' => 1,
                'part_num' => 'X',
                'color_id' => 7,
                'part_name' => 'PartX',
                'color_name' => 'Blue',
                'color_hex' => '0055BF',
                'part_image_url' => null,
                'quantity_needed' => 5,
            ],
        ]);

        $neededBySetRows = new Collection([
            (object) ['part_num' => 'X', 'color_id' => 7, 'set_num' => '10294-1'],
        ]);

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->times(3)->andReturn(
            buildNeededQuery(4, $neededRows),
            buildNeededBySetQuery(4, $neededBySetRows),
            buildKnownSetIdsQuery([40], new Collection([40])),
        );

        // No storage options — Q3b must NOT run.
        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')->once()->andReturn(buildStorageOptionIdsQuery(4, new Collection));

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldNotReceive('newQuery');

        $action = new GetFamilyMissingPartsAction($familySet, $setPart, $storageOption, $storageOptionPart);
        $result = $action->execute($family);

        expect($result->shortfalls)->toHaveCount(1)
            ->and($result->shortfalls[0]['shortfall'])->toBe(5)
            ->and($result->shortfalls[0]['quantity_stored'])->toBe(0)
            ->and($result->shortfalls[0]['needed_by_set_nums'])->toBe(['10294-1'])
            ->and($result->unknownFamilySetIds)->toBe([]);
    });

    it('should deduplicate set_nums when the same part+color appears across multiple owned sets', function(): void {
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(5);

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->shouldReceive('newQuery')->once()->andReturn(buildFamilySetsQuery(5, new Collection([
            (object) ['family_set_id' => 1, 'set_id' => 10],
            (object) ['family_set_id' => 2, 'set_id' => 20],
        ])));

        $neededRows = new Collection([
            (object) [
                'part_id' => 1,
                'part_num' => 'X',
                'color_id' => 7,
                'part_name' => 'PartX',
                'color_name' => 'Blue',
                'color_hex' => '0055BF',
                'part_image_url' => null,
                'quantity_needed' => 15,
            ],
        ]);

        // Same (part_num, color_id) appears in both sets — plus a duplicate row to prove the
        // in_array dedupe branch on already-seen set_nums.
        $neededBySetRows = new Collection([
            (object) ['part_num' => 'X', 'color_id' => 7, 'set_num' => '75192-1'],
            (object) ['part_num' => 'X', 'color_id' => 7, 'set_num' => '10281-1'],
            (object) ['part_num' => 'X', 'color_id' => 7, 'set_num' => '75192-1'],
        ]);

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->times(3)->andReturn(
            buildNeededQuery(5, $neededRows),
            buildNeededBySetQuery(5, $neededBySetRows),
            buildKnownSetIdsQuery([10, 20], new Collection([10, 20])),
        );

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newQuery')->once()->andReturn(buildStorageOptionIdsQuery(5, new Collection));

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldNotReceive('newQuery');

        $action = new GetFamilyMissingPartsAction($familySet, $setPart, $storageOption, $storageOptionPart);
        $result = $action->execute($family);

        expect($result->shortfalls)->toHaveCount(1)
            ->and($result->shortfalls[0]['shortfall'])->toBe(15)
            ->and($result->shortfalls[0]['needed_by_set_nums'])->toBe(['75192-1', '10281-1']);
    });
});
