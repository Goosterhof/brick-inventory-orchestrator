<?php

declare(strict_types = 1);

namespace App\Http\Requests\Auth;

use App\DataTransferObjects\Input\Auth\RegisterUserData;
use Illuminate\Foundation\Http\FormRequest;

final class RegisterRequest extends FormRequest
{
    private const string FAMILY_NAME = 'family_name';

    private const string NAME = 'name';

    private const string EMAIL = 'email';

    private const string PASSWORD = 'password';

    private const string PASSWORD_CONFIRMATION = 'password_confirmation';

    private const string INVITE_CODE = 'invite_code';

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            self::FAMILY_NAME => ['required_without:invite_code', 'nullable', 'string', 'max:255'],
            self::NAME => ['required', 'string', 'max:255'],
            self::EMAIL => ['required', 'string', 'email', 'max:255', 'unique:users'],
            self::PASSWORD => ['required', 'string', 'min:8'],
            self::PASSWORD_CONFIRMATION => ['required', 'same:password'],
            self::INVITE_CODE => ['sometimes', 'nullable', 'string', 'max:10'],
        ];
    }

    public function toDto(): RegisterUserData
    {
        return new RegisterUserData(
            familyName: $this->safe()->has(self::FAMILY_NAME)
                ? $this->safe()->string(self::FAMILY_NAME)->toString()
                : null,
            name: $this->safe()->string(self::NAME)->toString(),
            email: $this->safe()->string(self::EMAIL)->toString(),
            password: $this->safe()->string(self::PASSWORD)->toString(),
            inviteCode: $this->safe()->has(self::INVITE_CODE)
                ? $this->safe()->string(self::INVITE_CODE)->toString()
                : null,
        );
    }
}
