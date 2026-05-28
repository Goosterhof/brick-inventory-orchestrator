<?php

declare(strict_types = 1);

namespace App\Actions\BrickIdentification;

use App\Actions\Sync\UpsertPartAction;
use App\Contracts\BrickIdentificationServiceInterface;
use App\DataTransferObjects\Input\BrickIdentification\IdentifyBrickData;
use App\DataTransferObjects\Input\Brickognize\BrickognizePredictionData;
use App\DataTransferObjects\Input\Lego\LegoPartData;
use App\Exceptions\BrickognizeApiException;
use App\Models\Part;

final readonly class IdentifyBrickAction
{
    public function __construct(
        private BrickIdentificationServiceInterface $brickIdentificationService,
        private UpsertPartAction $upsertPartAction,
    ) {}

    /**
     * Identify a LEGO brick from an image and return the matching part.
     * If the part doesn't exist in the database, it will be created.
     *
     * @throws BrickognizeApiException
     */
    public function execute(IdentifyBrickData $identifyBrickData): Part
    {
        $predictions = $this->brickIdentificationService->identifyBrick($identifyBrickData->image);

        // Filter for part predictions only (exclude minifigs, sets, etc.)
        $partPredictions = array_filter(
            $predictions,
            static fn(BrickognizePredictionData $brickognizePredictionData): bool => $brickognizePredictionData->type === 'part',
        );

        if ($partPredictions === []) {
            throw BrickognizeApiException::noItemsFound();
        }

        // Get the highest scoring part prediction
        $bestPrediction = array_reduce(
            $partPredictions,
            static function(?BrickognizePredictionData $carry, BrickognizePredictionData $item): BrickognizePredictionData {
                if (!$carry instanceof BrickognizePredictionData || $item->score > $carry->score) {
                    return $item;
                }

                return $carry;
            },
        );

        /** @var BrickognizePredictionData $bestPrediction Already verified $partPredictions is not empty */

        // Upsert the part (create if doesn't exist, update if it does)
        $legoPartData = new LegoPartData(
            partNum: $bestPrediction->id,
            name: $bestPrediction->name,
            categoryId: null, // Brickognize doesn't provide category
            imageUrl: $bestPrediction->imageUrl,
        );

        return $this->upsertPartAction->execute($legoPartData);
    }
}
