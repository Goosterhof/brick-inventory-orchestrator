<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Input\FamilySet;

use App\Enums\FamilySetStatus;
use DateTimeInterface;

final readonly class CreateFamilySetData
{
    public function __construct(
        public string $setNum,
        public int $quantity,
        public FamilySetStatus $status,
        public ?DateTimeInterface $purchaseDate = null,
        public ?string $notes = null,
    ) {}
}
