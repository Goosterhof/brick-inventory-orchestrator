<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Result\FamilySet;

use App\Models\FamilySet;
use Illuminate\Support\Collection;

/**
 * Result DTO carrying the family's non-wishlist sets plus the computed
 * per-set completion counts, keyed by family_set_id.
 *
 * Designed to let FamilySetCompletionResourceData shape the response in a
 * single pass over the Collection, replacing the prior double-loop where
 * the Action flattened into a list<FamilySetCompletionData> that the
 * Controller then re-mapped into ResourceData instances.
 */
final readonly class FamilySetCompletionsResultData
{
    /**
     * @param Collection<int, FamilySet>                                                               $familySets          non-wishlist family sets with `set` eager-loaded
     * @param array<int, array{total_parts: int|null, stored_parts: int|null, percentage: float|null}> $countsByFamilySetId Keyed by FamilySet id. `null` totals mean the set's parts were never fetched from Rebrickable.
     */
    public function __construct(
        public Collection $familySets,
        public array $countsByFamilySetId,
    ) {}
}
