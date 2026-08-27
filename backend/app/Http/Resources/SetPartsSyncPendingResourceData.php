<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\DataTransferObjects\Result\Set\SetPartsResultData;

/**
 * The 202 branch of the parts/storage-map sync gate.
 *
 * Sibling to SetPartsSyncFailedResourceData — see that class for why the
 * two branches are separate types.
 *
 * @extends ComputedResourceData<SetPartsResultData>
 */
final readonly class SetPartsSyncPendingResourceData extends ComputedResourceData
{
    private const string RETRY_MESSAGE = 'Set parts are syncing — please retry shortly.';

    public function __construct(
        public string $set_num,
        public string $status,
        public string $message,
    ) {}

    /**
     * @param SetPartsResultData $resultData
     */
    public static function from(object $resultData): static
    {
        return new self(
            set_num: $resultData->set->set_num,
            status: $resultData->status->value,
            message: self::RETRY_MESSAGE,
        );
    }
}
