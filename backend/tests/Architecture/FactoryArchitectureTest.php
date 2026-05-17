<?php

declare(strict_types = 1);

use Illuminate\Database\Eloquent\Factories\Factory;

arch('factories should end with Factory')
    ->expect('Database\Factories')
    ->toHaveSuffix('Factory');

arch('factories should extend Eloquent Factory')
    ->expect('Database\Factories')
    ->toExtend(Factory::class);
