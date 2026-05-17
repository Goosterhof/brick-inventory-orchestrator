<?php

declare(strict_types = 1);

use App\Http\Middleware\SetCacheHeaders;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

covers(SetCacheHeaders::class);

describe('SetCacheHeaders', function(): void {
    it('should set Cache-Control with public and max-age directives', function(): void {
        $middleware = new SetCacheHeaders;
        $request = Request::create('/test', 'GET');
        $response = new Response('{"data":"test"}', 200);

        $result = $middleware->handle($request, fn(): Response => $response, 'public;max_age=3600');

        // Symfony normalizes: max-age first, then public
        expect($result->headers->get('Cache-Control'))->toBe('max-age=3600, public');
    });

    it('should set private and max-age directives', function(): void {
        $middleware = new SetCacheHeaders;
        $request = Request::create('/test', 'GET');
        $response = new Response('{"data":"test"}', 200);

        $result = $middleware->handle($request, fn(): Response => $response, 'private;max_age=60');

        // Symfony normalizes: max-age first, then private
        expect($result->headers->get('Cache-Control'))->toBe('max-age=60, private');
    });

    it('should set no-cache and no-store directives', function(): void {
        $middleware = new SetCacheHeaders;
        $request = Request::create('/test', 'GET');
        $response = new Response('{"data":"test"}', 200);

        $result = $middleware->handle($request, fn(): Response => $response, 'no_cache;no_store');

        // Symfony adds private by default when no public directive
        expect($result->headers->get('Cache-Control'))->toBe('no-cache, no-store, private');
    });

    it('should not set headers on POST requests', function(): void {
        $middleware = new SetCacheHeaders;
        $request = Request::create('/test', 'POST');
        $response = new Response('{"data":"test"}', 200);

        $result = $middleware->handle($request, fn(): Response => $response, 'public;max_age=3600');

        // POST is not cacheable, middleware skips
        expect($result->headers->get('Cache-Control'))->not->toContain('max-age=3600');
    });

    it('should not set headers on non-successful responses', function(): void {
        $middleware = new SetCacheHeaders;
        $request = Request::create('/test', 'GET');
        $response = new Response('{"error":"not found"}', 404);

        $result = $middleware->handle($request, fn(): Response => $response, 'public;max_age=3600');

        expect($result->headers->get('Cache-Control'))->not->toContain('max-age=3600');
    });

    it('should not modify response when no directives given', function(): void {
        $middleware = new SetCacheHeaders;
        $request = Request::create('/test', 'GET');
        $response = new Response('{"data":"test"}', 200);

        $result = $middleware->handle($request, fn(): Response => $response);

        expect($result->headers->get('Cache-Control'))->not->toContain('max-age');
    });

    it('should handle HEAD requests like GET', function(): void {
        $middleware = new SetCacheHeaders;
        $request = Request::create('/test', 'HEAD');
        $response = new Response('', 200);

        $result = $middleware->handle($request, fn(): Response => $response, 'public;max_age=3600');

        expect($result->headers->get('Cache-Control'))->toBe('max-age=3600, public');
    });
});
