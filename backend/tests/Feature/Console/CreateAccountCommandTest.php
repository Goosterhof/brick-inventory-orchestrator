<?php

declare(strict_types = 1);

use App\Console\Commands\CreateAccountCommand;
use App\Models\Family;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

covers(CreateAccountCommand::class);

uses(RefreshDatabase::class);

describe('account:create command', function(): void {
    it('should create a user who heads a new family and can authenticate', function(): void {
        // act
        $exitCode = Artisan::call('account:create', [
            'email' => 'owner@example.com',
            'password' => 'secret-password',
            '--name' => 'The Owner',
            '--family' => 'The Bricks',
        ]);
        $output = Artisan::output();

        // assert
        $user = User::query()->where('email', 'owner@example.com')->sole();
        $family = Family::query()->findOrFail($user->family_id);

        expect($exitCode)->toBe(0)
            ->and($output)->toContain(\sprintf('Account created: user=%d family=%d', $user->id, $family->id))
            ->and($user->name)->toBe('The Owner')
            ->and(Hash::check('secret-password', $user->password))->toBeTrue()
            ->and($family->name)->toBe('The Bricks')
            ->and($family->head_id)->toBe($user->id);
    });

    it('should apply the default name and family name', function(): void {
        // act
        Artisan::call('account:create', ['email' => 'default@example.com', 'password' => 'secret-password']);

        // assert
        $user = User::query()->where('email', 'default@example.com')->sole();

        expect($user->name)->toBe('Owner')
            ->and($user->family->name)->toBe('Family');
    });
});
