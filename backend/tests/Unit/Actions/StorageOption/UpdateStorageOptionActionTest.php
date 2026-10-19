<?php

declare(strict_types = 1);

use App\Actions\StorageOption\UpdateStorageOptionAction;
use App\DataTransferObjects\Input\StorageOption\StorageOptionData;
use App\Models\StorageOption;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Query\Builder;

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

        $result = (new UpdateStorageOptionAction($connection))->execute($option, new StorageOptionData(
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
});
