<?php

declare(strict_types = 1);

namespace App\Actions;

use App\DataTransferObjects\Result\Set\SetStorageMapData;
use App\DataTransferObjects\Result\Set\StorageMapEntryData;
use App\Models\Family;
use App\Models\Set;
use App\Models\StorageOptionPart;
use Illuminate\Support\Collection;
use stdClass;

final readonly class GetSetStorageMapAction
{
    public function __construct(
        private StorageOptionPart $storageOptionPart,
    ) {}

    /**
     * Get storage locations for each part in a set, scoped to a family.
     */
    public function execute(Set $set, Family $family): SetStorageMapData
    {
        $partIds = $set->setParts()->pluck('part_id')->unique()->toArray();

        if ($partIds === []) {
            return new SetStorageMapData(entries: []);
        }

        /** @var Collection<int, stdClass> $rows */
        $rows = $this->storageOptionPart->newQuery()
            ->join('storage_options', 'storage_option_parts.storage_option_id', '=', 'storage_options.id')
            ->where('storage_options.family_id', $family->id)
            ->whereIn('storage_option_parts.part_id', $partIds)
            ->select([
                'storage_option_parts.part_id',
                'storage_option_parts.color_id',
                'storage_option_parts.storage_option_id',
                'storage_options.name as storage_option_name',
                'storage_option_parts.quantity',
            ])
            ->toBase()
            ->get();

        $entries = [];
        foreach ($rows as $row) {
            $entries[] = new StorageMapEntryData(
                partId: (int) $row->part_id, // @phpstan-ignore cast.int
                colorId: $row->color_id === null ? null : (int) $row->color_id, // @phpstan-ignore cast.int
                storageOptionId: (int) $row->storage_option_id, // @phpstan-ignore cast.int
                storageOptionName: (string) $row->storage_option_name, // @phpstan-ignore cast.string
                quantity: (int) $row->quantity, // @phpstan-ignore cast.int
            );
        }

        return new SetStorageMapData(entries: $entries);
    }
}
