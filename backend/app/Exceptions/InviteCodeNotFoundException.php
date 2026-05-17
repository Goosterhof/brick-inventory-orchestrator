<?php

declare(strict_types = 1);

namespace App\Exceptions;

use Exception;

use function sprintf;

final class InviteCodeNotFoundException extends Exception
{
    public static function forFamily(int $familyId): self
    {
        return new self(sprintf('No active invite code found for family %d', $familyId));
    }
}
