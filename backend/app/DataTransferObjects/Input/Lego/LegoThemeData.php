<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Input\Lego;

/**
 * DTO for LEGO theme data from external APIs.
 */
final readonly class LegoThemeData
{
    public function __construct(
        public int $id,
        public string $name,
        public ?int $parentId,
    ) {}
}
