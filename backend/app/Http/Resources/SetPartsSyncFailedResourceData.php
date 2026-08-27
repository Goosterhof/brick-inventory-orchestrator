<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\DataTransferObjects\Result\Set\SetPartsResultData;

/**
 * The 502 branch of the parts/storage-map sync gate.
 *
 * Sibling to SetPartsSyncPendingResourceData. The two branches carry
 * different keys (`reason` here, `message` there), so they are two classes
 * rather than one with nullable fields — a single class would have to emit
 * a null key that neither response currently carries.
 *
 * @extends ComputedResourceData<SetPartsResultData>
 */
final readonly class SetPartsSyncFailedResourceData extends ComputedResourceData
{
    public function __construct(
        public string $set_num,
        public string $status,
        public ?string $reason,
    ) {}

    /**
     * @param SetPartsResultData $resultData
     */
    public static function from(object $resultData): static
    {
        return new self(
            set_num: $resultData->set->set_num,
            status: $resultData->status->value,
            reason: $resultData->failedReason,
        );
    }
}
