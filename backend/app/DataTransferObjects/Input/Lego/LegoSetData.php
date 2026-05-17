<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Input\Lego;

/**
 * DTO for LEGO set data from external APIs.
 */
final readonly class LegoSetData
{
    public function __construct(
        public string $setNum,
        public string $name,
        public int $year,
        public ?int $themeId,
        public int $numParts,
        public ?string $imageUrl,
    ) {}
}
