<?php

declare(strict_types = 1);

use App\Actions\Auth\CreateAccountAction;
use App\Auth\AccountProvisioningPermit;
use App\Auth\CloseAccountProvisioningPermit;
use App\Auth\ProvisioningGuardedBuilder;
use App\Models\User;
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
|   4. No file in app/ creates a Family outside a named allowlist, and no file writes the
|      users or families table through a raw query. Eloquent User inserts are refused at
|      runtime unless the provisioning permit is open (WR-2128); this scan covers only the
|      paths that bypass Eloquent, which the runtime guard cannot see.
|   5. No routes/*.php file reads the environment or config.
|   6. Only the classes that make up the WR-2128 guard may use the provisioning permit.
|
 */

uses(TestCase::class);

// Writes that never pass through Eloquent, so the runtime guard (WR-2128) cannot see them.
$rawWritePatterns = [
    '/(?:->|::)\s*table\(\s*[\'"](?:users|families)[\'"]\s*\)/',
    '/\binsert\s+(?:ignore\s+)?into\s+[`"\']?(?:users|families)\b/i',
    // A base query builder is past ProvisioningGuardedBuilder, whatever model it came from.
    '/->\s*(?:toBase|getQuery)\(\)\s*->\s*(?:insert\w*|upsert)\s*\(/i',
];

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

it('should create families and write the users table only in allowlisted classes', function() use ($rawWritePatterns): void {
    $allowlist = [
        // Console-only: the operator's shell is the one way to provision an account.
        CreateAccountAction::class,
        // Refuses its own base-query inserts unless the permit is open.
        ProvisioningGuardedBuilder::class,
    ];

    $appPath = \dirname(__DIR__, 2) . '/app';
    $files = ArchTestHelper::phpFilesIn($appPath);

    expect($files)->not->toBeEmpty('No PHP files found under app/ — the scan is broken.');

    $creationCall = '(?:newInstance|newModelInstance|create|forceCreate|createQuietly|firstOrCreate|firstOrNew|updateOrCreate|createOrFirst|insert|insertGetId|insertOrIgnore|upsert)';

    $staticPatterns = [
        '/\bFamily::(?:query\(\)\s*->\s*)?' . $creationCall . '\s*\(/',
        '/\bnew\s+\\\?(?:App\\\Models\\\)?Family\b/',
        '/\bFamily::factory\(/',
        ...$rawWritePatterns,
    ];

    $violations = [];

    foreach ($files as $file) {
        $className = ArchTestHelper::resolveClassName($file, $appPath, 'App');

        if (\in_array($className, $allowlist, strict: true)) {
            continue;
        }

        $content = (string) file_get_contents($file);
        $patterns = $staticPatterns;

        preg_match_all('/\b(?:private|protected|public)\s+(?:readonly\s+)?\\\?(?:App\\\Models\\\)?Family\s+\$(\w+)/', $content, $matches);

        foreach ($matches[1] as $property) {
            $patterns[] = '/\$this->' . $property . '\b[^;]*?->\s*' . $creationCall . '\s*\(/s';
        }

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $content) === 1) {
                $violations[] = $className . ' matches ' . $pattern;
            }
        }
    }

    expect($violations)->toBeEmpty(ArchTestHelper::formatViolations(
        'Family creation or a raw users/families write found outside the allowlist (WR-2118, WR-2128):',
        $violations,
    ));
});

arch('the provisioning permit should only be used by the WR-2128 guard and the account creation action')
    ->expect(AccountProvisioningPermit::class)
    ->toOnlyBeUsedIn([
        CreateAccountAction::class,
        User::class,
        ProvisioningGuardedBuilder::class,
        CloseAccountProvisioningPermit::class,
        DatabaseSeeder::class,
    ]);

arch('application classes should not use seeders')
    ->expect('App')
    ->not->toUse('Database\Seeders');

it('should keep migrations, seeders and factories off the users and families tables', function() use ($rawWritePatterns): void {
    $databasePath = \dirname(__DIR__, 2) . '/database';
    $migrations = ArchTestHelper::phpFilesIn($databasePath . '/migrations');
    $files = [...$migrations, ...ArchTestHelper::phpFilesIn($databasePath . '/seeders'), ...ArchTestHelper::phpFilesIn($databasePath . '/factories')];

    expect($migrations)->not->toBeEmpty('No migrations found under database/migrations — the scan is broken.');

    // Every web boot runs migrate --force (bin/start.sh), so a migration may not touch accounts at all.
    $migrationPatterns = [
        ...$rawWritePatterns,
        '/\bAccountProvisioningPermit\b/',
        '/\bApp\\\Models\\\(?:User|Family)\b/',
        '/\b(?:User|Family)::/',
        '/Database\\\Seeders|db:seed/',
    ];

    $violations = [];

    foreach ($files as $file) {
        $content = (string) file_get_contents($file);
        $patterns = \in_array($file, $migrations, strict: true) ? $migrationPatterns : $rawWritePatterns;

        if (basename($file) !== 'DatabaseSeeder.php' && !\in_array($file, $migrations, strict: true)) {
            $patterns[] = '/\bAccountProvisioningPermit\b/';
        }

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $content) === 1) {
                $violations[] = basename($file) . ' matches ' . $pattern;
            }
        }
    }

    expect($violations)->toBeEmpty(ArchTestHelper::formatViolations(
        'A migration, seeder or factory writes accounts outside the provisioning permit (WR-2128):',
        $violations,
    ));
});

it('should open the provisioning permit only from the test harness', function(): void {
    $root = \dirname(__DIR__, 2);
    $files = [];

    foreach (['app', 'bootstrap', 'config', 'database', 'routes'] as $directory) {
        $files = [...$files, ...ArchTestHelper::phpFilesIn($root . '/' . $directory)];
    }

    expect($files)->not->toBeEmpty('No PHP files found — the scan is broken.');

    $violations = [];

    foreach ($files as $file) {
        if (preg_match('/AccountProvisioningPermit::open\s*\(/', (string) file_get_contents($file)) === 1) {
            $violations[] = str_replace($root . '/', '', $file);
        }
    }

    expect($violations)->toBeEmpty(ArchTestHelper::formatViolations(
        'AccountProvisioningPermit::open() is for tests/ only; application code opens the permit through during(), which closes it again (WR-2128):',
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
