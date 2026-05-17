<?php

declare(strict_types = 1);

namespace App\Exceptions;

use Exception;
use Illuminate\Http\Client\Response;

/**
 * Base exception for external API errors.
 */
abstract class ExternalApiException extends Exception
{
    public function __construct(
        string $message,
        public readonly ?int $statusCode = null,
        public readonly ?Response $response = null,
    ) {
        parent::__construct($message);
    }
}
