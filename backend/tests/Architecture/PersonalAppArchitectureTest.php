<?php

declare(strict_types = 1);

use App\Actions\Auth\CreateAccountAction;
use App\Actions\Family\RemoveFamilyMemberAction;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route as RouteFacade;
use Tests\Architecture\Support\ArchTestHelper;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Personal App Architecture (WR-2118)
|--------------------------------------------------------------------------
|
| BIO admits nobody: no HTTP route may create a User or Family, and the
| application holds no mail capability. Three checks:
|   1. The set of routes without auth:sanctum equals a literal allowlist.
|   2. No App\ class depends on Laravel's mail or notification classes.
|   3. No file in app/ creates a User or Family, outside a named allowlist,
|      and the one creation Action is used by console commands only.
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
        'GET storage/{path}',
        'PUT storage/{path}',
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
    ]);

arch('the account creation action should only be used by console commands')
    ->expect(CreateAccountAction::class)
    ->toOnlyBeUsedIn('App\Console');

it('should create users and families only in allowlisted classes', function(): void {
    $allowlist = [
        // Console-only: the operator's shell is the one way to provision an account.
        CreateAccountAction::class,
        // Moves a removed member into a solo family; reachable only by the head, creates no user.
        RemoveFamilyMemberAction::class,
    ];

    $appPath = \dirname(__DIR__, 2) . '/app';
    $files = ArchTestHelper::phpFilesIn($appPath);

    expect($files)->not->toBeEmpty('No PHP files found under app/ — the scan is broken.');

    $creationCall = '(?:newInstance|newModelInstance|create|forceCreate|createQuietly|firstOrCreate|firstOrNew|updateOrCreate|createOrFirst|insert|insertGetId|insertOrIgnore|upsert)';

    $staticPatterns = [
        '/\b(?:User|Family)::(?:query\(\)\s*->\s*)?' . $creationCall . '\s*\(/',
        '/\bnew\s+\\\?(?:App\\\Models\\\)?(?:User|Family)\b/',
        '/->\s*users\(\)\s*->\s*(?:save|saveMany|saveQuietly|' . $creationCall . '|createMany)\s*\(/',
        '/->\s*table\(\s*[\'"](?:users|families)[\'"]\s*\)/',
    ];

    $violations = [];

    foreach ($files as $file) {
        $className = ArchTestHelper::resolveClassName($file, $appPath, 'App');

        if (\in_array($className, $allowlist, strict: true)) {
            continue;
        }

        $content = (string) file_get_contents($file);
        $patterns = $staticPatterns;

        preg_match_all('/\b(?:private|protected|public)\s+(?:readonly\s+)?\\\?(?:App\\\Models\\\)?(?:User|Family)\s+\$(\w+)/', $content, $matches);

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
        'User/Family creation found outside the allowlist (WR-2118 — BIO admits nobody over HTTP):',
        $violations,
    ));
});
