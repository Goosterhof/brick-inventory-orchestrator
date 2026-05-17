<?php

declare(strict_types = 1);

namespace App\Exceptions;

use Exception;

use function sprintf;

final class MissingRebrickableTokenException extends Exception
{
    public static function forFamily(int $familyId): self
    {
        return new self(sprintf('Family %d does not have a Rebrickable user token configured', $familyId));
    }
}
