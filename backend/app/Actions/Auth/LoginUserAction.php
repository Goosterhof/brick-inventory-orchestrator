<?php

declare(strict_types = 1);

namespace App\Actions\Auth;

use App\DataTransferObjects\Input\Auth\LoginUserData;
use App\Models\User;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Validation\ValidationException;

final readonly class LoginUserAction
{
    public function __construct(
        private User $user,
        private Hasher $hasher,
    ) {}

    public function execute(LoginUserData $loginUserData): User
    {
        $user = $this->user->newQuery()->where('email', $loginUserData->email)->first();

        if ($user === null || !$this->hasher->check($loginUserData->password, $user->password)) {
            throw ValidationException::withMessages(['email' => ['The provided credentials are incorrect.']]);
        }

        return $user;
    }
}
