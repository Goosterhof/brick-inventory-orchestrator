<?php

declare(strict_types = 1);

namespace Database\Factories;

use App\Models\Family;
use App\Models\InviteCode;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InviteCode>
 */
class InviteCodeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'family_id' => Family::factory(),
            'code' => 'BRICK-' . mb_strtoupper(fake()->bothify('??##')),
            'generated_by' => User::factory(),
            'expires_at' => now()->addDays(7),
            'revoked_at' => null,
        ];
    }

    public function expired(): static
    {
        return $this->state(fn(array $attributes): array => [
            'expires_at' => now()->subDay(),
        ]);
    }

    public function revoked(): static
    {
        return $this->state(fn(array $attributes): array => [
            'revoked_at' => now(),
        ]);
    }

    public function noExpiry(): static
    {
        return $this->state(fn(array $attributes): array => [
            'expires_at' => null,
        ]);
    }

    public function forFamily(Family $family): static
    {
        return $this->state(fn(array $attributes): array => [
            'family_id' => $family->id,
        ]);
    }

    public function generatedBy(User $user): static
    {
        return $this->state(fn(array $attributes): array => [
            'generated_by' => $user->id,
        ]);
    }
}
