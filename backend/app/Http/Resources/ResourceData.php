<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Contracts\ResourceResponseInterface;
use App\Exceptions\MissingRelationException;
use BackedEnum;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;

use function is_array;

/**
 * Base class for API responses sourced from Eloquent Models.
 * Sibling to ComputedResourceData (which handles DTO-sourced responses).
 *
 * @template TModel of Model
 */
abstract readonly class ResourceData implements ResourceResponseInterface
{
    /**
     * Relations that should be eager-loaded for this resource.
     * Single source of truth for both collection() loading and runtime validation.
     *
     * @var array<int, string>
     */
    public const array EAGER_LOAD = [];

    /**
     * Create an instance from a model.
     *
     * @param TModel $model
     */
    abstract public static function from(Model $model): static;

    // Serialization duplicated in ComputedResourceData — extract into shared mechanism if a third variant emerges

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
     * Create a collection of resources from a collection of models.
     *
     * @param Collection<int, TModel> $models
     *
     * @return array<int, static>
     */
    final public static function collection(Collection $models): array
    {
        $models->loadMissing(static::requiredRelations());

        return $models->map(
            static fn(Model $model): static => static::from($model),
        )->all();
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
     * Get the relationships that should be loaded for this resource.
     * Derived from EAGER_LOAD constant — override the constant, not this method.
     *
     * @return array<int, string>
     */
    protected static function requiredRelations(): array
    {
        return static::EAGER_LOAD;
    }

    /**
     * Validate that required relations are loaded on the model.
     *
     * @param TModel $model
     *
     * @throws MissingRelationException
     */
    protected static function validateRelationsLoaded(Model $model): void
    {
        // Only the root segment of each (possibly dotted) relation is loaded directly on this
        // model — nested segments ("set.theme") live on the related model and are validated by
        // the nested resource's own from(). relationLoaded() does not understand dot-notation, so
        // we reduce each relation to its root segment: "set.theme" -> "set", "theme" -> "theme".
        $rootRelations = array_unique(
            array_map(
                static fn(string $relation): string => explode('.', $relation)[0],
                static::requiredRelations(),
            ),
        );

        $missingRelations = array_filter(
            $rootRelations,
            static fn(string $relation): bool => !$model->relationLoaded($relation),
        );

        if ($missingRelations !== []) {
            throw MissingRelationException::forRelations(static::class, array_values($missingRelations));
        }
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
