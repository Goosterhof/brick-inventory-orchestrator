<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Result\Family;

final readonly class BrickDnaData
{
    /**
     * @param list<array{color_id: int, name: string, rgb: string, is_transparent: bool, total_quantity: int}>                                                   $topColors
     * @param list<array{part_id: int, part_num: string, name: string, category: string|null, total_quantity: int}>                                              $topPartTypes
     * @param list<array{part_id: int, part_num: string, part_name: string, color_id: int|null, color_name: string|null, color_rgb: string|null, quantity: int}> $rarestParts
     * @param float                                                                                                                                              $diversityScore     Shannon diversity index (H') across color distribution. 0.0 = single color, higher = more diverse. Normalized to [0, 1] range.
     * @param int                                                                                                                                                $totalUniqueParts   Total unique part+color combinations in storage
     * @param int                                                                                                                                                $totalPartsQuantity Total quantity of all parts in storage
     */
    public function __construct(
        public array $topColors,
        public array $topPartTypes,
        public array $rarestParts,
        public float $diversityScore,
        public int $totalUniqueParts,
        public int $totalPartsQuantity,
    ) {}
}
