<?php

declare(strict_types = 1);

namespace Database\Seeders;

use App\Models\Set;
use Illuminate\Database\Seeder;

class SetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Theme assignment is intentionally null — production runs `themes:sync`
     * (the Artisan command) to populate the `themes` catalog from Rebrickable,
     * and `UpsertSetAction` resolves `theme_id` on the next set fetch. Local
     * dev that wants populated themes can run `php artisan themes:sync` after
     * seeding (requires a real Rebrickable API key).
     */
    public function run(): void
    {
        $records = [
            ['set_num' => '10297-1', 'name' => 'Boutique Hotel', 'year' => 2_022, 'num_parts' => 3_066, 'image_url' => null],
            ['set_num' => '10305-1', 'name' => "Lion Knights' Castle", 'year' => 2_022, 'num_parts' => 4_514, 'image_url' => null],
            ['set_num' => '10312-1', 'name' => 'Jazz Club', 'year' => 2_023, 'num_parts' => 2_899, 'image_url' => null],
            ['set_num' => '75192-1', 'name' => 'Millennium Falcon', 'year' => 2_017, 'num_parts' => 7_541, 'image_url' => null],
            ['set_num' => '42151-1', 'name' => 'Bugatti Bolide', 'year' => 2_023, 'num_parts' => 905, 'image_url' => null],
            ['set_num' => '21054-1', 'name' => 'The White House', 'year' => 2_020, 'num_parts' => 1_483, 'image_url' => null],
            ['set_num' => '71411-1', 'name' => 'The Mighty Bowser', 'year' => 2_022, 'num_parts' => 2_807, 'image_url' => null],
            ['set_num' => '10294-1', 'name' => 'Titanic', 'year' => 2_021, 'num_parts' => 9_090, 'image_url' => null],
            ['set_num' => '10311-1', 'name' => 'Orchid', 'year' => 2_022, 'num_parts' => 608, 'image_url' => null],
            ['set_num' => '21330-1', 'name' => 'Home Alone', 'year' => 2_021, 'num_parts' => 3_957, 'image_url' => null],
        ];

        foreach ($records as $record) {
            $set = new Set;
            $set->set_num = $record['set_num'];
            $set->name = $record['name'];
            $set->year = $record['year'];
            $set->theme_id = null;
            $set->num_parts = $record['num_parts'];
            $set->image_url = $record['image_url'];
            $set->save();
        }
    }
}
