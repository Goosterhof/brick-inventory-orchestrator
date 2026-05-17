<?php

declare(strict_types = 1);

use App\Actions\Sync\StoreSetPartsAction;
use App\Contracts\LegoDataServiceInterface;
use App\DataTransferObjects\Input\Lego\LegoColorData;
use App\DataTransferObjects\Input\Lego\LegoPartData;
use App\DataTransferObjects\Input\Lego\LegoSetPartData;
use App\Enums\SetSyncStatus;
use App\Jobs\SyncSetPartsJob;
use App\Models\Set;
use Illuminate\Foundation\Testing\RefreshDatabase;

covers(SyncSetPartsJob::class);

uses(RefreshDatabase::class);

describe('SyncSetPartsJob', function(): void {
    it('should declare a 600 second timeout', function(): void {
        $job = new SyncSetPartsJob(setId: 1);

        expect($job->timeout)->toBe(600);
    });

    it('should declare failOnTimeout so the failed() hook fires when the worker kills the import', function(): void {
        $job = new SyncSetPartsJob(setId: 1);

        expect($job->failOnTimeout)->toBeTrue();
    });

    it('should flip status from Pending to InProgress before delegating to StoreSetPartsAction', function(): void {
        // arrange
        $set = Set::factory()->create([
            'set_num' => '75192-1',
            'parts_sync_status' => SetSyncStatus::Pending,
        ]);

        $partData = new LegoSetPartData(
            part: new LegoPartData(partNum: '3001', name: 'Brick 2 x 4', categoryId: 11, imageUrl: null),
            color: new LegoColorData(id: 1, name: 'White', rgb: 'FFFFFF', isTransparent: false),
            quantity: 5,
            isSpare: false,
            elementId: '300101',
        );

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchSetParts')
            ->with('75192-1')
            ->once()
            ->andReturn([$partData]);

        $statusDuringExecution = null;
        $storeSetPartsAction = \Mockery::mock(StoreSetPartsAction::class);
        $storeSetPartsAction->shouldReceive('execute')
            ->once()
            ->withArgs(function(Set $passedSet, array $parts) use (&$statusDuringExecution, $partData): bool {
                $passedSet->refresh();
                $statusDuringExecution = $passedSet->parts_sync_status;

                return $passedSet->set_num === '75192-1' && \count($parts) === 1 && $parts[0] === $partData;
            });

        $job = new SyncSetPartsJob(setId: $set->id);

        // act
        $job->handle($legoDataService, $storeSetPartsAction, new Set);

        // assert
        expect($statusDuringExecution)->toBe(SetSyncStatus::InProgress);
        $set->refresh();
        expect($set->parts_sync_status)->toBe(SetSyncStatus::Completed);
        expect($set->parts_synced_at)->not->toBeNull();
        expect($set->parts_sync_failed_reason)->toBeNull();
    });

    it('should clear a stale failed reason on a successful re-sync', function(): void {
        // arrange
        $set = Set::factory()->create([
            'set_num' => '75192-1',
            'parts_sync_status' => SetSyncStatus::Pending,
            'parts_sync_failed_reason' => 'old failure message',
        ]);

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchSetParts')->once()->andReturn([]);

        $storeSetPartsAction = \Mockery::mock(StoreSetPartsAction::class);
        $storeSetPartsAction->shouldReceive('execute')->once();

        $job = new SyncSetPartsJob(setId: $set->id);

        // act
        $job->handle($legoDataService, $storeSetPartsAction, new Set);

        // assert
        $set->refresh();
        expect($set->parts_sync_status)->toBe(SetSyncStatus::Completed);
        expect($set->parts_sync_failed_reason)->toBeNull();
    });

    it('should mark the set as Failed and store the truncated reason on failed()', function(): void {
        // arrange
        $set = Set::factory()->create([
            'set_num' => '75192-1',
            'parts_sync_status' => SetSyncStatus::InProgress,
        ]);

        $job = new SyncSetPartsJob(setId: $set->id);

        // act
        $job->failed(new \RuntimeException('Connection timeout: pgsql://user:pass@host/db'));

        // assert
        $set->refresh();
        expect($set->parts_sync_status)->toBe(SetSyncStatus::Failed);
        expect($set->parts_sync_failed_reason)->toBe('Connection timeout: pgsql://user:pass@host/db');
    });

    it('should truncate the failed reason to 500 characters', function(): void {
        // arrange
        $set = Set::factory()->create([
            'set_num' => '75192-1',
            'parts_sync_status' => SetSyncStatus::InProgress,
        ]);

        $longMessage = str_repeat('A', 750);
        $job = new SyncSetPartsJob(setId: $set->id);

        // act
        $job->failed(new \RuntimeException($longMessage));

        // assert
        $set->refresh();
        expect($set->parts_sync_status)->toBe(SetSyncStatus::Failed);
        expect($set->parts_sync_failed_reason)->toHaveLength(500);
    });

    it('should record an Unknown error reason when failed() is called with null', function(): void {
        // arrange
        $set = Set::factory()->create([
            'set_num' => '75192-1',
            'parts_sync_status' => SetSyncStatus::InProgress,
        ]);

        $job = new SyncSetPartsJob(setId: $set->id);

        // act
        $job->failed(null);

        // assert
        $set->refresh();
        expect($set->parts_sync_status)->toBe(SetSyncStatus::Failed);
        expect($set->parts_sync_failed_reason)->toBe('Unknown error');
    });

    it('should handle failed() gracefully when the set does not exist', function(): void {
        // arrange
        $job = new SyncSetPartsJob(setId: 999_999);

        // act — must not throw
        $job->failed(new \RuntimeException('orphan job'));

        // assert
        expect(Set::query()->where('id', 999_999)->exists())->toBeFalse();
    });
});
