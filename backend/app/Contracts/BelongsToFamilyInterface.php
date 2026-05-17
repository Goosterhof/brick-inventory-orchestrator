<?php

declare(strict_types = 1);

namespace App\Contracts;

/**
 * Interface for models that belong to a family (tenant).
 *
 * Models implementing this interface can be automatically
 * checked for family ownership via middleware.
 */
interface BelongsToFamilyInterface
{
    public function getFamilyId(): int;
}
