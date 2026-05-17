<?php

declare(strict_types = 1);

use App\Enums\FamilySetStatus;
use App\Http\Controllers\FamilyController;
use App\Models\FamilySet;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

covers(FamilyController::class);

uses(RefreshDatabase::class);

describe('FamilyController', function(): void {
    describe('members', function(): void {
        it('should return family members with head flag', function(): void {
            $headUser = User::factory()->create();
            $member = User::factory()->forFamily($headUser->family)->create();

            $response = $this->actingAs($headUser)->getJson('/api/family/members');

            $response->assertStatus(200)
                ->assertJsonCount(2)
                ->assertJsonPath('0.name', $headUser->name)
                ->assertJsonPath('0.is_head', true)
                ->assertJsonPath('1.name', $member->name)
                ->assertJsonPath('1.is_head', false);
        });

        it('should not include other families members', function(): void {
            $user = User::factory()->create();
            User::factory()->create(); // different family

            $response = $this->actingAs($user)->getJson('/api/family/members');

            $response->assertStatus(200)
                ->assertJsonCount(1);
        });

        it('should return 401 when unauthenticated', function(): void {
            $response = $this->getJson('/api/family/members');

            $response->assertStatus(401);
        });
    });

    describe('parts', function(): void {
        it('should return parts for authenticated user', function(): void {
            $user = User::factory()->create();
            $family = $user->family;

            $storageOption = StorageOption::factory()->forFamily($family)->create();
            StorageOptionPart::factory()->forStorageOption($storageOption)->create(['quantity' => 5]);

            $response = $this->actingAs($user)->getJson('/api/family/parts');

            $response->assertStatus(200)
                ->assertJsonCount(1, 'data')
                ->assertJsonStructure(['data', 'path', 'per_page', 'next_cursor', 'next_page_url', 'prev_cursor', 'prev_page_url']);
        });

        it('should return 401 when unauthenticated', function(): void {
            $response = $this->getJson('/api/family/parts');

            $response->assertStatus(401);
        });

        it('should not return parts from another family', function(): void {
            $user = User::factory()->create();
            $otherUser = User::factory()->create();

            $otherStorageOption = StorageOption::factory()->forFamily($otherUser->family)->create();
            StorageOptionPart::factory()->forStorageOption($otherStorageOption)->create(['quantity' => 10]);

            $response = $this->actingAs($user)->getJson('/api/family/parts');

            $response->assertStatus(200)
                ->assertJsonCount(0, 'data');
        });

        it('should use default per_page of 25', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->getJson('/api/family/parts');

            $response->assertStatus(200)
                ->assertJsonPath('per_page', 25);
        });

        it('should cap per_page at 100', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->getJson('/api/family/parts?per_page=200');

            $response->assertStatus(200)
                ->assertJsonPath('per_page', 100);
        });

        it('should paginate results with cursor navigation', function(): void {
            $user = User::factory()->create();
            $family = $user->family;

            $storageOption = StorageOption::factory()->forFamily($family)->create();
            StorageOptionPart::factory()->count(3)->forStorageOption($storageOption)->create();

            $firstPage = $this->actingAs($user)->getJson('/api/family/parts?per_page=2');

            $firstPage->assertStatus(200)
                ->assertJsonCount(2, 'data');

            $nextCursor = $firstPage->json('next_cursor');
            expect($nextCursor)->not->toBeNull();

            $secondPage = $this->actingAs($user)->getJson('/api/family/parts?per_page=2&cursor=' . $nextCursor);

            $secondPage->assertStatus(200)
                ->assertJsonCount(1, 'data');
            expect($secondPage->json('next_cursor'))->toBeNull();
        });
    });

    describe('stats', function(): void {
        it('should return family stats', function(): void {
            $user = User::factory()->create();
            $family = $user->family;

            FamilySet::factory()->forFamily($family)->create([
                'status' => FamilySetStatus::Sealed,
                'quantity' => 1,
            ]);
            FamilySet::factory()->forFamily($family)->create([
                'status' => FamilySetStatus::Built,
                'quantity' => 2,
            ]);
            FamilySet::factory()->forFamily($family)->create([
                'status' => FamilySetStatus::Built,
                'quantity' => 3,
            ]);

            $storageOption = StorageOption::factory()->forFamily($family)->create();
            StorageOption::factory()->forFamily($family)->create();

            StorageOptionPart::factory()->forStorageOption($storageOption)->create(['quantity' => 10]);
            StorageOptionPart::factory()->forStorageOption($storageOption)->create(['quantity' => 5]);

            $response = $this->actingAs($user)->getJson('/api/family/stats');

            $response->assertStatus(200)
                ->assertJsonPath('total_sets', 3)
                ->assertJsonPath('total_set_quantity', 6)
                ->assertJsonPath('sets_by_status.sealed', 1)
                ->assertJsonPath('sets_by_status.built', 2)
                ->assertJsonPath('total_storage_locations', 2)
                ->assertJsonPath('total_unique_parts', 2)
                ->assertJsonPath('total_parts_quantity', 15);
        });

        it('should return zeros when family has no data', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->getJson('/api/family/stats');

            $response->assertStatus(200)
                ->assertJsonPath('total_sets', 0)
                ->assertJsonPath('total_set_quantity', 0)
                ->assertJsonPath('sets_by_status', [])
                ->assertJsonPath('total_storage_locations', 0)
                ->assertJsonPath('total_unique_parts', 0)
                ->assertJsonPath('total_parts_quantity', 0);
        });

        it('should not include other families data', function(): void {
            $user = User::factory()->create();
            $otherUser = User::factory()->create();

            FamilySet::factory()->forFamily($otherUser->family)->count(3)->create();
            StorageOption::factory()->forFamily($otherUser->family)->count(2)->create();

            $response = $this->actingAs($user)->getJson('/api/family/stats');

            $response->assertStatus(200)
                ->assertJsonPath('total_sets', 0)
                ->assertJsonPath('total_storage_locations', 0);
        });

        it('should return 401 when unauthenticated', function(): void {
            $response = $this->getJson('/api/family/stats');

            $response->assertStatus(401);
        });
    });

    describe('setRebrickableToken', function(): void {
        it('should set the rebrickable user token', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->putJson('/api/family/rebrickable-token', [
                'rebrickable_user_token' => 'my-secret-token',
            ]);

            $response->assertStatus(204);

            $user->family->refresh();
            expect($user->family->rebrickable_user_token)->toBe('my-secret-token');
        });

        it('should update existing rebrickable token', function(): void {
            $user = User::factory()->create();
            $user->family->rebrickable_user_token = 'old-token';
            $user->family->save();

            $response = $this->actingAs($user)->putJson('/api/family/rebrickable-token', [
                'rebrickable_user_token' => 'new-token',
            ]);

            $response->assertStatus(204);

            $user->family->refresh();
            expect($user->family->rebrickable_user_token)->toBe('new-token');
        });

        it('should return 401 when unauthenticated', function(): void {
            $response = $this->putJson('/api/family/rebrickable-token', [
                'rebrickable_user_token' => 'my-token',
            ]);

            $response->assertStatus(401);
        });

        it('should require rebrickable_user_token', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->putJson('/api/family/rebrickable-token', []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['rebrickable_user_token']);
        });

        it('should validate rebrickable_user_token is a string', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->putJson('/api/family/rebrickable-token', [
                'rebrickable_user_token' => 12_345,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['rebrickable_user_token']);
        });

        it('should validate rebrickable_user_token max length', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->putJson('/api/family/rebrickable-token', [
                'rebrickable_user_token' => str_repeat('a', 256),
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['rebrickable_user_token']);
        });

        it('should return 403 when non-head user tries to set token', function(): void {
            // Create first user who becomes the family head
            $headUser = User::factory()->create();

            // Create second user in the same family (not the head)
            $nonHeadUser = User::factory()->forFamily($headUser->family)->create();

            $response = $this->actingAs($nonHeadUser)->putJson('/api/family/rebrickable-token', [
                'rebrickable_user_token' => 'my-token',
            ]);

            $response->assertStatus(403)
                ->assertJson(['message' => 'This action is unauthorized.']);
        });

        it('should allow family head to set token when other users exist', function(): void {
            // Create first user who becomes the family head
            $headUser = User::factory()->create();

            // Create second user in the same family (not the head)
            User::factory()->forFamily($headUser->family)->create();

            $response = $this->actingAs($headUser)->putJson('/api/family/rebrickable-token', [
                'rebrickable_user_token' => 'head-token',
            ]);

            $response->assertStatus(204);

            $headUser->family->refresh();
            expect($headUser->family->rebrickable_user_token)->toBe('head-token');
        });
    });
});
