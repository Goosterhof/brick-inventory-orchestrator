<?php

declare(strict_types = 1);

namespace App\Exceptions;

use RuntimeException;

use function sprintf;

/**
 * Exception thrown when a required Eloquent relation is not loaded on a model.
 */
final class MissingRelationException extends RuntimeException
{
    /**
     * @param list<string> $relations
     */
    public static function forRelations(string $resourceClass, array $relations): self
    {
        $relationsStr = implode(', ', $relations);

        return new self(
            sprintf('%s is missing required relation(s): %s', $resourceClass, $relationsStr),
        );
    }

    public static function forRelation(string $resourceClass, string $relation): self
    {
        return self::forRelations($resourceClass, [$relation]);
    }
}
