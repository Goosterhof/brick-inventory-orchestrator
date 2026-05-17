<?php

declare(strict_types = 1);

use App\Enums\FamilySetStatus;
use App\Http\Controllers\FamilySetController;
use App\Models\Color;
use App\Models\FamilySet;
use App\Models\Part;
use App\Models\Set;
use App\Models\SetPart;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

covers(FamilySetController::class);

describe('FamilySetController completion', function(): void {
    it('should return 401 when unauthenticated', function(): void {
        $response = $this->getJson('/api/family-sets/completion');

        $response->assertStatus(401);
    });

    it('should return empty array when family has no sets', function(): void {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/family-sets/completion');

        $response->assertStatus(200)
            ->assertJson([]);
    });

    it('should exclude wishlist sets from completion', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        FamilySet::factory()->forFamily($family)->create([
            'status' => FamilySetStatus::Wishlist,
        ]);

        $response = $this->actingAs($user)->getJson('/api/family-sets/completion');

        $response->assertStatus(200)
            ->assertJsonCount(0);
    });

    it('should return null completion for sets with no parts loaded', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '42100-1']);
        $familySet = FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
        ]);

        $response = $this->actingAs($user)->getJson('/api/family-sets/completion');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.family_set_id', $familySet->id)
            ->assertJsonPath('0.set_num', '42100-1')
            ->assertJsonPath('0.total_parts', null)
            ->assertJsonPath('0.stored_parts', null)
            ->assertJsonPath('0.percentage', null);
    });

    it('should compute partial completion correctly', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '75192-1']);
        $familySet = FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::InProgress,
        ]);

        $color1 = Color::factory()->create();
        $color2 = Color::factory()->create();
        $part1 = Part::factory()->create();
        $part2 = Part::factory()->create();

        // Set has 2 required part+color combinations
        $setPart1 = new SetPart;
        $setPart1->set_id = $set->id;
        $setPart1->part_id = $part1->id;
        $setPart1->color_id = $color1->id;
        $setPart1->quantity = 5;
        $setPart1->is_spare = false;
        $setPart1->save();

        $setPart2 = new SetPart;
        $setPart2->set_id = $set->id;
        $setPart2->part_id = $part2->id;
        $setPart2->color_id = $color2->id;
        $setPart2->quantity = 3;
        $setPart2->is_spare = false;
        $setPart2->save();

        // Family has 1 of the 2 part+color combos stored
        $storageOption = StorageOption::factory()->forFamily($family)->create();
        StorageOptionPart::factory()->forStorageOption($storageOption)
            ->forPart($part1)->withColor($color1)->create(['quantity' => 2]);

        $response = $this->actingAs($user)->getJson('/api/family-sets/completion');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.family_set_id', $familySet->id)
            ->assertJsonPath('0.set_num', '75192-1')
            ->assertJsonPath('0.total_parts', 2)
            ->assertJsonPath('0.stored_parts', 1)
            ->assertJsonPath('0.percentage', 50);
    });

    it('should compute 100% for a fully complete set', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '10294-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create();

        $setPart = new SetPart;
        $setPart->set_id = $set->id;
        $setPart->part_id = $part->id;
        $setPart->color_id = $color->id;
        $setPart->quantity = 10;
        $setPart->is_spare = false;
        $setPart->save();

        $storageOption = StorageOption::factory()->forFamily($family)->create();
        StorageOptionPart::factory()->forStorageOption($storageOption)
            ->forPart($part)->withColor($color)->create(['quantity' => 10]);

        $response = $this->actingAs($user)->getJson('/api/family-sets/completion');

        $response->assertStatus(200)
            ->assertJsonPath('0.total_parts', 1)
            ->assertJsonPath('0.stored_parts', 1)
            ->assertJsonPath('0.percentage', 100);
    });

    it('should not include other family sets in response', function(): void {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        // Other family's set
        FamilySet::factory()->forFamily($otherUser->family)->create([
            'status' => FamilySetStatus::Built,
        ]);

        $response = $this->actingAs($user)->getJson('/api/family-sets/completion');

        $response->assertStatus(200)
            ->assertJsonCount(0);
    });

    it('should exclude spare parts from total count', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '21318-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Sealed,
        ]);

        $color = Color::factory()->create();
        $part1 = Part::factory()->create();
        $part2 = Part::factory()->create();

        // Regular part
        $setPart1 = new SetPart;
        $setPart1->set_id = $set->id;
        $setPart1->part_id = $part1->id;
        $setPart1->color_id = $color->id;
        $setPart1->quantity = 5;
        $setPart1->is_spare = false;
        $setPart1->save();

        // Spare part (should not count)
        $setPart2 = new SetPart;
        $setPart2->set_id = $set->id;
        $setPart2->part_id = $part2->id;
        $setPart2->color_id = $color->id;
        $setPart2->quantity = 1;
        $setPart2->is_spare = true;
        $setPart2->save();

        $response = $this->actingAs($user)->getJson('/api/family-sets/completion');

        $response->assertStatus(200)
            ->assertJsonPath('0.total_parts', 1);
    });

    it('should handle multiple sets with mixed completion', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set1 = Set::factory()->create(['set_num' => '75192-1']);
        $set2 = Set::factory()->create(['set_num' => '10281-1']);

        FamilySet::factory()->forFamily($family)->forSet($set1)->create([
            'status' => FamilySetStatus::InProgress,
        ]);
        FamilySet::factory()->forFamily($family)->forSet($set2)->create([
            'status' => FamilySetStatus::Built,
        ]);

        $color = Color::factory()->create();
        $part1 = Part::factory()->create();
        $part2 = Part::factory()->create();

        // Set 1 has 2 parts, set 2 has no parts loaded
        $sp1 = new SetPart;
        $sp1->set_id = $set1->id;
        $sp1->part_id = $part1->id;
        $sp1->color_id = $color->id;
        $sp1->quantity = 5;
        $sp1->is_spare = false;
        $sp1->save();

        $sp2 = new SetPart;
        $sp2->set_id = $set1->id;
        $sp2->part_id = $part2->id;
        $sp2->color_id = $color->id;
        $sp2->quantity = 3;
        $sp2->is_spare = false;
        $sp2->save();

        $response = $this->actingAs($user)->getJson('/api/family-sets/completion');

        $response->assertStatus(200)
            ->assertJsonCount(2);
    });
});
