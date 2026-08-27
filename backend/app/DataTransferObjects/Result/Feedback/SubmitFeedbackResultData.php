<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Result\Feedback;

/**
 * Receipt for SubmitFeedbackAction.
 *
 * - $reportId: the Kendo report id from a successful 201; null when the
 *   package's swallow mode returned no body (report-tool.swallow=true,
 *   which this app does not enable).
 *
 * The Kendo 201 body is a third-party shape. This DTO pins the one field
 * the app owns a meaning for — the created report's identifier — rather
 * than re-exporting a payload whose keys another team controls.
 */
final readonly class SubmitFeedbackResultData
{
    public function __construct(
        public ?int $reportId,
    ) {}
}
