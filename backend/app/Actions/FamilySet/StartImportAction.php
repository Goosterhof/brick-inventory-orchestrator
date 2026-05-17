<?php

declare(strict_types = 1);

namespace App\Actions\FamilySet;

use App\Enums\ImportJobStatus;
use App\Exceptions\ImportAlreadyInProgressException;
use App\Jobs\ImportOwnedSetsJob;
use App\Models\Family;
use App\Models\ImportJob;
use Illuminate\Contracts\Bus\Dispatcher;
use Illuminate\Database\UniqueConstraintViolationException;

final readonly class StartImportAction
{
    public function __construct(
        private ImportJob $importJob,
        private Dispatcher $dispatcher,
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

        if ($existingJob !== null) {
            throw ImportAlreadyInProgressException::forFamily($family->id);
        }

        /** @var ImportJob $newImportJob */
        $newImportJob = $this->importJob->newInstance();
        $newImportJob->family_id = $family->id;
        $newImportJob->status = ImportJobStatus::Pending;
        $newImportJob->total_sets = 0;
        $newImportJob->processed_sets = 0;
        $newImportJob->failed_sets = 0;

        try {
            $newImportJob->save();
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
}
