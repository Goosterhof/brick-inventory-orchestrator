<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Models\Part;
use Illuminate\Database\Eloquent\Model;

/**
 * @extends ResourceData<Part>
 */
final readonly class PartResourceData extends ResourceData
{
    public function __construct(
        public int $id,
        public string $part_num,
        public string $name,
        public ?string $category,
        public ?string $image_url,
    ) {}

    /**
     * @param Part $model
     */
    public static function from(Model $model): static
    {
        return new self(
            id: $model->id,
            part_num: $model->part_num,
            name: $model->name,
            category: $model->category,
            image_url: $model->image_url,
        );
    }
}
