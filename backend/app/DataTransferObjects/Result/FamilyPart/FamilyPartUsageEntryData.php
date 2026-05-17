<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Result\FamilyPart;

use App\Enums\FamilySetStatus;

/**
 * One entry in the Reverse Lookup Lens response: a single non-wishlist family_set
 * that needs the requested (part_num, color_id) pair.
 *
 * - `quantityNeeded` — set_parts.quantity × family_sets.quantity for this specific
 *   family_set (per-set demand for the requested part+color).
 * - `quantityStored` — the family-wide total quantity of the part+color across all
 *   storage options. Repeated on every entry so the consumer can render
 *   "this set needs N; the family has S in storage" without an extra lookup.
 * - `shortfall` — `max(0, quantityNeeded - quantityStored)`. Per-entry, computed
 *   under the simple "is one set's need covered?" question. Consumers should
 *   not sum shortfalls across entries — total demand vs. total stored is a
 *   different question, answered by GetFamilyMissingPartsAction.
 */
final readonly class FamilyPartUsageEntryData
{
    public function __construct(
        public int $familySetId,
        public string $setNum,
        public string $setName,
        public FamilySetStatus $status,
        public int $quantityNeeded,
        public int $quantityStored,
        public int $shortfall,
    ) {}
}
