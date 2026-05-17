<?php

declare(strict_types = 1);

namespace App\Actions;

use App\Actions\Sync\UpsertSetAction;
use App\Contracts\LegoDataServiceInterface;
use App\Models\Set;

final readonly class GetSetByEanAction
{
    public function __construct(
        private LegoDataServiceInterface $legoDataService,
        private UpsertSetAction $upsertSetAction,
        private Set $set,
    ) {}

    public function execute(string $ean): Set
    {
        $legoSetData = $this->legoDataService->fetchSetByEan($ean);

        $existingSet = $this->set->newQuery()->where('set_num', $legoSetData->setNum)->first();

        if ($existingSet instanceof Set) {
            return $existingSet;
        }

        return $this->upsertSetAction->execute($legoSetData);
    }
}
