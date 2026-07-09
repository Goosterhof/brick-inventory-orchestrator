<?php

declare(strict_types = 1);

use App\Actions\Sync\UpsertSetAction;
use App\DataTransferObjects\Input\Lego\LegoSetData;
use App\Models\Set;
use App\Models\Theme;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;

covers(UpsertSetAction::class);

/**
 * Build a Theme mock that responds to a `value('id')` lookup against the
 * `rebrickable_id` query.
 *
 * @param int|null $expectedRebrickableId The rebrickable_id we expect the
 *                                        Action to look up. Pass null to
 *                                        assert the lookup is never invoked.
 * @param int|null $localId               The local themes.id to return
 *                                        (null = not found locally).
 */
function makeThemeMockReturningLocalId(?int $expectedRebrickableId, ?int $localId): Theme
{
    $theme = \Mockery::mock(Theme::class);

    if ($expectedRebrickableId === null) {
        $theme->shouldReceive('newQuery')->never();

        return $theme;
    }

    $themeQuery = \Mockery::mock(Builder::class);
    $themeQuery->shouldReceive('where')->with('rebrickable_id', $expectedRebrickableId)->andReturnSelf();
    $themeQuery->shouldReceive('value')->with('id')->andReturn($localId);

    $theme->shouldReceive('newQuery')->andReturn($themeQuery);

    return $theme;
}

