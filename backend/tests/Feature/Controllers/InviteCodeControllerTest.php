<?php

declare(strict_types = 1);

use App\Http\Controllers\InviteCodeController;
use App\Mail\InviteCodeMail;
use App\Models\InviteCode;
use App\Models\User;
use App\Providers\AppServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

covers(InviteCodeController::class);

uses(RefreshDatabase::class);

describe('InviteCodeController', function(): void {
    describe('store', function(): void {
        it('should generate an invite code for family head', function(): void {
            $headUser = User::factory()->create();

            $response = $this->actingAs($headUser)->postJson('/api/family/invite-code');

            $response->assertStatus(201)
                ->assertJsonStructure(['id', 'code', 'expires_at', 'created_at']);

            expect($response->json('code'))->toMatch('/^BRICK-[A-Z0-9]{4}$/');

            $this->assertDatabaseHas('invite_codes', [
                'family_id' => $headUser->family_id,
                'generated_by' => $headUser->id,
            ]);
        });

        it('should revoke existing active code when generating new one', function(): void {
            $headUser = User::factory()->create();

            $existingCode = InviteCode::factory()
                ->forFamily($headUser->family)
                ->generatedBy($headUser)
                ->create();

            $response = $this->actingAs($headUser)->postJson('/api/family/invite-code');

            $response->assertStatus(201);

            $existingCode->refresh();
            expect($existingCode->revoked_at)->not->toBeNull();

            $newCode = $response->json('code');
            expect($newCode)->not->toBe($existingCode->code);
        });

        it('should return 403 when non-head member tries to generate', function(): void {
            $headUser = User::factory()->create();
            $member = User::factory()->forFamily($headUser->family)->create();

            $response = $this->actingAs($member)->postJson('/api/family/invite-code');

            $response->assertStatus(403);
        });

        it('should return 401 when unauthenticated', function(): void {
            $response = $this->postJson('/api/family/invite-code');

            $response->assertStatus(401);
        });

        it('should set expires_at based on configured TTL', function(): void {
            $this->freezeTime();
            $headUser = User::factory()->create();

            $response = $this->actingAs($headUser)->postJson('/api/family/invite-code');

            $response->assertStatus(201);

            $inviteCode = InviteCode::query()->where('code', $response->json('code'))->firstOrFail();
            expect($inviteCode->expires_at->toDateTimeString())
                ->toBe(now()->addDays((int) config('app.invite_code_ttl_days'))->toDateTimeString());
        });
    });

    describe('show', function(): void {
        it('should return the active invite code', function(): void {
            $headUser = User::factory()->create();
            $code = InviteCode::factory()
                ->forFamily($headUser->family)
                ->generatedBy($headUser)
                ->create();

            $response = $this->actingAs($headUser)->getJson('/api/family/invite-code');

            $response->assertStatus(200)
                ->assertJsonPath('code', $code->code)
                ->assertJsonStructure(['id', 'code', 'expires_at', 'created_at']);
        });

        it('should return 404 when no active code exists', function(): void {
            $headUser = User::factory()->create();

            $response = $this->actingAs($headUser)->getJson('/api/family/invite-code');

            $response->assertStatus(404)
                ->assertJsonPath('error', 'No active invite code found');
        });

        it('should return 404 when code is expired', function(): void {
            $headUser = User::factory()->create();
            InviteCode::factory()
                ->forFamily($headUser->family)
                ->generatedBy($headUser)
                ->expired()
                ->create();

            $response = $this->actingAs($headUser)->getJson('/api/family/invite-code');

            $response->assertStatus(404);
        });

        it('should return 404 when code is revoked', function(): void {
            $headUser = User::factory()->create();
            InviteCode::factory()
                ->forFamily($headUser->family)
                ->generatedBy($headUser)
                ->revoked()
                ->create();

            $response = $this->actingAs($headUser)->getJson('/api/family/invite-code');

            $response->assertStatus(404);
        });

        it('should return 403 when non-head member tries to view', function(): void {
            $headUser = User::factory()->create();
            $member = User::factory()->forFamily($headUser->family)->create();

            $response = $this->actingAs($member)->getJson('/api/family/invite-code');

            $response->assertStatus(403);
        });

        it('should return 401 when unauthenticated', function(): void {
            $response = $this->getJson('/api/family/invite-code');

            $response->assertStatus(401);
        });
    });

    describe('destroy', function(): void {
        it('should revoke the active invite code', function(): void {
            $headUser = User::factory()->create();
            $code = InviteCode::factory()
                ->forFamily($headUser->family)
                ->generatedBy($headUser)
                ->create();

            $response = $this->actingAs($headUser)->deleteJson('/api/family/invite-code');

            $response->assertStatus(204);

            $code->refresh();
            expect($code->revoked_at)->not->toBeNull();
        });

        it('should return 404 when no active code exists to revoke', function(): void {
            $headUser = User::factory()->create();

            $response = $this->actingAs($headUser)->deleteJson('/api/family/invite-code');

            $response->assertStatus(404)
                ->assertJsonPath('error', 'No active invite code found');
        });

        it('should return 403 when non-head member tries to revoke', function(): void {
            $headUser = User::factory()->create();
            $member = User::factory()->forFamily($headUser->family)->create();

            $response = $this->actingAs($member)->deleteJson('/api/family/invite-code');

            $response->assertStatus(403);
        });

        it('should return 401 when unauthenticated', function(): void {
            $response = $this->deleteJson('/api/family/invite-code');

            $response->assertStatus(401);
        });
    });

    describe('email', function(): void {
        it('should accept the request, queue the mailable, and return 202 with the new invite code envelope', function(): void {
            Mail::fake();

            $headUser = User::factory()->create();

            $response = $this->actingAs($headUser)->postJson('/api/family/invite-code/email', [
                'recipient_email' => 'kid@example.com',
                'recipient_name' => 'Kid Brickson',
            ]);

            $response->assertStatus(202)
                ->assertJsonStructure(['id', 'code', 'expires_at', 'created_at']);

            $code = $response->json('code');
            expect($code)->toMatch('/^BRICK-[A-Z0-9]{4}$/');

            Mail::assertQueued(
                InviteCodeMail::class,
                fn(InviteCodeMail $inviteCodeMail): bool => $inviteCodeMail->hasTo('kid@example.com')
                    && $inviteCodeMail->code === $code
                    && $inviteCodeMail->familyName === $headUser->family->name
                    && $inviteCodeMail->recipientName === 'Kid Brickson'
                    && str_contains($inviteCodeMail->registerUrl, '?invite=' . $code),
            );

            $this->assertDatabaseHas('invite_codes', [
                'family_id' => $headUser->family_id,
                'generated_by' => $headUser->id,
                'code' => $code,
            ]);
        });

        it('should accept a request without recipient_name and pass null through to the mailable', function(): void {
            Mail::fake();

            $headUser = User::factory()->create();

            $response = $this->actingAs($headUser)->postJson('/api/family/invite-code/email', [
                'recipient_email' => 'kid@example.com',
            ]);

            $response->assertStatus(202);

            Mail::assertQueued(
                InviteCodeMail::class,
                fn(InviteCodeMail $inviteCodeMail): bool => $inviteCodeMail->hasTo('kid@example.com')
                    && $inviteCodeMail->recipientName === null,
            );
        });

        it('should revoke any existing active code and email a fresh one', function(): void {
            Mail::fake();

            $headUser = User::factory()->create();
            $existingCode = InviteCode::factory()
                ->forFamily($headUser->family)
                ->generatedBy($headUser)
                ->create();

            $response = $this->actingAs($headUser)->postJson('/api/family/invite-code/email', [
                'recipient_email' => 'kid@example.com',
            ]);

            $response->assertStatus(202);

            $existingCode->refresh();
            expect($existingCode->revoked_at)->not->toBeNull();
            expect($response->json('code'))->not->toBe($existingCode->code);

            Mail::assertQueued(InviteCodeMail::class);
        });

        it('should return 422 when recipient_email is missing', function(): void {
            Mail::fake();

            $headUser = User::factory()->create();

            $response = $this->actingAs($headUser)->postJson('/api/family/invite-code/email', []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['recipient_email']);

            Mail::assertNothingQueued();
        });

        it('should return 422 when recipient_email is invalid', function(): void {
            Mail::fake();

            $headUser = User::factory()->create();

            $response = $this->actingAs($headUser)->postJson('/api/family/invite-code/email', [
                'recipient_email' => 'not-an-email',
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['recipient_email']);

            Mail::assertNothingQueued();
        });

        it('should return 422 when recipient_name exceeds 100 characters', function(): void {
            Mail::fake();

            $headUser = User::factory()->create();

            $response = $this->actingAs($headUser)->postJson('/api/family/invite-code/email', [
                'recipient_email' => 'kid@example.com',
                'recipient_name' => str_repeat('A', 101),
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['recipient_name']);

            Mail::assertNothingQueued();
        });

        it('should return 401 when unauthenticated', function(): void {
            Mail::fake();

            $response = $this->postJson('/api/family/invite-code/email', [
                'recipient_email' => 'kid@example.com',
            ]);

            $response->assertStatus(401);

            Mail::assertNothingQueued();
        });

        it('should return 403 when a non-head member attempts to email an invite', function(): void {
            Mail::fake();

            $headUser = User::factory()->create();
            $member = User::factory()->forFamily($headUser->family)->create();

            $response = $this->actingAs($member)->postJson('/api/family/invite-code/email', [
                'recipient_email' => 'kid@example.com',
            ]);

            $response->assertStatus(403);

            Mail::assertNothingQueued();
        });

        it('should rate-limit at 10 requests per hour per user', function(): void {
            // The default 'testing' env disables limiters; we need them on for this test.
            $this->app['env'] = 'production';

            // Force the AppServiceProvider closures to re-bind under the new env.
            $this->app->register(AppServiceProvider::class, force: true);

            // Reset any prior counters left over from sibling tests.
            RateLimiter::clear('invite-email');

            Mail::fake();

            $headUser = User::factory()->create();

            // 10 calls within the hour are allowed.
            for ($i = 0; $i < 10; $i++) {
                $response = $this->actingAs($headUser)->postJson('/api/family/invite-code/email', [
                    'recipient_email' => 'kid' . $i . '@example.com',
                ]);
                $response->assertStatus(202);
            }

            // 11th call must be throttled.
            $response = $this->actingAs($headUser)->postJson('/api/family/invite-code/email', [
                'recipient_email' => 'kid11@example.com',
            ]);

            $response->assertStatus(429);
        });
    });
});
