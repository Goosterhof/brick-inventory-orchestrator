<?php

declare(strict_types = 1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware that generates ETags from response content and handles conditional requests.
 *
 * On successful GET/HEAD responses:
 * 1. Hashes the response content to produce an ETag
 * 2. Compares against the client's If-None-Match header
 * 3. Returns 304 Not Modified if they match (saving bandwidth)
 *
 * Sits at the end of the middleware stack — after serialization.
 */
final readonly class SetEtagHeaders
{
    /**
     * @param Closure(Request): Response $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (!$request->isMethodCacheable() || !$response->isSuccessful()) {
            return $response;
        }

        // 202 Accepted is a transient polling envelope (parts-sync in progress). An ETag
        // with no explicit freshness can trip browser heuristic caching, re-pinning the
        // pending state the SetCacheHeaders no-store is there to prevent. Leave it bare.
        if ($response->getStatusCode() === Response::HTTP_ACCEPTED) {
            return $response;
        }

        $content = $response->getContent();

        if ($content === false || $content === '') {
            return $response;
        }

        $etag = '"' . md5($content) . '"';
        $response->headers->set('ETag', $etag);

        $ifNoneMatch = $request->headers->get('If-None-Match');

        if ($ifNoneMatch !== null && $this->matches($etag, $ifNoneMatch)) {
            $response->setStatusCode(304);
            $response->setContent('');
        }

        return $response;
    }

    /**
     * Check if the ETag matches any value in the If-None-Match header.
     * Supports multiple ETags separated by commas, per RFC 7232.
     */
    private function matches(string $etag, string $ifNoneMatch): bool
    {
        if ($ifNoneMatch === '*') {
            return true;
        }

        return array_any(explode(',', $ifNoneMatch), fn(string $candidate): bool => mb_trim($candidate) === $etag);
    }
}