describe('UpsertSetAction', function(): void {
    it('should create a new set when it does not exist and resolve theme_id from local catalog', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('set_num', '75192-1')->once()->andReturnSelf();
        $queryBuilder->shouldReceive('first')->once()->andReturn(null);

        $newSetSavedValues = [];
        $newSet = \Mockery::mock(Set::class);
        $newSet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$newSetSavedValues): void {
            $newSetSavedValues[$key] = $value;
        });
        $newSet->allows('getAttribute')->andReturnUsing(function($key) use (&$newSetSavedValues): mixed {
            return $newSetSavedValues[$key] ?? null;
        });
        $newSet->shouldReceive('save')->once();

        $set = \Mockery::mock(Set::class);
        $set->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $set->shouldReceive('newInstance')->once()->andReturn($newSet);

        $theme = makeThemeMockReturningLocalId(158, 42);

        $action = new UpsertSetAction($set, $theme, $connection);

        $data = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: 'https://example.com/75192.jpg',
        );

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($newSet);
        expect($newSetSavedValues['set_num'])->toBe('75192-1');
        expect($newSetSavedValues['name'])->toBe('Millennium Falcon');
        expect($newSetSavedValues['year'])->toBe(2_017);
        expect($newSetSavedValues['theme_id'])->toBe(42);
        expect($newSetSavedValues['num_parts'])->toBe(7_541);
        expect($newSetSavedValues['image_url'])->toBe('https://example.com/75192.jpg');
    });

    it('should set theme_id to null when the rebrickable theme is not in local catalog', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('set_num', '75192-1')->once()->andReturnSelf();
        $queryBuilder->shouldReceive('first')->once()->andReturn(null);

        $newSetSavedValues = [];
        $newSet = \Mockery::mock(Set::class);
        $newSet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$newSetSavedValues): void {
            $newSetSavedValues[$key] = $value;
        });
        $newSet->allows('getAttribute')->andReturnUsing(function($key) use (&$newSetSavedValues): mixed {
            return $newSetSavedValues[$key] ?? null;
        });
        $newSet->shouldReceive('save')->once();

        $set = \Mockery::mock(Set::class);
        $set->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $set->shouldReceive('newInstance')->once()->andReturn($newSet);

        // Theme lookup: rebrickable_id 999 is not known locally
        $theme = makeThemeMockReturningLocalId(999, null);

        $action = new UpsertSetAction($set, $theme, $connection);

        $data = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 999,
            numParts: 7_541,
            imageUrl: null,
        );

        // act
        $action->execute($data);

        // assert
        expect($newSetSavedValues['theme_id'])->toBeNull();
    });

    it('should update an existing set when it exists', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $existingSavedValues = ['id' => 1, 'set_num' => '75192-1'];
        $existingSet = \Mockery::mock(Set::class);
        $existingSet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$existingSavedValues): void {
            $existingSavedValues[$key] = $value;
        });
        $existingSet->allows('getAttribute')->andReturnUsing(function($key) use (&$existingSavedValues): mixed {
            return $existingSavedValues[$key] ?? null;
        });
        $existingSet->shouldReceive('save')->once();

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('set_num', '75192-1')->once()->andReturnSelf();
        $queryBuilder->shouldReceive('first')->once()->andReturn($existingSet);

        $set = \Mockery::mock(Set::class);
        $set->shouldReceive('newQuery')->once()->andReturn($queryBuilder);

        $theme = makeThemeMockReturningLocalId(159, 7);

        $action = new UpsertSetAction($set, $theme, $connection);

        $data = new LegoSetData(
            setNum: '75192-1',
            name: 'Updated Millennium Falcon',
            year: 2_018,
            themeId: 159,
            numParts: 7_600,
            imageUrl: 'https://example.com/updated.jpg',
        );

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($existingSet);
        expect($existingSavedValues['name'])->toBe('Updated Millennium Falcon');
        expect($existingSavedValues['year'])->toBe(2_018);
        expect($existingSavedValues['theme_id'])->toBe(7);
        expect($existingSavedValues['num_parts'])->toBe(7_600);
        expect($existingSavedValues['image_url'])->toBe('https://example.com/updated.jpg');
    });

    it('should leave theme_id null and skip the theme lookup when themeId is null', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturn(null);

        $newSetSavedValues = [];
        $newSet = \Mockery::mock(Set::class);
        $newSet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$newSetSavedValues): void {
            $newSetSavedValues[$key] = $value;
        });
        $newSet->allows('getAttribute')->andReturnUsing(function($key) use (&$newSetSavedValues): mixed {
            return $newSetSavedValues[$key] ?? null;
        });
        $newSet->shouldReceive('save')->once();

        $set = \Mockery::mock(Set::class);
        $set->shouldReceive('newQuery')->andReturn($queryBuilder);
        $set->shouldReceive('newInstance')->andReturn($newSet);

        // No theme lookup expected when themeId is null
        $theme = makeThemeMockReturningLocalId(null, null);

        $action = new UpsertSetAction($set, $theme, $connection);

        $data = new LegoSetData(
            setNum: '10281-1',
            name: 'Bonsai Tree',
            year: 2_021,
            themeId: null,
            numParts: 878,
            imageUrl: null,
        );

        // act
        $result = $action->execute($data);

        // assert
        expect($newSetSavedValues['theme_id'])->toBeNull();
        expect($newSetSavedValues['image_url'])->toBeNull();
    });

    it('should retry and update on unique constraint violation', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')
            ->twice()
            ->andReturnUsing(fn(\Closure $callback) => $callback());

        // First attempt: new instance whose save throws
        $newInstance = \Mockery::mock(Set::class);
        $newInstance->allows('setAttribute');
        $newInstance->allows('getAttribute');
        $newInstance->shouldReceive('save')->once()
            ->andThrow(new UniqueConstraintViolationException('default', 'INSERT', [], new \Exception('dup')));

        // Retry: existing record found and updated
        $existingValues = [];
        $existingInstance = \Mockery::mock(Set::class);
        $existingInstance->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$existingValues): void {
            $existingValues[$key] = $value;
        });
        $existingInstance->allows('getAttribute')->andReturnUsing(function($key) use (&$existingValues): mixed {
            return $existingValues[$key] ?? null;
        });
        $existingInstance->shouldReceive('save')->once();

        // First query: find nothing
        $builder1 = \Mockery::mock(Builder::class);
        $builder1->shouldReceive('where')->with('set_num', '75192-1')->once()->andReturnSelf();
        $builder1->shouldReceive('first')->once()->andReturn(null);

        // Retry query: find existing
        $builder2 = \Mockery::mock(Builder::class);
        $builder2->shouldReceive('where')->with('set_num', '75192-1')->once()->andReturnSelf();
        $builder2->shouldReceive('firstOrFail')->once()->andReturn($existingInstance);

        $set = \Mockery::mock(Set::class);
        $set->shouldReceive('newQuery')->twice()->andReturn($builder1, $builder2);
        $set->shouldReceive('newInstance')->once()->andReturn($newInstance);

        // Theme lookup runs once at the top of execute()
        $theme = makeThemeMockReturningLocalId(158, 42);

        $action = new UpsertSetAction($set, $theme, $connection);

        $data = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: 'https://example.com/75192.jpg',
        );

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($existingInstance)
            ->and($existingValues['name'])->toBe('Millennium Falcon')
            ->and($existingValues['year'])->toBe(2_017)
            ->and($existingValues['theme_id'])->toBe(42)
            ->and($existingValues['num_parts'])->toBe(7_541)
            ->and($existingValues['image_url'])->toBe('https://example.com/75192.jpg');
    });
});
