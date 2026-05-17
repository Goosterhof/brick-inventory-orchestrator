<?php

declare(strict_types = 1);

namespace App\Http\Requests\StorageOption;

use App\DataTransferObjects\Input\StorageOption\AssignPartToStorageData;
use Illuminate\Foundation\Http\FormRequest;

final class AssignPartRequest extends FormRequest
{
    private const string PART_ID = 'part_id';

    private const string COLOR_ID = 'color_id';

    private const string QUANTITY = 'quantity';

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            self::PART_ID => ['required', 'integer', 'exists:parts,id'],
            self::COLOR_ID => ['nullable', 'integer', 'exists:colors,id'],
            self::QUANTITY => ['required', 'integer', 'min:0'],
        ];
    }

    public function toDto(): AssignPartToStorageData
    {
        return new AssignPartToStorageData(
            partId: $this->safe()->integer(self::PART_ID),
            colorId: $this->isNotFilled(self::COLOR_ID) ? null : $this->safe()->integer(self::COLOR_ID),
            quantity: $this->safe()->integer(self::QUANTITY),
        );
    }
}
