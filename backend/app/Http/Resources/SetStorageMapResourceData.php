<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\DataTransferObjects\Result\Set\SetStorageMapData;
use App\DataTransferObjects\Result\Set\StorageMapEntryData;

/**
 * @extends ComputedResourceData<SetStorageMapData>
 */
final readonly class SetStorageMapResourceData extends ComputedResourceData
{
    /**
     * @param list<array{
     *     part_id: int,
     *     color_id: int|null,
     *     storage_option_id: int,
     *     storage_option_name: string,
     *     quantity: int,
     * }> $entries
     */
    public function __construct(
        public array $entries,
    ) {}

    /**
     * @param SetStorageMapData $resultData
     */
    public static function from(object $resultData): static
    {
        $entries = array_map(
            static fn(StorageMapEntryData $storageMapEntryData): array => [
                'part_id' => $storageMapEntryData->partId,
                'color_id' => $storageMapEntryData->colorId,
                'storage_option_id' => $storageMapEntryData->storageOptionId,
                'storage_option_name' => $storageMapEntryData->storageOptionName,
                'quantity' => $storageMapEntryData->quantity,
            ],
            $resultData->entries,
        );

        return new self(entries: $entries);
    }
}
