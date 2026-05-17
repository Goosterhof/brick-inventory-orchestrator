<?php

declare(strict_types = 1);

namespace Database\Factories;

use App\Models\Family;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /** The current password being used by the factory. */
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'family_id' => Family::factory(),
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure(): static
    {
        return $this->afterCreating(function(User $user): void {
            // Set the user as family head if no head is set yet
            if ($user->family->head_id === null) {
                /** @var positive-int $userId */
                $userId = $user->id;
                $user->family->head_id = $userId;
                $user->family->save();
            }
        });
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn(array $attributes): array => [
            'email_verified_at' => null,
        ]);
    }

    public function forFamily(Family $family): static
    {
        return $this->state(fn(array $attributes): array => [
            'family_id' => $family->id,
        ]);
    }
}
