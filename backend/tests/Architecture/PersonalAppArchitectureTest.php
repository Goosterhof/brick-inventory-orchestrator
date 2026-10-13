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
|   4. No file in app/ creates a Family outside a named allowlist. Eloquent User inserts are
|      refused at runtime unless the provisioning permit is open (WR-2128); the raw paths that
|      bypass Eloquent are caught by name: no string outside an allowlist names the users or
|      families table.
|   5. No routes/*.php file reads the environment or config.
|   6. Only the classes that make up the WR-2128 guard may use the provisioning permit.
|
 */

uses(TestCase::class);

// A base query builder is past ProvisioningGuardedBuilder, whatever model it came from, and names
// no table the string-literal scan below could see.
$baseQueryInsertPattern = '/->\s*(?:toBase|getQuery)\(\)\s*->\s*(?:insert\w*|upsert)\s*\(/i';

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

it('should create families and insert past the guarded builder only in allowlisted classes', function() use ($baseQueryInsertPattern): void {
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
        $baseQueryInsertPattern,
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
        'Family creation or a base-query insert found outside the allowlist (WR-2118, WR-2128):',
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

it('should name the users and families tables only where the allowlist says', function(): void {
    // Raw writes never reach Eloquent, so the runtime guard cannot see them, and every way of
    // spelling one (table(), from(), an alias, a schema prefix, raw SQL) carries the table name in
    // a string. So this scans for the name, not the call: every string literal or heredoc that
    // contains the word users or families must appear below, file by file, exactly as often as it
    // does now. A new one fails until the owner adds it here.
    $allowlist = [
        // A relation name in cascadeRelations(), not a table.
        'app/Models/Family.php' => ['users'],
        // A Rebrickable API path.
        'app/Services/RebrickableService.php' => ['/users/%s/sets/'],
        // The auth provider's name.
        'config/auth.php' => ['users', 'users', 'users', 'users', 'users'],
        // Schema changes and foreign keys; the one statement is the head_id backfill (an UPDATE).
        'database/migrations/0001_01_01_000000_create_users_table.php' => ['users', 'users'],
        'database/migrations/2026_01_20_000001_create_families_table.php' => ['families', 'families'],
        'database/migrations/2026_01_20_000002_add_family_id_to_users_table.php' => ['users', 'users'],
        'database/migrations/2026_01_29_123056_add_rebrickable_user_token_to_families_table.php' => ['families', 'families'],
        'database/migrations/2026_02_02_000001_add_head_id_to_families_table.php' => [
            'UPDATE families SET head_id = ( SELECT id FROM users WHERE users.family_id = families.id ORDER BY id LIMIT 1 ) WHERE head_id IS NULL',
            'families',
            'families',
            'users',
        ],
        'database/migrations/2026_03_25_000001_create_invite_codes_table.php' => ['families', 'users'],
        'database/migrations/2026_03_28_000001_create_import_jobs_table.php' => ['families'],
        'database/migrations/2026_10_10_000001_drop_invite_codes_table.php' => ['families', 'users'],
    ];

    $root = \dirname(__DIR__, 2);
    $files = [];

    foreach (['app', 'bootstrap', 'config', 'database', 'routes'] as $directory) {
        $files = [...$files, ...ArchTestHelper::phpFilesIn($root . '/' . $directory)];
    }

    $files = array_filter($files, fn(string $file): bool => !str_contains($file, '/bootstrap/cache/'));

    expect($files)->not->toBeEmpty('No PHP files found — the scan is broken.');

    $found = [];

    foreach ($files as $file) {
        foreach (token_get_all((string) file_get_contents($file)) as $token) {
            if (!\is_array($token) || !\in_array($token[0], [\T_CONSTANT_ENCAPSED_STRING, \T_ENCAPSED_AND_WHITESPACE], strict: true)) {
                continue;
            }

            if (preg_match('/\b(?:users|families)\b/i', $token[1]) !== 1) {
                continue;
            }

            $literal = $token[0] === \T_CONSTANT_ENCAPSED_STRING ? mb_substr($token[1], 1, -1) : $token[1];
            $found[str_replace($root . '/', '', $file)][] = mb_trim((string) preg_replace('/\s+/', ' ', $literal));
        }
    }

    expect($found)->not->toBeEmpty('No string names users or families — the scan is broken (the create-table migrations must match).');

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
        'A string names the users or families table outside the allowlist; a raw write there bypasses the runtime guard (WR-2128):',
        $violations,
    ));
});

it('should keep migrations, seeders and factories away from accounts', function() use ($baseQueryInsertPattern): void {
    $databasePath = \dirname(__DIR__, 2) . '/database';
    $migrations = ArchTestHelper::phpFilesIn($databasePath . '/migrations');
    $files = [...$migrations, ...ArchTestHelper::phpFilesIn($databasePath . '/seeders'), ...ArchTestHelper::phpFilesIn($databasePath . '/factories')];

    expect($migrations)->not->toBeEmpty('No migrations found under database/migrations — the scan is broken.');

    // Every web boot runs migrate --force (bin/start.sh), so a migration may not touch accounts at all.
    $migrationPatterns = [
        '/\bAccountProvisioningPermit\b/',
        '/\bApp\\\Models\\\(?:User|Family)\b/',
        '/\b(?:User|Family)::/',
        '/Database\\\Seeders|db:seed/',
    ];

    $violations = [];

    foreach ($files as $file) {
        $content = (string) file_get_contents($file);
        $patterns = \in_array($file, $migrations, strict: true) ? $migrationPatterns : [$baseQueryInsertPattern];

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
