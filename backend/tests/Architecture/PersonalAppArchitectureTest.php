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
use Illuminate\Database\MariaDbConnection;
use Illuminate\Database\MySqlConnection;
use Illuminate\Database\PostgresConnection;
use Illuminate\Database\SQLiteConnection;
use Illuminate\Database\SqlServerConnection;
use Illuminate\Foundation\ComposerScripts;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Route as RouteFacade;
use Illuminate\View\Compilers\BladeCompiler;
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

/**
 * WR-2128: the PHP every pin below reads. A pin that names the directories it scans misses the
 * next directory (a new top-level folder, an autoloaded helper, artisan, a lang file), so this
 * walks all of backend/ and leaves out only a sealed list. A file is PHP if its name ends in .php
 * or it opens with <?php, after an optional shebang (artisan). Blade templates are compiled to
 * PHP first, because token_get_all reads an @php block as HTML.
 *
 * @return array<string, string> source keyed by path relative to backend/
 */
$backendPhpSources = function(): array {
    $root = \dirname(__DIR__, 2);
    $excluded = ['vendor', 'tests', 'storage', 'bootstrap/cache', 'node_modules'];
    $directories = new \RecursiveCallbackFilterIterator(
        new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS),
        fn(\SplFileInfo $file): bool => !\in_array(str_replace($root . '/', '', $file->getPathname()), $excluded, strict: true),
    );
    $sources = [];

    foreach (new \RecursiveIteratorIterator($directories) as $file) {
        /** @var \SplFileInfo $file */
        if (!$file->isFile()) {
            continue;
        }

        $path = str_replace($root . '/', '', $file->getPathname());
        $content = (string) file_get_contents($file->getPathname());

        if (!str_ends_with($path, '.php') && preg_match('/\A(?:#![^\n]*\n)?<\?php/', $content) !== 1) {
            continue;
        }

        $sources[$path] = str_ends_with($path, '.blade.php') ? resolve(BladeCompiler::class)->compileString($content) : $content;
    }

    ksort($sources);

    return $sources;
};

it('should read every PHP source under backend/ but the sealed exclusions', function() use ($backendPhpSources): void {
    $sources = $backendPhpSources();

    expect($sources)->not->toBeEmpty('No PHP sources found — the scan is broken.')
        ->and(array_keys($sources))->toContain('artisan', 'public/index.php', 'bootstrap/app.php', 'app/Auth/AccountProvisioningPermit.php', 'resources/views/vendor/scramble/docs.blade.php');

    foreach (array_keys($sources) as $path) {
        expect($path)->not->toMatch('#^(?:vendor|tests|storage|bootstrap/cache|node_modules)/#');
    }
});

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

it('should reach the database only through a guarded connection', function() use ($backendPhpSources): void {
    // AccountTableWriteGuard sits on Connection::run() of every connection the factory builds.
    // Four things skip it: a raw PDO handle, a connection built outside the factory (a driver
    // connection or connector class, DB::extend()), a resolver or factory that replaces ours, and
    // code that reaches into Connection to empty the guard's own state (beforeExecutingCallbacks,
    // the static resolvers).
    // Every identifier or string naming one of them must appear below, file by file, exactly as
    // often as it does now.
    $allowlist = [
        'app/Auth/AccountTableWriteGuard.php' => [
            // The resolver hands the factory's PDO (or its lazy closure) to the guarded connection.
            '$pdo', '$pdo',
            \PDO::class, \PDO::class, 'resolverFor',
            MariaDbConnection::class, MySqlConnection::class, PostgresConnection::class,
            SQLiteConnection::class, SqlServerConnection::class,
            'MariaDbConnection', 'MySqlConnection', 'PostgresConnection', 'SQLiteConnection', 'SqlServerConnection',
        ],
        // Driver option constants (Pdo\Mysql::ATTR_SSL_CA) and an extension check; no handle.
        'config/database.php' => [Mysql::class, 'pdo_mysql', 'pdo_mysql'],
    ];

    $sources = $backendPhpSources();

    expect($sources)->not->toBeEmpty('No PHP sources found — the scan is broken.');

    $identifiers = [\T_STRING, \T_NAME_QUALIFIED, \T_NAME_FULLY_QUALIFIED, \T_NAME_RELATIVE, \T_VARIABLE];
    $strings = [\T_CONSTANT_ENCAPSED_STRING, \T_ENCAPSED_AND_WHITESPACE];
    $identifierPattern = '/pdo|^resolverFor$|^extend$|^beforeExecutingCallbacks$|^\$?resolvers$|ConnectionFactory|Connector$|(?:MySql|MariaDb|Postgres|SQLite|SqlServer)Connection$/i';
    $stringPattern = '/pdo|db\.factory|beforeExecutingCallbacks|\bresolvers\b|Connector\b|(?:MySql|MariaDb|Postgres|SQLite|SqlServer)Connection\b/i';
    $found = [];

    foreach ($sources as $path => $content) {
        foreach (token_get_all($content) as $token) {
            if (!\is_array($token)) {
                continue;
            }

            $isIdentifier = \in_array($token[0], $identifiers, strict: true) && preg_match($identifierPattern, $token[1]) === 1;
            $isString = \in_array($token[0], $strings, strict: true) && preg_match($stringPattern, $token[1]) === 1;

            if ($isIdentifier || $isString) {
                $literal = $token[0] === \T_CONSTANT_ENCAPSED_STRING ? mb_substr($token[1], 1, -1) : $token[1];
                $found[$path][] = mb_ltrim($literal, '\\');
            }
        }
    }

    expect($found)->not->toBeEmpty('Nothing found — the scan is broken (the guard itself names PDO).');

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
        'A raw PDO handle, a connection built outside the factory, or a replaced resolver skips the account-table guard (WR-2128):',
        $violations,
    ));
});

