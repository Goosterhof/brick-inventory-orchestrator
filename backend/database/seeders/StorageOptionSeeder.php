<?php

declare(strict_types = 1);

namespace Database\Seeders;

use App\Models\Family;
use App\Models\StorageOption;
use Illuminate\Database\Seeder;

class StorageOptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(Family $family): void
    {
        StorageOption::factory()
            ->count(50)
            ->create(['family_id' => $family->id]);
    }
}
