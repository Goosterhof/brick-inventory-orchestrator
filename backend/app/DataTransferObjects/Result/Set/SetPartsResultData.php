<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Result\Set;

use App\Enums\SetSyncStatus;
use App\Models\Set;

/**
 * Receipt for GetSetPartsAction.
 *
 * - $set: the resolved Set model (may have parts loaded if status is Completed)
 * - $status: the current sync status of the set's parts
 * - $failedReason: short reason string when $status is Failed; null otherwise
 */
final readonly class SetPartsResultData
{
    public function __construct(
        public Set $set,
        public SetSyncStatus $status,
        public ?string $failedReason,
    ) {}
}
