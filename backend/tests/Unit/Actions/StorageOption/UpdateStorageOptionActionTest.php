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

    it('checks only the proposed parent ancestry within the family', function(): void {
        $cases = [
            'self' => [1, [1 => null], [], 'The selected parent cannot be this location or one of its descendants.'],
            'descendant' => [3, [1 => null, 2 => 1, 3 => 2], [3, 2], 'The selected parent cannot be this location or one of its descendants.'],
            'existing cycle' => [2, [1 => null, 2 => 3, 3 => 2], [2, 3], 'The selected parent has a cyclic ancestry.'],
            'missing from family' => [4, [1 => null, 2 => null], [4], 'The selected parent does not belong to your family.'],
            'invalid ancestry' => [2, [1 => null, 2 => 'invalid'], [2], 'The selected parent has invalid ancestry.'],
        ];

        foreach ($cases as $case => [$parentId, $parents, $expectedQueries, $expectedError]) {
            $connection = \Mockery::mock(ConnectionInterface::class);
            $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback): StorageOption => $callback());

            $familyQuery = \Mockery::mock(Builder::class);
            $familyQuery->shouldReceive('where')->with('id', 7)->once()->andReturnSelf();
            $familyQuery->shouldReceive('lockForUpdate')->once()->andReturnSelf();
            $familyQuery->shouldReceive('first')->once()->andReturn(null);
            $connection->shouldReceive('table')->with('families')->once()->andReturn($familyQuery);

            $queriedIds = [];
            $storageQuery = \Mockery::mock(Builder::class);
            $storageQuery->shouldReceive('where')->with('family_id', 7)->andReturnSelf();
            $storageQuery->shouldReceive('where')->with('id', \Mockery::type('int'))->andReturnUsing(function(string $column, int $id) use (&$queriedIds, $storageQuery): Builder {
                $queriedIds[] = $id;

                return $storageQuery;
            });
            $storageQuery->shouldReceive('first')->with(['parent_id'])->andReturnUsing(function() use (&$queriedIds, $parents): ?object {
                $id = end($queriedIds);

                if ($id === false) {
                    throw new \LogicException('Expected an ancestor lookup before reading its result.');
                }

                return \array_key_exists($id, $parents) ? (object) ['parent_id' => $parents[$id]] : null;
            });
            $connection->shouldReceive('table')->with('storage_options')->times(\count($expectedQueries))->andReturn($storageQuery);

            $option = \Mockery::mock(StorageOption::class);
            $option->allows('getAttribute')->andReturnUsing(fn(string $key): ?int => match ($key) {
                'family_id' => 7,
                'id' => 1,
                default => null,
            });
            $option->allows('setAttribute');
            $option->shouldReceive('save')->never();

            $action = new UpdateStorageOptionAction($connection);
            $data = new StorageOptionData(name: 'Updated', parentId: $parentId);

            try {
                $action->execute($option, $data);
                $this->fail("Expected {$case} to be rejected.");
            } catch (ValidationException $exception) {
                expect($exception->errors()['parent_id'])->toBe([$expectedError]);
            }

            expect($queriedIds)->toBe($expectedQueries);
        }
    });
});
