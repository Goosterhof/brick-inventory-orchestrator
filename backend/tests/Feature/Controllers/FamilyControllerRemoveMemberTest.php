<?php

declare(strict_types = 1);

use App\Http\Controllers\FamilyController;
use App\Models\Family;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

covers(FamilyController::class);

uses(RefreshDatabase::class);

describe('FamilyController removeMember', function(): void {
    it('should remove a member from the family and create a new family for them', function(): void {
        $headUser = User::factory()->create();
        $member = User::factory()->forFamily($headUser->family)->create();

        $response = $this->actingAs($headUser)->deleteJson('/api/family/members/' . $member->id);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Member removed from family');

        $member->refresh();
        expect($member->family_id)->not->toBe($headUser->family_id);

        $newFamily = Family::query()->find($member->family_id);
        expect($newFamily)->not->toBeNull()
            ->and($newFamily->head_id)->toBe($member->id)
            ->and($newFamily->name)->toBe($member->name . "'s Family");
    });

    it('should preserve original family data after member removal', function(): void {
        $headUser = User::factory()->create();
        $member = User::factory()->forFamily($headUser->family)->create();
        $originalFamilyId = $headUser->family_id;

        $this->actingAs($headUser)->deleteJson('/api/family/members/' . $member->id);

        $headUser->refresh();
        expect($headUser->family_id)->toBe($originalFamilyId);

        $originalFamily = Family::query()->find($originalFamilyId);
        expect($originalFamily)->not->toBeNull()
            ->and($originalFamily->head_id)->toBe($headUser->id);
    });

    it('should return 422 when family head tries to remove themselves', function(): void {
        $headUser = User::factory()->create();

        $response = $this->actingAs($headUser)->deleteJson('/api/family/members/' . $headUser->id);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'Cannot remove yourself from the family');
    });

    it('should return 403 when non-head member tries to remove someone', function(): void {
        $headUser = User::factory()->create();
        $nonHeadUser = User::factory()->forFamily($headUser->family)->create();
        $anotherMember = User::factory()->forFamily($headUser->family)->create();

        $response = $this->actingAs($nonHeadUser)->deleteJson('/api/family/members/' . $anotherMember->id);

        $response->assertStatus(403);
    });

    it('should return 404 when trying to remove a user not in the family', function(): void {
        $headUser = User::factory()->create();
        $otherFamilyUser = User::factory()->create(); // different family

        $response = $this->actingAs($headUser)->deleteJson('/api/family/members/' . $otherFamilyUser->id);

        $response->assertStatus(404)
            ->assertJsonPath('error', 'User is not a member of this family');
    });

    it('should return 401 when unauthenticated', function(): void {
        $user = User::factory()->create();

        $response = $this->deleteJson('/api/family/members/' . $user->id);

        $response->assertStatus(401);
    });

    it('should handle removal atomically — new family and user update together', function(): void {
        $headUser = User::factory()->create();
        $member = User::factory()->forFamily($headUser->family)->create();

        $familyCountBefore = Family::query()->count();

        $this->actingAs($headUser)->deleteJson('/api/family/members/' . $member->id);

        expect(Family::query()->count())->toBe($familyCountBefore + 1);

        $member->refresh();
        $newFamily = Family::query()->find($member->family_id);
        expect($newFamily->head_id)->toBe($member->id);
    });
});
