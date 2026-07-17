<?php

declare(strict_types = 1);

namespace App\Actions\FamilySet;

use App\Enums\ImportJobStatus;
use App\Exceptions\ImportAlreadyInProgressException;
use App\Jobs\ImportOwnedSetsJob;
use App\Models\Family;
use App\Models\ImportJob;
use Illuminate\Container\Attributes\Config;
use Illuminate\Contracts\Bus\Dispatcher;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\UniqueConstraintViolationException;

final readonly class StartImportAction
{
    public function __construct(
        private ImportJob $importJob,
        private Dispatcher $dispatcher,
        private ConnectionInterface $connection,
        #[Config('app.import_stale_active_job_threshold', 1_200)]
        private int $staleActiveJobThreshold,
    ) {}

    /**
     * @throws ImportAlreadyInProgressException
     */
    public function execute(Family $family): ImportJob
    {
        $existingJob = $this->importJob->newQuery()
            ->where('family_id', $family->id)
            ->whereIn('status', [ImportJobStatus::Pending, ImportJobStatus::InProgress])
            ->first();

        if ($existingJob !== null && !$this->isReclaimable($existingJob)) {
            throw ImportAlreadyInProgressException::forFamily($family->id);
        }

        try {
            $newImportJob = $this->connection->transaction(function() use ($family, $existingJob): ImportJob {
                // Retire a stranded active job before inserting the replacement so the
                // partial unique index (one active row per family) is never violated.
                if ($existingJob !== null) {
                    $existingJob->status = ImportJobStatus::Failed;
                    $existingJob->save();
                }

                /** @var ImportJob $newImportJob */
                $newImportJob = $this->importJob->newInstance();
                $newImportJob->family_id = $family->id;
                $newImportJob->status = ImportJobStatus::Pending;
                $newImportJob->total_sets = 0;
                $newImportJob->processed_sets = 0;
                $newImportJob->failed_sets = 0;
                $newImportJob->save();

                return $newImportJob;
            });
        } catch (UniqueConstraintViolationException) {
            throw ImportAlreadyInProgressException::forFamily($family->id);
        }

        $this->dispatcher->dispatch(
            new ImportOwnedSetsJob(
                importJobId: $newImportJob->id,
                familyId: $family->id,
            ),
        );

        return $newImportJob;
    }

    /**
     * An active job older than the stale threshold is treated as reclaimable: the
     * queue worker was almost certainly down (or its row lost) when it was queued,
     * so it will never progress on its own. A job with no created_at timestamp is
     * treated as fresh — failing safe toward the existing 409 behavior.
     */
    private function isReclaimable(ImportJob $existingJob): bool
    {
        $createdAt = $existingJob->created_at;

        if ($createdAt === null) {
            return false;
        }

        return now()->getTimestamp() - $createdAt->getTimestamp() >= $this->staleActiveJobThreshold;
    }
}
