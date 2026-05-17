<?php

declare(strict_types = 1);

use App\Exceptions\BrickognizeApiException;
use App\Exceptions\CannotRemoveSelfException;
use App\Exceptions\ImportAlreadyInProgressException;
use App\Exceptions\InvalidApiResponseException;
use App\Exceptions\InvalidInviteCodeException;
use App\Exceptions\InviteCodeNotFoundException;
use App\Exceptions\MissingRebrickableTokenException;
use App\Exceptions\NotFamilyHeadException;
use App\Exceptions\RebrickableApiException;
use App\Exceptions\SetNotFoundException;
use App\Exceptions\UserNotInFamilyException;
use App\Http\Middleware\EnsureFamilyOwnership;
use App\Http\Middleware\SetCacheHeaders;
use App\Http\Middleware\SetEtagHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

return Application::configure(basePath: \dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function(Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->preventRequestForgery(except: [
            'api/*',
        ]);
        $middleware->alias([
            'family.ownership' => EnsureFamilyOwnership::class,
            'cache.headers' => SetCacheHeaders::class,
            'etag' => SetEtagHeaders::class,
        ]);
    })
    ->withExceptions(function(Exceptions $exceptions): void {
        $exceptions->render(fn(SetNotFoundException $setNotFoundException, Request $request): JsonResponse => response()->json(['error' => 'Set not found'], 404));

        $exceptions->render(fn(MissingRebrickableTokenException $missingRebrickableTokenException, Request $request): JsonResponse => response()->json(['error' => 'Rebrickable user token not configured'], 400));

        $exceptions->render(fn(NotFamilyHeadException $notFamilyHeadException, Request $request): JsonResponse => response()->json(['error' => 'Only the family head can perform this action'], 403));

        $exceptions->render(function(RebrickableApiException $rebrickableApiException, Request $request): JsonResponse {
            $message = match ($rebrickableApiException->statusCode) {
                401 => 'Invalid API key',
                default => 'Failed to fetch set data',
            };
            $status = match ($rebrickableApiException->statusCode) {
                404 => 404,
                default => 502,
            };

            return response()->json(['error' => $message], $status);
        });

        $exceptions->render(fn(BrickognizeApiException $brickognizeApiException, Request $request): JsonResponse => response()->json(['error' => 'Failed to identify brick'], 502));

        $exceptions->render(fn(InvalidApiResponseException $invalidApiResponseException, Request $request): JsonResponse => response()->json(['error' => 'Unexpected response from external API'], 502));

        $exceptions->render(fn(CannotRemoveSelfException $cannotRemoveSelfException, Request $request): JsonResponse => response()->json(['error' => 'Cannot remove yourself from the family'], 422));

        $exceptions->render(fn(UserNotInFamilyException $userNotInFamilyException, Request $request): JsonResponse => response()->json(['error' => 'User is not a member of this family'], 404));

        $exceptions->render(fn(InviteCodeNotFoundException $inviteCodeNotFoundException, Request $request): JsonResponse => response()->json(['error' => 'No active invite code found'], 404));

        $exceptions->render(fn(InvalidInviteCodeException $invalidInviteCodeException, Request $request): JsonResponse => response()->json(['error' => 'The invite code is invalid, expired, or revoked'], 422));

        $exceptions->render(fn(ImportAlreadyInProgressException $importAlreadyInProgressException, Request $request): JsonResponse => response()->json(['error' => 'An import is already in progress for this family'], 409));
    })->create();
