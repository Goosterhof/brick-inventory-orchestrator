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
});
