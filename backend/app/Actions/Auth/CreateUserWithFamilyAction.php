<?php

declare(strict_types = 1);

namespace App\Actions\Auth;

use App\DataTransferObjects\Input\Auth\RegisterUserData;
use App\Exceptions\InvalidInviteCodeException;
use App\Models\Family;
use App\Models\InviteCode;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;

use function assert;

final readonly class CreateUserWithFamilyAction
{
    public function __construct(
        private User $user,
        private Family $family,
        private InviteCode $inviteCode,
        private ConnectionInterface $connection,
    ) {}

    public function execute(RegisterUserData $registerUserData): User
    {
        return $this->connection->transaction(function() use ($registerUserData): User {
            if ($registerUserData->inviteCode !== null && $registerUserData->inviteCode !== '') {
                return $this->joinExistingFamily($registerUserData);
            }

            return $this->createNewFamily($registerUserData);
        });
    }

    private function createNewFamily(RegisterUserData $registerUserData): User
    {
        assert($registerUserData->familyName !== null, 'familyName is required when not using an invite code');

        $family = $this->family->newInstance();
        $family->name = $registerUserData->familyName;
        $family->save();

        $user = $this->user->newInstance();
        $user->name = $registerUserData->name;
        $user->email = $registerUserData->email;
        $user->password = $registerUserData->password;

        $family->users()->save($user);

        /** @var positive-int $userId */
        $userId = $user->id;
        $family->head_id = $userId;
        $family->save();

        return $user;
    }

    private function joinExistingFamily(RegisterUserData $registerUserData): User
    {
        /** @var InviteCode|null $inviteCode */
        $inviteCode = $this->inviteCode->newQuery()
            ->where('code', $registerUserData->inviteCode)
            ->active()
            ->first();

        if ($inviteCode === null) {
            throw InvalidInviteCodeException::forCode((string) $registerUserData->inviteCode);
        }

        /** @var Family $family */
        $family = $inviteCode->family;

        $user = $this->user->newInstance();
        $user->name = $registerUserData->name;
        $user->email = $registerUserData->email;
        $user->password = $registerUserData->password;

        $family->users()->save($user);

        return $user;
    }
}
