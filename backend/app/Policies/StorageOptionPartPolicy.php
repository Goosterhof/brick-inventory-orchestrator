<?php

declare(strict_types = 1);

namespace App\Policies;

use App\Models\StorageOptionPart;
use App\Models\User;

final readonly class StorageOptionPartPolicy
{
    public function delete(User $user, StorageOptionPart $storageOptionPart): bool
    {
        return $storageOptionPart->storageOption !== null
            && $storageOptionPart->storageOption->family_id === $user->family_id;
    }
}
