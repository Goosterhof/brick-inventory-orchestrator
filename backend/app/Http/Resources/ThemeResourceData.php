<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Models\Theme;
use Illuminate\Database\Eloquent\Model;

/**
 * @extends ResourceData<Theme>
 */
final readonly class ThemeResourceData extends ResourceData
{
    public function __construct(
        public int $id,
        public string $name,
        public ?int $parentId,
    ) {}

    /**
     * @param Theme $model
     */
    public static function from(Model $model): static
    {
        return new self(
            id: $model->id,
            name: $model->name,
            parentId: $model->parent_id,
        );
    }
}
