<?php

declare(strict_types = 1);

use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Routing Architecture
|--------------------------------------------------------------------------
|
| Every auth:sanctum route must use `can:` middleware for authorization,
| unless explicitly exempt. This test auto-detects new routes — no
| hardcoded allowlist to maintain.
|
| If you add a new authenticated route and this test fails, you either:
|   1. Forgot to add ->can() to your route (fix it), or
|   2. The route legitimately skips authorization (add it to the exempt list below with a reason).
|
 */

uses(TestCase::class);

it('should have can middleware on all authenticated routes except explicit exemptions', function(): void {
    /**
     * Routes that legitimately skip ->can() middleware.
     * Each entry requires a justification comment.
     */
    $exemptRoutes = [
        'POST api/logout',  // Session teardown — no resource to authorize against
        'GET api/me',       // Returns the authenticated user's own data — auth IS the authorization
    ];

    $allRoutes = RouteFacade::getRoutes();

    $authenticatedRoutes = collect($allRoutes->getRoutes())
        ->filter(function(Route $route): bool {
            $middleware = $route->gatherMiddleware();

            foreach ($middleware as $m) {
                if ($m === 'auth:sanctum') {
                    return true;
                }
            }

            return false;
        });

    $missingCanMiddleware = [];

    foreach ($authenticatedRoutes as $authenticatedRoute) {
        $methods = array_diff($authenticatedRoute->methods(), ['HEAD']);

        foreach ($methods as $method) {
            $routeKey = $method . ' ' . $authenticatedRoute->uri();

            if (\in_array($routeKey, $exemptRoutes, strict: true)) {
                continue;
            }

            $middleware = $authenticatedRoute->gatherMiddleware();
            $hasCanMiddleware = false;

            foreach ($middleware as $m) {
                if (\is_string($m) && str_starts_with($m, 'can:')) {
                    $hasCanMiddleware = true;

                    break;
                }
            }

            if (!$hasCanMiddleware) {
                $missingCanMiddleware[] = $routeKey;
            }
        }
    }

    expect($missingCanMiddleware)->toBeEmpty(
        'These auth:sanctum routes are missing can: middleware: ' . implode(', ', $missingCanMiddleware)
        . '. Either add ->can() to the route or add it to the exempt list in this test with a justification.',
    );
});

it('should have the expected number of authenticated routes as a drift guard', function(): void {
    /**
     * Sanity check: if this number changes, someone added or removed an
     * auth:sanctum route. Update this count after verifying the new route
     * has proper ->can() middleware (or is added to the exempt list above).
     */
    $expectedAuthenticatedRouteCount = 37;

    $allRoutes = RouteFacade::getRoutes();

    $authenticatedRouteCount = collect($allRoutes->getRoutes())
        ->filter(function(Route $route): bool {
            $middleware = $route->gatherMiddleware();

            foreach ($middleware as $m) {
                if ($m === 'auth:sanctum') {
                    return true;
                }
            }

            return false;
        })
        ->count();

    expect($authenticatedRouteCount)->toBe(
        $expectedAuthenticatedRouteCount,
        \sprintf('Expected %d auth:sanctum routes but found %d. ', $expectedAuthenticatedRouteCount, $authenticatedRouteCount)
        . 'If you added a new route, update this count after confirming it has proper can: middleware.',
    );
});
