<?php

declare(strict_types = 1);

use App\Actions\GetSetAction;
use App\Actions\Sync\UpsertSetAction;
use App\Contracts\LegoDataServiceInterface;
use App\DataTransferObjects\Input\Lego\LegoSetData;
use App\Models\Set;
use Illuminate\Database\Eloquent\Builder;

covers(GetSetAction::class);

describe('GetSetAction', function(): void {
    it('should return existing set from database without calling API', function(): void {
        // arrange
        $existingSet = \Mockery::mock(Set::class);
        $existingSet->allows('getAttribute')->with('id')->andReturn(1);
        $existingSet->allows('getAttribute')->with('set_num')->andReturn('75192-1');

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
        $legoDataService->shouldNotReceive('fetchSet');

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldNotReceive('execute');

        $action = new GetSetAction($legoDataService, $upsertSetAction, $set);

        // act
        $result = $action->execute('75192-1');

        // assert
        expect($result)->toBe($existingSet);
    });

    it('should fetch from API and delegate to UpsertSetAction when set not in database', function(): void {
        // arrange
        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')
            ->with('set_num', '75192-1')
            ->andReturnSelf();
        $queryBuilder->shouldReceive('first')
            ->andReturn(null);

        $set = \Mockery::mock(Set::class);
        $set->shouldReceive('newQuery')
            ->andReturn($queryBuilder);

        $legoSetData = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: 'https://example.com/75192.jpg',
        );

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchSet')
            ->with('75192-1')
            ->once()
            ->andReturn($legoSetData);

        $upsertedSet = \Mockery::mock(Set::class);

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldReceive('execute')
            ->with($legoSetData)
            ->once()
            ->andReturn($upsertedSet);

        $action = new GetSetAction($legoDataService, $upsertSetAction, $set);

        // act
        $result = $action->execute('75192-1');

        // assert
        expect($result)->toBe($upsertedSet);
    });

    it('should pass LegoSetData with null values to UpsertSetAction', function(): void {
        // arrange
        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')
            ->with('set_num', '10281-1')
            ->andReturnSelf();
        $queryBuilder->shouldReceive('first')
            ->andReturn(null);

        $set = \Mockery::mock(Set::class);
        $set->shouldReceive('newQuery')
            ->andReturn($queryBuilder);

        $legoSetData = new LegoSetData(
            setNum: '10281-1',
            name: 'Bonsai Tree',
            year: 2_021,
            themeId: null,
            numParts: 878,
            imageUrl: null,
        );

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchSet')
            ->with('10281-1')
            ->once()
            ->andReturn($legoSetData);

        $upsertedSet = \Mockery::mock(Set::class);

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldReceive('execute')
            ->with($legoSetData)
            ->once()
            ->andReturn($upsertedSet);

        $action = new GetSetAction($legoDataService, $upsertSetAction, $set);

        // act
        $result = $action->execute('10281-1');

        // assert
        expect($result)->toBe($upsertedSet);
    });
});
