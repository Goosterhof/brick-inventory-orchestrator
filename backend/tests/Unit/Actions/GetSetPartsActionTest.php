<?php

declare(strict_types = 1);

use App\Actions\GetSetPartsAction;
use App\Actions\Sync\UpsertSetAction;
use App\Contracts\LegoDataServiceInterface;
use App\DataTransferObjects\Input\Lego\LegoSetData;
use App\DataTransferObjects\Result\Set\SetPartsResultData;
use App\Enums\SetSyncStatus;
use App\Jobs\SyncSetPartsJob;
use App\Models\Set;
use Illuminate\Contracts\Bus\Dispatcher;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Builder;

covers(GetSetPartsAction::class);

describe('GetSetPartsAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
    });

    /**
     * Build a Set lookup mock that returns the supplied result for newQuery()->where()->first().
     */
    $buildSetLookup = function(?Set $found): Set {
        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('where')->with('set_num', \Mockery::any())->andReturnSelf();
        $builder->shouldReceive('first')->andReturn($found);

        $set = \Mockery::mock(Set::class);
        $set->shouldReceive('newQuery')->andReturn($builder);

        return $set;
    };

    it('should upsert metadata, dispatch SyncSetPartsJob, and return Pending when the set does not exist locally', function() use ($buildSetLookup): void {
        // arrange
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback): mixed => $callback());

        $setLookup = $buildSetLookup(null);

        $legoSetData = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: 'https://example.com/75192.jpg',
        );

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchSet')->with('75192-1')->once()->andReturn($legoSetData);
        $legoDataService->shouldNotReceive('fetchSetParts');

        $createdSet = \Mockery::mock(Set::class);
        $savedFields = [];
        $createdSet->allows('setAttribute')->andReturnUsing(function(string $key, mixed $value) use (&$savedFields): void {
            $savedFields[$key] = $value;
        });
        $createdSet->allows('getAttribute')->andReturnUsing(function(string $key) use (&$savedFields): mixed {
            return $savedFields[$key] ?? ($key === 'id' ? 99 : null);
        });
        $createdSet->shouldReceive('save')->once();

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldReceive('execute')->with($legoSetData)->once()->andReturn($createdSet);

        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldReceive('dispatch')
            ->once()
            ->withArgs(fn(SyncSetPartsJob $syncSetPartsJob): bool => $syncSetPartsJob->setId === 99);

        $action = new GetSetPartsAction(
            $legoDataService,
            $upsertSetAction,
            $dispatcher,
            $this->db,
            $setLookup,
        );

        // act
        $result = $action->execute('75192-1');

        // assert
        expect($result)->toBeInstanceOf(SetPartsResultData::class);
        expect($result->status)->toBe(SetSyncStatus::Pending);
        expect($result->failedReason)->toBeNull();
        expect($savedFields['parts_sync_status'])->toBe(SetSyncStatus::Pending);
    });

    it('should pass through Completed status without dispatching when the set is already synced', function() use ($buildSetLookup): void {
        // arrange — pass-through path opens no transaction
        $this->db->shouldNotReceive('transaction');

        $existingSet = \Mockery::mock(Set::class);
        $existingSet->allows('getAttribute')->with('parts_sync_status')->andReturn(SetSyncStatus::Completed);
        $existingSet->allows('getAttribute')->with('parts_sync_failed_reason')->andReturn(null);

        $setLookup = $buildSetLookup($existingSet);

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldNotReceive('fetchSet');

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldNotReceive('execute');

        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldNotReceive('dispatch');

        $action = new GetSetPartsAction(
            $legoDataService,
            $upsertSetAction,
            $dispatcher,
            $this->db,
            $setLookup,
        );

        // act
        $result = $action->execute('75192-1');

        // assert
        expect($result->set)->toBe($existingSet);
        expect($result->status)->toBe(SetSyncStatus::Completed);
    });

    it('should pass through Pending status without dispatching when a sync is already queued', function() use ($buildSetLookup): void {
        // arrange — pass-through path opens no transaction
        $this->db->shouldNotReceive('transaction');

        $existingSet = \Mockery::mock(Set::class);
        $existingSet->allows('getAttribute')->with('parts_sync_status')->andReturn(SetSyncStatus::Pending);
        $existingSet->allows('getAttribute')->with('parts_sync_failed_reason')->andReturn(null);

        $setLookup = $buildSetLookup($existingSet);

        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldNotReceive('dispatch');

        $action = new GetSetPartsAction(
            \Mockery::mock(LegoDataServiceInterface::class),
            \Mockery::mock(UpsertSetAction::class),
            $dispatcher,
            $this->db,
            $setLookup,
        );

        // act
        $result = $action->execute('75192-1');

        // assert
        expect($result->status)->toBe(SetSyncStatus::Pending);
    });

    it('should pass through InProgress status without dispatching when a sync is mid-flight', function() use ($buildSetLookup): void {
        // arrange — pass-through path opens no transaction
        $this->db->shouldNotReceive('transaction');

        $existingSet = \Mockery::mock(Set::class);
        $existingSet->allows('getAttribute')->with('parts_sync_status')->andReturn(SetSyncStatus::InProgress);
        $existingSet->allows('getAttribute')->with('parts_sync_failed_reason')->andReturn(null);

        $setLookup = $buildSetLookup($existingSet);

        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldNotReceive('dispatch');

        $action = new GetSetPartsAction(
            \Mockery::mock(LegoDataServiceInterface::class),
            \Mockery::mock(UpsertSetAction::class),
            $dispatcher,
            $this->db,
            $setLookup,
        );

        // act
        $result = $action->execute('75192-1');

        // assert
        expect($result->status)->toBe(SetSyncStatus::InProgress);
    });

    it('should surface Failed once with the prior reason while auto-dispatching a fresh sync in the background', function() use ($buildSetLookup): void {
        // arrange
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback): mixed => $callback());

        $savedFields = ['parts_sync_status' => SetSyncStatus::Failed, 'parts_sync_failed_reason' => 'old reason'];
        $existingSet = \Mockery::mock(Set::class);
        $existingSet->allows('setAttribute')->andReturnUsing(function(string $key, mixed $value) use (&$savedFields): void {
            $savedFields[$key] = $value;
        });
        $existingSet->allows('getAttribute')->andReturnUsing(function(string $key) use (&$savedFields): mixed {
            return $savedFields[$key] ?? ($key === 'id' ? 99 : null);
        });
        $existingSet->shouldReceive('save')->once();

        $setLookup = $buildSetLookup($existingSet);

        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldReceive('dispatch')
            ->once()
            ->withArgs(fn(SyncSetPartsJob $syncSetPartsJob): bool => $syncSetPartsJob->setId === 99);

        $action = new GetSetPartsAction(
            \Mockery::mock(LegoDataServiceInterface::class),
            \Mockery::mock(UpsertSetAction::class),
            $dispatcher,
            $this->db,
            $setLookup,
        );

        // act
        $result = $action->execute('75192-1');

        // assert — DTO returns Failed with the prior reason; DB is reset so the next poll sees Pending.
        expect($result->status)->toBe(SetSyncStatus::Failed);
        expect($result->failedReason)->toBe('old reason');
        expect($savedFields['parts_sync_status'])->toBe(SetSyncStatus::Pending);
        expect($savedFields['parts_sync_failed_reason'])->toBeNull();
    });
});
