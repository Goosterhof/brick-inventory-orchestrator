<?php

declare(strict_types = 1);

namespace App\Jobs;

use App\Actions\Sync\StoreSetPartsAction;
use App\Contracts\LegoDataServiceInterface;
use App\Enums\SetSyncStatus;
use App\Models\Set;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\FailOnTimeout;
use Illuminate\Queue\Attributes\Timeout;
use Throwable;

#[FailOnTimeout]
#[Timeout(600)]
final class SyncSetPartsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $setId,
    ) {}

    public function handle(
        LegoDataServiceInterface $legoDataService,
        StoreSetPartsAction $storeSetPartsAction,
        Set $setModel,
    ): void {
        /** @var Set $set */
        $set = $setModel->newQuery()->findOrFail($this->setId);

        $set->parts_sync_status = SetSyncStatus::InProgress;
        $set->save();

        $parts = $legoDataService->fetchSetParts($set->set_num);
        $storeSetPartsAction->execute($set, $parts);

        $set->parts_sync_status = SetSyncStatus::Completed;
        $set->parts_synced_at = now();
        $set->parts_sync_failed_reason = null;
        $set->save();
    }

    public function failed(?Throwable $throwable): void
    {
        /** @var Set|null $set */
        $set = Set::query()->find($this->setId);

        if (!$set instanceof Set) {
            return;
        }

        $set->parts_sync_status = SetSyncStatus::Failed;
        $set->parts_sync_failed_reason = 'Sync failed due to an unexpected error';
        $set->save();

        if ($throwable instanceof Throwable) {
            logger()->error('SyncSetPartsJob failed', [
                'set_id' => $this->setId,
                'exception' => $throwable->getMessage(),
                'trace' => $throwable->getTraceAsString(),
            ]);
        }
    }
}
