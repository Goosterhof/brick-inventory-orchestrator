<?php

declare(strict_types = 1);

namespace App\Http\Requests\FamilySet;

use App\DataTransferObjects\Input\FamilySet\UpdateFamilySetData;
use App\Enums\FamilySetStatus;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

final class UpdateFamilySetRequest extends FormRequest
{
    private const string QUANTITY = 'quantity';

    private const string STATUS = 'status';

    private const string PURCHASE_DATE = 'purchase_date';

    private const string NOTES = 'notes';

    /**
     * @return array<string, array<int, string|Enum>>
     */
    public function rules(): array
    {
        return [
            self::QUANTITY => ['sometimes', 'integer', 'min:1'],
            self::STATUS => ['sometimes', 'string', Rule::enum(FamilySetStatus::class)],
            self::PURCHASE_DATE => ['sometimes', 'nullable', 'date'],
            self::NOTES => ['sometimes', 'nullable', 'string', 'max:65535'],
        ];
    }

    public function toDto(): UpdateFamilySetData
    {
        return new UpdateFamilySetData(
            quantity: $this->has(self::QUANTITY) ? $this->safe()->integer(self::QUANTITY) : null,
            status: $this->has(self::STATUS)
                ? FamilySetStatus::from($this->safe()->string(self::STATUS)->toString())
                : null,
            purchaseDateProvided: $this->has(self::PURCHASE_DATE),
            purchaseDate: $this->isNotFilled(self::PURCHASE_DATE)
                ? null
                : CarbonImmutable::parse($this->safe()->string(self::PURCHASE_DATE)->toString()),
            notesProvided: $this->has(self::NOTES),
            notes: $this->isNotFilled(self::NOTES) ? null : $this->safe()->string(self::NOTES)->toString(),
        );
    }
}
