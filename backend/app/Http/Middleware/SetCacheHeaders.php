<?php

declare(strict_types = 1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware that sets Cache-Control headers on responses.
 *
 * Applied via route middleware with a directive string parameter:
 * - 'private;max_age=60' → Cache-Control: private, max-age=60
 * - 'max_age=3600' → Cache-Control: max-age=3600
 * - 'no_cache;no_store' → Cache-Control: no-cache, no-store
 *
 * Only applied to successful GET/HEAD responses.
 */
final readonly class SetCacheHeaders
{
    /**
     * @param Closure(Request): Response $next
     */
    public function handle(Request $request, Closure $next, string $directives = ''): Response
    {
        $response = $next($request);

        if (!$request->isMethodCacheable() || !$response->isSuccessful()) {
            return $response;
        }

        $parsed = $this->parseDirectives($directives);

        if ($parsed !== '') {
            $response->headers->set('Cache-Control', $parsed);
        }

        return $response;
    }

    private function parseDirectives(string $directives): string
    {
        if ($directives === '') {
            return '';
        }

        $parts = [];

        foreach (explode(';', $directives) as $directive) {
            $directive = mb_trim($directive);
            if ($directive === '') {
                continue;
            }

            if (str_contains($directive, '=')) {
                [$key, $value] = explode('=', $directive, 2);
                $parts[] = str_replace('_', '-', mb_trim($key)) . '=' . mb_trim($value);
            } else {
                $parts[] = str_replace('_', '-', $directive);
            }
        }

        return implode(', ', $parts);
    }
}
