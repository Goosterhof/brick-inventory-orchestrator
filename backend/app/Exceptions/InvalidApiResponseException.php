<?php

declare(strict_types = 1);

namespace App\Exceptions;

use function sprintf;

/**
 * Exception thrown when an external API returns an unexpected response structure.
 */
final class InvalidApiResponseException extends ExternalApiException
{
    /**
     * @param list<string> $missingFields
     */
    public static function missingFields(array $missingFields, string $context = ''): self
    {
        $fieldsStr = implode(', ', $missingFields);
        $message = $context !== ''
            ? sprintf('%s: Missing required fields: %s', $context, $fieldsStr)
            : sprintf('Invalid API response: Missing required fields: %s', $fieldsStr);

        return new self($message);
    }

    public static function invalidStructure(string $context, string $details = ''): self
    {
        $message = $details !== ''
            ? sprintf('%s: Invalid response structure - %s', $context, $details)
            : sprintf('%s: Invalid response structure', $context);

        return new self($message);
    }
}
