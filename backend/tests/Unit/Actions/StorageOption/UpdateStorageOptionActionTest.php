<?php

declare(strict_types = 1);

use App\Actions\StorageOption\UpdateStorageOptionAction;
use App\DataTransferObjects\Input\StorageOption\StorageOptionData;
use App\Models\StorageOption;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

covers(UpdateStorageOptionAction::class);

describe('UpdateStorageOptionAction', function(): void {
    it('should update fields within a family lock and preserve immutable grid dimensions', function(): void {
        $events = [];
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(function(\Closure $callback) use (&$events): StorageOption {
            $events[] = 'transaction:begin';
            $result = $callback();
            $events[] = 'transaction:end';

            return $result;
        });

        $familyQuery = \Mockery::mock(Builder::class);
        $familyQuery->shouldReceive('where')->with('id', 7)->once()->andReturnSelf();
        $familyQuery->shouldReceive('lockForUpdate')->once()->andReturnSelf();
        $familyQuery->shouldReceive('first')->once()->andReturn(null);
        $connection->shouldReceive('table')->with('families')->once()->andReturnUsing(function() use ($familyQuery, &$events): Builder {
            $events[] = 'family:lock';

            return $familyQuery;
        });

        $savedValues = [];
        $option = \Mockery::mock(StorageOption::class);
        $option->shouldReceive('getAttribute')->with('family_id')->once()->andReturn(7);
        $option->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $option->shouldReceive('save')->once()->andReturnUsing(function() use (&$events): bool {
            $events[] = 'option:save';

            return true;
        });

        $result = new UpdateStorageOptionAction($connection)->execute($option, new StorageOptionData(
            name: 'Renamed',
            description: 'Updated',
            row: 2,
            column: 3,
            gridRows: 99,
            gridColumns: 99,
        ));

        expect($result)->toBe($option)
            ->and($events)->toBe(['transaction:begin', 'family:lock', 'option:save', 'transaction:end'])
            ->and($savedValues)->toBe([
                'name' => 'Renamed',
                'description' => 'Updated',
                'parent_id' => null,
                'row' => 2,
                'column' => 3,
            ]);
    });

    it('checks every proposed parent against the current family tree', function(): void {
        $cases = [
            'self' => [1, [1 => null], 'The selected parent cannot be this location or one of its descendants.'],
            'descendant' => [3, [1 => null, 2 => 1, 3 => 2], 'The selected parent cannot be this location or one of its descendants.'],
            'existing cycle' => [2, [1 => null, 2 => 3, 3 => 2], 'The selected parent has a cyclic ancestry.'],
            'missing from family' => [4, [1 => null, 2 => null], 'The selected parent does not belong to your family.'],
            'valid ancestor chain' => [3, [1 => null, 2 => null, 3 => 2], null],
        ];

        foreach ($cases as $case => [$parentId, $parents, $expectedError]) {
            $connection = \Mockery::mock(ConnectionInterface::class);
            $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback): StorageOption => $callback());

            $familyQuery = \Mockery::mock(Builder::class);
            $familyQuery->shouldReceive('where')->with('id', 7)->once()->andReturnSelf();
            $familyQuery->shouldReceive('lockForUpdate')->once()->andReturnSelf();
            $familyQuery->shouldReceive('first')->once()->andReturn(null);
            $connection->shouldReceive('table')->with('families')->once()->andReturn($familyQuery);

            $storageQuery = \Mockery::mock(Builder::class);
            $storageQuery->shouldReceive('where')->with('family_id', 7)->once()->andReturnSelf();
            $storageQuery->shouldReceive('pluck')->with('parent_id', 'id')->once()->andReturn(new Collection($parents));
            $connection->shouldReceive('table')->with('storage_options')->once()->andReturn($storageQuery);

            $option = \Mockery::mock(StorageOption::class);
            $option->allows('getAttribute')->andReturnUsing(fn(string $key): ?int => match ($key) {
                'family_id' => 7,
                'id' => 1,
                default => null,
            });
            $option->allows('setAttribute');
            $option->shouldReceive('save')->times($expectedError === null ? 1 : 0)->andReturn(true);

            $action = new UpdateStorageOptionAction($connection);
            $data = new StorageOptionData(name: 'Updated', parentId: $parentId);

            if ($expectedError !== null) {
                try {
                    $action->execute($option, $data);
                    $this->fail("Expected {$case} to be rejected.");
                } catch (ValidationException $exception) {
                    expect($exception->errors()['parent_id'])->toBe([$expectedError]);
                }

                continue;
            }

            expect($action->execute($option, $data))->toBe($option);
        }
    });
});
