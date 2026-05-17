<?php

declare(strict_types = 1);

namespace Database\Seeders;

use App\Models\Family;
use App\Models\FamilySet;
use Illuminate\Database\Seeder;

class FamilySetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(Family $family): void
    {
        FamilySet::factory()
            ->count(50)
            ->create(['family_id' => $family->id]);
    }
}
