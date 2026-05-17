<?php

declare(strict_types = 1);

namespace App\Actions\Family;

use App\Exceptions\CannotRemoveSelfException;
use App\Exceptions\NotFamilyHeadException;
use App\Exceptions\UserNotInFamilyException;
use App\Models\Family;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;

final readonly class RemoveFamilyMemberAction
{
    public function __construct(
        private Family $family,
        private ConnectionInterface $connection,
    ) {}

    public function execute(Family $family, User $member, User $actor): void
    {
        if ($family->head_id !== $actor->id) {
            throw NotFamilyHeadException::forUser($actor->id);
        }

        if ($actor->id === $member->id) {
            throw CannotRemoveSelfException::forUser($actor->id);
        }

        if ($member->family_id !== $family->id) {
            throw UserNotInFamilyException::forUser($member->id, $family->id);
        }

        $this->connection->transaction(function() use ($member): void {
            $newFamily = $this->family->newInstance();
            $newFamily->name = $member->name . "'s Family";
            $newFamily->save();

            $member->family_id = $newFamily->id;
            $member->save();

            /** @var positive-int $memberId */
            $memberId = $member->id;
            $newFamily->head_id = $memberId;
            $newFamily->save();
        });
    }
}
