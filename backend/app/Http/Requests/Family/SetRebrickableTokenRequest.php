<?php

declare(strict_types = 1);

namespace App\Http\Requests\Family;

use App\DataTransferObjects\Input\Family\SetRebrickableTokenData;
use Illuminate\Foundation\Http\FormRequest;

final class SetRebrickableTokenRequest extends FormRequest
{
    private const string REBRICKABLE_USER_TOKEN = 'rebrickable_user_token';

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            self::REBRICKABLE_USER_TOKEN => ['required', 'string', 'max:255'],
        ];
    }

    public function toDto(): SetRebrickableTokenData
    {
        return new SetRebrickableTokenData(
            rebrickableUserToken: $this->safe()->string(self::REBRICKABLE_USER_TOKEN)->toString(),
        );
    }
}
