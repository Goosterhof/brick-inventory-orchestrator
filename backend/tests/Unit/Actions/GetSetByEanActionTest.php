<?php

declare(strict_types = 1);

use App\Actions\GetSetByEanAction;
use App\Actions\Sync\UpsertSetAction;
use App\Contracts\LegoDataServiceInterface;
use App\DataTransferObjects\Input\Lego\LegoSetData;
use App\Models\Set;
use Illuminate\Database\Eloquent\Builder;

covers(GetSetByEanAction::class);

describe('GetSetByEanAction', function(): void {
    it('should return existing set from database when API result matches a cached set', function(): void {
        // arrange
        $legoSetData = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: 'https://example.com/75192.jpg',
        );

        $existingSet = \Mockery::mock(Set::class);

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')
            ->with('set_num', '75192-1')
            ->once()
            ->andReturnSelf();
        $queryBuilder->shouldReceive('first')
            ->once()
            ->andReturn($existingSet);

        $set = \Mockery::mock(Set::class);
        $set->shouldReceive('newQuery')
            ->once()
            ->andReturn($queryBuilder);

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchSetByEan')
            ->with('5702016914177')
            ->once()
            ->andReturn($legoSetData);

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldNotReceive('execute');

        $action = new GetSetByEanAction($legoDataService, $upsertSetAction, $set);

        // act
        $result = $action->execute('5702016914177');

        // assert
        expect($result)->toBe($existingSet);
    });

    it('should fetch from API and upsert when set not in database', function(): void {
        // arrange
        $legoSetData = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: 'https://example.com/75192.jpg',
        );

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')
            ->with('set_num', '75192-1')
            ->andReturnSelf();
        $queryBuilder->shouldReceive('first')
            ->andReturn(null);

        $set = \Mockery::mock(Set::class);
        $set->shouldReceive('newQuery')
            ->andReturn($queryBuilder);

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchSetByEan')
            ->with('5702016914177')
            ->once()
            ->andReturn($legoSetData);

        $upsertedSet = \Mockery::mock(Set::class);

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldReceive('execute')
            ->with($legoSetData)
            ->once()
            ->andReturn($upsertedSet);

        $action = new GetSetByEanAction($legoDataService, $upsertSetAction, $set);

        // act
        $result = $action->execute('5702016914177');

        // assert
        expect($result)->toBe($upsertedSet);
    });
});
