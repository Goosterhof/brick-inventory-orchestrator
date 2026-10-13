<?php

declare(strict_types = 1);

use App\Actions\Auth\CreateAccountAction;
use App\Auth\AccountProvisioningPermit;
use App\Auth\AccountTableWriteGuard;
use App\Auth\CloseAccountProvisioningPermit;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Auth\MustVerifyEmail;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Contracts\Auth\PasswordBroker;
use Illuminate\Contracts\Auth\PasswordBrokerFactory;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Route as RouteFacade;
use Pdo\Mysql;
use Tests\Architecture\Support\ArchTestHelper;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Personal App Architecture (WR-2118)
|--------------------------------------------------------------------------
|
| BIO admits nobody: no HTTP route may create a User or Family, and the
| application holds no mail capability. Checks:
|   1. The set of routes without auth:sanctum equals a literal allowlist.
|   2. No App\ class depends on Laravel's mail, notification or password-reset
|      classes, or on Symfony Mailer / Resend.
|   3. The one creation Action, and the Artisan/Process entry points that could
|      invoke it, are used by console commands only.
|   4. An INSERT into users or families is refused at the database connection unless the
|      provisioning permit is open (WR-2128, AccountTableWriteGuard); no code reaches the
|      database through a raw PDO handle, which would skip that guard.
|   5. No routes/*.php file reads the environment or config.
|   6. Only the account creation action, DatabaseSeeder and the guard's own classes may use the
|      provisioning permit.
|
 */

uses(TestCase::class);

it('should expose exactly the allowlisted routes without auth:sanctum', function(): void {
    $allowlist = [
        'GET api',
        'GET api/health',
        'POST api/login',
        'GET docs/api',
        'GET docs/api.json',
        'GET sanctum/csrf-cookie',
        'GET up',
        'GET {fallbackPlaceholder}',
    ];

    $routes = RouteFacade::getRoutes()->getRoutes();

    expect($routes)->not->toBeEmpty('No routes were registered — the route enumeration is broken.');

    $unauthenticated = [];

    foreach ($routes as $route) {
        /** @var Route $route */
        if (\in_array('auth:sanctum', $route->gatherMiddleware(), strict: true)) {
            continue;
        }

        foreach (array_diff($route->methods(), ['HEAD']) as $method) {
            $unauthenticated[] = $method . ' ' . $route->uri();
        }
    }

    sort($unauthenticated);
    sort($allowlist);

    expect($unauthenticated)->not->toBeEmpty('No unauthenticated routes found — the filter is broken (api/login must be public).');
    expect($unauthenticated)->toBe(
        $allowlist,
        'The set of routes without auth:sanctum changed. BIO is a personal app (WR-2118): '
        . 'a new public route is a new way in. Unexpected: ' . implode(', ', array_diff($unauthenticated, $allowlist))
        . ' | Missing: ' . implode(', ', array_diff($allowlist, $unauthenticated)),
    );
});

arch('application classes should not use mail or notifications')
    ->expect('App')
    ->not->toUse([
        'Illuminate\Contracts\Mail',
        'Illuminate\Mail',
        Mail::class,
        'Illuminate\Contracts\Notifications',
        'Illuminate\Notifications',
        Notification::class,
        'Illuminate\Auth\Notifications',
        'Illuminate\Auth\Passwords',
        MustVerifyEmail::class,
        \Illuminate\Contracts\Auth\MustVerifyEmail::class,
        CanResetPassword::class,
        PasswordBroker::class,
        PasswordBrokerFactory::class,
        Password::class,
        'Symfony\Component\Mailer',
        'Resend',
    ]);

arch('the account creation action should only be used by console commands')
    ->expect(CreateAccountAction::class)
    ->toOnlyBeUsedIn('App\Console');

arch('artisan and process entry points should only be used by console commands')
    ->expect('App')
    ->not->toUse([
        Artisan::class,
        Kernel::class,
        \Illuminate\Foundation\Console\Kernel::class,
        Process::class,
        'Illuminate\Process',
        'Symfony\Component\Process',
    ])
    ->ignoring('App\Console');

arch('the provisioning permit should only be used by the WR-2128 guard and the account creation action')
    ->expect(AccountProvisioningPermit::class)
    ->toOnlyBeUsedIn([
        CreateAccountAction::class,
        AccountTableWriteGuard::class,
        CloseAccountProvisioningPermit::class,
        DatabaseSeeder::class,
    ]);

arch('application classes should not use seeders')
    ->expect('App')
    ->not->toUse('Database\Seeders');

it('should keep the provisioning permit out of migrations, and out of seeders and factories but DatabaseSeeder', function(): void {
    $databasePath = \dirname(__DIR__, 2) . '/database';
    $files = [
        ...ArchTestHelper::phpFilesIn($databasePath . '/migrations'),
        ...ArchTestHelper::phpFilesIn($databasePath . '/seeders'),
        ...ArchTestHelper::phpFilesIn($databasePath . '/factories'),
    ];

    expect($files)->not->toBeEmpty('No PHP files found under database/ — the scan is broken.');

    $violations = [];

    foreach ($files as $file) {
        if (basename($file) !== 'DatabaseSeeder.php' && preg_match('/\bAccountProvisioningPermit\b/', (string) file_get_contents($file)) === 1) {
            $violations[] = str_replace($databasePath . '/', '', $file);
        }
    }

    expect($violations)->toBeEmpty(ArchTestHelper::formatViolations(
        'Only DatabaseSeeder may open the provisioning permit under database/ (WR-2128):',
        $violations,
    ));
});

