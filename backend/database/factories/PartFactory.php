<?php

declare(strict_types = 1);

namespace Database\Factories;

use App\Models\Part;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Part>
 */
class PartFactory extends Factory
{
    public function definition(): array
    {
        return [
            'part_num' => fake()->unique()->numerify('####'),
            'name' => fake()->words(3, true),
            'category' => fake()->word(),
            'image_url' => fake()->optional()->url(),
        ];
    }
}
