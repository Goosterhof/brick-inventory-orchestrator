<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\DataTransferObjects\Result\FamilySet\FamilySetCompletionsResultData;
use App\Models\FamilySet;
use Illuminate\Database\Eloquent\Model;

/**
 * @extends ResourceData<FamilySet>
 */
final readonly class FamilySetCompletionResourceData extends ResourceData
{
    /** @var array<int, string> */
    public const array EAGER_LOAD = ['set'];

    public function __construct(
        public int $family_set_id,
        public string $set_num,
        public ?int $total_parts,
        public ?int $stored_parts,
        public ?float $percentage,
    ) {}

    /**
     * @param FamilySet $model
     */
    public static function from(Model $model): static
    {
        self::validateRelationsLoaded($model);

        return new self(
            family_set_id: $model->id,
            set_num: $model->set->set_num,
            total_parts: null,
            stored_parts: null,
            percentage: null,
        );
    }

    /**
     * Shape a collection of per-set resource instances from the Action's Result DTO.
     *
     * Reads the eager-loaded `set` relationship and the Action's precomputed counts
     * in a single pass, replacing the former flatten-then-remap double-loop.
     *
     * @return array<int, self>
     */
    public static function fromResult(FamilySetCompletionsResultData $familySetCompletionsResultData): array
    {
        return $familySetCompletionsResultData->familySets
            ->map(static function(FamilySet $familySet) use ($familySetCompletionsResultData): self {
                self::validateRelationsLoaded($familySet);

                $counts = $familySetCompletionsResultData->countsByFamilySetId[$familySet->id] ?? [
                    'total_parts' => null,
                    'stored_parts' => null,
                    'percentage' => null,
                ];

                return new self(
                    family_set_id: $familySet->id,
                    set_num: $familySet->set->set_num,
                    total_parts: $counts['total_parts'],
                    stored_parts: $counts['stored_parts'],
                    percentage: $counts['percentage'],
                );
            })
            ->values()
            ->all();
    }
}
