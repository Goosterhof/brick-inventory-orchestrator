<?php

declare(strict_types = 1);

use App\Http\Controllers\Auth\MeController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

covers(MeController::class);

uses(RefreshDatabase::class);

describe('MeController', function(): void {
    it('should return the authenticated user', function(): void {
        $user = User::factory()->create([
            'name' => 'John Smith',
            'email' => 'john@example.com',
        ]);
        $this->actingAs($user);

        $response = $this->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJson([
                'id' => $user->id,
                'name' => 'John Smith',
                'email' => 'john@example.com',
            ]);
    });

    it('should return 401 for unauthenticated user', function(): void {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401);
    });
});
