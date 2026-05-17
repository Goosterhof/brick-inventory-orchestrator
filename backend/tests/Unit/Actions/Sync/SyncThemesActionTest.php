<?php

declare(strict_types = 1);

use App\Actions\Sync\SyncThemesAction;
use App\Actions\Sync\UpsertThemeAction;
use App\Contracts\LegoDataServiceInterface;
use App\DataTransferObjects\Input\Lego\LegoThemeData;
use App\DataTransferObjects\Result\Sync\ThemeSyncResultData;
use App\Models\Theme;
use Illuminate\Database\Eloquent\Builder;

covers(SyncThemesAction::class);

/**
 * Make a Theme model whose newQuery() returns a builder asserting an
 * `update(['parent_id' => $parentLocalId])` call against a row matched
 * by `id = $localId`.
 *
 * @param array<int, int> $expectedUpdates Map of childLocalId → parentLocalId
 */
function makeThemeMockExpectingParentUpdates(array $expectedUpdates): Theme
{
    $theme = \Mockery::mock(Theme::class);

    if ($expectedUpdates === []) {
        $theme->shouldReceive('newQuery')->never();

        return $theme;
    }

    $callOrder = array_keys($expectedUpdates);

    foreach ($callOrder as $childId) {
        $parentId = $expectedUpdates[$childId];

        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('where')->with('id', $childId)->once()->andReturnSelf();
        $builder->shouldReceive('update')->with(['parent_id' => $parentId])->once();

        $theme->shouldReceive('newQuery')->once()->ordered()->andReturn($builder);
    }

    return $theme;
}

/**
 * Build a UpsertThemeAction mock that returns a Theme stub for each LegoThemeData
 * passed in, mapping rebrickable_id → local id via the provided mapping.
 *
 * @param array<int, int> $idMapping rebrickable_id => local id
 */
function makeUpsertThemeActionMock(array $idMapping): UpsertThemeAction
{
    $upsert = \Mockery::mock(UpsertThemeAction::class);

    foreach ($idMapping as $rebrickableId => $localId) {
        $themeStub = \Mockery::mock(Theme::class);
        $themeStub->allows('getAttribute')->with('id')->andReturn($localId);

        $upsert->shouldReceive('execute')
            ->once()
            ->with(\Mockery::on(fn(LegoThemeData $legoThemeData): bool => $legoThemeData->id === $rebrickableId))
            ->andReturn($themeStub);
    }

    return $upsert;
}

