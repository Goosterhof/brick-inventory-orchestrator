<?php

declare(strict_types = 1);

namespace App\Contracts;

use Illuminate\Http\JsonResponse;
use JsonSerializable;

interface ResourceResponseInterface extends JsonSerializable
{
    /**
     * Convert the resource to an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array;

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array;

    public function toResponse(mixed $request = null): JsonResponse;

    /**
     * Create a JSON response with a specific status code.
     */
    public function toResponseWithStatus(int $status): JsonResponse;
}
