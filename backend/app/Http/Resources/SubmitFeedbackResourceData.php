<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\DataTransferObjects\Result\Feedback\SubmitFeedbackResultData;

/**
 * @extends ComputedResourceData<SubmitFeedbackResultData>
 */
final readonly class SubmitFeedbackResourceData extends ComputedResourceData
{
    public function __construct(
        public ?int $id,
    ) {}

    /**
     * @param SubmitFeedbackResultData $resultData
     */
    public static function from(object $resultData): static
    {
        return new self(id: $resultData->reportId);
    }
}
