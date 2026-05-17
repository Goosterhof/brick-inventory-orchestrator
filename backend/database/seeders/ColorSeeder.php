<?php

declare(strict_types = 1);

namespace Database\Seeders;

use App\Models\Color;
use Illuminate\Database\Seeder;

class ColorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $records = [
            // TODO: Replace with real LEGO color data from Rebrickable
            ['rebrickable_id' => 0, 'name' => 'Black', 'rgb' => '05131D', 'is_transparent' => false],
            ['rebrickable_id' => 1, 'name' => 'Blue', 'rgb' => '0055BF', 'is_transparent' => false],
            ['rebrickable_id' => 2, 'name' => 'Green', 'rgb' => '237841', 'is_transparent' => false],
            ['rebrickable_id' => 3, 'name' => 'Dark Turquoise', 'rgb' => '008F9B', 'is_transparent' => false],
            ['rebrickable_id' => 4, 'name' => 'Red', 'rgb' => 'C91A09', 'is_transparent' => false],
            ['rebrickable_id' => 5, 'name' => 'Dark Pink', 'rgb' => 'C870A0', 'is_transparent' => false],
            ['rebrickable_id' => 6, 'name' => 'Brown', 'rgb' => '583927', 'is_transparent' => false],
            ['rebrickable_id' => 7, 'name' => 'Light Gray', 'rgb' => '9BA19D', 'is_transparent' => false],
            ['rebrickable_id' => 8, 'name' => 'Dark Gray', 'rgb' => '6D6E5C', 'is_transparent' => false],
            ['rebrickable_id' => 9, 'name' => 'Light Blue', 'rgb' => 'B4D2E3', 'is_transparent' => false],
        ];

        foreach ($records as $record) {
            $color = new Color;
            $color->rebrickable_id = $record['rebrickable_id'];
            $color->name = $record['name'];
            $color->rgb = $record['rgb'];
            $color->is_transparent = $record['is_transparent'];
            $color->save();
        }
    }
}
