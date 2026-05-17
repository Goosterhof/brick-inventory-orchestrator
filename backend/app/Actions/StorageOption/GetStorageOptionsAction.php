<?php

declare(strict_types = 1);

namespace App\Actions\StorageOption;

use App\Models\Family;
use App\Models\StorageOption;
use Illuminate\Database\Eloquent\Collection;

final readonly class GetStorageOptionsAction
{
    public function __construct(
        private StorageOption $storageOption,
    ) {}

    /**
     * @return Collection<int, StorageOption>
     */
    public function execute(Family $family): Collection
    {
        return $this->storageOption->newQuery()
            ->where('family_id', $family->id)
            ->whereNull('parent_id')
            ->orderBy('id')
            ->get();
    }
}
