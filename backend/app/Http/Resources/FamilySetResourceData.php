<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Enums\FamilySetStatus;
use App\Models\FamilySet;
use Illuminate\Database\Eloquent\Model;

/**
 * @extends ResourceData<FamilySet>
 */
final readonly class FamilySetResourceData extends ResourceData
{
    public const array EAGER_LOAD = ['set', 'set.theme'];

    public function __construct(
        public int $id,
        public int $set_id,
        public int $quantity,
        public FamilySetStatus $status,
        public ?string $purchase_date,
        public ?string $notes,
        public SetSummaryResourceData $set,
    ) {}

    /**
     * @param FamilySet $model
     */
    public static function from(Model $model): static
    {
        $model->loadMissing(self::requiredRelations());
        self::validateRelationsLoaded($model);

        return new self(
            id: $model->id,
            set_id: $model->set_id,
            quantity: $model->quantity,
            status: $model->status,
            purchase_date: $model->purchase_date?->format('Y-m-d'),
            notes: $model->notes,
            set: SetSummaryResourceData::from($model->set),
        );
    }
}
