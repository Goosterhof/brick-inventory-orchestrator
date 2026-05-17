<?php

declare(strict_types = 1);

namespace App\Exceptions;

use Exception;

use function sprintf;

final class InvalidInviteCodeException extends Exception
{
    public static function forCode(string $code): self
    {
        return new self(sprintf("Invite code '%s' is invalid, expired, or revoked", $code));
    }
}
