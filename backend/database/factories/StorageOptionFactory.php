<?php

declare(strict_types = 1);

namespace Database\Factories;

use App\Models\Family;
use App\Models\StorageOption;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StorageOption>
 */
class StorageOptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'family_id' => Family::factory(),
            'parent_id' => null,
            'name' => fake()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'row' => null,
            'column' => null,
            'grid_rows' => null,
            'grid_columns' => null,
        ];
    }

    public function forFamily(Family $family): static
    {
        return $this->state(fn(array $attributes): array => [
            'family_id' => $family->id,
        ]);
    }

    public function withParent(StorageOption $storageOption): static
    {
        return $this->state(fn(array $attributes): array => [
            'family_id' => $storageOption->family_id,
            'parent_id' => $storageOption->id,
        ]);
    }

    public function atPosition(int $row, int $column): static
    {
        return $this->state(fn(array $attributes): array => [
            'row' => $row,
            'column' => $column,
        ]);
    }
}
