<?php

declare(strict_types = 1);

namespace App\Actions\Family;

use App\DataTransferObjects\Input\Family\SetRebrickableTokenData;
use App\Exceptions\NotFamilyHeadException;
use App\Models\Family;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;

final readonly class SetRebrickableTokenAction
{
    public function __construct(
        private ConnectionInterface $connection,
    ) {}

    public function execute(Family $family, SetRebrickableTokenData $setRebrickableTokenData, User $user): Family
    {
        if ($family->head_id !== $user->id) {
            throw NotFamilyHeadException::forUser($user->id);
        }

        return $this->connection->transaction(function() use ($family, $setRebrickableTokenData): Family {
            $family->rebrickable_user_token = $setRebrickableTokenData->rebrickableUserToken;
            $family->save();

            return $family;
        });
    }
}
