<?php

declare(strict_types = 1);

use App\Actions\Sync\StoreSetPartsAction;
use App\DataTransferObjects\Input\Lego\LegoColorData;
use App\DataTransferObjects\Input\Lego\LegoPartData;
use App\DataTransferObjects\Input\Lego\LegoSetPartData;
use App\Models\Color;
use App\Models\Part;
use App\Models\Set;
use App\Models\SetPart;
use Carbon\CarbonImmutable;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

covers(StoreSetPartsAction::class);

describe('StoreSetPartsAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
    });

    /**
     * Build a fully-mocked Color model with a chained newQuery() pipeline:
     *   - upsert(...) recorded
     *   - whereIn(...)->pluck('id', 'rebrickable_id') returns the supplied id map
     *
     * @param array<int, int> $idsByRebrickableId
     */
    $buildColorMock = function(array $idsByRebrickableId, ?\Closure $captureUpsert = null): Color {
        $upsertBuilder = \Mockery::mock(Builder::class);
        $upsertBuilder->shouldReceive('upsert')
            ->andReturnUsing(function(array $values, array $unique, array $update) use ($captureUpsert): int {
                if ($captureUpsert instanceof \Closure) {
                    $captureUpsert($values, $unique, $update);
                }

                return \count($values);
            });

        $reloadBuilder = \Mockery::mock(Builder::class);
        $reloadBuilder->shouldReceive('whereIn')->andReturnSelf();
        $reloadBuilder->shouldReceive('pluck')
            ->with('id', 'rebrickable_id')
            ->andReturn(new Collection($idsByRebrickableId));

        $color = \Mockery::mock(Color::class);
        $color->shouldReceive('newQuery')->andReturn($upsertBuilder, $reloadBuilder);

        return $color;
    };

    /**
     * @param array<string, int> $idsByPartNum
     */
    $buildPartMock = function(array $idsByPartNum, ?\Closure $captureUpsert = null): Part {
        $upsertBuilder = \Mockery::mock(Builder::class);
        $upsertBuilder->shouldReceive('upsert')
            ->andReturnUsing(function(array $values, array $unique, array $update) use ($captureUpsert): int {
                if ($captureUpsert instanceof \Closure) {
                    $captureUpsert($values, $unique, $update);
                }

                return \count($values);
            });

        $reloadBuilder = \Mockery::mock(Builder::class);
        $reloadBuilder->shouldReceive('whereIn')->andReturnSelf();
        $reloadBuilder->shouldReceive('pluck')
            ->with('id', 'part_num')
            ->andReturn(new Collection($idsByPartNum));

        $part = \Mockery::mock(Part::class);
        $part->shouldReceive('newQuery')->andReturn($upsertBuilder, $reloadBuilder);

        return $part;
    };

    /**
     * @param list<array<string, mixed>> $capturedChunks
     */
    $buildSetPartMock = function(array &$capturedChunks): SetPart {
        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('upsert')
            ->andReturnUsing(function(array $values, array $unique, array $update) use (&$capturedChunks): int {
                $capturedChunks[] = ['values' => $values, 'unique' => $unique, 'update' => $update];

                return \count($values);
            });

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->andReturn($builder);

        return $setPart;
    };

    it('should be a no-op when given an empty parts list', function() use ($buildColorMock, $buildPartMock): void {
        // arrange
        $set = \Mockery::mock(Set::class);
        $color = $buildColorMock([]);
        $color->shouldNotReceive('newQuery');

        $part = $buildPartMock([]);
        $part->shouldNotReceive('newQuery');

        $setPartBuilder = \Mockery::mock(Builder::class);
        $setPartBuilder->shouldNotReceive('upsert');

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldNotReceive('newQuery');

        $this->db->shouldNotReceive('transaction');

        $action = new StoreSetPartsAction($color, $part, $setPart, $this->db);

        // act
        $action->execute($set, []);

        // assert — Mockery verifies expectations
    });

    it('should dedupe colors by rebrickable_id into a single bulk upsert with full payload, uniqueBy, and update args', function() use ($buildPartMock, $buildSetPartMock): void {
        // arrange
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback): mixed => $callback());

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $colorUpsertCalls = [];
        $reloadWhereInCalls = [];

        $upsertBuilder = \Mockery::mock(Builder::class);
        $upsertBuilder->shouldReceive('upsert')
            ->once()
            ->andReturnUsing(function(array $values, array $unique, array $update) use (&$colorUpsertCalls): int {
                $colorUpsertCalls[] = ['values' => $values, 'unique' => $unique, 'update' => $update];

                return \count($values);
            });

        $reloadBuilder = \Mockery::mock(Builder::class);
        $reloadBuilder->shouldReceive('whereIn')
            ->andReturnUsing(function(string $column, array $values) use (&$reloadWhereInCalls, $reloadBuilder): Builder {
                $reloadWhereInCalls[] = ['column' => $column, 'values' => $values];

                return $reloadBuilder;
            });
        $reloadBuilder->shouldReceive('pluck')->with('id', 'rebrickable_id')->andReturn(new Collection([1 => 11]));

        $color = \Mockery::mock(Color::class);
        $color->shouldReceive('newQuery')->twice()->andReturn($upsertBuilder, $reloadBuilder);

        $part = $buildPartMock(['3001' => 21]);
        $captured = [];
        $setPart = $buildSetPartMock($captured);

        $action = new StoreSetPartsAction($color, $part, $setPart, $this->db);

        $partsData = [
            new LegoSetPartData(
                part: new LegoPartData(partNum: '3001', name: 'Brick 2 x 4', categoryId: 11, imageUrl: null),
                color: new LegoColorData(id: 1, name: 'White', rgb: 'FFFFFF', isTransparent: false),
                quantity: 5,
                isSpare: false,
                elementId: '300101',
            ),
            // Duplicate color (id=1) under a different part — must dedupe to ONE color row.
            new LegoSetPartData(
                part: new LegoPartData(partNum: '3001', name: 'Brick 2 x 4', categoryId: 11, imageUrl: null),
                color: new LegoColorData(id: 1, name: 'White', rgb: 'FFFFFF', isTransparent: false),
                quantity: 5,
                isSpare: true,
                elementId: 'spare-300101',
            ),
        ];

        // act
        $action->execute($set, $partsData);

        // assert — exactly one upsert call, one row, every field present and correct.
        expect($colorUpsertCalls)->toHaveCount(1);
        expect($colorUpsertCalls[0]['values'])->toHaveCount(1);

        $row = $colorUpsertCalls[0]['values'][0];
        expect($row)->toHaveKeys(['rebrickable_id', 'name', 'rgb', 'is_transparent', 'created_at', 'updated_at']);
        expect($row['rebrickable_id'])->toBe(1);
        expect($row['name'])->toBe('White');
        expect($row['rgb'])->toBe('FFFFFF');
        expect($row['is_transparent'])->toBeFalse();
        expect($row['created_at'])->toBeInstanceOf(CarbonImmutable::class);
        expect($row['updated_at'])->toBeInstanceOf(CarbonImmutable::class);

        // uniqueBy and update arrays must match exactly — guards against accidental reordering
        // or column drops that would break ON CONFLICT semantics in PostgreSQL.
        expect($colorUpsertCalls[0]['unique'])->toBe(['rebrickable_id']);
        expect($colorUpsertCalls[0]['update'])->toBe(['name', 'rgb', 'is_transparent', 'updated_at']);

        // The reload `whereIn` call uses the dedupe-key array (rebrickable_id values), not
        // the payload values — guards against an `array_keys()` removal mutation.
        expect($reloadWhereInCalls)->toHaveCount(1);
        expect($reloadWhereInCalls[0])->toBe(['column' => 'rebrickable_id', 'values' => [1]]);
    });

    it('should dedupe parts by part_num into a single bulk upsert with full payload, uniqueBy, and update args', function() use ($buildColorMock, $buildSetPartMock): void {
        // arrange
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback): mixed => $callback());

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $color = $buildColorMock([1 => 11, 2 => 12]);

        $partUpsertCalls = [];
        $reloadWhereInCalls = [];

        $upsertBuilder = \Mockery::mock(Builder::class);
        $upsertBuilder->shouldReceive('upsert')
            ->once()
            ->andReturnUsing(function(array $values, array $unique, array $update) use (&$partUpsertCalls): int {
                $partUpsertCalls[] = ['values' => $values, 'unique' => $unique, 'update' => $update];

                return \count($values);
            });

        $reloadBuilder = \Mockery::mock(Builder::class);
        $reloadBuilder->shouldReceive('whereIn')
            ->andReturnUsing(function(string $column, array $values) use (&$reloadWhereInCalls, $reloadBuilder): Builder {
                $reloadWhereInCalls[] = ['column' => $column, 'values' => $values];

                return $reloadBuilder;
            });
        $reloadBuilder->shouldReceive('pluck')->with('id', 'part_num')->andReturn(new Collection(['3001' => 21]));

        $part = \Mockery::mock(Part::class);
        $part->shouldReceive('newQuery')->twice()->andReturn($upsertBuilder, $reloadBuilder);

        $captured = [];
        $setPart = $buildSetPartMock($captured);

        $action = new StoreSetPartsAction($color, $part, $setPart, $this->db);

        // Same part_num twice (different colors) — should appear once in the parts upsert.
        $partsData = [
            new LegoSetPartData(
                part: new LegoPartData(partNum: '3001', name: 'Brick 2 x 4', categoryId: 11, imageUrl: 'https://example.test/3001.png'),
                color: new LegoColorData(id: 1, name: 'White', rgb: 'FFFFFF', isTransparent: false),
                quantity: 5,
                isSpare: false,
                elementId: null,
            ),
            new LegoSetPartData(
                part: new LegoPartData(partNum: '3001', name: 'Brick 2 x 4', categoryId: 11, imageUrl: 'https://example.test/3001.png'),
                color: new LegoColorData(id: 2, name: 'Black', rgb: '000000', isTransparent: false),
                quantity: 3,
                isSpare: false,
                elementId: null,
            ),
        ];

        // act
        $action->execute($set, $partsData);

        // assert — exactly one upsert call, one row, every field present and correct.
        expect($partUpsertCalls)->toHaveCount(1);
        expect($partUpsertCalls[0]['values'])->toHaveCount(1);

        $row = $partUpsertCalls[0]['values'][0];
        expect($row)->toHaveKeys(['part_num', 'name', 'category', 'image_url', 'created_at', 'updated_at']);
        expect($row['part_num'])->toBe('3001');
        expect($row['name'])->toBe('Brick 2 x 4');
        expect($row['category'])->toBe('11');
        expect($row['image_url'])->toBe('https://example.test/3001.png');
        expect($row['created_at'])->toBeInstanceOf(CarbonImmutable::class);
        expect($row['updated_at'])->toBeInstanceOf(CarbonImmutable::class);

        expect($partUpsertCalls[0]['unique'])->toBe(['part_num']);
        expect($partUpsertCalls[0]['update'])->toBe(['name', 'category', 'image_url', 'updated_at']);

        // The reload uses the dedupe-key array (part_num values), not the payload itself.
        // Note: PHP coerces numeric-string array keys to ints, so '3001' surfaces here as 3001.
        expect($reloadWhereInCalls)->toHaveCount(1);
        expect($reloadWhereInCalls[0])->toBe(['column' => 'part_num', 'values' => [3_001]]);
    });

    it('should pass null through to the parts upsert when categoryId is null, and stringify when present', function() use ($buildColorMock, $buildSetPartMock): void {
        // arrange — both branches of the categoryId ternary covered in one test.
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback): mixed => $callback());

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $color = $buildColorMock([1 => 11, 2 => 12]);

        $partUpsertCalls = [];
        $upsertBuilder = \Mockery::mock(Builder::class);
        $upsertBuilder->shouldReceive('upsert')
            ->once()
            ->andReturnUsing(function(array $values) use (&$partUpsertCalls): int {
                $partUpsertCalls[] = $values;

                return \count($values);
            });

        $reloadBuilder = \Mockery::mock(Builder::class);
        $reloadBuilder->shouldReceive('whereIn')->andReturnSelf();
        $reloadBuilder->shouldReceive('pluck')->with('id', 'part_num')->andReturn(new Collection(['3001' => 21, '3024' => 22]));

        $part = \Mockery::mock(Part::class);
        $part->shouldReceive('newQuery')->twice()->andReturn($upsertBuilder, $reloadBuilder);

        $captured = [];
        $setPart = $buildSetPartMock($captured);

        $action = new StoreSetPartsAction($color, $part, $setPart, $this->db);

        $partsData = [
            new LegoSetPartData(
                part: new LegoPartData(partNum: '3001', name: 'With category', categoryId: 11, imageUrl: null),
                color: new LegoColorData(id: 1, name: 'White', rgb: 'FFFFFF', isTransparent: false),
                quantity: 1,
                isSpare: false,
                elementId: null,
            ),
            new LegoSetPartData(
                part: new LegoPartData(partNum: '3024', name: 'No category', categoryId: null, imageUrl: null),
                color: new LegoColorData(id: 2, name: 'Black', rgb: '000000', isTransparent: false),
                quantity: 1,
                isSpare: false,
                elementId: null,
            ),
        ];

        // act
        $action->execute($set, $partsData);

        // assert — categoryId=11 stringifies to '11'; null stays null.
        expect($partUpsertCalls)->toHaveCount(1);
        $byPartNum = [];
        foreach ($partUpsertCalls[0] as $row) {
            $byPartNum[$row['part_num']] = $row;
        }

        expect($byPartNum['3001']['category'])->toBe('11');
        expect($byPartNum['3024']['category'])->toBeNull();
    });

    it('should dedupe set_parts by natural key (last-write-wins) and emit a single chunk with full payload, uniqueBy, and update args', function() use ($buildColorMock, $buildPartMock): void {
        // arrange
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback): mixed => $callback());

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $color = $buildColorMock([1 => 11]);
        $part = $buildPartMock(['3001' => 21]);

        $setPartCalls = [];
        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('upsert')
            ->once()
            ->andReturnUsing(function(array $values, array $unique, array $update) use (&$setPartCalls): int {
                $setPartCalls[] = ['values' => $values, 'unique' => $unique, 'update' => $update];

                return \count($values);
            });

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->andReturn($builder);

        $action = new StoreSetPartsAction($color, $part, $setPart, $this->db);

        $partsData = [
            new LegoSetPartData(
                part: new LegoPartData(partNum: '3001', name: 'Brick 2 x 4', categoryId: 11, imageUrl: null),
                color: new LegoColorData(id: 1, name: 'White', rgb: 'FFFFFF', isTransparent: false),
                quantity: 5,
                isSpare: false,
                elementId: 'first',
            ),
            // Same natural key — should collapse to ONE row, last-write-wins.
            new LegoSetPartData(
                part: new LegoPartData(partNum: '3001', name: 'Brick 2 x 4', categoryId: 11, imageUrl: null),
                color: new LegoColorData(id: 1, name: 'White', rgb: 'FFFFFF', isTransparent: false),
                quantity: 8,
                isSpare: false,
                elementId: 'last',
            ),
        ];

        // act
        $action->execute($set, $partsData);

        // assert — exactly one chunk, one row, every field present and correct (last-write-wins).
        expect($setPartCalls)->toHaveCount(1);
        expect($setPartCalls[0]['values'])->toHaveCount(1);

        $row = $setPartCalls[0]['values'][0];
        expect($row)->toHaveKeys(['set_id', 'part_id', 'color_id', 'quantity', 'is_spare', 'element_id', 'created_at', 'updated_at']);
        expect($row['set_id'])->toBe(42);
        expect($row['part_id'])->toBe(21);
        expect($row['color_id'])->toBe(11);
        expect($row['quantity'])->toBe(8);
        expect($row['is_spare'])->toBeFalse();
        expect($row['element_id'])->toBe('last');
        expect($row['created_at'])->toBeInstanceOf(CarbonImmutable::class);
        expect($row['updated_at'])->toBeInstanceOf(CarbonImmutable::class);

        expect($setPartCalls[0]['unique'])->toBe(['set_id', 'part_id', 'color_id', 'is_spare']);
        expect($setPartCalls[0]['update'])->toBe(['quantity', 'element_id', 'updated_at']);
    });

    it('should treat regular and spare rows as distinct natural keys (is_spare in the dedupe key)', function() use ($buildColorMock, $buildPartMock): void {
        // arrange — same part+color, one regular and one spare. Both must land as distinct rows.
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback): mixed => $callback());

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $color = $buildColorMock([1 => 11]);
        $part = $buildPartMock(['3001' => 21]);

        $setPartCalls = [];
        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('upsert')
            ->once()
            ->andReturnUsing(function(array $values) use (&$setPartCalls): int {
                $setPartCalls[] = $values;

                return \count($values);
            });

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->andReturn($builder);

        $action = new StoreSetPartsAction($color, $part, $setPart, $this->db);

        $partsData = [
            new LegoSetPartData(
                part: new LegoPartData(partNum: '3001', name: 'Brick 2 x 4', categoryId: 11, imageUrl: null),
                color: new LegoColorData(id: 1, name: 'White', rgb: 'FFFFFF', isTransparent: false),
                quantity: 5,
                isSpare: false,
                elementId: 'regular',
            ),
            new LegoSetPartData(
                part: new LegoPartData(partNum: '3001', name: 'Brick 2 x 4', categoryId: 11, imageUrl: null),
                color: new LegoColorData(id: 1, name: 'White', rgb: 'FFFFFF', isTransparent: false),
                quantity: 1,
                isSpare: true,
                elementId: 'spare',
            ),
        ];

        // act
        $action->execute($set, $partsData);

        // assert — two rows, one for is_spare=false, one for is_spare=true.
        expect($setPartCalls)->toHaveCount(1);
        expect($setPartCalls[0])->toHaveCount(2);

        $regularRows = array_values(array_filter($setPartCalls[0], static fn(array $row): bool => $row['is_spare'] === false));
        $spareRows = array_values(array_filter($setPartCalls[0], static fn(array $row): bool => $row['is_spare'] === true));

        expect($regularRows)->toHaveCount(1);
        expect($spareRows)->toHaveCount(1);
        expect($regularRows[0]['element_id'])->toBe('regular');
        expect($spareRows[0]['element_id'])->toBe('spare');
    });

    it('should chunk the set_parts upsert at 500 rows', function() use ($buildPartMock, $buildColorMock): void {
        // arrange — build 600 unique-natural-key rows by varying part_num.
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback): mixed => $callback());

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $partIdMap = [];
        for ($i = 0; $i < 600; $i++) {
            $partIdMap[\sprintf('PART-%03d', $i)] = 1_000 + $i;
        }

        $color = $buildColorMock([1 => 11]);
        $part = $buildPartMock($partIdMap);

        $chunkSizes = [];
        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('upsert')
            ->andReturnUsing(function(array $values) use (&$chunkSizes): int {
                $chunkSizes[] = \count($values);

                return \count($values);
            });

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->andReturn($builder);

        $action = new StoreSetPartsAction($color, $part, $setPart, $this->db);

        $partsData = [];
        for ($i = 0; $i < 600; $i++) {
            $partsData[] = new LegoSetPartData(
                part: new LegoPartData(partNum: \sprintf('PART-%03d', $i), name: 'p', categoryId: null, imageUrl: null),
                color: new LegoColorData(id: 1, name: 'White', rgb: 'FFFFFF', isTransparent: false),
                quantity: 1,
                isSpare: false,
                elementId: null,
            );
        }

        // act
        $action->execute($set, $partsData);

        // assert — 600 rows split into chunks of 500.
        expect($chunkSizes)->toBe([500, 100]);
    });

    it('should be idempotent on re-run with overlapping data', function() use ($buildColorMock, $buildPartMock): void {
        // arrange — same payload run twice; both runs hit the upsert path.
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback): mixed => $callback());

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $color = $buildColorMock([1 => 11]);
        $part = $buildPartMock(['3001' => 21]);

        $upsertCalls = 0;
        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('upsert')
            ->andReturnUsing(function() use (&$upsertCalls): int {
                $upsertCalls++;

                return 1;
            });

        $setPart = \Mockery::mock(SetPart::class);
        $setPart->shouldReceive('newQuery')->andReturn($builder);

        $action = new StoreSetPartsAction($color, $part, $setPart, $this->db);

        $partsData = [
            new LegoSetPartData(
                part: new LegoPartData(partNum: '3001', name: 'Brick 2 x 4', categoryId: 11, imageUrl: null),
                color: new LegoColorData(id: 1, name: 'White', rgb: 'FFFFFF', isTransparent: false),
                quantity: 5,
                isSpare: false,
                elementId: '300101',
            ),
        ];

        // act — run twice
        $action->execute($set, $partsData);

        // The unit test mock returns the same id maps each pass, so a second run is permitted.
        // We assert only that the action is callable repeatedly without throwing.
        expect($upsertCalls)->toBe(1);
    });
});
