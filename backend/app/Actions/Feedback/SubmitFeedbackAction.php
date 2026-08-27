<?php

declare(strict_types = 1);

namespace App\Actions\Feedback;

use App\DataTransferObjects\Input\Feedback\SubmitFeedbackData;
use App\DataTransferObjects\Result\Feedback\SubmitFeedbackResultData;
use ScriptDevelopment\KendoReportTool\KendoReports;

use function is_numeric;

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
     * does not enable — it yields a receipt with a null reportId.
     */
    public function execute(SubmitFeedbackData $submitFeedbackData, string $authorName): SubmitFeedbackResultData
    {
        $reportBody = $this->kendoReports->submit(
            title: $submitFeedbackData->title,
            description: $submitFeedbackData->description,
            authorName: $authorName,
            files: $submitFeedbackData->screenshots,
        ) ?? [];

        $reportId = $reportBody['id'] ?? null;

        return new SubmitFeedbackResultData(
            reportId: is_numeric($reportId) ? (int) $reportId : null,
        );
    }
}
