<?php

declare(strict_types = 1);

namespace App\Exceptions;

use Illuminate\Http\Client\Response;

use function sprintf;

/**
 * Exception thrown when the Brickognize API returns an error or unexpected response.
 */
final class BrickognizeApiException extends ExternalApiException
{
    public static function fromResponse(Response $response, string $context = ''): self
    {
        $message = $context !== ''
            ? sprintf('%s: HTTP %d', $context, $response->status())
            : sprintf('Brickognize API error: HTTP %d', $response->status());

        return new self($message, $response->status(), $response);
    }

    public static function noItemsFound(): self
    {
        return new self('No LEGO parts could be identified in the image');
    }
}
