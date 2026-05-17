<?php

declare(strict_types = 1);

namespace App\Actions;

use App\Actions\Sync\UpsertSetAction;
use App\Contracts\LegoDataServiceInterface;
use App\Models\Set;

final readonly class GetSetAction
{
    public function __construct(
        private LegoDataServiceInterface $legoDataService,
        private UpsertSetAction $upsertSetAction,
        private Set $set,
    ) {}

    public function execute(string $setNum): Set
    {
        $set = $this->set->newQuery()->where('set_num', $setNum)->first();

        if ($set instanceof Set) {
            return $set;
        }

        $legoSetData = $this->legoDataService->fetchSet($setNum);

        return $this->upsertSetAction->execute($legoSetData);
    }
}
