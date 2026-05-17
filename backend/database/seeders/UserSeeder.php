<?php

declare(strict_types = 1);

namespace Database\Seeders;

use App\Models\Family;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(Family $family): void
    {
        User::factory()
            ->count(50)
            ->create(['family_id' => $family->id]);
    }
}
