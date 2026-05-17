<?php

declare(strict_types = 1);

namespace App\Exceptions;

use Exception;

use function sprintf;

final class UserNotInFamilyException extends Exception
{
    public static function forUser(int $userId, int $familyId): self
    {
        return new self(sprintf('User %d is not a member of family %d', $userId, $familyId));
    }
}
