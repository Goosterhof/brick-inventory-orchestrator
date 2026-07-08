<?php

declare(strict_types = 1);

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

covers(User::class);

uses(RefreshDatabase::class);

describe('User', function(): void {
    it('should hide password and remember_token when serialized', function(): void {
        $user = User::factory()->create();

        $array = $user->toArray();

        expect($array)->not->toHaveKeys(['password', 'remember_token'])
            ->and($array)->toHaveKey('name', $user->name)
            ->and($array)->toHaveKey('email', $user->email);
    });
});
