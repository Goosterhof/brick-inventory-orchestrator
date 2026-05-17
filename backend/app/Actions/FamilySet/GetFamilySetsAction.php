<?php

declare(strict_types = 1);

namespace App\Actions\FamilySet;

use App\Models\Family;
use App\Models\FamilySet;
use Illuminate\Database\Eloquent\Collection;

final readonly class GetFamilySetsAction
{
    public function __construct(
        private FamilySet $familySet,
    ) {}

    /**
     * @return Collection<int, FamilySet>
     */
    public function execute(Family $family): Collection
    {
        return $this->familySet->newQuery()
            ->where('family_id', $family->id)
            ->latest()
            ->get();
    }
}
