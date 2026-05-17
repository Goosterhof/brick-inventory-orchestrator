<?php

declare(strict_types = 1);

namespace App\Contracts;

use App\DataTransferObjects\Input\Brickognize\BrickognizePredictionData;
use App\Exceptions\BrickognizeApiException;
use App\Exceptions\InvalidApiResponseException;
use Illuminate\Http\UploadedFile;

interface BrickIdentificationServiceInterface
{
    /**
     * Identify a LEGO brick from an uploaded image.
     *
     * @throws BrickognizeApiException
     * @throws InvalidApiResponseException
     *
     * @return list<BrickognizePredictionData>
     */
    public function identifyBrick(UploadedFile $uploadedFile): array;
}
