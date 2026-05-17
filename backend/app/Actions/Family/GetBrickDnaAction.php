<?php

declare(strict_types = 1);

namespace App\Actions\Family;

use App\DataTransferObjects\Result\Family\BrickDnaData;
use App\Models\Family;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use Illuminate\Support\Collection;
use stdClass;

/**
 * Computes a family's "Brick DNA" — analytics on their stored parts collection.
 *
 * Diversity Score Algorithm: Shannon Diversity Index (H'), normalized to [0, 1].
 * H' = -sum(p_i * ln(p_i)) for each color i, where p_i = proportion of total quantity.
 * Normalized: H' / ln(S), where S = number of distinct colors.
 * Result: 0.0 = all parts are one color, 1.0 = perfectly even distribution across colors.
 * When 0 or 1 colors exist, returns 0.0 (no meaningful diversity).
 */
final readonly class GetBrickDnaAction
{
    public function __construct(
        private StorageOption $storageOption,
        private StorageOptionPart $storageOptionPart,
    ) {}

    public function execute(Family $family): BrickDnaData
    {
        /** @var Collection<int, int> $storageOptionIds */
        $storageOptionIds = $this->storageOption->newQuery()
            ->where('family_id', $family->id)
            ->pluck('id');

        if ($storageOptionIds->isEmpty()) {
            return new BrickDnaData(
                topColors: [],
                topPartTypes: [],
                rarestParts: [],
                diversityScore: 0.0,
                totalUniqueParts: 0,
                totalPartsQuantity: 0,
            );
        }

        $totalUniqueParts = $this->storageOptionPart->newQuery()
            ->whereIn('storage_option_id', $storageOptionIds)
            ->count();

        $totalPartsQuantity = (int) $this->storageOptionPart->newQuery()
            ->whereIn('storage_option_id', $storageOptionIds)
            ->sum('quantity');

        $topColors = $this->computeTopColors($storageOptionIds);
        $topPartTypes = $this->computeTopPartTypes($storageOptionIds);
        $rarestParts = $this->computeRarestParts($storageOptionIds);
        $diversityScore = $this->computeDiversityScore($storageOptionIds);

        return new BrickDnaData(
            topColors: $topColors,
            topPartTypes: $topPartTypes,
            rarestParts: $rarestParts,
            diversityScore: $diversityScore,
            totalUniqueParts: $totalUniqueParts,
            totalPartsQuantity: $totalPartsQuantity,
        );
    }

    /**
     * Top 10 colors by total quantity of parts stored in that color.
     *
     * @param Collection<int, int> $storageOptionIds
     *
     * @return list<array{color_id: int, name: string, rgb: string, is_transparent: bool, total_quantity: int}>
     */
    private function computeTopColors(Collection $storageOptionIds): array
    {
        /** @var list<array{color_id: int, name: string, rgb: string, is_transparent: bool, total_quantity: int}> */
        return $this->storageOptionPart->newQuery()
            ->whereIn('storage_option_parts.storage_option_id', $storageOptionIds)
            ->whereNotNull('storage_option_parts.color_id')
            ->join('colors', 'colors.id', '=', 'storage_option_parts.color_id')
            ->selectRaw('colors.id as color_id, colors.name, colors.rgb, colors.is_transparent, SUM(storage_option_parts.quantity) as total_quantity')
            ->groupBy('colors.id', 'colors.name', 'colors.rgb', 'colors.is_transparent')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->toBase()
            ->get()
            ->map(static fn(stdClass $row): array => [
                'color_id' => (int) $row->color_id, // @phpstan-ignore cast.int
                'name' => (string) $row->name, // @phpstan-ignore cast.string
                'rgb' => (string) $row->rgb, // @phpstan-ignore cast.string
                'is_transparent' => (bool) $row->is_transparent,
                'total_quantity' => (int) $row->total_quantity, // @phpstan-ignore cast.int
            ])
            ->all();
    }

    /**
     * Top 10 part types by total quantity stored.
     *
     * @param Collection<int, int> $storageOptionIds
     *
     * @return list<array{part_id: int, part_num: string, name: string, category: string|null, total_quantity: int}>
     */
    private function computeTopPartTypes(Collection $storageOptionIds): array
    {
        /** @var list<array{part_id: int, part_num: string, name: string, category: string|null, total_quantity: int}> */
        return $this->storageOptionPart->newQuery()
            ->whereIn('storage_option_parts.storage_option_id', $storageOptionIds)
            ->join('parts', 'parts.id', '=', 'storage_option_parts.part_id')
            ->selectRaw('parts.id as part_id, parts.part_num, parts.name, parts.category, SUM(storage_option_parts.quantity) as total_quantity')
            ->groupBy('parts.id', 'parts.part_num', 'parts.name', 'parts.category')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->toBase()
            ->get()
            ->map(static fn(stdClass $row): array => [
                'part_id' => (int) $row->part_id, // @phpstan-ignore cast.int
                'part_num' => (string) $row->part_num, // @phpstan-ignore cast.string
                'name' => (string) $row->name, // @phpstan-ignore cast.string
                'category' => $row->category !== null ? (string) $row->category : null, // @phpstan-ignore cast.string
                'total_quantity' => (int) $row->total_quantity, // @phpstan-ignore cast.int
            ])
            ->all();
    }

    /**
     * 10 rarest part+color combinations (lowest quantity).
     *
     * @param Collection<int, int> $storageOptionIds
     *
     * @return list<array{part_id: int, part_num: string, part_name: string, color_id: int|null, color_name: string|null, color_rgb: string|null, quantity: int}>
     */
    private function computeRarestParts(Collection $storageOptionIds): array
    {
        /** @var list<array{part_id: int, part_num: string, part_name: string, color_id: int|null, color_name: string|null, color_rgb: string|null, quantity: int}> */
        return $this->storageOptionPart->newQuery()
            ->whereIn('storage_option_parts.storage_option_id', $storageOptionIds)
            ->join('parts', 'parts.id', '=', 'storage_option_parts.part_id')
            ->leftJoin('colors', 'colors.id', '=', 'storage_option_parts.color_id')
            ->selectRaw('storage_option_parts.part_id, parts.part_num, parts.name as part_name, storage_option_parts.color_id, colors.name as color_name, colors.rgb as color_rgb, storage_option_parts.quantity')
            ->orderBy('storage_option_parts.quantity')
            ->orderBy('parts.name')
            ->limit(10)
            ->toBase()
            ->get()
            ->map(static fn(stdClass $row): array => [
                'part_id' => (int) $row->part_id, // @phpstan-ignore cast.int
                'part_num' => (string) $row->part_num, // @phpstan-ignore cast.string
                'part_name' => (string) $row->part_name, // @phpstan-ignore cast.string
                'color_id' => $row->color_id !== null ? (int) $row->color_id : null, // @phpstan-ignore cast.int
                'color_name' => $row->color_name !== null ? (string) $row->color_name : null, // @phpstan-ignore cast.string
                'color_rgb' => $row->color_rgb !== null ? (string) $row->color_rgb : null, // @phpstan-ignore cast.string
                'quantity' => (int) $row->quantity, // @phpstan-ignore cast.int
            ])
            ->all();
    }

    /**
     * Normalized Shannon Diversity Index across color distribution.
     *
     * @param Collection<int, int> $storageOptionIds
     */
    private function computeDiversityScore(Collection $storageOptionIds): float
    {
        /** @var Collection<int, int> $colorQuantities */
        $colorQuantities = $this->storageOptionPart->newQuery()
            ->whereIn('storage_option_id', $storageOptionIds)
            ->whereNotNull('color_id')
            ->selectRaw('color_id, SUM(quantity) as total_quantity')
            ->groupBy('color_id')
            ->toBase()
            ->pluck('total_quantity');

        $distinctColors = $colorQuantities->count();

        if ($distinctColors <= 1) {
            return 0.0;
        }

        $totalQuantity = (int) $colorQuantities->sum(); // @phpstan-ignore cast.int

        if ($totalQuantity === 0) {
            return 0.0;
        }

        $shannonIndex = 0.0;

        foreach ($colorQuantities as $colorQuantity) {
            $proportion = $colorQuantity / $totalQuantity;

            if ($proportion > 0) {
                $shannonIndex -= $proportion * log($proportion);
            }
        }

        // Normalize to [0, 1] by dividing by ln(S) where S = distinct color count
        $maxEntropy = log($distinctColors);

        return round($shannonIndex / $maxEntropy, 4);
    }
}
