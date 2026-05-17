<?php

declare(strict_types = 1);

namespace App\Actions\FamilySet;

use App\Models\Family;
use App\Models\ImportJob;

final readonly class GetImportStatusAction
{
    public function __construct(
        private ImportJob $importJob,
    ) {}

    public function execute(Family $family): ?ImportJob
    {
        /** @var ImportJob|null */
        return $this->importJob->newQuery()
            ->where('family_id', $family->id)->latest()
            ->first();
    }
}
