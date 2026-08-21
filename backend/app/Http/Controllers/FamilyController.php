<?php

declare(strict_types = 1);

namespace App\Http\Controllers;

use App\Actions\Family\GetBrickDnaAction;
use App\Actions\Family\GetFamilyPartsAction;
use App\Actions\Family\GetFamilyPartUsageAction;
use App\Actions\Family\GetFamilyStatsAction;
use App\Actions\Family\RemoveFamilyMemberAction;
use App\Actions\Family\SetRebrickableTokenAction;
use App\Http\Requests\Family\SetRebrickableTokenRequest;
use App\Http\Resources\BrickDnaResourceData;
use App\Http\Resources\FamilyMemberResourceData;
use App\Http\Resources\FamilyPartUsageResourceData;
use App\Http\Resources\FamilyStatsResourceData;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FamilyController extends Controller
{
    public function members(
        #[CurrentUser]
        User $user,
    ): JsonResponse {
        // Payload is array<int, FamilyMemberResourceData> — the ADR-0009 collection shape
        // (ResourceData::collection() returns array<int, static> by design). The rule's
        // isArray() gate cannot see element types, so a ResourceData list reads as a bare array.
        // @phpstan-ignore forbidInlineArrayJsonResponseInControllers.arrayPayload
        return new JsonResponse(FamilyMemberResourceData::fromFamily($user->family));
    }

    public function parts(
        #[CurrentUser]
        User $user,
        GetFamilyPartsAction $getFamilyPartsAction,
        Request $request,
    ): JsonResponse {
        return new JsonResponse(
            $getFamilyPartsAction->execute(
                family: $user->family,
                perPage: $request->integer('per_page', 25),
                cursor: $request->query('cursor'),
            ),
        );
    }

    public function partUsage(
        #[CurrentUser]
        User $user,
        GetFamilyPartUsageAction $getFamilyPartUsageAction,
        string $partNum,
        int $colorId,
    ): JsonResponse {
        $familyPartUsageData = $getFamilyPartUsageAction->execute($user->family, $partNum, $colorId);

        return FamilyPartUsageResourceData::from($familyPartUsageData)->toResponse();
    }

    public function stats(
        #[CurrentUser]
        User $user,
        GetFamilyStatsAction $getFamilyStatsAction,
    ): JsonResponse {
        $familyStatsData = $getFamilyStatsAction->execute($user->family);

        return FamilyStatsResourceData::from($familyStatsData)->toResponse();
    }

    public function brickDna(
        #[CurrentUser]
        User $user,
        GetBrickDnaAction $getBrickDnaAction,
    ): JsonResponse {
        $brickDnaData = $getBrickDnaAction->execute($user->family);

        return BrickDnaResourceData::from($brickDnaData)->toResponse();
    }

    public function setRebrickableToken(
        SetRebrickableTokenRequest $setRebrickableTokenRequest,
        #[CurrentUser]
        User $user,
        SetRebrickableTokenAction $setRebrickableTokenAction,
    ): JsonResponse {
        $setRebrickableTokenAction->execute($user->family, $setRebrickableTokenRequest->toDto(), $user);

        return response()->json(null, 204);
    }

    public function removeMember(
        User $user,
        #[CurrentUser]
        User $currentUser,
        RemoveFamilyMemberAction $removeFamilyMemberAction,
    ): JsonResponse {
        $removeFamilyMemberAction->execute($currentUser->family, $user, $currentUser);

        // Single-key ack, not a domain resource — the noise class the rule's own docblock
        // tells consumers to separate from the resource-shape class. The sanctioned fix is a
        // shared MessageResponse subclass; BIO has none, and inventing one is out of WR-0533 scope.
        // @phpstan-ignore forbidInlineArrayJsonResponseInControllers.arrayPayload
        return new JsonResponse(['message' => 'Member removed from family'], 200);
    }
}
