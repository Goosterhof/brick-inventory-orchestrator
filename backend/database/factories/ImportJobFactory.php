<?php

declare(strict_types = 1);

namespace Database\Factories;

use App\Enums\ImportJobStatus;
use App\Models\Family;
use App\Models\ImportJob;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ImportJob>
 */
class ImportJobFactory extends Factory
{
    public function definition(): array
    {
        return [
            'family_id' => Family::factory(),
            'status' => ImportJobStatus::Pending,
            'total_sets' => 0,
            'processed_sets' => 0,
            'failed_sets' => 0,
            'failed_set_details' => null,
            'started_at' => null,
            'completed_at' => null,
        ];
    }

    public function forFamily(Family $family): static
    {
        return $this->state(fn(array $attributes): array => [
            'family_id' => $family->id,
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn(array $attributes): array => [
            'status' => ImportJobStatus::InProgress,
            'started_at' => now(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn(array $attributes): array => [
            'status' => ImportJobStatus::Completed,
            'started_at' => now()->subMinutes(5),
            'completed_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn(array $attributes): array => [
            'status' => ImportJobStatus::Failed,
            'started_at' => now()->subMinutes(5),
            'completed_at' => now(),
        ]);
    }
}
