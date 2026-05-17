<?php

declare(strict_types = 1);

namespace Database\Seeders;

use App\Models\Part;
use Illuminate\Database\Seeder;

class PartSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $records = [
            // TODO: Replace with real LEGO part data from Rebrickable
            ['part_num' => '3001', 'name' => 'Brick 2 x 4', 'category' => 'Bricks', 'image_url' => null],
            ['part_num' => '3002', 'name' => 'Brick 2 x 3', 'category' => 'Bricks', 'image_url' => null],
            ['part_num' => '3003', 'name' => 'Brick 2 x 2', 'category' => 'Bricks', 'image_url' => null],
            ['part_num' => '3004', 'name' => 'Brick 1 x 2', 'category' => 'Bricks', 'image_url' => null],
            ['part_num' => '3005', 'name' => 'Brick 1 x 1', 'category' => 'Bricks', 'image_url' => null],
            ['part_num' => '3020', 'name' => 'Plate 2 x 4', 'category' => 'Plates', 'image_url' => null],
            ['part_num' => '3021', 'name' => 'Plate 2 x 3', 'category' => 'Plates', 'image_url' => null],
            ['part_num' => '3022', 'name' => 'Plate 2 x 2', 'category' => 'Plates', 'image_url' => null],
            ['part_num' => '3023', 'name' => 'Plate 1 x 2', 'category' => 'Plates', 'image_url' => null],
            ['part_num' => '3024', 'name' => 'Plate 1 x 1', 'category' => 'Plates', 'image_url' => null],
        ];

        foreach ($records as $record) {
            $part = new Part;
            $part->part_num = $record['part_num'];
            $part->name = $record['name'];
            $part->category = $record['category'];
            $part->image_url = $record['image_url'];
            $part->save();
        }
    }
}
