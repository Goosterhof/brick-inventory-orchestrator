<?php

declare(strict_types = 1);

namespace App\Policies;

use App\Models\User;

final readonly class SetPolicy
{
    public function viewParts(User $user): bool
    {
        return true;
    }

    public function lookupByEan(User $user): bool
    {
        return true;
    }

    public function viewStorageMap(User $user): bool
    {
        return true;
    }
}
