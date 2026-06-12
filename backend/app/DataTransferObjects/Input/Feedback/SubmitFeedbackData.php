<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Input\Feedback;

use Illuminate\Http\UploadedFile;

final readonly class SubmitFeedbackData
{
    /**
     * @param list<UploadedFile> $screenshots
     */
    public function __construct(
        public string $title,
        public string $description,
        public array $screenshots,
    ) {}
}
