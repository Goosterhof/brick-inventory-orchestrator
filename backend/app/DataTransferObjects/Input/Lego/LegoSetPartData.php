<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Input\Lego;

/**
 * DTO for a part within a LEGO set from external APIs.
 */
final readonly class LegoSetPartData
{
    public function __construct(
        public LegoPartData $part,
        public LegoColorData $color,
        public int $quantity,
        public bool $isSpare,
        public ?string $elementId,
    ) {}
}
