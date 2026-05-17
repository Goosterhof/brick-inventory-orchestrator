<?php

declare(strict_types = 1);

namespace Database\Factories;

use App\Models\Theme;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Theme>
 */
class ThemeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'rebrickable_id' => fake()->unique()->randomNumber(4),
            'name' => fake()->words(2, true),
            'parent_id' => null,
        ];
    }
}
