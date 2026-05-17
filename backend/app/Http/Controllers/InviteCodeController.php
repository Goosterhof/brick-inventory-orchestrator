<?php

declare(strict_types = 1);

namespace App\Http\Controllers;

use App\Actions\Family\EmailInviteCodeAction;
use App\Actions\Family\GenerateInviteCodeAction;
use App\Actions\Family\GetActiveInviteCodeAction;
use App\Actions\Family\RevokeInviteCodeAction;
use App\Http\Requests\Family\EmailInviteCodeRequest;
use App\Http\Resources\InviteCodeResourceData;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

class InviteCodeController extends Controller
{
    public function store(
        #[CurrentUser]
        User $user,
        GenerateInviteCodeAction $generateInviteCodeAction,
    ): JsonResponse {
        $inviteCode = $generateInviteCodeAction->execute($user->family, $user);

        return InviteCodeResourceData::from($inviteCode)->toResponseWithStatus(201);
    }

    public function show(
        #[CurrentUser]
        User $user,
        GetActiveInviteCodeAction $getActiveInviteCodeAction,
    ): JsonResponse {
        $inviteCode = $getActiveInviteCodeAction->execute($user->family);

        return InviteCodeResourceData::from($inviteCode)->toResponse();
    }

    public function destroy(
        #[CurrentUser]
        User $user,
        RevokeInviteCodeAction $revokeInviteCodeAction,
    ): JsonResponse {
        $revokeInviteCodeAction->execute($user->family);

        return new JsonResponse(null, 204);
    }

    public function email(
        EmailInviteCodeRequest $emailInviteCodeRequest,
        #[CurrentUser]
        User $user,
        EmailInviteCodeAction $emailInviteCodeAction,
    ): JsonResponse {
        $inviteCode = $emailInviteCodeAction->execute(
            $user->family,
            $user,
            $emailInviteCodeRequest->toDto(),
        );

        return InviteCodeResourceData::from($inviteCode)->toResponseWithStatus(202);
    }
}
