<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Result\Family;

final readonly class FamilyMissingPartsData
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
     * }>           $shortfalls            One entry per (part_num, color_id) combination with shortfall > 0
     * @param list<string> $unknownFamilySetIds IDs of non-wishlist family_sets whose set_parts have never been fetched from Rebrickable
     */
    public function __construct(
        public array $shortfalls,
        public array $unknownFamilySetIds,
    ) {}
}
