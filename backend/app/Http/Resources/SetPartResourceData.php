<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Models\SetPart;
use Illuminate\Database\Eloquent\Model;

/**
 * @extends ResourceData<SetPart>
 */
final readonly class SetPartResourceData extends ResourceData
{
    public const array EAGER_LOAD = ['part', 'color'];

    public function __construct(
        public int $id,
        public int $quantity,
        public bool $is_spare,
        public ?string $element_id,
        public PartResourceData $part,
        public ColorResourceData $color,
    ) {}

    /**
     * @param SetPart $model
     */
    public static function from(Model $model): static
    {
        $model->loadMissing(self::requiredRelations());
        self::validateRelationsLoaded($model);

        return new self(
            id: $model->id,
            quantity: $model->quantity,
            is_spare: $model->is_spare,
            element_id: $model->element_id,
            part: PartResourceData::from($model->part),
            color: ColorResourceData::from($model->color),
        );
    }
}
