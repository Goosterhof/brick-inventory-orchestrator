<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Input\Family;

final readonly class EmailInviteCodeData
{
    public function __construct(
        public string $recipientEmail,
        public ?string $recipientName,
    ) {}
}
