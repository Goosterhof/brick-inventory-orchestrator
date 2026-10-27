<?php

declare(strict_types = 1);

use App\Actions\StorageOption\UpdateStorageOptionAction;
use App\DataTransferObjects\Input\StorageOption\StorageOptionData;
use App\Models\StorageOption;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Validation\ValidationException;

covers(UpdateStorageOptionAction::class);

describe('UpdateStorageOptionAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());
    });

    it('should update storage option properties', function(): void {
        // arrange
        $savedValues = [];
        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $storageOption->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $storageOption->shouldReceive('save')->once();

        $action = new UpdateStorageOptionAction($this->db);
        $data = new StorageOptionData(
            name: 'New Name',
            description: 'New description',
        );

        // act
        $result = $action->execute($storageOption, $data);

        // assert
        expect($result)->toBe($storageOption)
            ->and($savedValues['name'])->toBe('New Name')
            ->and($savedValues['description'])->toBe('New description');
    });

    it('should update row and column', function(): void {
        // arrange
        $savedValues = [];
        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $storageOption->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $storageOption->shouldReceive('save')->once();

        $action = new UpdateStorageOptionAction($this->db);
        $data = new StorageOptionData(
            name: 'Drawer',
            row: 3,
            column: 4,
        );

        // act
        $action->execute($storageOption, $data);

        // assert
        expect($savedValues['row'])->toBe(3)
            ->and($savedValues['column'])->toBe(4);
    });

    it('checks the locked family hierarchy before saving a parent', function(int $parentId, array $parents, bool $reject): void {
        $familyQuery = \Mockery::mock(Builder::class);
        $familyQuery->shouldReceive('where')->once()->with('id', 7)->andReturnSelf();
        $familyQuery->shouldReceive('lockForUpdate')->once()->andReturnSelf();
        $familyQuery->shouldReceive('firstOrFail')->once()->andReturn((object) ['id' => 7]);

        $storageQuery = \Mockery::mock(Builder::class);
        $storageQuery->shouldReceive('where')->once()->with('family_id', 7)->andReturnSelf();
        $storageQuery->shouldReceive('pluck')->once()->with('parent_id', 'id')->andReturn(collect($parents));

        $this->db->shouldReceive('table')->once()->with('families')->andReturn($familyQuery);
        $this->db->shouldReceive('table')->once()->with('storage_options')->andReturn($storageQuery);

        $savedValues = ['id' => 3, 'family_id' => 7];
        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $storageOption->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $storageOption->shouldReceive('save')->times($reject ? 0 : 1);

        if ($reject) {
            $this->expectException(ValidationException::class);
        }

        new UpdateStorageOptionAction($this->db)->execute($storageOption, new StorageOptionData(
            name: 'Moved',
            parentId: $parentId,
        ));

        if (!$reject) {
            expect($savedValues['parent_id'])->toBe($parentId);
        }
    })->with([
        'valid ancestor chain' => [5, [3 => null, 5 => 6, 6 => null], false],
        'self parent' => [3, [3 => null], true],
        'missing parent' => [9, [3 => null], true],
        'existing ancestor cycle' => [5, [3 => null, 5 => 6, 6 => 5], true],
    ]);

    it('should ignore grid_rows and grid_columns in the DTO (immutable after create)', function(): void {
        // arrange: pre-seed the persisted dims so we can prove they survive untouched
        $savedValues = [
            'grid_rows' => 5,
            'grid_columns' => 6,
        ];
        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $storageOption->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $storageOption->shouldReceive('save')->once();

        $action = new UpdateStorageOptionAction($this->db);
        $data = new StorageOptionData(
            name: 'Resized?',
            gridRows: 99,
            gridColumns: 99,
        );

        // act
        $action->execute($storageOption, $data);

        // assert — the new dim values are silently dropped; the persisted dims remain
        expect($savedValues['grid_rows'])->toBe(5)
            ->and($savedValues['grid_columns'])->toBe(6)
            ->and($savedValues['name'])->toBe('Resized?');
    });

    it('should call save on the storage option', function(): void {
        // arrange
        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->allows('setAttribute');
        $storageOption->allows('getAttribute');
        $storageOption->shouldReceive('save')->once();

        $action = new UpdateStorageOptionAction($this->db);
        $data = new StorageOptionData(
            name: 'Updated',
        );

        // act
        $action->execute($storageOption, $data);

        // assert - Mockery expectations verify the interactions
    });
});
