<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Models\StorageOption;
use Illuminate\Database\Eloquent\Model;

/**
 * @extends ResourceData<StorageOption>
 */
final readonly class StorageOptionResourceData extends ResourceData
{
    public const array EAGER_LOAD = ['children'];

    /**
     * @param array<int, int> $child_ids
     */
    public function __construct(
        public int $id,
        public string $name,
        public ?string $description,
        public ?int $parent_id,
        public ?int $row,
        public ?int $column,
        public ?int $grid_rows,
        public ?int $grid_columns,
        public array $child_ids,
    ) {}

    /**
     * @param StorageOption $model
     */
    public static function from(Model $model): static
    {
        $model->loadMissing(self::requiredRelations());
        self::validateRelationsLoaded($model);

        /** @var array<int, int> $childIds */
        $childIds = $model->children->pluck('id')->all();

        return new self(
            id: $model->id,
            name: $model->name,
            description: $model->description,
            parent_id: $model->parent_id,
            row: $model->row,
            column: $model->column,
            grid_rows: $model->grid_rows,
            grid_columns: $model->grid_columns,
            child_ids: $childIds,
        );
    }
}
