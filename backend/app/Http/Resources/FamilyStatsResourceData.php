<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\DataTransferObjects\Result\Family\FamilyStatsData;

/**
 * @extends ComputedResourceData<FamilyStatsData>
 */
final readonly class FamilyStatsResourceData extends ComputedResourceData
{
    /**
     * @param array<string, int> $sets_by_status
     */
    public function __construct(
        public int $total_sets,
        public int $total_set_quantity,
        public array $sets_by_status,
        public int $total_storage_locations,
        public int $total_unique_parts,
        public int $total_parts_quantity,
    ) {}

    /**
     * @param FamilyStatsData $resultData
     */
    public static function from(object $resultData): static
    {
        return new self(
            total_sets: $resultData->totalSets,
            total_set_quantity: $resultData->totalSetQuantity,
            sets_by_status: $resultData->setsByStatus,
            total_storage_locations: $resultData->totalStorageLocations,
            total_unique_parts: $resultData->totalUniqueParts,
            total_parts_quantity: $resultData->totalPartsQuantity,
        );
    }
}
