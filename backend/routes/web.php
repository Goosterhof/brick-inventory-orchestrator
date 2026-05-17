<?php

declare(strict_types = 1);

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Route;

// SPA fallback: any non-API GET that doesn't match a static file in public/
// returns the families app's index.html. The Vue Router takes over from there.
// API routes are scoped under /api/* in routes/api.php and are matched first
// by Laravel's routing pipeline.
Route::fallback(function (): Response {
    $indexPath = public_path('index.html');

    if (! file_exists($indexPath)) {
        abort(404);
    }

    return response(
        file_get_contents($indexPath),
        200,
        ['Content-Type' => 'text/html; charset=UTF-8'],
    );
});
