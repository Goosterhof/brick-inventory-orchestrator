<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Models\Color;
use Illuminate\Database\Eloquent\Model;

/**
 * @extends ResourceData<Color>
 */
final readonly class ColorResourceData extends ResourceData
{
    public function __construct(
        public int $id,
        public string $name,
        public string $rgb,
        public bool $is_transparent,
    ) {}

    /**
     * @param Color $model
     */
    public static function from(Model $model): static
    {
        return new self(
            id: $model->id,
            name: $model->name,
            rgb: $model->rgb,
            is_transparent: $model->is_transparent,
        );
    }
}
