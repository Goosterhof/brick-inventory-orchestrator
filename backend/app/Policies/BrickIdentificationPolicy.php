<?php

declare(strict_types = 1);

namespace App\Policies;

use App\Models\User;

final readonly class BrickIdentificationPolicy
{
    public function identify(User $user): bool
    {
        return true;
    }
}
