<?php

declare(strict_types = 1);

namespace App\Http\Requests\Family;

use App\DataTransferObjects\Input\Family\EmailInviteCodeData;
use Illuminate\Foundation\Http\FormRequest;

final class EmailInviteCodeRequest extends FormRequest
{
    private const string RECIPIENT_EMAIL = 'recipient_email';

    private const string RECIPIENT_NAME = 'recipient_name';

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            self::RECIPIENT_EMAIL => ['required', 'email:rfc', 'max:254'],
            self::RECIPIENT_NAME => ['nullable', 'string', 'max:100'],
        ];
    }

    public function toDto(): EmailInviteCodeData
    {
        $name = $this->safe()->has(self::RECIPIENT_NAME)
            ? mb_trim($this->safe()->string(self::RECIPIENT_NAME)->toString())
            : null;

        return new EmailInviteCodeData(
            recipientEmail: $this->safe()->string(self::RECIPIENT_EMAIL)->toString(),
            recipientName: $name === '' ? null : $name,
        );
    }
}
