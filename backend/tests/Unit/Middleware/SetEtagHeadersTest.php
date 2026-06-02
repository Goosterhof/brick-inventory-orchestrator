<?php

declare(strict_types = 1);

use App\Http\Middleware\SetEtagHeaders;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

covers(SetEtagHeaders::class);

describe('SetEtagHeaders', function(): void {
    it('should add ETag header to successful GET responses', function(): void {
        $middleware = new SetEtagHeaders;
        $request = Request::create('/test', 'GET');
        $response = new Response('{"data":"test"}', 200);

        $result = $middleware->handle($request, fn(): Response => $response);

        expect($result->headers->has('ETag'))->toBeTrue();
        $expectedEtag = '"' . md5('{"data":"test"}') . '"';
        expect($result->headers->get('ETag'))->toBe($expectedEtag);
    });

    it('should return 304 when If-None-Match matches ETag', function(): void {
        $middleware = new SetEtagHeaders;
        $content = '{"data":"test"}';
        $etag = '"' . md5($content) . '"';
        $request = Request::create('/test', 'GET');
        $request->headers->set('If-None-Match', $etag);

        $response = new Response($content, 200);

        $result = $middleware->handle($request, fn(): Response => $response);

        expect($result->getStatusCode())->toBe(304);
        expect($result->getContent())->toBe('');
    });

    it('should return full response when If-None-Match does not match', function(): void {
        $middleware = new SetEtagHeaders;
        $content = '{"data":"test"}';
        $request = Request::create('/test', 'GET');
        $request->headers->set('If-None-Match', '"stale-etag"');

        $response = new Response($content, 200);

        $result = $middleware->handle($request, fn(): Response => $response);

        expect($result->getStatusCode())->toBe(200);
        expect($result->getContent())->toBe($content);
    });

    it('should not add ETag to non-successful responses', function(): void {
        $middleware = new SetEtagHeaders;
        $request = Request::create('/test', 'GET');
        $response = new Response('{"error":"not found"}', 404);

        $result = $middleware->handle($request, fn(): Response => $response);

        expect($result->headers->has('ETag'))->toBeFalse();
    });

    it('should not add ETag to 202 Accepted responses', function(): void {
        $middleware = new SetEtagHeaders;
        $request = Request::create('/test', 'GET');
        $response = new Response('{"status":"pending"}', 202);

        $result = $middleware->handle($request, fn(): Response => $response);

        expect($result->headers->has('ETag'))->toBeFalse();
        expect($result->getStatusCode())->toBe(202);
    });

    it('should not add ETag to POST responses', function(): void {
        $middleware = new SetEtagHeaders;
        $request = Request::create('/test', 'POST');
        $response = new Response('{"data":"created"}', 200);

        $result = $middleware->handle($request, fn(): Response => $response);

        expect($result->headers->has('ETag'))->toBeFalse();
    });

    it('should not add ETag to empty responses', function(): void {
        $middleware = new SetEtagHeaders;
        $request = Request::create('/test', 'GET');
        $response = new Response('', 200);

        $result = $middleware->handle($request, fn(): Response => $response);

        expect($result->headers->has('ETag'))->toBeFalse();
    });

    it('should match wildcard If-None-Match', function(): void {
        $middleware = new SetEtagHeaders;
        $request = Request::create('/test', 'GET');
        $request->headers->set('If-None-Match', '*');

        $response = new Response('{"data":"test"}', 200);

        $result = $middleware->handle($request, fn(): Response => $response);

        expect($result->getStatusCode())->toBe(304);
    });

    it('should match ETag in comma-separated If-None-Match list', function(): void {
        $middleware = new SetEtagHeaders;
        $content = '{"data":"test"}';
        $etag = '"' . md5($content) . '"';
        $request = Request::create('/test', 'GET');
        $request->headers->set('If-None-Match', '"other-etag", ' . $etag . ', "another-etag"');

        $response = new Response($content, 200);

        $result = $middleware->handle($request, fn(): Response => $response);

        expect($result->getStatusCode())->toBe(304);
    });

    it('should handle HEAD requests like GET', function(): void {
        $middleware = new SetEtagHeaders;
        $request = Request::create('/test', 'HEAD');
        $response = new Response('{"data":"test"}', 200);

        $result = $middleware->handle($request, fn(): Response => $response);

        expect($result->headers->has('ETag'))->toBeTrue();
    });
});
