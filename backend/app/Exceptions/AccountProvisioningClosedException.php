<?php

declare(strict_types = 1);

namespace App\Exceptions;

use RuntimeException;

use function sprintf;

final class AccountProvisioningClosedException extends RuntimeException
{
    public static function forInsert(string $path): self
    {
        return new self(sprintf(
            'A User row may only be inserted while the account provisioning permit is open (WR-2128); refused: %s.',
            $path,
        ));
    }
}
