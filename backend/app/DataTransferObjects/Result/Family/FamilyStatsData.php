<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Result\Family;

final readonly class FamilyStatsData
{
    /**
     * @param array<string, int> $setsByStatus
     */
    public function __construct(
        public int $totalSets,
        public int $totalSetQuantity,
        public array $setsByStatus,
        public int $totalStorageLocations,
        public int $totalUniqueParts,
        public int $totalPartsQuantity,
    ) {}
}