describe('SyncThemesAction', function(): void {
    it('should sync a single page with no parents', function(): void {
        // arrange
        $service = \Mockery::mock(LegoDataServiceInterface::class);
        $service->shouldReceive('fetchThemes')->once()->andReturnUsing(function() {
            yield [
                new LegoThemeData(id: 158, name: 'Star Wars', parentId: null),
                new LegoThemeData(id: 1, name: 'Technic', parentId: null),
            ];
        });

        $upsert = makeUpsertThemeActionMock([
            158 => 42,
            1 => 7,
        ]);

        $theme = makeThemeMockExpectingParentUpdates([]);

        $action = new SyncThemesAction($service, $upsert, $theme);

        // act
        $result = $action->execute();

        // assert
        expect($result)->toBeInstanceOf(ThemeSyncResultData::class)
            ->and($result->fetched)->toBe(2)
            ->and($result->upserted)->toBe(2)
            ->and($result->parentsLinked)->toBe(0);
    });

    it('should sync multi-page results and aggregate counts', function(): void {
        // arrange
        $service = \Mockery::mock(LegoDataServiceInterface::class);
        $service->shouldReceive('fetchThemes')->once()->andReturnUsing(function() {
            yield [
                new LegoThemeData(id: 1, name: 'Technic', parentId: null),
            ];

            yield [
                new LegoThemeData(id: 2, name: 'City', parentId: null),
                new LegoThemeData(id: 3, name: 'Creator', parentId: null),
            ];
        });

        $upsert = makeUpsertThemeActionMock([
            1 => 100,
            2 => 200,
            3 => 300,
        ]);

        $theme = makeThemeMockExpectingParentUpdates([]);

        $action = new SyncThemesAction($service, $upsert, $theme);

        // act
        $result = $action->execute();

        // assert
        expect($result->fetched)->toBe(3)
            ->and($result->upserted)->toBe(3)
            ->and($result->parentsLinked)->toBe(0);
    });

    it('should link parent_id when the parent appears before its child', function(): void {
        // arrange — typical case: 158 (Star Wars) appears, then 209 (Episode I)
        $service = \Mockery::mock(LegoDataServiceInterface::class);
        $service->shouldReceive('fetchThemes')->once()->andReturnUsing(function() {
            yield [
                new LegoThemeData(id: 158, name: 'Star Wars', parentId: null),
                new LegoThemeData(id: 209, name: 'Episode I', parentId: 158),
            ];
        });

        $upsert = makeUpsertThemeActionMock([
            158 => 42,
            209 => 50,
        ]);

        // Pass 2 should issue exactly one update: child 50 → parent 42
        $theme = makeThemeMockExpectingParentUpdates([50 => 42]);

        $action = new SyncThemesAction($service, $upsert, $theme);

        // act
        $result = $action->execute();

        // assert
        expect($result->parentsLinked)->toBe(1)
            ->and($result->fetched)->toBe(2)
            ->and($result->upserted)->toBe(2);
    });

    it('should link parent_id when the parent appears AFTER its child', function(): void {
        // arrange — the reason we need a two-pass strategy. Child 209 comes
        // first; its parent 158 arrives later in the result stream.
        $service = \Mockery::mock(LegoDataServiceInterface::class);
        $service->shouldReceive('fetchThemes')->once()->andReturnUsing(function() {
            yield [
                new LegoThemeData(id: 209, name: 'Episode I', parentId: 158),
                new LegoThemeData(id: 158, name: 'Star Wars', parentId: null),
            ];
        });

        $upsert = makeUpsertThemeActionMock([
            209 => 50,
            158 => 42,
        ]);

        // Pass 2 still resolves correctly because we accumulate the full
        // mapping before linking.
        $theme = makeThemeMockExpectingParentUpdates([50 => 42]);

        $action = new SyncThemesAction($service, $upsert, $theme);

        // act
        $result = $action->execute();

        // assert
        expect($result->parentsLinked)->toBe(1);
    });

    it('should leave parent_id null when the parent does not exist anywhere in the catalog', function(): void {
        // arrange — child references parent_id 999, but 999 is not in any page.
        // Could happen if Rebrickable returns an orphan theme; we leave it null
        // and let the next sync fix it.
        $service = \Mockery::mock(LegoDataServiceInterface::class);
        $service->shouldReceive('fetchThemes')->once()->andReturnUsing(function() {
            yield [
                new LegoThemeData(id: 209, name: 'Orphan Theme', parentId: 999),
            ];
        });

        $upsert = makeUpsertThemeActionMock([
            209 => 50,
        ]);

        // No update calls expected — the parent isn't in the local map
        $theme = makeThemeMockExpectingParentUpdates([]);

        $action = new SyncThemesAction($service, $upsert, $theme);

        // act
        $result = $action->execute();

        // assert
        expect($result->parentsLinked)->toBe(0)
            ->and($result->fetched)->toBe(1)
            ->and($result->upserted)->toBe(1);
    });

    it('should handle an empty fetchThemes generator', function(): void {
        // arrange
        $service = \Mockery::mock(LegoDataServiceInterface::class);
        $service->shouldReceive('fetchThemes')->once()->andReturnUsing(function() {
            yield [];
        });

        $upsert = \Mockery::mock(UpsertThemeAction::class);
        $upsert->shouldReceive('execute')->never();

        $theme = makeThemeMockExpectingParentUpdates([]);

        $action = new SyncThemesAction($service, $upsert, $theme);

        // act
        $result = $action->execute();

        // assert
        expect($result->fetched)->toBe(0)
            ->and($result->upserted)->toBe(0)
            ->and($result->parentsLinked)->toBe(0);
    });

    it('should link multiple children to the same parent', function(): void {
        // arrange
        $service = \Mockery::mock(LegoDataServiceInterface::class);
        $service->shouldReceive('fetchThemes')->once()->andReturnUsing(function() {
            yield [
                new LegoThemeData(id: 158, name: 'Star Wars', parentId: null),
                new LegoThemeData(id: 209, name: 'Episode I', parentId: 158),
                new LegoThemeData(id: 210, name: 'Episode II', parentId: 158),
            ];
        });

        $upsert = makeUpsertThemeActionMock([
            158 => 42,
            209 => 50,
            210 => 51,
        ]);

        $theme = makeThemeMockExpectingParentUpdates([
            50 => 42,
            51 => 42,
        ]);

        $action = new SyncThemesAction($service, $upsert, $theme);

        // act
        $result = $action->execute();

        // assert
        expect($result->parentsLinked)->toBe(2)
            ->and($result->fetched)->toBe(3);
    });
});
