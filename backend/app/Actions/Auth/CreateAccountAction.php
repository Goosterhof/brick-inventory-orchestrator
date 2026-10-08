<?php

declare(strict_types = 1);

namespace App\Actions\Auth;

use App\DataTransferObjects\Input\Auth\CreateAccountData;
use App\Models\Family;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;

/**
 * WR-2118: the only User/Family creation path. Invoked by the account:create console
 * command alone — PersonalAppArchitectureTest fails if anything outside App\Console uses it.
 */
final readonly class CreateAccountAction
{
    public function __construct(
        private User $user,
        private Family $family,
        private ConnectionInterface $connection,
    ) {}

    public function execute(CreateAccountData $createAccountData): User
    {
        return $this->connection->transaction(function() use ($createAccountData): User {
            $family = $this->family->newInstance();
            $family->name = $createAccountData->familyName;
            $family->save();

            $user = $this->user->newInstance();
            $user->name = $createAccountData->name;
            $user->email = $createAccountData->email;
            $user->password = $createAccountData->password;

            $family->users()->save($user);

            /** @var positive-int $userId */
            $userId = $user->id;
            $family->head_id = $userId;
            $family->save();

            return $user;
        });
    }
}
