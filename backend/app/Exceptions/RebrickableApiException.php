<?php

declare(strict_types = 1);

namespace App\Exceptions;

use Illuminate\Http\Client\Response;

use function sprintf;

/**
 * Exception thrown when the Rebrickable API returns an error.
 */
class RebrickableApiException extends ExternalApiException
{
    public static function fromResponse(Response $response, string $context = ''): self
    {
        $message = $context !== ''
            ? sprintf('%s: HTTP %d', $context, $response->status())
            : sprintf('Rebrickable API error: HTTP %d', $response->status());

        return new self($message, $response->status(), $response);
    }
}
