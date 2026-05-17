<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Input\StorageOption;

final readonly class AssignPartToStorageData
{
    public function __construct(
        public int $partId,
        public ?int $colorId,
        public int $quantity,
    ) {}
}
