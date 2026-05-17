<?php

declare(strict_types = 1);

namespace App\Exceptions;

use Exception;

use function sprintf;

final class NotFamilyHeadException extends Exception
{
    public static function forUser(int $userId): self
    {
        return new self(sprintf('User %d is not the family head and cannot perform this action', $userId));
    }
}
