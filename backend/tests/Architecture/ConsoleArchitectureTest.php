<?php

declare(strict_types = 1);

use Illuminate\Console\Command;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Console Architecture
|--------------------------------------------------------------------------
|
| Console command classes are entry points for scheduled and operator-only
| flows. They mirror Controller hygiene rules — thin, no business logic,
| delegate to Actions:
| - Are final
| - End with "Command"
| - Extend Illuminate\Console\Command
| - Do NOT depend on Request (commands are not HTTP)
| - Do NOT use facades (DI or nothing — same rule as Actions)
| - Do NOT use try-catch (exception handling propagates to the framework)
|
 */

arch('console commands should end with Command')
    ->expect('App\Console\Commands')
    ->toHaveSuffix('Command');

arch('console commands should not depend on Request')
    ->expect('App\Console')
    ->not->toUse(Request::class);

arch('console commands should not use facades')
    ->expect('App\Console')
    ->not->toUse('Illuminate\Support\Facades');

it('should have all console command classes as final', function(): void {
    $commandsChecked = 0;
    $nonFinal = [];

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Console/Commands', 'App\Console\Commands\\') as $className) {
        $reflection = new \ReflectionClass($className);

        if ($reflection->isAbstract()) {
            continue;
        }

        $commandsChecked++;

        if (!$reflection->isFinal()) {
            $nonFinal[] = $className;
        }
    }

    expect($commandsChecked)->toBeGreaterThan(0, 'Expected at least one console command class');
    expect($nonFinal)->toBeEmpty(
        'These console commands are not final: ' . implode(', ', $nonFinal),
    );
});

it('should have all console command classes extend Illuminate Console Command', function(): void {
    $commandsChecked = 0;

    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Console/Commands', 'App\Console\Commands\\') as $className) {
        $reflection = new \ReflectionClass($className);

        if ($reflection->isAbstract()) {
            continue;
        }

        $commandsChecked++;

        expect(is_subclass_of($className, Command::class))->toBeTrue(
            \sprintf('Console command %s should extend %s', $className, Command::class),
        );
    }

    expect($commandsChecked)->toBeGreaterThan(0);
});

it('should not use try-catch blocks in console commands', function(): void {
    $commandsDir = \dirname(__DIR__, 2) . '/app/Console';

    if (!is_dir($commandsDir)) {
        return;
    }

    $filesChecked = 0;

    $iterator = new \RecursiveIteratorIterator(
        new \RecursiveDirectoryIterator($commandsDir, \RecursiveDirectoryIterator::SKIP_DOTS),
    );

    foreach ($iterator as $file) {
        if (!$file->isFile()) {
            continue;
        }

        if ($file->getExtension() !== 'php') {
            continue;
        }

        $filesChecked++;
        $content = file_get_contents($file->getPathname());
        $tokens = token_get_all($content);
        $relativePath = str_replace($commandsDir . '/', '', $file->getPathname());

        foreach ($tokens as $token) {
            if (\is_array($token) && $token[0] === \T_TRY) {
                expect(false)->toBeTrue(
                    \sprintf(
                        'Console class %s should not use try-catch blocks. Exception handling propagates to the framework.',
                        $relativePath,
                    ),
                );
            }
        }
    }

    expect($filesChecked)->toBeGreaterThan(0);
});

it('should have handle method on all console commands', function(): void {
    foreach (getClassesInDirectory(\dirname(__DIR__, 2) . '/app/Console/Commands', 'App\Console\Commands\\') as $className) {
        $reflection = new \ReflectionClass($className);

        if ($reflection->isAbstract()) {
            continue;
        }

        expect($reflection->hasMethod('handle'))->toBeTrue(
            \sprintf('Console command %s must declare a handle() method', $className),
        );

        $method = $reflection->getMethod('handle');

        expect($method->getDeclaringClass()->getName())->toBe(
            $className,
            \sprintf('Console command %s must declare its own handle() method (not inherited)', $className),
        );
    }
});
