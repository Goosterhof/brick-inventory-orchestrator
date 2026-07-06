<?php

declare(strict_types = 1);

namespace App\Jobs;

use App\Actions\FamilySet\ImportOwnedSetsAction;
use App\Enums\ImportJobStatus;
use App\Models\Family;
use App\Models\ImportJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\FailOnTimeout;
use Illuminate\Queue\Attributes\Timeout;
use Throwable;

#[FailOnTimeout]
#[Timeout(600)]
final class ImportOwnedSetsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $importJobId,
        public readonly int $familyId,
    ) {}

    public function handle(
        ImportOwnedSetsAction $importOwnedSetsAction,
        ImportJob $importJobModel,
        Family $familyModel,
    ): void {
        /** @var ImportJob $importJob */
        $importJob = $importJobModel->newQuery()->findOrFail($this->importJobId);

        $importJob->status = ImportJobStatus::InProgress;
        $importJob->started_at = now();
        $importJob->save();

        /** @var Family $family */
        $family = $familyModel->newQuery()->findOrFail($this->familyId);

        $importOwnedSetsResultData = $importOwnedSetsAction->execute($family);

        $importJob->status = $importOwnedSetsResultData->complete ? ImportJobStatus::Completed : ImportJobStatus::Failed;
        $importJob->total_sets = $importOwnedSetsResultData->total + $importOwnedSetsResultData->skipped;
        $importJob->processed_sets = $importOwnedSetsResultData->created + $importOwnedSetsResultData->updated;
        $importJob->failed_sets = $importOwnedSetsResultData->skipped;
        $importJob->completed_at = now();

        if ($importOwnedSetsResultData->skippedSetNums !== []) {
            /** @var array<int, array{set_num: string, error: string}> $failedDetails */
            $failedDetails = array_map(
                static fn(string $setNum): array => ['set_num' => $setNum, 'error' => 'Multiple family sets exist for this set — requires manual reconciliation'],
                $importOwnedSetsResultData->skippedSetNums,
            );
            $importJob->failed_set_details = $failedDetails;
        }

        if ($importOwnedSetsResultData->error !== null) {
            $importJob->failed_set_details = array_merge(
                $importJob->failed_set_details ?? [],
                [['set_num' => 'N/A', 'error' => $importOwnedSetsResultData->error]],
            );
        }

        $importJob->save();
    }

    public function failed(?Throwable $throwable): void
    {
        /** @var ImportJob|null $importJob */
        $importJob = ImportJob::query()->find($this->importJobId);

        if ($importJob === null) {
            return;
        }

        $importJob->status = ImportJobStatus::Failed;
        $importJob->completed_at = now();
        $importJob->failed_set_details = [
            ['set_num' => 'N/A', 'error' => 'Import failed due to an unexpected error'],
        ];
        $importJob->save();

        if ($throwable instanceof Throwable) {
            logger()->error('ImportOwnedSetsJob failed', [
                'import_job_id' => $this->importJobId,
                'exception' => $throwable->getMessage(),
                'trace' => $throwable->getTraceAsString(),
            ]);
        }
    }
}
