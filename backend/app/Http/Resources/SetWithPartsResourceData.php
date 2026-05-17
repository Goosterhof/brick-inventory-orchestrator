<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Models\Set;
use Illuminate\Database\Eloquent\Model;

/**
 * @extends ResourceData<Set>
 */
final readonly class SetWithPartsResourceData extends ResourceData
{
    public const array EAGER_LOAD = ['theme', 'setParts.part', 'setParts.color'];

    /**
     * @param array<int, SetPartResourceData> $parts
     */
    public function __construct(
        public int $id,
        public string $set_num,
        public string $name,
        public ?int $year,
        public ?ThemeResourceData $theme,
        public int $num_parts,
        public ?string $image_url,
        public array $parts,
    ) {}

    /**
     * @param Set $model
     */
    public static function from(Model $model): static
    {
        $model->loadMissing(self::requiredRelations());

        return new self(
            id: $model->id,
            set_num: $model->set_num,
            name: $model->name,
            year: $model->year,
            theme: $model->theme !== null ? ThemeResourceData::from($model->theme) : null,
            num_parts: $model->num_parts,
            image_url: $model->image_url,
            parts: array_map(
                SetPartResourceData::from(...),
                $model->setParts->all(),
            ),
        );
    }
}
