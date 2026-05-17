<?php

declare(strict_types = 1);

namespace App\Exceptions;

use Exception;

use function sprintf;

final class ImportAlreadyInProgressException extends Exception
{
    public static function forFamily(int $familyId): self
    {
        return new self(sprintf('Family %d already has an import in progress', $familyId));
    }
}
