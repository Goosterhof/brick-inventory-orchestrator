<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Contracts\ResourceResponseInterface;
use BackedEnum;
use DateTimeInterface;
use Illuminate\Http\JsonResponse;

use function is_array;

/**
 * Base class for API responses sourced from Result DTOs (Action return values).
 * Sibling to ResourceData (which handles Model-sourced responses).
 *
 * Subclasses declare their own narrowed `from()` signature targeting the specific
 * Result DTO they shape — LSP-compatible covariant parameters are fine here because
 * each subclass is final and owns its serialisation contract.
 *
 * @template TSource of object
 */
abstract readonly class ComputedResourceData implements ResourceResponseInterface
{
    /**
     * Create an instance from a Result DTO.
     *
     * @param TSource $resultData
     */
    abstract public static function from(object $resultData): static;

    // Serialization duplicated from ResourceData — extract into shared mechanism if a third variant emerges

    /**
     * Convert the resource to an array.
     *
     * @return array<string, mixed>
     */
    final public function toArray(): array
    {
        /** @var array<string, mixed> */
        return array_map(
            $this->transformValue(...),
            get_object_vars($this),
        );
    }

    /**
     * @return array<string, mixed>
     */
    final public function jsonSerialize(): array
    {
        return $this->toArray();
    }

    final public function toResponse(mixed $request = null): JsonResponse
    {
        return new JsonResponse($this->toArray());
    }

    /**
     * Create a JSON response with a specific status code.
     */
    final public function toResponseWithStatus(int $status): JsonResponse
    {
        return new JsonResponse($this->toArray(), $status);
    }

    /**
     * Transform a value for array output.
     */
    protected function transformValue(mixed $value): mixed
    {
        if ($value instanceof ResourceResponseInterface) {
            return $value->toArray();
        }

        if ($value instanceof BackedEnum) {
            return $value->value;
        }

        if ($value instanceof DateTimeInterface) {
            return $value->format('c');
        }

        if (is_array($value)) {
            return array_map($this->transformValue(...), $value);
        }

        return $value;
    }
}
