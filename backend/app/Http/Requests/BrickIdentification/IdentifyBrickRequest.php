<?php

declare(strict_types = 1);

namespace App\Http\Requests\BrickIdentification;

use App\DataTransferObjects\Input\BrickIdentification\IdentifyBrickData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

use function assert;

final class IdentifyBrickRequest extends FormRequest
{
    private const string IMAGE = 'image';

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            self::IMAGE => ['required', 'image', 'max:10240'], // Max 10MB
        ];
    }

    public function toDto(): IdentifyBrickData
    {
        $image = $this->file(self::IMAGE);
        assert($image instanceof UploadedFile);

        return new IdentifyBrickData(image: $image);
    }
}
