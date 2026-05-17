<?php

declare(strict_types = 1);

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\CreateUserWithFamilyAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\ProfileResourceData;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Http\JsonResponse;

class RegisterController extends Controller
{
    public function __invoke(
        RegisterRequest $registerRequest,
        CreateUserWithFamilyAction $createUserWithFamilyAction,
        StatefulGuard $statefulGuard,
    ): JsonResponse {
        $user = $createUserWithFamilyAction->execute($registerRequest->toDto());

        $statefulGuard->login($user);

        return ProfileResourceData::from($user)->toResponseWithStatus(201);
    }
}
