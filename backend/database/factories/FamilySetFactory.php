<?php

declare(strict_types = 1);

namespace Database\Factories;

use App\Enums\FamilySetStatus;
use App\Models\Family;
use App\Models\FamilySet;
use App\Models\Set;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FamilySet>
 */
class FamilySetFactory extends Factory
{
    public function definition(): array
    {
        return [
            'family_id' => Family::factory(),
            'set_id' => Set::factory(),
            'quantity' => fake()->numberBetween(1, 3),
            'status' => fake()->randomElement(FamilySetStatus::cases()),
            'purchase_date' => fake()->optional()->date(),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function forFamily(Family $family): static
    {
        return $this->state(fn(array $attributes): array => [
            'family_id' => $family->id,
        ]);
    }

    public function forSet(Set $set): static
    {
        return $this->state(fn(array $attributes): array => [
            'set_id' => $set->id,
        ]);
    }
}
