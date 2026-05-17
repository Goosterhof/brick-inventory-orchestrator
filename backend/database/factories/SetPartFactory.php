<?php

declare(strict_types = 1);

namespace Database\Factories;

use App\Models\Color;
use App\Models\Part;
use App\Models\Set;
use App\Models\SetPart;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SetPart>
 */
class SetPartFactory extends Factory
{
    public function definition(): array
    {
        return [
            'set_id' => Set::factory(),
            'part_id' => Part::factory(),
            'color_id' => Color::factory(),
            'quantity' => fake()->numberBetween(1, 20),
            'is_spare' => false,
            'element_id' => null,
        ];
    }

    public function forSet(Set $set): static
    {
        return $this->state(fn(array $attributes): array => [
            'set_id' => $set->id,
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

    public function spare(): static
    {
        return $this->state(fn(array $attributes): array => [
            'is_spare' => true,
        ]);
    }
}
