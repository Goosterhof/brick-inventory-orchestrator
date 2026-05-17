<?php

declare(strict_types = 1);

namespace App\Actions;

use App\Actions\Sync\UpsertSetAction;
use App\Contracts\LegoDataServiceInterface;
use App\DataTransferObjects\Result\Set\SetPartsResultData;
use App\Enums\SetSyncStatus;
use App\Jobs\SyncSetPartsJob;
use App\Models\Set;
use Illuminate\Contracts\Bus\Dispatcher;
use Illuminate\Database\ConnectionInterface;

use function in_array;

final readonly class GetSetPartsAction
{
    public function __construct(
        private LegoDataServiceInterface $legoDataService,
        private UpsertSetAction $upsertSetAction,
        private Dispatcher $dispatcher,
        private ConnectionInterface $connection,
        private Set $set,
    ) {}

    /**
     * Resolve a set's parts, dispatching the sync job when needed.
     *
     * - Set does not exist locally → upsert metadata synchronously, dispatch job, return Pending.
     * - Set exists with Pending/InProgress/Completed status → pass through current status.
     * - Set exists with Failed status → return Failed (with reason) AND auto-dispatch a fresh sync
     *   in the background. Client sees the failure once; the next poll picks up the new attempt.
     */
    public function execute(string $setNum): SetPartsResultData
    {
        $set = $this->set->newQuery()->where('set_num', $setNum)->first();

        if (!$set instanceof Set) {
            $setData = $this->legoDataService->fetchSet($setNum);

            $newSet = $this->connection->transaction(function() use ($setData): Set {
                $upsertedSet = $this->upsertSetAction->execute($setData);
                $upsertedSet->parts_sync_status = SetSyncStatus::Pending;
                $upsertedSet->save();

                return $upsertedSet;
            });

            $this->dispatcher->dispatch(new SyncSetPartsJob($newSet->id));

            return new SetPartsResultData($newSet, SetSyncStatus::Pending, null);
        }

        if (in_array(
            $set->parts_sync_status,
            [SetSyncStatus::Pending, SetSyncStatus::InProgress, SetSyncStatus::Completed],
            true,
        )) {
            return new SetPartsResultData($set, $set->parts_sync_status, $set->parts_sync_failed_reason);
        }

        // Failed — surface the failure to the client once, and kick off a fresh sync in the background.
        $failedReason = $set->parts_sync_failed_reason;

        $this->connection->transaction(function() use ($set): void {
            $set->parts_sync_status = SetSyncStatus::Pending;
            $set->parts_sync_failed_reason = null;
            $set->save();
        });

        $this->dispatcher->dispatch(new SyncSetPartsJob($set->id));

        return new SetPartsResultData($set, SetSyncStatus::Failed, $failedReason);
    }
}
