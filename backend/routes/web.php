<?php

declare(strict_types = 1);

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

// SPA fallback: any non-API request that doesn't match a static file in
// public/ returns the appropriate app's index.html.
//
// - /admin and /admin/* serve the admin SPA (public/admin/index.html).
// - everything else serves the families SPA (public/index.html).
//
// Vue Router takes over from there. API routes are matched first by
// routes/api.php, so /api/* requests never reach the fallback.
Route::fallback(function(Request $request): Response {
    $path = $request->path();

    $isAdmin = $path === 'admin' || str_starts_with($path, 'admin/');

    $indexPath = $isAdmin
        ? public_path('admin/index.html')
        : public_path('index.html');

    if (!file_exists($indexPath)) {
        throw new NotFoundHttpException;
    }

    $content = file_get_contents($indexPath);

    if ($content === false) {
        throw new NotFoundHttpException;
    }

    return response(
        $content,
        200,
        ['Content-Type' => 'text/html; charset=UTF-8'],
    );
});
