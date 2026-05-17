<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Result\Set;

final readonly class StorageMapEntryData
{
    public function __construct(
        public int $partId,
        public ?int $colorId,
        public int $storageOptionId,
        public string $storageOptionName,
        public int $quantity,
    ) {}
}
