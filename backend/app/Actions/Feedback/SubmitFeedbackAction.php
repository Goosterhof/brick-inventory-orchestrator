<?php

declare(strict_types = 1);

namespace App\Actions\Feedback;

use App\DataTransferObjects\Input\Feedback\SubmitFeedbackData;
use ScriptDevelopment\KendoReportTool\KendoReports;

final readonly class SubmitFeedbackAction
{
    /**
     * The vendor client is injected directly — the Action IS the seam.
     * A single-use FeedbackReporterInterface + adapter Service around one
     * call site would violate the no-single-use-abstractions doctrine
     * (Work Order 2026-06-09-kendo-report-filing, "Not in This Set").
     */
    public function __construct(
        private KendoReports $kendoReports,
    ) {}

    /**
     * Relay a family member's feedback to the Kendo board as a report.
     * A failed submission throws ReportSubmissionException, which bubbles
     * to the global handler (502). The null branch only exists for the
     * package's swallow mode (report-tool.swallow=true), which this app
     * does not enable — it is normalized to an empty body.
     *
     * @return array<string, mixed> the created report body (id + fields)
     */
    public function execute(SubmitFeedbackData $submitFeedbackData, string $authorName): array
    {
        return $this->kendoReports->submit(
            title: $submitFeedbackData->title,
            description: $submitFeedbackData->description,
            authorName: $authorName,
            files: $submitFeedbackData->screenshots,
        ) ?? [];
    }
}
