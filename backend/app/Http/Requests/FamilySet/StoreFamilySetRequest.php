<?php

declare(strict_types = 1);

namespace App\Http\Requests\FamilySet;

use App\DataTransferObjects\Input\FamilySet\CreateFamilySetData;
use App\Enums\FamilySetStatus;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

final class StoreFamilySetRequest extends FormRequest
{
    private const string SET_NUM = 'set_num';

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
            self::SET_NUM => ['required', 'string', 'max:255'],
            self::QUANTITY => ['sometimes', 'integer', 'min:1'],
            self::STATUS => ['sometimes', 'string', Rule::enum(FamilySetStatus::class)],
            self::PURCHASE_DATE => ['sometimes', 'nullable', 'date'],
            self::NOTES => ['sometimes', 'nullable', 'string', 'max:65535'],
        ];
    }

    public function toDto(): CreateFamilySetData
    {
        return new CreateFamilySetData(
            setNum: $this->safe()->string(self::SET_NUM)->toString(),
            quantity: $this->isNotFilled(self::QUANTITY) ? 1 : $this->safe()->integer(self::QUANTITY),
            status: $this->isNotFilled(self::STATUS)
                ? FamilySetStatus::Sealed
                : FamilySetStatus::from($this->safe()->string(self::STATUS)->toString()),
            purchaseDate: $this->isNotFilled(self::PURCHASE_DATE)
                ? null
                : CarbonImmutable::parse($this->safe()->string(self::PURCHASE_DATE)->toString()),
            notes: $this->isNotFilled(self::NOTES) ? null : $this->safe()->string(self::NOTES)->toString(),
        );
    }
}
