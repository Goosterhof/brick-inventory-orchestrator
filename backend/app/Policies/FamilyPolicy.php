<?php

declare(strict_types = 1);

namespace App\Policies;

use App\Models\User;

final readonly class FamilyPolicy
{
    public function viewMembers(User $user): bool
    {
        return true;
    }

    public function viewParts(User $user): bool
    {
        return true;
    }

    public function viewStats(User $user): bool
    {
        return true;
    }

    public function viewBrickDna(User $user): bool
    {
        return true;
    }

    public function setRebrickableToken(User $user): bool
    {
        return $user->family->head_id === $user->id;
    }

    public function removeMember(User $user): bool
    {
        return $user->family->head_id === $user->id;
    }

    public function generateInviteCode(User $user): bool
    {
        return $user->family->head_id === $user->id;
    }

    public function viewInviteCode(User $user): bool
    {
        return $user->family->head_id === $user->id;
    }

    public function revokeInviteCode(User $user): bool
    {
        return $user->family->head_id === $user->id;
    }
}
