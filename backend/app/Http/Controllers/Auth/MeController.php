<?php

declare(strict_types = 1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileResourceData;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

class MeController extends Controller
{
    public function __invoke(#[CurrentUser] User $user): JsonResponse
    {
        return ProfileResourceData::from($user)->toResponse();
    }
}
