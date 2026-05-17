<?php

declare(strict_types = 1);

namespace Database\Seeders;

use App\Models\Family;
use Illuminate\Database\Seeder;

class FamilySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Family::factory()
            ->count(50)
            ->create();
    }
}
