<?php

declare(strict_types = 1);

namespace App\Http\Requests\Feedback;

use App\DataTransferObjects\Input\Feedback\SubmitFeedbackData;
use Illuminate\Foundation\Http\FormRequest;

use function array_values;
use function is_array;

final class SubmitFeedbackRequest extends FormRequest
{
    private const string TITLE = 'title';

    private const string DESCRIPTION = 'description';

    private const string SCREENSHOTS = 'screenshots';

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            self::TITLE => ['required', 'string', 'max:255'],
            self::DESCRIPTION => ['required', 'string', 'max:65535'],
            self::SCREENSHOTS => ['nullable', 'array', 'max:5'],
            self::SCREENSHOTS . '.*' => ['image', 'mimes:jpg,jpeg,png,bmp,gif,tiff,webp', 'max:3072'],
        ];
    }

    public function toDto(): SubmitFeedbackData
    {
        $screenshots = $this->file(self::SCREENSHOTS);

        return new SubmitFeedbackData(
            title: $this->safe()->string(self::TITLE)->toString(),
            description: $this->safe()->string(self::DESCRIPTION)->toString(),
            screenshots: is_array($screenshots) ? array_values($screenshots) : [],
        );
    }
}
