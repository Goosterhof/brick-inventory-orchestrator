<?php

declare(strict_types = 1);

namespace App\Policies;

use App\Models\StorageOption;
use App\Models\User;

final readonly class StorageOptionPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, StorageOption $storageOption): bool
    {
        return $storageOption->family_id === $user->family_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, StorageOption $storageOption): bool
    {
        return $storageOption->family_id === $user->family_id;
    }

    public function delete(User $user, StorageOption $storageOption): bool
    {
        return $storageOption->family_id === $user->family_id;
    }

    public function assignPart(User $user, StorageOption $storageOption): bool
    {
        return $storageOption->family_id === $user->family_id;
    }

    public function viewParts(User $user, StorageOption $storageOption): bool
    {
        return $storageOption->family_id === $user->family_id;
    }
}
