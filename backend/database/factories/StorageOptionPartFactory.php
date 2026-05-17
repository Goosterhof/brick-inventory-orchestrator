<?php

declare(strict_types = 1);

namespace Database\Factories;

use App\Models\Color;
use App\Models\Part;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StorageOptionPart>
 */
class StorageOptionPartFactory extends Factory
{
    public function definition(): array
    {
        return [
            'storage_option_id' => StorageOption::factory(),
            'part_id' => Part::factory(),
            'color_id' => null,
            'quantity' => fake()->numberBetween(1, 100),
        ];
    }

    public function forStorageOption(StorageOption $storageOption): static
    {
        return $this->state(fn(array $attributes): array => [
            'storage_option_id' => $storageOption->id,
        ]);
    }

    public function forPart(Part $part): static
    {
        return $this->state(fn(array $attributes): array => [
            'part_id' => $part->id,
        ]);
    }

    public function withColor(Color $color): static
    {
        return $this->state(fn(array $attributes): array => [
            'color_id' => $color->id,
        ]);
    }
}
