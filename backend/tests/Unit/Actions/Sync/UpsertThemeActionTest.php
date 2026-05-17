<?php

declare(strict_types = 1);

use App\Actions\Sync\UpsertThemeAction;
use App\DataTransferObjects\Input\Lego\LegoThemeData;
use App\Models\Theme;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;

covers(UpsertThemeAction::class);

describe('UpsertThemeAction', function(): void {
    it('should create a new theme when it does not exist', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->andReturnUsing(fn(\Closure $callback) => $callback());

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('rebrickable_id', 158)->once()->andReturnSelf();
        $queryBuilder->shouldReceive('first')->once()->andReturn(null);

        $newThemeSavedValues = [];
        $newTheme = \Mockery::mock(Theme::class);
        $newTheme->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$newThemeSavedValues): void {
            $newThemeSavedValues[$key] = $value;
        });
        $newTheme->allows('getAttribute')->andReturnUsing(function($key) use (&$newThemeSavedValues): mixed {
            return $newThemeSavedValues[$key] ?? null;
        });
        $newTheme->shouldReceive('save')->once();

        $theme = \Mockery::mock(Theme::class);
        $theme->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $theme->shouldReceive('newInstance')->once()->andReturn($newTheme);

        $action = new UpsertThemeAction($theme, $connection);

        $data = new LegoThemeData(
            id: 158,
            name: 'Star Wars',
            parentId: null,
        );

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($newTheme);
        expect($newThemeSavedValues['rebrickable_id'])->toBe(158);
        expect($newThemeSavedValues['name'])->toBe('Star Wars');
    });

    it('should update an existing theme when it exists', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->andReturnUsing(fn(\Closure $callback) => $callback());

        $existingSavedValues = ['id' => 1, 'rebrickable_id' => 158];
        $existingTheme = \Mockery::mock(Theme::class);
        $existingTheme->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$existingSavedValues): void {
            $existingSavedValues[$key] = $value;
        });
        $existingTheme->allows('getAttribute')->andReturnUsing(function($key) use (&$existingSavedValues): mixed {
            return $existingSavedValues[$key] ?? null;
        });
        $existingTheme->shouldReceive('save')->once();

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('rebrickable_id', 158)->once()->andReturnSelf();
        $queryBuilder->shouldReceive('first')->once()->andReturn($existingTheme);

        $theme = \Mockery::mock(Theme::class);
        $theme->shouldReceive('newQuery')->once()->andReturn($queryBuilder);

        $action = new UpsertThemeAction($theme, $connection);

        $data = new LegoThemeData(
            id: 158,
            name: 'Star Wars (Renamed)',
            parentId: 1,
        );

        // act
        $result = $action->execute($data);

        // assert — note: parent_id is NOT set on the row; SyncThemesAction does that in pass 2
        expect($result)->toBe($existingTheme);
        expect($existingSavedValues['name'])->toBe('Star Wars (Renamed)');
        expect($existingSavedValues)->not->toHaveKey('parent_id');
    });

    it('should not write parent_id even when LegoThemeData carries one', function(): void {
        // arrange — UpsertThemeAction is pass 1 of the two-pass strategy.
        // Parent linking happens in SyncThemesAction; this Action must never
        // touch parent_id.
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->andReturnUsing(fn(\Closure $callback) => $callback());

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturn(null);

        $newThemeSavedValues = [];
        $newTheme = \Mockery::mock(Theme::class);
        $newTheme->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$newThemeSavedValues): void {
            $newThemeSavedValues[$key] = $value;
        });
        $newTheme->allows('getAttribute')->andReturnUsing(function($key) use (&$newThemeSavedValues): mixed {
            return $newThemeSavedValues[$key] ?? null;
        });
        $newTheme->shouldReceive('save')->once();

        $theme = \Mockery::mock(Theme::class);
        $theme->shouldReceive('newQuery')->andReturn($queryBuilder);
        $theme->shouldReceive('newInstance')->andReturn($newTheme);

        $action = new UpsertThemeAction($theme, $connection);

        $data = new LegoThemeData(
            id: 200,
            name: 'Star Wars Episode I',
            parentId: 158,
        );

        // act
        $action->execute($data);

        // assert
        expect($newThemeSavedValues)->not->toHaveKey('parent_id');
        expect($newThemeSavedValues['name'])->toBe('Star Wars Episode I');
        expect($newThemeSavedValues['rebrickable_id'])->toBe(200);
    });

    it('should retry and update on unique constraint violation', function(): void {
        // arrange
        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')
            ->twice()
            ->andReturnUsing(fn(\Closure $callback) => $callback());

        // First attempt: new instance whose save throws
        $newInstance = \Mockery::mock(Theme::class);
        $newInstance->allows('setAttribute');
        $newInstance->allows('getAttribute');
        $newInstance->shouldReceive('save')->once()
            ->andThrow(new UniqueConstraintViolationException('default', 'INSERT', [], new \Exception('dup')));

        // Retry: existing record found and updated
        $existingValues = [];
        $existingInstance = \Mockery::mock(Theme::class);
        $existingInstance->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$existingValues): void {
            $existingValues[$key] = $value;
        });
        $existingInstance->allows('getAttribute')->andReturnUsing(function($key) use (&$existingValues): mixed {
            return $existingValues[$key] ?? null;
        });
        $existingInstance->shouldReceive('save')->once();

        $builder1 = \Mockery::mock(Builder::class);
        $builder1->shouldReceive('where')->with('rebrickable_id', 158)->once()->andReturnSelf();
        $builder1->shouldReceive('first')->once()->andReturn(null);

        $builder2 = \Mockery::mock(Builder::class);
        $builder2->shouldReceive('where')->with('rebrickable_id', 158)->once()->andReturnSelf();
        $builder2->shouldReceive('firstOrFail')->once()->andReturn($existingInstance);

        $theme = \Mockery::mock(Theme::class);
        $theme->shouldReceive('newQuery')->twice()->andReturn($builder1, $builder2);
        $theme->shouldReceive('newInstance')->once()->andReturn($newInstance);

        $action = new UpsertThemeAction($theme, $connection);

        $data = new LegoThemeData(
            id: 158,
            name: 'Star Wars',
            parentId: null,
        );

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($existingInstance)
            ->and($existingValues['name'])->toBe('Star Wars');
    });
});