it('should reach the database only through a guarded connection, never a raw PDO handle', function(): void {
    // AccountTableWriteGuard sits on Connection::run(); a PDO handle runs SQL without it. Every
    // identifier naming PDO must appear below, file by file, exactly as often as it does now.
    $allowlist = [
        // The resolver hands the factory's PDO (or its lazy closure) to the guarded connection.
        'app/Auth/AccountTableWriteGuard.php' => [\PDO::class, \PDO::class],
        // Driver option constants (Pdo\Mysql::ATTR_SSL_CA), no handle.
        'config/database.php' => [Mysql::class],
    ];

    $root = \dirname(__DIR__, 2);
    $files = [];

    foreach (['app', 'bootstrap', 'config', 'database', 'routes'] as $directory) {
        $files = [...$files, ...ArchTestHelper::phpFilesIn($root . '/' . $directory)];
    }

    $files = array_filter($files, fn(string $file): bool => !str_contains($file, '/bootstrap/cache/'));

    expect($files)->not->toBeEmpty('No PHP files found — the scan is broken.');

    $identifiers = [\T_STRING, \T_NAME_QUALIFIED, \T_NAME_FULLY_QUALIFIED, \T_NAME_RELATIVE];
    $found = [];

    foreach ($files as $file) {
        foreach (token_get_all((string) file_get_contents($file)) as $token) {
            if (\is_array($token) && \in_array($token[0], $identifiers, strict: true) && mb_stripos($token[1], 'pdo') !== false) {
                $found[str_replace($root . '/', '', $file)][] = $token[1];
            }
        }
    }

    expect($found)->not->toBeEmpty('No PDO identifier found — the scan is broken (the guard itself names PDO).');

    $violations = [];

    foreach (array_unique([...array_keys($found), ...array_keys($allowlist)]) as $path) {
        $actual = $found[$path] ?? [];
        $expected = $allowlist[$path] ?? [];
        sort($actual);
        sort($expected);

        if ($actual !== $expected) {
            $violations[] = $path . ': found [' . implode(' | ', $actual) . '], allowlisted [' . implode(' | ', $expected) . ']';
        }
    }

    expect($violations)->toBeEmpty(ArchTestHelper::formatViolations(
        'A PDO identifier outside the allowlist; SQL run on a raw handle skips the account-table guard (WR-2128):',
        $violations,
    ));
});

it('should keep the provisioning permit out of routes, bootstrap and config, and open() in tests only', function(): void {
    $root = \dirname(__DIR__, 2);
    $files = [];

    foreach (['app', 'bootstrap', 'config', 'database', 'routes'] as $directory) {
        $files = [...$files, ...ArchTestHelper::phpFilesIn($root . '/' . $directory)];
    }

    expect($files)->not->toBeEmpty('No PHP files found — the scan is broken.');

    $violations = [];

    foreach ($files as $file) {
        $path = str_replace($root . '/', '', $file);
        $content = (string) file_get_contents($file);

        if (preg_match('/AccountProvisioningPermit::open\s*\(/', $content) === 1) {
            $violations[] = $path . ': calls open()';
        }

        // Closures here are not classes, so toOnlyBeUsedIn cannot see them.
        if (preg_match('#^(?:bootstrap|config|routes)/#', $path) === 1 && preg_match('/\bAccountProvisioningPermit\b/', $content) === 1) {
            $violations[] = $path . ': references the permit';
        }
    }

    expect($violations)->toBeEmpty(ArchTestHelper::formatViolations(
        'The provisioning permit is held only by its named classes, and open() is for tests/ only (WR-2128):',
        $violations,
    ));
});

it('should register routes unconditionally', function(): void {
    $routeFiles = glob(\dirname(__DIR__, 2) . '/routes/*.php');

    expect($routeFiles)->not->toBeEmpty('No route files found under routes/ — the scan is broken.');

    $conditional = '/\b(?:environment|isLocal|isProduction|runningUnitTests|runningInConsole|config|env)\s*\(|\b(?:Config|Env)::/';

    $violations = [];

    foreach ((array) $routeFiles as $routeFile) {
        if (preg_match_all($conditional, (string) file_get_contents((string) $routeFile), $matches) > 0) {
            $violations[] = basename((string) $routeFile) . ': ' . implode(', ', array_unique($matches[0]));
        }
    }

    expect($violations)->toBeEmpty(ArchTestHelper::formatViolations(
        'A route file reads the environment or config; a route registered only outside the testing env is invisible to the allowlist (WR-2118):',
        $violations,
    ));
});
