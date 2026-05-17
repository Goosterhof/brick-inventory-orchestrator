<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Input\StorageOption;

final readonly class StorageOptionData
{
    public function __construct(
        public string $name,
        public ?string $description = null,
        public ?int $parentId = null,
        public ?int $row = null,
        public ?int $column = null,
        public ?int $gridRows = null,
        public ?int $gridColumns = null,
    ) {}
}
