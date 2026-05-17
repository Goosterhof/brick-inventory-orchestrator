<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Input\Brickognize;

/**
 * DTO for a single Brickognize prediction result.
 */
final readonly class BrickognizePredictionData
{
    public function __construct(
        public string $id,
        public string $name,
        public string $type,
        public ?string $imageUrl,
        public float $score,
    ) {}
}