it('should run no code from composer.json beyond what it runs today', function(): void {
    // Autoloaded files and classmaps run on every request and command, and scripts run on install,
    // before any pin here reads them (WR-2128). Dependabot edits only require, require-dev and the
    // lock, so these keys change only by hand.
    $composer = json_decode((string) file_get_contents(\dirname(__DIR__, 2) . '/composer.json'), associative: true, flags: \JSON_THROW_ON_ERROR);

    expect($composer)->toBeArray();

    /** @var array<string, array<string, mixed>> $composer */
    expect([
        'autoload.files' => $composer['autoload']['files'] ?? null,
        'autoload.classmap' => $composer['autoload']['classmap'] ?? null,
        'autoload-dev.files' => $composer['autoload-dev']['files'] ?? null,
        'autoload-dev.classmap' => $composer['autoload-dev']['classmap'] ?? null,
    ])->toBe([
        'autoload.files' => null,
        'autoload.classmap' => null,
        'autoload-dev.files' => null,
        'autoload-dev.classmap' => null,
    ])->and($composer['scripts'] ?? null)->toBe([
        'setup' => [
            'composer install',
            '@php -r "file_exists(\'.env\') || copy(\'.env.example\', \'.env\');"',
            '@php artisan key:generate',
            '@php artisan migrate --force',
        ],
        'dev' => [
            'Composer\Config::disableProcessTimeout',
            '@php artisan octane:start --watch',
        ],
        'test' => [
            '@php artisan config:clear --ansi',
            '@php artisan test',
        ],
        'test:arch' => './vendor/bin/pest tests/Architecture',
        'test:coverage' => './vendor/bin/pest --coverage --configuration=phpunit.coverage.xml --min=100',
        'test:feature-coverage' => './vendor/bin/pest --coverage --configuration=phpunit.feature-coverage.xml --min=90',
        'lint' => [
            '@rector',
            '@pint',
        ],
        'lint:test' => [
            '@rector:test',
            '@pint:test',
        ],
        'rector' => './vendor/bin/rector process',
        'rector:test' => './vendor/bin/rector process --dry-run',
        'pint' => './vendor/bin/pint',
        'pint:test' => './vendor/bin/pint --test --parallel',
        'phpstan' => './vendor/bin/phpstan analyse',
        'phpstan:types' => './vendor/bin/phpstan analyse --configuration=phpstan-type-coverage.neon',
        'deptrac' => './vendor/bin/deptrac analyse',
        'mutation' => 'php -d pcov.enabled=1 ./vendor/bin/pest --mutate --path=app/Actions,app/Services --testsuite=Unit --parallel --min=76',
        'post-autoload-dump' => [
            ComposerScripts::class . '::postAutoloadDump',
            '@php artisan package:discover --ansi',
        ],
        'post-update-cmd' => [
            '@php artisan vendor:publish --tag=laravel-assets --ansi --force',
        ],
        'post-root-package-install' => [
            '@php -r "file_exists(\'.env\') || copy(\'.env.example\', \'.env\');"',
        ],
        'post-create-project-cmd' => [
            '@php artisan key:generate --ansi',
            '@php -r "file_exists(\'database/database.sqlite\') || touch(\'database/database.sqlite\');"',
            '@php artisan migrate --graceful --ansi',
        ],
        'pre-package-uninstall' => [
            ComposerScripts::class . '::prePackageUninstall',
        ],
    ]);
});

