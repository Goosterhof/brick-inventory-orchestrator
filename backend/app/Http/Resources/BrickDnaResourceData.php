<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\DataTransferObjects\Result\Family\BrickDnaData;

/**
 * @extends ComputedResourceData<BrickDnaData>
 */
final readonly class BrickDnaResourceData extends ComputedResourceData
{
    /**
     * @param list<array{color_id: int, name: string, rgb: string, is_transparent: bool, total_quantity: int}>                                                   $top_colors
     * @param list<array{part_id: int, part_num: string, name: string, category: string|null, total_quantity: int}>                                              $top_part_types
     * @param list<array{part_id: int, part_num: string, part_name: string, color_id: int|null, color_name: string|null, color_rgb: string|null, quantity: int}> $rarest_parts
     */
    public function __construct(
        public array $top_colors,
        public array $top_part_types,
        public array $rarest_parts,
        public float $diversity_score,
        public int $total_unique_parts,
        public int $total_parts_quantity,
    ) {}

    /**
     * @param BrickDnaData $resultData
     */
    public static function from(object $resultData): static
    {
        return new self(
            top_colors: $resultData->topColors,
            top_part_types: $resultData->topPartTypes,
            rarest_parts: $resultData->rarestParts,
            diversity_score: $resultData->diversityScore,
            total_unique_parts: $resultData->totalUniqueParts,
            total_parts_quantity: $resultData->totalPartsQuantity,
        );
    }
}
