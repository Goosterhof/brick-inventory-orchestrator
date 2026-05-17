<?php

declare(strict_types = 1);

namespace App\Http\Controllers;

use App\Actions\GetSetByEanAction;
use App\Actions\GetSetPartsAction;
use App\Actions\GetSetStorageMapAction;
use App\DataTransferObjects\Result\Set\SetPartsResultData;
use App\Enums\SetSyncStatus;
use App\Http\Resources\SetStorageMapResourceData;
use App\Http\Resources\SetSummaryResourceData;
use App\Http\Resources\SetWithPartsResourceData;
use App\Models\User;
use Closure;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

class SetController extends Controller
{
    public function parts(string $setNum, GetSetPartsAction $getSetPartsAction): JsonResponse
    {
        $setPartsResultData = $getSetPartsAction->execute($setNum);

        return $this->respondForSyncStatus(
            $setPartsResultData,
            fn(): JsonResponse => SetWithPartsResourceData::from($setPartsResultData->set)->toResponse(),
        );
    }

    public function lookupByEan(string $ean, GetSetByEanAction $getSetByEanAction): JsonResponse
    {
        $set = $getSetByEanAction->execute($ean);

        return SetSummaryResourceData::from($set)->toResponse();
    }

    public function storageMap(
        string $setNum,
        GetSetPartsAction $getSetPartsAction,
        GetSetStorageMapAction $getSetStorageMapAction,
        #[CurrentUser]
        User $user,
    ): JsonResponse {
        $setPartsResultData = $getSetPartsAction->execute($setNum);

        return $this->respondForSyncStatus(
            $setPartsResultData,
            function() use ($setPartsResultData, $getSetStorageMapAction, $user): JsonResponse {
                $setStorageMapData = $getSetStorageMapAction->execute($setPartsResultData->set, $user->family);

                return SetStorageMapResourceData::from($setStorageMapData)->toResponse();
            },
        );
    }

    /**
     * Centralised gate for the parts/storage-map endpoints.
     *
     * Completed → run the success closure (200).
     * Failed    → 502 with the reason.
     * Pending / InProgress → 202 with a polling hint.
     *
     * @param Closure(): JsonResponse $onCompleted
     */
    private function respondForSyncStatus(SetPartsResultData $setPartsResultData, Closure $onCompleted): JsonResponse
    {
        return match ($setPartsResultData->status) {
            SetSyncStatus::Completed => $onCompleted(),
            SetSyncStatus::Failed => response()->json([
                'set_num' => $setPartsResultData->set->set_num,
                'status' => $setPartsResultData->status->value,
                'reason' => $setPartsResultData->failedReason,
            ], 502),
            SetSyncStatus::Pending, SetSyncStatus::InProgress => response()->json([
                'set_num' => $setPartsResultData->set->set_num,
                'status' => $setPartsResultData->status->value,
                'message' => 'Set parts are syncing — please retry shortly.',
            ], 202),
        };
    }
}
