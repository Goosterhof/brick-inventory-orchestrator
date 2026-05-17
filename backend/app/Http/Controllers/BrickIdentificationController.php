<?php

declare(strict_types = 1);

namespace App\Http\Controllers;

use App\Actions\BrickIdentification\IdentifyBrickAction;
use App\Http\Requests\BrickIdentification\IdentifyBrickRequest;
use App\Http\Resources\PartResourceData;
use Illuminate\Http\JsonResponse;

class BrickIdentificationController extends Controller
{
    public function identify(
        IdentifyBrickRequest $identifyBrickRequest,
        IdentifyBrickAction $identifyBrickAction,
    ): JsonResponse {
        $part = $identifyBrickAction->execute($identifyBrickRequest->toDto());

        return PartResourceData::from($part)->toResponse();
    }
}
