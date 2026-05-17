<?php

declare(strict_types = 1);

namespace App\Exceptions;

use function sprintf;

/**
 * Exception thrown when a LEGO set is not found in the Rebrickable API.
 */
final class SetNotFoundException extends RebrickableApiException
{
    public static function forSetNum(string $setNum): self
    {
        return new self(
            message: sprintf("Set '%s' not found in Rebrickable", $setNum),
            statusCode: 404,
        );
    }

    public static function forEan(string $ean): self
    {
        return new self(
            message: sprintf("No set found for EAN '%s' in Rebrickable", $ean),
            statusCode: 404,
        );
    }
}
