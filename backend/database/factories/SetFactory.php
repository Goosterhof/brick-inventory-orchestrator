<?php

declare(strict_types = 1);

namespace Database\Factories;

use App\Enums\SetSyncStatus;
use App\Models\Set;
use App\Models\Theme;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Set>
 */
class SetFactory extends Factory
{
    public function definition(): array
    {
        return [
            'set_num' => fake()->unique()->numerify('#####-1'),
            'name' => fake()->words(3, true),
            'year' => fake()->year(),
            'theme_id' => null,
            'num_parts' => fake()->numberBetween(100, 5_000),
            'image_url' => fake()->optional()->imageUrl(),
            'parts_sync_status' => SetSyncStatus::Completed,
            'parts_synced_at' => now(),
            'parts_sync_failed_reason' => null,
        ];
    }

    /**
     * Attach a freshly-created Theme to this Set.
     *
     * Default factory state leaves theme_id null to keep the bulk of tests
     * fast — only the small subset that actually exercises the theme
     * relationship needs a Theme row.
     */
    public function withTheme(?Theme $theme = null): self
    {
        return $this->state(fn(): array => [
            'theme_id' => ($theme ?? Theme::factory()->create())->id,
        ]);
    }
}
