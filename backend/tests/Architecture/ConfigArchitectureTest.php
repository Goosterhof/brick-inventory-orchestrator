<?php

declare(strict_types = 1);

use Illuminate\Support\Facades\Config;

arch('application classes must not use config() helper')
    ->expect('App')
    ->not->toUse('config')
    ->ignoring('App\Providers');

arch('application classes must not use Config facade')
    ->expect('App')
    ->not->toUse(Config::class)
    ->ignoring('App\Providers');

test('every env() key referenced in config/ is declared in .env.example', function(): void {
    $projectRoot = \dirname(__DIR__, 2);
    $configFiles = glob($projectRoot . '/config/*.php');
    $envExample = file_get_contents($projectRoot . '/.env.example');

    expect($configFiles)->not->toBeEmpty();
    expect($envExample)->not->toBeFalse();

    $referenced = [];
    foreach ($configFiles as $configFile) {
        $contents = file_get_contents($configFile);
        preg_match_all('/env\([\'"]([A-Z_][A-Z0-9_]*)[\'"]/', $contents, $matches);
        $referenced = array_merge($referenced, $matches[1]);
    }

    $referenced = array_values(array_unique($referenced));

    $missing = array_filter(
        $referenced,
        static fn(string $key): bool => preg_match(
            '/^(# )?' . preg_quote($key, '/') . '=/m',
            $envExample,
        ) !== 1,
    );

    expect(array_values($missing))->toBe([], \sprintf(
        'env() keys referenced in config/ but missing from .env.example: %s. '
        . 'Add them (active or commented) so fresh deployers can discover required configuration. '
        . 'See war-room enforcement queue #20.',
        implode(', ', $missing),
    ));
});
