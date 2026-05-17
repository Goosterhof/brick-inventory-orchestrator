<?php

declare(strict_types = 1);

namespace App\Actions\StorageOption;

use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use Illuminate\Database\Eloquent\Collection;

final readonly class GetStorageOptionPartsAction
{
    /**
     * @return Collection<int, StorageOptionPart>
     */
    public function execute(StorageOption $storageOption): Collection
    {
        return $storageOption->storageOptionParts()
            ->orderBy('id')
            ->get();
    }
}
