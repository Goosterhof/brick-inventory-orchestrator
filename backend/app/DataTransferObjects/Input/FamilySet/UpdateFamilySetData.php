<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Input\FamilySet;

use App\Enums\FamilySetStatus;
use DateTimeInterface;

final readonly class UpdateFamilySetData
{
    public function __construct(
        public ?int $quantity = null,
        public ?FamilySetStatus $status = null,
        public bool $purchaseDateProvided = false,
        public ?DateTimeInterface $purchaseDate = null,
        public bool $notesProvided = false,
        public ?string $notes = null,
    ) {}
}
