<?php

declare(strict_types = 1);

namespace Database\Seeders;

use App\Models\StorageOptionPart;
use Illuminate\Database\Seeder;

class StorageOptionPartSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        StorageOptionPart::factory()
            ->count(50)
            ->create();
    }
}