it('should name the provisioning permit only in its holders, and call open() from tests only', function() use ($backendPhpSources): void {
    // toOnlyBeUsedIn sees autoloaded classes; this reads every PHP source, closures and scripts too.
    $holders = [
        'app/Actions/Auth/CreateAccountAction.php',
        'app/Auth/AccountProvisioningPermit.php',
        'app/Auth/AccountTableWriteGuard.php',
        'app/Auth/CloseAccountProvisioningPermit.php',
        'database/seeders/DatabaseSeeder.php',
    ];

    $sources = $backendPhpSources();

    expect($sources)->not->toBeEmpty('No PHP sources found — the scan is broken.');

    $violations = [];

    foreach ($sources as $path => $content) {
        if (preg_match('/AccountProvisioningPermit::open\s*\(/', $content) === 1) {
            $violations[] = $path . ': calls open()';
        }

        if (!\in_array($path, $holders, strict: true) && preg_match('/\bAccountProvisioningPermit\b/', $content) === 1) {
            $violations[] = $path . ': references the permit';
        }
    }

    expect($violations)->toBeEmpty(ArchTestHelper::formatViolations(
        'The provisioning permit is held only by its named classes, and open() is for tests/ only (WR-2128):',
        $violations,
    ));
});

it('should not rebind a closure into another scope or use reflection', function() use ($backendPhpSources): void {
    // The permit's flag, the guard's callbacks and its resolvers are private or protected state.
    // Reaching them needs a scope rebinding (Closure::bind, ->bindTo(), ->call()) or reflection,
    // whatever the field is called, so this pins the mechanism rather than the fields. Every use
    // must appear below, file by file, exactly as often as it does now.
    $allowlist = [
        // isInstalledFor() reads the scope of the resolver closure; it changes nothing.
        'app/Auth/AccountTableWriteGuard.php' => [\ReflectionFunction::class, \ReflectionFunction::class],
    ];

    $sources = $backendPhpSources();

    expect($sources)->not->toBeEmpty('No PHP sources found — the scan is broken.');

    $names = [\T_STRING, \T_NAME_QUALIFIED, \T_NAME_FULLY_QUALIFIED, \T_NAME_RELATIVE];
    $insignificant = [\T_WHITESPACE, \T_COMMENT, \T_DOC_COMMENT];
    $found = [];

    foreach ($sources as $path => $content) {
        $tokens = array_values(array_filter(
            token_get_all($content),
            fn(array|string $token): bool => !\is_array($token) || !\in_array($token[0], $insignificant, strict: true),
        ));

        foreach ($tokens as $index => $token) {
            if (!\is_array($token) || !\in_array($token[0], $names, strict: true)) {
                continue;
            }

            $name = mb_ltrim($token[1], '\\');
            $last = mb_strtolower((string) mb_strrchr('\\' . $name, '\\'));
            $previous = $tokens[$index - 1] ?? null;
            $beforePrevious = $tokens[$index - 2] ?? null;
            $afterArrow = \is_array($previous) && \in_array($previous[0], [\T_OBJECT_OPERATOR, \T_NULLSAFE_OBJECT_OPERATOR], strict: true);
            $afterDoubleColon = \is_array($previous) && $previous[0] === \T_DOUBLE_COLON;
            $onThis = \is_array($beforePrevious) && $beforePrevious[0] === \T_VARIABLE && $beforePrevious[1] === '$this';

            $hit = str_starts_with($last, '\reflection')
                || $last === '\bindto'
                || ($last === '\bind' && $afterDoubleColon)
                || ($last === '\call' && $afterArrow && !$onThis);

            if ($hit) {
                $found[$path][] = $name;
            }
        }
    }

    expect($found)->not->toBeEmpty('Nothing found — the scan is broken (the guard itself uses ReflectionFunction).');

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
        'A closure rebound into another scope, or reflection, can open the permit or empty the guard (WR-2128):',
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
