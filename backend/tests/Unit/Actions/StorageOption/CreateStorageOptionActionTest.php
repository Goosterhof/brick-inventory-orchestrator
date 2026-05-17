<?php

declare(strict_types = 1);

use App\Actions\StorageOption\CreateStorageOptionAction;
use App\DataTransferObjects\Input\StorageOption\StorageOptionData;
use App\Models\Family;
use App\Models\StorageOption;
use Illuminate\Database\ConnectionInterface;
use Mockery\MockInterface;

covers(CreateStorageOptionAction::class);

/**
 * Build a Mockery StorageOption that captures setAttribute writes into the
 * supplied array reference. The returned mock answers getAttribute() from the
 * same array so the Action can read back values it just wrote (e.g. parent id
 * during seeding). Callers are responsible for pinning `save()` expectations
 * themselves — adding an `allows('save')` here conflicts with later
 * `shouldReceive('save')` declarations in Mockery.
 */
function makeStorageOptionMock(array &$savedValues): MockInterface
{
    $mock = \Mockery::mock(StorageOption::class);
    $mock->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
        $savedValues[$key] = $value;
    });
    $mock->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
        return $savedValues[$key] ?? null;
    });

    return $mock;
}

describe('CreateStorageOptionAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
        $this->db->allows('transaction')->andReturnUsing(fn(\Closure $callback) => $callback());
    });

    it('should create a storage option with the provided data', function(): void {
        // arrange
        $savedValues = [];
        $storageOptionInstance = makeStorageOptionMock($savedValues);
        $storageOptionInstance->shouldReceive('save')->once();

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newInstance')
            ->withNoArgs()
            ->once()
            ->andReturn($storageOptionInstance);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $action = new CreateStorageOptionAction($storageOption, $this->db);
        $data = new StorageOptionData(
            name: 'Cabinet 1',
            description: 'Main storage cabinet',
        );

        // act
        $result = $action->execute($family, $data);

        // assert
        expect($result)->toBe($storageOptionInstance)
            ->and($savedValues['family_id'])->toBe(1)
            ->and($savedValues['name'])->toBe('Cabinet 1')
            ->and($savedValues['description'])->toBe('Main storage cabinet')
            ->and($savedValues['grid_rows'])->toBeNull()
            ->and($savedValues['grid_columns'])->toBeNull();
    });

    it('should set parent_id, row, and column when provided', function(): void {
        // arrange
        $savedValues = [];
        $storageOptionInstance = makeStorageOptionMock($savedValues);
        $storageOptionInstance->shouldReceive('save')->once();

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newInstance')
            ->withNoArgs()
            ->once()
            ->andReturn($storageOptionInstance);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $action = new CreateStorageOptionAction($storageOption, $this->db);
        $data = new StorageOptionData(
            name: 'Drawer A1',
            parentId: 5,
            row: 1,
            column: 2,
        );

        // act
        $action->execute($family, $data);

        // assert
        expect($savedValues['parent_id'])->toBe(5)
            ->and($savedValues['row'])->toBe(1)
            ->and($savedValues['column'])->toBe(2);
    });

    it('should call save on the storage option', function(): void {
        // arrange
        $storageOptionInstance = \Mockery::mock(StorageOption::class);
        $storageOptionInstance->allows('setAttribute');
        $storageOptionInstance->allows('getAttribute');
        $storageOptionInstance->shouldReceive('save')->once();

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newInstance')
            ->withNoArgs()
            ->andReturn($storageOptionInstance);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $action = new CreateStorageOptionAction($storageOption, $this->db);
        $data = new StorageOptionData(
            name: 'Test Cabinet',
        );

        // act
        $action->execute($family, $data);

        // assert - Mockery expectations verify save() was called
    });

    it('should seed 30 drawer children for a 6 column by 5 row grid', function(): void {
        // arrange: parent saves its own values; each child saves into its own bucket
        $parentValues = [];
        $parent = makeStorageOptionMock($parentValues);
        $parent->shouldReceive('save')->once();
        // The Action reads parent->family_id and parent->id back when building each child.
        // Pre-seed those so the read path resolves to known values.
        $parentValues['family_id'] = 1;
        $parentValues['id'] = 42;

        $childValues = [];
        $childMocks = [];
        $gridRows = 5;
        $gridColumns = 6;
        $expectedChildCount = $gridRows * $gridColumns;
        for ($i = 0; $i < $expectedChildCount; $i++) {
            $bucket = [];
            $child = makeStorageOptionMock($bucket);
            $child->shouldReceive('save')->once();
            $childMocks[] = $child;
            $childValues[] = &$bucket;
            unset($bucket);
        }

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newInstance')
            ->withNoArgs()
            ->times($expectedChildCount + 1)
            ->andReturn($parent, ...$childMocks);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $action = new CreateStorageOptionAction($storageOption, $this->db);
        $data = new StorageOptionData(
            name: 'Six by Five Section',
            parentId: 7,
            gridRows: $gridRows,
            gridColumns: $gridColumns,
        );

        // act
        $action->execute($family, $data);

        // assert: the right number of children landed, each carrying inherited fields and 1-indexed coordinates
        expect($childValues)->toHaveCount(30);

        // First child is R1C1 — proves the lower bound of the loop
        expect($childValues[0]['family_id'])->toBe(1)
            ->and($childValues[0]['parent_id'])->toBe(42)
            ->and($childValues[0]['row'])->toBe(1)
            ->and($childValues[0]['column'])->toBe(1)
            ->and($childValues[0]['name'])->toBe('R1C1')
            ->and($childValues[0]['grid_rows'])->toBeNull()
            ->and($childValues[0]['grid_columns'])->toBeNull();

        // Last child is the corner R{gridRows}C{gridColumns} — proves the upper bound
        $corner = $childValues[$expectedChildCount - 1];
        expect($corner['row'])->toBe($gridRows)
            ->and($corner['column'])->toBe($gridColumns)
            ->and($corner['name'])->toBe(\sprintf('R%dC%d', $gridRows, $gridColumns));

        // A middle child — proves coordinate math is right at row boundaries (R2C1 follows R1C6 in row-major order)
        // index 6 in 0-indexed flat order = row 2, column 1
        expect($childValues[$gridColumns]['row'])->toBe(2)
            ->and($childValues[$gridColumns]['column'])->toBe(1)
            ->and($childValues[$gridColumns]['name'])->toBe('R2C1');

        // Parent itself carries the dims
        expect($parentValues['grid_rows'])->toBe($gridRows)
            ->and($parentValues['grid_columns'])->toBe($gridColumns)
            ->and($parentValues['parent_id'])->toBe(7);
    });

    it('should seed 9 drawer children for a 3 by 3 grid', function(): void {
        // arrange
        $parentValues = [];
        $parent = makeStorageOptionMock($parentValues);
        $parent->shouldReceive('save')->once();
        $parentValues['family_id'] = 1;
        $parentValues['id'] = 99;

        $childMocks = [];
        $childValues = [];
        for ($i = 0; $i < 9; $i++) {
            $bucket = [];
            $child = makeStorageOptionMock($bucket);
            $child->shouldReceive('save')->once();
            $childMocks[] = $child;
            $childValues[] = &$bucket;
            unset($bucket);
        }

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newInstance')
            ->withNoArgs()
            ->times(10)
            ->andReturn($parent, ...$childMocks);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $action = new CreateStorageOptionAction($storageOption, $this->db);
        $data = new StorageOptionData(
            name: 'Three by Three Section',
            parentId: 7,
            gridRows: 3,
            gridColumns: 3,
        );

        // act
        $action->execute($family, $data);

        // assert: 9 drawers, corner is R3C3
        expect($childValues)->toHaveCount(9)
            ->and($childValues[0]['name'])->toBe('R1C1')
            ->and($childValues[8]['name'])->toBe('R3C3')
            ->and($childValues[8]['row'])->toBe(3)
            ->and($childValues[8]['column'])->toBe(3);
    });

    it('should not seed any children when both grid dims are null', function(): void {
        // arrange — only the parent newInstance() call should fire
        $parentValues = [];
        $parent = makeStorageOptionMock($parentValues);
        $parent->shouldReceive('save')->once();

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newInstance')
            ->withNoArgs()
            ->once()
            ->andReturn($parent);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $action = new CreateStorageOptionAction($storageOption, $this->db);
        $data = new StorageOptionData(
            name: 'Plain Cabinet',
        );

        // act
        $action->execute($family, $data);

        // assert — Mockery once() on newInstance() guards against any seeding
        expect($parentValues['grid_rows'])->toBeNull()
            ->and($parentValues['grid_columns'])->toBeNull();
    });

    it('should not seed any children when only grid_rows is set (defensive)', function(): void {
        // arrange — the FormRequest blocks this case, but the Action must also refuse to half-seed
        $parentValues = [];
        $parent = makeStorageOptionMock($parentValues);
        $parent->shouldReceive('save')->once();

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newInstance')
            ->withNoArgs()
            ->once()
            ->andReturn($parent);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $action = new CreateStorageOptionAction($storageOption, $this->db);
        $data = new StorageOptionData(
            name: 'Partial-dim Cabinet',
            gridRows: 5,
        );

        // act
        $action->execute($family, $data);

        // assert
        expect($parentValues['grid_rows'])->toBe(5)
            ->and($parentValues['grid_columns'])->toBeNull();
    });

    it('should not seed any children when only grid_columns is set (defensive)', function(): void {
        // arrange — mirror case
        $parentValues = [];
        $parent = makeStorageOptionMock($parentValues);
        $parent->shouldReceive('save')->once();

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('newInstance')
            ->withNoArgs()
            ->once()
            ->andReturn($parent);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $action = new CreateStorageOptionAction($storageOption, $this->db);
        $data = new StorageOptionData(
            name: 'Partial-dim Cabinet',
            gridColumns: 6,
        );

        // act
        $action->execute($family, $data);

        // assert
        expect($parentValues['grid_rows'])->toBeNull()
            ->and($parentValues['grid_columns'])->toBe(6);
    });
});
