<?php

declare(strict_types = 1);

arch('contracts should be interfaces')
    ->expect('App\Contracts')
    ->toBeInterfaces();

arch('contracts should end with Interface')
    ->expect('App\Contracts')
    ->toHaveSuffix('Interface');
