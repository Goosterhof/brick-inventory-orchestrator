<?php

declare(strict_types = 1);

namespace App\Http\Middleware;

use App\Contracts\BelongsToFamilyInterface;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware that ensures route-bound models belong to the authenticated user's family.
 *
 * Any model implementing BelongsToFamily that is bound to the route will be
 * checked against the authenticated user's family_id. If there's a mismatch,
 * a 404 response is returned.
 */
final readonly class EnsureFamilyOwnership
{
    /**
     * @param Closure(Request): Response $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user instanceof User) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        foreach ($request->route()?->parameters() ?? [] as $parameter) {
            if ($parameter instanceof BelongsToFamilyInterface && $parameter->getFamilyId() !== $user->family_id) {
                return response()->json(['error' => 'Not found'], 404);
            }
        }

        return $next($request);
    }
}
