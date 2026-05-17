<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Result\FamilySet;

/**
 * DTO for the result of importing owned sets from Rebrickable.
 *
 * Skipped sets are those where multiple FamilySet rows exist for the same set,
 * requiring manual reconciliation.
 */
final readonly class ImportOwnedSetsResultData
{
    /**
     * @param list<string> $skippedSetNums Set numbers that were skipped due to duplicates
     */
    public function __construct(
        public int $created,
        public int $updated,
        public int $skipped,
        public int $total,
        public bool $complete,
        public array $skippedSetNums = [],
        public ?string $error = null,
    ) {}
}
