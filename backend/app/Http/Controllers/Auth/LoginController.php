<?php

declare(strict_types = 1);

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\LoginUserAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\ProfileResourceData;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Http\JsonResponse;

class LoginController extends Controller
{
    public function __invoke(
        LoginRequest $loginRequest,
        LoginUserAction $loginUserAction,
        StatefulGuard $statefulGuard,
    ): JsonResponse {
        $user = $loginUserAction->execute($loginRequest->toDto());

        $statefulGuard->login($user);

        return ProfileResourceData::from($user)->toResponse();
    }
}
