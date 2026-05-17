<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Result\Set;

final readonly class SetStorageMapData
{
    /**
     * @param list<StorageMapEntryData> $entries One row per (part_id, color_id, storage_option_id) combination
     */
    public function __construct(
        public array $entries,
    ) {}
}
