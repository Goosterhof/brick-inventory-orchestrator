<?php

declare(strict_types = 1);

namespace App\Http\Requests\Auth;

use App\DataTransferObjects\Input\Auth\LoginUserData;
use Illuminate\Foundation\Http\FormRequest;

final class LoginRequest extends FormRequest
{
    private const string EMAIL = 'email';

    private const string PASSWORD = 'password';

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            self::EMAIL => ['required', 'string', 'email'],
            self::PASSWORD => ['required', 'string'],
        ];
    }

    public function toDto(): LoginUserData
    {
        return new LoginUserData(
            email: $this->safe()->string(self::EMAIL)->toString(),
            password: $this->safe()->string(self::PASSWORD)->toString(),
        );
    }
}
