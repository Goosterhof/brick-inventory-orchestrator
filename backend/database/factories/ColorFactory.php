<?php

declare(strict_types = 1);

namespace Database\Factories;

use App\Models\Color;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Color>
 */
class ColorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'rebrickable_id' => fake()->unique()->randomNumber(4),
            'name' => fake()->colorName(),
            // `colors.rgb` is varchar(6) and the seeder writes the hex digits
            // without the leading `#` (e.g. '0055BF'). Faker's hexColor()
            // includes the `#`, which overflows the column.
            'rgb' => mb_substr(fake()->hexColor(), 1),
            'is_transparent' => fake()->boolean(20),
        ];
    }
}
