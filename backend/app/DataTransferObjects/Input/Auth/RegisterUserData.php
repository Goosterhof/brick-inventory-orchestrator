<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Input\Auth;

final readonly class RegisterUserData
{
    public function __construct(
        public ?string $familyName,
        public string $name,
        public string $email,
        public string $password,
        public ?string $inviteCode = null,
    ) {}
}
