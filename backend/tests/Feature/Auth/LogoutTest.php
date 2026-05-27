<?php

declare(strict_types = 1);

use App\Http\Controllers\Auth\LogoutController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

covers(LogoutController::class);

uses(RefreshDatabase::class);

describe('LogoutController', function(): void {
    it('should logout an authenticated user', function(): void {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/logout');

        $response->assertStatus(204);

        $this->assertGuest('web');
    });

    it('should return 401 for unauthenticated user', function(): void {
        $response = $this->postJson('/api/logout');

        $response->assertStatus(401);
    });

    it('should invalidate the session and regenerate the CSRF token when the request is stateful', function(): void {
        $user = User::factory()->create();

        // Start a session so the testing helpers and the request both bind to the same session store.
        // Sending a Referer matching a stateful domain triggers Sanctum's EnsureFrontendRequestsAreStateful
        // middleware, which prepends StartSession into the pipeline and causes $request->hasSession() to
        // return true inside the controller — the precondition for lines 19-20 to execute.
        $this->withSession([])
            ->actingAs($user, 'web');

        $sessionIdBefore = $this->app['session']->getId();
        $tokenBefore = $this->app['session']->token();

        $response = $this->post('/api/logout', [], [
            'Referer' => 'http://localhost',
        ]);

        $response->assertStatus(204);

        // assertGuest('web') confirms $statefulGuard->logout() ran on line 16.
        $this->assertGuest('web');

        // Lines 19-20 of LogoutController: invalidate() rotates the session id and flushes its data;
        // regenerateToken() rotates the CSRF token. Asserting both rotated values are non-empty and
        // distinct from the pre-call values exercises the body of the hasSession() branch.
        $sessionIdAfter = $this->app['session']->getId();
        $tokenAfter = $this->app['session']->token();

        expect($sessionIdAfter)->not->toBe($sessionIdBefore)->not->toBe('');
        expect($tokenAfter)->not->toBe($tokenBefore)->not->toBe('');
    });
});
