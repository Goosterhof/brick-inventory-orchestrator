<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\DataTransferObjects\Result\Family\FamilyMissingPartsData;

/**
 * @extends ComputedResourceData<FamilyMissingPartsData>
 */
final readonly class FamilyMissingPartsResourceData extends ComputedResourceData
{
    /**
     * @param list<array{
     *     part_id: int,
     *     part_num: string,
     *     color_id: int,
     *     part_name: string,
     *     color_name: string,
     *     color_hex: string,
     *     part_image_url: string|null,
     *     quantity_needed: int,
     *     quantity_stored: int,
     *     shortfall: int,
     *     needed_by_set_nums: list<string>,
     * }>           $shortfalls
     * @param list<string> $unknown_family_set_ids
     */
    public function __construct(
        public array $shortfalls,
        public array $unknown_family_set_ids,
    ) {}

    /**
     * @param FamilyMissingPartsData $resultData
     */
    public static function from(object $resultData): static
    {
        return new self(
            shortfalls: $resultData->shortfalls,
            unknown_family_set_ids: $resultData->unknownFamilySetIds,
        );
    }
}
