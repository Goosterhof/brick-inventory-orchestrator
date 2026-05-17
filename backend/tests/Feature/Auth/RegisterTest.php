<?php

declare(strict_types = 1);

use App\Http\Controllers\Auth\RegisterController;
use App\Models\Family;
use App\Models\InviteCode;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Auth\Factory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;

covers(RegisterController::class);

uses(RefreshDatabase::class);

describe('RegisterController', function(): void {
    it('should register a user with a family', function(): void {
        $response = $this->postJson('/api/register', [
            'family_name' => 'Smith Family',
            'name' => 'John Smith',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['id', 'name', 'email', 'family_id']);

        $this->assertDatabaseHas('families', ['name' => 'Smith Family']);
        $this->assertDatabaseHas('users', [
            'name' => 'John Smith',
            'email' => 'john@example.com',
        ]);

        $user = User::query()->where('email', 'john@example.com')->firstOrFail();
        expect($user->family)->toBeInstanceOf(Family::class)
            ->and($user->family->name)->toBe('Smith Family');
    });

    it('should register a user with an invite code and join existing family', function(): void {
        $headUser = User::factory()->create();
        $inviteCode = InviteCode::factory()
            ->forFamily($headUser->family)
            ->generatedBy($headUser)
            ->create();

        $response = $this->postJson('/api/register', [
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'invite_code' => $inviteCode->code,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['id', 'name', 'email', 'family_id']);

        $user = User::query()->where('email', 'jane@example.com')->firstOrFail();
        expect($user->family_id)->toBe($headUser->family_id)
            ->and($user->family->head_id)->toBe($headUser->id);
    });

    it('should not set invite code user as family head', function(): void {
        $headUser = User::factory()->create();
        $inviteCode = InviteCode::factory()
            ->forFamily($headUser->family)
            ->generatedBy($headUser)
            ->create();

        $this->postJson('/api/register', [
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'invite_code' => $inviteCode->code,
        ]);

        $headUser->family->refresh();
        expect($headUser->family->head_id)->toBe($headUser->id);
    });

    it('should return 422 for invalid invite code', function(): void {
        $response = $this->postJson('/api/register', [
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'invite_code' => 'BRICK-FAKE',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'The invite code is invalid, expired, or revoked');
    });

    it('should return 422 for expired invite code', function(): void {
        $headUser = User::factory()->create();
        $inviteCode = InviteCode::factory()
            ->forFamily($headUser->family)
            ->generatedBy($headUser)
            ->expired()
            ->create();

        $response = $this->postJson('/api/register', [
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'invite_code' => $inviteCode->code,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'The invite code is invalid, expired, or revoked');
    });

    it('should return 422 for revoked invite code', function(): void {
        $headUser = User::factory()->create();
        $inviteCode = InviteCode::factory()
            ->forFamily($headUser->family)
            ->generatedBy($headUser)
            ->revoked()
            ->create();

        $response = $this->postJson('/api/register', [
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'invite_code' => $inviteCode->code,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'The invite code is invalid, expired, or revoked');
    });

    it('should not require family_name when invite_code is provided', function(): void {
        $headUser = User::factory()->create();
        $inviteCode = InviteCode::factory()
            ->forFamily($headUser->family)
            ->generatedBy($headUser)
            ->create();

        $response = $this->postJson('/api/register', [
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'invite_code' => $inviteCode->code,
        ]);

        $response->assertStatus(201);
    });

    it('should require all fields for registration', function(): void {
        $response = $this->postJson('/api/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['family_name', 'name', 'email', 'password']);
    });

    it('should require a valid email', function(): void {
        $response = $this->postJson('/api/register', [
            'family_name' => 'Smith Family',
            'name' => 'John Smith',
            'email' => 'not-an-email',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    it('should require a unique email', function(): void {
        User::factory()->create(['email' => 'john@example.com']);

        $response = $this->postJson('/api/register', [
            'family_name' => 'Smith Family',
            'name' => 'John Smith',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    it('should require password confirmation', function(): void {
        $response = $this->postJson('/api/register', [
            'family_name' => 'Smith Family',
            'name' => 'John Smith',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'different-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    });

    it('should require minimum password length', function(): void {
        $response = $this->postJson('/api/register', [
            'family_name' => 'Smith Family',
            'name' => 'John Smith',
            'email' => 'john@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    });

    it('should rate limit registration attempts', function(): void {
        RateLimiter::for('auth', fn(): Limit => Limit::perMinute(5));
        $this->freezeTime();

        for ($i = 1; $i <= 5; $i++) {
            $this->postJson('/api/register', [
                'family_name' => 'Family ' . $i,
                'name' => 'User ' . $i,
                'email' => \sprintf('user%d@example.com', $i),
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ])->assertStatus(201);

            // Reset auth state so next request is unauthenticated (same rate limiter key)
            auth()->guard('web')->logout();
            resolve(Factory::class)->forgetGuards();
        }

        $response = $this->postJson('/api/register', [
            'family_name' => 'Family 6',
            'name' => 'User 6',
            'email' => 'user6@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(429);
    });
});
