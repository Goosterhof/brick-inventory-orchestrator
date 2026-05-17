<?php

declare(strict_types = 1);

namespace App\Actions\FamilySet;

use App\DataTransferObjects\Result\FamilySet\FamilySetCompletionsResultData;
use App\Enums\FamilySetStatus;
use App\Models\Family;
use App\Models\FamilySet;
use App\Models\SetPart;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Collection;
use stdClass;

final readonly class GetFamilySetCompletionAction
{
    public function __construct(
        private FamilySet $familySet,
        private SetPart $setPart,
        private StorageOption $storageOption,
        private StorageOptionPart $storageOptionPart,
    ) {}

    public function execute(Family $family): FamilySetCompletionsResultData
    {
        /** @var Collection<int, FamilySet> $familySets */
        $familySets = $this->familySet->newQuery()
            ->where('family_id', $family->id)
            ->where('status', '!=', FamilySetStatus::Wishlist)
            ->with('set')
            ->get();

        if ($familySets->isEmpty()) {
            return new FamilySetCompletionsResultData(
                familySets: $familySets,
                countsByFamilySetId: [],
            );
        }

        $setIds = $familySets->pluck('set_id')->unique()->values();

        // Count total unique part+color combinations per set (non-spare parts only)
        /** @var Collection<int, stdClass> $totalPartsCounts */
        $totalPartsCounts = $this->setPart->newQuery()
            ->whereIn('set_id', $setIds)
            ->where('is_spare', false)
            ->selectRaw('set_id, COUNT(*) as total_parts')
            ->groupBy('set_id')
            ->toBase()
            ->get()
            ->keyBy('set_id');

        // Get family's storage option IDs
        $storageOptionIds = $this->storageOption->newQuery()
            ->where('family_id', $family->id)
            ->pluck('id');

        // Count stored unique part+color combinations per set
        // Uses COUNT(DISTINCT part_id || '-' || color_id) for SQLite compatibility
        /** @var Collection<int, stdClass> $storedPartsCounts */
        $storedPartsCounts = collect();

        if ($storageOptionIds->isNotEmpty()) {
            /** @var Collection<int, stdClass> $storedPartsCounts */
            $storedPartsCounts = $this->storageOptionPart->newQuery()
                ->whereIn('storage_option_parts.storage_option_id', $storageOptionIds)
                ->where('storage_option_parts.quantity', '>', 0)
                ->join('set_parts', function(JoinClause $joinClause) use ($setIds): void {
                    $joinClause->on('storage_option_parts.part_id', '=', 'set_parts.part_id')
                        ->on('storage_option_parts.color_id', '=', 'set_parts.color_id')
                        ->whereIn('set_parts.set_id', $setIds)
                        ->where('set_parts.is_spare', false);
                })
                ->selectRaw("set_parts.set_id, COUNT(DISTINCT CAST(set_parts.part_id AS TEXT) || '-' || CAST(set_parts.color_id AS TEXT)) as stored_parts")
                ->groupBy('set_parts.set_id')
                ->toBase()
                ->get()
                ->keyBy('set_id');
        }

        /** @var array<int, array{total_parts: int|null, stored_parts: int|null, percentage: float|null}> $countsByFamilySetId */
        $countsByFamilySetId = [];

        foreach ($familySets as $familySet) {
            $setId = $familySet->set_id;
            $totalPartsRow = $totalPartsCounts->get($setId);

            // No set_parts rows means parts were never fetched from Rebrickable
            if ($totalPartsRow === null) {
                $countsByFamilySetId[$familySet->id] = [
                    'total_parts' => null,
                    'stored_parts' => null,
                    'percentage' => null,
                ];

                continue;
            }

            $totalParts = (int) $totalPartsRow->total_parts; // @phpstan-ignore cast.int
            $storedPartsRow = $storedPartsCounts->get($setId);
            $storedParts = $storedPartsRow !== null ? (int) $storedPartsRow->stored_parts : 0; // @phpstan-ignore cast.int

            $percentage = $totalParts > 0
                ? min(round($storedParts / $totalParts * 100, 2), 100.0)
                : 0.0;

            $countsByFamilySetId[$familySet->id] = [
                'total_parts' => $totalParts,
                'stored_parts' => $storedParts,
                'percentage' => $percentage,
            ];
        }

        return new FamilySetCompletionsResultData(
            familySets: $familySets,
            countsByFamilySetId: $countsByFamilySetId,
        );
    }
}
