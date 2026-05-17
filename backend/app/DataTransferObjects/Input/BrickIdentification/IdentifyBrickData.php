<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Input\BrickIdentification;

use Illuminate\Http\UploadedFile;

final readonly class IdentifyBrickData
{
    public function __construct(
        public UploadedFile $image,
    ) {}
}
