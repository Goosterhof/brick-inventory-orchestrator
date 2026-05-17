<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Result\FamilyPart;

use Illuminate\Support\Collection;

/**
 * Envelope for the Reverse Lookup Lens response.
 *
 * Carries the looked-up part+color metadata (null fields when the part is
 * unknown to the catalog) plus the list of non-wishlist family_sets that
 * need this exact pair. An empty `usages` is a valid 200 response — it
 * answers "no sets need this".
 */
final readonly class FamilyPartUsageData
{
    /**
     * @param Collection<int, FamilyPartUsageEntryData> $usages One entry per non-wishlist family_set that needs the requested (part_num, color_id) pair
     */
    public function __construct(
        public string $partNum,
        public int $colorId,
        public ?string $partName,
        public ?string $partImageUrl,
        public ?string $colorName,
        public ?string $colorHex,
        public Collection $usages,
    ) {}
}
