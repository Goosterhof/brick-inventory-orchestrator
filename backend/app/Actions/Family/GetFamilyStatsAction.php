<?php

declare(strict_types = 1);

namespace App\Actions\Family;

use App\DataTransferObjects\Result\Family\FamilyStatsData;
use App\Enums\FamilySetStatus;
use App\Models\Family;
use App\Models\FamilySet;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;

final readonly class GetFamilyStatsAction
{
    public function __construct(
        private FamilySet $familySet,
        private StorageOption $storageOption,
        private StorageOptionPart $storageOptionPart,
    ) {}

    public function execute(Family $family): FamilyStatsData
    {
        $builder = $this->familySet->newQuery()
            ->where('family_id', $family->id)
            ->where('status', '!=', FamilySetStatus::Wishlist);

        $totalSets = $builder->count();

        $totalSetQuantity = (int) $builder->sum('quantity');

        /** @var array<string, int> $setsByStatus */
        $setsByStatus = $this->familySet->newQuery()
            ->where('family_id', $family->id)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->toBase()
            ->pluck('count', 'status')
            ->map(static fn(mixed $count): int => (int) $count) // @phpstan-ignore cast.int
            ->all();

        $storageOptionIds = $this->storageOption->newQuery()
            ->where('family_id', $family->id)
            ->pluck('id');

        $totalStorageLocations = $storageOptionIds->count();

        $partsQuery = $this->storageOptionPart->newQuery()
            ->whereIn('storage_option_id', $storageOptionIds);

        $totalUniqueParts = $partsQuery->count();

        $totalPartsQuantity = (int) $this->storageOptionPart->newQuery()
            ->whereIn('storage_option_id', $storageOptionIds)
            ->sum('quantity');

        return new FamilyStatsData(
            totalSets: $totalSets,
            totalSetQuantity: $totalSetQuantity,
            setsByStatus: $setsByStatus,
            totalStorageLocations: $totalStorageLocations,
            totalUniqueParts: $totalUniqueParts,
            totalPartsQuantity: $totalPartsQuantity,
        );
    }
}
