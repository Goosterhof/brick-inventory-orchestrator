<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\DataTransferObjects\Result\FamilyPart\FamilyPartUsageData;
use App\DataTransferObjects\Result\FamilyPart\FamilyPartUsageEntryData;

/**
 * @extends ComputedResourceData<FamilyPartUsageData>
 */
final readonly class FamilyPartUsageResourceData extends ComputedResourceData
{
    /**
     * @param list<array{
     *     family_set_id: int,
     *     set_num: string,
     *     set_name: string,
     *     status: string,
     *     quantity_needed: int,
     *     quantity_stored: int,
     *     shortfall: int,
     * }> $usages
     */
    public function __construct(
        public string $part_num,
        public int $color_id,
        public ?string $part_name,
        public ?string $part_image_url,
        public ?string $color_name,
        public ?string $color_hex,
        public array $usages,
    ) {}

    /**
     * @param FamilyPartUsageData $resultData
     */
    public static function from(object $resultData): static
    {
        $usages = array_values($resultData->usages
            ->map(static fn(FamilyPartUsageEntryData $familyPartUsageEntryData): array => [
                'family_set_id' => $familyPartUsageEntryData->familySetId,
                'set_num' => $familyPartUsageEntryData->setNum,
                'set_name' => $familyPartUsageEntryData->setName,
                'status' => $familyPartUsageEntryData->status->value,
                'quantity_needed' => $familyPartUsageEntryData->quantityNeeded,
                'quantity_stored' => $familyPartUsageEntryData->quantityStored,
                'shortfall' => $familyPartUsageEntryData->shortfall,
            ])
            ->all());

        return new self(
            part_num: $resultData->partNum,
            color_id: $resultData->colorId,
            part_name: $resultData->partName,
            part_image_url: $resultData->partImageUrl,
            color_name: $resultData->colorName,
            color_hex: $resultData->colorHex,
            usages: $usages,
        );
    }
}
